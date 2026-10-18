from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

def calculate_psi(
    reference: np.ndarray,
    target: np.ndarray,
    bins: int = 10,
    epsilon: float = 1e-4,
) -> float:
    ref = np.asarray(reference, dtype=float)
    tgt = np.asarray(target, dtype=float)
    
    ref = ref[~np.isnan(ref)]
    tgt = tgt[~np.isnan(tgt)]
    
    if len(ref) == 0 or len(tgt) == 0:
        return 0.0
        
    quantiles = np.linspace(0, 100, bins + 1)
    bin_edges = np.percentile(ref, quantiles)
    bin_edges[0] = -np.inf
    bin_edges[-1] = np.inf
    bin_edges = np.unique(bin_edges)
    
    ref_counts, _ = np.histogram(ref, bins=bin_edges)
    tgt_counts, _ = np.histogram(tgt, bins=bin_edges)
    
    ref_pct = ref_counts / max(len(ref), 1)
    tgt_pct = tgt_counts / max(len(tgt), 1)
    
    ref_pct = np.where(ref_pct == 0, epsilon, ref_pct)
    tgt_pct = np.where(tgt_pct == 0, epsilon, tgt_pct)
    
    psi_val = np.sum((tgt_pct - ref_pct) * np.log(tgt_pct / ref_pct))
    return float(np.round(max(0.0, psi_val), 4))

def calculate_ks(
    reference: np.ndarray,
    target: np.ndarray,
) -> Tuple[float, float]:
    ref = np.asarray(reference, dtype=float)
    tgt = np.asarray(target, dtype=float)
    
    ref = ref[~np.isnan(ref)]
    tgt = tgt[~np.isnan(tgt)]
    
    if len(ref) == 0 or len(tgt) == 0:
        return (0.0, 1.0)
        
    res = ks_2samp(ref, tgt)
    return (float(np.round(res.statistic, 4)), float(np.round(res.pvalue, 4)))

def evaluate_drift(
    reference_df: pd.DataFrame,
    production_df: pd.DataFrame,
    features: Optional[List[str]] = None,
    psi_threshold: float = 0.20,
) -> Dict[str, Any]:
    if features is None:
        common_cols = [c for c in reference_df.columns if c in production_df.columns]
        features = [c for c in common_cols if np.issubdtype(reference_df[c].dtype, np.number)]
        
    metrics = []
    max_psi = 0.0
    critical_features = []
    
    for feat in features:
        if feat not in reference_df.columns or feat not in production_df.columns:
            continue
            
        ref_arr = reference_df[feat].values
        tgt_arr = production_df[feat].values
        
        psi_val = calculate_psi(ref_arr, tgt_arr)
        ks_stat, ks_pval = calculate_ks(ref_arr, tgt_arr)
        
        if psi_val > max_psi:
            max_psi = psi_val
            
        if psi_val >= psi_threshold:
            status = "Critical Drift"
            critical_features.append(feat)
        elif psi_val >= 0.10:
            status = "Mild Shift"
        else:
            status = "Stable"
            
        metrics.append({
            "feature": feat,
            "psi": psi_val,
            "ks_statistic": ks_stat,
            "p_value": ks_pval,
            "status": status,
        })
        
    retrain_recommended = len(critical_features) > 0
    overall_status = "Action Required" if retrain_recommended else "Healthy"
    
    return {
        "metrics": metrics,
        "max_psi": round(max_psi, 4),
        "psi_threshold": psi_threshold,
        "critical_features": critical_features,
        "retrain_recommended": retrain_recommended,
        "overall_status": overall_status,
    }
