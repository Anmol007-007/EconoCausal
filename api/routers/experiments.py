from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from database.repositories.experiment_repo import ExperimentRepository
from database.repositories.run_repo import PipelineRunRepository
from database.repositories.audit_repo import AuditRepository
from api.dependencies import get_current_user, get_admin_user
from api.models.user import User
from api.logging_config import get_recent_logs
from api.monitoring.metrics import export_metrics

router = APIRouter(tags=["Experiments & Persistence"])

class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, json_schema_extra={"example": "Q4 Discount Sensitivity Pilot"})
    description: Optional[str] = Field(None, max_length=2000, json_schema_extra={"example": "Testing CATE uplift on churn risk cohort"})
    dataset_hash: Optional[str] = Field(None, max_length=64)
    row_count: int = Field(default=0, ge=0)
    meta_info: Optional[Dict[str, Any]] = None

class RunCreate(BaseModel):
    run_type: str = Field(..., json_schema_extra={"example": "dml_causal_forest"})
    status: str = Field(default="completed")
    params: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    duration_ms: float = Field(default=0.0, ge=0.0)

@router.post("/experiments", status_code=status.HTTP_201_CREATED)
async def create_experiment(
    payload: ExperimentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    repo = ExperimentRepository(db)
    audit = AuditRepository(db)
    exp = await repo.create(
        name=payload.name,
        description=payload.description,
        dataset_hash=payload.dataset_hash,
        row_count=payload.row_count,
        meta_info=payload.meta_info,
    )
    await audit.log_action(
        action="CREATE_EXPERIMENT",
        resource=f"/api/experiments/{exp.id}",
        user_id=current_user.id,
        status_code=201,
        extra={"name": payload.name, "row_count": payload.row_count},
    )
    return {
        "status": "success",
        "data": {
            "id": exp.id,
            "name": exp.name,
            "description": exp.description,
            "dataset_hash": exp.dataset_hash,
            "row_count": exp.row_count,
            "status": exp.status,
            "created_at": exp.created_at.isoformat(),
        },
    }

@router.get("/experiments")
async def list_experiments(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    repo = ExperimentRepository(db)
    experiments = await repo.list_all(limit=limit, offset=offset, status=status_filter)
    return {
        "status": "success",
        "count": len(experiments),
        "limit": limit,
        "offset": offset,
        "data": [
            {
                "id": exp.id,
                "name": exp.name,
                "description": exp.description,
                "dataset_hash": exp.dataset_hash,
                "row_count": exp.row_count,
                "status": exp.status,
                "created_at": exp.created_at.isoformat(),
            }
            for exp in experiments
        ],
    }

@router.get("/experiments/{experiment_id}")
async def get_experiment_detail(
    experiment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    repo = ExperimentRepository(db)
    exp = await repo.get_by_id(experiment_id, load_runs=True)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return {
        "status": "success",
        "data": {
            "id": exp.id,
            "name": exp.name,
            "description": exp.description,
            "dataset_hash": exp.dataset_hash,
            "row_count": exp.row_count,
            "status": exp.status,
            "created_at": exp.created_at.isoformat(),
            "meta_info": exp.meta_info,
            "runs": [
                {
                    "id": r.id,
                    "run_type": r.run_type,
                    "status": r.status,
                    "duration_ms": r.duration_ms,
                    "params": r.params_json,
                    "results": r.results_json,
                    "created_at": r.created_at.isoformat(),
                }
                for r in exp.runs
            ],
        },
    }

@router.delete("/experiments/{experiment_id}")
async def delete_experiment(
    experiment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    repo = ExperimentRepository(db)
    audit = AuditRepository(db)
    deleted = await repo.delete(experiment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    await audit.log_action(
        action="DELETE_EXPERIMENT",
        resource=f"/api/experiments/{experiment_id}",
        user_id=current_user.id,
        status_code=200,
    )
    return {"status": "success", "message": f"Experiment {experiment_id} deleted."}

@router.post("/experiments/{experiment_id}/runs", status_code=status.HTTP_201_CREATED)
async def create_pipeline_run(
    experiment_id: str,
    payload: RunCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    exp_repo = ExperimentRepository(db)
    exp = await exp_repo.get_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    run_repo = PipelineRunRepository(db)
    run = await run_repo.create(
        experiment_id=experiment_id,
        run_type=payload.run_type,
        status=payload.status,
        params=payload.params,
        results=payload.results,
        duration_ms=payload.duration_ms,
    )
    return {
        "status": "success",
        "data": {
            "id": run.id,
            "experiment_id": run.experiment_id,
            "run_type": run.run_type,
            "status": run.status,
            "duration_ms": run.duration_ms,
            "created_at": run.created_at.isoformat(),
        },
    }

@router.get("/experiments/{experiment_id}/runs")
async def list_runs_for_experiment(
    experiment_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    run_repo = PipelineRunRepository(db)
    runs = await run_repo.list_for_experiment(experiment_id, limit=limit, offset=offset)
    return {
        "status": "success",
        "experiment_id": experiment_id,
        "count": len(runs),
        "data": [
            {
                "id": r.id,
                "run_type": r.run_type,
                "status": r.status,
                "params": r.params_json,
                "results": r.results_json,
                "duration_ms": r.duration_ms,
                "created_at": r.created_at.isoformat(),
            }
            for r in runs
        ],
    }

@router.get("/admin/audit-logs")
async def get_audit_trail(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    audit_repo = AuditRepository(db)
    logs = await audit_repo.list_logs(user_id=user_id, action=action, limit=limit, offset=offset)
    return {
        "status": "success",
        "count": len(logs),
        "data": [
            {
                "id": entry.id,
                "user_id": entry.user_id,
                "action": entry.action,
                "resource": entry.resource,
                "ip_address": entry.ip_address,
                "status_code": entry.status_code,
                "timestamp": entry.timestamp.isoformat(),
                "extra": entry.extra_json,
            }
            for entry in logs
        ],
    }

@router.get("/admin/logs")
async def get_system_logs(
    limit: int = Query(default=50, ge=1, le=200),
    level: Optional[str] = Query(default=None),
    current_user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    records = get_recent_logs(limit=limit, level=level)
    return {
        "status": "success",
        "count": len(records),
        "logs": records,
    }

@router.get("/metrics")
async def metrics_endpoint() -> Response:
    data, content_type = export_metrics()
    return Response(content=data, media_type=content_type)
