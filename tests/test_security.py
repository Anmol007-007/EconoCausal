import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient
from api.main import app
from api.sanitizer import sanitize_csv_data

client = TestClient(app)

def test_security_headers_present():
    response = client.get("/api/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "default-src" in headers.get("Content-Security-Policy", "")

def test_timing_and_correlation_headers():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers
    assert "X-Request-ID" in response.headers
    assert float(response.headers["X-Process-Time-Ms"]) >= 0

def test_payload_size_limit_rejection():
    # Attempting to upload simulated >10MB payload
    oversized_bytes = b"0" * (10485760 + 1024)
    response = client.post(
        "/api/upload",
        files={"file": ("large.csv", oversized_bytes, "text/csv")},
    )
    assert response.status_code == 413
    assert "Payload too large" in response.json()["detail"]

def test_csv_injection_sanitization():
    # Create malicious CSV containing formula injections
    malicious_data = {
        "past_spend": [100.0, 200.0],
        "recency_days": [10, 20],
        "loyalty_tier": ["=cmd|' /C calc'!A0", "+1+1"],
        "category_affinity": [0.5, 0.8],
        "discount": [10, 20],
        "purchase": [1, 0],
    }
    df = pd.DataFrame(malicious_data)
    cleaned = sanitize_csv_data(df)

    # Formula characters should be prefixed with single quote
    assert cleaned["loyalty_tier"].iloc[0].startswith("'=")
    assert cleaned["loyalty_tier"].iloc[1].startswith("'+")

