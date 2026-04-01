from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.dispatcher


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    picture_url: str | None = None
    display_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
