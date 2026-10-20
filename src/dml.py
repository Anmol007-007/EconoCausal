from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier, LGBMRegressor
from econml.dml import CausalForestDML

MODIFIER_COLS: List[str] = ['age', 'past_spend', 'loyalty_tier']
CONFOUNDER_COLS: List[str] = ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity']
DISCOUNT_LEVELS: List[int] = [10, 20]

def prepare_features(df: pd.DataFrame, tier_categories: Optional[List[str]]=None) -> Tuple[pd.DataFrame, pd.DataFrame, List[str]]:
    tier_col = df['loyalty_tier']
    if tier_categories is None:
        categories = ['Bronze', 'Silver', 'Gold']
    else:
        categories = tier_categories
    tier_cat = pd.Categorical(tier_col, categories=categories)
    tier_dummies = pd.get_dummies(tier_cat, prefix='tier', drop_first=True, dtype=float)
    dummy_cols = list(tier_dummies.columns)
    x_num = df[['age', 'past_spend']].astype(float).reset_index(drop=True)
    w_num = df[['past_spend', 'recency_days', 'category_affinity']].astype(float).reset_index(drop=True)
    dummies_reset = tier_dummies.reset_index(drop=True)
    X = pd.concat([x_num, dummies_reset], axis=1)
    W = pd.concat([w_num, dummies_reset], axis=1)
    return (X, W, dummy_cols)

def train_dml(df: pd.DataFrame, treatment_col: str='discount', outcome_col: str='purchase', cv: int=5, n_estimators: int=100, random_state: int=42, subforest_size: int=4, n_jobs: int=-1) -> Dict[str, Any]:
    cols_to_check = [col for col in df.columns if col not in ('true_effect', 'customer_id')]
    df_clean = df[cols_to_check].copy()
    X, W, dummy_cols = prepare_features(df_clean)
    T = df_clean[treatment_col].values.astype(int)
    Y = df_clean[outcome_col].values.astype(float)
    if n_estimators % subforest_size != 0:
        n_estimators = max(subforest_size, (n_estimators // subforest_size) * subforest_size)
    model_y = LGBMRegressor(n_estimators=50, learning_rate=0.05, max_depth=5, random_state=random_state, verbose=-1, n_jobs=n_jobs)
    model_t = LGBMClassifier(n_estimators=50, learning_rate=0.05, max_depth=5, random_state=random_state, verbose=-1, n_jobs=n_jobs)
    estimator = CausalForestDML(model_y=model_y, model_t=model_t, discrete_treatment=True, cv=cv, n_estimators=n_estimators, subforest_size=subforest_size, random_state=random_state, n_jobs=n_jobs)
    estimator.fit(Y, T, X=X, W=W)
    bundle = {'estimator': estimator, 'dummy_cols': dummy_cols, 'x_columns': list(X.columns), 'w_columns': list(W.columns), 'treatment_col': treatment_col, 'outcome_col': outcome_col}
    return bundle

def predict_uplift(bundle: Dict[str, Any], df: pd.DataFrame) -> pd.DataFrame:
    estimator: CausalForestDML = bundle['estimator']
    X, _, _ = prepare_features(df)
    eff_10 = estimator.effect(X, T0=0, T1=10)
    eff_20 = estimator.effect(X, T0=0, T1=20)
    uplift_df = pd.DataFrame({'uplift_10': np.round(eff_10.flatten(), 5), 'uplift_20': np.round(eff_20.flatten(), 5)}, index=df.index)
    return uplift_df

def pehe(true_effect: np.ndarray | pd.Series, pred_effect: np.ndarray | pd.Series) -> float:
    y_true = np.asarray(true_effect).flatten()
    y_pred = np.asarray(pred_effect).flatten()
    diff = y_pred - y_true
    return float(np.sqrt(np.mean(diff ** 2)))

def qini_curve(y_true: np.ndarray | pd.Series, treatment: np.ndarray | pd.Series, uplift_scores: np.ndarray | pd.Series, target_treatment: int=10, control_treatment: int=0, n_bins: int=10) -> Dict[str, Any]:
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
            q_val = y_t - y_c * (n_t / n_c)
        else:
            q_val = 0.0
        fractions.append(round(frac, 4))
        qini_vals.append(round(float(q_val), 2))
    total_q = qini_vals[-1]
    random_vals = [round(float(f * total_q), 2) for f in fractions]
    qini_area = np.trapz(qini_vals, fractions)
    rand_area = np.trapz(random_vals, fractions)
    qini_score = float(qini_area - rand_area)
    return {'fractions': fractions, 'qini_values': qini_vals, 'random_values': random_vals, 'qini_score': round(qini_score, 4)}

def uplift_curve(y_true: np.ndarray | pd.Series, treatment: np.ndarray | pd.Series, uplift_scores: np.ndarray | pd.Series, target_treatment: int=10, control_treatment: int=0, n_bins: int=10) -> Dict[str, Any]:
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
    return {'fractions': fractions, 'cumulative_uplift': cum_uplift, 'average_uplift': round(float(cum_uplift[-1]), 5)}

def train_naive_baseline(df: pd.DataFrame, treatment_col: str='discount', outcome_col: str='purchase', random_state: int=42, n_jobs: int=-1) -> Dict[str, Any]:
    cols_to_use = [c for c in df.columns if c not in ('true_effect', 'customer_id', treatment_col, outcome_col)]
    tier_cat = pd.Categorical(df['loyalty_tier'], categories=['Bronze', 'Silver', 'Gold'])
    tier_dummies = pd.get_dummies(tier_cat, prefix='tier', drop_first=True, dtype=float)
    feat_num = df[['past_spend', 'recency_days', 'age', 'category_affinity']].astype(float)
    X = pd.concat([feat_num.reset_index(drop=True), tier_dummies.reset_index(drop=True)], axis=1)
    models: Dict[int, LGBMClassifier] = {}
    for arm in [0, 10, 20]:
        mask = df[treatment_col] == arm
        clf = LGBMClassifier(n_estimators=50, learning_rate=0.05, max_depth=4, random_state=random_state, verbose=-1, n_jobs=n_jobs)
        clf.fit(X[mask], df.loc[mask, outcome_col])
        models[arm] = clf
    return {'models': models, 'feature_columns': list(X.columns)}

def predict_naive_uplift(naive_bundle: Dict[str, Any], df: pd.DataFrame) -> pd.DataFrame:
    models = naive_bundle['models']
    tier_cat = pd.Categorical(df['loyalty_tier'], categories=['Bronze', 'Silver', 'Gold'])
    tier_dummies = pd.get_dummies(tier_cat, prefix='tier', drop_first=True, dtype=float)
    feat_num = df[['past_spend', 'recency_days', 'age', 'category_affinity']].astype(float)
    X = pd.concat([feat_num.reset_index(drop=True), tier_dummies.reset_index(drop=True)], axis=1)
    prob_0 = models[0].predict_proba(X)[:, 1]
    prob_10 = models[10].predict_proba(X)[:, 1]
    prob_20 = models[20].predict_proba(X)[:, 1]
    return pd.DataFrame({'uplift_10': np.round(prob_10 - prob_0, 5), 'uplift_20': np.round(prob_20 - prob_0, 5)}, index=df.index)
