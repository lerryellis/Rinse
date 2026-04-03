from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, Query
from pydantic import BaseModel

from src.services.auth import require_user
from src.services.usage import get_supabase

router = APIRouter()


class CreateTeamRequest(BaseModel):
    name: str


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "member"


class TeamInfo(BaseModel):
    id: int
    name: str
    owner_id: str
    plan: str
    max_members: int
    member_count: int


class TeamMember(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    joined_at: str


@router.post("/create")
async def create_team(request: Request, body: CreateTeamRequest):
    """Create a new team. The creator becomes the owner."""
    user_id = require_user(request)
    sb = get_supabase()

    # Check if user already owns a team
    existing = sb.table("teams").select("id").eq("owner_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="You already own a team")

    # Create team
    team = sb.table("teams").insert({"name": body.name, "owner_id": user_id}).execute()
    team_id = team.data[0]["id"]

    # Add owner as member
    sb.table("team_members").insert({
        "team_id": team_id,
        "user_id": user_id,
        "role": "owner",
    }).execute()

    # Link profile
    sb.table("profiles").update({"team_id": team_id}).eq("id", user_id).execute()

    return {"status": "created", "team_id": team_id}


@router.get("/my-team")
async def get_my_team(request: Request):
    """Get the current user's team info and members."""
    user_id = require_user(request)
    sb = get_supabase()

    # Find user's team
    membership = sb.table("team_members").select("team_id, role").eq("user_id", user_id).execute()
    if not membership.data:
        return {"team": None, "members": [], "my_role": None}

    team_id = membership.data[0]["team_id"]
    my_role = membership.data[0]["role"]

    # Get team info
    team = sb.table("teams").select("*").eq("id", team_id).single().execute()

    # Get members with profile info
    members_raw = sb.table("team_members").select("user_id, role, joined_at").eq("team_id", team_id).execute()
    members = []
    for m in (members_raw.data or []):
        profile = sb.table("profiles").select("email, full_name").eq("id", m["user_id"]).single().execute()
        members.append({
            "user_id": m["user_id"],
            "email": profile.data.get("email", "") if profile.data else "",
            "full_name": profile.data.get("full_name", "") if profile.data else "",
            "role": m["role"],
            "joined_at": m["joined_at"],
        })

    member_count = len(members)

    return {
        "team": {**team.data, "member_count": member_count} if team.data else None,
        "members": members,
        "my_role": my_role,
    }


@router.post("/invite")
async def invite_member(request: Request, body: InviteMemberRequest):
    """Invite a user to the team by email. Requires owner or admin role."""
    user_id = require_user(request)
    sb = get_supabase()

    # Verify caller is owner or admin
    membership = sb.table("team_members").select("team_id, role").eq("user_id", user_id).execute()
    if not membership.data or membership.data[0]["role"] not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only team owners and admins can invite members")

    team_id = membership.data[0]["team_id"]

    # Check team size limit
    team = sb.table("teams").select("max_members").eq("id", team_id).single().execute()
    current = sb.table("team_members").select("id", count="exact").eq("team_id", team_id).execute()
    if (current.count or 0) >= (team.data.get("max_members", 5) if team.data else 5):
        raise HTTPException(status_code=400, detail="Team is full. Upgrade to add more members.")

    # Find invitee by email
    invitee = sb.table("profiles").select("id").eq("email", body.email).single().execute()
    if not invitee.data:
        raise HTTPException(status_code=404, detail=f"No user found with email {body.email}")

    invitee_id = invitee.data["id"]

    # Check if already a member
    existing = sb.table("team_members").select("id").eq("team_id", team_id).eq("user_id", invitee_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User is already a team member")

    # Add member
    role = body.role if body.role in ("admin", "member") else "member"
    sb.table("team_members").insert({
        "team_id": team_id,
        "user_id": invitee_id,
        "role": role,
    }).execute()

    # Link profile
    sb.table("profiles").update({"team_id": team_id}).eq("id", invitee_id).execute()

    return {"status": "invited", "email": body.email, "role": role}


@router.delete("/members/{member_user_id}")
async def remove_member(request: Request, member_user_id: str):
    """Remove a member from the team."""
    user_id = require_user(request)
    sb = get_supabase()

    membership = sb.table("team_members").select("team_id, role").eq("user_id", user_id).execute()
    if not membership.data or membership.data[0]["role"] not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owners and admins can remove members")

    team_id = membership.data[0]["team_id"]

    if member_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Transfer ownership first.")

    sb.table("team_members").delete().eq("team_id", team_id).eq("user_id", member_user_id).execute()
    sb.table("profiles").update({"team_id": None}).eq("id", member_user_id).execute()

    return {"status": "removed"}


@router.patch("/settings")
async def update_team(request: Request):
    """Update team name. Owner only."""
    user_id = require_user(request)
    body = await request.json()
    sb = get_supabase()

    membership = sb.table("team_members").select("team_id, role").eq("user_id", user_id).execute()
    if not membership.data or membership.data[0]["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can update settings")

    team_id = membership.data[0]["team_id"]
    updates = {}
    if "name" in body:
        updates["name"] = body["name"]
    if updates:
        sb.table("teams").update(updates).eq("id", team_id).execute()

    return {"status": "updated"}
