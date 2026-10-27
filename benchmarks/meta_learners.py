from __future__ import annotations
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier, LGBMRegressor
from sklearn.linear_model import LogisticRegression

from src.data_gen import generate_data, compute_true_uplift
from src.dml import train_dml, predict_uplift, pehe, qini_curve, prepare_features


def _extract_feature_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    tier_cat = pd.Categorical(df['loyalty_tier'], categories=['Bronze', 'Silver', 'Gold'])
    tier_dummies = pd.get_dummies(tier_cat, prefix='tier', drop_first=True, dtype=float)
    feat_num = df[['past_spend', 'recency_days', 'age', 'category_affinity']].astype(float)
    X = pd.concat([feat_num.reset_index(drop=True), tier_dummies.reset_index(drop=True)], axis=1)
    y = df['purchase'].astype(int)
    return X, y


class SLearner:
    def __init__(self, random_state: int = 42, n_estimators: int = 50, n_jobs: int = 1):
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.n_jobs = n_jobs
        self.model: Optional[LGBMClassifier] = None
        self.feature_names: List[str] = []

    def fit(self, df: pd.DataFrame, treatment_col: str = 'discount', outcome_col: str = 'purchase') -> SLearner:
        X, y = _extract_feature_matrix(df)
        X_with_t = X.copy()
        X_with_t['discount'] = df[treatment_col].values.astype(float)
        self.feature_names = list(X_with_t.columns)
        self.model = LGBMClassifier(
            n_estimators=self.n_estimators,
            learning_rate=0.05,
            max_depth=5,
            random_state=self.random_state,
            verbose=-1,
            n_jobs=self.n_jobs,
        )
        self.model.fit(X_with_t, y)
        return self

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        X, _ = _extract_feature_matrix(df)
        x_0 = X.copy()
        x_0['discount'] = 0.0
        x_10 = X.copy()
        x_10['discount'] = 10.0
        x_20 = X.copy()
        x_20['discount'] = 20.0

        p0 = self.model.predict_proba(x_0[self.feature_names])[:, 1]
        p10 = self.model.predict_proba(x_10[self.feature_names])[:, 1]
        p20 = self.model.predict_proba(x_20[self.feature_names])[:, 1]

        return pd.DataFrame({
            'uplift_10': np.round(p10 - p0, 5),
            'uplift_20': np.round(p20 - p0, 5),
        }, index=df.index)


class TLearner:
    def __init__(self, random_state: int = 42, n_estimators: int = 50, n_jobs: int = 1):
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.n_jobs = n_jobs
        self.models: Dict[int, LGBMClassifier] = {}
        self.feature_names: List[str] = []

    def fit(self, df: pd.DataFrame, treatment_col: str = 'discount', outcome_col: str = 'purchase') -> TLearner:
        X, y = _extract_feature_matrix(df)
        self.feature_names = list(X.columns)
        for arm in [0, 10, 20]:
            mask = df[treatment_col] == arm
            clf = LGBMClassifier(
                n_estimators=self.n_estimators,
                learning_rate=0.05,
                max_depth=5,
                random_state=self.random_state,
                verbose=-1,
                n_jobs=self.n_jobs,
            )
            clf.fit(X[mask], y[mask])
            self.models[arm] = clf
        return self

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        X, _ = _extract_feature_matrix(df)
        p0 = self.models[0].predict_proba(X)[:, 1]
        p10 = self.models[10].predict_proba(X)[:, 1]
        p20 = self.models[20].predict_proba(X)[:, 1]

        return pd.DataFrame({
            'uplift_10': np.round(p10 - p0, 5),
            'uplift_20': np.round(p20 - p0, 5),
        }, index=df.index)


class XLearner:
    def __init__(self, random_state: int = 42, n_estimators: int = 50, n_jobs: int = 1):
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.n_jobs = n_jobs
        self.base_models: Dict[int, LGBMClassifier] = {}
        self.stage2_models: Dict[int, Dict[str, LGBMRegressor]] = {}
        self.propensity_model: Optional[LogisticRegression] = None
        self.feature_names: List[str] = []

    def fit(self, df: pd.DataFrame, treatment_col: str = 'discount', outcome_col: str = 'purchase') -> XLearner:
        X, y = _extract_feature_matrix(df)
        self.feature_names = list(X.columns)

        self.propensity_model = LogisticRegression(max_iter=500, random_state=self.random_state)
        self.propensity_model.fit(X, df[treatment_col])

        for arm in [0, 10, 20]:
            mask = df[treatment_col] == arm
            clf = LGBMClassifier(
                n_estimators=self.n_estimators,
                learning_rate=0.05,
                max_depth=4,
                random_state=self.random_state,
                verbose=-1,
                n_jobs=self.n_jobs,
            )
            clf.fit(X[mask], y[mask])
            self.base_models[arm] = clf

        control_mask = df[treatment_col] == 0
        X_0 = X[control_mask]
        y_0 = y[control_mask].values

        for arm in [10, 20]:
            treat_mask = df[treatment_col] == arm
            X_1 = X[treat_mask]
            y_1 = y[treat_mask].values

            d_1 = y_1 - self.base_models[0].predict_proba(X_1)[:, 1]
            d_0 = self.base_models[arm].predict_proba(X_0)[:, 1] - y_0

            m_1 = LGBMRegressor(
                n_estimators=self.n_estimators,
                learning_rate=0.05,
                max_depth=4,
                random_state=self.random_state,
                verbose=-1,
                n_jobs=self.n_jobs,
            )
            m_1.fit(X_1, d_1)

            m_0 = LGBMRegressor(
                n_estimators=self.n_estimators,
                learning_rate=0.05,
                max_depth=4,
                random_state=self.random_state,
                verbose=-1,
                n_jobs=self.n_jobs,
            )
            m_0.fit(X_0, d_0)

            self.stage2_models[arm] = {'m_1': m_1, 'm_0': m_0}

        return self

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        X, _ = _extract_feature_matrix(df)
        prop_matrix = self.propensity_model.predict_proba(X)
        classes = list(self.propensity_model.classes_)

        results = {}
        for arm in [10, 20]:
            arm_idx = classes.index(arm) if arm in classes else 1
            e_x = prop_matrix[:, arm_idx]

            pred_1 = self.stage2_models[arm]['m_1'].predict(X)
            pred_0 = self.stage2_models[arm]['m_0'].predict(X)

            tau = e_x * pred_0 + (1.0 - e_x) * pred_1
            results[f'uplift_{arm}'] = np.round(tau, 5)

        return pd.DataFrame(results, index=df.index)


