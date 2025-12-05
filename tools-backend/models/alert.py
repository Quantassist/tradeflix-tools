from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    JSON,
    DateTime,
    ForeignKey,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from database import Base


class AlertType(str, enum.Enum):
    PIVOT_PROXIMITY = "pivot_proximity"
    PIVOT_BREAKOUT = "pivot_breakout"
    ARBITRAGE_THRESHOLD = "arbitrage_threshold"
    SEASONAL_EVENT = "seasonal_event"
    CORRELATION_DIVERGENCE = "correlation_divergence"
    COT_EXTREME = "cot_extreme"
    PRICE_LEVEL = "price_level"
    CUSTOM = "custom"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    TRIGGERED = "triggered"
    EXPIRED = "expired"


class DeliveryChannel(str, enum.Enum):
    EMAIL = "email"
    TELEGRAM = "telegram"
    IN_APP = "in_app"


class AlertRule(Base):
    """User-defined alert rules"""

    __tablename__ = "alert_rules"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("tradeflix_tools.users.id"), nullable=False, index=True
    )

    # Alert details
    name = Column(String(200), nullable=False)
    description = Column(Text)
    alert_type = Column(Enum(AlertType), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE)

    # Target instrument
    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10))

    # Conditions (JSON format)
    conditions = Column(JSON, nullable=False)
    # Example: {"indicator": "price", "operator": ">", "value": 73000}
    # Example: {"type": "pivot_proximity", "level": "R1", "distance": 50}

    # Delivery settings
    delivery_channels = Column(JSON, nullable=False)  # ["email", "telegram"]
    quiet_hours_start = Column(String(5))  # "22:00"
    quiet_hours_end = Column(String(5))  # "08:00"

    # Trigger settings
    cooldown_minutes = Column(Integer, default=60)  # Don't re-trigger for X minutes
    max_triggers = Column(Integer)  # Auto-disable after X triggers
    trigger_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime(timezone=True))

    # Expiry
    expires_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AlertRule(id={self.id}, name={self.name}, type={self.alert_type})>"


class Alert(Base):
    """Triggered alerts log"""

    __tablename__ = "alerts"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(
        Integer,
        ForeignKey("tradeflix_tools.alert_rules.id"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer, ForeignKey("tradeflix_tools.users.id"), nullable=False, index=True
    )

    # Alert content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)  # Additional context data

    # Delivery status
    delivered_via = Column(JSON)  # ["email", "telegram"]
    delivery_status = Column(JSON)  # {"email": "sent", "telegram": "failed"}

    # User interaction
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True))

    triggered_at = Column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships
    rule = relationship("AlertRule", back_populates="alerts")

    def __repr__(self):
        return f"<Alert(id={self.id}, title={self.title}, triggered_at={self.triggered_at})>"
