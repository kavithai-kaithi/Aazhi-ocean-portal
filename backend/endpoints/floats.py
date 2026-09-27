"""
AAZHI Ocean Platform - Floats API Endpoint
Retrieves active Argo floats and vertical profile cast records from the Indian Ocean dataset
"""

from fastapi import APIRouter, Query
from typing import List, Optional
import pandas as pd
from pathlib import Path

router = APIRouter(prefix="/api", tags=["floats"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PARQUET_PATH = BASE_DIR / "data" / "processed" / "argo_profiles.parquet"
CSV_PATH = BASE_DIR / "data" / "processed" / "argo_profiles.csv"

# In-Memory Cache
_ARGO_DF: Optional[pd.DataFrame] = None

def get_argo_df() -> Optional[pd.DataFrame]:
    global _ARGO_DF
    if _ARGO_DF is None:
        if PARQUET_PATH.is_file():
            try:
                _ARGO_DF = pd.read_parquet(PARQUET_PATH)
            except Exception:
                pass
        if _ARGO_DF is None and CSV_PATH.is_file():
            _ARGO_DF = pd.read_csv(CSV_PATH)
    return _ARGO_DF

@router.get("/floats")
async def get_floats(
    month: Optional[str] = Query(None, description="Month filter (YYYY-MM)"),
    institution: Optional[str] = Query(None, description="Institution filter (e.g. INCOIS, AOML, CSIRO)")
):
    """
    Returns active Argo robotic floats for the given month with latest coordinates,
    institution, sensor profiler type, and depth levels count.
    """
    df = get_argo_df()
    if df is None or df.empty:
        return []
        
    filtered = df
    if month:
        # Match year-month or month suffix (e.g. 2023-06 or -06)
        month_suffix = month.split("-")[-1] if "-" in month else month
        filtered = df[df["month"].str.endswith(f"-{month_suffix}")]
        
    if institution:
        filtered = filtered[filtered["institution"].str.contains(institution, case=False, na=False)]
        
    if filtered.empty:
        filtered = df.head(500)
        
    # Group by float_id and date to get unique profile locations
    group_cols = ["float_id", "wmo", "cyc", "date", "latitude", "longitude", "institution", "dac", "profiler"]
    grouped = filtered.groupby(group_cols).size().reset_index(name="n_levels")
    
    results = []
    for _, row in grouped.iterrows():
        results.append({
            "float_id": str(row["float_id"]),
            "wmo": str(row["wmo"]),
            "cyc": int(row["cyc"]),
            "date": str(row["date"]),
            "lat": round(float(row["latitude"]), 4),
            "lon": round(float(row["longitude"]), 4),
            "institution": str(row["institution"]),
            "dac": str(row["dac"]),
            "profiler": str(row["profiler"]),
            "n_levels": int(row["n_levels"])
        })
        
    return results[:300]
