"""Build the E2B sandbox template that cloud-mode tasks run in. Run once, and again after changing the files it copies.

    E2B_API_KEY=e2b_... .venv/bin/python deploy/e2b_template.py

It's a Debian Linux image with Python 3.12, Chromium (via Playwright), ffmpeg, espeak-ng, the usual data and document
libraries, and Atlas's sandbox helper (app/sandbox_helper.py with the browser and file tools it reuses). The build runs
in E2B's cloud and takes a few minutes. The name it registers (E2B_TEMPLATE, default atlas-sandbox) is the one the
server uses.
"""

import os
from pathlib import Path

from e2b import Template, default_build_logger

ROOT = Path(__file__).resolve().parent.parent
NAME = os.environ.get("E2B_TEMPLATE", "atlas-sandbox")
HELPER_FILES = ["app/__init__.py", "app/tools.py", "app/browser.py", "app/media.py", "app/sandbox_helper.py"]
PACKAGES = [
    "fastapi", "uvicorn", "playwright", "cryptography",  # the helper and its browser
    "numpy", "pandas", "matplotlib", "seaborn", "scipy", "pillow", "requests", "beautifulsoup4", "lxml",
    "nbformat", "nbclient", "ipykernel", "openpyxl", "python-docx", "python-pptx", "markdown",
]

template = (
    Template(file_context_path=ROOT)
    .from_python_image("3.12")
    .set_envs({"PLAYWRIGHT_BROWSERS_PATH": "/opt/ms-playwright", "PYTHONUNBUFFERED": "1"})
    .apt_install(["ffmpeg", "espeak-ng", "fonts-noto", "fonts-noto-color-emoji", "fonts-liberation", "procps", "sudo"],
                 no_install_recommends=True)
    .pip_install(PACKAGES)
    .run_cmd("playwright install --with-deps chromium && chmod -R a+rX /opt/ms-playwright", user="root")
    .run_cmd("python3 -m ipykernel install --name python3", user="root")
    .make_dir("/opt/atlas/app", user="root")
    .copy(HELPER_FILES, "/opt/atlas/app/", user="root")
    .run_cmd("chmod -R a+rX /opt/atlas && mkdir -p /home/user/workspace /home/user/.atlas "
             "&& chown -R user:user /home/user/workspace /home/user/.atlas", user="root")
)

if __name__ == "__main__":
    info = Template.build(template, NAME, cpu_count=2, memory_mb=2048, on_build_logs=default_build_logger())
    print(f"\nBuilt template '{NAME}': {info}")
