from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.delivery import DeliveryPriority, DeliveryStatus


class DeliveryCreate(BaseModel):
    title: str
    address: str
    lat: float
    lon: float
    priority: DeliveryPriority = DeliveryPriority.medium
    rider_id: Optional[int] = None


class DeliveryUpdate(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    priority: Optional[DeliveryPriority] = None
    status: Optional[DeliveryStatus] = None
    rider_id: Optional[int] = None


class DeliveryRead(BaseModel):
    id: int
    title: str
    address: str
    lat: float
    lon: float
    priority: DeliveryPriority
    status: DeliveryStatus
    rider_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
