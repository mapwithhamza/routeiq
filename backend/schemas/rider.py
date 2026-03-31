from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.rider import VehicleType, RiderStatus


class RiderCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    vehicle_type: VehicleType = VehicleType.bike
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None


class RiderUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    status: Optional[RiderStatus] = None
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None


class RiderRead(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str] = None
    vehicle_type: VehicleType
    status: RiderStatus
    current_lat: Optional[float]
    current_lon: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}
