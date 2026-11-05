from __future__ import annotations
from typing import Any, Dict, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.run import PipelineRun

class PipelineRunRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        experiment_id: str,
        run_type: str,
        status: str = "completed",
        params: Optional[Dict[str, Any]] = None,
        results: Optional[Dict[str, Any]] = None,
        duration_ms: float = 0.0,
    ) -> PipelineRun:
        run = PipelineRun(
            experiment_id=experiment_id,
            run_type=run_type,
            status=status,
            params_json=params,
            results_json=results,
            duration_ms=duration_ms,
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        return run

    async def get_by_id(self, run_id: str) -> Optional[PipelineRun]:
        query = select(PipelineRun).where(PipelineRun.id == run_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def list_for_experiment(
        self,
        experiment_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[PipelineRun]:
        query = (
            select(PipelineRun)
            .where(PipelineRun.experiment_id == experiment_id)
            .order_by(desc(PipelineRun.created_at))
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

