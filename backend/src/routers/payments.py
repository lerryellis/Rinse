from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from src.services.usage import get_supabase, PRICE_PER_FILE_GHS, record_usage
from src.services.auth import require_user

logger = logging.getLogger(__name__)

router = APIRouter()

PAYSTACK_BASE = "https://api.paystack.co"


def _get_paystack_secret() -> str:
    """Read Paystack secret at call time (not import time) so env vars are loaded."""
    key = os.getenv("PAYSTACK_SECRET_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="Paystack is not configured. Add PAYSTACK_SECRET_KEY to environment variables.")
    return key


class InitPaymentRequest(BaseModel):
    tool: str
    email: Optional[str] = None
    callback_url: Optional[str] = None


class InitPaymentResponse(BaseModel):
    authorization_url: str
    reference: str
    access_code: str


class VerifyResponse(BaseModel):
    status: str
    reference: str
    amount_ghs: float
    paid: bool


@router.post("/initialize", response_model=InitPaymentResponse)
async def initialize_payment(request: Request, body: InitPaymentRequest):
    """Initialize a Paystack payment for a single file action."""
    secret = _get_paystack_secret()
    user_id = require_user(request)

    reference = f"rinse-{uuid.uuid4().hex[:12]}"
    amount_pesewas = int(PRICE_PER_FILE_GHS * 100)  # Paystack uses pesewas

    # Get user email from profile
    sb = get_supabase()
    email = body.email
    if not email:
        result = sb.table("profiles").select("email").eq("id", user_id).single().execute()
        if result.data:
            email = result.data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required for payment")

    # Build callback URL — use provided or derive from request origin
    callback_url = body.callback_url
    if not callback_url:
        origin = request.headers.get("origin") or request.headers.get("referer", "")
        if origin:
            # Strip path from referer
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            callback_url = f"{parsed.scheme}://{parsed.netloc}/payment/verify"
        else:
            callback_url = "http://localhost:3000/payment/verify"

    payload = {
        "email": email,
        "amount": amount_pesewas,
        "currency": "GHS",
        "reference": reference,
        "callback_url": callback_url,
        "metadata": {
            "tool": body.tool,
            "user_id": user_id,
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            json=payload,
            headers={"Authorization": f"Bearer {secret}"},
        )

    if resp.status_code != 200:
        logger.error("Paystack init failed: %s %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail="Payment service unavailable. Please try again.")

    data = resp.json()
    if not data.get("status"):
        logger.error("Paystack init error: %s", data.get("message"))
        raise HTTPException(status_code=400, detail=data.get("message", "Payment initialization failed"))

    # Store pending payment
    sb.table("payments").insert({
        "user_id": user_id,
        "reference": reference,
        "amount_ghs": PRICE_PER_FILE_GHS,
        "status": "pending",
        "tool": body.tool,
    }).execute()

    return InitPaymentResponse(
        authorization_url=data["data"]["authorization_url"],
        reference=reference,
        access_code=data["data"]["access_code"],
    )


@router.get("/verify/{reference}", response_model=VerifyResponse)
async def verify_payment(reference: str):
    """Verify a Paystack payment and mark it as successful."""
    secret = _get_paystack_secret()

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {secret}"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify payment with Paystack")

    data = resp.json()
    if not data.get("status"):
        raise HTTPException(status_code=400, detail="Verification failed")

    tx = data["data"]
    paid = tx.get("status") == "success"
    amount_ghs = tx.get("amount", 0) / 100

    # Update payment record
    sb = get_supabase()
    sb.table("payments").update({
        "status": "success" if paid else "failed",
        "paystack_response": tx,
    }).eq("reference", reference).execute()

    # Record paid usage if successful
    if paid:
        metadata = tx.get("metadata", {})
        user_id = metadata.get("user_id")
        tool = metadata.get("tool")
        if user_id and tool:
            record_usage(user_id, tool, 0, paid=True)

    return VerifyResponse(
        status="success" if paid else "failed",
        reference=reference,
        amount_ghs=amount_ghs,
        paid=paid,
    )


@router.post("/webhook")
async def paystack_webhook(request: Request):
    """Paystack server-to-server webhook. Confirms payment even if user closes browser."""
    secret = _get_paystack_secret()

    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    expected = hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        logger.warning("Invalid Paystack webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = json.loads(body)
    event = payload.get("event")
    data = payload.get("data", {})

    if event == "charge.success":
        reference = data.get("reference")
        metadata = data.get("metadata", {})
        tool = metadata.get("tool")
        user_id = metadata.get("user_id")

        if not reference:
            return {"status": "ignored", "reason": "no reference"}

        sb = get_supabase()

        # Idempotency check
        existing = sb.table("payments").select("status").eq("reference", reference).single().execute()
        if existing.data and existing.data.get("status") == "success":
            return {"status": "already_processed"}

        sb.table("payments").update({
            "status": "success",
            "paystack_response": data,
        }).eq("reference", reference).execute()

        if user_id and tool:
            record_usage(user_id, tool, 0, paid=True)

        logger.info("Webhook: payment %s confirmed for user %s", reference, user_id)
        return {"status": "success"}

    return {"status": "ignored", "event": event}
