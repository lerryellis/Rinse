from __future__ import annotations

import os
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from src.services.usage import get_supabase, PRICE_PER_FILE_GHS

router = APIRouter()

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_BASE = "https://api.paystack.co"


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


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _extract_user_id(request: Request):
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        try:
            import jwt
            token = auth.split(" ", 1)[1]
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except Exception:
            pass
    return None


@router.post("/initialize", response_model=InitPaymentResponse)
async def initialize_payment(request: Request, body: InitPaymentRequest):
    """Initialize a Paystack payment for a single file action."""
    if not PAYSTACK_SECRET:
        raise HTTPException(status_code=500, detail="Payment not configured")

    user_id = _extract_user_id(request)
    ip = _get_ip(request)

    reference = f"rinse-{uuid.uuid4().hex[:12]}"
    amount_pesewas = int(PRICE_PER_FILE_GHS * 100)  # Paystack uses pesewas

    # Determine email
    email = body.email
    if not email and user_id:
        sb = get_supabase()
        result = sb.table("profiles").select("email").eq("id", user_id).single().execute()
        if result.data:
            email = result.data.get("email")
    if not email:
        email = "guest@rinse.dev"

    payload = {
        "email": email,
        "amount": amount_pesewas,
        "currency": "GHS",
        "reference": reference,
        "callback_url": body.callback_url or "http://localhost:3000/payment/verify",
        "metadata": {
            "tool": body.tool,
            "user_id": user_id,
            "ip_address": ip,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            json=payload,
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
        )

    data = resp.json()
    if not data.get("status"):
        raise HTTPException(status_code=400, detail=data.get("message", "Payment init failed"))

    # Store pending payment
    sb = get_supabase()
    sb.table("payments").insert({
        "user_id": user_id,
        "ip_address": ip,
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
    if not PAYSTACK_SECRET:
        raise HTTPException(status_code=500, detail="Payment not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
        )

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

    return VerifyResponse(
        status="success" if paid else "failed",
        reference=reference,
        amount_ghs=amount_ghs,
        paid=paid,
    )
