"""
AAZHI Ocean Platform - Production Configuration Settings
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
TILES_DIR = Path(os.getenv("TILES_DIR", str(BASE_DIR / "tiles")))
FRONTEND_DIST_DIR = Path(os.getenv("FRONTEND_DIST_DIR", str(BASE_DIR / "frontend" / "dist")))

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Security & CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Ensure necessary directories exist
TILES_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
