#!/usr/bin/env python3
"""
DEEPLENS - Pipeline Step 05: Export Unified Cloud-Optimized Zarr Store
Consolidates 3D model variables into data/processed/deeplens.zarr for real-time backend slicing
"""

import os
import sys
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_ZARR = BASE_DIR / "data" / "processed" / "model.zarr"
DEEPLENS_ZARR = BASE_DIR / "data" / "processed" / "deeplens.zarr"

def export_unified_zarr():
    if not MODEL_ZARR.exists():
        print(f"[!] Error: Model Zarr not found at {MODEL_ZARR}. Run 03_harmonize.py first.")
        sys.exit(1)
        
    print(f"[*] Exporting unified Zarr store from {MODEL_ZARR} to {DEEPLENS_ZARR}...")
    if DEEPLENS_ZARR.exists():
        shutil.rmtree(DEEPLENS_ZARR, ignore_errors=True)
        
    shutil.copytree(MODEL_ZARR, DEEPLENS_ZARR, dirs_exist_ok=True)
    print(f"[+] Successfully exported {DEEPLENS_ZARR}")
    print(f"    - Ready for sub-second backend point queries and cross-sections.")

def main():
    export_unified_zarr()

if __name__ == "__main__":
    main()
