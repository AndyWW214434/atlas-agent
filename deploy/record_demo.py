"""Record a walkthrough video of Atlas doing a real task, plus a short GIF preview for the README.

    .venv/bin/python deploy/record_demo.py [BASE_URL] [OUT_DIR]

Drives a running Atlas (default http://127.0.0.1:7863) with headless Chrome: opens Build -> Website, types a task,
lets the agent run it live, opens the result, then tours Create, Library, Automations and Plugins. Writes
OUT_DIR/atlas-demo.webm (the full run, real time) and OUT_DIR/atlas-demo.gif (a sped-up preview).
Run it against a separate Atlas started with a fresh ATLAS_DATA folder so no personal tasks appear on screen.
The task is real, so it is billed to that server's API key.
"""

import io
import shutil
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:7863"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "docs")
W, H = 1280, 800
TASK = "Build a landing page for a local yoga studio called Still Water, with a class schedule, pricing and a contact form"
frames: list[tuple[bytes, int]] = []  # (png, how long to show it in the GIF, ms)


def snap(page, hold=700):
    frames.append((page.screenshot(type="png"), hold))


def pause(page, ms, hold=None):
    page.wait_for_timeout(ms)
    if hold:
        snap(page, hold)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome", headless=True)
        except Exception:
            browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": W, "height": H}, record_video_dir=str(tmp),
                                  record_video_size={"width": W, "height": H})
        page = ctx.new_page()

        page.goto(BASE, wait_until="networkidle")
        pause(page, 1500, hold=1600)
        page.hover("[data-start=build]")
        pause(page, 700, hold=700)
        page.click("[data-start=build]")
        pause(page, 1200, hold=1300)
        page.click("[data-opt=website]")
        pause(page, 1200, hold=1300)
        box = page.locator("#home-composer textarea")
        box.click()
        box.type(TASK, delay=22)
        pause(page, 600, hold=1500)
        page.keyboard.press("Enter")
        page.wait_for_url("**/task/**", timeout=20000)
        task_id = page.url.rstrip("/").rsplit("/", 1)[-1]

        # Let the agent work; keep a frame every few seconds for the time-lapse GIF.
        start = time.time()
        while time.time() - start < 420:
            page.wait_for_timeout(3000)
            snap(page, 450)
            tasks = page.evaluate("fetch('/api/tasks').then(r => r.json())")
            status = next((t["status"] for t in tasks if t["id"] == task_id), "running")
            if status != "running" and time.time() - start > 8:
                break
        pause(page, 2000, hold=2000)

        # Open the website it built.
        card = page.locator(".file-card", has_text="index.html").first
        if card.count():
            card.click()
            pause(page, 3000, hold=2500)
            page.mouse.move(W / 2, H / 2)
            for _ in range(3):
                page.mouse.wheel(0, 500)
                pause(page, 1200, hold=1100)
            page.keyboard.press("Escape")
            pause(page, 800)

        # Quick tour of the other pages.
        page.click(".sb-nav [data-nav=home]")
        pause(page, 1000)
        page.click("[data-start=create]")
        pause(page, 1500, hold=1500)
        page.click("[data-hp-close]")
        for nav in ("automations", "plugins"):
            page.click(f".sb-nav [data-nav={nav}]")
            pause(page, 2200, hold=1500)
        page.click(".sb-nav [data-nav=home]")
        pause(page, 1500, hold=1800)

        video = page.video
        ctx.close()
        browser.close()
        shutil.move(video.path(), OUT / "atlas-demo.webm")
    shutil.rmtree(tmp, ignore_errors=True)

    # Sped-up GIF preview: every captured frame, downscaled, with per-frame durations.
    imgs, durations = [], []
    for png, hold in frames:
        im = Image.open(io.BytesIO(png)).convert("RGB").resize((960, 600), Image.LANCZOS)
        imgs.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
        durations.append(hold)
    imgs[0].save(OUT / "atlas-demo.gif", save_all=True, append_images=imgs[1:], duration=durations, loop=0, optimize=True)

    for name in ("atlas-demo.webm", "atlas-demo.gif"):
        print(f"{OUT / name}: {(OUT / name).stat().st_size / 1e6:.1f} MB")
    print(f"task {task_id}, {len(frames)} GIF frames")


if __name__ == "__main__":
    main()
