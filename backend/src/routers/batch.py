from __future__ import annotations

import io
import zipfile
from typing import List

import fitz
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse

from src.services.usage import check_limits, record_usage
from src.services.auth import require_user

router = APIRouter()


@router.post("/compress")
async def batch_compress(request: Request, files: List[UploadFile] = File(...)):
    """Compress multiple PDFs and return a zip."""
    user_id = require_user(request)
    device_id = request.headers.get("x-device-id")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f.content_type != "application/pdf":
                continue
            contents = await f.read()
            error = check_limits(user_id, len(contents), device_id)
            if error:
                raise HTTPException(status_code=429, detail=error)

            doc = fitz.open(stream=contents, filetype="pdf")
            output = doc.tobytes(garbage=4, deflate=True, clean=True)
            doc.close()

            zf.writestr(f"compressed-{f.filename}", output)
            record_usage(user_id, "batch-compress", len(contents), device_id=device_id)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="batch-compressed.zip"'},
    )


@router.post("/to-jpg")
async def batch_to_jpg(request: Request, files: List[UploadFile] = File(...)):
    """Convert multiple PDFs to JPGs and return a zip."""
    user_id = require_user(request)
    device_id = request.headers.get("x-device-id")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for fi, f in enumerate(files):
            if f.content_type != "application/pdf":
                continue
            contents = await f.read()
            error = check_limits(user_id, len(contents), device_id)
            if error:
                raise HTTPException(status_code=429, detail=error)

            doc = fitz.open(stream=contents, filetype="pdf")
            base = f.filename.rsplit(".", 1)[0] if f.filename else f"file-{fi}"
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=200)
                zf.writestr(f"{base}/page-{i + 1}.jpg", pix.tobytes("jpeg"))
            doc.close()
            record_usage(user_id, "batch-to-jpg", len(contents), device_id=device_id)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="batch-images.zip"'},
    )


@router.post("/to-word")
async def batch_to_word(request: Request, files: List[UploadFile] = File(...)):
    """Convert multiple PDFs to Word docs and return a zip."""
    from docx import Document
    from docx.shared import Pt

    user_id = require_user(request)
    device_id = request.headers.get("x-device-id")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f.content_type != "application/pdf":
                continue
            contents = await f.read()
            error = check_limits(user_id, len(contents), device_id)
            if error:
                raise HTTPException(status_code=429, detail=error)

            doc = fitz.open(stream=contents, filetype="pdf")
            word_doc = Document()
            for page in doc:
                for block in page.get_text("blocks"):
                    if block[6] == 0:
                        text = block[4].strip()
                        if text:
                            p = word_doc.add_paragraph(text)
                            p.style.font.size = Pt(11)
                word_doc.add_page_break()
            doc.close()

            docx_buf = io.BytesIO()
            word_doc.save(docx_buf)
            base = f.filename.rsplit(".", 1)[0] if f.filename else "converted"
            zf.writestr(f"{base}.docx", docx_buf.getvalue())
            record_usage(user_id, "batch-to-word", len(contents), device_id=device_id)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="batch-converted.zip"'},
    )
