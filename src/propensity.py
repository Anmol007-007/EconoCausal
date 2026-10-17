from __future__ import annotations
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
DEFAULT_CONFOUNDERS = ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity']
TREATMENT_LEVELS = [0, 10, 20]

def _build_preprocessor(cat_cols: List[str], num_cols: List[str]) -> ColumnTransformer:
    return ColumnTransformer(transformers=[('num', 'passthrough', num_cols), ('cat', OneHotEncoder(drop='first', sparse_output=False), cat_cols)], remainder='drop')

def fit_propensity(df: pd.DataFrame, treatment_col: str='discount', confounders: Optional[List[str]]=None, random_state: int=42) -> Tuple[Any, pd.DataFrame, np.ndarray]:
    if confounders is None:
        confounders = list(DEFAULT_CONFOUNDERS)
    cat_cols = [c for c in confounders if df[c].dtype == 'object' or str(df[c].dtype) == 'category']
    num_cols = [c for c in confounders if c not in cat_cols]
    preprocessor = _build_preprocessor(cat_cols, num_cols)
    X = preprocessor.fit_transform(df[confounders])
    y = df[treatment_col].values
    clf = LogisticRegression(max_iter=1000, random_state=random_state)
    clf.fit(X, y)
    prob_matrix = clf.predict_proba(X)
    classes = list(clf.classes_)
    prop_dict: Dict[str, np.ndarray] = {}
    for level in TREATMENT_LEVELS:
        if level in classes:
            idx = classes.index(level)
            prop_dict[f'prob_{level}'] = prob_matrix[:, idx]
        else:
            prop_dict[f'prob_{level}'] = np.zeros(len(df))
    propensities_df = pd.DataFrame(prop_dict, index=df.index)
    assigned_prop = np.zeros(len(df))
    marginal_prob = np.zeros(len(df))
    for level in TREATMENT_LEVELS:
        mask = y == level
        if mask.any() and f'prob_{level}' in propensities_df.columns:
            assigned_prop[mask] = propensities_df.loc[mask, f'prob_{level}'].values
            marginal_prob[mask] = mask.mean()
    assigned_prop = np.clip(assigned_prop, 0.01, 0.99)
    ipw_weights = marginal_prob / assigned_prop
    pipeline = {'preprocessor': preprocessor, 'classifier': clf}
    return (pipeline, propensities_df, ipw_weights)

def overlap_report(propensities_df: pd.DataFrame, treatments: pd.Series | np.ndarray) -> Dict[str, Any]:
    t_arr = np.asarray(treatments)
    report: Dict[str, Any] = {}
    all_positive = True
    for level in TREATMENT_LEVELS:
        col = f'prob_{level}'
        if col not in propensities_df.columns:
            continue
        col_series = propensities_df[col]
        min_val = float(col_series.min())
        max_val = float(col_series.max())
        p05 = float(np.percentile(col_series, 5))
        p95 = float(np.percentile(col_series, 95))
        if min_val < 0.005:
            all_positive = False
        report[f'discount_{level}'] = {'min_propensity': min_val, 'max_propensity': max_val, '5th_percentile': p05, '95th_percentile': p95, 'mean': float(col_series.mean())}
    report['positivity_satisfied'] = all_positive
    return report

def _compute_smd(x_treated: np.ndarray, x_control: np.ndarray, w_treated: Optional[np.ndarray]=None, w_control: Optional[np.ndarray]=None) -> float:
    if w_treated is None or w_control is None:
        mean_t = np.mean(x_treated)
        mean_c = np.mean(x_control)
        var_t = np.var(x_treated, ddof=1) if len(x_treated) > 1 else 0.0
        var_c = np.var(x_control, ddof=1) if len(x_control) > 1 else 0.0
    else:
        sum_wt = np.sum(w_treated)
        sum_wc = np.sum(w_control)
        if sum_wt == 0 or sum_wc == 0:
            return 0.0
        mean_t = np.sum(w_treated * x_treated) / sum_wt
        mean_c = np.sum(w_control * x_control) / sum_wc
        var_t = np.sum(w_treated * (x_treated - mean_t) ** 2) / sum_wt
        var_c = np.sum(w_control * (x_control - mean_c) ** 2) / sum_wc
    pooled_std = np.sqrt(max((var_t + var_c) / 2.0, 1e-08))
    return float(np.abs(mean_t - mean_c) / pooled_std)

def balance_table(df: pd.DataFrame, treatment_col: str='discount', confounders: Optional[List[str]]=None, weights: Optional[np.ndarray]=None, threshold: float=0.1) -> pd.DataFrame:
    if confounders is None:
        confounders = list(DEFAULT_CONFOUNDERS)
    y_treat = df[treatment_col].values
    control_mask = y_treat == 0
    rows = []
    for conf in confounders:
        if df[conf].dtype == 'object' or str(df[conf].dtype) == 'category':
            dummies = pd.get_dummies(df[conf], prefix=conf, drop_first=True)
            cols_to_eval = [(col_name, dummies[col_name].values.astype(float)) for col_name in dummies.columns]
        else:
            cols_to_eval = [(conf, df[conf].values.astype(float))]
        for feature_name, feat_vals in cols_to_eval:
            row_dict = {'feature': feature_name}
            x_ctrl = feat_vals[control_mask]
            w_ctrl = weights[control_mask] if weights is not None else None
            all_balanced = True
            for trt in [10, 20]:
                trt_mask = y_treat == trt
                x_trt = feat_vals[trt_mask]
                w_trt = weights[trt_mask] if weights is not None else None
                unweighted_smd = _compute_smd(x_trt, x_ctrl)
                row_dict[f'unweighted_smd_{trt}_vs_0'] = round(unweighted_smd, 4)
                if weights is not None:
                    weighted_smd = _compute_smd(x_trt, x_ctrl, w_trt, w_ctrl)
                    row_dict[f'weighted_smd_{trt}_vs_0'] = round(weighted_smd, 4)
                    if weighted_smd >= threshold:
                        all_balanced = False
                elif unweighted_smd >= threshold:
                    all_balanced = False
            row_dict['balanced_target_met'] = all_balanced
            rows.append(row_dict)
    return pd.DataFrame(rows)
