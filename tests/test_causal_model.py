from __future__ import annotations
import numpy as np
import pytest
from src.data_gen import generate_data
from src.causal_model import (
    build_dag,
    identify_effect,
    CONFOUNDERS,
    get_dag_dot,
    fit_propensity,
    overlap_report,
    balance_table,
    refute_placebo,
    refute_random_common_cause,
    refute_data_subset,
    run_all_refutations,
    compute_rosenbaum_bounds,
    compute_cinelli_hazlett_robustness,
    compute_break_even_profit_sensitivity,
    compute_sensitivity_suite,
)

def test_build_dag_and_structure():
    df = generate_data(n=200, seed=42)
    model = build_dag(df)
    assert model is not None
    assert model._treatment == ['discount']
    assert model._outcome == ['purchase']
    assert 'true_effect' not in model._data.columns
    assert 'customer_id' not in model._data.columns

def test_identify_effect_backdoor():
    df = generate_data(n=200, seed=42)
    model = build_dag(df)
    estimand = identify_effect(model)
    assert estimand is not None
    backdoor_vars = estimand.get_backdoor_variables()
    assert len(backdoor_vars) > 0
    for conf in ['past_spend', 'recency_days', 'category_affinity']:
        assert conf in backdoor_vars

def test_dag_dot_string():
    dot = get_dag_dot()
    assert 'past_spend -> discount' in dot
    assert 'discount -> purchase' in dot
    assert 'age -> purchase' in dot

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

@pytest.fixture(scope="module")
def causal_setup():
    df = generate_data(n=300, seed=42)
    model = build_dag(df)
    estimand = identify_effect(model)
    estimate = model.estimate_effect(estimand, method_name="backdoor.linear_regression")
    return model, estimand, estimate

def test_refute_placebo(causal_setup):
    model, estimand, estimate = causal_setup
    res = refute_placebo(model, estimand, estimate, num_simulations=1, random_state=42)
    assert res["test"] == "placebo_treatment"
    assert "new_effect" in res
    assert "p_value" in res
    assert "passed" in res

def test_refute_random_common_cause(causal_setup):
    model, estimand, estimate = causal_setup
    res = refute_random_common_cause(model, estimand, estimate, num_simulations=1, random_state=42)
    assert res["test"] == "random_common_cause"
    assert "drift_percent" in res
    assert "passed" in res

def test_refute_data_subset(causal_setup):
    model, estimand, estimate = causal_setup
    res = refute_data_subset(model, estimand, estimate, subset_fraction=0.8, num_simulations=1, random_state=42)
    assert res["test"] == "data_subset"
    assert res["subset_fraction"] == 0.8
    assert "drift_percent" in res

def test_run_all_refutations(causal_setup):
    model, estimand, estimate = causal_setup
    res = run_all_refutations(model, estimand, estimate, random_state=42)
    assert "placebo" in res
    assert "random_common_cause" in res
    assert "data_subset" in res
    assert "all_passed" in res

def test_compute_rosenbaum_bounds():
    df = generate_data(n=500, seed=42)
    res = compute_rosenbaum_bounds(df, treatment_col='discount', outcome_col='purchase')
    assert "tau_estimate" in res
    assert "standard_error" in res
    assert "t_statistic" in res
    assert "critical_gamma" in res
    assert res["critical_gamma"] >= 1.0
    assert len(res["gamma_table"]) > 0
    row_1 = res["gamma_table"][0]
    assert row_1["gamma"] == 1.0
    assert row_1["is_robust"] is True
    assert row_1["tau_lower"] <= row_1["tau_upper"]

def test_compute_cinelli_hazlett_robustness():
    df = generate_data(n=500, seed=42)
    res = compute_cinelli_hazlett_robustness(df, treatment_col='discount', outcome_col='purchase')
    assert "robustness_value_point" in res
    assert "robustness_value_ci" in res
    assert "partial_r2_treatment" in res
    assert "contour_points" in res
    assert 0.0 <= res["robustness_value_point"] <= 1.0
    assert 0.0 <= res["robustness_value_ci"] <= 1.0
    assert len(res["contour_points"]) > 0

def test_compute_break_even_profit_sensitivity():
    res = compute_break_even_profit_sensitivity(
        net_profit=15000.0,
        unit_margin=25.0,
        n_treated=300,
        mean_tau=0.08,
        se_tau=0.02,
        df_resid=500
    )
    assert res["critical_bias"] > 0
    assert res["critical_bias_percent"] > 0
    assert res["break_even_gamma"] >= 1.0
    assert res["break_even_rv"] >= 0.0
    assert res["robustness_margin"] in ["Highly Resilient", "Resilient", "Sensitive"]

def test_compute_sensitivity_suite():
    df = generate_data(n=300, seed=42)
    res = compute_sensitivity_suite(df, treatment_col='discount', outcome_col='purchase')
    assert "rosenbaum" in res
    assert "cinelli_hazlett" in res
    assert "profit_break_even" in res
    assert "unconfoundedness_score" in res
    assert "verdict" in res
    assert 0.0 <= res["unconfoundedness_score"] <= 100.0

