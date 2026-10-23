#!/usr/bin/env bash
# Start Atlas on http://localhost:8765
set -e
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
exec .venv/bin/uvicorn app.server:app --host 127.0.0.1 --port "${PORT:-8765}"
