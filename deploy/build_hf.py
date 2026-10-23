"""Assemble the read-only replay demo for a Hugging Face Docker Space into deploy/hf/.

    .venv/bin/python deploy/build_hf.py TASK_ID [TASK_ID ...]

Copies the code, a Dockerfile and the Space README, plus the chosen example tasks with personal details removed:
no browser cookies (browser_state.json), and local paths/user names replaced. Nothing else from data/ is included.
"""

import getpass
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "deploy" / "hf"
USER = getpass.getuser()
TEXT_EXT = {".json", ".md", ".txt", ".html", ".htm", ".css", ".js", ".py", ".ipynb", ".csv", ".svg"}

DOCKERFILE = """FROM python:3.12-slim
RUN useradd -m -u 1000 user
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=user . .
USER user
ENV ATLAS_DEMO=1 ATLAS_USER_NAME=Guest ATLAS_DATA=/app/data PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "7860"]
"""

# The demo never calls the model or runs the browser, so it needs only the web server's dependencies.
REQUIREMENTS = "anthropic>=2.1\nfastapi\nuvicorn\npython-multipart\ncryptography\n"

SPACE_README = """---
title: Atlas Demo
emoji: 🧭
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Atlas: an autonomous AI agent (read-only demo)

Atlas plans a task, browses the web, runs code and writes files on its own, powered by Claude.

This is a **replay demo**: open an example task in the sidebar to watch a recorded run play back step by step,
including the agent's live computer view and the files it produced. Every page can be explored. Running new tasks
is turned off, and no API key is stored on this server.
"""


def scrub(text: str, task_dir: Path) -> str:
    text = text.replace(str(task_dir.resolve()), f"/app/data/tasks/{task_dir.name}")
    text = text.replace(str(ROOT), "/app")
    text = re.sub(r"/Users/[^/\"'\s]+", "/home/user", text)
    text = re.sub(r"/private/var/folders/[^\"'\s]+|/var/folders/[^\"'\s]+", "/tmp/...", text)
    text = re.sub(rf"\b{re.escape(USER)}\b", "user", text)  # e.g. file owners in `ls -l` output
    return text


def copy_task(task_id: str):
    src = ROOT / "data" / "tasks" / task_id
    if not (src / "task.json").is_file():
        sys.exit(f"No task {task_id}")
    data = json.loads((src / "task.json").read_text())
    if data.get("status") == "running":
        sys.exit(f"Task {task_id} is still running")
    dst = OUT / "data" / "tasks" / task_id
    for path in src.rglob("*"):
        rel = path.relative_to(src)
        if path.is_dir() or rel.name == "browser_state.json" or any(p.startswith(".") for p in rel.parts):
            continue
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() in TEXT_EXT:
            target.write_text(scrub(path.read_text(errors="replace"), src))
        else:
            shutil.copyfile(path, target)
    # Strip the conversation history the demo never sends anywhere; the UI only needs the events.
    task = json.loads((dst / "task.json").read_text())
    task["messages"] = [{"role": "user", "content": "(recorded)"}]
    task["status"] = "idle"
    (dst / "task.json").write_text(json.dumps(task))
    print(f"  task {task_id}: {task['title'][:60]}")


def main():
    ids = sys.argv[1:]
    if not ids:
        sys.exit(__doc__)
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for folder in ("app", "static"):
        shutil.copytree(ROOT / folder, OUT / folder, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    (OUT / "Dockerfile").write_text(DOCKERFILE)
    (OUT / "requirements.txt").write_text(REQUIREMENTS)
    (OUT / "README.md").write_text(SPACE_README)
    (OUT / "data" / "tasks").mkdir(parents=True)
    print("Example tasks:")
    for task_id in ids:
        copy_task(task_id)
    leaks = [p for p in OUT.rglob("*") if p.is_file() and p.suffix.lower() in TEXT_EXT
             and re.search(rf"/Users/|\b{re.escape(USER)}\b|sk-ant-", p.read_text(errors="ignore"))]
    if leaks:
        sys.exit("Personal details left in: " + ", ".join(str(p.relative_to(OUT)) for p in leaks))
    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"Built {OUT.relative_to(ROOT)} ({size / 1e6:.1f} MB), no personal paths, names or keys found.")


if __name__ == "__main__":
    main()
