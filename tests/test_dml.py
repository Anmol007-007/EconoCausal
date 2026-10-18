from __future__ import annotations
import numpy as np
import pytest
import pandas as pd
from src.data_gen import generate_data, compute_true_uplift
from src.dml import (
    train_dml,
    predict_uplift,
    prepare_features,
    pehe,
    qini_curve,
    uplift_curve,
    train_naive_baseline,
    predict_naive_uplift,
)

def test_prepare_features_structure():
    df = generate_data(n=200, seed=42)
    X, W, dummy_cols = prepare_features(df)
    assert 'past_spend' in X.columns
    assert 'age' in X.columns
    assert 'past_spend' in W.columns
    assert 'recency_days' in W.columns
    assert 'true_effect' not in X.columns
    assert 'true_effect' not in W.columns
    assert len(dummy_cols) >= 2

def test_train_dml_and_predict_uplift():
    df = generate_data(n=800, seed=42)
    bundle = train_dml(df, cv=3, n_estimators=40, random_state=42)
    assert bundle is not None
    assert 'estimator' in bundle
    assert 'true_effect' not in bundle['x_columns']
    test_df = generate_data(n=100, seed=99)
    predictions = predict_uplift(bundle, test_df)
    assert isinstance(predictions, pd.DataFrame)
    assert list(predictions.columns) == ['uplift_10', 'uplift_20']
    assert len(predictions) == len(test_df)
    assert predictions['uplift_10'].between(-0.2, 0.8).all()
    assert predictions['uplift_20'].between(-0.2, 0.8).all()
    assert predictions['uplift_20'].mean() > predictions['uplift_10'].mean()

def test_pehe_metric_calculation():
    y_true = np.array([0.1, 0.2, 0.15, 0.05])
    y_pred_perfect = np.array([0.1, 0.2, 0.15, 0.05])
    y_pred_imperfect = np.array([0.12, 0.18, 0.14, 0.08])
    assert pehe(y_true, y_pred_perfect) == pytest.approx(0.0, abs=1e-06)
    score = pehe(y_true, y_pred_imperfect)
    assert score > 0.0
    assert np.isfinite(score)

def test_qini_and_uplift_curves():
    df = generate_data(n=600, seed=42)
    uplift_mock = np.random.default_rng(42).normal(0.1, 0.05, size=len(df))
    qini_res = qini_curve(df['purchase'], df['discount'], uplift_mock, target_treatment=10)
    assert 'fractions' in qini_res
    assert 'qini_values' in qini_res
    assert 'qini_score' in qini_res
    assert qini_res['fractions'][0] == 0.0
    assert qini_res['fractions'][-1] == 1.0
    uplift_res = uplift_curve(df['purchase'], df['discount'], uplift_mock, target_treatment=10)
    assert 'cumulative_uplift' in uplift_res
    assert len(uplift_res['fractions']) == len(uplift_res['cumulative_uplift'])

def test_dml_beats_naive_baseline_on_pehe():
    train_df = generate_data(n=2500, seed=42)
    test_df = generate_data(n=800, seed=99)
    dml_bundle = train_dml(train_df, cv=3, n_estimators=40, random_state=42)
    naive_bundle = train_naive_baseline(train_df, random_state=42)
    dml_pred = predict_uplift(dml_bundle, test_df)['uplift_10']
    naive_pred = predict_naive_uplift(naive_bundle, test_df)['uplift_10']
    true_10 = compute_true_uplift(past_spend=test_df['past_spend'].values, loyalty_tier=test_df['loyalty_tier'].values, age=test_df['age'].values, discount=10)
    dml_pehe = pehe(true_10, dml_pred)
    naive_pehe = pehe(true_10, naive_pred)
    assert dml_pehe < naive_pehe
