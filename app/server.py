"""HTTP API + static UI."""

import asyncio
import json
import os
import shutil
import time
from pathlib import Path

from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import features as F
from . import vault
from .agent import AGENT_NAME, MODEL, MODEL_IDS, MODELS, TaskStore
from .tools import ToolError, resolve

STATIC = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title=AGENT_NAME)

# Read-only replay demo (ATLAS_DEMO=1): no API key on the server; visitors can look at everything and watch the
# recorded tasks, but nothing that runs the agent or changes data is allowed.
DEMO = os.environ.get("ATLAS_DEMO") == "1"


@app.middleware("http")
async def read_only_demo(request, call_next):
    if DEMO and request.url.path.startswith("/api/") and request.method not in ("GET", "HEAD", "OPTIONS"):
        from fastapi.responses import JSONResponse

        return JSONResponse({"detail": "This is a read-only demo: watch the example tasks in the sidebar. "
                                       "Running new tasks and changing settings are turned off."}, status_code=403)
    return await call_next(request)


@app.middleware("http")
async def no_cache_static(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static") or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache"
    return response

store = TaskStore()


def get_task(task_id: str):
    task = store.get(task_id)
    if task is None:
        raise HTTPException(404, "Task not found")
    return task


async def save_uploads(task, files: list[UploadFile], library_ids: str = "") -> list[str]:
    """Copy attachments into the task's workspace. New uploads are also kept in the Library for reuse."""
    names = []
    upload_dir = task.workspace / "uploads"
    for f in files:
        if not f.filename:
            continue
        upload_dir.mkdir(parents=True, exist_ok=True)
        data = await f.read()
        item = F.library_add(f.filename, data)
        (upload_dir / item["name"]).write_bytes(data)
        names.append(f"uploads/{item['name']}")
    for lib_id in filter(None, (library_ids or "").split(",")):
        src = F.library_path(lib_id.strip())
        if src and f"uploads/{src.name}" not in names:
            upload_dir.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, upload_dir / src.name)
            names.append(f"uploads/{src.name}")
    return names


def require_credits():
    if F.balance() <= 0:
        raise HTTPException(402, "You're out of credits. They refresh at midnight, or change your plan with Upgrade.")


@app.get("/api/config")
def config():
    return {"agent": AGENT_NAME, "model": MODEL, "models": MODELS, "user": F.user_name(),
            "has_key": DEMO or bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")),
            "demo": DEMO}


@app.get("/api/tasks")
def list_tasks():
    return store.list()


@app.post("/api/tasks")
async def create_task(text: str = Form(...), model: str | None = Form(None), project_id: str | None = Form(None),
                      library_ids: str = Form(""), mode: str = Form(""), files: list[UploadFile] = File(default=[])):
    require_credits()
    task = store.create(project_id, mode)
    task.start(text, await save_uploads(task, files, library_ids), model)
    return {"id": task.id}


@app.post("/api/tasks/{task_id}/messages")
async def send_message(task_id: str, text: str = Form(...), model: str | None = Form(None),
                       library_ids: str = Form(""), files: list[UploadFile] = File(default=[])):
    task = get_task(task_id)
    if task.status == "running":
        raise HTTPException(409, "Task is still running")
    require_credits()
    task.start(text, await save_uploads(task, files, library_ids), model)
    return {"ok": True}


@app.post("/api/tasks/{task_id}/stop")
async def stop_task(task_id: str):
    await get_task(task_id).stop()
    return {"ok": True}


@app.post("/api/tasks/{task_id}/respond")
async def respond(task_id: str, payload: dict = Body(...)):
    task = get_task(task_id)
    answer = str(payload.get("answer", ""))
    if answer not in ("approved", "declined", "done", "provided"):
        raise HTTPException(400, "Bad answer")
    label = ""
    try:
        ev_id = int(payload["id"])
        if answer == "provided":
            # Secrets go straight into the encrypted vault; only the name continues to the agent and its history.
            if task.pending_kind(ev_id) != "credentials":
                raise RuntimeError("No login is being requested")
            creds = payload.get("credentials") or {}
            label = vault.save(str(creds.get("label", "")), str(creds.get("username", "")), str(creds.get("password", "")))
        task.respond(ev_id, answer, str(payload.get("note", "")), label)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except (KeyError, RuntimeError) as e:
        raise HTTPException(409, str(e))
    return {"ok": True}


