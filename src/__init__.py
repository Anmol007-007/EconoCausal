from .data_gen import generate_data, compute_true_uplift, DISCOUNT_LEVELS, LOYALTY_TIERS
from .causal_model import (
    build_dag,
    identify_effect,
    get_dag_dot,
    CONFOUNDERS,
    EFFECT_MODIFIERS,
    TREATMENT_COL,
    OUTCOME_COL,
    fit_propensity,
    overlap_report,
    balance_table,
    refute_placebo,
    refute_random_common_cause,
    refute_data_subset,
    run_all_refutations,
)
from .dml import (
    train_dml,
    predict_uplift,
    prepare_features,
    pehe,
    qini_curve,
    uplift_curve,
    train_naive_baseline,
    predict_naive_uplift,
)
from .optimizer import (
    allocate_budget,
    calculate_psi,
    calculate_ks,
    evaluate_drift,
    generate_executive_summary,
)
