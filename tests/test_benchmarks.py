import pytest
import numpy as np
import pandas as pd
from benchmarks.meta_learners import SLearner, TLearner, XLearner, run_meta_learner_comparison
from benchmarks.benchmark_pipeline import measure_percentiles, benchmark_scale
from src.data_gen import generate_data


def test_measure_percentiles():
    data = [10.0, 20.0, 30.0, 40.0, 50.0]
    metrics = measure_percentiles(data)
    assert metrics['p50'] == 30.0
    assert metrics['min'] == 10.0
    assert metrics['max'] == 50.0
    assert metrics['mean'] == 30.0
    assert metrics['p95'] >= 40.0


def test_meta_learners_fit_predict():
    df = generate_data(n=300, seed=42)
    s_learner = SLearner(n_estimators=10, random_state=42)
    s_learner.fit(df)
    s_preds = s_learner.predict(df)
    assert 'uplift_10' in s_preds.columns
    assert 'uplift_20' in s_preds.columns
    assert len(s_preds) == len(df)

    t_learner = TLearner(n_estimators=10, random_state=42)
    t_learner.fit(df)
    t_preds = t_learner.predict(df)
    assert 'uplift_10' in t_preds.columns
    assert 'uplift_20' in t_preds.columns
    assert len(t_preds) == len(df)

    x_learner = XLearner(n_estimators=10, random_state=42)
    x_learner.fit(df)
    x_preds = x_learner.predict(df)
    assert 'uplift_10' in x_preds.columns
    assert 'uplift_20' in x_preds.columns
    assert len(x_preds) == len(df)


def test_benchmark_scale_execution():
    res = benchmark_scale(n_records=300, repeats=1, verbose=False)
    assert res['n_records'] == 300
    assert res['throughput_rows_sec'] > 0
    assert 'stage_metrics' in res
    assert 'end_to_end' in res['stage_metrics']
    assert res['stage_metrics']['end_to_end']['p50'] > 0
    assert 'memory_mb' in res
    assert res['memory_mb']['peak_ram_mb'] > 0
