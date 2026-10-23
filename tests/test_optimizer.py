from __future__ import annotations
import numpy as np
import pandas as pd
from src.optimizer import (
    allocate_budget,
    _greedy_knapsack,
    calculate_psi,
    calculate_ks,
    evaluate_drift,
    generate_executive_summary,
)

def test_allocate_budget_basic():
    n = 20
    df = pd.DataFrame({
        "cust_id": [f"C-{i:03d}" for i in range(n)],
        "past_spend": np.random.uniform(20, 200, n),
    })
    u10 = np.array([0.25 if i < 10 else 0.01 for i in range(n)])
    u20 = np.array([0.45 if i < 5 else 0.02 for i in range(n)])
    res = allocate_budget(df, u10, u20, total_budget=100.0, unit_margin=45.0)
    assert "allocated_df" in res
    assert res["actual_spend"] <= 100.0
    assert res["targeted_persuadables"] > 0
    assert len(res["allocated_df"]) == n
    assert set(res["allocated_df"]["optimal_discount"].unique()).issubset({0, 10, 20})

def test_allocate_budget_capacity_arm20():
    n = 30
    df = pd.DataFrame({"cust_id": [f"C-{i:03d}" for i in range(n)]})
    u10 = np.full(n, 0.15)
    u20 = np.full(n, 0.40)
    res = allocate_budget(df, u10, u20, total_budget=500.0, unit_margin=45.0, max_arm_20=3)
    alloc_df = res["allocated_df"]
    assert (alloc_df["optimal_discount"] == 20).sum() <= 3

def test_greedy_knapsack():
    p10 = np.array([10.0, 5.0, -2.0])
    p20 = np.array([15.0, 25.0, -5.0])
    x10, x20 = _greedy_knapsack(p10, p20, budget=30.0)
    total_cost = np.sum(x10) * 10 + np.sum(x20) * 20
    assert total_cost <= 30.0

def test_calculate_psi_identical():
    np.random.seed(42)
    ref = np.random.normal(50, 10, 1000)
    tgt = np.random.normal(50, 10, 1000)
    psi = calculate_psi(ref, tgt)
    assert psi < 0.05

def test_calculate_psi_drift():
    np.random.seed(42)
    ref = np.random.normal(50, 10, 1000)
    tgt = np.random.normal(80, 15, 1000)
    psi = calculate_psi(ref, tgt)
    assert psi > 0.20

def test_calculate_ks():
    np.random.seed(42)
    ref = np.random.normal(0, 1, 500)
    tgt = np.random.normal(0, 1, 500)
    stat, pval = calculate_ks(ref, tgt)
    assert 0.0 <= stat <= 1.0
    assert 0.0 <= pval <= 1.0

def test_evaluate_drift_report():
    np.random.seed(42)
    df_ref = pd.DataFrame({
        "feat_stable": np.random.normal(10, 2, 500),
        "feat_drift": np.random.normal(10, 2, 500),
    })
    df_prod = pd.DataFrame({
        "feat_stable": np.random.normal(10, 2, 500),
        "feat_drift": np.random.normal(30, 5, 500),
    })
    report = evaluate_drift(df_ref, df_prod)
    assert "metrics" in report
    assert "max_psi" in report
    assert report["max_psi"] > 0.20
    assert report["retrain_recommended"] is True

def test_generate_executive_summary():
    alloc = {
        "actual_spend": 4980.0,
        "net_incremental_profit": 18420.0,
        "targeted_persuadables": 382,
        "sure_things_held_out": 15900,
        "discount_waste_saved": 11240.0,
    }
    drift = {
        "max_psi": 0.082,
        "overall_status": "Healthy",
        "retrain_recommended": False,
    }
    refutation = {
        "all_passed": True,
    }
    summary = generate_executive_summary(alloc, drift, refutation)
    assert "narrative" in summary
    assert "pillars" in summary
    assert len(summary["pillars"]) == 4
    assert summary["kpis"]["net_incremental_profit"] == 18420.0
    assert summary["kpis"]["retrain_recommended"] is False

def test_allocate_budget_frequency_capping():
    n = 20
    df = pd.DataFrame({
        "cust_id": [f"C-{i:03d}" for i in range(n)],
        "recency_days": [3 if i < 10 else 45 for i in range(n)],
    })
    u10 = np.full(n, 0.40)
    u20 = np.full(n, 0.60)
    res = allocate_budget(df, u10, u20, total_budget=500.0, frequency_cap_days=14)
    alloc_df = res["allocated_df"]
    recent_treated = alloc_df[df["recency_days"] < 14]["optimal_discount"]
    assert (recent_treated == 0).all()
    assert res["policy_metrics"]["excluded_by_frequency_cap"] == 10

def test_allocate_budget_cohort_whitelist():
    n = 20
    df = pd.DataFrame({
        "cust_id": [f"C-{i:03d}" for i in range(n)],
        "loyalty_tier": ["Gold" if i < 10 else "Silver" for i in range(n)],
    })
    u10 = np.full(n, 0.40)
    u20 = np.full(n, 0.60)
    res = allocate_budget(df, u10, u20, total_budget=500.0, cohort_whitelist=["Silver"])
    alloc_df = res["allocated_df"]
    gold_treated = alloc_df[df["loyalty_tier"] == "Gold"]["optimal_discount"]
    assert (gold_treated == 0).all()
    assert res["policy_metrics"]["excluded_by_cohort"] == 10

def test_allocate_budget_min_margin_floor():
    n = 10
    df = pd.DataFrame({"cust_id": [f"C-{i:03d}" for i in range(n)]})
    u10 = np.array([0.25, 0.25, 0.35, 0.35, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10])
    u20 = np.zeros(n)
    res = allocate_budget(df, u10, u20, total_budget=500.0, unit_margin=45.0, min_margin_floor=4.0)
    alloc_df = res["allocated_df"]
    treated = alloc_df[alloc_df["optimal_discount"] > 0]
    assert (treated["expected_profit"] >= 4.0).all()
    assert res["policy_metrics"]["excluded_by_margin_floor"] == 8

def test_allocate_budget_max_discount_rate():
    n = 50
    df = pd.DataFrame({"cust_id": [f"C-{i:03d}" for i in range(n)]})
    u10 = np.full(n, 0.50)
    u20 = np.full(n, 0.70)
    res = allocate_budget(df, u10, u20, total_budget=1000.0, max_discount_rate=0.20)
    alloc_df = res["allocated_df"]
    treated_count = (alloc_df["optimal_discount"] > 0).sum()
    assert treated_count <= int(0.20 * n)
