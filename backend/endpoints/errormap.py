"""
DEEPLENS - Error Map Endpoint
Aggregates model-vs-float observation errors into a 2° x 2° spatial accuracy grid
"""

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from backend.utils.dataset import dataset_engine

router = APIRouter(prefix="/api", tags=["errormap"])

@router.get("/errormap")
async def get_errormap(
    month: Optional[str] = Query("2023-06", description="Month YYYY-MM"),
    variable: str = Query("temperature", description="Variable: temperature or salinity"),
    bin_size: float = Query(2.0, ge=1.0, le=5.0, description="Spatial bin resolution in degrees")
):
    dataset_engine.load()
    df = dataset_engine.argo_df
    
    if df is None or df.empty or dataset_engine.lats is None:
        return {"month": month, "variable": variable, "cells": []}
        
    filtered = df[df["month"] == month] if month else df
    if filtered.empty:
        filtered = df
        
    depth_col = "depth_m" if "depth_m" in df.columns else "depth"
    if variable == "temperature":
        var_col = "temp_c" if "temp_c" in df.columns else "temperature"
    else:
        var_col = "sal_psu" if "sal_psu" in df.columns else "salinity"

    profile_groups = filtered.groupby(["float_id", "date", "latitude", "longitude"])
    
    bin_diffs: Dict[tuple, List[float]] = {}
    
    for (f_id, p_date, lat, lon), group in profile_groups:
        b_lat = float(np.floor(lat / bin_size) * bin_size)
        b_lon = float(np.floor(lon / bin_size) * bin_size)
        bin_key = (b_lat, b_lon)
        
        depths = group[depth_col].values.tolist()
        obs_vals = group[var_col].values
        
        mod_aligned = dataset_engine.interpolate_profile("temperature" if variable == "temperature" else "salinity", month or "2023-06", float(lat), float(lon), depths)
        mod_arr = np.array([v if v is not None else np.nan for v in mod_aligned], dtype=np.float64)
        
        valid = (~np.isnan(mod_arr)) & (~np.isnan(obs_vals))
        if np.any(valid):
            diffs = (mod_arr[valid] - obs_vals[valid]).tolist()
            if bin_key not in bin_diffs:
                bin_diffs[bin_key] = []
            bin_diffs[bin_key].extend(diffs)
            
    cells = []
    for (b_lat, b_lon), diffs in bin_diffs.items():
        if len(diffs) > 0:
            diff_arr = np.array(diffs)
            bias = float(np.mean(diff_arr))
            rmse = float(np.sqrt(np.mean(diff_arr ** 2)))
            
            cells.append({
                "min_lat": round(float(b_lat), 2),
                "max_lat": round(float(b_lat + bin_size), 2),
                "min_lon": round(float(b_lon), 2),
                "max_lon": round(float(b_lon + bin_size), 2),
                "center_lat": round(float(b_lat + bin_size / 2.0), 2),
                "center_lon": round(float(b_lon + bin_size / 2.0), 2),
                "bias": round(bias, 3),
                "rmse": round(rmse, 3),
                "n_samples": len(diffs)
            })
            
    return {
        "month": month,
        "variable": variable,
        "unit": "°C" if variable == "temperature" else "PSU",
        "bin_size": bin_size,
        "count": len(cells),
        "cells": cells
    }
