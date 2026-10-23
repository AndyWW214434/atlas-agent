"""Agent loop, task state, persistence, and the live event bus."""

import asyncio
import shlex
import sys
import json
import os
import time
import uuid
from datetime import date
from pathlib import Path

import anthropic

from . import tools as T
from . import features as F
from .browser import Browser

# Models offered in the UI's model picker. Effort is the per-model default unless AGENT_EFFORT is set.
MODELS = [
    {"id": "claude-haiku-5-5", "label": "Haiku 5.5", "tier": "Claude Haiku 5.5", "description": "Fastest and cheapest. Good for quick tasks.",
     "price": "$0.10 / $0.50", "effort": "medium"},
    {"id": "claude-sonnet-5-5", "label": "Sonnet 5.5", "tier": "Claude Sonnet 5.5", "description": "Balanced speed and capability.",
     "price": "$2 / $10", "effort": "medium"},
    {"id": "claude-opus-5-5", "label": "Opus 5.5", "tier": "Claude Opus 5.5", "description": "Most capable. Best for long, complex tasks.",
     "price": "$4 / $20", "effort": "high"},
]
MODEL_IDS = {m["id"] for m in MODELS}
MODEL = os.environ.get("AGENT_MODEL", "claude-haiku-5-5")
EFFORT_OVERRIDE = os.environ.get("AGENT_EFFORT")
# Web tools with dynamic filtering and server-side refusal fallbacks only exist on some models.
DYNAMIC_FILTER_MODELS = {"claude-opus-5-5", "claude-opus-5", "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6",
                         "claude-sonnet-5-5", "claude-sonnet-5", "claude-sonnet-4-6"}
FALLBACK_MODELS = {"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"}
AGENT_NAME = "Atlas"
DATA_DIR = Path(os.environ.get("ATLAS_DATA") or Path(__file__).resolve().parent.parent / "data") / "tasks"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MAX_ITERATIONS = 80


