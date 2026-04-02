from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from supabase import create_client, Client

_client: Optional[Client] = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", ""),
        )
    return _client


LIMITS = {
    "free": {"tasks_per_hour": 3, "max_file_bytes": 50 * 1024 * 1024},
    "pro": {"tasks_per_hour": 9999, "max_file_bytes": 200 * 1024 * 1024},
    "enterprise": {"tasks_per_hour": 9999, "max_file_bytes": 500 * 1024 * 1024},
}


def get_plan_for_ip(ip: str) -> str:
    """Default to free for anonymous users."""
    return "free"


def get_plan_for_user(user_id: str) -> str:
    sb = get_supabase()
    result = sb.table("profiles").select("plan").eq("id", user_id).single().execute()
    if result.data:
        return result.data.get("plan", "free")
    return "free"


def count_usage_last_hour(ip: str, user_id: Optional[str]) -> int:
    sb = get_supabase()
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()

    if user_id:
        result = (
            sb.table("usage")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", one_hour_ago)
            .execute()
        )
    else:
        result = (
            sb.table("usage")
            .select("id", count="exact")
            .eq("ip_address", ip)
            .gte("created_at", one_hour_ago)
            .execute()
        )
    return result.count or 0


def record_usage(ip: str, user_id: Optional[str], tool: str, file_size: int):
    sb = get_supabase()
    sb.table("usage").insert(
        {
            "ip_address": ip,
            "user_id": user_id,
            "tool": tool,
            "file_size_bytes": file_size,
        }
    ).execute()


def check_limits(ip: str, user_id: Optional[str], file_size: int) -> Optional[str]:
    """Returns an error message if limits exceeded, or None if OK."""
    plan = get_plan_for_user(user_id) if user_id else get_plan_for_ip(ip)
    limits = LIMITS.get(plan, LIMITS["free"])

    if file_size > limits["max_file_bytes"]:
        max_mb = limits["max_file_bytes"] // (1024 * 1024)
        return f"File too large. {plan.title()} plan allows up to {max_mb} MB."

    used = count_usage_last_hour(ip, user_id)
    if used >= limits["tasks_per_hour"]:
        return f"Rate limit reached. {plan.title()} plan allows {limits['tasks_per_hour']} tasks per hour. Upgrade for unlimited."

    return None
