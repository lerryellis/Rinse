"""Unit tests for client-side PDF utility logic (testing the backend equivalents)."""
import io
import fitz
import pytest


def create_test_pdf(pages: int = 3, text: str = "Test content") -> bytes:
    """Create a minimal valid PDF for testing."""
    doc = fitz.open()
    for i in range(pages):
        page = doc.new_page()
        tw = fitz.TextWriter(page.rect)
        font = fitz.Font("helv")
        tw.append(fitz.Point(72, 72), f"{text} - Page {i + 1}", font=font, fontsize=12)
        tw.write_text(page)
    output = doc.tobytes()
    doc.close()
    return output


def test_create_pdf():
    pdf_bytes = create_test_pdf(3)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    assert doc.page_count == 3
    doc.close()


def test_compress_pdf():
    original = create_test_pdf(5, "A" * 500)
    doc = fitz.open(stream=original, filetype="pdf")
    compressed = doc.tobytes(garbage=4, deflate=True, clean=True)
    doc.close()
    # Compressed should be valid PDF
    doc2 = fitz.open(stream=compressed, filetype="pdf")
    assert doc2.page_count == 5
    doc2.close()


def test_extract_text():
    pdf_bytes = create_test_pdf(2, "Hello World")
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    assert "Hello World" in text
    assert "Page 1" in text
    assert "Page 2" in text


def test_pdf_to_images():
    pdf_bytes = create_test_pdf(2)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        pix = page.get_pixmap(dpi=72)
        img_bytes = pix.tobytes("jpeg")
        assert len(img_bytes) > 0
        assert img_bytes[:2] == b'\xff\xd8'  # JPEG magic bytes
    doc.close()


def test_rotate_page():
    pdf_bytes = create_test_pdf(1)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    original_rotation = page.rotation
    page.set_rotation(90)
    assert page.rotation == 90
    output = doc.tobytes()
    doc.close()

    doc2 = fitz.open(stream=output, filetype="pdf")
    assert doc2[0].rotation == 90
    doc2.close()


def test_merge_pdfs():
    pdf1 = create_test_pdf(2, "Doc A")
    pdf2 = create_test_pdf(3, "Doc B")

    merged = fitz.open()
    for pdf_bytes in [pdf1, pdf2]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        merged.insert_pdf(doc)
        doc.close()

    assert merged.page_count == 5
    text = merged[0].get_text()
    assert "Doc A" in text
    text2 = merged[3].get_text()
    assert "Doc B" in text2
    merged.close()


def test_split_pdf():
    pdf_bytes = create_test_pdf(5)
    source = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Extract pages 2-3
    result = fitz.open()
    result.insert_pdf(source, from_page=1, to_page=2)
    assert result.page_count == 2
    source.close()
    result.close()


def test_delete_pages():
    pdf_bytes = create_test_pdf(4)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    # Delete page 2 (0-indexed: page 1)
    doc.delete_page(1)
    assert doc.page_count == 3
    doc.close()


def test_watermark():
    pdf_bytes = create_test_pdf(1)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    tw = fitz.TextWriter(page.rect)
    font = fitz.Font("helv")
    tw.append(fitz.Point(100, 400), "DRAFT", font=font, fontsize=50)
    tw.write_text(page, opacity=0.3, color=(0.7, 0.7, 0.7))
    output = doc.tobytes()
    doc.close()

    doc2 = fitz.open(stream=output, filetype="pdf")
    text = doc2[0].get_text()
    assert "DRAFT" in text
    doc2.close()


def test_protect_and_unlock():
    pdf_bytes = create_test_pdf(1)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Protect
    protected = doc.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw="secret123",
        owner_pw="secret123",
    )
    doc.close()

    # Try opening without password
    doc2 = fitz.open(stream=protected, filetype="pdf")
    assert doc2.is_encrypted

    # Unlock with password
    assert doc2.authenticate("secret123")
    unlocked = doc2.tobytes()
    doc2.close()

    doc3 = fitz.open(stream=unlocked, filetype="pdf")
    assert doc3.page_count == 1
    doc3.close()


def test_crop_pdf():
    pdf_bytes = create_test_pdf(1)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    original_rect = page.rect
    # Set a crop box
    crop = fitz.Rect(50, 50, original_rect.width - 50, original_rect.height - 50)
    page.set_cropbox(crop)
    assert page.cropbox == crop
    doc.close()