# Build / Create modes chosen on the home screen. Each adds focused instructions for that kind of deliverable.
MEDIA_CMD = f"{shlex.quote(sys.executable)} {shlex.quote(str(Path(__file__).resolve().parent / 'media.py'))}"
MODE_GUIDES = {
    "website": """Deliverable: a complete, polished, responsive website in site/ (index.html plus any css/js/assets; no build step unless the \
user asks for a framework). Real copy, not lorem ipsum; accessible markup; works at phone and desktop widths. If the user gave an \
existing site to start from, study it in the browser first. Open site/index.html in the browser (file://) and check every section \
before finishing.""",
    "chatbot": """Deliverable: a working chatbot in chatbot/. Default to a small Python FastAPI backend plus a single-page chat UI. When it \
needs an AI model, call Claude through the official Anthropic Python SDK (model claude-haiku-5-5, key from the ANTHROPIC_API_KEY \
environment variable; never hard-code keys). Include README.md with run steps, start it, and test a real conversation before finishing.""",
    "mobile": """Deliverable: a mobile app in app/. Default to an installable mobile-first web app (PWA: manifest + service worker) in plain \
HTML/CSS/JS so it runs on any phone; use Expo/React Native only if the user asks. Design for a 390px-wide screen, touch targets \
44px+, save data in localStorage. Check it in the browser before finishing.""",
    "game": """Deliverable: a playable game in game/index.html (HTML5 canvas or DOM, no external assets needed; draw sprites with code). \
Include a title screen, controls help, scoring, game over and restart, and smooth 60 fps play. Play it in the browser (press keys, \
click) to check it works before finishing.""",
    "notebook": """Deliverable: a Jupyter notebook (.ipynb) that tells a clear story: a title and intro in Markdown, then small, \
well-commented code cells with Markdown between them explaining each step, charts with labeled axes, and a conclusions section. \
Use real public data when it fits (cite it) or generate realistic sample data and say so. Create it with nbformat, then EXECUTE it \
top to bottom so outputs and charts are saved in the file: `jupyter nbconvert --to notebook --execute --inplace NAME.ipynb`. Fix any \
failing cell and re-run until it runs cleanly. pip install --user any missing package.""",
    "slides": """Deliverable: a slide deck. Follow the user's Preferences line: the page count range, the theme (colors, type and mood), \
and the style. Style "Standard": one self-contained HTML file (slides/index.html), 16:9, arrow-key and click navigation, slide \
numbers. Style "PowerPoint": a real .pptx built with python-pptx (pip install --user python-pptx) using proper title/content \
layouts, native charts and tables where useful, and speaker notes in each slide's notes; also make slides/index.html as a preview. \
If a template file is attached, match its colors, fonts and layout. One idea per slide with visuals (charts, diagrams or icons \
drawn with code). Check every slide in the browser before finishing.""",
    "document": """Deliverable: a well-structured document: headings, short paragraphs, tables where useful, and cited sources for facts. \
Save it as Markdown and as a Word file (.docx via python-docx; pip install --user python-docx if needed).""",
    "spreadsheet": """Deliverable: a spreadsheet: an .xlsx built with openpyxl (pip install --user openpyxl if needed) with a styled, frozen \
header row, sensible column widths, number formats, live formulas for totals and derived columns, and a chart where it helps; also \
save a CSV of the main sheet.""",
    "visualization": """Deliverable: clear, honest charts (titles, labeled axes and units, readable fonts, colorblind-friendly colors), \
cited data. Follow the Preferences line. Output format "Graph": PNG charts (matplotlib) plus charts/index.html showing them with \
short explanations. "Slides": an HTML slide deck of the charts. "Website": an interactive page (Chart.js from cdnjs.cloudflare.com) \
with tooltips and filters. "Spreadsheet": an .xlsx (openpyxl) with the data and native Excel charts. "Report": a Markdown and HTML \
report with the charts and findings. Prefer the user's preferred chart types where they suit the data.""",
    "design": f"""Deliverable: graphic designs (posters, social posts, brand sheets, app screen mockups, banners). You cannot generate \
photos, so design with typography, color, shapes, gradients, SVG illustration and icons. Build each design as an HTML/CSS/SVG page \
at the exact canvas size from the Preferences line, then render it to PNG with: {{MEDIA}} png design.html design.png --size WIDTHxHEIGHT \
Make 2-3 distinct variations when it helps the user choose. Look at each PNG in the browser and fix spacing, contrast or overflow.""",
    "video": f"""Deliverable: a motion-graphics video made with code (kinetic typography, animated shapes, charts that build, transitions). \
You cannot generate camera footage, and the video has no sound. Build it as one HTML page whose CSS/JS animation timeline plays \
automatically from page load, sized to the Preferences line (16:9 = 1920x1080, 9:16 = 1080x1920, 1:1 = 1080x1080), then record it: \
{{MEDIA}} video anim.html video.webm --size WIDTHxHEIGHT --seconds LENGTH \
Also save a PNG of the key frame with: {{MEDIA}} png anim.html poster.png --size WIDTHxHEIGHT. Preview the page in the browser first.""",
    "audio": """Deliverable: audio files. Speech uses macOS voices: list them with `say -v '?'` and prefer natural voices (e.g. Samantha, \
Daniel, Karen, Moira, Tessa). Write the script first and save it as script.md. Render each line or section to WAV with \
`say -v VOICE --data-format=LEI16@22050 -o part_N.wav -f part_N.txt`, join parts in order with Python's wave module (add short \
pauses between speakers), then convert: `afconvert -f m4af -d aac final.wav final.m4a`. For a podcast, alternate two distinct voices. \
Sound effects or music loops: synthesize with numpy (envelopes, harmonics) and write WAV with the wave module. Follow the \
Preferences line for the format.""",
}
MODE_GUIDES = {k: v.replace("{MEDIA}", MEDIA_CMD) for k, v in MODE_GUIDES.items()}

