from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    JSON,
    DateTime,
    ForeignKey,
    Numeric,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from database import Base


class Strategy(Base):
    """User-created trading strategies"""

    __tablename__ = "strategies"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("tradeflix_tools.users.id"), nullable=False, index=True
    )

    # Strategy details
    name = Column(String(200), nullable=False)
    description = Column(Text)
    symbol = Column(String(20), nullable=False)
    timeframe = Column(String(10), nullable=False)

    # Strategy rules (JSON format)
    entry_rules = Column(JSON, nullable=False)
    exit_rules = Column(JSON, nullable=False)
    filters = Column(JSON)  # Additional filters (time-based, volume, etc.)

    # Risk management
    stop_loss = Column(JSON)  # {"type": "percentage", "value": 2}
    take_profit = Column(JSON)  # {"type": "risk_reward", "value": 3}
    position_size = Column(JSON)  # {"type": "fixed", "value": 1}

    # Metadata
    is_public = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    tags = Column(JSON)  # ["breakout", "rsi", "intraday"]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    backtests = relationship(
        "Backtest", back_populates="strategy", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Strategy(id={self.id}, name={self.name}, symbol={self.symbol})>"


class Backtest(Base):
    """Backtest results for strategies"""

    __tablename__ = "backtests"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(
        Integer, ForeignKey("tradeflix_tools.strategies.id"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("tradeflix_tools.users.id"), nullable=False, index=True
    )

    # Backtest parameters
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    initial_capital = Column(Numeric(12, 2), nullable=False)

    # Cost assumptions
    commission_per_trade = Column(Numeric(8, 2), default=0)
    slippage_percent = Column(Numeric(5, 2), default=0)

    # Performance metrics
    total_trades = Column(Integer)
    winning_trades = Column(Integer)
    losing_trades = Column(Integer)
    win_rate = Column(Numeric(5, 2))  # Percentage

    profit_factor = Column(Numeric(8, 2))
    max_drawdown = Column(Numeric(8, 2))
    max_drawdown_percent = Column(Numeric(5, 2))
    sharpe_ratio = Column(Numeric(6, 3))

    total_return = Column(Numeric(12, 2))
    total_return_percent = Column(Numeric(8, 2))
    cagr = Column(Numeric(6, 2))

    avg_win = Column(Numeric(10, 2))
    avg_loss = Column(Numeric(10, 2))
    largest_win = Column(Numeric(10, 2))
    largest_loss = Column(Numeric(10, 2))

    longest_win_streak = Column(Integer)
    longest_lose_streak = Column(Integer)

    # Detailed results (stored as JSON)
    equity_curve = Column(JSON)  # [{date, equity, drawdown}, ...]
    trades = Column(JSON)  # [{entry_date, exit_date, pnl, ...}, ...]
    monthly_returns = Column(JSON)  # {2024-01: 2.5, 2024-02: -1.2, ...}

    # Execution info
    execution_time_seconds = Column(Numeric(8, 2))
    status = Column(
        String(20), default="completed"
    )  # pending, running, completed, failed
    error_message = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    strategy = relationship("Strategy", back_populates="backtests")

    def __repr__(self):
        return f"<Backtest(id={self.id}, strategy_id={self.strategy_id}, return={self.total_return_percent}%)>"
