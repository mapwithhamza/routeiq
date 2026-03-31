import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Enum as SAEnum, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class DeliveryPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_transit = "in_transit"
    delivered = "delivered"
    failed = "failed"


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[DeliveryPriority] = mapped_column(SAEnum(DeliveryPriority), nullable=False, default=DeliveryPriority.medium)
    status: Mapped[DeliveryStatus] = mapped_column(SAEnum(DeliveryStatus), nullable=False, default=DeliveryStatus.pending)
    rider_id: Mapped[Optional[int]] = mapped_column(ForeignKey("riders.id", ondelete="SET NULL"), nullable=True, index=True)
    delivery_fee: Mapped[float] = mapped_column(Float, nullable=False, default=500.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    rider = relationship("Rider", backref="deliveries", lazy="selectin")
