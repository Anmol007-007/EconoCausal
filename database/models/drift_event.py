from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import Boolean, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base

class DriftEvent(Base):
    __tablename__ = "drift_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    feature: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    psi_score: Mapped[float] = mapped_column(Float, default=0.0)
    ks_stat: Mapped[float] = mapped_column(Float, default=0.0)
    is_drift: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
