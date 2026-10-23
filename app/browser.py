"""The agent's browser: one isolated Chrome session per task.

Each task gets its own browser context (separate cookies, storage, tabs and downloads), saved to the task folder
so logins survive restarts. While a task runs, the active tab is streamed as live JPEG frames over CDP.
"""

import asyncio
import json
import time
from pathlib import Path

from . import vault
from .tools import ToolError, resolve, truncate

VIEWPORT = {"width": 1280, "height": 800}
MAX_ELEMENTS = 80

# Marks every visible interactive element with data-atlas-idx and draws numbered boxes (set-of-marks).
SNAPSHOT_JS = """
(draw) => {
  document.querySelectorAll('[data-atlas-idx]').forEach(e => e.removeAttribute('data-atlas-idx'));
  const old = document.getElementById('__atlas_overlay'); if (old) old.remove();
  const sel = 'a[href],button,input:not([type=hidden]),textarea,select,summary,[role=button],[role=link],[role=tab],' +
    '[role=menuitem],[role=checkbox],[role=radio],[role=switch],[role=combobox],[role=option],[contenteditable=""],' +
    '[contenteditable=true],[onclick],[tabindex]:not([tabindex="-1"])';
  const vw = innerWidth, vh = innerHeight, out = [];
  const overlay = document.createElement('div');
  overlay.id = '__atlas_overlay';
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  for (const el of document.querySelectorAll(sel)) {
    if (out.length >= %d) break;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    const top = document.elementFromPoint(cx, cy);
    if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
    const i = out.length;
    el.setAttribute('data-atlas-idx', i);
    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type') || '';
    const lab = el.labels && el.labels[0] ? el.labels[0].innerText : '';
    let label = (el.getAttribute('aria-label') || lab || el.innerText || el.value || el.placeholder || el.title || el.alt || '').trim().replace(/\\s+/g, ' ');
    if (type === 'password') label = el.getAttribute('aria-label') || el.placeholder || '';
    const item = {i, tag, type, text: label.slice(0, 70)};
    if (tag === 'a') item.href = (el.getAttribute('href') || '').slice(0, 80);
    if (tag === 'input' || tag === 'textarea') {
      item.placeholder = (el.placeholder || '').slice(0, 40);
      if (type !== 'password' && el.value) item.value = el.value.slice(0, 40);
      if (type === 'checkbox' || type === 'radio') item.checked = el.checked;
    }
    if (tag === 'select') item.options = [...el.options].slice(0, 12).map(o => o.label || o.value);
    out.push(item);
    if (draw) {
      const b = document.createElement('div');
      b.style.cssText = `position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
        'border:2px solid #e11d48;border-radius:3px;box-sizing:border-box';
      const n = document.createElement('div');
      n.textContent = i;
      n.style.cssText = 'position:absolute;left:-2px;top:-16px;background:#e11d48;color:#fff;font:700 11px/14px monospace;' +
        'padding:0 4px;border-radius:3px 3px 3px 0';
      if (r.top < 18) n.style.top = '0';
      b.appendChild(n); overlay.appendChild(b);
    }
  }
  if (draw) document.documentElement.appendChild(overlay);
  return out;
}
""" % MAX_ELEMENTS

CLEAR_OVERLAY_JS = "() => { const o = document.getElementById('__atlas_overlay'); if (o) o.remove(); }"


def describe(el: dict) -> str:
    kind = el["tag"] + (f"[{el['type']}]" if el.get("type") else "")
    parts = [f"[{el['i']}] {kind}"]
    if el.get("text"):
        parts.append(f"'{el['text']}'")
    if el.get("placeholder"):
        parts.append(f"placeholder='{el['placeholder']}'")
    if el.get("value"):
        parts.append(f"value='{el['value']}'")
    if "checked" in el:
        parts.append("checked" if el["checked"] else "unchecked")
    if el.get("href"):
        parts.append(f"-> {el['href']}")
    if el.get("options"):
        parts.append("options: " + " | ".join(el["options"]))
    return " ".join(parts)


