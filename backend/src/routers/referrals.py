from __future__ import annotations

import secrets

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.services.auth import require_user
from src.services.usage import get_supabase

router = APIRouter()

BONUS_PER_REFERRAL = 2  # both referrer and referred get 2 extra conversions


class ReferralInfo(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int
    bonus_conversions: int


class ApplyReferralRequest(BaseModel):
    code: str


@router.get("/info", response_model=ReferralInfo)
async def get_referral_info(request: Request):
    """Get or generate the user's referral code and stats."""
    user_id = require_user(request)
    sb = get_supabase()

    profile = sb.table("profiles").select("referral_code, bonus_conversions").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    code = profile.data.get("referral_code")
    if not code:
        code = f"RINSE-{secrets.token_hex(4).upper()}"
        sb.table("profiles").update({"referral_code": code}).eq("id", user_id).execute()

    referrals = sb.table("referrals").select("id", count="exact").eq("referrer_id", user_id).execute()
    total = referrals.count or 0

    origin = request.headers.get("origin", "https://rinse.vercel.app")

    return ReferralInfo(
        referral_code=code,
        referral_link=f"{origin}/auth/signup?ref={code}",
        total_referrals=total,
        bonus_conversions=profile.data.get("bonus_conversions", 0),
    )


@router.post("/apply")
async def apply_referral_code(request: Request, body: ApplyReferralRequest):
    """Apply a referral code to the current user's account. Can only be done once."""
    user_id = require_user(request)
    sb = get_supabase()

    # Check if user already used a referral
    profile = sb.table("profiles").select("referred_by").eq("id", user_id).single().execute()
    if profile.data and profile.data.get("referred_by"):
        raise HTTPException(status_code=400, detail="You have already used a referral code")

    # Find referrer by code
    referrer = sb.table("profiles").select("id").eq("referral_code", body.code).single().execute()
    if not referrer.data:
        raise HTTPException(status_code=400, detail="Invalid referral code")

    referrer_id = referrer.data["id"]
    if referrer_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")

    # Check if already referred by this person
    existing = sb.table("referrals").select("id").eq("referrer_id", referrer_id).eq("referred_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Referral already applied")

    # Create referral record
    sb.table("referrals").insert({
        "referrer_id": referrer_id,
        "referred_id": user_id,
        "bonus_granted": True,
    }).execute()

    # Grant bonus to both users
    sb.rpc("increment_bonus", {"user_id_param": referrer_id, "amount": BONUS_PER_REFERRAL}).execute()
    sb.rpc("increment_bonus", {"user_id_param": user_id, "amount": BONUS_PER_REFERRAL}).execute()

    # Mark referred_by
    sb.table("profiles").update({"referred_by": referrer_id}).eq("id", user_id).execute()

    return {
        "status": "success",
        "message": f"Referral applied! You and your friend each got {BONUS_PER_REFERRAL} extra free conversions.",
        "bonus_granted": BONUS_PER_REFERRAL,
    }
