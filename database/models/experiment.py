from __future__ import annotations
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from database.models.run import PipelineRun

class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dataset_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    meta_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    runs: Mapped[List["PipelineRun"]] = relationship(
        "PipelineRun",
        back_populates="experiment",
        cascade="all, delete-orphan",
    )

