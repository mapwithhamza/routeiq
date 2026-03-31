from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.transaction import TransactionStatus


class TransactionRead(BaseModel):
    id: int
    delivery_id: int
    rider_id: Optional[int]
    amount: float
    status: TransactionStatus
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RevenueAnalytics(BaseModel):
    total_revenue: float
    today_revenue: float
    this_week_revenue: float
    this_month_revenue: float
    total_transactions: int
    completed_transactions: int
