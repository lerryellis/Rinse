from __future__ import annotations

import io
import math
from typing import List, Optional

import fitz
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel

from src.services.auth import require_user

router = APIRouter()

# Standard page sizes in points (1 point = 1/72 inch)
STANDARD_SIZES = {
    "A3": (841.89, 1190.55),
    "A4": (595.28, 841.89),
    "A5": (419.53, 595.28),
    "Letter": (612, 792),
    "Legal": (612, 1008),
    "Tabloid": (792, 1224),
    "Executive": (522, 756),
    "B4": (708.66, 1000.63),
    "B5": (498.90, 708.66),
}


class PageAnalysis(BaseModel):
    page_number: int
    width_pt: float
    height_pt: float
    width_in: float
    height_in: float
    width_mm: float
    height_mm: float
    orientation: str  # portrait or landscape
    detected_size: Optional[str]
    content_bounds: Optional[dict]  # {x0, y0, x1, y1} of actual content
    margin_top_mm: float
    margin_bottom_mm: float
    margin_left_mm: float
    margin_right_mm: float
    has_text: bool
    has_images: bool
    text_coverage_pct: float  # % of page area covered by text


class DocumentAnalysis(BaseModel):
    total_pages: int
    pages: List[PageAnalysis]
    dominant_size: Optional[str]
    is_consistent: bool  # all pages same size
    suggested_print_size: str
    suggested_orientation: str
    suggestion_reason: str
    has_non_standard_pages: bool
    file_size_bytes: int


def pts_to_inches(pts: float) -> float:
    return round(pts / 72, 2)


def pts_to_mm(pts: float) -> float:
    return round(pts / 72 * 25.4, 1)


def detect_page_size(width: float, height: float) -> Optional[str]:
    """Match page dimensions to nearest standard size (within 5pt tolerance)."""
    tolerance = 5
    # Normalize to portrait
    w, h = min(width, height), max(width, height)
    for name, (sw, sh) in STANDARD_SIZES.items():
        std_w, std_h = min(sw, sh), max(sw, sh)
        if abs(w - std_w) < tolerance and abs(h - std_h) < tolerance:
            return name
    return None


def suggest_print_size(pages: List[PageAnalysis]) -> tuple[str, str, str]:
    """Suggest the best print size and orientation based on content analysis."""
    if not pages:
        return "A4", "portrait", "Default recommendation"

    avg_width = sum(p.width_pt for p in pages) / len(pages)
    avg_height = sum(p.height_pt for p in pages) / len(pages)
    landscape_count = sum(1 for p in pages if p.orientation == "landscape")
    portrait_count = len(pages) - landscape_count

    # Check if content fits well in standard sizes
    # Calculate content area from bounds
    content_widths = []
    content_heights = []
    for p in pages:
        if p.content_bounds:
            cw = p.content_bounds["x1"] - p.content_bounds["x0"]
            ch = p.content_bounds["y1"] - p.content_bounds["y0"]
            content_widths.append(cw)
            content_heights.append(ch)

    orientation = "landscape" if landscape_count > portrait_count else "portrait"

    # If all pages are already a standard size, keep it
    detected = [p.detected_size for p in pages if p.detected_size]
    if detected and all(d == detected[0] for d in detected):
        return detected[0], orientation, f"Document is already formatted for {detected[0]}"

    # If content area is significantly smaller than page, suggest a smaller size
    if content_widths and content_heights:
        avg_cw = sum(content_widths) / len(content_widths)
        avg_ch = sum(content_heights) / len(content_heights)

        best_size = "A4"
        best_waste = float("inf")
        for name, (sw, sh) in STANDARD_SIZES.items():
            std_w, std_h = (sh, sw) if orientation == "landscape" else (sw, sh)
            if avg_cw <= std_w and avg_ch <= std_h:
                waste = (std_w * std_h) - (avg_cw * avg_ch)
                if waste < best_waste:
                    best_waste = waste
                    best_size = name

        if best_size != "A4":
            return best_size, orientation, f"Content fits best on {best_size} with minimal wasted space"

    # Check if wide content needs landscape
    if content_widths:
        avg_cw = sum(content_widths) / len(content_widths)
        avg_ch = sum(content_heights) / len(content_heights)
        if avg_cw > avg_ch * 1.3:
            return "A4", "landscape", "Content is wider than tall — landscape A4 recommended"

    # Default
    detected_sizes = set(d for d in detected if d)
    if len(detected_sizes) > 1:
        return "A4", orientation, f"Mixed page sizes detected ({', '.join(detected_sizes)}). Standardize to A4 for best results."

    return "A4", orientation, "Standard A4 is recommended for this document"


