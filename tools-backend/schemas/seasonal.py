from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class EventTypeEnum(str, Enum):
    """Event type categories"""

    FESTIVAL_INDIA = "festival_india"
    HOLIDAY_TRADING_INDIA = "holiday_trading_india"
    HOLIDAY_TRADING_US = "holiday_trading_us"
    HOLIDAY_TRADING_GLOBAL = "holiday_trading_global"
    ELECTION_INDIA = "election_india"
    ELECTION_GLOBAL = "election_global"
    BUDGET_INDIA = "budget_india"
    POLICY_EVENT = "policy_event"
    FOMC_MEETING = "fomc_meeting"
    MACRO_RELEASE = "macro_release"
    CUSTOM = "custom"


class RecurrenceTypeEnum(str, Enum):
    """Recurrence type"""

    NONE = "none"
    ANNUAL = "annual"
    LUNAR = "lunar"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"
    WEEKLY = "weekly"


class SeasonalEventCreate(BaseModel):
    """Schema for creating a new seasonal event"""

    name: str = Field(..., min_length=1, max_length=200)
    event_type: EventTypeEnum
    description: Optional[str] = None
    country: str = Field(default="India", max_length=50)
    region: Optional[str] = Field(default=None, max_length=100)

    # Date information
    start_date: date
    end_date: Optional[date] = None

    # Recurrence
    recurrence: RecurrenceTypeEnum = RecurrenceTypeEnum.NONE
    recurrence_month: Optional[int] = Field(default=None, ge=1, le=12)
    recurrence_day: Optional[int] = Field(default=None, ge=1, le=31)
    is_lunar_based: bool = False

    # Time
    event_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    timezone: str = "Asia/Kolkata"
    duration_days: int = Field(default=1, ge=1)

    # Impact metrics (optional, can be updated later)
    avg_price_change_percent: Optional[float] = None
    win_rate: Optional[float] = Field(default=None, ge=0, le=100)
    volatility_multiplier: Optional[float] = None
    volume_change_percent: Optional[float] = None

    # Analysis window
    analysis_window_before: int = Field(default=7, ge=0, le=30)
    analysis_window_after: int = Field(default=7, ge=0, le=30)

    # Commodities
    affects_gold: bool = True
    affects_silver: bool = True

    # Metadata
    event_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data_source: Optional[str] = None
    source_url: Optional[str] = None


class SeasonalEventUpdate(BaseModel):
    """Schema for updating a seasonal event"""

    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    event_type: Optional[EventTypeEnum] = None
    description: Optional[str] = None
    country: Optional[str] = Field(default=None, max_length=50)
    region: Optional[str] = Field(default=None, max_length=100)

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    recurrence: Optional[RecurrenceTypeEnum] = None
    recurrence_month: Optional[int] = Field(default=None, ge=1, le=12)
    recurrence_day: Optional[int] = Field(default=None, ge=1, le=31)
    is_lunar_based: Optional[bool] = None

    event_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    timezone: Optional[str] = None
    duration_days: Optional[int] = Field(default=None, ge=1)

    avg_price_change_percent: Optional[float] = None
    win_rate: Optional[float] = Field(default=None, ge=0, le=100)
    volatility_multiplier: Optional[float] = None
    volume_change_percent: Optional[float] = None

    analysis_window_before: Optional[int] = Field(default=None, ge=0, le=30)
    analysis_window_after: Optional[int] = Field(default=None, ge=0, le=30)

    affects_gold: Optional[bool] = None
    affects_silver: Optional[bool] = None

    event_metadata: Optional[Dict[str, Any]] = None
    data_source: Optional[str] = None
    source_url: Optional[str] = None

    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class SeasonalEventResponse(BaseModel):
    """Schema for seasonal event response"""

    id: int
    name: str
    event_type: str
    description: Optional[str]
    country: str
    region: Optional[str]

    start_date: date
    end_date: Optional[date]

    recurrence: str
    recurrence_month: Optional[int]
    recurrence_day: Optional[int]
    is_lunar_based: bool

    event_time: Optional[str]
    timezone: str
    duration_days: int

    avg_price_change_percent: Optional[float]
    win_rate: Optional[float]
    volatility_multiplier: Optional[float]
    volume_change_percent: Optional[float]

    analysis_window_before: int
    analysis_window_after: int

    affects_gold: bool
    affects_silver: bool

    event_metadata: Optional[Dict[str, Any]]
    data_source: Optional[str]
    source_url: Optional[str]

    is_active: bool
    is_verified: bool

    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    created_by: Optional[str]

    class Config:
        from_attributes = True


class SeasonalEventListResponse(BaseModel):
    """Paginated list of seasonal events"""

    events: List[SeasonalEventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EventImpactMetrics(BaseModel):
    """Historical impact metrics for an event"""

    event_name: str
    event_type: str
    occurrences: int
    avg_price_change_7d_before: float
    avg_price_change_7d_after: float
    avg_max_gain: float
    avg_max_loss: float
    win_rate: float  # Percentage of years with positive returns
    best_year: int
    best_return: float
    worst_year: int
    worst_return: float


class UpcomingEventResponse(BaseModel):
    """Upcoming seasonal event with predictions"""

    event: SeasonalEventResponse
    event_date: date
    days_until: int
    historical_impact: EventImpactMetrics
    recommendation: str
    confidence: str  # high, medium, low


class SeasonalCalendarRequest(BaseModel):
    """Request for seasonal calendar"""

    symbol: str = Field(default="GOLD", description="GOLD or SILVER")
    year: int = Field(ge=2020, le=2030)
    months: Optional[List[int]] = Field(
        default=None, description="Filter by specific months"
    )


class SeasonalCalendarResponse(BaseModel):
    """Calendar of seasonal events with impact"""

    symbol: str
    year: int
    events: List[UpcomingEventResponse]
    total_events: int


class EventPerformanceRequest(BaseModel):
    """Request for event performance analysis"""

    event_id: int
    symbol: str = "GOLD"
    years: int = Field(default=5, ge=1, le=20, description="Number of years to analyze")


class YearlyPerformance(BaseModel):
    """Performance for a specific year"""

    year: int
    event_date: date
    price_change_7d: float
    max_gain: float
    max_loss: float
    volume_change: float


class EventPerformanceResponse(BaseModel):
    """Detailed performance analysis for an event"""

    event: SeasonalEventResponse
    symbol: str
    years_analyzed: int
    yearly_performance: List[YearlyPerformance]
    summary: EventImpactMetrics
    chart_data: dict  # Data for visualization
