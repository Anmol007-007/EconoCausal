from __future__ import annotations
from typing import List, Optional
import pandas as pd
from dowhy import CausalModel
CONFOUNDERS: List[str] = ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity']
EFFECT_MODIFIERS: List[str] = ['age', 'past_spend', 'loyalty_tier']
TREATMENT_COL: str = 'discount'
OUTCOME_COL: str = 'purchase'

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
    estimand = model.identify_effect(proceed_when_unidentifiable=proceed_when_unidentifiable)
    return estimand
