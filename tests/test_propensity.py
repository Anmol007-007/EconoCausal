import numpy as np
import pytest
from src.data_gen import generate_data
from src.propensity import fit_propensity, overlap_report, balance_table

def test_fit_propensity_outputs():
    df = generate_data(n=600, seed=42)
    pipeline, prop_df, weights = fit_propensity(df, treatment_col='discount')
    assert set(prop_df.columns) == {'prob_0', 'prob_10', 'prob_20'}
    assert len(prop_df) == len(df)
    assert len(weights) == len(df)
    row_sums = prop_df.sum(axis=1).values
    np.testing.assert_allclose(row_sums, 1.0, atol=0.0001)
    assert (weights > 0).all()
    assert np.isfinite(weights).all()

def test_overlap_report_diagnostics():
    df = generate_data(n=600, seed=42)
    _, prop_df, _ = fit_propensity(df, treatment_col='discount')
    report = overlap_report(prop_df, df['discount'])
    assert 'discount_0' in report
    assert 'discount_10' in report
    assert 'discount_20' in report
    assert report['positivity_satisfied'] is True
    assert report['discount_0']['min_propensity'] > 0

def test_balance_table_reduction_in_smd():
    df = generate_data(n=3000, seed=42)
    _, _, weights = fit_propensity(df, treatment_col='discount')
    table = balance_table(df, treatment_col='discount', weights=weights)
    assert 'feature' in table.columns
    assert 'unweighted_smd_10_vs_0' in table.columns
    assert 'weighted_smd_10_vs_0' in table.columns
    spend_row = table[table['feature'] == 'past_spend'].iloc[0]
    assert spend_row['weighted_smd_10_vs_0'] < spend_row['unweighted_smd_10_vs_0']
    assert spend_row['weighted_smd_20_vs_0'] < spend_row['unweighted_smd_20_vs_0']
