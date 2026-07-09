#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting QuantRegimeTracer backend on :8000"
(
  cd "$ROOT/backend"
  PYTHONPATH=. uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "Starting QuantRegimeTracer frontend on :5173"
(
  cd "$ROOT/frontend"
  npm run dev -- --host 0.0.0.0
) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT
wait
