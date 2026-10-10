#!/usr/bin/env bash
# Starts the back end and the three sites. Stop everything with Ctrl+C.
set -e
cd "$(dirname "$0")/.."
trap 'kill 0' EXIT
( . .venv/bin/activate && uvicorn backend.main:app --port 8000 --reload ) &
( cd nyeras-site && npm run dev ) &
( cd prooftrail-app && npm run dev ) &
( cd nxtmove-site && npm run dev ) &
wait
