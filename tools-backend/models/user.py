from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from database import Base


class UserTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)

    # Subscription
    tier = Column(Enum(UserTier), default=UserTier.FREE, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Telegram integration
    telegram_chat_id = Column(String, unique=True, nullable=True)
    telegram_username = Column(String, nullable=True)

    # Preferences
    default_symbol = Column(String, default="GOLD")
    default_timeframe = Column(String, default="1D")
    timezone = Column(String, default="Asia/Kolkata")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.tier})>"
