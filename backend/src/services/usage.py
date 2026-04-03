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


# Pricing model:
# - Free: 2 conversions per 24-hour window (resets every 24h)
# - Pay-per-file: GHS 2.50 per action after free uses exhausted
# - Strict session: user MUST be authenticated, tracked by user_id
# - Device fingerprint: prevents multi-account abuse on same browser
FREE_LIMIT = 2
RESET_HOURS = 24
PRICE_PER_FILE_GHS = 2.50
MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB


def link_device(user_id: str, device_id: str):
    """Link a device fingerprint to a user account."""
    if not device_id:
        return
    sb = get_supabase()
    # Upsert — ignore if already linked
    sb.table("device_fingerprints").upsert(
        {"device_id": device_id, "user_id": user_id},
        on_conflict="device_id,user_id",
    ).execute()


def count_usage_last_24h_by_device(device_id: str) -> int:
    """Count ALL free (unpaid) tasks from this device across ALL accounts in 24h."""
    if not device_id:
        return 0
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=RESET_HOURS)).isoformat()

    result = (
        sb.table("usage")
        .select("id", count="exact")
        .eq("device_id", device_id)
        .eq("paid", False)
        .gte("created_at", cutoff)
        .execute()
    )
    return result.count or 0


def count_usage_last_24h_by_user(user_id: str) -> int:
    """Count free (unpaid) tasks for this user in 24h."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=RESET_HOURS)).isoformat()

    result = (
        sb.table("usage")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("paid", False)
        .gte("created_at", cutoff)
        .execute()
    )
    return result.count or 0


def get_effective_usage(user_id: str, device_id: Optional[str]) -> int:
    """Get the higher of user-based or device-based usage count.
    This prevents someone from creating multiple accounts on the same device."""
    user_count = count_usage_last_24h_by_user(user_id)
    device_count = count_usage_last_24h_by_device(device_id) if device_id else 0
    return max(user_count, device_count)


def get_oldest_free_use_time(user_id: str, device_id: Optional[str]) -> Optional[str]:
    """Get the earliest free use timestamp in the 24h window (user or device)."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=RESET_HOURS)).isoformat()

    # Check user-based
    result = (
        sb.table("usage")
        .select("created_at")
        .eq("user_id", user_id)
        .eq("paid", False)
        .gte("created_at", cutoff)
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )
    user_oldest = result.data[0]["created_at"] if result.data else None

    # Check device-based
    device_oldest = None
    if device_id:
        result = (
            sb.table("usage")
            .select("created_at")
            .eq("device_id", device_id)
            .eq("paid", False)
            .gte("created_at", cutoff)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )
        device_oldest = result.data[0]["created_at"] if result.data else None

    # Return the earlier of the two
    if user_oldest and device_oldest:
        return min(user_oldest, device_oldest)
    return user_oldest or device_oldest


def record_usage(user_id: str, tool: str, file_size: int, paid: bool = False, device_id: Optional[str] = None):
    sb = get_supabase()
    sb.table("usage").insert(
        {
            "user_id": user_id,
            "tool": tool,
            "file_size_bytes": file_size,
            "paid": paid,
            "device_id": device_id,
        }
    ).execute()


def get_bonus_conversions(user_id: str) -> int:
    """Get bonus conversions earned through referrals."""
    sb = get_supabase()
    result = sb.table("profiles").select("bonus_conversions").eq("id", user_id).single().execute()
    if result.data:
        return result.data.get("bonus_conversions", 0)
    return 0


def get_effective_limit(user_id: str) -> int:
    """Free limit + any referral bonus conversions."""
    return FREE_LIMIT + get_bonus_conversions(user_id)


def check_limits(user_id: str, file_size: int, device_id: Optional[str] = None) -> Optional[str]:
    """Returns an error message if limits exceeded, or None if OK."""
    if file_size > MAX_FILE_BYTES:
        max_mb = MAX_FILE_BYTES // (1024 * 1024)
        return "File too large. Maximum file size is %d MB." % max_mb

    used = get_effective_usage(user_id, device_id)
    limit = get_effective_limit(user_id)
    if used >= limit:
        return "FREE_LIMIT_REACHED"

    return None


def get_usage_info(user_id: str, device_id: Optional[str] = None) -> dict:
    if device_id:
        link_device(user_id, device_id)

    used = get_effective_usage(user_id, device_id)
    limit = get_effective_limit(user_id)
    free_left = max(0, limit - used)
    bonus = get_bonus_conversions(user_id)

    resets_at = None
    if free_left == 0:
        oldest = get_oldest_free_use_time(user_id, device_id)
        if oldest:
            from dateutil.parser import parse as parse_dt
            oldest_dt = parse_dt(oldest)
            reset_dt = oldest_dt + timedelta(hours=RESET_HOURS)
            resets_at = reset_dt.isoformat()

    return {
        "total_used": used,
        "free_limit": limit,
        "free_remaining": free_left,
        "needs_payment": free_left == 0,
        "price_per_file_ghs": PRICE_PER_FILE_GHS,
        "resets_at": resets_at,
        "bonus_conversions": bonus,
    }
