from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from dowhy import CausalModel
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

CONFOUNDERS: List[str] = ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity']
DEFAULT_CONFOUNDERS: List[str] = ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity']
EFFECT_MODIFIERS: List[str] = ['age', 'past_spend', 'loyalty_tier']
TREATMENT_COL: str = 'discount'
OUTCOME_COL: str = 'purchase'
TREATMENT_LEVELS: List[int] = [0, 10, 20]

def get_dag_dot() -> str:
    return 'digraph {\n    past_spend -> discount;\n    recency_days -> discount;\n    loyalty_tier -> discount;\n    category_affinity -> discount;\n    past_spend -> purchase;\n    recency_days -> purchase;\n    loyalty_tier -> purchase;\n    category_affinity -> purchase;\n    age -> purchase;\n    discount -> purchase;\n}'

def build_dag(df: pd.DataFrame, treatment: str=TREATMENT_COL, outcome: str=OUTCOME_COL, common_causes: Optional[List[str]]=None, effect_modifiers: Optional[List[str]]=None, graph: Optional[str]=None) -> CausalModel:
    if common_causes is None:
        common_causes = list(CONFOUNDERS)
    cols_to_use = [col for col in df.columns if col not in ('true_effect', 'customer_id')]
    df_clean = df[cols_to_use].copy()
    if 'loyalty_tier' in df_clean.columns and df_clean['loyalty_tier'].dtype == 'object':
        df_clean['loyalty_tier'] = df_clean['loyalty_tier'].astype('category')
    if graph is None:
        graph = get_dag_dot()
    model = CausalModel(data=df_clean, treatment=treatment, outcome=outcome, graph=graph.replace('\n', ' '), common_causes=common_causes, effect_modifiers=effect_modifiers)
    return model

def identify_effect(model: CausalModel, proceed_when_unidentifiable: bool=True):
    return model.identify_effect(proceed_when_unidentifiable=proceed_when_unidentifiable)

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

def refute_placebo(model: CausalModel, estimand: Any, estimate: Any, num_simulations: int=1, random_state: int=42) -> Dict[str, Any]:
    refutation = model.refute_estimate(estimand, estimate, method_name='placebo_treatment_refuter', num_simulations=num_simulations, random_seed=random_state)
    new_effect = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, '__iter__') else float(refutation.new_effect)
    p_val = float(refutation.refutation_result.get('p_value', 1.0)) if hasattr(refutation, 'refutation_result') and isinstance(refutation.refutation_result, dict) else 1.0
    passed = abs(new_effect) < 0.05 or p_val > 0.05
    return {'test': 'placebo_treatment', 'new_effect': round(new_effect, 5), 'p_value': round(p_val, 4), 'passed': bool(passed), 'summary': str(refutation)}

def refute_random_common_cause(model: CausalModel, estimand: Any, estimate: Any, num_simulations: int=1, random_state: int=42) -> Dict[str, Any]:
    refutation = model.refute_estimate(estimand, estimate, method_name='random_common_cause', num_simulations=num_simulations, random_seed=random_state)
    orig_val = float(estimate.value) if hasattr(estimate, 'value') else 0.0
    new_val = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, '__iter__') else float(refutation.new_effect)
    drift_pct = abs((new_val - orig_val) / (orig_val + 1e-09)) * 100.0
    passed = drift_pct < 10.0
    return {'test': 'random_common_cause', 'original_effect': round(orig_val, 5), 'new_effect': round(new_val, 5), 'drift_percent': round(drift_pct, 2), 'passed': bool(passed), 'summary': str(refutation)}

def refute_data_subset(model: CausalModel, estimand: Any, estimate: Any, subset_fraction: float=0.8, num_simulations: int=2, random_state: int=42) -> Dict[str, Any]:
    refutation = model.refute_estimate(estimand, estimate, method_name='data_subset_refuter', subset_fraction=subset_fraction, num_simulations=num_simulations, random_seed=random_state)
    orig_val = float(estimate.value) if hasattr(estimate, 'value') else 0.0
    new_val = float(np.mean(refutation.new_effect)) if hasattr(refutation.new_effect, '__iter__') else float(refutation.new_effect)
    drift_pct = abs((new_val - orig_val) / (orig_val + 1e-09)) * 100.0
    passed = drift_pct < 15.0
    return {'test': 'data_subset', 'subset_fraction': subset_fraction, 'original_effect': round(orig_val, 5), 'new_effect': round(new_val, 5), 'drift_percent': round(drift_pct, 2), 'passed': bool(passed), 'summary': str(refutation)}

def run_all_refutations(model: CausalModel, estimand: Any, estimate: Any, random_state: int=42) -> Dict[str, Any]:
    res_placebo = refute_placebo(model, estimand, estimate, random_state=random_state)
    res_common_cause = refute_random_common_cause(model, estimand, estimate, random_state=random_state)
    res_subset = refute_data_subset(model, estimand, estimate, random_state=random_state)
    all_passed = res_placebo['passed'] and res_common_cause['passed'] and res_subset['passed']
    return {'placebo': res_placebo, 'random_common_cause': res_common_cause, 'data_subset': res_subset, 'all_passed': all_passed}
