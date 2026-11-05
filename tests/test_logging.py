import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.logging_config import configure_logging, get_logger, get_recent_logs, request_id_ctx, user_id_ctx
from api.monitoring.metrics import export_metrics, HTTP_REQUESTS_TOTAL

client = TestClient(app)

def test_structlog_configuration():
    configure_logging(environment="development", log_level="DEBUG")
    logger = get_logger("test.logger")
    assert logger is not None

def test_request_id_in_context():
    token = request_id_ctx.set("req_test_abc123")
    try:
        assert request_id_ctx.get() == "req_test_abc123"
    finally:
        request_id_ctx.reset(token)

def test_metrics_endpoint_accessible():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert "econocausal_http_requests_total" in response.text

def test_root_metrics_alias():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "econocausal_http_requests_total" in response.text

def test_admin_logs_endpoint_unauthorized():
    response = client.get("/api/admin/logs")
    assert response.status_code in (401, 403)

def test_admin_logs_endpoint_authorized():
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/admin/logs?limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "logs" in data
    assert isinstance(data["logs"], list)

