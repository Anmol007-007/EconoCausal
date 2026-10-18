from __future__ import annotations
import numpy as np
import pandas as pd
from src.optimizer import allocate_budget, _greedy_knapsack

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
