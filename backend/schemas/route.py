from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from models.route import RouteStatus


class RouteStopRead(BaseModel):
    id: int
    route_id: int
    delivery_id: int
    sequence: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RouteCreate(BaseModel):
    name: str
    rider_id: Optional[int] = None


class RouteRead(BaseModel):
    id: int
    name: str
    rider_id: Optional[int]
    status: RouteStatus
    created_at: datetime
    stops: List[RouteStopRead] = []
    waypoints_json: Optional[str] = None
    algorithm_results_json: Optional[str] = None

    model_config = {"from_attributes": True}


class RouteSummary(BaseModel):
    id: int
    name: str
    rider_id: Optional[int]
    status: RouteStatus
    created_at: datetime
    waypoints_json: Optional[str] = None
    algorithm_results_json: Optional[str] = None

    model_config = {"from_attributes": True}
