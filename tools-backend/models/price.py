from sqlalchemy import Column, Integer, String, Numeric, BigInteger, DateTime, Index
from sqlalchemy.sql import func
from datetime import datetime

from database import Base


class HistoricalPrice(Base):
    """
    Time-series table for historical OHLCV data.
    Will be converted to TimescaleDB hypertable for optimization.
    """

    __tablename__ = "historical_prices"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Instrument details
    symbol = Column(String(20), nullable=False, index=True)  # GOLD, SILVER, CRUDE, etc.
    exchange = Column(String(10), nullable=False)  # MCX, COMEX, NSE
    contract_month = Column(String(10))  # FEB2025, MAR2025, etc.

    # OHLCV data
    open = Column(Numeric(12, 2), nullable=False)
    high = Column(Numeric(12, 2), nullable=False)
    low = Column(Numeric(12, 2), nullable=False)
    close = Column(Numeric(12, 2), nullable=False)
    volume = Column(BigInteger, default=0)

    # Metadata
    timeframe = Column(String(10), nullable=False)  # 1m, 5m, 15m, 1h, 1D, 1W
    source = Column(String(50))  # Data source identifier

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Composite index for efficient queries
    __table_args__ = (
        Index("idx_symbol_exchange_timestamp", "symbol", "exchange", "timestamp"),
        Index("idx_symbol_timeframe_timestamp", "symbol", "timeframe", "timestamp"),
        {"schema": "tradeflix_tools"},
    )

    def __repr__(self):
        return f"<HistoricalPrice({self.symbol} {self.exchange} {self.timestamp} C:{self.close})>"


# SQL to convert to TimescaleDB hypertable (run after table creation):
# SELECT create_hypertable('historical_prices', 'timestamp', chunk_time_interval => INTERVAL '1 day');
