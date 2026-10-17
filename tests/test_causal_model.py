import pytest
from src.data_gen import generate_data
from src.causal_model import build_dag, identify_effect, CONFOUNDERS, get_dag_dot

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
