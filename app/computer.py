"""The agent's computer: where its shell commands, files and browser actually run.

LocalComputer: this machine, as before (the task folder under data/ and a local Chrome).
CloudComputer: one E2B sandbox per task, a small Linux VM in the cloud with its own Chrome. The sandbox pauses
between runs and resumes on the next message. Files the agent makes are copied out to Supabase Storage after each
step so they can be viewed and downloaded without waking it, and copied back in if a sandbox has to be recreated.
"""

import asyncio
import base64
import os
import time
import secrets
import shlex
import sys
from pathlib import Path

from . import store
from . import tools as T

MEDIA_LOCAL = f"{shlex.quote(sys.executable)} {shlex.quote(str(Path(__file__).resolve().parent / 'media.py'))}"


class LocalComputer:
    cloud = False
    media_cmd = MEDIA_LOCAL

    def __init__(self, task):
        from .browser import Browser

        self.task = task
        self.browser = Browser(task.dir, task.workspace, task._frame)

    @property
    def workspace(self) -> str:
        return str(self.task.workspace.resolve())

    async def start(self, attachments: list[str]):
        self.task.workspace.mkdir(parents=True, exist_ok=True)

    async def shell(self, command: str, timeout: int | None, on_output) -> str:
        return await T.run_shell(self.task.workspace, command, timeout, on_output)

    async def file_tool(self, name: str, args: dict) -> tuple[str, str | None]:
        ws = self.task.workspace
        if name == "write_file":
            return T.write_file(ws, args["path"], args["content"]), None
        if name == "read_file":
            return T.read_file(ws, args["path"], args.get("start_line"), args.get("end_line")), None
        out = T.edit_file(ws, args["path"], args["old_str"], args["new_str"])
        try:
            return out, T.resolve(ws, args["path"]).read_text()[:50_000]
        except OSError:
            return out, None

    async def browser_run(self, args: dict):
        return await self.browser.run(args)

    async def open_view(self):
        await self.browser.open_view()

    async def user_input(self, ev: dict):
        await self.browser.user_input(ev)

    async def save_browser(self):
        await self.browser.pause()

    async def sync(self):
        pass

    async def pause(self):
        await self.browser.pause()

    async def close(self):
        await self.browser.close()


# ---------------------------------------------------------------------------
# Cloud
# ---------------------------------------------------------------------------

TEMPLATE = os.environ.get("E2B_TEMPLATE", "atlas-sandbox")
MAX_SANDBOXES = int(os.environ.get("ATLAS_MAX_SANDBOXES") or 5)
SANDBOX_TIMEOUT = 30 * 60   # a running sandbox pauses itself after this long without activity
MAX_SYNC_BYTES = 20_000_000  # bigger files stay in the sandbox only
HOME = "/home/user"
WS = f"{HOME}/workspace"
STATE = f"{HOME}/.atlas/browser_state.json"
# Template build-time environment doesn't reach processes started later, so pass it to each command.
ENV = {"PLAYWRIGHT_BROWSERS_PATH": "/opt/ms-playwright", "PYTHONUNBUFFERED": "1"}
_active: set[str] = set()  # tasks whose sandbox is currently running


class Busy(Exception):
    pass


