"""Runs inside a task's E2B cloud sandbox: the agent's file tools, its Chrome browser and the live view.

The Atlas server starts it with a random ATLAS_HELPER_KEY and calls it over the sandbox's private URL; every request
must carry that key. Shell commands don't come through here (the server runs them with E2B's command API).

    python3 -m app.sandbox_helper        (from /opt/atlas, port 8000)
"""

import asyncio
import base64
import os
import secrets
from pathlib import Path

from fastapi import Body, FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

from . import tools as T
from .browser import Browser

KEY = os.environ["ATLAS_HELPER_KEY"]
WORKSPACE = Path(os.environ.get("ATLAS_WORKSPACE", "/home/user/workspace"))
STATE_DIR = Path(os.environ.get("ATLAS_STATE", "/home/user/.atlas"))
WORKSPACE.mkdir(parents=True, exist_ok=True)
STATE_DIR.mkdir(parents=True, exist_ok=True)
SKIP = {"node_modules", "__pycache__"}

app = FastAPI()
viewers: set[asyncio.Queue] = set()


def on_frame(data: str):
    for q in list(viewers):
        if q.qsize() < 3:
            q.put_nowait(data)


class OneLogin:
    """The saved login the server decrypted for this one browser call (the sandbox never holds the vault)."""

    def __init__(self, label: str = "", cred: dict | None = None):
        self.label, self.cred = label, cred

    def labels(self):
        return [self.label] if self.cred else []

    def get(self, label):
        if self.cred and label == self.label:
            return self.cred
        raise T.ToolError(f"No saved login named '{label}'.")


browser = Browser(STATE_DIR, WORKSPACE, on_frame, credentials=OneLogin())


@app.middleware("http")
async def require_key(request: Request, call_next):
    if request.url.path != "/health" and not secrets.compare_digest(request.headers.get("x-atlas-key", ""), KEY):
        return JSONResponse({"error": "forbidden"}, status_code=403)
    return await call_next(request)


def fail(e: Exception) -> JSONResponse:
    msg = str(e) if isinstance(e, T.ToolError) else f"{type(e).__name__}: {e}"
    return JSONResponse({"error": msg}, status_code=200)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/tool")
def tool(payload: dict = Body(...)):
    name, a = payload.get("name"), payload.get("args") or {}
    try:
        if name == "write_file":
            return {"out": T.write_file(WORKSPACE, a["path"], a["content"])}
        if name == "read_file":
            return {"out": T.read_file(WORKSPACE, a["path"], a.get("start_line"), a.get("end_line"))}
        if name == "edit_file":
            out = T.edit_file(WORKSPACE, a["path"], a["old_str"], a["new_str"])
            return {"out": out, "content": T.resolve(WORKSPACE, a["path"]).read_text()[:50_000]}
        return {"error": f"Unknown tool '{name}'."}
    except Exception as e:
        return fail(e)


@app.post("/browser")
async def browser_run(payload: dict = Body(...)):
    browser.credentials = OneLogin(payload.get("label", ""), payload.get("cred"))
    try:
        summary, shot, meta = await browser.run(payload.get("args") or {})
        return {"summary": summary, "shot": base64.b64encode(shot).decode() if shot else None, "meta": meta}
    except Exception as e:
        return fail(e)
    finally:
        browser.credentials = OneLogin()


@app.post("/open_view")
async def open_view():
    await browser.open_view()
    return {"ok": True}


@app.post("/input")
async def user_input(payload: dict = Body(...)):
    try:
        await browser.user_input(payload)
        return {"ok": True}
    except Exception as e:
        return fail(e)


@app.post("/pause")
async def pause():
    await browser.pause()
    return {"ok": True}


@app.get("/frames")
async def frames():
    q: asyncio.Queue = asyncio.Queue()

    async def gen():
        viewers.add(q)
        try:
            while True:
                try:
                    yield f"data: {await asyncio.wait_for(q.get(), 15)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            viewers.discard(q)

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/manifest")
def manifest():
    """Every file in the workspace with its size and modification time, so the server can copy out what changed."""
    out = []
    for p in WORKSPACE.rglob("*"):
        rel = p.relative_to(WORKSPACE)
        if p.is_file() and not any(part.startswith(".") or part in SKIP for part in rel.parts):
            st = p.stat()
            out.append({"path": str(rel), "size": st.st_size, "mtime": st.st_mtime})
    return out


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
