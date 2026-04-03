"""Shared auth utilities for extracting and validating users."""
from __future__ import annotations

import logging
from fastapi import Request, HTTPException
from src.services.usage import get_supabase

logger = logging.getLogger(__name__)


def require_user(request: Request) -> str:
    """Extract user_id from JWT. Raises 401/403 if not authenticated or suspended."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in required to use this tool")
    try:
        import jwt
        token = auth_header.split(" ", 1)[1]
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No sub in token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session. Please sign in again.")

    # Check if suspended (gracefully handle missing profile)
    try:
        sb = get_supabase()
        result = sb.table("profiles").select("suspended, suspended_reason, is_admin").eq("id", user_id).maybe_single().execute()
        if result.data and result.data.get("suspended"):
            reason = result.data.get("suspended_reason") or "Contact support for more information."
            raise HTTPException(status_code=403, detail=f"Your account has been suspended. {reason}")
    except HTTPException:
        raise
    except Exception as e:
        # Log but don't block — if we can't check, let them through
        logger.warning("Failed to check user profile for %s: %s", user_id, e)

    return user_id


def is_user_admin(user_id: str) -> bool:
    """Check if a user has admin privileges."""
    try:
        sb = get_supabase()
        result = sb.table("profiles").select("is_admin").eq("id", user_id).maybe_single().execute()
        if result.data:
            return result.data.get("is_admin", False)
    except Exception as e:
        logger.warning("Failed to check admin status for %s: %s", user_id, e)
    return False
