from datetime import datetime
from pydantic import BaseModel, EmailStr
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

    model_config = {"from_attributes": True}
