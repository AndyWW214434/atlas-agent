"""Where Atlas keeps its data.

Local mode (the default): JSON files and folders under data/, for one person on their own computer.
Cloud mode (SUPABASE_URL is set): every signed-in user's records live in Supabase Postgres and their files in Supabase
Storage, written only by this server with the project's secret key. The local data folder is then just a cache.

Cloud writes go through one background thread (latest write wins per record), so a slow database never stalls the
live task stream. Reads are served from memory after the first one.
"""

import contextvars
import json
import logging
import os
import threading
import time
from pathlib import Path

log = logging.getLogger("atlas.store")

ROOT = Path(os.environ.get("ATLAS_DATA") or Path(__file__).resolve().parent.parent / "data")
ROOT.mkdir(parents=True, exist_ok=True)
CLOUD = bool(os.environ.get("SUPABASE_URL"))
BUCKET = "atlas-files"
GLOBAL = "global"

# The signed-in user for the current request or task (cloud mode only).
current_user: contextvars.ContextVar[str | None] = contextvars.ContextVar("atlas_user", default=None)
current_email: contextvars.ContextVar[str] = contextvars.ContextVar("atlas_email", default="")


def owner() -> str:
    uid = current_user.get()
    if CLOUD and not uid:
        raise RuntimeError("No signed-in user for this operation")
    return uid or "local"


def user_dir(uid: str | None = None) -> Path:
    """Local folder for one user's files (the data folder itself in local mode, a cache in cloud mode)."""
    if not CLOUD:
        return ROOT
    d = ROOT / "users" / (uid or owner())
    d.mkdir(parents=True, exist_ok=True)
    return d


def _copy(obj):
    return json.loads(json.dumps(obj))


_client = None


def db():
    global _client
    if _client is None:
        from supabase import create_client

        _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
    return _client


# ---------------------------------------------------------------------------
# Background writer
# ---------------------------------------------------------------------------

_pending: dict[tuple, tuple] = {}
_busy = 0
_cv = threading.Condition()


def _enqueue(key: tuple, fn, *args):
    with _cv:
        _pending.pop(key, None)  # newest write replaces an unsent older one
        _pending[key] = (fn, args, 0)
        _cv.notify_all()


def _writer():
    global _busy
    while True:
        with _cv:
            while not _pending:
                _cv.wait()
            key = next(iter(_pending))
            fn, args, tries = _pending.pop(key)
            _busy += 1
        try:
            fn(*args)
        except Exception as e:
            log.warning("cloud write %s failed (try %d): %s", key, tries + 1, e)
            if tries < 5:
                time.sleep(min(2 ** tries, 20))
                with _cv:
                    _pending.setdefault(key, (fn, args, tries + 1))
        finally:
            with _cv:
                _busy -= 1
                _cv.notify_all()


def flush(timeout: float = 20):
    """Wait for queued cloud writes (used at shutdown)."""
    end = time.time() + timeout
    with _cv:
        while (_pending or _busy) and time.time() < end:
            _cv.wait(0.2)


if CLOUD:
    threading.Thread(target=_writer, name="atlas-cloud-writer", daemon=True).start()


# ---------------------------------------------------------------------------
# Small JSON records (one per user and name)
# ---------------------------------------------------------------------------

_kv: dict[tuple[str, str], object] = {}
_kv_lock = threading.Lock()


def load(name: str, default, scope: str | None = None):
    """A user's record, e.g. load('projects.json', []). Callers may mutate the result and save() it back."""
    if not CLOUD:
        try:
            return json.loads((ROOT / name).read_text())
        except (OSError, ValueError):
            return default
    key = (scope or owner(), name)
    with _kv_lock:
        if key in _kv:
            return _copy(_kv[key])
    rows = db().table("atlas_kv").select("value").eq("owner", key[0]).eq("name", name).execute().data
    with _kv_lock:
        value = _kv.setdefault(key, rows[0]["value"] if rows else default)
    return _copy(value)


