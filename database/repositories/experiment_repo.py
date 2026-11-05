from __future__ import annotations
from typing import Any, Dict, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.experiment import Experiment

class ExperimentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        name: str,
        description: Optional[str] = None,
        dataset_hash: Optional[str] = None,
        row_count: int = 0,
        meta_info: Optional[Dict[str, Any]] = None,
    ) -> Experiment:
        exp = Experiment(
            name=name,
            description=description,
            dataset_hash=dataset_hash,
            row_count=row_count,
            meta_info=meta_info,
        )
        self.session.add(exp)
        await self.session.commit()
        await self.session.refresh(exp)
        return exp

    async def get_by_id(self, experiment_id: str, load_runs: bool = False) -> Optional[Experiment]:
        query = select(Experiment).where(Experiment.id == experiment_id)
        if load_runs:
            query = query.options(selectinload(Experiment.runs))
        result = await self.session.execute(query)
        return result.scalars().first()

    async def list_all(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> List[Experiment]:
        query = select(Experiment)
        if status:
            query = query.where(Experiment.status == status)
        query = query.order_by(desc(Experiment.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def delete(self, experiment_id: str) -> bool:
        exp = await self.get_by_id(experiment_id)
        if exp:
            await self.session.delete(exp)
            await self.session.commit()
            return True
        return False
