"""
DEEPLENS - Tiles Endpoint
Serves cloud-optimized PNG tiles for CesiumJS globe layer
"""

import os
from pathlib import Path
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TILES_DIR = BASE_DIR / "tiles"

# 1x1 transparent PNG bytes for out-of-bounds / land tiles
TRANSPARENT_PNG = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00'
    b'\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
)

@router.get("/tiles/{variable}/{month}/{depth}/{z}/{x}/{y}.png")
async def get_tile(variable: str, month: str, depth: str, z: int, x: int, y: int):
    """
    Serves XYZ tile at /tiles/{variable}/{month}/{depth}/{z}/{x}/{y}.png.
    Returns 1x1 transparent PNG on missing tile to ensure seamless globe rendering.
    """
    # Depth directory might be stored as e.g. "0m" or "50m"
    depth_str = depth if depth.endswith("m") else f"{depth}m"
    
    tile_path = TILES_DIR / variable / month / depth_str / str(z) / str(x) / f"{y}.png"
    
    if tile_path.is_file():
        return FileResponse(tile_path, media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})
        
    return Response(content=TRANSPARENT_PNG, media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})
