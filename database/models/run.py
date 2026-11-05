from __future__ import annotations
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from database.models.experiment import Experiment

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id: Mapped[str] = mapped_column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), index=True)
    run_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="completed", index=True)
    params_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    results_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    experiment: Mapped["Experiment"] = relationship("Experiment", back_populates="runs")

