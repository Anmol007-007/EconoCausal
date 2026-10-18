from __future__ import annotations
import pytest
from src.data_gen import generate_data
from src.causal_model import build_dag, identify_effect
from src.refute import refute_placebo, refute_random_common_cause, refute_data_subset, run_all_refutations

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
