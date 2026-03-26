from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlgorithmRunRead(BaseModel):
    id: int
    route_id: int
    algorithm_name: str
    distance_km: Optional[float]
    duration_min: Optional[float]
    nodes_explored: Optional[int]
    runtime_ms: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}