@app.get("/api/vault")
def list_vault():
    return vault.listing()


@app.delete("/api/vault/{entry_id}")
def delete_vault(entry_id: str):
    if not vault.delete(entry_id):
        raise HTTPException(404, "Not found")
    return {"ok": True}


@app.post("/api/tasks/{task_id}/input")
async def browser_input(task_id: str, payload: dict = Body(...)):
    """Mouse/keyboard from the user, only while the agent has handed the browser over."""
    task = get_task(task_id)
    if not task.pending_handoff():
        raise HTTPException(409, "The browser is not handed over")
    try:
        await task.browser.user_input(payload)
    except Exception as e:  # a key name Chrome rejects, a closed page, a malformed payload: never a 500
        raise HTTPException(400, f"{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ''}")
    return {"ok": True}


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    get_task(task_id)
    await store.delete(task_id)
    return {"ok": True}


@app.get("/api/tasks/{task_id}/stream")
async def stream(task_id: str):
    task = get_task(task_id)
    queue: asyncio.Queue = asyncio.Queue()

    async def gen():
        task.subscribers.add(queue)
        try:
            yield f"data: {json.dumps(task.snapshot())}\n\n"
            if task.pending_handoff():  # a reconnecting viewer needs the current page, not just future changes
                try:
                    await task.browser.open_view()
                except Exception:
                    pass
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), 15)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            task.subscribers.discard(queue)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/tasks/{task_id}/files")
def list_files(task_id: str):
    return get_task(task_id).list_files()


@app.get("/api/tasks/{task_id}/files/{path:path}")
def get_file(task_id: str, path: str, download: bool = False):
    task = get_task(task_id)
    try:
        target = resolve(task.workspace, path)
    except ToolError:
        raise HTTPException(403, "Forbidden")
    if not target.is_file():
        raise HTTPException(404, "File not found")
    return FileResponse(target, filename=target.name if download else None,
                        content_disposition_type="attachment" if download else "inline")


@app.get("/api/tasks/{task_id}/shots/{name}")
def get_shot(task_id: str, name: str):
    target = get_task(task_id).shots / Path(name).name
    if not target.is_file():
        raise HTTPException(404, "Not found")
    return FileResponse(target, media_type="image/jpeg")


# --- Library ---------------------------------------------------------------

@app.get("/api/library")
def library_list():
    return F.library_list()


@app.post("/api/library")
async def library_upload(files: list[UploadFile] = File(...)):
    return [F.library_add(f.filename or "file", await f.read()) for f in files if f.filename]


@app.get("/api/library/{item_id}")
def library_file(item_id: str, download: bool = False):
    path = F.library_path(item_id)
    if not path:
        raise HTTPException(404, "Not found")
    return FileResponse(path, filename=path.name if download else None,
                        content_disposition_type="attachment" if download else "inline")


@app.delete("/api/library/{item_id}")
def library_delete(item_id: str):
    if not F.library_delete(item_id):
        raise HTTPException(404, "Not found")
    return {"ok": True}


# --- Projects --------------------------------------------------------------

@app.get("/api/projects")
def projects_list():
    return F.projects()


@app.post("/api/projects")
def projects_save(payload: dict = Body(...)):
    return F.project_save(payload.get("id"), str(payload.get("name", "")).strip(), str(payload.get("instructions", "")))


@app.delete("/api/projects/{pid}")
def projects_delete(pid: str):
    if not F.project_delete(pid):
        raise HTTPException(404, "Not found")
    return {"ok": True}


# --- Plugins ---------------------------------------------------------------

@app.get("/api/plugins")
def plugins_get():
    return F.plugins_public()


