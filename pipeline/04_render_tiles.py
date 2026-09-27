#!/usr/bin/env python3
"""
DEEPLENS - Pipeline Step 04: Render Cloud-Optimized XYZ Web Mercator PNG Tiles
Generates tiles/{variable}/{YYYY-MM}/{depth_m}m/{z}/{x}/{y}.png and tiles/colormaps.json
"""

import os
import sys
import json
import math
import argparse
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from pathlib import Path
from scipy.interpolate import RegularGridInterpolator

try:
    import cmocean
    CMAP_TEMP = cmocean.cm.thermal
    CMAP_SALT = cmocean.cm.haline
except ImportError:
    CMAP_TEMP = plt.cm.inferno
    CMAP_SALT = plt.cm.viridis

BASE_DIR = Path(__file__).resolve().parent.parent
ZARR_PATH = BASE_DIR / "data" / "processed" / "model.zarr"
TILES_DIR = BASE_DIR / "tiles"
TILES_DIR.mkdir(parents=True, exist_ok=True)
COLORMAPS_FILE = TILES_DIR / "colormaps.json"

COLOR_RANGES = {
    "temperature": {
        "min": 2.0,
        "max": 31.0,
        "unit": "°C",
        "cmap_name": "thermal"
    },
    "salinity": {
        "min": 31.5,
        "max": 37.0,
        "unit": "PSU",
        "cmap_name": "haline"
    }
}

def load_zarr_array(group_path: Path, name: str) -> tuple[np.ndarray, list]:
    arr_dir = group_path / name
    with open(arr_dir / ".zarray", "r", encoding="utf-8") as f:
        meta = json.load(f)
        
    shape = meta["shape"]
    chunk_file = arr_dir / ".".join(["0"] * len(shape))
    with open(chunk_file, "rb") as f:
        raw_bytes = f.read()
        
    arr = np.frombuffer(raw_bytes, dtype="<f4").reshape(shape)
    return arr

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def num2deg(xtile, ytile, zoom):
    n = 2.0 ** zoom
    lon_min = xtile / n * 360.0 - 180.0
    lat_rad_max = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_max = math.degrees(lat_rad_max)
    
    lon_max = (xtile + 1) / n * 360.0 - 180.0
    lat_rad_min = math.atan(math.sinh(math.pi * (1 - 2 * (ytile + 1) / n)))
    lat_min = math.degrees(lat_rad_min)
    
    return lon_min, lat_min, lon_max, lat_max

def render_tile_slice(interpolator, vmin, vmax, cmap, lon_min, lat_min, lon_max, lat_max, tile_size=256):
    y_norm = np.linspace(0, 1, tile_size)
    x_norm = np.linspace(0, 1, tile_size)
    
    lat_rad_max = math.radians(lat_max)
    lat_rad_min = math.radians(lat_min)
    merc_y_max = math.asinh(math.tan(lat_rad_max))
    merc_y_min = math.asinh(math.tan(lat_rad_min))
    
    merc_y = merc_y_max - y_norm * (merc_y_max - merc_y_min)
    lats = np.degrees(np.arctan(np.sinh(merc_y)))
    lons = lon_min + x_norm * (lon_max - lon_min)
    
    grid_lats, grid_lons = np.meshgrid(lats, lons, indexing="ij")
    points = np.stack([grid_lats.ravel(), grid_lons.ravel()], axis=-1)
    
    try:
        sampled_vals = interpolator(points).reshape(tile_size, tile_size)
    except Exception:
        return None
        
    valid_mask = ~np.isnan(sampled_vals)
    if not np.any(valid_mask):
        return None
        
    norm_vals = np.clip((sampled_vals - vmin) / (vmax - vmin), 0.0, 1.0)
    rgba = cmap(norm_vals)
    rgba[..., 3] = np.where(valid_mask, 0.88, 0.0)
    
    rgba_bytes = (rgba * 255).astype(np.uint8)
    return Image.fromarray(rgba_bytes, mode="RGBA")

def render_all_tiles(max_zoom: int = 4):
    if not ZARR_PATH.exists():
        print(f"[!] Error: Zarr not found at {ZARR_PATH}. Run 03_harmonize.py first.")
        sys.exit(1)
        
    print(f"[*] Opening Zarr dataset from {ZARR_PATH}...")
    lats_grid = load_zarr_array(ZARR_PATH, "latitude")
    lons_grid = load_zarr_array(ZARR_PATH, "longitude")
    depths = load_zarr_array(ZARR_PATH, "depth")
    
    with open(ZARR_PATH / "times.json", "r", encoding="utf-8") as f:
        times = json.load(f)
        
    with open(COLORMAPS_FILE, "w", encoding="utf-8") as f:
        json.dump(COLOR_RANGES, f, indent=2)
    print(f"[+] Wrote colormaps configuration: {COLORMAPS_FILE}")
    
    total_tiles = 0
    min_lon_box, min_lat_box, max_lon_box, max_lat_box = 20.0, -40.0, 120.0, 25.0
    
    variables = ["temperature", "salinity"]
    
    for var in variables:
        cmap = CMAP_TEMP if var == "temperature" else CMAP_SALT
        vmin = COLOR_RANGES[var]["min"]
        vmax = COLOR_RANGES[var]["max"]
        
        var_data = load_zarr_array(ZARR_PATH, var)
        
        for t_idx, month_str in enumerate(times):
            for d_idx, d_val in enumerate(depths):
                depth_int = int(d_val)
                data_slice = var_data[t_idx, d_idx, :, :]
                
                interpolator = RegularGridInterpolator(
                    (lats_grid, lons_grid),
                    data_slice,
                    bounds_error=False,
                    fill_value=np.nan
                )
                
                for z in range(2, max_zoom + 1):
                    x_min_t, y_max_t = deg2num(min_lat_box, min_lon_box, z)
                    x_max_t, y_min_t = deg2num(max_lat_box, max_lon_box, z)
                    
                    x_start = min(x_min_t, x_max_t)
                    x_end = max(x_min_t, x_max_t)
                    y_start = min(y_min_t, y_max_t)
                    y_end = max(y_min_t, y_max_t)
                    
                    for x in range(x_start, x_end + 1):
                        for y in range(y_start, y_end + 1):
                            lon_min, lat_min, lon_max, lat_max = num2deg(x, y, z)
                            
                            if lon_max < min_lon_box or lon_min > max_lon_box or lat_max < min_lat_box or lat_min > max_lat_box:
                                continue
                                
                            img = render_tile_slice(interpolator, vmin, vmax, cmap, lon_min, lat_min, lon_max, lat_max)
                            if img is not None:
                                tile_dir = TILES_DIR / var / month_str / f"{depth_int}m" / str(z) / str(x)
                                tile_dir.mkdir(parents=True, exist_ok=True)
                                tile_file = tile_dir / f"{y}.png"
                                img.save(tile_file, format="PNG", optimize=True)
                                total_tiles += 1
                                
            print(f"  [+] Rendered {var} for {month_str} (Progress: {total_tiles} tiles generated)")
            
    print(f"\n[+] Render Complete! Total XYZ PNG tiles created: {total_tiles}")

def main():
    parser = argparse.ArgumentParser(description="DEEPLENS - Render XYZ PNG Tiles")
    parser.add_argument("--max-zoom", type=int, default=4, help="Maximum zoom level (default: 4)")
    args = parser.parse_args()
    
    render_all_tiles(max_zoom=args.max_zoom)

if __name__ == "__main__":
    main()
