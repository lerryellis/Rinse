from __future__ import annotations

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.services.usage import get_usage_info, get_supabase
from src.services.auth import require_user as _require_user

router = APIRouter()


class UsageResponse(BaseModel):
    total_used: int
    free_limit: int
    free_remaining: int
    needs_payment: bool
    price_per_file_ghs: float
    resets_at: Optional[str]


@router.get("/usage")
async def get_usage(request: Request):
    """Get current usage stats. Requires authentication."""
    user_id = _require_user(request)
    device_id = request.headers.get("x-device-id")
    info = get_usage_info(user_id, device_id)
    return UsageResponse(**info)


class TrackDownloadRequest(BaseModel):
    tool: str


@router.post("/track-download")
async def track_download(request: Request, body: TrackDownloadRequest):
    """Record that a user downloaded a processed file."""
    user_id = _require_user(request)
    sb = get_supabase()
    sb.table("usage").insert({
        "user_id": user_id,
        "tool": f"{body.tool}:download",
        "file_size_bytes": 0,
        "paid": False,
    }).execute()
    return {"status": "tracked"}