@app.post("/api/plugins/builtin")
def plugins_builtin(payload: dict = Body(...)):
    try:
        F.plugin_toggle_builtin(str(payload.get("key")), bool(payload.get("enabled")))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return F.plugins_public()


@app.post("/api/plugins/connectors")
def plugins_connect(payload: dict = Body(...)):
    try:
        F.connector_save(str(payload.get("key") or payload.get("name", "custom")).lower().replace(" ", "-")[:40],
                         str(payload.get("name", "Custom")), str(payload.get("url", "")).strip(),
                         str(payload.get("token", "")).strip(), str(payload.get("description", "")))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return F.plugins_public()


@app.patch("/api/plugins/connectors/{cid}")
def plugins_connector_update(cid: str, payload: dict = Body(...)):
    F.connector_update(cid, enabled=payload.get("enabled"), remove=bool(payload.get("remove")))
    return F.plugins_public()


# --- Credits ---------------------------------------------------------------

@app.get("/api/credits")
def credits_get():
    return F.credits_summary()


@app.post("/api/credits/plan")
def credits_plan(payload: dict = Body(...)):
    F.set_plan(str(payload.get("plan", "")), int(payload.get("add_bonus") or 0))
    return F.credits_summary()


@app.get("/api/usage")
def usage():
    return {"summary": F.credits_summary(), "tasks": F.usage_by_task()}


# --- Automations -----------------------------------------------------------

def run_automation(a: dict, reason: str, payload: str = "") -> str:
    require_credits()
    task = store.create(a.get("project_id"))
    model = a.get("model") if a.get("model") in MODEL_IDS else None
    task.start(F.automation_prompt(a, reason, payload), [], model)
    task.title = a["name"]
    task.save()
    F.automation_record_run(a["id"], task.id, reason)
    return task.id


async def scheduler():
    while True:
        await asyncio.sleep(20)
        for a in F.due_automations():
            try:
                run_automation(a, "scheduled run")
            except HTTPException:  # out of credits: skip this slot
                F.automation_update(a["id"], last_run=time.time())
            except Exception:
                pass


@app.on_event("startup")
async def start_scheduler():
    if DEMO:
        return
    for a in F.automations():  # recompute after a restart so missed slots don't all fire at once
        F.automation_update(a["id"])
    asyncio.create_task(scheduler())


@app.get("/api/automations")
def automations_list():
    return F.automations()


@app.post("/api/automations")
def automations_save(payload: dict = Body(...)):
    try:
        return F.automation_save(payload)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.patch("/api/automations/{aid}")
def automations_toggle(aid: str, payload: dict = Body(...)):
    F.automation_update(aid, enabled=bool(payload.get("enabled")))
    return {"ok": True}


@app.delete("/api/automations/{aid}")
def automations_delete(aid: str):
    if not F.automation_delete(aid):
        raise HTTPException(404, "Not found")
    return {"ok": True}


@app.post("/api/automations/{aid}/run")
async def automations_run(aid: str):  # async: starting a task needs the event loop
    a = next((x for x in F.automations() if x["id"] == aid), None)
    if not a:
        raise HTTPException(404, "Not found")
    return {"task_id": run_automation(a, "run manually")}


@app.post("/api/hooks/{token}")
async def automation_webhook(token: str, payload: dict | None = Body(None)):
    """Trigger automations: POST any JSON here to start a run; the JSON is handed to the task as data."""
    a = F.automation_by_token(token)
    if not a or a["kind"] != "trigger" or not a.get("enabled"):
        raise HTTPException(404, "Unknown or disabled trigger")
    return {"task_id": run_automation(a, "triggered by webhook", json.dumps(payload or {}, indent=1))}


@app.get("/")
@app.get("/task/{task_id}")
@app.get("/project/{task_id}")
@app.get("/library")
@app.get("/automations")
@app.get("/plugins")
@app.get("/usage")
def index(task_id: str | None = None):
    return FileResponse(STATIC / "index.html")


app.mount("/static", StaticFiles(directory=STATIC), name="static")
