from fastapi import APIRouter, Request
from pydantic import BaseModel
from src.services.usage import count_usage_last_hour, get_plan_for_user, get_plan_for_ip, LIMITS

router = APIRouter()


class UsageResponse(BaseModel):
    tasks_used: int
    tasks_limit: int
    remaining: int
    plan: str
    max_file_mb: int


@router.get("/usage")
async def get_usage(request: Request):
    """Get current usage stats for the user/session."""
    # Extract user from auth header if present
    user_id = None
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        try:
            import jwt
            token = auth.split(" ", 1)[1]
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
        except Exception:
            pass

    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

    plan = get_plan_for_user(user_id) if user_id else get_plan_for_ip(ip)
    limits = LIMITS.get(plan, LIMITS["free"])
    used = count_usage_last_hour(ip, user_id)

    return UsageResponse(
        tasks_used=used,
        tasks_limit=limits["tasks_per_hour"],
        remaining=max(0, limits["tasks_per_hour"] - used),
        plan=plan,
        max_file_mb=limits["max_file_bytes"] // (1024 * 1024),
    )