class Browser:
    _playwright = None
    _browser = None
    _lock = asyncio.Lock()

    def __init__(self, task_dir: Path, workspace: Path, on_frame=None):
        self.state_file = task_dir / "browser_state.json"
        self.workspace = workspace
        self.downloads = workspace / "downloads"
        self.on_frame = on_frame
        self.context = None
        self.page = None
        self._cdp = None
        self._last_frame = 0.0
        self._downloaded: list[str] = []

    # --- lifecycle ---------------------------------------------------------

    @classmethod
    async def _launch(cls):
        async with cls._lock:
            if cls._browser is None:
                from playwright.async_api import async_playwright

                cls._playwright = await async_playwright().start()
                try:
                    cls._browser = await cls._playwright.chromium.launch(channel="chrome", headless=True)
                except Exception:
                    cls._browser = await cls._playwright.chromium.launch(headless=True)
        return cls._browser

    async def _ensure(self):
        if self.context is None:
            browser = await self._launch()
            kwargs = {"viewport": VIEWPORT, "accept_downloads": True}
            if self.state_file.exists():
                kwargs["storage_state"] = str(self.state_file)
            self.context = await browser.new_context(**kwargs)
            self.context.on("page", self._on_new_page)
        if self.page is None or self.page.is_closed():
            pages = [p for p in self.context.pages if not p.is_closed()]
            self.page = pages[-1] if pages else await self.context.new_page()
            await self._start_stream()
        elif self._cdp is None:
            await self._start_stream()
        return self.page

    def _on_new_page(self, page):
        page.on("download", lambda d: asyncio.ensure_future(self._save_download(d)))
        # A click that opens a popup / new tab: follow it.
        self.page = page
        asyncio.ensure_future(self._start_stream())

    async def _save_download(self, download):
        self.downloads.mkdir(parents=True, exist_ok=True)
        target = self.downloads / download.suggested_filename
        n = 1
        while target.exists():
            target = self.downloads / f"{target.stem.split(' (')[0]} ({n}){target.suffix}"
            n += 1
        await download.save_as(target)
        self._downloaded.append(f"downloads/{target.name}")

    async def pause(self):
        """Called when a task run ends: stop streaming and persist cookies."""
        await self._stop_stream()
        if self.context is not None:
            try:
                await self.context.storage_state(path=str(self.state_file))
            except Exception:
                pass

    async def close(self):
        await self.pause()
        if self.context is not None:
            try:
                await self.context.close()
            except Exception:
                pass
        self.context = self.page = None

    # --- live view ---------------------------------------------------------

    async def _stop_stream(self):
        cdp, self._cdp = self._cdp, None
        if cdp is not None:
            try:
                await cdp.send("Page.stopScreencast")
                await cdp.detach()
            except Exception:
                pass

    async def _start_stream(self):
        await self._stop_stream()
        if not self.on_frame or self.page is None or self.page.is_closed():
            return
        try:
            cdp = await self.context.new_cdp_session(self.page)

            async def frame(params):
                try:
                    await cdp.send("Page.screencastFrameAck", {"sessionId": params["sessionId"]})
                except Exception:
                    return
                now = time.monotonic()
                if now - self._last_frame >= 0.12:
                    self._last_frame = now
                    self.on_frame(params["data"])

            cdp.on("Page.screencastFrame", lambda p: asyncio.ensure_future(frame(p)))
            await cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 55, "maxWidth": 1280,
                                                    "maxHeight": 800, "everyNthFrame": 1})
            self._cdp = cdp
        except Exception:
            self._cdp = None

    # --- user take-over ----------------------------------------------------

    async def open_view(self):
        """Make sure the browser is up and streaming, and push the current frame right away."""
        page = await self._ensure()
        if self.on_frame:
            import base64
            shot = await page.screenshot(type="jpeg", quality=55)
            self.on_frame(base64.b64encode(shot).decode())

    async def user_input(self, ev: dict):
        """Mouse and keyboard from the person watching, forwarded as-is. Never logged or shown to the model."""
        page = await self._ensure()
        kind = ev.get("type")
        if kind == "click":
            x = max(0, min(int(ev["x"]), VIEWPORT["width"]))
            y = max(0, min(int(ev["y"]), VIEWPORT["height"]))
            await page.mouse.click(x, y)
        elif kind == "key":
            await page.keyboard.press(str(ev["key"])[:40])
        elif kind == "text":
            await page.keyboard.insert_text(str(ev["text"])[:2000])
        elif kind == "scroll":
            await page.mouse.wheel(0, max(-2000, min(int(ev["dy"]), 2000)))
        else:
            raise ToolError("Unknown input type.")

    # --- sign-in -----------------------------------------------------------

    async def _login(self, page, cred: dict):
        """Fill a sign-in form from the vault. Handles one-page and two-step (username, then password) forms.
        The values are typed here and never returned to the caller."""
        password = page.locator("input[type=password]:visible").first
        username = page.locator(
            "input[type=email]:visible, input[autocomplete=username]:visible, input[name*=user i]:visible, "
            "input[name*=email i]:visible, input[name*=login i]:visible, input[type=text]:visible, "
            "input:not([type]):visible"
        ).first
        if await password.count() == 0:
            if await username.count() == 0:
                raise ToolError("No sign-in fields on this page. Navigate to the sign-in page first.")
            await username.fill(cred["username"], timeout=5000)
            await page.keyboard.press("Enter")
            try:
                await password.wait_for(state="visible", timeout=10_000)
            except Exception:
                raise ToolError("Entered the username but no password field appeared. Take a snapshot: the site may "
                                "be asking for verification, or rejected the username.") from None
        elif await username.count():
            await username.fill(cred["username"], timeout=5000)
        await password.fill(cred["password"], timeout=5000)
        await page.keyboard.press("Enter")

    # --- actions -----------------------------------------------------------

    async def _target(self, page, args: dict):
        if args.get("index") is None:
            raise ToolError("This action needs an 'index' from the latest snapshot.")
        loc = page.locator(f'[data-atlas-idx="{args["index"]}"]').first
        if await loc.count() == 0:
            raise ToolError(f"Element [{args['index']}] is not on the page. Take a new snapshot and use its numbers.")
        return loc

    async def _settle(self, page):
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=4000)
            await page.wait_for_load_state("networkidle", timeout=2500)
        except Exception:
            pass

    async def _evaluate(self, page, script, arg=None):
        """page.evaluate that survives a navigation landing mid-call (redirects, late reloads)."""
        for attempt in range(3):
            try:
                return await page.evaluate(script, arg) if arg is not None else await page.evaluate(script)
            except Exception as e:
                if attempt == 2 or not any(m in str(e) for m in ("context was destroyed", "navigation", "Target closed")):
                    raise
                await self._settle(page)

    async def _tabs(self) -> list[dict]:
        tabs = []
        for i, p in enumerate(p for p in self.context.pages if not p.is_closed()):
            try:
                title = await p.title()
            except Exception:
                title = ""
            tabs.append({"i": i, "title": title[:60], "url": p.url, "active": p == self.page})
        return tabs

    async def run(self, args: dict) -> tuple[str, bytes | None, dict]:
        page = await self._ensure()
        action = args["action"]
        notes: list[str] = []
        want_shot = True
        snapshot_text = ""
        before_downloads = len(self._downloaded)
        known_pages = {id(p) for p in self.context.pages}

        try:
            if action == "navigate" or action == "new_tab":
                url = args.get("url") or ""
                if not url:
                    raise ToolError(f"{action} requires 'url'.")
                if "://" not in url:
                    url = "https://" + url
                if action == "new_tab":
                    page = await self.context.new_page()
                    self.page = page
                await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            elif action == "snapshot":
                elements = await self._evaluate(page, SNAPSHOT_JS, True)
                snapshot_text = "\n".join(describe(e) for e in elements) or "(no interactive elements in view)"
                snapshot_text = f"Interactive elements in view ({len(elements)}):\n{snapshot_text}"
            elif action == "click":
                if args.get("index") is not None:
                    await (await self._target(page, args)).click(timeout=6000)
                elif "x" in args and "y" in args:
                    await page.mouse.click(args["x"], args["y"])
                else:
                    raise ToolError("click needs 'index' (preferred) or 'x' and 'y'.")
            elif action == "hover":
                if args.get("index") is not None:
                    await (await self._target(page, args)).hover(timeout=6000)
                elif "x" in args and "y" in args:
                    await page.mouse.move(args["x"], args["y"])
                else:
                    raise ToolError("hover needs 'index' or 'x' and 'y'.")
            elif action == "type":
                text = args.get("text", "")
                if args.get("index") is not None:
                    target = await self._target(page, args)
                    await target.click(timeout=6000)
                    try:
                        await target.fill(text, timeout=4000)
                    except Exception:  # contenteditable / custom widgets
                        await page.keyboard.press("Control+a")
                        await page.keyboard.type(text, delay=8)
                else:
                    await page.keyboard.type(text, delay=8)
                if args.get("submit"):
                    await page.keyboard.press("Enter")
            elif action == "press":
                await page.keyboard.press(args.get("key") or "Enter")
            elif action == "scroll":
                amount = args.get("amount") or 600
                await page.mouse.wheel(0, -amount if args.get("direction") == "up" else amount)
                await page.wait_for_timeout(250)
            elif action == "select":
                if args.get("value") is None:
                    raise ToolError("select requires 'value'.")
                target = await self._target(page, args)
                try:
                    await target.select_option(value=args["value"], timeout=4000)
                except Exception:
                    await target.select_option(label=args["value"], timeout=4000)
            elif action == "back":
                await page.go_back(wait_until="domcontentloaded")
            elif action == "forward":
                await page.go_forward(wait_until="domcontentloaded")
            elif action == "reload":
                await page.reload(wait_until="domcontentloaded")
            elif action == "wait":
                await page.wait_for_timeout(max(1, min(args.get("seconds") or 2, 30)) * 1000)
            elif action == "find":
                text = args.get("text") or ""
                if not text:
                    raise ToolError("find requires 'text'.")
                loc = page.get_by_text(text, exact=False)
                count = await loc.count()
                if count:
                    await loc.first.scroll_into_view_if_needed(timeout=3000)
                notes.append(f"Found {count} match(es) for '{text}'." + (" Scrolled to the first." if count else ""))
            elif action == "read":
                want_shot = False
                text = await self._evaluate(page, "() => document.body ? document.body.innerText : ''")
                notes.append("Page text:\n" + truncate(text, 15_000))
            elif action == "eval":
                want_shot = False
                script = args.get("script") or ""
                if not script:
                    raise ToolError("eval requires 'script'.")
                body = script.strip()
                fn = body if body.startswith(("()", "async", "function")) else (
                    f"() => ({body})" if "\n" not in body and ";" not in body.rstrip(";") and "return" not in body
                    else f"() => {{ {body} }}")
                result = await self._evaluate(page, fn)
                notes.append("Result: " + truncate(json.dumps(result, default=str, indent=1), 10_000))
            elif action == "upload":
                path = resolve(self.workspace, args.get("path") or "")
                if not path.is_file():
                    raise ToolError(f"File '{args.get('path')}' does not exist in the workspace.")
                await (await self._target(page, args)).set_input_files(str(path), timeout=6000)
                notes.append(f"Attached {path.name}.")
            elif action == "login":
                label = args.get("credential") or ""
                if not label:
                    raise ToolError("login needs 'credential', the name of a saved login. Saved logins: "
                                    + (", ".join(vault.labels()) or "none yet - use ask_user with kind='credentials' to get one."))
                await self._login(page, vault.get(label))
                notes.append(f"Submitted the saved login '{label}'. Take a snapshot to see whether it worked or needs "
                             "verification (2-step codes, CAPTCHAs: use ask_user kind='handoff').")
            elif action == "switch_tab":
                pages = [p for p in self.context.pages if not p.is_closed()]
                i = args.get("tab")
                if i is None or not 0 <= i < len(pages):
                    raise ToolError(f"switch_tab needs 'tab' between 0 and {len(pages) - 1}.")
                self.page = page = pages[i]
                await page.bring_to_front()
                await self._start_stream()
            elif action == "close_tab":
                pages = [p for p in self.context.pages if not p.is_closed()]
                i = args.get("tab")
                target = pages[i] if i is not None and 0 <= i < len(pages) else page
                await target.close()
                remaining = [p for p in self.context.pages if not p.is_closed()]
                if not remaining:
                    self.page = await self.context.new_page()
                else:
                    self.page = remaining[-1]
                page = self.page
                await self._start_stream()
            # "screenshot" falls through to the capture below
        except ToolError:
            raise
        except Exception as e:
            first = str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__
            hint = " Take a new snapshot; the page may have changed." if "atlas-idx" in str(e) else ""
            raise ToolError(f"{action} failed: {first}{hint}") from None

        if action in ("click", "type", "press", "select", "back", "forward", "reload", "navigate", "new_tab", "login"):
            await self._settle(self.page)
        page = self.page
        if id(page) not in known_pages and action not in ("navigate", "new_tab", "switch_tab"):
            notes.append("A new tab opened and is now active.")
        for name in self._downloaded[before_downloads:]:
            notes.append(f"Downloaded file: {name}")

        shot = None
        if want_shot:
            shot = await page.screenshot(type="jpeg", quality=60)
            if action == "snapshot":
                try:
                    await page.evaluate(CLEAR_OVERLAY_JS)
                except Exception:
                    pass
        tabs = await self._tabs()
        try:
            title = await page.title()
        except Exception:
            title = ""
        meta = {"url": page.url, "title": title, "tabs": tabs}
        lines = [f"URL: {page.url}", f"Title: {title}"]
        if len(tabs) > 1:
            lines.append("Tabs: " + " | ".join(f"{'*' if t['active'] else ''}[{t['i']}] {t['title'] or t['url']}" for t in tabs))
        summary = "\n".join(lines + notes + ([snapshot_text] if snapshot_text else []))
        return summary, shot, meta