class CloudComputer:
    cloud = True
    media_cmd = "python3 /opt/atlas/app/media.py"
    workspace = WS

    def __init__(self, task):
        self.task = task
        self.sbx = None
        self.http = None
        self.frames: asyncio.Task | None = None
        self._lock = asyncio.Lock()
        self._touched = 0.0

    # --- lifecycle ---------------------------------------------------------

    async def _ensure(self):
        async with self._lock:
            if self.sbx is not None:
                return self.sbx
            from e2b import AsyncSandbox

            if self.task.id not in _active and len(_active) >= MAX_SANDBOXES:
                raise Busy("All of Atlas's cloud computers are busy right now. Please try again in a few minutes.")
            _active.add(self.task.id)
            try:
                sbx, fresh = None, False
                if self.task.sandbox_id:
                    try:
                        sbx = await AsyncSandbox.connect(self.task.sandbox_id, timeout=SANDBOX_TIMEOUT)
                    except Exception:
                        sbx = None
                if sbx is None:
                    sbx = await AsyncSandbox.create(
                        TEMPLATE, timeout=SANDBOX_TIMEOUT,
                        metadata={"atlas_task": self.task.id, "atlas_user": self.task.user_id or ""},
                        lifecycle={"on_timeout": "pause", "auto_resume": True},
                        network={"allow_public_traffic": False})
                    fresh = True
                    self.task.sandbox_id = sbx.sandbox_id
                    self.task.save()
                self.sbx = sbx
                if fresh:
                    await self._restore()
                await self._start_helper(restart=fresh)
            except BaseException:
                _active.discard(self.task.id)
                self.sbx = None
                raise
            return self.sbx

    async def _start_helper(self, restart: bool):
        import httpx

        key = self.task.helper_key
        url = self._helper_url()
        if not restart and key:
            self.http = httpx.AsyncClient(base_url=url, timeout=120, headers=self._headers(key))
            try:
                if (await self.http.post("/pause")).status_code == 200:  # the paused helper is still there
                    self._start_frames()
                    return
            except httpx.HTTPError:
                pass
            await self.http.aclose()
        key = secrets.token_urlsafe(24)
        self.task.helper_key = key
        # "[a]pp" so pkill doesn't match (and kill) the shell running this very command
        await self.sbx.commands.run("pkill -f '[a]pp.sandbox_helper' || true", timeout=15)
        await self.sbx.commands.run("python3 -m app.sandbox_helper", background=True, cwd="/opt/atlas",
                                    envs={**ENV, "ATLAS_HELPER_KEY": key, "ATLAS_WORKSPACE": WS, "ATLAS_STATE": f"{HOME}/.atlas",
                                          "ATLAS_DATA": f"{HOME}/.atlas"}, timeout=0)
        self.http = httpx.AsyncClient(base_url=url, timeout=120, headers=self._headers(key))
        for _ in range(60):
            try:
                if (await self.http.get("/health")).status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            await asyncio.sleep(0.5)
        else:
            raise RuntimeError("The cloud computer did not start. Please try again.")
        self._start_frames()

    def _helper_url(self) -> str:
        return f"https://{self.sbx.get_host(8000)}"

    def _headers(self, key: str) -> dict:
        return {"x-atlas-key": key, "e2b-traffic-access-token": self.sbx.traffic_access_token or ""}

    def _start_frames(self):
        if self.frames and not self.frames.done():
            return

        async def pump():
            while self.http is not None:
                try:
                    async with self.http.stream("GET", "/frames", timeout=None) as r:
                        async for line in r.aiter_lines():
                            if line.startswith("data: "):
                                self.task._frame(line[6:])
                except asyncio.CancelledError:
                    raise
                except Exception:
                    await asyncio.sleep(2)

        self.frames = asyncio.create_task(pump())

    async def _touch(self):
        """Push back the sandbox's idle timeout (at most once a minute)."""
        if time.monotonic() - self._touched > 60:
            self._touched = time.monotonic()
            await self.sbx.set_timeout(SANDBOX_TIMEOUT)

    async def _post(self, path: str, payload: dict | None = None) -> dict:
        await self._ensure()
        await self._touch()
        r = await self.http.post(path, json=payload or {})
        r.raise_for_status()
        data = r.json()
        if data.get("error"):
            raise T.ToolError(data["error"])
        return data

    async def _restore(self):
        """A new sandbox for an existing task: copy its files and browser cookies back in."""
        uid = self.task.user_id
        await self.sbx.files.make_dir(WS)
        for path, info in list(self.task.files.items()):
            if info.get("remote_only"):
                continue
            local = await asyncio.to_thread(store.blob_path, f"tasks/{self.task.id}/workspace/{path}", uid)
            if local:
                await self.sbx.files.write(f"{WS}/{path}", local.read_bytes())
        sealed = await asyncio.to_thread(store.blob_path, f"tasks/{self.task.id}/browser_state.enc", uid)
        if sealed:
            from . import vault

            try:
                await self.sbx.files.write(STATE, vault.unseal(sealed.read_text()))
            except Exception:
                pass

    async def start(self, attachments: list[str]):
        """Before a run: make sure the sandbox is up and holds the files just uploaded with the message."""
        await self._ensure()
        for rel in attachments:
            local = self.task.workspace / rel
            if local.is_file():
                await self.sbx.files.write(f"{WS}/{rel}", local.read_bytes())
        await self.sync()

    # --- tools -------------------------------------------------------------

    async def shell(self, command: str, timeout: int | None, on_output) -> str:
        from e2b import CommandExitException

        sbx = await self._ensure()
        timeout = max(1, min(timeout or 120, 600))
        await self._touch()
        chunks: list[str] = []

        async def out(text: str):
            chunks.append(text)
            await on_output(text)

        handle = await sbx.commands.run(command, background=True, cwd=WS, envs=ENV, on_stdout=out, on_stderr=out,
                                        timeout=timeout + 30)
        try:
            code = (await asyncio.wait_for(handle.wait(), timeout)).exit_code
        except CommandExitException as e:
            code = e.exit_code
        except asyncio.TimeoutError:
            await handle.kill()
            chunks.append(f"\n[command timed out after {timeout}s]")
            code = -1
        except asyncio.CancelledError:
            await handle.kill()
            raise
        output = T.truncate("".join(chunks)) or "(no output)"
        return f"{output}\n[exit code {code}]"

    async def file_tool(self, name: str, args: dict) -> tuple[str, str | None]:
        data = await self._post("/tool", {"name": name, "args": args})
        return data["out"], data.get("content")

    async def browser_run(self, args: dict):
        payload = {"args": args}
        if args.get("action") == "login":
            from . import vault  # the sandbox gets just this one login, only for this call

            label = args.get("credential") or ""
            if not label:
                raise T.ToolError("login needs 'credential', the name of a saved login. Saved logins: "
                                  + (", ".join(vault.labels()) or "none yet - use ask_user with kind='credentials' to get one."))
            payload |= {"label": label, "cred": vault.get(label)}
        data = await self._post("/browser", payload)
        shot = base64.b64decode(data["shot"]) if data.get("shot") else None
        return data["summary"], shot, data.get("meta") or {}

    async def open_view(self):
        await self._post("/open_view")

    async def user_input(self, ev: dict):
        await self._post("/input", ev)

    async def save_browser(self):
        """Keep the browser's cookies (encrypted) so a recreated sandbox is still signed in."""
        if self.sbx is None:
            return
        from . import vault

        await self._post("/pause")
        try:
            state = await self.sbx.files.read(STATE)
        except Exception:
            return
        await asyncio.to_thread(store.blob_put, f"tasks/{self.task.id}/browser_state.enc", vault.seal(state).encode(),
                                self.task.user_id)

    async def sync(self):
        """Copy new and changed workspace files out of the sandbox into the task's file list and Storage."""
        if self.sbx is None:
            return
        r = await self.http.get("/manifest")
        r.raise_for_status()
        seen = {}
        for f in r.json():
            seen[f["path"]] = f
            old = self.task.files.get(f["path"])
            if old and old["size"] == f["size"] and old["mtime"] == f["mtime"]:
                continue
            entry = {"size": f["size"], "mtime": f["mtime"]}
            if f["size"] > MAX_SYNC_BYTES:
                entry["remote_only"] = True
            else:
                data = await self.sbx.files.read(f"{WS}/{f['path']}", format="bytes")
                await asyncio.to_thread(store.blob_put, f"tasks/{self.task.id}/workspace/{f['path']}", bytes(data),
                                        self.task.user_id, _mime(f["path"]))
            self.task.files[f["path"]] = entry
        for gone in set(self.task.files) - set(seen):
            self.task.files.pop(gone, None)
            (self.task.workspace / gone).unlink(missing_ok=True)

    async def pause(self):
        """After a run: save cookies and files, then pause the sandbox (no charge while paused)."""
        if self.sbx is None:
            return
        try:
            await self.save_browser()
            await self.sync()
        finally:
            await self._release(pause=True)

    async def _release(self, pause: bool):
        if self.frames:
            self.frames.cancel()
            self.frames = None
        if self.http is not None:
            await self.http.aclose()
            self.http = None
        sbx, self.sbx = self.sbx, None
        _active.discard(self.task.id)
        if sbx is not None:
            try:
                await (sbx.pause() if pause else sbx.kill())
            except Exception:
                pass

    async def close(self):
        """The task was deleted: remove its sandbox for good."""
        if self.sbx is not None:
            await self._release(pause=False)
        elif self.task.sandbox_id:
            from e2b import AsyncSandbox

            try:
                await AsyncSandbox.kill(self.task.sandbox_id)
            except Exception:
                pass


def _mime(path: str) -> str:
    import mimetypes

    return mimetypes.guess_type(path)[0] or "application/octet-stream"


def make(task):
    return CloudComputer(task) if store.CLOUD else LocalComputer(task)
