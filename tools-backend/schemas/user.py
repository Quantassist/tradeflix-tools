from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=100)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    default_symbol: Optional[str] = None
    default_timeframe: Optional[str] = None
    timezone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    tier: str
    is_active: bool
    is_verified: bool
    telegram_chat_id: Optional[str] = None
    default_symbol: str
    default_timeframe: str
    timezone: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
