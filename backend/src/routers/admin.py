from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Query
from src.services.usage import get_supabase

router = APIRouter()


def require_admin(request: Request) -> str:
    """Extract user_id and verify admin role. Raises 403 if not admin."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        import jwt
        token = auth.split(" ", 1)[1]
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")

    sb = get_supabase()
    result = sb.table("profiles").select("is_admin").eq("id", user_id).single().execute()
    if not result.data or not result.data.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    return user_id


@router.get("/stats")
async def get_dashboard_stats(request: Request):
    """Overview stats for the admin dashboard."""
    require_admin(request)
    sb = get_supabase()

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    # Total users
    users = sb.table("profiles").select("id", count="exact").execute()
    total_users = users.count or 0

    # Users signed up today
    new_today = sb.table("profiles").select("id", count="exact").gte("created_at", today_start).execute()
    new_users_today = new_today.count or 0

    # Total tasks today
    tasks_today = sb.table("usage").select("id", count="exact").gte("created_at", today_start).execute()
    total_tasks_today = tasks_today.count or 0

    # Total tasks this week
    tasks_week = sb.table("usage").select("id", count="exact").gte("created_at", week_ago).execute()
    total_tasks_week = tasks_week.count or 0

    # Total payments (successful)
    payments = sb.table("payments").select("amount_ghs").eq("status", "success").execute()
    total_revenue_ghs = sum(p["amount_ghs"] for p in (payments.data or []))

    # Payments this month
    payments_month = (
        sb.table("payments")
        .select("amount_ghs")
        .eq("status", "success")
        .gte("created_at", month_ago)
        .execute()
    )
    revenue_this_month = sum(p["amount_ghs"] for p in (payments_month.data or []))

    # Payments today
    payments_today = (
        sb.table("payments")
        .select("amount_ghs")
        .eq("status", "success")
        .gte("created_at", today_start)
        .execute()
    )
    revenue_today = sum(p["amount_ghs"] for p in (payments_today.data or []))

    # Top tools (last 7 days)
    tool_usage = (
        sb.table("usage")
        .select("tool")
        .gte("created_at", week_ago)
        .execute()
    )
    tool_counts: dict = {}
    for row in (tool_usage.data or []):
        t = row["tool"]
        tool_counts[t] = tool_counts.get(t, 0) + 1
    top_tools = sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total_users": total_users,
        "new_users_today": new_users_today,
        "total_tasks_today": total_tasks_today,
        "total_tasks_week": total_tasks_week,
        "total_revenue_ghs": float(total_revenue_ghs),
        "revenue_this_month": float(revenue_this_month),
        "revenue_today": float(revenue_today),
        "top_tools": [{"tool": t, "count": c} for t, c in top_tools],
    }


@router.get("/crm/segments")
async def get_crm_segments(request: Request):
    """Get user counts by segment: individuals, team members, API developers, admins, suspended."""
    require_admin(request)
    sb = get_supabase()

    total = sb.table("profiles").select("id", count="exact").execute()
    admins = sb.table("profiles").select("id", count="exact").eq("is_admin", True).execute()
    suspended = sb.table("profiles").select("id", count="exact").eq("suspended", True).execute()
    in_teams = sb.table("profiles").select("id", count="exact").not_.is_("team_id", "null").execute()
    has_api_keys = sb.table("api_keys").select("user_id", count="exact").eq("active", True).execute()
    paid_users = sb.table("payments").select("user_id", count="exact").eq("status", "success").execute()

    total_count = total.count or 0
    team_count = in_teams.count or 0
    api_count = has_api_keys.count or 0
    individual_count = total_count - team_count

    return {
        "total": total_count,
        "segments": {
            "individuals": individual_count,
            "team_members": team_count,
            "api_developers": api_count,
            "paid_users": paid_users.count or 0,
            "admins": admins.count or 0,
            "suspended": suspended.count or 0,
        },
    }


@router.get("/crm/teams")
async def list_teams(request: Request, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50)):
    """List all teams with member counts."""
    require_admin(request)
    sb = get_supabase()

    offset = (page - 1) * limit
    result = sb.table("teams").select("*, profiles!teams_owner_id_fkey(email, full_name)", count="exact").order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    teams = []
    for team in (result.data or []):
        members = sb.table("team_members").select("id", count="exact").eq("team_id", team["id"]).execute()
        teams.append({**team, "member_count": members.count or 0})

    return {"teams": teams, "total": result.count or 0, "page": page}


@router.get("/crm/api-developers")
async def list_api_developers(request: Request, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50)):
    """List users with active API keys and their usage stats."""
    require_admin(request)
    sb = get_supabase()

    offset = (page - 1) * limit
    keys = sb.table("api_keys").select("user_id, name, key_prefix, last_used_at, created_at", count="exact").eq("active", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    developers = []
    for key in (keys.data or []):
        profile = sb.table("profiles").select("email, full_name, plan").eq("id", key["user_id"]).single().execute()
        api_usage = sb.table("usage").select("id", count="exact").eq("user_id", key["user_id"]).like("tool", "api:%").execute()
        developers.append({
            **key,
            "email": profile.data.get("email", "") if profile.data else "",
            "full_name": profile.data.get("full_name", "") if profile.data else "",
            "plan": profile.data.get("plan", "free") if profile.data else "free",
            "total_api_calls": api_usage.count or 0,
        })

    return {"developers": developers, "total": keys.count or 0, "page": page}


@router.get("/users")
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    segment: Optional[str] = None,
):
    """List users with pagination, search, and segment filter."""
    require_admin(request)
    sb = get_supabase()

    offset = (page - 1) * limit
    query = sb.table("profiles").select("*", count="exact").order("created_at", desc=True)

    if search:
        query = query.or_(f"email.ilike.%{search}%,full_name.ilike.%{search}%")

    if segment == "team":
        query = query.not_.is_("team_id", "null")
    elif segment == "individual":
        query = query.is_("team_id", "null")
    elif segment == "admin":
        query = query.eq("is_admin", True)
    elif segment == "suspended":
        query = query.eq("suspended", True)
    elif segment == "paid":
        # Get user IDs who have made payments
        paid = sb.table("payments").select("user_id").eq("status", "success").execute()
        paid_ids = list(set(p["user_id"] for p in (paid.data or []) if p["user_id"]))
        if paid_ids:
            query = query.in_("id", paid_ids)
        else:
            return {"users": [], "total": 0, "page": page, "limit": limit}

    result = query.range(offset, offset + limit - 1).execute()

    return {
        "users": result.data or [],
        "total": result.count or 0,
        "page": page,
        "limit": limit,
    }


@router.get("/users/{user_id}")
async def get_user_detail(request: Request, user_id: str):
    """Get detailed info for a specific user."""
    require_admin(request)
    sb = get_supabase()

    profile = sb.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    usage = (
        sb.table("usage")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    payments = (
        sb.table("payments")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {
        "profile": profile.data,
        "usage": usage.data or [],
        "payments": payments.data or [],
    }


@router.patch("/users/{user_id}")
async def update_user(request: Request, user_id: str):
    """Update a user's profile (admin only)."""
    require_admin(request)
    body = await request.json()
    sb = get_supabase()

    allowed_fields = {"plan", "is_admin", "full_name", "suspended", "suspended_reason"}
    updates = {k: v for k, v in body.items() if k in allowed_fields}

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    sb.table("profiles").update(updates).eq("id", user_id).execute()
    return {"status": "updated", "fields": list(updates.keys())}


@router.get("/payments")
async def list_payments(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    """List all payments with pagination."""
    require_admin(request)
    sb = get_supabase()

    offset = (page - 1) * limit
    query = (
        sb.table("payments")
        .select("*, profiles(email, full_name)", count="exact")
        .order("created_at", desc=True)
    )

    if status:
        query = query.eq("status", status)

    result = query.range(offset, offset + limit - 1).execute()

    return {
        "payments": result.data or [],
        "total": result.count or 0,
        "page": page,
        "limit": limit,
    }


@router.get("/usage")
async def list_usage(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    tool: Optional[str] = None,
):
    """List usage records with pagination."""
    require_admin(request)
    sb = get_supabase()

    offset = (page - 1) * limit
    query = (
        sb.table("usage")
        .select("*, profiles(email, full_name)", count="exact")
        .order("created_at", desc=True)
    )

    if tool:
        query = query.eq("tool", tool)

    result = query.range(offset, offset + limit - 1).execute()

    return {
        "usage": result.data or [],
        "total": result.count or 0,
        "page": page,
        "limit": limit,
    }
