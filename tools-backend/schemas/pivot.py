from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class OHLCInput(BaseModel):
    """Input for pivot calculation"""

    high: float = Field(gt=0, description="High price")
    low: float = Field(gt=0, description="Low price")
    close: float = Field(gt=0, description="Close price")
    date: Optional[date] = None


class CPRLevels(BaseModel):
    """Central Pivot Range levels"""

    pivot: float
    bc: float  # Bottom Central
    tc: float  # Top Central
    width: float
    width_percent: float
    classification: str  # "narrow" or "wide"


class FloorPivotLevels(BaseModel):
    """Floor pivot points"""

    pivot: float
    r1: float
    r2: float
    r3: float
    s1: float
    s2: float
    s3: float


class FibonacciLevels(BaseModel):
    """Fibonacci retracement and extension levels"""

    # Retracement levels
    level_0: float
    level_236: float
    level_382: float
    level_500: float
    level_618: float
    level_786: float
    level_100: float
    # Extension levels
    ext_1272: Optional[float] = None
    ext_1618: Optional[float] = None
    ext_2000: Optional[float] = None
    ext_2618: Optional[float] = None


class PivotCalculationRequest(BaseModel):
    symbol: str = Field(description="Trading symbol (GOLD, SILVER, etc.)")
    timeframe: str = Field(description="Timeframe (daily, weekly, monthly)")
    ohlc: OHLCInput
    auto_fetch: bool = Field(
        default=False, description="Auto-fetch previous period data"
    )


class PivotCalculationResponse(BaseModel):
    symbol: str
    timeframe: str
    date: date
    ohlc: OHLCInput
    cpr: CPRLevels
    floor_pivots: FloorPivotLevels
    fibonacci: Optional[FibonacciLevels] = None
    current_price: Optional[float] = None
    nearest_level: Optional[dict] = None
