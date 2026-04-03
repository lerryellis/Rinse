from __future__ import annotations

import hashlib
import secrets
import io
from datetime import datetime, timezone

import fitz
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.services.usage import get_supabase, record_usage

router = APIRouter()


def require_api_key(request: Request) -> str:
    """Authenticate via X-API-Key header. Returns user_id."""
    key = request.headers.get("x-api-key", "")
    if not key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    key_hash = hashlib.sha256(key.encode()).hexdigest()
    sb = get_supabase()

    try:
        result = sb.table("api_keys").select("user_id, active").eq("key_hash", key_hash).single().execute()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not result.data.get("active"):
        raise HTTPException(status_code=403, detail="API key has been deactivated")

    # Update last_used
    sb.table("api_keys").update({
        "last_used_at": datetime.now(timezone.utc).isoformat(),
    }).eq("key_hash", key_hash).execute()

    return result.data["user_id"]


class CreateKeyResponse(BaseModel):
    key: str
    key_prefix: str
    name: str


@router.post("/keys", response_model=CreateKeyResponse)
async def create_api_key(request: Request, name: str = "Default"):
    """Create a new API key. Requires auth via JWT."""
    from src.services.auth import require_user
    user_id = require_user(request)

    raw_key = f"rk_live_{secrets.token_hex(24)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:16] + "..."

    sb = get_supabase()
    sb.table("api_keys").insert({
        "user_id": user_id,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "name": name,
    }).execute()

    return CreateKeyResponse(key=raw_key, key_prefix=key_prefix, name=name)


@router.get("/keys")
async def list_api_keys(request: Request):
    """List API keys for the authenticated user."""
    from src.services.auth import require_user
    user_id = require_user(request)

    sb = get_supabase()
    result = sb.table("api_keys").select("id, key_prefix, name, active, last_used_at, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"keys": result.data or []}


@router.delete("/keys/{key_id}")
async def revoke_api_key(request: Request, key_id: int):
    """Deactivate an API key."""
    from src.services.auth import require_user
    user_id = require_user(request)

    sb = get_supabase()
    sb.table("api_keys").update({"active": False}).eq("id", key_id).eq("user_id", user_id).execute()
    return {"status": "revoked"}


# ─── Public API Endpoints (authenticated via X-API-Key) ───

@router.post("/compress")
async def api_compress(request: Request, file: UploadFile = File(...)):
    """Compress a PDF. Auth via X-API-Key header."""
    user_id = require_api_key(request)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    output = doc.tobytes(garbage=4, deflate=True, clean=True)
    doc.close()

    record_usage(user_id, "api:compress", len(contents), paid=True)

    return StreamingResponse(io.BytesIO(output), media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="compressed.pdf"'})


@router.post("/merge")
async def api_merge(request: Request, files: list[UploadFile] = File(...)):
    """Merge multiple PDFs. Auth via X-API-Key header."""
    user_id = require_api_key(request)

    merged = fitz.open()
    total_size = 0
    for f in files:
        if f.content_type != "application/pdf":
            continue
        contents = await f.read()
        total_size += len(contents)
        doc = fitz.open(stream=contents, filetype="pdf")
        merged.insert_pdf(doc)
        doc.close()

    output = merged.tobytes(garbage=4, deflate=True)
    merged.close()

    record_usage(user_id, "api:merge", total_size, paid=True)

    return StreamingResponse(io.BytesIO(output), media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="merged.pdf"'})


@router.post("/to-jpg")
async def api_to_jpg(request: Request, file: UploadFile = File(...)):
    """Convert PDF to JPG images (zip). Auth via X-API-Key header."""
    import zipfile

    user_id = require_api_key(request)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            zf.writestr(f"page-{i + 1}.jpg", pix.tobytes("jpeg"))
    doc.close()
    zip_buffer.seek(0)

    record_usage(user_id, "api:to-jpg", len(contents), paid=True)

    return StreamingResponse(zip_buffer, media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="pages.zip"'})


@router.post("/to-text")
async def api_to_text(request: Request, file: UploadFile = File(...)):
    """Extract text from PDF. Auth via X-API-Key header."""
    user_id = require_api_key(request)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text() + "\n\n"
    doc.close()

    record_usage(user_id, "api:to-text", len(contents), paid=True)

    return StreamingResponse(io.BytesIO(text.encode("utf-8")), media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="extracted.txt"'})


@router.post("/html-to-pdf")
async def api_html_to_pdf(request: Request):
    """Convert HTML/URL to PDF. Auth via X-API-Key header. JSON body: {html?, url?, format?, landscape?}"""
    user_id = require_api_key(request)

    body = await request.json()
    html = body.get("html")
    url = body.get("url")
    page_format = body.get("format", "A4")
    landscape = body.get("landscape", False)

    if not html and not url:
        raise HTTPException(status_code=400, detail="Provide 'html' or 'url'")

    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        if url:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        else:
            await page.set_content(html, wait_until="networkidle", timeout=15000)
        pdf_bytes = await page.pdf(format=page_format, landscape=landscape, print_background=True,
            margin={"top": "20mm", "bottom": "20mm", "left": "15mm", "right": "15mm"})
        await browser.close()

    record_usage(user_id, "api:html-to-pdf", len(pdf_bytes), paid=True)

    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="converted.pdf"'})
