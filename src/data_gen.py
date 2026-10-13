"""Data generator for EconoCausal synthetic retail dataset.

Simulates observational campaign data with confounding and heterogeneous
treatment effects (ITE/uplift) across customer segments.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd


LOYALTY_TIERS = ["Bronze", "Silver", "Gold"]
DISCOUNT_LEVELS = [0, 10, 20]


def _sigmoid(x: np.ndarray) -> np.ndarray:
    """Numerically stable sigmoid function."""
    return np.where(x >= 0, 1 / (1 + np.exp(-x)), np.exp(x) / (1 + np.exp(x)))


def compute_true_uplift(
    past_spend: np.ndarray,
    loyalty_tier: np.ndarray,
    age: np.ndarray,
    discount: int | np.ndarray,
) -> np.ndarray:
    """Calculate the true heterogeneous treatment effect (uplift) for a discount level.

    Args:
        past_spend: Past customer spend array.
        loyalty_tier: Array of loyalty tiers ('Bronze', 'Silver', 'Gold').
        age: Customer age array.
        discount: Discount level (0, 10, or 20) or array of discount levels.

    Returns:
        Array of uplift values representing change in purchase probability.
    """
    spend_norm = (past_spend - 120.0) / 80.0
    age_norm = (age - 40.0) / 12.0
    tier_penalty = np.where(loyalty_tier == "Gold", 1.2, np.where(loyalty_tier == "Silver", 0.5, 0.0))

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
    scale = np.where(
        discount_arr == 0,
        0.0,
        np.where(discount_arr == 10, 0.15, np.where(discount_arr == 20, 0.25, discount_arr * 0.0125)),
    )
    return scale * sensitivity


def generate_data(n: int = 50000, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic observational retail dataset with confounding.

    Args:
        n: Number of customer records to generate.
        seed: Random seed for reproducibility.

    Returns:
        pd.DataFrame with schema matching project specification.
    """
    rng = np.random.default_rng(seed)

    customer_id = np.arange(1, n + 1, dtype=int)

    past_spend = np.round(rng.lognormal(mean=4.6, sigma=0.6, size=n), 2)
    past_spend = np.clip(past_spend, 10.0, 1000.0)

    recency_days = rng.integers(low=1, high=366, size=n)

    tier_probs = [0.50, 0.35, 0.15]
    loyalty_tier = rng.choice(LOYALTY_TIERS, size=n, p=tier_probs)

    age = np.clip(rng.normal(loc=42, scale=14, size=n).astype(int), 18, 80)

    category_affinity = np.round(rng.beta(a=2.5, b=2.5, size=n), 4)

    spend_std = (past_spend - np.mean(past_spend)) / (np.std(past_spend) + 1e-6)
    recency_std = (recency_days - np.mean(recency_days)) / (np.std(recency_days) + 1e-6)
    tier_bonus = np.where(loyalty_tier == "Gold", 0.9, np.where(loyalty_tier == "Silver", 0.4, 0.0))

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

    base_logit = (
        -1.5
        + 0.8 * spend_std
        - 0.6 * recency_std
        + 0.6 * tier_bonus
        + 0.7 * category_affinity
        - 0.2 * ((age - 40) / 15.0)
    )
    base_prob = _sigmoid(base_logit)

    assigned_uplift = compute_true_uplift(past_spend, loyalty_tier, age, discount)

    purchase_prob = np.clip(base_prob + assigned_uplift, 0.01, 0.99)
    purchase = rng.binomial(n=1, p=purchase_prob, size=n)

    df = pd.DataFrame(
        {
            "customer_id": customer_id,
            "past_spend": past_spend,
            "recency_days": recency_days,
            "loyalty_tier": loyalty_tier,
            "age": age,
            "category_affinity": category_affinity,
            "discount": discount,
            "purchase": purchase,
            "true_effect": np.round(assigned_uplift, 5),
        }
    )

    return df


def main() -> None:
    """CLI entrypoint for generating synthetic campaign data."""
    parser = argparse.ArgumentParser(description="Generate synthetic retail campaign dataset for EconoCausal.")
    parser.add_argument("--n", type=int, default=50000, help="Number of records (default: 50000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    parser.add_argument("--out", type=str, default="data/synthetic.csv", help="Output path (default: data/synthetic.csv)")

    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating synthetic dataset (n={args.n}, seed={args.seed})...")
    df = generate_data(n=args.n, seed=args.seed)

    df.to_csv(out_path, index=False)
    print(f"Saved {len(df):,} records to {out_path.resolve()}")
    print("\nDataset Summary:")
    print(df.describe(include="all").T[["count", "mean", "std", "min", "max"]])


if __name__ == "__main__":
    main()
