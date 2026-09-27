#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "AAZHI Ocean Platform - Production Build"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[1/2] Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

echo "[2/2] Building optimized frontend bundle..."
npm run build

echo "=========================================================="
echo "✓ Production build completed successfully!"
echo "  Output Directory: $ROOT_DIR/frontend/dist"
echo "=========================================================="
