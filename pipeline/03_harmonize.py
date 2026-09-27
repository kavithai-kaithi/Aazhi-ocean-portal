#!/usr/bin/env python3
"""
DEEPLENS - Pipeline Step 03: Harmonize Model Coordinates, Standard Depth Levels & Units
Standardizes 3D model dataset to uniform grid and export to data/processed/model.zarr
"""

import os
import sys
import json
import shutil
import numpy as np
from pathlib import Path
from scipy.interpolate import interp1d

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_FILE = BASE_DIR / "data" / "raw" / "model_raw.npz"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
ZARR_OUTPUT = PROCESSED_DIR / "model.zarr"

STANDARD_DEPTHS = np.array([
    0, 5, 10, 25, 50, 75, 100, 125, 150, 200, 250, 300,
    400, 500, 600, 700, 800, 900, 1000, 1100, 1250, 1500, 1750, 2000
], dtype=np.float32)

def create_zarr_array(group_path: Path, name: str, data: np.ndarray, dims: list, units: str = ""):
    arr_dir = group_path / name
    arr_dir.mkdir(parents=True, exist_ok=True)
    
    shape = list(data.shape)
    chunks = shape  # Single chunk per coordinate or variable
    
    zarray_meta = {
        "zarr_format": 2,
        "shape": shape,
        "chunks": chunks,
        "dtype": "<f4" if data.dtype == np.float32 else str(data.dtype),
        "order": "C",
        "fill_value": "NaN" if np.issubdtype(data.dtype, np.floating) else None,
        "filters": None,
        "compressor": None
    }
    
    with open(arr_dir / ".zarray", "w", encoding="utf-8") as f:
        json.dump(zarray_meta, f, indent=2)
        
    with open(arr_dir / ".zattrs", "w", encoding="utf-8") as f:
        json.dump({"_ARRAY_DIMENSIONS": dims, "units": units}, f, indent=2)
        
    # Write binary chunk 0 (or multiple)
    chunk_name = ".".join(["0"] * len(shape))
    with open(arr_dir / chunk_name, "wb") as f:
        f.write(data.astype("<f4").tobytes())

