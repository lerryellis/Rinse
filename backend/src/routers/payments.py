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


def _get_paystack_secret() -> Optional[str]:
    """Read Paystack secret at call time. Returns None if not configured."""
    key = os.getenv("PAYSTACK_SECRET_KEY", "")
    if not key or key.startswith("sk_test_your"):
        return None
    return key


def _is_test_mode() -> bool:
    return _get_paystack_secret() is None


class InitPaymentRequest(BaseModel):
    tool: str
    email: Optional[str] = None
    callback_url: Optional[str] = None


class InitPaymentResponse(BaseModel):
    authorization_url: str
    reference: str
    access_code: str
    test_mode: bool = False


class VerifyResponse(BaseModel):
    status: str
    reference: str
    amount_ghs: float
    paid: bool
    test_mode: bool = False


@router.get("/status")
async def payment_status():
    """Check if Paystack is configured."""
    configured = not _is_test_mode()
    return {
        "configured": configured,
        "mode": "live" if configured else "test",
        "message": "Paystack is active" if configured else "Paystack not configured — running in test mode. Payments are simulated. Add PAYSTACK_SECRET_KEY to enable real payments.",
    }


@router.post("/initialize", response_model=InitPaymentResponse)
async def initialize_payment(request: Request, body: InitPaymentRequest):
    """Initialize a Paystack payment for a single file action."""
    user_id = require_user(request)
    reference = f"rinse-{uuid.uuid4().hex}"

    # Get user email
    sb = get_supabase()
    email = body.email
    if not email:
        result = sb.table("profiles").select("email").eq("id", user_id).single().execute()
        if result.data:
            email = result.data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required for payment")

    # Build callback URL
    callback_url = body.callback_url
    if not callback_url:
        origin = request.headers.get("origin") or request.headers.get("referer", "")
        if origin:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            callback_url = f"{parsed.scheme}://{parsed.netloc}/payment/verify"
        else:
            callback_url = "http://localhost:3000/payment/verify"

    # Store pending payment
    sb.table("payments").insert({
        "user_id": user_id,
        "reference": reference,
        "amount_ghs": PRICE_PER_FILE_GHS,
        "status": "pending",
        "tool": body.tool,
    }).execute()

    # ── TEST MODE: simulate payment ──
    secret = _get_paystack_secret()
    if not secret:
        logger.info("TEST MODE: Simulating payment %s for user %s", reference, user_id)
        # Auto-mark as success
        sb.table("payments").update({
            "status": "success",
            "paystack_response": {"test_mode": True, "reference": reference},
        }).eq("reference", reference).execute()
        # Grant the usage credit
        record_usage(user_id, body.tool, 0, paid=True)

        return InitPaymentResponse(
            authorization_url=f"{callback_url}?reference={reference}&trxref={reference}",
            reference=reference,
            access_code="test_mode",
            test_mode=True,
        )

    # ── LIVE MODE: real Paystack ──
    amount_pesewas = int(PRICE_PER_FILE_GHS * 100)
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

    return InitPaymentResponse(
        authorization_url=data["data"]["authorization_url"],
        reference=reference,
        access_code=data["data"]["access_code"],
        test_mode=False,
    )


@router.get("/verify/{reference}", response_model=VerifyResponse)
async def verify_payment(request: Request, reference: str):
    """Verify a Paystack payment and mark it as successful."""
    # Require authenticated user
    user_id = require_user(request)

    sb = get_supabase()

    # Load payment record — must belong to the authenticated user
    existing = sb.table("payments").select("status, user_id, tool").eq("reference", reference).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Payment reference not found")

    # Prevent one user from verifying another's payment
    if existing.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if existing.data.get("status") == "success":
        return VerifyResponse(
            status="success",
            reference=reference,
            amount_ghs=float(PRICE_PER_FILE_GHS),
            paid=True,
            test_mode=_is_test_mode(),
        )

    # ── TEST MODE ──
    secret = _get_paystack_secret()
    if not secret:
        sb.table("payments").update({"status": "success"}).eq("reference", reference).eq("user_id", user_id).execute()
        tool = existing.data.get("tool")
        if tool:
            record_usage(user_id, tool, 0, paid=True)
        return VerifyResponse(
            status="success",
            reference=reference,
            amount_ghs=float(PRICE_PER_FILE_GHS),
            paid=True,
            test_mode=True,
        )

    # ── LIVE MODE ──
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

    # Verify the payment belongs to this user via Paystack metadata
    metadata = tx.get("metadata", {})
    paystack_user_id = metadata.get("user_id")
    if paystack_user_id and paystack_user_id != user_id:
        logger.warning("Payment user_id mismatch: %s vs %s for ref %s", paystack_user_id, user_id, reference)
        raise HTTPException(status_code=403, detail="Payment does not belong to this account")

    # Only store essential fields — not the full payment processor response
    sb.table("payments").update({
        "status": "success" if paid else "failed",
        "paystack_reference": tx.get("reference"),
        "paystack_channel": tx.get("channel"),
    }).eq("reference", reference).eq("user_id", user_id).execute()

    tool = existing.data.get("tool")
    if paid and tool:
        record_usage(user_id, tool, 0, paid=True)

    return VerifyResponse(
        status="success" if paid else "failed",
        reference=reference,
        amount_ghs=amount_ghs,
        paid=paid,
        test_mode=False,
    )


@router.post("/webhook")
async def paystack_webhook(request: Request):
    """Paystack server-to-server webhook."""
    secret = _get_paystack_secret()
    if not secret:
        return {"status": "test_mode", "message": "Webhooks disabled in test mode"}

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
