from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.delivery import DeliveryPriority, DeliveryStatus


class DeliveryCreate(BaseModel):
    title: str
    address: str
    lat: float
    lon: float
    priority: DeliveryPriority = DeliveryPriority.normal
    rider_id: Optional[int] = None
    delivery_fee: float = 500.0
    notes: Optional[str] = None


class DeliveryUpdate(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    priority: Optional[DeliveryPriority] = None
    status: Optional[DeliveryStatus] = None
    rider_id: Optional[int] = None
    delivery_fee: Optional[float] = None
    notes: Optional[str] = None


class DeliveryRead(BaseModel):
    id: int
    title: str
    address: str
    lat: float
    lon: float
    priority: DeliveryPriority
    status: DeliveryStatus
    rider_id: Optional[int]
    delivery_fee: float
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
