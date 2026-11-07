import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

class TestEndToEndApiLifecycle:
    def test_full_analyst_workflow(self):
        # 1. Register a new quant user with strong password
        user_email = "e2e_quant_lead@econocausal.ai"
        user_pass = "QuantP@ssw0rd2026!"
        reg_res = client.post(
            "/api/auth/register",
            json={
                "email": user_email,
                "password": user_pass,
                "full_name": "E2E Lead Quant",
                "role": "quant",
            },
        )
        assert reg_res.status_code == 201
        user_info = reg_res.json()
        assert user_info["email"] == user_email
        api_key = user_info["api_key"]

        # 2. Authenticate and retrieve JWT token
        login_res = client.post(
            "/api/auth/login",
            json={"email": user_email, "password": user_pass},
        )
        assert login_res.status_code == 200
        tokens = login_res.json()
        token = tokens["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 3. Access protected user profile
        me_res = client.get("/api/auth/me", headers=auth_headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == user_email

        # 4. Generate/Upload synthetic dataset
        upload_res = client.post("/api/upload", data={"n_records": 500, "seed": 100})
        assert upload_res.status_code == 200
        upload_data = upload_res.json()
        assert upload_data["records"] == 500
        assert "dataset_id" in upload_data

        # 5. Run Double Machine Learning uplift estimation
        uplift_res = client.post(
            "/api/uplift",
            json={"cv": 2, "n_estimators": 16, "subforest_size": 2},
        )
        assert uplift_res.status_code == 200
        uplift_data = uplift_res.json()
        assert "ate_10" in uplift_data or "ate" in uplift_data
        assert "qini_score" in uplift_data or "qini_auc" in uplift_data

        # 6. Allocate promotional budget with policy constraints
        alloc_res = client.post(
            "/api/allocate",
            json={
                "total_budget": 5000.0,
                "unit_margin": 45.0,
                "min_margin_floor": 0.0,
            },
        )
        assert alloc_res.status_code == 200
        alloc_data = alloc_res.json()
        assert "budget_allocated" in alloc_data or "allocated_budget" in alloc_data

        # 7. Query Causal Diagnostics and Executive Summary
        diag_res = client.get("/api/diagnostics")
        assert diag_res.status_code == 200
        diag_data = diag_res.json()
        assert "balance_table" in diag_data or "smd_table" in diag_data
        assert "overlap_report" in diag_data or "propensity_scores" in diag_data

        summary_res = client.get("/api/summary")
        assert summary_res.status_code == 200
        assert "narrative" in summary_res.json()

        # 8. Test live metrics endpoint
        live_res = client.get("/api/live-metrics")
        assert live_res.status_code == 200
        assert len(live_res.json()) > 0

        # 9. Test model comparison endpoint
        comp_res = client.get("/api/model-comparison")
        assert comp_res.status_code == 200
        assert len(comp_res.json()) > 0
