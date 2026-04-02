from __future__ import annotations

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.services.usage import get_usage_info

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


def _require_user(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in required")
    try:
        import jwt
        token = auth.split(" ", 1)[1]
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No sub")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