def harmonize_model_data():
    if not RAW_FILE.exists():
        print(f"[!] Error: Raw model file not found at {RAW_FILE}. Run train_opendrift_model.py first.")
        sys.exit(1)
        
    print(f"[*] Opening raw model dataset: {RAW_FILE}...")
    raw = np.load(RAW_FILE)
    
    raw_depths = raw["depth"]
    lats = raw["latitude"]
    lons = raw["longitude"]
    times = raw["times"]
    
    raw_temp = raw["temperature"]
    raw_salt = raw["salinity"]
    raw_u = raw["u"]
    raw_v = raw["v"]
    raw_wind_u = raw["wind_u"] if "wind_u" in raw else None
    raw_wind_v = raw["wind_v"] if "wind_v" in raw else None
    raw_wave = raw["wave_height"] if "wave_height" in raw else None
    
    n_time, _, n_lat, n_lon = raw_temp.shape
    n_std_depth = len(STANDARD_DEPTHS)
    
    print(f"[*] Interpolating vertically onto {n_std_depth} standard depth levels (0-2000m)...")
    interp_temp = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    interp_salt = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    interp_u = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    interp_v = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    
    if raw_wind_u is not None:
        interp_wind_u = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
        interp_wind_v = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    if raw_wave is not None:
        interp_wave = np.zeros((n_time, n_std_depth, n_lat, n_lon), dtype=np.float32)
    
    for t in range(n_time):
        f_temp = interp1d(raw_depths, raw_temp[t], axis=0, fill_value="extrapolate", assume_sorted=True)
        f_salt = interp1d(raw_depths, raw_salt[t], axis=0, fill_value="extrapolate", assume_sorted=True)
        f_u = interp1d(raw_depths, raw_u[t], axis=0, fill_value="extrapolate", assume_sorted=True)
        f_v = interp1d(raw_depths, raw_v[t], axis=0, fill_value="extrapolate", assume_sorted=True)
        
        interp_temp[t] = f_temp(STANDARD_DEPTHS)
        interp_salt[t] = f_salt(STANDARD_DEPTHS)
        interp_u[t] = f_u(STANDARD_DEPTHS)
        interp_v[t] = f_v(STANDARD_DEPTHS)
        
        if raw_wind_u is not None:
            f_w_u = interp1d(raw_depths, raw_wind_u[t], axis=0, fill_value="extrapolate", assume_sorted=True)
            f_w_v = interp1d(raw_depths, raw_wind_v[t], axis=0, fill_value="extrapolate", assume_sorted=True)
            interp_wind_u[t] = f_w_u(STANDARD_DEPTHS)
            interp_wind_v[t] = f_w_v(STANDARD_DEPTHS)
            
        if raw_wave is not None:
            f_wave = interp1d(raw_depths, raw_wave[t], axis=0, fill_value="extrapolate", assume_sorted=True)
            interp_wave[t] = f_wave(STANDARD_DEPTHS)

    print(f"[*] Writing standard Zarr store to {ZARR_OUTPUT}...")
    if ZARR_OUTPUT.exists():
        shutil.rmtree(ZARR_OUTPUT, ignore_errors=True)
    ZARR_OUTPUT.mkdir(parents=True, exist_ok=True)
    
    with open(ZARR_OUTPUT / ".zgroup", "w", encoding="utf-8") as f:
        json.dump({"zarr_format": 2}, f, indent=2)
        
    with open(ZARR_OUTPUT / ".zattrs", "w", encoding="utf-8") as f:
        json.dump({
            "title": "DEEPLENS Indian Ocean OpenDrift Trained Harmonized Dataset",
            "institution": "OpenDrift / CMEMS Harmonized",
            "region": "Indian Ocean [20E-120E, 40S-25N]"
        }, f, indent=2)
        
    # Coordinates
    create_zarr_array(ZARR_OUTPUT, "latitude", lats, ["latitude"], "degrees_north")
    create_zarr_array(ZARR_OUTPUT, "longitude", lons, ["longitude"], "degrees_east")
    create_zarr_array(ZARR_OUTPUT, "depth", STANDARD_DEPTHS, ["depth"], "m")
    
    # Times metadata
    with open(ZARR_OUTPUT / "times.json", "w", encoding="utf-8") as f:
        json.dump(times.tolist(), f, indent=2)
        
    # Data variables
    dims_4d = ["time", "depth", "latitude", "longitude"]
    create_zarr_array(ZARR_OUTPUT, "temperature", interp_temp, dims_4d, "degC")
    create_zarr_array(ZARR_OUTPUT, "salinity", interp_salt, dims_4d, "psu")
    create_zarr_array(ZARR_OUTPUT, "u", interp_u, dims_4d, "m/s")
    create_zarr_array(ZARR_OUTPUT, "v", interp_v, dims_4d, "m/s")
    
    if raw_wind_u is not None:
        create_zarr_array(ZARR_OUTPUT, "wind_u", interp_wind_u, dims_4d, "m/s")
        create_zarr_array(ZARR_OUTPUT, "wind_v", interp_wind_v, dims_4d, "m/s")
    if raw_wave is not None:
        create_zarr_array(ZARR_OUTPUT, "wave_height", interp_wave, dims_4d, "m")
    
    print(f"[+] Successfully generated Zarr dataset at {ZARR_OUTPUT}")
    print(f"    - Depths: {len(STANDARD_DEPTHS)} levels [0m to 2000m]")
    print(f"    - Grid:   {n_lat} x {n_lon}")
    print(f"    - Times:  {n_time} months (2023–2026)")

def main():
    harmonize_model_data()

if __name__ == "__main__":
    main()

