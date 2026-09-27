"""
DEEPLENS - Metadata Endpoints
Provides system metadata: available variables, colormaps, time steps, and depth levels.
"""

import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pathlib import Path
from backend.utils.dataset import dataset_engine

router = APIRouter(prefix="/api", tags=["metadata"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
COLORMAPS_FILE = BASE_DIR / "tiles" / "colormaps.json"

DEFAULT_VARIABLES = [
    {
        "id": "temperature",
        "label": "Sea Surface Temperature (SST)",
        "unit": "°C",
        "colormap": "thermal",
        "description": "Sea surface potential temperature (INCOIS BIO ROMS 1980-2019 / CMEMS / CORA)",
        "cf_standard": "sea_surface_temperature"
    },
    {
        "id": "mld",
        "label": "Mixed-Layer Depth (MLD)",
        "unit": "m",
        "colormap": "mld",
        "description": "Ocean mixed layer thickness defined by density threshold 0.03 kg/m³",
        "cf_standard": "ocean_mixed_layer_thickness"
    },
    {
        "id": "chlorophyll",
        "label": "Sea-Surface Chlorophyll Concentration",
        "unit": "mg/m³",
        "colormap": "algae",
        "description": "Sea-surface chlorophyll concentration (INCOIS BIO ROMS / LAS 8 / PyFerret 7.65)",
        "cf_standard": "mass_concentration_of_chlorophyll_a_in_sea_water"
    },
    {
        "id": "dic",
        "label": "Dissolved Inorganic Carbon Concentration (DIC)",
        "unit": "mmol/m³",
        "colormap": "carbon",
        "description": "Sea-surface dissolved inorganic carbon concentration model output",
        "cf_standard": "mole_concentration_of_dissolved_inorganic_carbon_in_sea_water"
    },
    {
        "id": "nitrate",
        "label": "Sea-Surface Nitrate Concentration",
        "unit": "mmol/m³",
        "colormap": "nitrate",
        "description": "Sea-surface nitrate nutrient concentration model output",
        "cf_standard": "mole_concentration_of_nitrate_in_sea_water"
    },
    {
        "id": "salinity",
        "label": "Sea-Surface Salinity (SSS)",
        "unit": "PSU",
        "colormap": "haline",
        "description": "Sea-surface salinity tracking Arabian Sea vs BoB freshwater plumes",
        "cf_standard": "sea_surface_salinity"
    },
    {
        "id": "pco2_model",
        "label": "Surface Partial Pressure of CO2 (Model Output)",
        "unit": "µatm",
        "colormap": "co2",
        "description": "Surface partial pressure of CO2 calculated from INCOIS IBR model",
        "cf_standard": "surface_partial_pressure_of_carbon_dioxide_in_sea_water"
    },
    {
        "id": "pco2_clim",
        "label": "Surface pCO2 (Climatological Deviants)",
        "unit": "µatm",
        "colormap": "balance",
        "description": "Surface partial pressure of CO2 using climatological deviants",
        "cf_standard": "surface_co2_climatological_deviant"
    },
    {
        "id": "pco2_inter",
        "label": "Surface pCO2 (Interannual Deviants)",
        "unit": "µatm",
        "colormap": "diff",
        "description": "Surface partial pressure of CO2 using interannual deviants",
        "cf_standard": "surface_co2_interannual_deviant"
    },
    {
        "id": "uncertainties",
        "label": "Uncertainties (1-Sigma Deviants)",
        "unit": "1-σ",
        "colormap": "uncertainty",
        "description": "Error estimation / 1-sigma standard deviation of deviants",
        "cf_standard": "statistical_standard_deviation_uncertainty"
    },
    {
        "id": "currents",
        "label": "Current Velocity (uo, vo)",
        "unit": "m/s",
        "colormap": "speed",
        "description": "3D ocean flow vector fields trained on 18.13M OpenDrift observations",
        "cf_standard": "sea_water_speed"
    }
]

DATASETS_REGISTRY = [
    {
        "id": "incois_bio_roms",
        "title": "INCOIS BIO ROMS 40-Year Ocean Reanalysis Dataset (1980–2019)",
        "identifier": "INCOIS_LAS_BIO_ROMS_1980_2019",
        "provider": "INCOIS LAS (Indian National Centre for Ocean Information Services)",
        "analysis_engine": "LAS 8. / PyFerret 7.65 (NOAA/PMEL)",
        "calendar_system": "Proleptic Gregorian",
        "spatial_coverage": "Indian Ocean Basin [30°E to 120°E, -29.99°S to 29.98°N]",
        "temporal_span": "40 Consecutive Years (1980 through 2019), 480 Monthly Slices",
        "variables_count": 10,
        "variables": [
            "Sea-surface temperature (°C)",
            "Mixed-layer depth (m)",
            "Sea-surface chlorophyll concentration (mg/m³)",
            "Sea-surface dissolved inorganic carbon (mmol/m³)",
            "Sea-surface nitrate concentration (mmol/m³)",
            "Sea-surface salinity (PSU)",
            "Surface partial pressure of CO2 (pCO2 model) (µatm)",
            "Surface pCO2 climatological deviants (µatm)",
            "Surface pCO2 interannual deviants (µatm)",
            "Uncertainties (1-sigma) of deviants"
        ],
        "operators": ["Raw values", "Average", "Minimum", "Maximum", "Sum", "Variance"],
        "reduction_axes": ["Area", "Longitude", "Latitude", "Time"],
        "plot_types": ["Maps (2D Lat-Lon)", "Line Plots (Time series & Transects)", "Hovmoller Plots (Lon-Time & Lat-Time)"],
        "export_options": ["Direct Desktop Export", "NetCDF / ASCII Save As", "Google Earth Integration", "Raw Text Tables"]
    },
    {
        "id": "opendrift_indian_ocean",
        "title": "OpenDrift Indian Ocean Hydrodynamics & Drift Dataset",
        "identifier": "OPENDRIFT_INDIAN_OCEAN_HYD_2023_2026",
        "provider": "OpenDrift / INCOIS / Indian Ocean Hydrodynamic Model",
        "records": "18,134,847 Spatio-Temporal Observations",
        "coverage": "Indian Ocean [65.25°E–94.75°E, 5.25°N–24.75°N] & Basin-wide 2023–2026",
        "variables": ["time", "latitude", "longitude", "wind_u", "wind_v", "current_u", "current_v", "wave_height", "temperature", "salinity"]
    },
    {
        "id": "cmems_glorys12v1",
        "title": "Copernicus CMEMS GLORYS12V1 Ocean Physics Reanalysis",
        "identifier": "GLOBAL_MULTIYEAR_PHY_001_030",
        "doi": "10.48670/moi-00021",
        "provider": "Mercator Ocean International / CMEMS",
        "resolution": "1/12° (~8 km), 50 vertical levels (0.49m–5728m)",
        "engine": "NEMO 3.1 + LIM2 Sea Ice + ECMWF ERA5 + SEEK Kalman Filter",
        "variables": ["thetao", "so", "uo", "vo", "zos", "mlotst", "bottomT"]
    },
    {
        "id": "cora_v52",
        "title": "CORA v5.2 Coriolis In-Situ Ocean Dataset for Reanalysis",
        "identifier": "SEANOE-CORA-V5.2",
        "doi": "10.17882/46219",
        "provider": "Ifremer / CNRS / LOPS / LOCEAN / SEANOE",
        "platforms": "Argo Core, Deep Argo (4000m), RAMA/OMNI Moorings, CTD Rosettes, Gliders",
        "qc_standards": "4-Level QC Flag Hierarchy (1: Good, 2: Probably Good, 3: Bad, 4: Interpolated)",
        "variables": ["TEMP", "PSAL", "PRES", "QC_FLAGS"]
    },
    {
        "id": "usgs_delft3d",
        "title": "USGS Physics-Based 3D Numerical Circulation & Larval Dispersal Model",
        "identifier": "USGS:57db0908e4b090824ffc3324",
        "doi": "10.5066/F7NK3C59",
        "provider": "U.S. Geological Survey (PCMSC) / Curt D. Storlazzi et al.",
        "resolution": "1-km Curvilinear Domain nested in 5-km Regional Grid",
        "engine": "Delft3D-Flow + Delft3D-Wave + SWAN + WRF-ARW + WWIII + HYCOM + TPXO",
        "variables": ["u (eastward velocity)", "v (northward velocity)", "crs: EPSG:32604"]
    }
]

@router.get("/variables")
async def get_variables():
    return DEFAULT_VARIABLES

@router.get("/datasets")
async def get_datasets():
    return DATASETS_REGISTRY

@router.get("/colormaps/{variable}")
async def get_colormap(variable: str):
    if COLORMAPS_FILE.is_file():
        try:
            with open(COLORMAPS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if variable in data:
                    return data[variable]
        except Exception:
            pass
            
    if variable == "temperature":
        return {"min": 2.0, "max": 31.0, "unit": "°C", "cmap_name": "thermal"}
    elif variable == "salinity":
        return {"min": 31.5, "max": 37.0, "unit": "PSU", "cmap_name": "haline"}
    else:
        raise HTTPException(status_code=404, detail=f"Variable {variable} not recognized")

@router.get("/times")
async def get_times():
    dataset_engine.load()
    if dataset_engine.times:
        return dataset_engine.times
    return DEFAULT_TIMES

@router.get("/depths")
async def get_depths():
    dataset_engine.load()
    if dataset_engine.depths is not None:
        return [int(d) for d in dataset_engine.depths]
    return DEFAULT_DEPTHS
