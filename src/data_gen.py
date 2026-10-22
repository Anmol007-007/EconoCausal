from __future__ import annotations
import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd

LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold']
DISCOUNT_LEVELS = [0, 10, 20]

def _sigmoid(x: np.ndarray) -> np.ndarray:
    return np.where(x >= 0, 1 / (1 + np.exp(-x)), np.exp(x) / (1 + np.exp(x)))

def compute_true_uplift(past_spend: np.ndarray, loyalty_tier: np.ndarray, age: np.ndarray, discount: int | np.ndarray) -> np.ndarray:
    spend_norm = (past_spend - 120.0) / 80.0
    age_norm = (age - 40.0) / 12.0
    tier_penalty = np.where(loyalty_tier == 'Gold', 1.2, np.where(loyalty_tier == 'Silver', 0.5, 0.0))
    latent_sensitivity = 0.5 - 0.7 * spend_norm - 0.4 * tier_penalty - 0.2 * age_norm
    sensitivity = _sigmoid(latent_sensitivity)
    if isinstance(discount, (int, float)):
        if discount == 0:
            scale = 0.0
        elif discount == 10:
            scale = 0.15
        elif discount == 20:
            scale = 0.25
        else:
            scale = float(discount) * 0.0125
        return scale * sensitivity
    discount_arr = np.asarray(discount)
    scale = np.where(discount_arr == 0, 0.0, np.where(discount_arr == 10, 0.15, np.where(discount_arr == 20, 0.25, discount_arr * 0.0125)))
    return scale * sensitivity

