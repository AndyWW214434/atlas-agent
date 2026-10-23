"""Export the read-only replay demo as a static website (no server) into deploy/static/.

    .venv/bin/python deploy/build_static.py TASK_ID [TASK_ID ...]

Builds the cleaned demo data with build_hf.py, runs that demo once locally to capture every API response as a
.json file, copies task files to the paths the UI already uses, and adds a shim so the UI reads those files.
Suitable for any static host (Hugging Face static Spaces, GitHub Pages, Netlify, ...).
"""

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HF = ROOT / "deploy" / "hf"
OUT = ROOT / "deploy" / "static"
PAGES = ["library", "automations", "plugins", "usage"]

SPACE_README = """---
title: Atlas Demo
emoji: 🧭
colorFrom: gray
colorTo: blue
sdk: static
app_file: index.html
pinned: false
---

# Atlas: an autonomous AI agent (read-only demo)

Atlas plans a task, browses the web, runs code and writes files on its own, powered by Claude.

This is a **replay demo** served as a static site: open the example task in the sidebar to watch a recorded run play
back step by step, including the agent's computer view and the files it produced. Every page can be explored.
Nothing runs here: no server, no AI calls, and no API key.
"""


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def get(port: int, path: str) -> bytes:
    with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=10) as r:
        return r.read()


def snapshot(port: int, task_id: str) -> bytes:
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/tasks/{task_id}/stream", timeout=10) as r:
        for raw in r:
            line = raw.decode().strip()
            if line.startswith("data: "):
                return line[6:].encode()
    raise RuntimeError("no snapshot")


def write(rel: str, data: bytes):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def main():
    ids = sys.argv[1:]
    if not ids:
        sys.exit(__doc__)
    subprocess.run([sys.executable, str(ROOT / "deploy" / "build_hf.py"), *ids], check=True)

    port = free_port()
    env = {k: v for k, v in os.environ.items() if k not in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN")}
    env.update(ATLAS_DEMO="1", ATLAS_USER_NAME="Guest", ATLAS_DATA=str(HF / "data"))
    server = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.server:app", "--port", str(port)],
                              cwd=HF, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                get(port, "/api/config")
                break
            except OSError:
                time.sleep(0.2)
        if OUT.exists():
            shutil.rmtree(OUT)
        OUT.mkdir(parents=True)
        for ep in ["config", "tasks", "projects", "plugins", "credits", "usage", "library", "automations", "vault"]:
            write(f"api/{ep}.json", get(port, f"/api/{ep}"))
        for task_id in ids:
            write(f"api/tasks/{task_id}/snapshot.json", snapshot(port, task_id))
            write(f"api/tasks/{task_id}/files.json", get(port, f"/api/tasks/{task_id}/files"))
    finally:
        server.terminate()
        server.wait()

    # Raw files at the same URLs the UI uses on the live server.
    for task_id in ids:
        src = HF / "data" / "tasks" / task_id
        if (src / "workspace").exists():
            shutil.copytree(src / "workspace", OUT / "api" / "tasks" / task_id / "files", dirs_exist_ok=True)
        if (src / "shots").exists():
            shutil.copytree(src / "shots", OUT / "api" / "tasks" / task_id / "shots", dirs_exist_ok=True)

    shutil.copytree(HF / "static", OUT / "static")
    html = (HF / "static" / "index.html").read_text()
    html = html.replace('<script src="/static/markdown.js"></script>',
                        '<script src="/static/static-shim.js"></script>\n<script src="/static/markdown.js"></script>', 1)
    assert "static-shim.js" in html
    # The same page at every app route, so links and reloads work on a static host.
    for rel in ["index.html", "404.html", *[f"{p}/index.html" for p in PAGES], *[f"task/{t}/index.html" for t in ids]]:
        write(rel, html.encode())
    write("README.md", SPACE_README.encode())

    leaks = [p for p in OUT.rglob("*") if p.is_file() and p.suffix in {".json", ".html", ".md", ".js", ".ipynb"}
             and re.search(r"/Users/|sk-ant-", p.read_text(errors="ignore"))]
    if leaks:
        sys.exit("Personal details left in: " + ", ".join(str(p.relative_to(OUT)) for p in leaks))
    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"Static site in {OUT.relative_to(ROOT)} ({size / 1e6:.1f} MB, {sum(1 for _ in OUT.rglob('*') if _.is_file())} files)")


if __name__ == "__main__":
    main()
