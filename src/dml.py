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

def train_dml(df: pd.DataFrame, treatment_col: str='discount', outcome_col: str='purchase', cv: int=5, n_estimators: int=100, random_state: int=42, subforest_size: int=4) -> Dict[str, Any]:
    cols_to_check = [col for col in df.columns if col not in ('true_effect', 'customer_id')]
    df_clean = df[cols_to_check].copy()
    X, W, dummy_cols = prepare_features(df_clean)
    T = df_clean[treatment_col].values.astype(int)
    Y = df_clean[outcome_col].values.astype(float)
    if n_estimators % subforest_size != 0:
        n_estimators = n_estimators // subforest_size * subforest_size
    model_y = LGBMRegressor(n_estimators=50, learning_rate=0.05, max_depth=5, random_state=random_state, verbose=-1)
    model_t = LGBMClassifier(n_estimators=50, learning_rate=0.05, max_depth=5, random_state=random_state, verbose=-1)
    estimator = CausalForestDML(model_y=model_y, model_t=model_t, discrete_treatment=True, cv=cv, n_estimators=n_estimators, subforest_size=subforest_size, random_state=random_state)
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
