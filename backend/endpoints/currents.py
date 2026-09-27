"""
DEEPLENS - Ocean Currents Endpoint
Provides surface and subsurface velocity vector fields (u, v) for particle advection
"""

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.utils.dataset import dataset_engine

router = APIRouter(prefix="/api", tags=["currents"])

@router.get("/currents")
async def get_currents(
    month: Optional[str] = Query("2023-06", description="Month YYYY-MM"),
    depth: float = Query(0.0, description="Depth level in meters"),
    step: int = Query(2, ge=1, le=5, description="Subsampling step factor")
):
    dataset_engine.load()
    if "u" not in dataset_engine.variables or "v" not in dataset_engine.variables:
        raise HTTPException(status_code=404, detail="Current velocity variables not present")
        
    t_idx = dataset_engine.times.index(month) if month in dataset_engine.times else 0
    
    # Nearest depth index
    d_idx = int(np.argmin(np.abs(dataset_engine.depths - depth)))
    
    u_grid = dataset_engine.variables["u"][t_idx, d_idx]
    v_grid = dataset_engine.variables["v"][t_idx, d_idx]
    
    lats = dataset_engine.lats[::step]
    lons = dataset_engine.lons[::step]
    u_sub = u_grid[::step, ::step]
    v_sub = v_grid[::step, ::step]
    
    vectors = []
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            u = u_sub[i, j]
            v = v_sub[i, j]
            if not np.isnan(u) and not np.isnan(v):
                speed = float(np.sqrt(u**2 + v**2))
                if speed > 0.001:
                    vectors.append({
                        "lat": round(float(lat), 2),
                        "lon": round(float(lon), 2),
                        "u": round(float(u), 3),
                        "v": round(float(v), 3),
                        "speed": round(speed, 3)
                    })
                    
    return {
        "month": month,
        "depth": float(dataset_engine.depths[d_idx]),
        "count": len(vectors),
        "bounds": {
            "min_lon": float(lons.min()),
            "max_lon": float(lons.max()),
            "min_lat": float(lats.min()),
            "max_lat": float(lats.max())
        },
        "vectors": vectors
    }
