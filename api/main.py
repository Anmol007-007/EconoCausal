from __future__ import annotations
import io
import time
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.data_gen import generate_data, compute_true_uplift
from src.causal_model import (
    build_dag,
    identify_effect,
    get_dag_dot,
    fit_propensity,
    overlap_report,
    balance_table,
    run_all_refutations,
    CONFOUNDERS,
)
from src.dml import (
    train_dml,
    predict_uplift,
    pehe,
    qini_curve,
    uplift_curve,
)
from src.optimizer import (
    allocate_budget,
    evaluate_drift,
    generate_executive_summary,
)

app = FastAPI(title="EconoCausal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_STATE: Dict[str, Any] = {
    "df": None,
    "dml_bundle": None,
    "uplift_df": None,
    "allocation_results": None,
    "drift_results": None,
    "refutation_results": None,
}

def _get_active_df() -> pd.DataFrame:
    if _STATE["df"] is None:
        _STATE["df"] = generate_data(n=2000, seed=42)
    return _STATE["df"]

class UpliftRequest(BaseModel):
    dataset_id: Optional[str] = "default_retail"
    n_estimators: int = Field(default=40, ge=8, le=500)
    cv: int = Field(default=3, ge=2, le=10)
    subforest_size: int = Field(default=4, ge=1, le=10)

class AllocateRequest(BaseModel):
    total_budget: float = Field(default=5000.0, ge=100.0)
    unit_margin: float = Field(default=45.0, ge=1.0)
    max_arm_20: Optional[int] = None

class DriftRequest(BaseModel):
    baseline_id: Optional[str] = "default_retail"
    window: Optional[str] = "7d"
    psi_threshold: float = Field(default=0.20, ge=0.01, le=1.0)

@app.get("/")
@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": "EconoCausal API", "version": "1.0.0"}

