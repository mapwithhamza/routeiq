"""
backend/routers/riders.py — Rider CRUD endpoints.
GET  /riders        — list all riders
POST /riders        — create a rider
PUT  /riders/{id}   — update a rider
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.rider import Rider
from models.user import User
from schemas.rider import RiderCreate, RiderRead, RiderUpdate

router = APIRouter()


# ── GET /riders ───────────────────────────────────────────────────────────────
@router.get("", response_model=list[RiderRead])
async def list_riders(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).order_by(Rider.name))
    return result.scalars().all()


# ── POST /riders ──────────────────────────────────────────────────────────────
@router.post("", response_model=RiderRead, status_code=status.HTTP_201_CREATED)
async def create_rider(
    payload: RiderCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rider = Rider(**payload.model_dump())
    db.add(rider)
    await db.flush()
    await db.refresh(rider)
    return rider


# ── PUT /riders/{id} ─────────────────────────────────────────────────────────
@router.put("/{rider_id}", response_model=RiderRead)
async def update_rider(
    rider_id: int,
    payload: RiderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Rider).where(Rider.id == rider_id))
    rider = result.scalar_one_or_none()
    if not rider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rider, field, value)

    await db.flush()
    await db.refresh(rider)
    return rider