def run_meta_learner_comparison(
    train_size: int = 5000,
    test_size: int = 3000,
    seed: int = 42,
    verbose: bool = True,
) -> Dict[str, Any]:
    if verbose:
        print(f"Generating cohorts (Train N={train_size:,}, Test N={test_size:,})...")

    train_df = generate_data(n=train_size, seed=seed)
    test_df = generate_data(n=test_size, seed=seed + 100)

    true_10 = compute_true_uplift(test_df['past_spend'].values, test_df['loyalty_tier'].values, test_df['age'].values, 10)
    true_20 = compute_true_uplift(test_df['past_spend'].values, test_df['loyalty_tier'].values, test_df['age'].values, 20)

    models_to_test = {
        'S-Learner': SLearner(random_state=seed, n_estimators=50),
        'T-Learner': TLearner(random_state=seed, n_estimators=50),
        'X-Learner': XLearner(random_state=seed, n_estimators=50),
    }

    results: Dict[str, Any] = {}

    for name, learner in models_to_test.items():
        if verbose:
            print(f"  Fitting {name}...")
        t0 = time.perf_counter()
        learner.fit(train_df)
        train_time = round(time.perf_counter() - t0, 3)

        t1 = time.perf_counter()
        preds = learner.predict(test_df)
        infer_time = round((time.perf_counter() - t1) * 1000.0, 2)

        pehe_10 = round(pehe(true_10, preds['uplift_10'].values), 4)
        pehe_20 = round(pehe(true_20, preds['uplift_20'].values), 4)
        mean_pehe = round((pehe_10 + pehe_20) / 2.0, 4)

        binary_mask = test_df['discount'].isin([0, 20])
        eval_sub = test_df[binary_mask]
        q_res = qini_curve(
            y_true=eval_sub['purchase'].values,
            treatment=eval_sub['discount'].values,
            uplift_scores=preds.loc[binary_mask, 'uplift_20'].values,
            target_treatment=20,
            control_treatment=0,
        )

        results[name] = {
            'train_time_sec': train_time,
            'inference_latency_ms': infer_time,
            'pehe_arm_10': pehe_10,
            'pehe_arm_20': pehe_20,
            'mean_pehe': mean_pehe,
            'qini_score': q_res['qini_score'],
        }

    if verbose:
        print("  Fitting EconoCausal (CausalForestDML)...")
    t0 = time.perf_counter()
    dml_bundle = train_dml(train_df, cv=3, n_estimators=60, subforest_size=4, random_state=seed, n_jobs=1)
    train_time = round(time.perf_counter() - t0, 3)

    t1 = time.perf_counter()
    dml_preds = predict_uplift(dml_bundle, test_df)
    infer_time = round((time.perf_counter() - t1) * 1000.0, 2)

    pehe_10 = round(pehe(true_10, dml_preds['uplift_10'].values), 4)
    pehe_20 = round(pehe(true_20, dml_preds['uplift_20'].values), 4)
    mean_pehe = round((pehe_10 + pehe_20) / 2.0, 4)

    binary_mask = test_df['discount'].isin([0, 20])
    eval_sub = test_df[binary_mask]
    q_res = qini_curve(
        y_true=eval_sub['purchase'].values,
        treatment=eval_sub['discount'].values,
        uplift_scores=dml_preds.loc[binary_mask, 'uplift_20'].values,
        target_treatment=20,
        control_treatment=0,
    )

    results['EconoCausal (CausalForestDML)'] = {
        'train_time_sec': train_time,
        'inference_latency_ms': infer_time,
        'pehe_arm_10': pehe_10,
        'pehe_arm_20': pehe_20,
        'mean_pehe': mean_pehe,
        'qini_score': q_res['qini_score'],
    }

    ranked = sorted(results.items(), key=lambda x: x[1]['mean_pehe'])
    summary_table = []
    for rank, (model_name, metrics) in enumerate(ranked, 1):
        summary_table.append({
            'Rank': rank,
            'Model Architecture': model_name,
            'Mean PEHE (Error)': metrics['mean_pehe'],
            'PEHE 10% Arm': metrics['pehe_arm_10'],
            'PEHE 20% Arm': metrics['pehe_arm_20'],
            'Qini Score (AUUC)': metrics['qini_score'],
            'Train Time (s)': metrics['train_time_sec'],
            'Inference Latency (ms)': metrics['inference_latency_ms'],
        })

    return {
        'results': results,
        'summary_table': summary_table,
        'train_size': train_size,
        'test_size': test_size,
        'best_model': ranked[0][0],
    }
