from sqlalchemy import String, Boolean, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class RoadCondition(Base):
    __tablename__ = "road_conditions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_node: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    to_node: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    weight_multiplier: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
