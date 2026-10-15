"""Unit tests for EconML Double Machine Learning uplift model."""

import numpy as np
import pytest
import pandas as pd

from src.data_gen import generate_data
from src.dml import train_dml, predict_uplift, prepare_features


def test_prepare_features_structure():
    df = generate_data(n=200, seed=42)
    X, W, dummy_cols = prepare_features(df)

    assert "past_spend" in X.columns
    assert "age" in X.columns
    assert "past_spend" in W.columns
    assert "recency_days" in W.columns
    assert "true_effect" not in X.columns
    assert "true_effect" not in W.columns
    assert len(dummy_cols) >= 2


def test_train_dml_and_predict_uplift():
    df = generate_data(n=800, seed=42)
    bundle = train_dml(df, cv=3, n_estimators=40, random_state=42)

    assert bundle is not None
    assert "estimator" in bundle
    assert "true_effect" not in bundle["x_columns"]

    test_df = generate_data(n=100, seed=99)
    predictions = predict_uplift(bundle, test_df)

    assert isinstance(predictions, pd.DataFrame)
    assert list(predictions.columns) == ["uplift_10", "uplift_20"]
    assert len(predictions) == len(test_df)

    assert predictions["uplift_10"].between(-0.2, 0.8).all()
    assert predictions["uplift_20"].between(-0.2, 0.8).all()
    assert predictions["uplift_20"].mean() > predictions["uplift_10"].mean()
