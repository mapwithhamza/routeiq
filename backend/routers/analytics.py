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
    # Delivery counts
    total_deliveries = await db.scalar(select(func.count()).select_from(Delivery)) or 0
    pending = await db.scalar(select(func.count()).select_from(Delivery).where(Delivery.status == DeliveryStatus.pending)) or 0
    in_transit = await db.scalar(select(func.count()).select_from(Delivery).where(Delivery.status == DeliveryStatus.in_transit)) or 0
    delivered = await db.scalar(select(func.count()).select_from(Delivery).where(Delivery.status == DeliveryStatus.delivered)) or 0
    failed = await db.scalar(select(func.count()).select_from(Delivery).where(Delivery.status == DeliveryStatus.failed)) or 0

    # Rider counts
    total_riders = await db.scalar(select(func.count()).select_from(Rider)) or 0
    active_riders = await db.scalar(select(func.count()).select_from(Rider).where(Rider.status == RiderStatus.available)) or 0

    # Algorithm run stats
    routes_optimized = await db.scalar(select(func.count()).select_from(AlgorithmRun)) or 0
    avg_distance = await db.scalar(select(func.avg(AlgorithmRun.distance_km))) or 0.0

    return {
        "total_deliveries": total_deliveries,
        "pending": pending,
        "in_transit": in_transit,
        "delivered": delivered,
        "failed": failed,
        "total_riders": total_riders,
        "active_riders": active_riders,
        "routes_optimized": routes_optimized,
        "avg_distance": round(float(avg_distance), 2)
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
