import numpy as np
import pytest
import pandas as pd
from src.data_gen import (
    generate_data,
    compute_true_uplift,
    generate_hillstrom_benchmark,
    generate_starbucks_benchmark,
    load_benchmark_dataset,
    validate_and_impute_dataset,
    DISCOUNT_LEVELS,
    LOYALTY_TIERS,
)
EXPECTED_COLUMNS = ['customer_id', 'past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity', 'discount', 'purchase', 'true_effect']

def test_generate_data_schema_and_types():
    df = generate_data(n=500, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 500
    assert list(df.columns) == EXPECTED_COLUMNS
    assert set(df['discount'].unique()).issubset(set(DISCOUNT_LEVELS))
    assert set(df['loyalty_tier'].unique()).issubset(set(LOYALTY_TIERS))
    assert set(df['purchase'].unique()).issubset({0, 1})
    assert (df['past_spend'] >= 10.0).all()
    assert (df['recency_days'] >= 1).all() and (df['recency_days'] <= 365).all()
    assert (df['age'] >= 18).all() and (df['age'] <= 80).all()
    assert (df['category_affinity'] >= 0.0).all() and (df['category_affinity'] <= 1.0).all()

def test_generate_data_reproducibility():
    df1 = generate_data(n=200, seed=42)
    df2 = generate_data(n=200, seed=42)
    df3 = generate_data(n=200, seed=99)
    pd.testing.assert_frame_equal(df1, df2)
    assert not df1.equals(df3)

def test_observational_confounding_present():
    df = generate_data(n=10000, seed=42)
    gold_discount_rate = (df[df['loyalty_tier'] == 'Gold']['discount'] > 0).mean()
    bronze_discount_rate = (df[df['loyalty_tier'] == 'Bronze']['discount'] > 0).mean()
    assert gold_discount_rate > bronze_discount_rate
    spend_d20 = df[df['discount'] == 20]['past_spend'].mean()
    spend_d0 = df[df['discount'] == 0]['past_spend'].mean()
    assert spend_d20 > spend_d0

def test_heterogeneous_uplift_properties():
    zero_uplift = compute_true_uplift(past_spend=np.array([50.0, 500.0]), loyalty_tier=np.array(['Bronze', 'Gold']), age=np.array([25, 60]), discount=0)
    np.testing.assert_array_equal(zero_uplift, [0.0, 0.0])
    uplift_sensitive = compute_true_uplift(past_spend=np.array([40.0]), loyalty_tier=np.array(['Bronze']), age=np.array([25]), discount=10)[0]
    uplift_loyal = compute_true_uplift(past_spend=np.array([500.0]), loyalty_tier=np.array(['Gold']), age=np.array([60]), discount=10)[0]
    assert uplift_sensitive > uplift_loyal
    assert uplift_sensitive > 0.05

def test_generate_hillstrom_benchmark():
    df = generate_hillstrom_benchmark(n=300, seed=42)
    assert len(df) == 300
    assert 'discount' in df.columns and 'purchase' in df.columns
    assert set(df['discount'].unique()).issubset({0, 10, 20})
    assert set(df['purchase'].unique()).issubset({0, 1})
    assert (df['past_spend'] >= 10.0).all()

def test_generate_starbucks_benchmark():
    df = generate_starbucks_benchmark(n=300, seed=42)
    assert len(df) == 300
    assert 'discount' in df.columns and 'purchase' in df.columns
    assert set(df['discount'].unique()).issubset({0, 10, 20})
    assert set(df['purchase'].unique()).issubset({0, 1})

def test_load_benchmark_dataset():
    df_hill = load_benchmark_dataset('hillstrom_email', n=100, seed=42)
    df_star = load_benchmark_dataset('starbucks_uplift', n=100, seed=42)
    df_ret = load_benchmark_dataset('synthetic_retail', n=100, seed=42)
    assert len(df_hill) == 100
    assert len(df_star) == 100
    assert len(df_ret) == 100

def test_validate_and_impute_missing_values():
    raw_df = pd.DataFrame({
        'past_spend': [100.0, np.nan, 200.0, 150.0],
        'recency_days': [30, 60, np.nan, 120],
        'loyalty_tier': ['Bronze', None, 'Gold', 'Silver'],
        'age': [35, 45, np.nan, 55],
        'category_affinity': [0.4, np.nan, 0.8, 0.6],
        'promotion': [0, 10, 20, 0],
        'conversion': [0, 1, 1, 0]
    })
    clean_df, report = validate_and_impute_dataset(raw_df)
    assert report['is_valid'] is True
    assert clean_df.isna().sum().sum() == 0
    assert report['treatment_col'] == 'promotion'
    assert report['outcome_col'] == 'conversion'
    assert 'discount' in clean_df.columns
    assert 'purchase' in clean_df.columns
    assert report['imputed_missing_counts']['past_spend'] == 1
    assert report['imputed_missing_counts']['loyalty_tier'] == 1

def test_validate_and_impute_missing_outcome_fails():
    invalid_df = pd.DataFrame({
        'past_spend': [100.0, 200.0],
        'discount': [0, 10]
    })
    clean_df, report = validate_and_impute_dataset(invalid_df)
    assert report['is_valid'] is False
    assert len(report['errors']) > 0
