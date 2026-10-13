"""Causal DAG formulation and identification using DoWhy."""

from __future__ import annotations

from typing import List, Optional
import pandas as pd
from dowhy import CausalModel


CONFOUNDERS: List[str] = ["past_spend", "recency_days", "loyalty_tier", "category_affinity"]
EFFECT_MODIFIERS: List[str] = ["age", "past_spend", "loyalty_tier"]
TREATMENT_COL: str = "discount"
OUTCOME_COL: str = "purchase"


def get_dag_dot() -> str:
    """Return the causal DAG in Graphviz DOT format."""
    return """digraph {
    past_spend -> discount;
    recency_days -> discount;
    loyalty_tier -> discount;
    category_affinity -> discount;
    past_spend -> purchase;
    recency_days -> purchase;
    loyalty_tier -> purchase;
    category_affinity -> purchase;
    age -> purchase;
    discount -> purchase;
}"""


def build_dag(
    df: pd.DataFrame,
    treatment: str = TREATMENT_COL,
    outcome: str = OUTCOME_COL,
    common_causes: Optional[List[str]] = None,
    effect_modifiers: Optional[List[str]] = None,
    graph: Optional[str] = None,
) -> CausalModel:
    """Build a DoWhy CausalModel based on observational campaign schema.

    Args:
        df: Input DataFrame containing observational campaign data.
        treatment: Name of the treatment variable.
        outcome: Name of the outcome variable.
        common_causes: List of confounding features.
        effect_modifiers: List of features along which the effect varies.
        graph: Optional custom DOT graph representation.

    Returns:
        Configured dowhy.CausalModel instance.
    """
    if common_causes is None:
        common_causes = list(CONFOUNDERS)

    cols_to_use = [col for col in df.columns if col not in ("true_effect", "customer_id")]
    df_clean = df[cols_to_use].copy()

    if "loyalty_tier" in df_clean.columns and df_clean["loyalty_tier"].dtype == "object":
        df_clean["loyalty_tier"] = df_clean["loyalty_tier"].astype("category")

    if graph is None:
        graph = get_dag_dot()

    model = CausalModel(
        data=df_clean,
        treatment=treatment,
        outcome=outcome,
        graph=graph.replace("\n", " "),
        common_causes=common_causes,
        effect_modifiers=effect_modifiers,
    )
    return model


def identify_effect(
    model: CausalModel,
    proceed_when_unidentifiable: bool = True,
):
    """Identify causal effect using the backdoor criterion on the causal graph.

    Args:
        model: Fitted or initialized dowhy.CausalModel.
        proceed_when_unidentifiable: Whether to proceed if unidentifiable.

    Returns:
        dowhy.causal_identifier.IdentifiedEstimand
    """
    estimand = model.identify_effect(proceed_when_unidentifiable=proceed_when_unidentifiable)
    return estimand
