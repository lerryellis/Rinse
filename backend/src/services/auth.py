"""Shared auth utilities for extracting and validating users."""
from __future__ import annotations

import logging
import os
from fastapi import Request, HTTPException
from src.services.usage import get_supabase

logger = logging.getLogger(__name__)


def _verify_token(token: str) -> str:
    """
    Verify a Supabase JWT and return the user_id (sub claim).
    Uses Supabase Auth's get_user() which validates the token server-side —
    no reliance on unverified local decoding.
    Raises HTTPException on any failure.
    """
    from supabase import create_client
    url = os.getenv("SUPABASE_URL", "")
    # Use the service key so get_user() has the authority to validate
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Server configuration error")

    try:
        client = create_client(url, key)
        response = client.auth.get_user(token)
        user = response.user
        if not user or not user.id:
            raise HTTPException(status_code=401, detail="Invalid session. Please sign in again.")
        return str(user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Token verification failed: %s", type(e).__name__)
        raise HTTPException(status_code=401, detail="Invalid session. Please sign in again.")


def require_user(request: Request) -> str:
    """Extract and verify user_id from JWT. Raises 401/403 if not authenticated or suspended."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in required to use this tool")

    token = auth_header.split(" ", 1)[1]
    user_id = _verify_token(token)

    # Check if suspended
    try:
        sb = get_supabase()
        result = sb.table("profiles").select("suspended, suspended_reason").eq("id", user_id).maybe_single().execute()
        if result.data and result.data.get("suspended"):
            reason = result.data.get("suspended_reason") or "Contact support for more information."
            raise HTTPException(status_code=403, detail=f"Your account has been suspended. {reason}")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Failed to check user profile for %s: %s", user_id, type(e).__name__)

    return user_id


def is_user_admin(user_id: str) -> bool:
    """Check if a user has admin privileges."""
    try:
        sb = get_supabase()
        result = sb.table("profiles").select("is_admin").eq("id", user_id).maybe_single().execute()
        if result.data:
            return result.data.get("is_admin", False)
    except Exception as e:
        logger.warning("Failed to check admin status for %s: %s", user_id, type(e).__name__)
    return False
