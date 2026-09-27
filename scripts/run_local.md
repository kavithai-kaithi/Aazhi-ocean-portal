# DEEPLENS — Local Execution Guide

This guide describes how to run the complete DEEPLENS platform on a standard laptop with zero external dependencies, no Docker requirement, and full offline capability.

---

## 1. Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: v18.0 or higher (v20+ recommended)
- **Package Manager**: npm or yarn

---

## 2. Step 1: Install Dependencies

### Backend & Data Pipeline
From the repository root:
```bash
pip install -r requirements.txt
```

### Frontend
From the `frontend` directory:
```bash
cd frontend
npm install
cd ..
```

---

## 3. Step 2: Run the Offline Data Pipeline

Run the 5 pipeline steps sequentially (or with `--demo` flag for rapid 2-month setup):

```bash
# 1. Download / synthesize model grid
python pipeline/01_download_model.py

# 2. Process Argo in-situ robotic float profiles
python pipeline/02_download_argo.py

# 3. Harmonize dimensions and standard depth levels (0-2000m)
python pipeline/03_harmonize.py

# 4. Render XYZ Web Mercator PNG tiles with land transparency
python pipeline/04_render_tiles.py

# 5. Export unified cloud-optimized Zarr store
python pipeline/05_export_zarr.py
```

*Expected output:*
- `data/raw/model_raw.nc`
- `data/processed/argo_profiles.parquet`
- `data/processed/model.zarr`
- `data/processed/deeplens.zarr`
- `tiles/temperature/...` and `tiles/salinity/...`
- `tiles/colormaps.json`

---

## 4. Step 3: Start the Backend Server

Start the FastAPI ASGI server:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run Smoke Test Suite
Verify all endpoints and latency SLA:
```bash
python backend/smoke_test.py
```

---

## 5. Step 4: Start the Frontend Application

In a separate terminal:
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 6. Offline / No-Internet Execution

DEEPLENS is fully self-contained:
- All map tiles are served locally from `tiles/`
- All Argo profiles are loaded from local Parquet
- Model interpolation queries the local Zarr store
- No external paid APIs or remote database servers are needed.
