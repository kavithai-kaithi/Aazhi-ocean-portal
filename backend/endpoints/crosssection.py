"""
DEEPLENS - Cross-Section Vertical Curtain Endpoint
Samples the 3D ocean dataset along a great-circle trajectory between two points across all depths.
"""

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.utils.dataset import dataset_engine
from backend.utils.interpolation import great_circle_path
from scipy.interpolate import RegularGridInterpolator

router = APIRouter(prefix="/api", tags=["crosssection"])

@router.get("/crosssection")
async def get_crosssection(
    lat1: float = Query(..., description="Start latitude"),
    lon1: float = Query(..., description="Start longitude"),
    lat2: float = Query(..., description="End latitude"),
    lon2: float = Query(..., description="End longitude"),
    month: Optional[str] = Query("2023-06", description="Month YYYY-MM"),
    variable: str = Query("temperature", description="Variable: temperature or salinity"),
    n_points: int = Query(75, ge=10, le=200, description="Number of sample points along transect")
):
    dataset_engine.load()
    var_name = "temperature" if variable == "temperature" else "salinity"
    unit_str = "°C" if variable == "temperature" else "PSU"
    
    if var_name not in dataset_engine.variables or dataset_engine.lats is None:
        raise HTTPException(status_code=404, detail="Model dataset not loaded")
        
    path_lats, path_lons, distances_km = great_circle_path(lat1, lon1, lat2, lon2, n_points=n_points)
    
    t_idx = dataset_engine.times.index(month) if month in dataset_engine.times else 0
    data_3d = dataset_engine.variables[var_name][t_idx] # (n_depth, n_lat, n_lon)
    
    depths = dataset_engine.depths.tolist()
    curtain_matrix = []
    
    for d_idx in range(len(depths)):
        interp = RegularGridInterpolator(
            (dataset_engine.lats, dataset_engine.lons),
            data_3d[d_idx],
            bounds_error=False,
            fill_value=np.nan
        )
        sample_pts = np.stack([path_lats, path_lons], axis=-1)
        row_vals = interp(sample_pts)
        row = [round(float(v), 2) if not np.isnan(v) else None for v in row_vals]
        curtain_matrix.append(row)
        
    points_coords = [{"lat": round(float(lat), 4), "lon": round(float(lon), 4)} for lat, lon in zip(path_lats, path_lons)]
    
    return {
        "start": {"lat": lat1, "lon": lon1},
        "end": {"lat": lat2, "lon": lon2},
        "variable": variable,
        "unit": unit_str,
        "month": month,
        "distance_km": distances_km.tolist(),
        "depth": depths,
        "values": curtain_matrix,
        "points": points_coords
    }
