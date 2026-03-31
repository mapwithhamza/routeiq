"""
backend/routers/transactions.py
GET /transactions         — list all transactions
GET /transactions/revenue — revenue analytics summary
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.transaction import Transaction, TransactionStatus
from models.user import User
from schemas.transaction import TransactionRead, RevenueAnalytics

router = APIRouter()


@router.get("", response_model=list[TransactionRead])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()


@router.get("/revenue", response_model=RevenueAnalytics)
async def get_revenue(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)

    # Total revenue
    total_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.status == TransactionStatus.completed
        )
    )
    total_revenue = total_result.scalar() or 0.0

    # Today revenue
    today_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.status == TransactionStatus.completed,
            Transaction.created_at >= today_start,
        )
    )
    today_revenue = today_result.scalar() or 0.0

    # This week revenue
    week_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.status == TransactionStatus.completed,
            Transaction.created_at >= week_start,
        )
    )
    week_revenue = week_result.scalar() or 0.0

    # This month revenue
    month_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.status == TransactionStatus.completed,
            Transaction.created_at >= month_start,
        )
    )
    month_revenue = month_result.scalar() or 0.0

    # Count transactions
    total_count = await db.execute(select(func.count(Transaction.id)))
    completed_count = await db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.status == TransactionStatus.completed
        )
    )

    return RevenueAnalytics(
        total_revenue=total_revenue,
        today_revenue=today_revenue,
        this_week_revenue=week_revenue,
        this_month_revenue=month_revenue,
        total_transactions=total_count.scalar() or 0,
        completed_transactions=completed_count.scalar() or 0,
    )
