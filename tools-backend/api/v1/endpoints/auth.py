from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from config import settings

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/{settings.api_version}/auth/login")


@router.post("/register")
async def register(db: Session = Depends(get_db)):
    """Register new user"""
    return {"message": "Registration endpoint - to be implemented"}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    return {"access_token": "token", "token_type": "bearer"}


@router.post("/refresh")
async def refresh_token():
    """Refresh access token"""
    return {"access_token": "new_token"}
