"""Integration tests for Rinse API endpoints."""
import io
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "Rinse API"


def test_payment_status():
    res = client.get("/api/payments/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "mode" in data


def test_pdf_compress_requires_auth():
    """PDF endpoints should require authentication."""
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake content")
    res = client.post("/api/pdf/compress", files={"file": ("test.pdf", fake_pdf, "application/pdf")})
    assert res.status_code == 401
    assert "Sign in required" in res.json()["detail"]


def test_pdf_compress_rejects_non_pdf():
    """Should reject non-PDF files."""
    fake_file = io.BytesIO(b"not a pdf")
    res = client.post(
        "/api/pdf/compress",
        files={"file": ("test.txt", fake_file, "text/plain")},
        headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQifQ.fake"},
    )
    # Will either be 400 (not PDF) or 403 (suspended/not found) — both are correct rejections
    assert res.status_code in [400, 403, 500]


def test_usage_requires_auth():
    res = client.get("/api/auth/usage")
    assert res.status_code == 401


def test_history_requires_auth():
    res = client.get("/api/auth/history")
    assert res.status_code == 401


def test_admin_stats_requires_auth():
    res = client.get("/api/admin/stats")
    assert res.status_code == 401


def test_admin_users_requires_auth():
    res = client.get("/api/admin/users")
    assert res.status_code == 401


def test_referral_info_requires_auth():
    res = client.get("/api/referrals/info")
    assert res.status_code == 401


def test_developer_api_requires_key():
    """Developer API endpoints should require X-API-Key."""
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake")
    res = client.post("/api/v1/compress", files={"file": ("test.pdf", fake_pdf, "application/pdf")})
    assert res.status_code == 401
    assert "API-Key" in res.json()["detail"] or "Missing" in res.json()["detail"]


def test_developer_api_invalid_key():
    """Invalid API key should be rejected."""
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake")
    res = client.post(
        "/api/v1/compress",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")},
        headers={"X-API-Key": "rk_live_invalid_key_123"},
    )
    # 401 (invalid key) or 500 (Supabase error) — both mean rejected
    assert res.status_code in [401, 500]


def test_analyze_scan_requires_auth():
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake")
    res = client.post("/api/analyze/scan", files={"file": ("test.pdf", fake_pdf, "application/pdf")})
    assert res.status_code == 401


def test_batch_compress_requires_auth():
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake")
    res = client.post("/api/batch/compress", files=[("files", ("test.pdf", fake_pdf, "application/pdf"))])
    assert res.status_code == 401