client = anthropic.AsyncAnthropic()

CLIENT_TOOLS = [T.PLAN_TOOL, T.ASK_TOOL, T.SHELL_TOOL, T.WRITE_TOOL, T.READ_TOOL, T.EDIT_TOOL, T.BROWSER_TOOL]
TOOL_BY_NAME = {t["name"]: t for t in CLIENT_TOOLS}


def request_options(model: str) -> dict:
    """Request parameters that depend on the model and on which plugins are switched on."""
    enabled = F.plugins()["builtin"]
    client_tools = [t for t in CLIENT_TOOLS
                    if not (t["name"] == "browser" and not enabled["browser"])
                    and not (t["name"] == "shell" and not enabled["terminal"])]
    server_tools = []
    if enabled["search"]:
        if model in DYNAMIC_FILTER_MODELS:
            server_tools = [{"type": "web_search_20260209", "name": "web_search"}, {"type": "web_fetch_20260209", "name": "web_fetch"}]
        else:
            server_tools = [{"type": "web_search_20250305", "name": "web_search"}, {"type": "web_fetch_20250910", "name": "web_fetch"}]
    effort = EFFORT_OVERRIDE or next((m["effort"] for m in MODELS if m["id"] == model), "medium")
    # Switching models mid-task changes the tool list, which invalidates earlier thinking blocks;
    # "drop_block" makes the API drop them instead of rejecting the request.
    opts = {
        "tools": [*client_tools, *server_tools],
        "output_config": {"effort": effort},
        "thinking": {"type": "adaptive", "display": "summarized",
                     "block_binding": {"prefix_mismatch_behavior": "drop_block"}},
        "betas": ["thinking-binding-controls-2026-08-01"],
    }
    if model in FALLBACK_MODELS:
        opts["betas"].append("server-side-fallback-2026-07-01")
        opts["fallbacks"] = "default"
    servers = F.mcp_servers()  # connectors from the Plugins page, run by Anthropic's MCP connector
    if servers:
        opts["mcp_servers"] = servers
        opts["tools"] += [{"type": "mcp_toolset", "mcp_server_name": s["name"]} for s in servers]
        opts["betas"].append("mcp-client-2025-11-20")
    return opts


def system_prompt(workspace: Path, project_instructions: str = "", mode: str = "") -> str:
    project = f"\n\nProject instructions from the user (apply them to this task):\n{project_instructions}" if project_instructions else ""
    guide = f"\n\nThis task's type ({mode}):\n{MODE_GUIDES[mode]}" if mode in MODE_GUIDES else ""
    return _base_prompt(workspace) + guide + project


def _base_prompt(workspace: Path) -> str:
    return f"""You are {AGENT_NAME}, an autonomous general AI agent. You complete tasks end to end on the user's behalf: research, \
data analysis, writing, coding, building websites and documents. You work in a private workspace with a shell, a file system, \
a real web browser, and web search/fetch.

Workspace (current directory for every shell command): {workspace}
Today's date: {date.today().isoformat()}

How to work:
- For anything beyond a quick question, first call update_plan with 3-7 phases, then work through them, updating the plan as phases finish.
- Act rather than ask. Only ask the user a question when you are truly blocked on a decision that is theirs.
- Before each tool call, write at most one short sentence on what you are doing; the user sees your tool calls live.
- Browser: you have your own persistent browser session (tabs, cookies and logins stay between calls). To use a page: navigate, \
then snapshot to see numbered interactive elements, then click/type/select by index. Snapshot again after the page changes. \
Use web_fetch for plain reading and the browser for interaction, logins, forms, JavaScript-heavy pages and visual checks. \
Downloads land in downloads/ in the workspace. Never enter passwords or payment details yourself; if a task needs a login or \
payment, stop and ask the user to do it.
- Asking the user: use ask_user. Logging in: use kind='credentials' to get a login stored (the user types it into a secure form; \
you never see it), then browser action 'login'. Use kind='handoff' for 2-step verification, CAPTCHAs, or if they prefer to sign in \
themselves: they take over the live browser. Never ask for a password in chat. kind='confirm' BEFORE anything irreversible or outward-facing: \
sending messages, moving or deleting emails, buying, submitting consequential forms. State exactly what will happen and list \
what is affected. If the user declines, stop that action. For email cleanup: look through the mail first, then confirm a list \
of senders and subjects, then only move mail to Spam or Trash. Never permanently delete, and never empty Trash.
- Verify your work (run the code, open the HTML in the browser, check numbers against sources). Cite sources for factual research.
- Save substantial deliverables as files in the workspace (Markdown reports, HTML pages, code, CSV, charts as PNG). \
The user sees every file you create and can download it.
- Finish with a concise summary of what you did and which files hold the results. Use Markdown."""


