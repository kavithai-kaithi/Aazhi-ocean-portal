"""
AAZHI - Ocean Platform Backend Application Server
FastAPI web application serving oceanographic model XYZ raster tiles, Argo float observations,
and 3D validation endpoints with production-ready static assets serving.
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import (
    BASE_DIR, 
    TILES_DIR, 
    FRONTEND_DIST_DIR, 
    HOST, 
    PORT, 
    ENVIRONMENT, 
    ALLOWED_ORIGINS
)

from backend.endpoints.metadata import router as metadata_router
from backend.endpoints.tiles import router as tiles_router
from backend.endpoints.floats import router as floats_router
from backend.endpoints.compare import router as compare_router
from backend.endpoints.crosssection import router as crosssection_router
from backend.endpoints.currents import router as currents_router
from backend.endpoints.errormap import router as errormap_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aazhi.server")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("AAZHI Oceanographic Production Server Initializing")
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Base Directory: {BASE_DIR}")
    logger.info(f"Tiles Directory: {TILES_DIR}")
    logger.info(f"Frontend Dist Directory: {FRONTEND_DIST_DIR} (Exists: {FRONTEND_DIST_DIR.exists()})")
    logger.info("=" * 60)
    yield
    logger.info("AAZHI Oceanographic Server Shutting down...")

app = FastAPI(
    title="AAZHI Ocean Observation & Validation Platform API",
    description="Operational 3D Numerical Ocean Model & Argo Float In-Situ Benchmarking API",
    version="1.0.0",
    lifespan=lifespan
)

# Performance: Gzip compression for JSON/binary payloads
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security: Configurable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(metadata_router)
app.include_router(tiles_router)
app.include_router(floats_router)
app.include_router(compare_router)
app.include_router(crosssection_router)
app.include_router(currents_router)
app.include_router(errormap_router)

# Tile Server Static Route Fallback
app.mount("/static-tiles", StaticFiles(directory=str(TILES_DIR), check_dir=False), name="static-tiles")

@app.get("/")
async def root():
    return {
        "message": "AAZHI Ocean Observation & Validation Platform API Server is Live",
        "documentation": "/docs",
        "health_check": "/api/health",
        "status": "active"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AAZHI",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "region": "Indian Ocean [20E-120E, 40S-25N]",
        "datasets": [
            "Copernicus CMEMS GLORYS12V1",
            "Coriolis CORA In-Situ Floats",
            "USGS 3D Hydrodynamics"
        ]
    }

# SPA Production Static Mounting
# When frontend/dist is built, serve static files and handle client-side routing
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API or Tile routes
        if full_path.startswith("api/") or full_path.startswith("tiles/") or full_path.startswith("static-tiles/"):
            return None
        
        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        index_path = FRONTEND_DIST_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return {"error": "Frontend not built"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=(ENVIRONMENT == "development"))
