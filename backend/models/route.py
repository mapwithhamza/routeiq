import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum as SAEnum, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class RouteStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    rider_id: Mapped[Optional[int]] = mapped_column(ForeignKey("riders.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[RouteStatus] = mapped_column(SAEnum(RouteStatus), nullable=False, default=RouteStatus.draft)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    waypoints_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    algorithm_results_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    rider = relationship("Rider", backref="routes", lazy="selectin")
    stops = relationship("RouteStop", back_populates="route", lazy="selectin", order_by="RouteStop.sequence")
    algorithm_runs = relationship("AlgorithmRun", back_populates="route", lazy="selectin")