def save(name: str, obj, scope: str | None = None, private: bool = False):
    if not CLOUD:
        tmp = ROOT / (name + ".tmp")
        if private:  # owner-only file permissions
            fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            with os.fdopen(fd, "w") as f:
                json.dump(obj, f)
        else:
            tmp.write_text(json.dumps(obj, indent=1))
        tmp.replace(ROOT / name)
        return
    key = (scope or owner(), name)
    value = _copy(obj)
    with _kv_lock:
        _kv[key] = value
    _enqueue(("kv", *key), _kv_write, key[0], name, value)


def _kv_write(who: str, name: str, value):
    db().table("atlas_kv").upsert({"owner": who, "name": name, "value": value, "updated_at": "now"},
                                  on_conflict="owner,name").execute()


def owners_with(name: str) -> list[str]:
    """Users who have a given record (e.g. automations), for app-wide jobs such as the scheduler."""
    if not CLOUD:
        return ["local"]
    rows = db().table("atlas_kv").select("owner").eq("name", name).neq("owner", GLOBAL).execute().data
    with _kv_lock:
        cached = {k[0] for k in _kv if k[1] == name and k[0] != GLOBAL}
    return sorted({r["owner"] for r in rows} | cached)


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

def tasks_dir(uid: str | None = None) -> Path:
    d = user_dir(uid) / "tasks"
    d.mkdir(parents=True, exist_ok=True)
    return d


def task_save(uid: str | None, payload: dict):
    if not CLOUD:
        d = tasks_dir() / payload["id"]
        d.mkdir(parents=True, exist_ok=True)
        tmp = d / "task.json.tmp"
        tmp.write_text(json.dumps(payload))
        tmp.replace(d / "task.json")
        return
    row = {"id": payload["id"], "user_id": uid, "title": payload.get("title", "")[:200],
           "status": payload.get("status", "idle"), "data": _copy(payload), "updated_at": "now"}
    _enqueue(("task", payload["id"]), lambda: db().table("atlas_tasks").upsert(row).execute())


def tasks_load(uid: str | None = None) -> list[dict]:
    if not CLOUD:
        out = []
        for path in tasks_dir().glob("*/task.json"):
            try:
                out.append(json.loads(path.read_text()))
            except (OSError, ValueError):
                continue
        return out
    rows = db().table("atlas_tasks").select("data").eq("user_id", uid).execute().data
    return [r["data"] for r in rows]


def task_delete(uid: str | None, task_id: str):
    if CLOUD:
        _enqueue(("task", task_id), lambda: db().table("atlas_tasks").delete().eq("id", task_id).eq("user_id", uid).execute())
        _enqueue(("blobs", uid, task_id), blob_delete_tree, uid, f"tasks/{task_id}")


# ---------------------------------------------------------------------------
# Files (Library uploads, task outputs, screenshots), keyed by a path inside the user's folder
# ---------------------------------------------------------------------------

def blob_put(key: str, data: bytes, uid: str | None = None, content_type: str = "application/octet-stream"):
    """Store bytes at <user folder>/<key>; in cloud mode also upload them to Storage."""
    path = user_dir(uid) / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    if CLOUD:
        remote = f"{uid or owner()}/{key}"
        _enqueue(("blob", remote), lambda: db().storage.from_(BUCKET).upload(
            remote, data, {"upsert": "true", "content-type": content_type}))


def blob_path(key: str, uid: str | None = None) -> Path | None:
    """A local copy of a stored file, downloading it from Storage into the cache if needed."""
    path = user_dir(uid) / key
    if path.is_file() or not CLOUD:
        return path if path.is_file() else None
    try:
        data = db().storage.from_(BUCKET).download(f"{uid or owner()}/{key}")
    except Exception:
        return None
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def blob_delete_tree(uid: str, prefix: str):
    """Remove every stored file under a folder (Storage has no recursive delete)."""
    bucket = db().storage.from_(BUCKET)

    def walk(folder: str) -> list[str]:
        out = []
        for entry in bucket.list(folder, {"limit": 1000}):
            full = f"{folder}/{entry['name']}"
            out += walk(full) if entry.get("id") is None else [full]
        return out

    paths = walk(f"{uid}/{prefix}")
    for i in range(0, len(paths), 500):
        bucket.remove(paths[i:i + 500])
