"""Render HTML to an image or a video with headless Chrome. Used by the agent in Design and Video tasks.

    python media.py png   page.html out.png   [--size 1080x1350]
    python media.py video page.html out.webm  [--size 1920x1080] [--seconds 8]

The page is loaded from disk; for video, its CSS/JS animation is recorded from the first frame for --seconds.
"""

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


def launch(p):
    try:
        return p.chromium.launch(channel="chrome", headless=True)
    except Exception:
        return p.chromium.launch(headless=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["png", "video"])
    ap.add_argument("page")
    ap.add_argument("out")
    ap.add_argument("--size", default=None, help="WIDTHxHEIGHT")
    ap.add_argument("--seconds", type=float, default=8)
    args = ap.parse_args()

    page_path = Path(args.page).resolve()
    if not page_path.is_file():
        sys.exit(f"Page not found: {page_path}")
    default = "1080x1350" if args.kind == "png" else "1920x1080"
    w, h = (int(x) for x in (args.size or default).lower().split("x"))
    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = launch(p)
        if args.kind == "png":
            page = browser.new_page(viewport={"width": w, "height": h})
            page.goto(page_path.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(400)
            page.screenshot(path=str(out), full_page=False)
        else:
            tmp = Path(tempfile.mkdtemp())
            ctx = browser.new_context(viewport={"width": w, "height": h}, record_video_dir=str(tmp),
                                      record_video_size={"width": w, "height": h})
            page = ctx.new_page()
            page.goto(page_path.as_uri(), wait_until="load")
            page.wait_for_timeout(int(args.seconds * 1000))
            video = page.video
            ctx.close()
            src = Path(video.path())
            shutil.move(str(src), out.with_suffix(".webm"))
            shutil.rmtree(tmp, ignore_errors=True)
            out = out.with_suffix(".webm")
        browser.close()
    print(f"Saved {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
