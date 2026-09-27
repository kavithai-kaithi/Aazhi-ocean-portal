"""
DEEPLENS - Backend Utility Functions
Spatial and vertical interpolation, great-circle path sampling, and statistical metrics.
"""

import math
import numpy as np

def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Calculates the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def great_circle_path(lat1, lon1, lat2, lon2, n_points=100):
    """
    Interpolates n_points along the great-circle arc between (lat1, lon1) and (lat2, lon2).
    Returns arrays of latitudes, longitudes, and cumulative distances in km.
    """
    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)
    
    # Angular distance d
    d = 2.0 * math.asin(math.sqrt(
        math.sin((lat2_r - lat1_r) / 2.0) ** 2 +
        math.cos(lat1_r) * math.cos(lat2_r) * math.sin((lon2_r - lon1_r) / 2.0) ** 2
    ))
    
    if d == 0:
        return np.full(n_points, lat1), np.full(n_points, lon1), np.zeros(n_points)
        
    f_arr = np.linspace(0, 1, n_points)
    lats = []
    lons = []
    distances_km = []
    
    total_km = d * 6371.0
    
    for f in f_arr:
        A = math.sin((1.0 - f) * d) / math.sin(d)
        B = math.sin(f * d) / math.sin(d)
        
        x = A * math.cos(lat1_r) * math.cos(lon1_r) + B * math.cos(lat2_r) * math.cos(lon2_r)
        y = A * math.cos(lat1_r) * math.sin(lon1_r) + B * math.cos(lat2_r) * math.sin(lon2_r)
        z = A * math.sin(lat1_r) + B * math.sin(lat2_r)
        
        lat = math.atan2(z, math.sqrt(x**2 + y**2))
        lon = math.atan2(y, x)
        
        lats.append(math.degrees(lat))
        lons.append(math.degrees(lon))
        distances_km.append(round(f * total_km, 1))
        
    return np.array(lats), np.array(lons), np.array(distances_km)

def calculate_profile_statistics(model_vals, observed_vals):
    """
    Calculates Bias, RMSE, and number of valid points between model and observation.
    model_vals and observed_vals are 1D numpy arrays or lists.
    """
    m = np.asarray(model_vals, dtype=np.float64)
    o = np.asarray(observed_vals, dtype=np.float64)
    
    valid_mask = (~np.isnan(m)) & (~np.isnan(o))
    n_valid = int(np.sum(valid_mask))
    
    if n_valid == 0:
        return {"bias": None, "rmse": None, "n_points": 0}
        
    diff = m[valid_mask] - o[valid_mask]
    bias = float(np.mean(diff))
    rmse = float(np.sqrt(np.mean(diff ** 2)))
    
    return {
        "bias": round(bias, 3),
        "rmse": round(rmse, 3),
        "n_points": n_valid
    }
