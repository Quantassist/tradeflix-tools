from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Float,
    Text,
    Boolean,
    JSON,
    Enum,
)
from sqlalchemy.sql import func
from database import Base
import enum


class EventType(str, enum.Enum):
    """Event type categories for seasonal events"""

    # Indian festivals (gold-demand driven)
    FESTIVAL_INDIA = "festival_india"
    # Indian trading/bank holidays
    HOLIDAY_TRADING_INDIA = "holiday_trading_india"
    # US/Global trading holidays
    HOLIDAY_TRADING_US = "holiday_trading_us"
    HOLIDAY_TRADING_GLOBAL = "holiday_trading_global"
    # Elections
    ELECTION_INDIA = "election_india"
    ELECTION_GLOBAL = "election_global"
    # Budget and policy events
    BUDGET_INDIA = "budget_india"
    POLICY_EVENT = "policy_event"
    # Central bank and macro events
    FOMC_MEETING = "fomc_meeting"
    MACRO_RELEASE = "macro_release"  # CPI, NFP, GDP, etc.
    # Custom/other
    CUSTOM = "custom"


class RecurrenceType(str, enum.Enum):
    """How the event recurs"""

    NONE = "none"  # One-time event
    ANNUAL = "annual"  # Same date every year
    LUNAR = "lunar"  # Based on lunar calendar (needs yearly date updates)
    QUARTERLY = "quarterly"  # Every quarter
    MONTHLY = "monthly"  # Every month
    WEEKLY = "weekly"  # Every week (e.g., FOMC)


class SeasonalEvent(Base):
    """
    Seasonal events and festivals that impact gold/silver prices.

    Event Types:
    - festival_india: Diwali, Dhanteras, Akshaya Tritiya, Navratri, etc.
    - holiday_trading_india: MCX/RBI holidays
    - holiday_trading_us: COMEX/NYSE holidays
    - holiday_trading_global: Major global holidays
    - election_india: Lok Sabha, state elections
    - election_global: US elections, etc.
    - budget_india: Union Budget
    - policy_event: Import duty changes, major policy announcements
    - fomc_meeting: Federal Reserve meetings
    - macro_release: CPI, NFP, GDP releases
    - custom: User-defined events
    """

    __tablename__ = "seasonal_events"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)

    # Basic information
    name = Column(String(200), nullable=False, index=True)
    event_type = Column(
        Enum(
            EventType,
            name="event_type_enum",
            create_constraint=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    description = Column(Text)
    country = Column(String(50), default="India", index=True)
    region = Column(String(100))  # For regional events (e.g., state elections)

    # Date information
    # For fixed-date events: use start_date directly
    # For recurring events: start_date is the next occurrence
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date)  # For multi-day events

    # Recurrence settings
    recurrence = Column(
        Enum(
            RecurrenceType,
            name="recurrence_type_enum",
            create_constraint=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=RecurrenceType.NONE,
    )
    # For annual events: month and day for recurrence calculation
    recurrence_month = Column(Integer)  # 1-12
    recurrence_day = Column(Integer)  # 1-31
    is_lunar_based = Column(Boolean, default=False)  # Needs manual date updates yearly

    # Time information (for intraday events like macro releases)
    event_time = Column(String(10))  # HH:MM format in UTC
    timezone = Column(String(50), default="Asia/Kolkata")

    # Duration
    duration_days = Column(Integer, default=1)

    # Impact analysis (historical)
    avg_price_change_percent = Column(Float)  # Historical average price change
    win_rate = Column(Float)  # % of years with positive returns
    volatility_multiplier = Column(Float)  # How much volatility increases
    volume_change_percent = Column(Float)  # Volume change during event

    # Trading window (days before/after to analyze)
    analysis_window_before = Column(
        Integer, default=7
    )  # Days before event to start analysis
    analysis_window_after = Column(
        Integer, default=7
    )  # Days after event to end analysis

    # Commodities affected
    affects_gold = Column(Boolean, default=True)
    affects_silver = Column(Boolean, default=True)

    # Event-specific metadata (JSON for flexibility)
    # Examples:
    # - For FOMC: {"rate_decision": true, "press_conference": true}
    # - For elections: {"election_type": "lok_sabha", "seats": 543}
    # - For macro: {"indicator": "CPI", "previous": 3.2, "forecast": 3.1}
    event_metadata = Column(JSON, default={})

    # Data source tracking
    data_source = Column(String(100))  # Where the event data came from
    source_url = Column(String(500))  # Reference URL

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Admin verified

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100))  # Admin who created

    def __repr__(self):
        return f"<SeasonalEvent(name='{self.name}', type='{self.event_type}', date={self.start_date})>"


class SeasonalAnalysis(Base):
    """Historical analysis of price behavior around seasonal events"""

    __tablename__ = "seasonal_analysis"
    __table_args__ = {"schema": "tradeflix_tools"}

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    event_date = Column(Date, nullable=False)

    # Price data
    price_before_7d = Column(Float)
    price_before_3d = Column(Float)
    price_on_event = Column(Float)
    price_after_3d = Column(Float)
    price_after_7d = Column(Float)

    # Performance metrics
    change_before_7d = Column(Float)  # % change 7 days before
    change_after_7d = Column(Float)  # % change 7 days after
    max_gain = Column(Float)
    max_loss = Column(Float)

    # Volume data
    avg_volume_before = Column(Float)
    avg_volume_during = Column(Float)
    volume_change_percent = Column(Float)

    def __repr__(self):
        return f"<SeasonalAnalysis(event_id={self.event_id}, symbol='{self.symbol}', year={self.year})>"
