from __future__ import annotations
import numpy as np
import pandas as pd
from src.drift import calculate_psi, calculate_ks, evaluate_drift

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
