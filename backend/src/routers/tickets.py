from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Request, HTTPException, Query
from pydantic import BaseModel

from src.services.auth import require_user
from src.services.usage import get_supabase

router = APIRouter()


class CreateTicketRequest(BaseModel):
    subject: str
    description: str
    category: str = "general"
    priority: str = "medium"


class AddMessageRequest(BaseModel):
    message: str


@router.post("/create")
async def create_ticket(request: Request, body: CreateTicketRequest):
    """Create a new support ticket."""
    user_id = require_user(request)
    sb = get_supabase()

    result = sb.table("tickets").insert({
        "user_id": user_id,
        "subject": body.subject,
        "description": body.description,
        "category": body.category,
        "priority": body.priority,
    }).execute()

    ticket_id = result.data[0]["id"]

    # Add the description as the first message
    sb.table("ticket_messages").insert({
        "ticket_id": ticket_id,
        "sender_id": user_id,
        "message": body.description,
        "is_admin": False,
    }).execute()

    return {"status": "created", "ticket_id": ticket_id}


@router.get("/my-tickets")
async def list_my_tickets(request: Request):
    """List the current user's tickets."""
    user_id = require_user(request)
    sb = get_supabase()

    result = (
        sb.table("tickets")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {"tickets": result.data or []}


@router.get("/{ticket_id}")
async def get_ticket(request: Request, ticket_id: int):
    """Get a ticket and its messages."""
    user_id = require_user(request)
    sb = get_supabase()

    ticket = sb.table("tickets").select("*").eq("id", ticket_id).single().execute()
    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Verify ownership (unless admin)
    from src.services.auth import is_user_admin
    if ticket.data["user_id"] != user_id and not is_user_admin(user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        sb.table("ticket_messages")
        .select("*, profiles(email, full_name)")
        .eq("ticket_id", ticket_id)
        .order("created_at", desc=False)
        .execute()
    )

    return {"ticket": ticket.data, "messages": messages.data or []}


@router.post("/{ticket_id}/reply")
async def reply_to_ticket(request: Request, ticket_id: int, body: AddMessageRequest):
    """Add a message to a ticket."""
    user_id = require_user(request)
    sb = get_supabase()

    ticket = sb.table("tickets").select("user_id, status").eq("id", ticket_id).single().execute()
    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    from src.services.auth import is_user_admin
    is_admin = is_user_admin(user_id)

    if ticket.data["user_id"] != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    if ticket.data["status"] == "closed":
        raise HTTPException(status_code=400, detail="This ticket is closed")

    sb.table("ticket_messages").insert({
        "ticket_id": ticket_id,
        "sender_id": user_id,
        "message": body.message,
        "is_admin": is_admin,
    }).execute()

    # Update ticket timestamp
    sb.table("tickets").update({
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", ticket_id).execute()

    return {"status": "replied"}


# ─── Admin-only endpoints ───

@router.get("/admin/all")
async def admin_list_tickets(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
):
    """List all tickets (admin only)."""
    user_id = require_user(request)
    from src.services.auth import is_user_admin
    if not is_user_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")

    sb = get_supabase()
    offset = (page - 1) * limit

    query = (
        sb.table("tickets")
        .select("*, profiles(email, full_name)", count="exact")
        .order("updated_at", desc=True)
    )

    if status:
        query = query.eq("status", status)
    if category:
        query = query.eq("category", category)
    if priority:
        query = query.eq("priority", priority)

    result = query.range(offset, offset + limit - 1).execute()

    return {
        "tickets": result.data or [],
        "total": result.count or 0,
        "page": page,
    }


@router.patch("/admin/{ticket_id}")
async def admin_update_ticket(request: Request, ticket_id: int):
    """Update ticket status, priority, assignment (admin only)."""
    user_id = require_user(request)
    from src.services.auth import is_user_admin
    if not is_user_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")

    body = await request.json()
    sb = get_supabase()

    allowed = {"status", "priority", "assigned_to", "category"}
    updates = {k: v for k, v in body.items() if k in allowed}

    if "status" in updates and updates["status"] == "resolved":
        updates["resolved_at"] = datetime.now(timezone.utc).isoformat()

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    sb.table("tickets").update(updates).eq("id", ticket_id).execute()
    return {"status": "updated"}
