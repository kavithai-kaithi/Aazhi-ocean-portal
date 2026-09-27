# AAZHI: 3D Ocean Visual Platform & Argo In-Situ Validation Platform

**AAZHI** is an operational oceanographic platform for 3D interactive ocean exploration, fusing numerical ocean simulations with real-time in-situ Argo profiling float CTD observations across the Indian Ocean basin.

---

## 🌊 Architecture & Core Workspaces

```
                           +-------------------------------------+
                           |            AAZHI PLATFORM           |
                           +-------------------------------------+
                                              |
             +--------------------------------+--------------------------------+
             |                                                                 |
+--------------------------+                                      +--------------------------+
|      DATA PIPELINE       |                                      |      FASTAPI BACKEND     |
| - Copernicus GLORYS12V1  |                                      | - Bilinear Interp Engine |
| - Coriolis CORA Argo     |                                      | - XYZ Raster Tile Server |
| - USGS 3D Hydrodynamics  |                                      | - Zarr v2 Depth Slicer   |
| - 40 Standard Z-Levels   |                                      | - Automated Validation   |
+--------------------------+                                      +--------------------------+
             |                                                                 |
             +--------------------------------+--------------------------------+
                                              |
                               +-----------------------------+
                               |     REACT THREE.JS WEBGL    |
                               | - 3D Volumetric Slicer      |
                               | - Thermocline Isotherms     |
                               | - Seabed Topography         |
                               | - Inverted Y Plotly Charts  |
                               | - Statistical Metrics Hub   |
                               +-----------------------------+
```

---

## 🚀 Workspaces & Features

1. **3D Ocean Slicer (`/viewer`)**:
   - Interactive 3D WebGL volumetric ocean cutting planes (Three.js).
   - Multi-layer thermocline stratification and seabed bathymetry.
   - Dynamic surface current velocity vectors.
   - In-situ float profile matchup with real-time bias and RMSE calculation.

2. **Validation & Analytics Hub (`/validation`)**:
   - Model vs In-Situ CTD Scatter plots with 1:1 reference line.
   - Taylor Skill Diagram evaluating variance and linear correlation.
   - Depth-wise and observing network RMSE distributions.
   - Station validation priority table with multi-tier QC status.

3. **Tile Server Engine (`/tiles`)**:
   - High-speed XYZ raster tiles rendered from Copernicus GLORYS12V1 numerical simulations across 40 standard depth levels (0–2,000m).

---

## 🛠️ Production Deployment

### Option A: Single Container Docker Deployment (Recommended)

```bash
# Build and run the unified production container
docker build -t aazhi-platform:latest .
docker run -d -p 8000:8000 --name aazhi aazhi-platform:latest
```

### Option B: Docker Compose

```bash
docker compose up -d --build
```

### Option C: Bare Metal / Production Service

```bash
# 1. Build Frontend
npm --prefix frontend install
npm --prefix frontend run build

# 2. Start Production Server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🧪 Automated Testing

```bash
python scripts/test.py
```

---

## 📜 Scientific Attribution & Citations

- **Copernicus Marine Environment Monitoring Service (CMEMS)**: `GLORYS12V1` (DOI: 10.48670/moi-00021)
- **Coriolis In-Situ Profiling Network**: `CORA v5.2` (DOI: 10.17882/46219)
- **USGS ScienceBase Hydrodynamic Model**: `USGS 3D Circulation` (DOI: 10.5066/F7NK3C59)
- **Indian National Centre for Ocean Information Services (INCOIS)**
