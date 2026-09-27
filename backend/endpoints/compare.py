"""
AAZHI Ocean Platform - Model vs Observation Comparison Endpoint
Performs bilinear spatial interpolation and vertical alignment between numerical ocean model and Argo in-situ profiles.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from backend.utils.dataset import dataset_engine
from backend.utils.interpolation import calculate_profile_statistics

router = APIRouter(prefix="/api", tags=["compare"])

_COMPARE_CACHE: Dict[str, Dict[str, Any]] = {}

@router.get("/compare/{float_id}")
async def compare_float_vs_model(
    float_id: str,
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    date: Optional[str] = Query(None, description="Specific profile date YYYY-MM-DD"),
    variable: str = Query("temperature", description="Variable to compare: temperature or salinity")
):
    """
    Compares the Argo float vertical profile against the numerical ocean model:
    1. Extracts observed profile at (lat, lon, date)
    2. Performs spatial bilinear interpolation on 3D model dataset at exact coordinates
    3. Interpolates model profile vertically onto exact Argo sensor depth levels
    4. Computes scientific validation statistics: Bias, RMSE, and Correlation
    """
    dataset_engine.load()
    df = dataset_engine.argo_df
    
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Argo observations dataset not available")
        
    cache_key = f"{float_id}_{month}_{date}_{variable}"
    if cache_key in _COMPARE_CACHE:
        return _COMPARE_CACHE[cache_key]
        
    # Match float records by float_id or wmo
    clean_id = str(float_id).replace("ARGO-", "")
    float_rows = df[(df["float_id"].astype(str) == str(float_id)) | (df["wmo"].astype(str) == clean_id)]
    if float_rows.empty:
        raise HTTPException(status_code=404, detail=f"Float {float_id} not found in database")
        
    if date:
        profile_rows = float_rows[float_rows["date"].str.startswith(str(date))]
    elif month:
        month_suffix = month.split("-")[-1] if "-" in month else month
        matched_month = float_rows[float_rows["month"].str.endswith(f"-{month_suffix}")]
        if not matched_month.empty:
            latest_date = matched_month["date"].max()
            profile_rows = matched_month[matched_month["date"] == latest_date]
        else:
            latest_date = float_rows["date"].max()
            profile_rows = float_rows[float_rows["date"] == latest_date]
    else:
        latest_date = float_rows["date"].max()
        profile_rows = float_rows[float_rows["date"] == latest_date]
        
    depth_col = "depth_m" if "depth_m" in profile_rows.columns else "depth"
    profile_rows = profile_rows.sort_values(depth_col)
    first_row = profile_rows.iloc[0]
    
    float_lat = float(first_row["latitude"])
    float_lon = float(first_row["longitude"])
    profile_date = str(first_row["date"])
    target_month = month or profile_date[:7]
    
    depths = profile_rows[depth_col].astype(float).tolist()
    
    # Identify variable column
    if variable == "temperature":
        var_col = "temp_c" if "temp_c" in profile_rows.columns else "temperature"
    else:
        var_col = "sal_psu" if "sal_psu" in profile_rows.columns else "salinity"
        
    observed_vals = profile_rows[var_col].astype(float).tolist()
    
    # Bilinear + vertical interpolation
    model_vals = dataset_engine.interpolate_profile(
        "temperature" if variable == "temperature" else "salinity", 
        target_month, 
        float_lat, 
        float_lon, 
        depths
    )
    
    # Calculate Bias & RMSE
    stats = calculate_profile_statistics(model_vals, observed_vals)
    unit_str = "°C" if variable == "temperature" else "PSU"
    
    response_data = {
        "float": {
            "float_id": str(float_id),
            "wmo": str(first_row.get("wmo", clean_id)),
            "institution": str(first_row.get("institution", "INCOIS, India")),
            "dac": str(first_row.get("dac", "incois")),
            "profiler": str(first_row.get("profiler", "Sea-Bird SBE 41/41CP CTD")),
            "lat": round(float_lat, 4),
            "lon": round(float_lon, 4),
            "date": profile_date
        },
        "variable": variable,
        "unit": unit_str,
        "depths": depths,
        "observed": observed_vals,
        "model": model_vals,
        "stats": stats
    }
    
    if len(_COMPARE_CACHE) > 1000:
        _COMPARE_CACHE.pop(next(iter(_COMPARE_CACHE)))
    _COMPARE_CACHE[cache_key] = response_data
    
    return response_data