def generate_data(n: int=50000, seed: int=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    customer_id = np.arange(1, n + 1, dtype=int)
    past_spend = np.round(rng.lognormal(mean=4.6, sigma=0.6, size=n), 2)
    past_spend = np.clip(past_spend, 10.0, 1000.0)
    recency_days = rng.integers(low=1, high=366, size=n)
    tier_probs = [0.5, 0.35, 0.15]
    loyalty_tier = rng.choice(LOYALTY_TIERS, size=n, p=tier_probs)
    age = np.clip(rng.normal(loc=42, scale=14, size=n).astype(int), 18, 80)
    category_affinity = np.round(rng.beta(a=2.5, b=2.5, size=n), 4)
    spend_std = (past_spend - np.mean(past_spend)) / (np.std(past_spend) + 1e-06)
    recency_std = (recency_days - np.mean(recency_days)) / (np.std(recency_days) + 1e-06)
    tier_bonus = np.where(loyalty_tier == 'Gold', 0.9, np.where(loyalty_tier == 'Silver', 0.4, 0.0))
    logit_0 = np.zeros(n)
    logit_10 = -0.3 + 0.5 * spend_std - 0.3 * recency_std + 0.4 * tier_bonus + 0.2 * category_affinity
    logit_20 = -0.8 + 0.7 * spend_std - 0.4 * recency_std + 0.7 * tier_bonus + 0.3 * category_affinity
    max_logit = np.maximum(logit_0, np.maximum(logit_10, logit_20))
    exp_0 = np.exp(logit_0 - max_logit)
    exp_10 = np.exp(logit_10 - max_logit)
    exp_20 = np.exp(logit_20 - max_logit)
    sum_exp = exp_0 + exp_10 + exp_20
    prob_0 = exp_0 / sum_exp
    prob_10 = exp_10 / sum_exp
    prob_20 = exp_20 / sum_exp
    treatment_probs = np.column_stack([prob_0, prob_10, prob_20])
    cum_probs = np.cumsum(treatment_probs, axis=1)
    unif = rng.random(size=(n, 1))
    treatment_idx = (unif > cum_probs).sum(axis=1)
    discount = np.array(DISCOUNT_LEVELS)[treatment_idx]
    base_logit = -1.5 + 0.8 * spend_std - 0.6 * recency_std + 0.6 * tier_bonus + 0.7 * category_affinity - 0.2 * ((age - 40) / 15.0)
    base_prob = _sigmoid(base_logit)
    assigned_uplift = compute_true_uplift(past_spend, loyalty_tier, age, discount)
    purchase_prob = np.clip(base_prob + assigned_uplift, 0.01, 0.99)
    purchase = rng.binomial(n=1, p=purchase_prob, size=n)
    df = pd.DataFrame({'customer_id': customer_id, 'past_spend': past_spend, 'recency_days': recency_days, 'loyalty_tier': loyalty_tier, 'age': age, 'category_affinity': category_affinity, 'discount': discount, 'purchase': purchase, 'true_effect': np.round(assigned_uplift, 5)})
    return df

def generate_hillstrom_benchmark(n: int=10000, seed: int=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    customer_id = np.arange(1, n + 1, dtype=int)
    recency_months = rng.integers(low=1, high=13, size=n)
    recency_days = recency_months * 30
    past_spend = np.round(rng.lognormal(mean=5.0, sigma=0.7, size=n), 2)
    past_spend = np.clip(past_spend, 25.0, 1500.0)
    channel = rng.choice(['Web', 'Phone', 'Multichannel'], size=n, p=[0.45, 0.40, 0.15])
    spend_pct = pd.qcut(past_spend, q=[0.0, 0.5, 0.85, 1.0], labels=LOYALTY_TIERS).astype(str)
    loyalty_tier = np.array(spend_pct)
    age = np.clip(rng.normal(loc=38, scale=12, size=n).astype(int), 18, 75)
    category_affinity = np.round(rng.uniform(0.1, 0.95, size=n), 4)
    treatment_assignment = rng.choice([0, 10, 20], size=n, p=[0.34, 0.33, 0.33])
    base_rate = 0.06 + 0.04 * (past_spend > 200) - 0.02 * (recency_months > 6)
    uplift_10 = 0.08 * (channel != 'Phone') + 0.03 * (age < 45)
    uplift_20 = 0.12 * (channel == 'Multichannel') + 0.06 * (category_affinity > 0.5)
    effective_uplift = np.where(treatment_assignment == 10, uplift_10, np.where(treatment_assignment == 20, uplift_20, 0.0))
    effective_uplift = np.clip(effective_uplift, 0.0, 0.35)
    purchase_prob = np.clip(base_rate + effective_uplift, 0.01, 0.95)
    purchase = rng.binomial(n=1, p=purchase_prob, size=n)
    return pd.DataFrame({
        'customer_id': customer_id,
        'past_spend': past_spend,
        'recency_days': recency_days,
        'loyalty_tier': loyalty_tier,
        'age': age,
        'category_affinity': category_affinity,
        'discount': treatment_assignment,
        'purchase': purchase,
        'true_effect': np.round(effective_uplift, 5)
    })

def generate_starbucks_benchmark(n: int=10000, seed: int=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    customer_id = np.arange(1, n + 1, dtype=int)
    v1 = rng.normal(0.0, 1.0, size=n)
    v2 = rng.normal(0.0, 1.0, size=n)
    past_spend = np.round(np.clip(80.0 + 35.0 * v1 + rng.normal(0, 10, n), 10.0, 500.0), 2)
    recency_days = np.clip(np.round(60.0 - 20.0 * v2 + rng.normal(0, 15, n)).astype(int), 1, 365)
    tier_scores = v1 + v2
    loyalty_tier = np.where(tier_scores > 1.0, 'Gold', np.where(tier_scores > -0.5, 'Silver', 'Bronze'))
    age = np.clip(rng.normal(loc=35, scale=10, size=n).astype(int), 18, 70)
    category_affinity = np.round(rng.beta(3, 2, size=n), 4)
    treatment_arm = rng.choice([0, 10, 20], size=n, p=[0.5, 0.3, 0.2])
    base_purchase = _sigmoid(-2.0 + 0.4 * v1 - 0.3 * (recency_days / 100.0))
    starbucks_uplift = np.where(treatment_arm == 10, 0.12 * _sigmoid(v1), np.where(treatment_arm == 20, 0.20 * _sigmoid(v1 + v2), 0.0))
    purchase_prob = np.clip(base_purchase + starbucks_uplift, 0.01, 0.99)
    purchase = rng.binomial(n=1, p=purchase_prob, size=n)
    return pd.DataFrame({
        'customer_id': customer_id,
        'past_spend': past_spend,
        'recency_days': recency_days,
        'loyalty_tier': loyalty_tier,
        'age': age,
        'category_affinity': category_affinity,
        'discount': treatment_arm,
        'purchase': purchase,
        'true_effect': np.round(starbucks_uplift, 5)
    })

def load_benchmark_dataset(name: str='synthetic_retail', n: int=5000, seed: int=42) -> pd.DataFrame:
    clean_name = str(name).lower().strip()
    if 'hillstrom' in clean_name or 'email' in clean_name:
        return generate_hillstrom_benchmark(n=n, seed=seed)
    if 'starbucks' in clean_name:
        return generate_starbucks_benchmark(n=n, seed=seed)
    return generate_data(n=n, seed=seed)

def validate_and_impute_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    report: Dict[str, Any] = {
        'is_valid': True,
        'records': len(df),
        'original_columns': list(df.columns),
        'treatment_col': None,
        'outcome_col': None,
        'feature_cols': [],
        'imputed_missing_counts': {},
        'detected_types': {},
        'warnings': [],
        'errors': []
    }
    if df is None or len(df) == 0:
        report['is_valid'] = False
        report['errors'].append('Dataset is empty or null.')
        return pd.DataFrame(), report

    clean_df = df.copy()

    treatment_candidates = ['discount', 'treatment', 'treat', 'segment', 'promotion', 'promo', 'offer', 't']
    found_treatment = None
    for cand in treatment_candidates:
        matches = [c for c in clean_df.columns if c.lower() == cand]
        if matches:
            found_treatment = matches[0]
            break

    if found_treatment:
        report['treatment_col'] = found_treatment
        clean_df['discount'] = pd.to_numeric(clean_df[found_treatment], errors='coerce').fillna(0).astype(int)
    else:
        clean_df['discount'] = 0
        report['warnings'].append('Treatment column not found. Created fallback zero treatment.')

    outcome_candidates = ['purchase', 'conversion', 'converted', 'target', 'outcome', 'y', 'visit', 'bought']
    found_outcome = None
    for cand in outcome_candidates:
        matches = [c for c in clean_df.columns if c.lower() == cand]
        if matches:
            found_outcome = matches[0]
            break

    if found_outcome:
        report['outcome_col'] = found_outcome
        clean_df['purchase'] = pd.to_numeric(clean_df[found_outcome], errors='coerce').fillna(0).clip(0, 1).astype(int)
    else:
        report['is_valid'] = False
        report['errors'].append('Required outcome/purchase column missing from dataset.')
        return clean_df, report

    spend_candidates = ['past_spend', 'spend', 'history', 'amount', 'sales', 'revenue', 'monetary']
    found_spend = next((c for c in clean_df.columns if c.lower() in spend_candidates), None)
    if found_spend:
        clean_df['past_spend'] = pd.to_numeric(clean_df[found_spend], errors='coerce')
    else:
        clean_df['past_spend'] = 120.0
        report['warnings'].append('past_spend column not found. Imputed with benchmark mean $120.0.')

    recency_candidates = ['recency_days', 'recency', 'days_since_last_order', 'last_visit_days']
    found_recency = next((c for c in clean_df.columns if c.lower() in recency_candidates), None)
    if found_recency:
        clean_df['recency_days'] = pd.to_numeric(clean_df[found_recency], errors='coerce')
    else:
        clean_df['recency_days'] = 90
        report['warnings'].append('recency_days column not found. Imputed with benchmark 90 days.')

    loyalty_candidates = ['loyalty_tier', 'tier', 'segment', 'customer_segment', 'membership']
    found_loyalty = next((c for c in clean_df.columns if c.lower() in loyalty_candidates and c.lower() != str(found_treatment).lower()), None)
    if found_loyalty:
        clean_df['loyalty_tier'] = clean_df[found_loyalty].apply(
            lambda x: np.nan if pd.isna(x) else (x if x in LOYALTY_TIERS else ('Gold' if 'gold' in str(x).lower() else ('Silver' if 'silver' in str(x).lower() else 'Bronze')))
        )
    else:
        clean_df['loyalty_tier'] = pd.qcut(clean_df['past_spend'].rank(method='first'), q=[0.0, 0.5, 0.85, 1.0], labels=LOYALTY_TIERS).astype(str)
        report['warnings'].append('loyalty_tier column synthesized from past_spend quantiles.')

    age_candidates = ['age', 'customer_age']
    found_age = next((c for c in clean_df.columns if c.lower() in age_candidates), None)
    if found_age:
        clean_df['age'] = pd.to_numeric(clean_df[found_age], errors='coerce')
    else:
        clean_df['age'] = 42
        report['warnings'].append('age column not found. Imputed with benchmark 42.')

    affinity_candidates = ['category_affinity', 'affinity', 'score', 'prob', 'v1']
    found_affinity = next((c for c in clean_df.columns if c.lower() in affinity_candidates), None)
    if found_affinity:
        clean_df['category_affinity'] = pd.to_numeric(clean_df[found_affinity], errors='coerce')
    else:
        clean_df['category_affinity'] = 0.5
        report['warnings'].append('category_affinity column not found. Imputed with default 0.5.')

    required_features = ['past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity']
    report['feature_cols'] = required_features

    for col in required_features + ['discount', 'purchase']:
        nans = int(clean_df[col].isna().sum())
        if nans > 0:
            report['imputed_missing_counts'][col] = nans
            if col == 'loyalty_tier':
                clean_df[col] = clean_df[col].fillna('Bronze')
            else:
                med = clean_df[col].median()
                clean_df[col] = clean_df[col].fillna(0.0 if pd.isna(med) else med)

    clean_df['past_spend'] = clean_df['past_spend'].clip(lower=1.0)
    clean_df['recency_days'] = clean_df['recency_days'].clip(lower=1, upper=1000).astype(int)
    clean_df['age'] = clean_df['age'].clip(lower=18, upper=100).astype(int)
    clean_df['category_affinity'] = clean_df['category_affinity'].clip(lower=0.0, upper=1.0)
    clean_df['discount'] = clean_df['discount'].astype(int)
    clean_df['purchase'] = clean_df['purchase'].astype(int)

    if 'customer_id' not in clean_df.columns:
        clean_df['customer_id'] = np.arange(1, len(clean_df) + 1, dtype=int)

    for col in required_features + ['discount', 'purchase']:
        report['detected_types'][col] = str(clean_df[col].dtype)

    return clean_df, report

def main() -> None:
    parser = argparse.ArgumentParser(description='Generate synthetic retail campaign dataset for EconoCausal.')
    parser.add_argument('--n', type=int, default=50000, help='Number of records (default: 50000)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed (default: 42)')
    parser.add_argument('--benchmark', type=str, default='synthetic_retail', help='Benchmark name (synthetic_retail, hillstrom, starbucks)')
    parser.add_argument('--out', type=str, default='data/synthetic.csv', help='Output path (default: data/synthetic.csv)')
    args = parser.parse_args()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    print(f'Generating dataset (benchmark={args.benchmark}, n={args.n}, seed={args.seed})...')
    df = load_benchmark_dataset(name=args.benchmark, n=args.n, seed=args.seed)
    df.to_csv(out_path, index=False)
    print(f'Saved {len(df):,} records to {out_path.resolve()}')
    print('\nDataset Summary:')
    print(df.describe(include='all').T[['count', 'mean', 'std', 'min', 'max']])

if __name__ == '__main__':
    main()
