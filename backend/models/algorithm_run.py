from datetime import datetime
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class AlgorithmRun(Base):
    __tablename__ = "algorithm_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    algorithm_name: Mapped[str] = mapped_column(String(50), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=True)
    duration_min: Mapped[float] = mapped_column(Float, nullable=True)
    nodes_explored: Mapped[int] = mapped_column(Integer, nullable=True)
    runtime_ms: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    route = relationship("Route", back_populates="algorithm_runs")