class Task:
    def __init__(self, task_id: str, data: dict | None = None):
        self.id = task_id
        self.dir = DATA_DIR / task_id
        self.workspace = self.dir / "workspace"
        self.shots = self.dir / "shots"
        data = data or {}
        self.title: str = data.get("title", "New task")
        self.created: float = data.get("created", time.time())
        self.updated: float = data.get("updated", self.created)
        self.messages: list = data.get("messages", [])
        self.events: list = data.get("events", [])
        self.plan: list = data.get("plan", [])
        self.model: str = data.get("model", MODEL)
        self.project_id: str | None = data.get("project_id")
        self.project_instructions: str = data.get("project_instructions", "")
        self.credits_used: float = data.get("credits_used", 0.0)
        self.mode: str = data.get("mode", "")
        self.status: str = "idle" if data.get("status") == "running" else data.get("status", "idle")
        self.subscribers: set[asyncio.Queue] = set()
        self.runner: asyncio.Task | None = None
        self.pending: dict[int, asyncio.Future] = {}
        for e in self.events:  # a restart loses the waiting run, so open questions can no longer be answered
            if e["type"] == "ask" and e.get("status") == "pending":
                e["status"] = "expired"
        self.browser = Browser(self.dir, self.workspace, self._frame)

    # --- persistence -------------------------------------------------------

    def save(self):
        self.dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "id": self.id, "title": self.title, "created": self.created, "updated": self.updated,
            "status": self.status, "plan": self.plan, "model": self.model, "messages": self.messages, "events": self.events,
            "project_id": self.project_id, "project_instructions": self.project_instructions, "credits_used": self.credits_used,
            "mode": self.mode,
        }
        tmp = self.dir / "task.json.tmp"
        tmp.write_text(json.dumps(payload))
        tmp.replace(self.dir / "task.json")

    def summary(self) -> dict:
        preview = next((e.get("text", "") for e in reversed(self.events) if e["type"] == "text" and e.get("text")), "")
        return {"id": self.id, "title": self.title, "updated": self.updated, "status": self.status,
                "preview": preview[:140], "project_id": self.project_id, "model": self.model,
                "credits": round(self.credits_used, 1)}

    # --- event bus ---------------------------------------------------------

    def _broadcast(self, op: dict):
        # Serialize now: events are mutated in place by later deltas.
        data = json.dumps(op)
        for q in list(self.subscribers):
            q.put_nowait(data)

    def _frame(self, data: str):
        """Live browser frame: ephemeral, never stored, dropped for slow viewers."""
        if not self.subscribers:
            return
        msg = json.dumps({"op": "frame", "data": data})
        for q in list(self.subscribers):
            if q.qsize() < 3:
                q.put_nowait(msg)

    def add_event(self, type_: str, **fields) -> dict:
        event = {"id": len(self.events), "type": type_, "step": self.current_step(), "ts": time.time(), **fields}
        self.events.append(event)
        self._broadcast({"op": "add", "event": event})
        return event

    def append(self, event: dict, field: str, value: str):
        event[field] = event.get(field, "") + value
        self._broadcast({"op": "append", "id": event["id"], "field": field, "value": value})

    def update(self, event: dict, **fields):
        event.update(fields)
        self._broadcast({"op": "update", "id": event["id"], "fields": fields})

    def set_status(self, status: str):
        self.status = status
        self.updated = time.time()
        self._broadcast({"op": "status", "status": status, "plan": self.plan, "title": self.title, "model": self.model})

    def snapshot(self) -> dict:
        return {"op": "snapshot", "events": self.events, "status": self.status, "plan": self.plan,
                "title": self.title, "agent": AGENT_NAME, "model": self.model}

    def current_step(self):
        for i, step in enumerate(self.plan):
            if step["status"] == "in_progress":
                return i
        return None

    # --- workspace ---------------------------------------------------------

    def list_files(self) -> list[dict]:
        if not self.workspace.exists():
            return []
        files = []
        for p in sorted(self.workspace.rglob("*")):
            rel = p.relative_to(self.workspace)
            if p.is_file() and not any(part.startswith(".") or part in ("node_modules", "__pycache__") for part in rel.parts):
                st = p.stat()
                files.append({"path": str(rel), "size": st.st_size, "mtime": st.st_mtime})
        return files

    # --- running -----------------------------------------------------------

    def start(self, text: str, attachments: list[str], model: str | None = None):
        if self.runner and not self.runner.done():
            raise RuntimeError("Task is already running")
        if model in MODEL_IDS:
            self.model = model
        content = text
        if attachments:
            content += "\n\n[Files uploaded to the workspace: " + ", ".join(attachments) + "]"
        if not self.messages:
            self.title = (text.strip().splitlines() or ["New task"])[0][:60]
        self.messages.append({"role": "user", "content": content})
        self.add_event("user", text=text, attachments=attachments, model=self.model, mode=self.mode if not self.messages[:-1] else "")
        self.set_status("running")
        self.save()
        self.runner = asyncio.create_task(self._run())

    def respond(self, ev_id: int, answer: str, note: str, label: str = ""):
        waiter = self.pending.get(ev_id)
        if waiter is None or waiter.done():
            raise RuntimeError("That question is no longer waiting for an answer")
        waiter.set_result({"answer": answer, "note": note[:1000], "label": label})

    def pending_kind(self, ev_id: int) -> str | None:
        ev = self.events[ev_id] if 0 <= ev_id < len(self.events) else None
        return ev.get("kind") if ev and ev["type"] == "ask" and ev.get("status") == "pending" else None

    def pending_handoff(self) -> bool:
        return any(e["type"] == "ask" and e.get("kind") == "handoff" and e.get("status") == "pending" for e in self.events)

    async def stop(self):
        if self.runner and not self.runner.done():
            self.runner.cancel()
            try:
                await self.runner
            except (asyncio.CancelledError, Exception):
                pass

    async def _run(self):
        before = {f["path"]: f["mtime"] for f in self.list_files()}
        try:
            await self._loop()
            self.set_status("idle")
        except asyncio.CancelledError:
            self._close_open_tool_turn("Stopped by the user.")
            self.add_event("notice", text="Task stopped.")
            self.set_status("idle")
        except anthropic.APIStatusError as e:
            self.add_event("error", text=f"API error {e.status_code}: {e.message}")
            self.set_status("error")
        except anthropic.APIConnectionError:
            self.add_event("error", text="Could not reach the Claude API. Check your network connection.")
            self.set_status("error")
        except Exception as e:  # keep the server alive no matter what a tool does
            self.add_event("error", text=f"{type(e).__name__}: {e}")
            self.set_status("error")
        finally:
            await self.browser.pause()
            changed = [f for f in self.list_files() if before.get(f["path"]) != f["mtime"]]
            if changed:
                self.add_event("files", files=changed)
            self.updated = time.time()
            self.save()
            self._broadcast({"op": "status", "status": self.status, "plan": self.plan, "title": self.title})

    def _close_open_tool_turn(self, reason: str):
        """If we were cancelled mid-tool, answer the pending tool_use blocks so history stays valid."""
        if not self.messages or self.messages[-1]["role"] != "assistant":
            return
        pending = [b for b in self.messages[-1]["content"] if isinstance(b, dict) and b.get("type") == "tool_use"]
        if pending:
            self.messages.append({"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": b["id"], "content": reason, "is_error": True} for b in pending
            ]})
        for e in self.events:
            if e["type"] == "tool" and e.get("status") == "running":
                self.update(e, status="error", output=(e.get("output") or "") + "\n[stopped]")
            elif e["type"] == "ask" and e.get("status") == "pending":
                self.update(e, status="cancelled")

    async def _loop(self):
        self.workspace.mkdir(parents=True, exist_ok=True)
        json_retries = 0
        for _ in range(MAX_ITERATIONS):
            if F.balance() <= 0:
                self._close_open_tool_turn("Out of credits.")
                self.add_event("error", text="You're out of credits. Daily credits refresh at midnight, or change your plan with Upgrade.")
                return
            try:
                message, tool_events = await self._sample()
                json_retries = 0
            except ValueError:
                # The SDK could not parse a streamed tool input at all; re-issue the turn.
                json_retries += 1
                if json_retries > 2:
                    raise
                continue

            self.messages.append({"role": "assistant", "content": [b.to_dict() for b in message.content]})
            billed_model = message.model if message.model in F.PRICES else self.model
            self.credits_used += F.charge(self.id, self.title, billed_model, F.cost_usd(billed_model, message.usage))
            self.save()

            if message.stop_reason == "pause_turn":
                continue
            if message.stop_reason == "refusal":
                self.add_event("error", text="The model declined to continue this task.")
                return
            tool_uses = [b for b in message.content if b.type == "tool_use"]
            if not tool_uses:
                return
            if message.stop_reason == "max_tokens":
                # A truncated tool input can parse as a valid partial object; don't run it.
                self.messages.append({"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": b.id, "is_error": True,
                     "content": "Output limit reached before this tool input was complete. Split the work into smaller pieces."}
                    for b in tool_uses
                ]})
                continue

            # In order, not concurrently: the browser, shell and files are stateful, and calls in one turn
            # (e.g. type into field 0, then field 1) depend on each other.
            results = [await self._execute(b, tool_events.get(b.id)) for b in tool_uses]
            self.messages.append({"role": "user", "content": list(results)})
            self.save()
        self.add_event("notice", text=f"Stopped after {MAX_ITERATIONS} steps.")

    async def _sample(self):
        """Stream one model turn, mirroring it into UI events. Returns the final message."""
        by_index: dict[int, dict] = {}
        tool_events: dict[str, dict] = {}
        async with client.beta.messages.stream(
            model=self.model,
            max_tokens=64000,
            system=system_prompt(self.workspace.resolve(), self.project_instructions, self.mode),
            messages=self.messages,
            cache_control={"type": "ephemeral"},
            **request_options(self.model),
        ) as stream:
            async for event in stream:
                if event.type == "content_block_start":
                    block = event.content_block
                    if block.type == "thinking":
                        by_index[event.index] = self.add_event("thinking", text="")
                    elif block.type == "text":
                        by_index[event.index] = self.add_event("text", text="")
                    elif block.type in ("tool_use", "server_tool_use"):
                        if block.name in ("update_plan", "ask_user"):
                            continue
                        ev = self.add_event("tool", tool_id=block.id, name=block.name, input={}, status="running",
                                            output="", server=block.type == "server_tool_use")
                        by_index[event.index] = ev
                        tool_events[block.id] = ev
                    elif block.type == "mcp_tool_use":
                        ev = self.add_event("tool", tool_id=block.id, name="mcp", tool=block.name,
                                            connector=block.server_name, input={}, status="running", output="", server=True)
                        by_index[event.index] = ev
                        tool_events[block.id] = ev
                    elif block.type == "mcp_tool_result":
                        ev = tool_events.get(block.tool_use_id)
                        if ev:
                            parts = block.content if isinstance(block.content, list) else [block.content]
                            text = "\n".join(getattr(p, "text", "") if not isinstance(p, str) else p for p in parts)
                            self.update(ev, status="error" if getattr(block, "is_error", False) else "done", output=text[:20_000])
                    elif block.type == "web_search_tool_result":
                        ev = tool_events.get(block.tool_use_id)
                        if ev:
                            content = block.content
                            if isinstance(content, list):
                                results = [{"title": r.title, "url": r.url, "age": getattr(r, "page_age", None)} for r in content]
                                self.update(ev, status="done", results=results)
                            else:
                                self.update(ev, status="error", output=f"Search failed: {content.error_code}")
                    elif block.type == "web_fetch_tool_result":
                        ev = tool_events.get(block.tool_use_id)
                        if ev:
                            content = block.content
                            if getattr(content, "type", "") == "web_fetch_result":
                                doc = content.content
                                title = getattr(doc, "title", None) or content.url
                                text = ""
                                src = getattr(doc, "source", None)
                                if src is not None and getattr(src, "type", "") == "text":
                                    text = src.data[:6000]
                                self.update(ev, status="done", output=text, page_title=title, url=content.url)
                            else:
                                self.update(ev, status="error", output=f"Fetch failed: {getattr(content, 'error_code', 'error')}")
                    elif block.type.endswith("_tool_result") and getattr(block, "tool_use_id", None) in tool_events:
                        # Other server tools, e.g. the code execution web search uses for filtering.
                        content = block.content
                        out = getattr(content, "stdout", "") or getattr(content, "stderr", "") or ""
                        self.update(tool_events[block.tool_use_id], status="done", output=out[:20_000])
                elif event.type == "content_block_delta":
                    ev = by_index.get(event.index)
                    if ev is None:
                        continue
                    if event.delta.type == "thinking_delta":
                        self.append(ev, "text", event.delta.thinking)
                    elif event.delta.type == "text_delta":
                        self.append(ev, "text", event.delta.text)
                    elif event.delta.type == "input_json_delta" and ev["type"] == "tool":
                        self.append(ev, "partial", event.delta.partial_json)
                elif event.type == "content_block_stop":
                    ev = by_index.get(event.index)
                    block = event.content_block
                    if ev and ev["type"] == "tool" and block.type in ("tool_use", "server_tool_use", "mcp_tool_use"):
                        self.update(ev, input=block.input if isinstance(block.input, dict) else {}, partial="")
            message = await stream.get_final_message()
        return message, tool_events

    async def _execute(self, block, ev: dict | None) -> dict:
        def result(content, is_error=False):
            r = {"type": "tool_result", "tool_use_id": block.id, "content": content}
            if is_error:
                r["is_error"] = True
            return r

        spec = TOOL_BY_NAME.get(block.name)
        if spec is None:
            return result(f"Unknown tool '{block.name}'.", True)
        problem = T.validate(spec, block.input)
        if problem:
            if ev:
                self.update(ev, status="error", output=problem)
            return result(json.dumps({"INVALID_JSON": json.dumps(block.input), "error": problem}), True)

        args = block.input
        try:
            if block.name == "update_plan":
                self.plan = [{"title": s["title"], "status": s["status"]} for s in args["steps"]]
                self._broadcast({"op": "status", "status": self.status, "plan": self.plan, "title": self.title})
                return result("Plan updated.")
            if block.name == "ask_user":
                ask = self.add_event("ask", kind=args["kind"], message=args["message"], status="pending")
                waiter = asyncio.get_running_loop().create_future()
                self.pending[ask["id"]] = waiter
                self.save()
                try:
                    if args["kind"] == "handoff":
                        await self.browser.open_view()
                    reply = await waiter
                finally:
                    self.pending.pop(ask["id"], None)
                self.update(ask, status="answered", answer=reply["answer"], note=reply["note"], label=reply.get("label", ""))
                note = f" The user added: {reply['note']}" if reply["note"] else ""
                if args["kind"] == "handoff":
                    await self.browser.pause()  # persist the cookies from the login
                    return result("The user finished their part and handed the browser back. Take a snapshot to see the page." + note)
                if args["kind"] == "credentials":
                    if reply["answer"] == "provided":
                        return result(f"The user saved a login named '{reply['label']}'. It is encrypted and you cannot read it. "
                                      f"Go to the sign-in page and use the browser action 'login' with credential='{reply['label']}'." + note)
                    return result("The user chose not to provide a login. Offer a handoff instead if you still need to sign in." + note)
                if reply["answer"] == "approved":
                    return result("The user APPROVED this." + note)
                return result("The user DECLINED. Do not perform this action." + note)
            if block.name == "shell":
                async def on_output(text):
                    if ev:
                        self.append(ev, "output", text)
                out = await T.run_shell(self.workspace, args["command"], args.get("timeout"), on_output)
                if ev:
                    self.update(ev, status="done", output=out)
                return result(out)
            if block.name == "write_file":
                out = T.write_file(self.workspace, args["path"], args["content"])
            elif block.name == "read_file":
                out = T.read_file(self.workspace, args["path"], args.get("start_line"), args.get("end_line"))
            elif block.name == "edit_file":
                out = T.edit_file(self.workspace, args["path"], args["old_str"], args["new_str"])
                if ev:
                    try:
                        self.update(ev, content=T.resolve(self.workspace, args["path"]).read_text()[:50_000])
                    except OSError:
                        pass
            elif block.name == "browser":
                summary, shot, meta = await self.browser.run(args)
                fields = {"status": "done", "output": summary, "meta": meta}
                if shot:
                    self.shots.mkdir(parents=True, exist_ok=True)
                    name = f"{uuid.uuid4().hex[:10]}.jpg"
                    (self.shots / name).write_bytes(shot)
                    fields["image"] = f"/api/tasks/{self.id}/shots/{name}"
                if ev:
                    self.update(ev, **fields)
                content = [{"type": "text", "text": summary}]
                if shot:
                    content.append(T.image_block(shot))
                return result(content)
            if ev:
                self.update(ev, status="done", output=out)
            return result(out)
        except T.ToolError as e:
            if ev:
                self.update(ev, status="error", output=str(e))
            return result(str(e), True)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            msg = f"{type(e).__name__}: {e}"
            if ev:
                self.update(ev, status="error", output=msg)
            return result(msg, True)


class TaskStore:
    def __init__(self):
        self.tasks: dict[str, Task] = {}
        for path in DATA_DIR.glob("*/task.json"):
            try:
                data = json.loads(path.read_text())
                self.tasks[data["id"]] = Task(data["id"], data)
            except (OSError, ValueError, KeyError):
                continue

    def create(self, project_id: str | None = None, mode: str = "") -> Task:
        task = Task(uuid.uuid4().hex[:12])
        task.mode = mode if mode in MODE_GUIDES else ""
        proj = F.project(project_id)
        if proj:
            task.project_id, task.project_instructions = proj["id"], proj.get("instructions", "")
        task.workspace.mkdir(parents=True, exist_ok=True)
        self.tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task | None:
        return self.tasks.get(task_id)

    def list(self) -> list[dict]:
        return [t.summary() for t in sorted(self.tasks.values(), key=lambda t: t.updated, reverse=True) if t.messages]

    async def delete(self, task_id: str):
        task = self.tasks.pop(task_id, None)
        if task:
            await task.stop()
            await task.browser.close()
            import shutil
            shutil.rmtree(task.dir, ignore_errors=True)
