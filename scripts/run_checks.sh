#!/usr/bin/env bash
set -euo pipefail

echo "Running backend smoke test..."
cd "$(dirname "${BASH_SOURCE[0]}")/../backend"
PYTHONPATH=. python scripts/smoke_test.py

echo "System check passed. Start the app with ./scripts/dev.sh or docker compose up --build."
