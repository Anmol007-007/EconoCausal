"""Unit tests for evaluation metrics, PEHE, and Qini curves."""

import numpy as np
import pytest
import pandas as pd

from src.data_gen import generate_data, compute_true_uplift
from src.dml import train_dml, predict_uplift
from src.evaluate import pehe, qini_curve, uplift_curve, train_naive_baseline, predict_naive_uplift


def test_pehe_metric_calculation():
    y_true = np.array([0.10, 0.20, 0.15, 0.05])
    y_pred_perfect = np.array([0.10, 0.20, 0.15, 0.05])
    y_pred_imperfect = np.array([0.12, 0.18, 0.14, 0.08])

    assert pehe(y_true, y_pred_perfect) == pytest.approx(0.0, abs=1e-6)
    score = pehe(y_true, y_pred_imperfect)
    assert score > 0.0
    assert np.isfinite(score)


def test_qini_and_uplift_curves():
    df = generate_data(n=600, seed=42)
    uplift_mock = np.random.default_rng(42).normal(0.1, 0.05, size=len(df))

    qini_res = qini_curve(df["purchase"], df["discount"], uplift_mock, target_treatment=10)
    assert "fractions" in qini_res
    assert "qini_values" in qini_res
    assert "qini_score" in qini_res
    assert qini_res["fractions"][0] == 0.0
    assert qini_res["fractions"][-1] == 1.0

    uplift_res = uplift_curve(df["purchase"], df["discount"], uplift_mock, target_treatment=10)
    assert "cumulative_uplift" in uplift_res
    assert len(uplift_res["fractions"]) == len(uplift_res["cumulative_uplift"])


def test_dml_beats_naive_baseline_on_pehe():
    train_df = generate_data(n=2500, seed=42)
    test_df = generate_data(n=800, seed=99)

    dml_bundle = train_dml(train_df, cv=3, n_estimators=40, random_state=42)
    naive_bundle = train_naive_baseline(train_df, random_state=42)

    dml_pred = predict_uplift(dml_bundle, test_df)["uplift_10"]
    naive_pred = predict_naive_uplift(naive_bundle, test_df)["uplift_10"]

    true_10 = compute_true_uplift(
        past_spend=test_df["past_spend"].values,
        loyalty_tier=test_df["loyalty_tier"].values,
        age=test_df["age"].values,
        discount=10,
    )

    dml_pehe = pehe(true_10, dml_pred)
    naive_pehe = pehe(true_10, naive_pred)

    assert dml_pehe < naive_pehe
