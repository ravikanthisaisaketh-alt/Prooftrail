#!/usr/bin/env bash
# Starts the back end and the three sites on fixed ports. Stop everything with Ctrl+C.
set -e
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
export VITE_API_URL=${VITE_API_URL:-http://localhost:8000} VITE_NYERAS_URL=${VITE_NYERAS_URL:-http://localhost:5173}
export VITE_PROOFTRAIL_URL=${VITE_PROOFTRAIL_URL:-http://localhost:5174} VITE_NXTMOVE_URL=${VITE_NXTMOVE_URL:-http://localhost:5175}
export VITE_DEMO_MODE=${VITE_DEMO_MODE:-0}
trap 'kill 0' EXIT
( . .venv/bin/activate && uvicorn backend.main:app --port 8000 ) &
( cd nyeras-site && npm run dev ) &
( cd prooftrail-app && npm run dev ) &
( cd nxtmove-site && npm run dev ) &
sleep 3
echo "Nyeras (simulated):    $VITE_NYERAS_URL/login"
echo "ProofTrail (real):     $VITE_PROOFTRAIL_URL  (open it from a Nyeras course)"
echo "NxtMove (simulated):   $VITE_NXTMOVE_URL/job"
echo "Back end:              $VITE_API_URL/health"
wait
