"""
Arbitrage models for database storage
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ArbitrageHistory(Base):
    """Historical arbitrage premium/discount data"""

    __tablename__ = "arbitrage_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    recorded_at = Column(
        DateTime(timezone=True), nullable=False, default=func.now(), index=True
    )

    # Price data
    comex_price_usd = Column(Numeric(12, 4), nullable=False)
    mcx_price_inr = Column(Numeric(12, 4), nullable=False)
    usdinr_rate = Column(Numeric(10, 4), nullable=False)
    fair_value_inr = Column(Numeric(12, 4), nullable=False)

    # Arbitrage metrics
    premium = Column(Numeric(12, 4), nullable=False)
    premium_percent = Column(Numeric(8, 4), nullable=False)
    signal = Column(String(20), nullable=False)

    # Statistical context
    z_score = Column(Numeric(8, 4), nullable=True)
    percentile = Column(Numeric(6, 2), nullable=True)

    # Data source info
    comex_source = Column(String(50), nullable=True)
    mcx_source = Column(String(50), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=func.now())


class ArbitrageAlert(Base):
    """User-defined arbitrage alert configurations"""

    __tablename__ = "arbitrage_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        String, ForeignKey("public.User.id", ondelete="CASCADE"), nullable=True
    )

    # Alert configuration
    symbol = Column(String(20), nullable=False, index=True)
    alert_type = Column(
        String(30), nullable=False
    )  # premium_above, premium_below, signal_change, z_score_extreme
    threshold = Column(Numeric(8, 4), nullable=False)

    # Notification settings
    notification_channel = Column(String(20), default="email")  # telegram, email, both
    is_active = Column(Boolean, default=True, index=True)

    # Tracking
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    trigger_count = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
