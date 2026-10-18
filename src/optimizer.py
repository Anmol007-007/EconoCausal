from __future__ import annotations
from typing import Any, Dict, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.optimize import milp, LinearConstraint

def allocate_budget(
    df: pd.DataFrame,
    uplift_10: np.ndarray,
    uplift_20: np.ndarray,
    total_budget: float = 5000.0,
    unit_margin: float = 45.0,
    max_arm_20: Optional[int] = None,
) -> Dict[str, Any]:
    n = len(df)
    uplift_10 = np.asarray(uplift_10, dtype=float)
    uplift_20 = np.asarray(uplift_20, dtype=float)
    
    profit_10 = uplift_10 * unit_margin - 10.0
    profit_20 = uplift_20 * unit_margin - 20.0
    
    if n <= 5000:
        c = np.concatenate([-profit_10, -profit_20])
        integrality = np.ones(2 * n)
        
        row_budget = np.concatenate([np.full(n, 10.0), np.full(n, 20.0)])
        a_rows = [row_budget]
        lhs = [0.0]
        rhs = [float(total_budget)]
        
        for i in range(n):
            row_mutex = np.zeros(2 * n)
            row_mutex[i] = 1.0
            row_mutex[n + i] = 1.0
            a_rows.append(row_mutex)
            lhs.append(0.0)
            rhs.append(1.0)
            
        if max_arm_20 is not None:
            row_cap20 = np.zeros(2 * n)
            row_cap20[n:] = 1.0
            a_rows.append(row_cap20)
            lhs.append(0.0)
            rhs.append(float(max_arm_20))
            
        constraints = LinearConstraint(np.vstack(a_rows), lhs, rhs)
        res = milp(c=c, integrality=integrality, constraints=constraints)
        
        if res.success:
            x_sol = res.x
            x10 = x_sol[:n] > 0.5
            x20 = x_sol[n:] > 0.5
        else:
            x10, x20 = _greedy_knapsack(profit_10, profit_20, total_budget, max_arm_20)
    else:
        x10, x20 = _greedy_knapsack(profit_10, profit_20, total_budget, max_arm_20)

    optimal_arm = np.zeros(n, dtype=int)
    optimal_arm[x10] = 10
    optimal_arm[x20] = 20
    
    expected_profit = np.zeros(n, dtype=float)
    expected_profit[x10] = profit_10[x10]
    expected_profit[x20] = profit_20[x20]
    
    past_spend = df["past_spend"].values if "past_spend" in df.columns else np.zeros(n)
    quadrants = []
    for i in range(n):
        u_max = max(uplift_10[i], uplift_20[i])
        if u_max < -0.01:
            quadrants.append("Sleeping Dog")
        elif optimal_arm[i] > 0:
            quadrants.append("Persuadable")
        elif past_spend[i] > 200.0 or u_max < 0.02:
            quadrants.append("Sure Thing")
        else:
            quadrants.append("Lost Cause")
            
    allocated_df = pd.DataFrame({
        "optimal_discount": optimal_arm,
        "expected_profit": np.round(expected_profit, 2),
        "quadrant": quadrants,
        "uplift_10": np.round(uplift_10, 4),
        "uplift_20": np.round(uplift_20, 4),
    }, index=df.index)
    
    actual_spend = float(np.sum(optimal_arm))
    net_profit = float(np.sum(expected_profit))
    persuadables_targeted = int(np.sum(optimal_arm > 0))
    sure_things_held_out = int(sum(1 for q in quadrants if q == "Sure Thing"))
    waste_saved = float(sure_things_held_out * 15.0)
    
    return {
        "allocated_df": allocated_df,
        "actual_spend": actual_spend,
        "net_incremental_profit": round(net_profit, 2),
        "targeted_persuadables": persuadables_targeted,
        "sure_things_held_out": sure_things_held_out,
        "discount_waste_saved": round(waste_saved, 2),
        "alloc_0_count": int(np.sum(optimal_arm == 0)),
        "alloc_10_count": int(np.sum(optimal_arm == 10)),
        "alloc_20_count": int(np.sum(optimal_arm == 20)),
    }

def _greedy_knapsack(
    profit_10: np.ndarray,
    profit_20: np.ndarray,
    budget: float,
    max_arm_20: Optional[int] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    n = len(profit_10)
    x10 = np.zeros(n, dtype=bool)
    x20 = np.zeros(n, dtype=bool)
    
    candidates = []
    for i in range(n):
        p10 = profit_10[i]
        p20 = profit_20[i]
        if p10 > 0 and p10 >= p20:
            candidates.append((p10 / 10.0, 10, i, p10))
        elif p20 > 0 and p20 > p10:
            candidates.append((p20 / 20.0, 20, i, p20))
            
    candidates.sort(key=lambda item: item[0], reverse=True)
    
    rem_budget = budget
    count_20 = 0
    for density, arm, idx, prof in candidates:
        if arm == 10 and rem_budget >= 10.0:
            x10[idx] = True
            rem_budget -= 10.0
        elif arm == 20 and rem_budget >= 20.0:
            if max_arm_20 is None or count_20 < max_arm_20:
                x20[idx] = True
                rem_budget -= 20.0
                count_20 += 1
            elif rem_budget >= 10.0 and profit_10[idx] > 0:
                x10[idx] = True
                rem_budget -= 10.0
                
    return x10, x20
