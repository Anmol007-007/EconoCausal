from __future__ import annotations
from typing import Any, Dict, Optional
import numpy as np
from dowhy import CausalModel

def refute_placebo(
    model: CausalModel,
    estimand: Any,
    estimate: Any,
    num_simulations: int = 1,
    random_state: int = 42,
) -> Dict[str, Any]:
    refutation = model.refute_estimate(
        estimand,
        estimate,
        method_name="placebo_treatment_refuter",
        num_simulations=num_simulations,
        random_seed=random_state,
    )
    new_effect = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, "__iter__") else float(refutation.new_effect)
    p_val = float(refutation.refutation_result.get("p_value", 1.0)) if hasattr(refutation, "refutation_result") and isinstance(refutation.refutation_result, dict) else 1.0
    passed = abs(new_effect) < 0.05 or p_val > 0.05
    return {
        "test": "placebo_treatment",
        "new_effect": round(new_effect, 5),
        "p_value": round(p_val, 4),
        "passed": bool(passed),
        "summary": str(refutation),
    }

def refute_random_common_cause(
    model: CausalModel,
    estimand: Any,
    estimate: Any,
    num_simulations: int = 1,
    random_state: int = 42,
) -> Dict[str, Any]:
    refutation = model.refute_estimate(
        estimand,
        estimate,
        method_name="random_common_cause",
        num_simulations=num_simulations,
        random_seed=random_state,
    )
    orig_val = float(estimate.value) if hasattr(estimate, "value") else 0.0
    new_val = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, "__iter__") else float(refutation.new_effect)
    drift_pct = abs((new_val - orig_val) / (orig_val + 1e-9)) * 100.0
    passed = drift_pct < 10.0
    return {
        "test": "random_common_cause",
        "original_effect": round(orig_val, 5),
        "new_effect": round(new_val, 5),
        "drift_percent": round(drift_pct, 2),
        "passed": bool(passed),
        "summary": str(refutation),
    }

def refute_data_subset(
    model: CausalModel,
    estimand: Any,
    estimate: Any,
    subset_fraction: float = 0.8,
    num_simulations: int = 2,
    random_state: int = 42,
) -> Dict[str, Any]:
    refutation = model.refute_estimate(
        estimand,
        estimate,
        method_name="data_subset_refuter",
        subset_fraction=subset_fraction,
        num_simulations=num_simulations,
        random_seed=random_state,
    )
    orig_val = float(estimate.value) if hasattr(estimate, "value") else 0.0
    new_val = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, "__iter__") else float(refutation.new_effect)
    drift_pct = abs((new_val - orig_val) / (orig_val + 1e-9)) * 100.0
    passed = drift_pct < 15.0
    return {
        "test": "data_subset",
        "subset_fraction": subset_fraction,
        "original_effect": round(orig_val, 5),
        "new_effect": round(new_val, 5),
        "drift_percent": round(drift_pct, 2),
        "passed": bool(passed),
        "summary": str(refutation),
    }

def run_all_refutations(
    model: CausalModel,
    estimand: Any,
    estimate: Any,
    random_state: int = 42,
) -> Dict[str, Any]:
    res_placebo = refute_placebo(model, estimand, estimate, random_state=random_state)
    res_common_cause = refute_random_common_cause(model, estimand, estimate, random_state=random_state)
    res_subset = refute_data_subset(model, estimand, estimate, random_state=random_state)
    all_passed = res_placebo["passed"] and res_common_cause["passed"] and res_subset["passed"]
    return {
        "placebo": res_placebo,
        "random_common_cause": res_common_cause,
        "data_subset": res_subset,
        "all_passed": all_passed,
    }
