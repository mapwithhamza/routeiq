"""
backend/routers/analytics.py — Analytics endpoints.
GET /analytics/summary    — delivery/rider counts by status
GET /analytics/algorithms — recent algorithm run results
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.algorithm_run import AlgorithmRun
from models.delivery import Delivery, DeliveryStatus
from models.rider import Rider, RiderStatus
from models.user import User
from schemas.algorithm_run import AlgorithmRunRead

router = APIRouter()


# ── GET /analytics/summary ────────────────────────────────────────────────────
@router.get("/summary")
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Delivery counts by status
    delivery_counts: dict[str, int] = {}
    for status_val in DeliveryStatus:
        result = await db.execute(
            select(func.count()).select_from(Delivery).where(Delivery.status == status_val)
        )
        delivery_counts[status_val.value] = result.scalar_one()

    total_deliveries = sum(delivery_counts.values())

    # Rider counts by status
    rider_counts: dict[str, int] = {}
    for status_val in RiderStatus:
        result = await db.execute(
            select(func.count()).select_from(Rider).where(Rider.status == status_val)
        )
        rider_counts[status_val.value] = result.scalar_one()

    total_riders = sum(rider_counts.values())

    return {
        "total_deliveries": total_deliveries,
        "pending": delivery_counts.get(DeliveryStatus.pending.value, 0),
        "in_transit": delivery_counts.get(DeliveryStatus.in_transit.value, 0),
        "delivered": delivery_counts.get(DeliveryStatus.delivered.value, 0),
        "failed": delivery_counts.get(DeliveryStatus.failed.value, 0),
        "total_riders": total_riders,
        "active_riders": rider_counts.get(RiderStatus.on_route.value, 0),
    }


# ── GET /analytics/algorithms ─────────────────────────────────────────────────
@router.get("/algorithms", response_model=list[AlgorithmRunRead])
async def analytics_algorithms(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlgorithmRun)
        .order_by(AlgorithmRun.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
