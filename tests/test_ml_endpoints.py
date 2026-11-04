import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_shap_endpoint():
    res = client.get("/api/shap")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["importance"]) >= 4
    assert "sample_waterfall" in data

    post_res = client.post("/api/shap")
    assert post_res.status_code == 200

def test_segments_endpoint():
    res = client.get("/api/segments")
    assert res.status_code == 200
    segments = res.json()
    quadrants = [s["quadrant"] for s in segments]
    assert "Persuadable" in quadrants
    assert "Sure Thing" in quadrants
    assert "Lost Cause" in quadrants
    assert "Sleeping Dog" in quadrants

def test_roi_sim_endpoint():
    payload = {
        "budget": 7500.0,
        "unit_margin": 50.0,
        "targeting_strategy": "persuadables_only",
        "discount_depth": 10,
    }
    res = client.post("/api/roi-sim", json=payload)
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 3
    assert scenarios[0]["budget"] == 7500.0
    assert scenarios[0]["net_incremental_profit"] > 0

def test_live_metrics_endpoint():
    res = client.get("/api/live-metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert len(metrics) >= 6
    metric_ids = [m["id"] for m in metrics]
    assert "auqc" in metric_ids
    assert "pehe" in metric_ids

def test_model_comparison_endpoint():
    res = client.get("/api/model-comparison")
    assert res.status_code == 200
    benchmarks = res.json()
    learners = [b["learner"] for b in benchmarks]
    assert "CausalForestDML" in learners
    assert "XLearner" in learners
    assert "TLearner" in learners
    assert "SLearner" in learners

def test_explain_customer_endpoint():
    profile = {
        "past_spend": 240.0,
        "recency_days": 12,
        "category_affinity": 0.88,
        "age": 36,
        "loyalty_tier": "Silver",
    }
    res = client.post("/api/explain", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert "estimated_cate" in data
    assert "recommended_quadrant" in data
    assert "explanation" in data

def test_version_and_detailed_health_endpoints():
    v_res = client.get("/api/version")
    assert v_res.status_code == 200
    assert v_res.json()["api_version"] == "2.0.0"

    h_res = client.get("/api/health/detailed")
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "healthy"
    assert "services" in h_res.json()

def test_export_endpoints():
    json_res = client.get("/api/export/json")
    assert json_res.status_code == 200
    assert "kpis" in json_res.json()

    csv_res = client.get("/api/export/csv")
    assert csv_res.status_code == 200
    assert "net_incremental_profit" in csv_res.text

    invalid_res = client.get("/api/export/invalid_format")
    assert invalid_res.status_code == 400

def test_validate_dataset_endpoint():
    df = pd.DataFrame({
        "past_spend": [120.0, 85.0],
        "recency_days": [14, 28],
        "loyalty_tier": ["Gold", "Silver"],
        "category_affinity": [0.75, 0.50],
        "age": [32, 45],
        "discount": [10, 0],
        "purchase": [1, 0],
    })
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    res = client.post(
        "/api/validate",
        files={"file": ("validate_sample.csv", csv_bytes, "text/csv")},
    )
    assert res.status_code == 200
    assert res.json()["records"] == 2

def test_background_retrain_status():
    trigger_res = client.post("/api/retrain")
    assert trigger_res.status_code == 200
    assert trigger_res.json()["status"] == "queued"

    status_res = client.get("/api/retrain/status")
    assert status_res.status_code == 200
    assert "status" in status_res.json()

