import enum
from datetime import datetime
from sqlalchemy import String, Float, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class VehicleType(str, enum.Enum):
    bike = "bike"
    car = "car"
    van = "van"
    truck = "truck"


class RiderStatus(str, enum.Enum):
    available = "available"
    on_route = "on_route"
    offline = "offline"


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(200), nullable=True)
    vehicle_type: Mapped[VehicleType] = mapped_column(SAEnum(VehicleType), nullable=False, default=VehicleType.bike)
    status: Mapped[RiderStatus] = mapped_column(SAEnum(RiderStatus), nullable=False, default=RiderStatus.available)
    current_lat: Mapped[float] = mapped_column(Float, nullable=True)
    current_lon: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
