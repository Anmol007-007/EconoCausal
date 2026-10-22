from __future__ import annotations
import io
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_upload_dataset_default():
    response = client.post("/api/upload", data={"seed": 42, "n_records": 100})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["records"] == 100
    assert data["validated"] is True
    assert "confounders" in data

def test_upload_dataset_csv_file():
    csv_content = (
        "past_spend,recency_days,loyalty_tier,age,category_affinity,discount,purchase\n"
        "150.0,45,Silver,35,0.75,10,1\n"
        "80.0,120,Bronze,28,0.20,0,0\n"
        "300.0,10,Gold,55,0.90,20,1\n"
    )
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["records"] == 3
    assert data["validated"] is True

def test_uplift_endpoint():
    client.post("/api/upload", data={"seed": 42, "n_records": 150})
    response = client.post(
        "/api/uplift",
        json={"n_estimators": 16, "cv": 2, "subforest_size": 4},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "CausalForestDML"
    assert "ate_10" in data
    assert "ate_20" in data
    assert "qini_score" in data
    assert "execution_time_seconds" in data

def test_allocate_endpoint():
    response = client.post(
        "/api/allocate",
        json={"total_budget": 500.0, "unit_margin": 45.0, "max_arm_20": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["solver"] == "scipy.optimize.milp"
    assert data["budget_allocated"] <= 500.0
    assert "net_incremental_profit" in data
    assert "targeted_persuadables" in data

def test_diagnostics_endpoint():
    response = client.get("/api/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert "dag_dot" in data
    assert "estimand_backdoor_variables" in data
    assert "overlap_report" in data
    assert "refutations" in data

def test_drift_endpoint():
    response = client.post("/api/drift", json={"psi_threshold": 0.20})
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "max_psi" in data
    assert "overall_status" in data

def test_summary_endpoint():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert "narrative" in data
    assert "pillars" in data
    assert len(data["pillars"]) == 4
    assert "kpis" in data

def test_get_benchmarks_endpoint():
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    ids = [b["id"] for b in data]
    assert "synthetic_retail" in ids
    assert "hillstrom_email" in ids
    assert "starbucks_uplift" in ids

def test_upload_dataset_benchmark():
    response = client.post("/api/upload", data={"benchmark": "hillstrom_email", "n_records": 120, "seed": 42})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["records"] == 120
    assert "schema_report" in data
    assert data["schema_report"]["is_valid"] is True
