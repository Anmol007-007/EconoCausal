import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_headers():
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_experiments_workflow(admin_headers):
    # 1. Create experiment
    payload = {
        "name": "E2E Causal Forest Test",
        "description": "Integration test experiment",
        "row_count": 2500,
        "meta_info": {"model": "dml_causal_forest"},
    }
    create_resp = client.post("/api/experiments", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    exp_data = create_resp.json()["data"]
    exp_id = exp_data["id"]
    assert exp_data["name"] == "E2E Causal Forest Test"

    # 2. List experiments
    list_resp = client.get("/api/experiments", headers=admin_headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["count"] >= 1

    # 3. Add run to experiment
    run_payload = {
        "run_type": "dml_causal_forest",
        "status": "completed",
        "params": {"n_estimators": 48},
        "results": {"ate": 2.15, "pehe": 0.12},
        "duration_ms": 450.0,
    }
    run_resp = client.post(f"/api/experiments/{exp_id}/runs", json=run_payload, headers=admin_headers)
    assert run_resp.status_code == 201
    assert run_resp.json()["data"]["experiment_id"] == exp_id

    # 4. Get experiment detail with runs
    detail_resp = client.get(f"/api/experiments/{exp_id}", headers=admin_headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()["data"]
    assert len(detail_data["runs"]) >= 1

    # 5. List runs endpoint
    runs_resp = client.get(f"/api/experiments/{exp_id}/runs", headers=admin_headers)
    assert runs_resp.status_code == 200
    assert runs_resp.json()["count"] >= 1

    # 6. Audit logs endpoint (admin only)
    audit_resp = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    assert "data" in audit_resp.json()

    # 7. Delete experiment
    del_resp = client.delete(f"/api/experiments/{exp_id}", headers=admin_headers)
    assert del_resp.status_code == 200

    # 8. Verify deleted
    get_del = client.get(f"/api/experiments/{exp_id}", headers=admin_headers)
    assert get_del.status_code == 404