@router.post("/scan", response_model=DocumentAnalysis)
async def scan_document(request: Request, file: UploadFile = File(...)):
    """Analyze a PDF's layout, detect page sizes, and suggest best print format."""
    user_id = require_user(request)

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    file_size = len(contents)
    doc = fitz.open(stream=contents, filetype="pdf")

    pages: List[PageAnalysis] = []

    for i, page in enumerate(doc):
        rect = page.rect
        width = rect.width
        height = rect.height
        orientation = "landscape" if width > height else "portrait"
        detected = detect_page_size(width, height)

        # Analyze content bounds
        blocks = page.get_text("blocks")
        images = page.get_images()
        has_text = any(b[6] == 0 for b in blocks)
        has_images = len(images) > 0

        content_bounds = None
        margin_top = margin_bottom = margin_left = margin_right = 0.0

        if blocks:
            x0 = min(b[0] for b in blocks)
            y0 = min(b[1] for b in blocks)
            x1 = max(b[2] for b in blocks)
            y1 = max(b[3] for b in blocks)
            content_bounds = {"x0": round(x0, 1), "y0": round(y0, 1), "x1": round(x1, 1), "y1": round(y1, 1)}
            margin_top = pts_to_mm(y0)
            margin_bottom = pts_to_mm(height - y1)
            margin_left = pts_to_mm(x0)
            margin_right = pts_to_mm(width - x1)

        # Text coverage
        text_area = sum((b[2] - b[0]) * (b[3] - b[1]) for b in blocks if b[6] == 0)
        page_area = width * height
        text_coverage = round((text_area / page_area) * 100, 1) if page_area > 0 else 0

        pages.append(PageAnalysis(
            page_number=i + 1,
            width_pt=round(width, 2),
            height_pt=round(height, 2),
            width_in=pts_to_inches(width),
            height_in=pts_to_inches(height),
            width_mm=pts_to_mm(width),
            height_mm=pts_to_mm(height),
            orientation=orientation,
            detected_size=detected,
            content_bounds=content_bounds,
            margin_top_mm=margin_top,
            margin_bottom_mm=margin_bottom,
            margin_left_mm=margin_left,
            margin_right_mm=margin_right,
            has_text=has_text,
            has_images=has_images,
            text_coverage_pct=text_coverage,
        ))

    doc.close()

    # Overall analysis
    sizes = set(p.detected_size for p in pages if p.detected_size)
    non_standard = any(p.detected_size is None for p in pages)
    is_consistent = len(set((p.width_pt, p.height_pt) for p in pages)) == 1
    dominant = max(sizes, key=lambda s: sum(1 for p in pages if p.detected_size == s)) if sizes else None

    suggested_size, suggested_orient, reason = suggest_print_size(pages)

    return DocumentAnalysis(
        total_pages=len(pages),
        pages=pages,
        dominant_size=dominant,
        is_consistent=is_consistent,
        suggested_print_size=suggested_size,
        suggested_orientation=suggested_orient,
        suggestion_reason=reason,
        has_non_standard_pages=non_standard,
        file_size_bytes=file_size,
    )


class ResizeRequest(BaseModel):
    target_size: str  # e.g. "A4", "Letter"
    orientation: str  # "portrait" or "landscape"
    margin_mm: float = 10.0


@router.post("/resize")
async def resize_document(request: Request, file: UploadFile = File(...), target_size: str = "A4", orientation: str = "portrait", margin_mm: float = 10.0):
    """Resize/reformat a PDF to fit a target page size with specified margins."""
    user_id = require_user(request)

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if target_size not in STANDARD_SIZES:
        raise HTTPException(status_code=400, detail=f"Unknown size '{target_size}'. Use: {', '.join(STANDARD_SIZES.keys())}")

    contents = await file.read()
    src = fitz.open(stream=contents, filetype="pdf")
    dst = fitz.open()

    tw, th = STANDARD_SIZES[target_size]
    if orientation == "landscape":
        tw, th = th, tw

    margin_pt = margin_mm / 25.4 * 72

    for page in src:
        new_page = dst.new_page(width=tw, height=th)
        # Calculate scale to fit content within margins
        target_rect = fitz.Rect(margin_pt, margin_pt, tw - margin_pt, th - margin_pt)
        new_page.show_pdf_page(target_rect, src, page.number)

    src.close()
    output = dst.tobytes(garbage=4, deflate=True)
    dst.close()

    from src.services.usage import record_usage
    device_id = request.headers.get("x-device-id")
    record_usage(user_id, "resize", len(contents), device_id=device_id)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="resized-{target_size}.pdf"'},
    )
