"""
backend/routers/auth.py — Auth endpoints.
POST /auth/register  — create account
POST /auth/login     — verify credentials, set httpOnly cookie
POST /auth/logout    — clear cookie
GET  /auth/me        — return current user (protected)
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from config import settings
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserRead

router = APIRouter()

_COOKIE_NAME = "access_token"


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_HOURS * 3600,
        secure=False,  # Set True in production (HTTPS)
    )


# ── POST /auth/register ───────────────────────────────────────────────────────
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


# ── POST /auth/login ──────────────────────────────────────────────────────────
@router.post("/login", response_model=UserRead)
async def login(payload: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=settings.JWT_EXPIRE_HOURS),
    )
    _set_auth_cookie(response, token)
    return user


# ── POST /auth/logout ─────────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(key=_COOKIE_NAME, samesite="lax")


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
