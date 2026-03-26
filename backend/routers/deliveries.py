"""
backend/routers/deliveries.py — Delivery CRUD endpoints.
GET    /deliveries          — list all deliveries
POST   /deliveries          — create a delivery
PUT    /deliveries/{id}     — update a delivery
DELETE /deliveries/{id}     — delete a delivery
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.delivery import Delivery
from models.user import User
from schemas.delivery import DeliveryCreate, DeliveryRead, DeliveryUpdate

router = APIRouter()


# ── GET /deliveries ───────────────────────────────────────────────────────────
@router.get("", response_model=list[DeliveryRead])
async def list_deliveries(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).order_by(Delivery.created_at.desc()))
    return result.scalars().all()


# ── POST /deliveries ──────────────────────────────────────────────────────────
@router.post("", response_model=DeliveryRead, status_code=status.HTTP_201_CREATED)
async def create_delivery(
    payload: DeliveryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    delivery = Delivery(**payload.model_dump())
    db.add(delivery)
    await db.flush()
    await db.refresh(delivery)
    return delivery


# ── PUT /deliveries/{id} ──────────────────────────────────────────────────────
@router.put("/{delivery_id}", response_model=DeliveryRead)
async def update_delivery(
    delivery_id: int,
    payload: DeliveryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(delivery, field, value)

    await db.flush()
    await db.refresh(delivery)
    return delivery


# ── DELETE /deliveries/{id} ───────────────────────────────────────────────────
@router.delete("/{delivery_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_delivery(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    await db.delete(delivery)