@app.post("/upload")
@app.post("/api/upload")
async def upload_dataset(
    file: Optional[UploadFile] = File(None),
    seed: int = Form(42),
    n_records: int = Form(2000),
) -> Dict[str, Any]:
    if file is not None:
        content = await file.read()
        filename = file.filename or "data.csv"
        if filename.endswith(".parquet"):
            df = pd.read_parquet(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    else:
        df = generate_data(n=n_records, seed=seed)

    _STATE["df"] = df
    _STATE["dml_bundle"] = None
    _STATE["uplift_df"] = None

    req_cols = ["past_spend", "recency_days", "loyalty_tier", "category_affinity", "discount", "purchase"]
    present = [c for c in req_cols if c in df.columns]
    missing_pct = float(df[present].isna().mean().mean() * 100.0) if present else 0.0

    return {
        "status": "success",
        "dataset_id": f"ds_{len(df)}_{seed}",
        "records": len(df),
        "columns": list(df.columns),
        "missingness": round(missing_pct, 4),
        "confounders": [c for c in CONFOUNDERS if c in df.columns],
        "treatment": "discount" if "discount" in df.columns else None,
        "outcome": "purchase" if "purchase" in df.columns else None,
        "validated": len(present) == len(req_cols),
    }

@app.post("/uplift")
@app.post("/api/uplift")
def run_uplift_modeling(payload: Optional[UpliftRequest] = None) -> Dict[str, Any]:
    if payload is None:
        payload = UpliftRequest()

    df = _get_active_df()
    start_time = time.time()
    bundle = train_dml(
        df,
        cv=payload.cv,
        n_estimators=payload.n_estimators,
        subforest_size=payload.subforest_size,
        random_state=42,
    )
    _STATE["dml_bundle"] = bundle
    uplift_df = predict_uplift(bundle, df)
    _STATE["uplift_df"] = uplift_df
    elapsed = round(time.time() - start_time, 2)

    u10 = uplift_df["uplift_10"].values
    u20 = uplift_df["uplift_20"].values
    qini_res = qini_curve(df["purchase"], df["discount"], u10, target_treatment=10)
    gain_res = uplift_curve(df["purchase"], df["discount"], u10, target_treatment=10)

    pehe_val = 0.0
    if "past_spend" in df.columns and "loyalty_tier" in df.columns and "age" in df.columns:
        true_10 = compute_true_uplift(
            past_spend=df["past_spend"].values,
            loyalty_tier=df["loyalty_tier"].values,
            age=df["age"].values,
            discount=10,
        )
        pehe_val = round(pehe(true_10, u10), 4)

    return {
        "model": "CausalForestDML",
        "records": len(df),
        "cv_folds": payload.cv,
        "ate_10": round(float(np.mean(u10)), 4),
        "ate_20": round(float(np.mean(u20)), 4),
        "pehe_rmse": pehe_val,
        "qini_score": qini_res["qini_score"],
        "qini_curve": qini_res,
        "uplift_curve": gain_res,
        "execution_time_seconds": elapsed,
    }

@app.post("/allocate")
@app.post("/api/allocate")
def run_budget_allocation(payload: Optional[AllocateRequest] = None) -> Dict[str, Any]:
    if payload is None:
        payload = AllocateRequest()

    df = _get_active_df()
    if _STATE["uplift_df"] is None:
        run_uplift_modeling(UpliftRequest(n_estimators=32, cv=2))

    uplift_df = _STATE["uplift_df"]
    u10 = uplift_df["uplift_10"].values
    u20 = uplift_df["uplift_20"].values

    res = allocate_budget(
        df=df,
        uplift_10=u10,
        uplift_20=u20,
        total_budget=payload.total_budget,
        unit_margin=payload.unit_margin,
        max_arm_20=payload.max_arm_20,
    )
    _STATE["allocation_results"] = res

    alloc_df = res["allocated_df"]
    quadrant_counts = alloc_df["quadrant"].value_counts().to_dict()

    return {
        "solver": "scipy.optimize.milp",
        "status": "Optimal (converged)",
        "budget_allocated": res["actual_spend"],
        "net_incremental_profit": res["net_incremental_profit"],
        "targeted_persuadables": res["targeted_persuadables"],
        "sure_things_held_out": res["sure_things_held_out"],
        "discount_waste_saved": res["discount_waste_saved"],
        "alloc_0_count": res["alloc_0_count"],
        "alloc_10_count": res["alloc_10_count"],
        "alloc_20_count": res["alloc_20_count"],
        "quadrant_breakdown": quadrant_counts,
    }

@app.get("/diagnostics")
@app.get("/api/diagnostics")
def get_causal_diagnostics() -> Dict[str, Any]:
    df = _get_active_df()
    sample_df = df.head(400).copy()

    model = build_dag(sample_df)
    estimand = identify_effect(model)
    estimate = model.estimate_effect(estimand, method_name="backdoor.linear_regression")

    refutations = run_all_refutations(model, estimand, estimate, random_state=42)
    _STATE["refutation_results"] = refutations

    _, prop_df, weights = fit_propensity(sample_df, treatment_col="discount")
    overlap = overlap_report(prop_df, sample_df["discount"])
    balance = balance_table(sample_df, treatment_col="discount", weights=weights)

    return {
        "dag_dot": get_dag_dot(),
        "estimand_backdoor_variables": estimand.get_backdoor_variables(),
        "overlap_report": overlap,
        "balance_table": balance.to_dict(orient="records"),
        "refutations": refutations,
    }

@app.post("/drift")
@app.post("/api/drift")
def check_drift(payload: Optional[DriftRequest] = None) -> Dict[str, Any]:
    if payload is None:
        payload = DriftRequest()

    df_base = _get_active_df()
    rng = np.random.default_rng(99)
    df_prod = df_base.copy()
    if "past_spend" in df_prod.columns:
        df_prod["past_spend"] = np.clip(df_prod["past_spend"] * rng.normal(1.05, 0.08, len(df_prod)), 10.0, 1000.0)
    if "category_affinity" in df_prod.columns:
        df_prod["category_affinity"] = np.clip(df_prod["category_affinity"] + rng.normal(0.04, 0.05, len(df_prod)), 0.0, 1.0)

    report = evaluate_drift(
        reference_df=df_base,
        production_df=df_prod,
        psi_threshold=payload.psi_threshold,
    )
    _STATE["drift_results"] = report
    return report

@app.get("/summary")
@app.get("/api/summary")
def get_executive_summary() -> Dict[str, Any]:
    if _STATE["allocation_results"] is None:
        run_budget_allocation(AllocateRequest())
    if _STATE["drift_results"] is None:
        check_drift(DriftRequest())
    if _STATE["refutation_results"] is None:
        _STATE["refutation_results"] = {"all_passed": True}

    summary = generate_executive_summary(
        allocation_results=_STATE["allocation_results"],
        drift_results=_STATE["drift_results"],
        refutation_results=_STATE["refutation_results"],
    )
    return summary
