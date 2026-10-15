"""Model evaluation, PEHE metrics, Qini curves, and baseline benchmarking."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier


def pehe(
    true_effect: np.ndarray | pd.Series,
    pred_effect: np.ndarray | pd.Series,
) -> float:
    """Calculate Precision in Estimating Heterogeneous Effects (PEHE).

    PEHE = sqrt(mean((pred_effect - true_effect) ** 2))

    Args:
        true_effect: Ground-truth uplift array.
        pred_effect: Estimated uplift array.

    Returns:
        Float PEHE metric. Lower indicates closer alignment to ground truth.
    """
    y_true = np.asarray(true_effect).flatten()
    y_pred = np.asarray(pred_effect).flatten()
    diff = y_pred - y_true
    return float(np.sqrt(np.mean(diff ** 2)))


def qini_curve(
    y_true: np.ndarray | pd.Series,
    treatment: np.ndarray | pd.Series,
    uplift_scores: np.ndarray | pd.Series,
    target_treatment: int = 10,
    control_treatment: int = 0,
    n_bins: int = 10,
) -> Dict[str, Any]:
    """Calculate cumulative Qini curve and normalized Qini score.

    Qini(k) = n_{t, 1}(k) - n_{c, 1}(k) * (n_t(k) / n_c(k))

    Args:
        y_true: Binary purchase outcomes (0 or 1).
        treatment: Treatment assignments (e.g. 0, 10, 20).
        uplift_scores: Model predicted uplift used for ranking.
        target_treatment: Treated level to evaluate (default: 10).
        control_treatment: Control level (default: 0).
        n_bins: Number of quantile bins (default: 10).

    Returns:
        Dictionary containing fractions, qini_values, random_values, and qini_score.
    """
    y_arr = np.asarray(y_true).flatten()
    t_arr = np.asarray(treatment).flatten()
    s_arr = np.asarray(uplift_scores).flatten()

    mask = (t_arr == target_treatment) | (t_arr == control_treatment)
    y_sub = y_arr[mask]
    t_sub = (t_arr[mask] == target_treatment).astype(int)
    s_sub = s_arr[mask]

    order = np.argsort(-s_sub)
    y_sorted = y_sub[order]
    t_sorted = t_sub[order]

    n_samples = len(y_sorted)
    step = max(1, n_samples // n_bins)
    split_indices = list(range(step, n_samples + 1, step))
    if split_indices[-1] != n_samples:
        split_indices.append(n_samples)

    fractions = [0.0]
    qini_vals = [0.0]

    for idx in split_indices:
        frac = idx / n_samples
        cum_y = y_sorted[:idx]
        cum_t = t_sorted[:idx]

        n_t = np.sum(cum_t == 1)
        n_c = np.sum(cum_t == 0)

        if n_t > 0 and n_c > 0:
            y_t = np.sum(cum_y[cum_t == 1])
            y_c = np.sum(cum_y[cum_t == 0])
            q_val = y_t - (y_c * (n_t / n_c))
        else:
            q_val = 0.0

        fractions.append(round(frac, 4))
        qini_vals.append(round(float(q_val), 2))

    total_q = qini_vals[-1]
    random_vals = [round(float(f * total_q), 2) for f in fractions]

    qini_area = np.trapz(qini_vals, fractions)
    rand_area = np.trapz(random_vals, fractions)
    qini_score = float(qini_area - rand_area)

    return {
        "fractions": fractions,
        "qini_values": qini_vals,
        "random_values": random_vals,
        "qini_score": round(qini_score, 4),
    }


def uplift_curve(
    y_true: np.ndarray | pd.Series,
    treatment: np.ndarray | pd.Series,
    uplift_scores: np.ndarray | pd.Series,
    target_treatment: int = 10,
    control_treatment: int = 0,
    n_bins: int = 10,
) -> Dict[str, Any]:
    """Calculate cumulative incremental conversion rate uplift curve.

    Args:
        y_true: Binary purchase outcomes (0 or 1).
        treatment: Treatment assignments.
        uplift_scores: Model predicted uplift.
        target_treatment: Treated level to evaluate (default: 10).
        control_treatment: Control level (default: 0).
        n_bins: Number of quantile bins.

    Returns:
        Dictionary containing fractions, cumulative_uplift, and overall_lift.
    """
    y_arr = np.asarray(y_true).flatten()
    t_arr = np.asarray(treatment).flatten()
    s_arr = np.asarray(uplift_scores).flatten()

    mask = (t_arr == target_treatment) | (t_arr == control_treatment)
    y_sub = y_arr[mask]
    t_sub = (t_arr[mask] == target_treatment).astype(int)
    s_sub = s_arr[mask]

    order = np.argsort(-s_sub)
    y_sorted = y_sub[order]
    t_sorted = t_sub[order]

    n_samples = len(y_sorted)
    step = max(1, n_samples // n_bins)
    split_indices = list(range(step, n_samples + 1, step))
    if split_indices[-1] != n_samples:
        split_indices.append(n_samples)

    fractions = [0.0]
    cum_uplift = [0.0]

    for idx in split_indices:
        frac = idx / n_samples
        cum_y = y_sorted[:idx]
        cum_t = t_sorted[:idx]

        n_t = np.sum(cum_t == 1)
        n_c = np.sum(cum_t == 0)

        if n_t > 5 and n_c > 5:
            conv_t = np.mean(cum_y[cum_t == 1])
            conv_c = np.mean(cum_y[cum_t == 0])
            lift = float(conv_t - conv_c)
        else:
            lift = 0.0

        fractions.append(round(frac, 4))
        cum_uplift.append(round(lift, 5))

    return {
        "fractions": fractions,
        "cumulative_uplift": cum_uplift,
        "average_uplift": round(float(cum_uplift[-1]), 5),
    }


def train_naive_baseline(
    df: pd.DataFrame,
    treatment_col: str = "discount",
    outcome_col: str = "purchase",
    random_state: int = 42,
) -> Dict[str, Any]:
    """Train standard predictive ML baseline (naive T-learner) without causal adjustment.

    Args:
        df: Input DataFrame.
        treatment_col: Treatment column name.
        outcome_col: Outcome column name.
        random_state: Random state.

    Returns:
        Dictionary with trained models for each treatment arm.
    """
    cols_to_use = [c for c in df.columns if c not in ("true_effect", "customer_id", treatment_col, outcome_col)]
    tier_cat = pd.Categorical(df["loyalty_tier"], categories=["Bronze", "Silver", "Gold"])
    tier_dummies = pd.get_dummies(tier_cat, prefix="tier", drop_first=True, dtype=float)

    feat_num = df[["past_spend", "recency_days", "age", "category_affinity"]].astype(float)
    X = pd.concat([feat_num.reset_index(drop=True), tier_dummies.reset_index(drop=True)], axis=1)

    models: Dict[int, LGBMClassifier] = {}
    for arm in [0, 10, 20]:
        mask = (df[treatment_col] == arm)
        clf = LGBMClassifier(
            n_estimators=50,
            learning_rate=0.05,
            max_depth=4,
            random_state=random_state,
            verbose=-1,
        )
        clf.fit(X[mask], df.loc[mask, outcome_col])
        models[arm] = clf

    return {"models": models, "feature_columns": list(X.columns)}


def predict_naive_uplift(
    naive_bundle: Dict[str, Any],
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Predict uplift using the naive predictive model baseline.

    Args:
        naive_bundle: Bundle returned by train_naive_baseline().
        df: Input DataFrame.

    Returns:
        DataFrame with naive uplift predictions ['uplift_10', 'uplift_20'].
    """
    models = naive_bundle["models"]
    tier_cat = pd.Categorical(df["loyalty_tier"], categories=["Bronze", "Silver", "Gold"])
    tier_dummies = pd.get_dummies(tier_cat, prefix="tier", drop_first=True, dtype=float)

    feat_num = df[["past_spend", "recency_days", "age", "category_affinity"]].astype(float)
    X = pd.concat([feat_num.reset_index(drop=True), tier_dummies.reset_index(drop=True)], axis=1)

    prob_0 = models[0].predict_proba(X)[:, 1]
    prob_10 = models[10].predict_proba(X)[:, 1]
    prob_20 = models[20].predict_proba(X)[:, 1]

    return pd.DataFrame(
        {
            "uplift_10": np.round(prob_10 - prob_0, 5),
            "uplift_20": np.round(prob_20 - prob_0, 5),
        },
        index=df.index,
    )
