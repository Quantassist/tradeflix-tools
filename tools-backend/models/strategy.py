"""
Strategy and Backtest models for the visual strategy builder.

These models store user-created trading strategies and their backtest results.
Strategies use a recursive tree structure (LogicGroup/Condition) for entry/exit logic.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Numeric,
    Boolean,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Strategy(Base):
    """
    User-created trading strategies using the visual strategy builder.

    The entry_logic and exit_logic fields store recursive tree structures:
    {
        "id": "uuid",
        "type": "GROUP",
        "operator": "AND" | "OR",
        "children": [
            {
                "id": "uuid",
                "type": "CONDITION",
                "left": {"type": "RSI", "period": 14},
                "comparator": "<",
                "right": {"type": "PRICE", "period": 0},
                "value": 30
            },
            // ... more conditions or nested groups
        ]
    }
    """

    __tablename__ = "strategies"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)

    # Link to betterauth."user" table (text ID)
    # Note: Foreign key constraint exists in DB referencing betterauth.user
    # user_id is nullable for prebuilt strategies (system-defined)
    user_id = Column(
        String(50),
        nullable=True,
        index=True,
    )

    # Strategy details
    name = Column(String(200), nullable=False)
    description = Column(Text)

    # Asset type (metals only: GOLD, SILVER, PLATINUM, PALLADIUM)
    asset = Column(String(20), nullable=False, default="GOLD")

    # Strategy logic (recursive tree structure stored as JSONB)
    entry_logic = Column(JSONB, nullable=False)
    exit_logic = Column(JSONB, nullable=False)

    # Risk management (simple percentages)
    stop_loss_pct = Column(Numeric(5, 2), default=2.0)  # e.g., 2.0 = 2%
    take_profit_pct = Column(Numeric(5, 2), default=5.0)  # e.g., 5.0 = 5%

    # Metadata
    is_public = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    is_prebuilt = Column(Boolean, default=False)  # True for system-defined strategies
    category = Column(String(50))  # seasonal, momentum, trend, pivot, volatility
    tags = Column(JSONB)  # ["momentum", "mean-reversion", "rsi"]

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    backtests = relationship(
        "Backtest",
        back_populates="strategy",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<Strategy(id={self.id}, name={self.name}, asset={self.asset})>"

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "userId": str(self.user_id),
            "name": self.name,
            "description": self.description,
            "asset": self.asset,
            "entryLogic": self.entry_logic,
            "exitLogic": self.exit_logic,
            "stopLossPct": float(self.stop_loss_pct) if self.stop_loss_pct else 2.0,
            "takeProfitPct": float(self.take_profit_pct)
            if self.take_profit_pct
            else 5.0,
            "isPublic": self.is_public,
            "isFavorite": self.is_favorite,
            "tags": self.tags,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Backtest(Base):
    """
    Backtest results for strategies.

    Stores the results of running a strategy against historical price data,
    including performance metrics, trade history, and equity curve.
    """

    __tablename__ = "backtests"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)

    # Link to strategy (nullable - strategy can be deleted but keep backtest)
    strategy_id = Column(
        Integer,
        ForeignKey("tradeflix_tools.strategies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Link to betterauth."user" table (text ID)
    # Note: Foreign key constraint exists in DB referencing betterauth.user
    # user_id is nullable to allow backtests without logged-in user
    user_id = Column(
        String(50),
        nullable=True,
        index=True,
    )

    # Backtest parameters
    asset = Column(String(20), nullable=False)  # Denormalized for quick access
    initial_capital = Column(Numeric(14, 2), nullable=False)

    # Core performance metrics (stored as decimals, not percentages)
    total_trades = Column(Integer, default=0)
    win_rate = Column(Numeric(5, 4))  # 0.0000 to 1.0000 (e.g., 0.65 = 65%)
    total_return = Column(Numeric(8, 4))  # Decimal (e.g., 0.125 = 12.5%)
    max_drawdown = Column(Numeric(8, 4))  # Decimal (e.g., -0.08 = -8%)
    sharpe_ratio = Column(Numeric(6, 3))  # e.g., 1.450
    final_equity = Column(Numeric(14, 2))  # Final portfolio value

    # Detailed results (stored as JSONB for efficient querying)
    trades = Column(JSONB)  # Array of trade objects
    equity_curve = Column(JSONB)  # Array of {date, equity} objects

    # Execution info
    execution_time_ms = Column(Integer)  # Milliseconds
    status = Column(
        String(20), default="completed"
    )  # pending, running, completed, failed
    error_message = Column(Text)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    strategy = relationship("Strategy", back_populates="backtests")

    def __repr__(self):
        return f"<Backtest(id={self.id}, strategy_id={self.strategy_id}, return={self.total_return})>"

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "strategyId": self.strategy_id,
            "userId": str(self.user_id),
            "asset": self.asset,
            "initialCapital": float(self.initial_capital)
            if self.initial_capital
            else 0,
            "finalEquity": float(self.final_equity) if self.final_equity else 0,
            "metrics": {
                "totalTrades": self.total_trades or 0,
                "winRate": float(self.win_rate) if self.win_rate else 0,
                "totalReturn": float(self.total_return) if self.total_return else 0,
                "maxDrawdown": float(self.max_drawdown) if self.max_drawdown else 0,
                "sharpeRatio": float(self.sharpe_ratio) if self.sharpe_ratio else 0,
            },
            "trades": self.trades or [],
            "equityCurve": self.equity_curve or [],
            "executionTimeMs": self.execution_time_ms,
            "status": self.status,
            "errorMessage": self.error_message,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
