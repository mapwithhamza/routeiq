"""
backend/models/transaction.py — Transaction model.
Auto-created when a delivery status changes to 'delivered'.
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Enum as SAEnum, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class TransactionStatus(str, enum.Enum):
    completed = "completed"
    pending = "pending"
    failed = "failed"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    delivery_id: Mapped[int] = mapped_column(ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    rider_id: Mapped[Optional[int]] = mapped_column(ForeignKey("riders.id", ondelete="SET NULL"), nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=500.0)
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), nullable=False, default=TransactionStatus.completed)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    delivery = relationship("Delivery", backref="transactions", lazy="selectin")
    rider = relationship("Rider", backref="transactions", lazy="selectin")
