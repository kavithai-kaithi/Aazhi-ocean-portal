#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "AAZHI Ocean Platform - Production Launch"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if [ ! -d "frontend/dist" ]; then
    echo "[!] Frontend build not detected. Running build first..."
    bash scripts/build.sh
fi

export ENVIRONMENT="production"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"

echo "[*] Starting production server on http://$HOST:$PORT"
exec uvicorn backend.main:app --host "$HOST" --port "$PORT" --workers 2
