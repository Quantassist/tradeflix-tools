"""
Visual Strategy Builder Backtest Schemas

Defines Pydantic models for the recursive tree-based strategy structure
used by the visual strategy builder UI.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Union, Literal
from enum import Enum


class StrategyIndicatorType(str, Enum):
    """Available indicator types for strategy conditions"""

    # Moving Averages
    SMA = "SMA"
    EMA = "EMA"
    # Momentum Indicators
    RSI = "RSI"
    MACD = "MACD"
    MACD_SIGNAL = "MACD_SIGNAL"
    MACD_HIST = "MACD_HIST"
    STOCH_K = "STOCH_K"
    STOCH_D = "STOCH_D"
    # Volatility Indicators
    ATR = "ATR"
    BB_UPPER = "BB_UPPER"
    BB_MIDDLE = "BB_MIDDLE"
    BB_LOWER = "BB_LOWER"
    # Price Data
    PRICE = "PRICE"
    OPEN = "OPEN"
    HIGH = "HIGH"
    LOW = "LOW"
    VOLUME = "VOLUME"
    PREV_HIGH = "PREV_HIGH"
    PREV_LOW = "PREV_LOW"
    # External Data
    USDINR = "USDINR"
    # Pivot Points
    CPR_PIVOT = "CPR_PIVOT"
    CPR_TC = "CPR_TC"
    CPR_BC = "CPR_BC"
    # Seasonal Indicators
    MONTH = "MONTH"
    DAY_OF_MONTH = "DAY_OF_MONTH"
    DAY_OF_YEAR = "DAY_OF_YEAR"
    DAYS_TO_EVENT = "DAYS_TO_EVENT"
    DAYS_FROM_EVENT = "DAYS_FROM_EVENT"
    IS_EVENT_WINDOW = "IS_EVENT_WINDOW"
    IS_FAVORABLE_MONTH = "IS_FAVORABLE_MONTH"


class StrategyComparator(str, Enum):
    """Comparison operators for strategy conditions"""

    GREATER_THAN = "GREATER_THAN"
    LESS_THAN = "LESS_THAN"
    EQUALS = "EQUALS"
    CROSSES_ABOVE = "CROSSES_ABOVE"
    CROSSES_BELOW = "CROSSES_BELOW"


class StrategyAsset(str, Enum):
    """Supported assets for backtesting"""

    GOLD = "GOLD"
    SILVER = "SILVER"
    PLATINUM = "PLATINUM"
    PALLADIUM = "PALLADIUM"


class IndicatorConfig(BaseModel):
    """Configuration for an indicator in a condition"""

    type: StrategyIndicatorType
    period: int = 0
    source: Optional[Literal["close", "open", "high", "low"]] = "close"
    event: Optional[str] = (
        None  # For seasonal event-based indicators (DAYS_TO_EVENT, etc.)
    )


class StrategyCondition(BaseModel):
    """A single condition comparing two values"""

    id: str
    type: Literal["CONDITION"]
    left: IndicatorConfig
    comparator: StrategyComparator
    right: Optional[IndicatorConfig] = None  # Optional when using static value
    value: Optional[float] = None  # Static value override


class LogicGroup(BaseModel):
    """A group of conditions/groups combined with AND/OR logic"""

    id: str
    type: Literal["GROUP"]
    operator: Literal["AND", "OR"]
    children: List[Union["StrategyCondition", "LogicGroup"]] = []


# Rebuild model for recursive type support
LogicGroup.model_rebuild()

# Type alias for strategy nodes
StrategyNode = Union[StrategyCondition, LogicGroup]


class VisualStrategy(BaseModel):
    """Complete visual strategy definition"""

    id: str
    name: str
    asset: StrategyAsset
    entryLogic: LogicGroup = Field(..., alias="entryLogic")
    exitLogic: LogicGroup = Field(..., alias="exitLogic")
    stopLossPct: float = Field(..., alias="stopLossPct")
    takeProfitPct: float = Field(..., alias="takeProfitPct")

    class Config:
        populate_by_name = True


class VisualBacktestRequest(BaseModel):
    """Request model for visual backtest"""

    strategy: VisualStrategy
    startDate: Optional[str] = Field(None, alias="startDate")
    endDate: Optional[str] = Field(None, alias="endDate")
    initialCapital: float = Field(10000, alias="initialCapital")

    class Config:
        populate_by_name = True


class CandleData(BaseModel):
    """OHLCV candle data"""

    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0
    usdinr: Optional[float] = None


class VisualBacktestTrade(BaseModel):
    """Trade record from backtest"""

    entryDate: str = Field(..., alias="entryDate")
    entryPrice: float = Field(..., alias="entryPrice")
    exitDate: Optional[str] = Field(None, alias="exitDate")
    exitPrice: Optional[float] = Field(None, alias="exitPrice")
    profit: Optional[float] = None
    profitPct: Optional[float] = Field(None, alias="profitPct")
    type: Literal["LONG", "SHORT"] = "LONG"
    status: Literal["OPEN", "CLOSED"]

    class Config:
        populate_by_name = True


class VisualBacktestMetrics(BaseModel):
    """Performance metrics from backtest"""

    totalReturn: float = Field(..., alias="totalReturn")
    winRate: float = Field(..., alias="winRate")
    maxDrawdown: float = Field(..., alias="maxDrawdown")
    sharpeRatio: float = Field(..., alias="sharpeRatio")
    tradesCount: int = Field(..., alias="tradesCount")

    class Config:
        populate_by_name = True


class EquityCurvePoint(BaseModel):
    """Single point on equity curve"""

    date: str
    equity: float


class VisualBacktestResponse(BaseModel):
    """Response model for visual backtest"""

    trades: List[VisualBacktestTrade]
    finalEquity: float = Field(..., alias="finalEquity")
    initialEquity: float = Field(..., alias="initialEquity")
    metrics: VisualBacktestMetrics
    equityCurve: List[EquityCurvePoint] = Field(..., alias="equityCurve")
    priceData: List[CandleData] = Field(..., alias="priceData")

    class Config:
        populate_by_name = True


# ============================================
# Strategy Save/Load Schemas
# ============================================


class StrategySaveRequest(BaseModel):
    """Request model for saving a strategy"""

    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    asset: StrategyAsset
    entryLogic: LogicGroup = Field(..., alias="entryLogic")
    exitLogic: LogicGroup = Field(..., alias="exitLogic")
    stopLossPct: float = Field(2.0, alias="stopLossPct", ge=0, le=100)
    takeProfitPct: float = Field(5.0, alias="takeProfitPct", ge=0, le=100)
    isPublic: bool = Field(False, alias="isPublic")
    isFavorite: bool = Field(False, alias="isFavorite")
    isPrebuilt: bool = Field(False, alias="isPrebuilt")
    tags: Optional[List[str]] = None

    class Config:
        populate_by_name = True


class StrategyUpdateRequest(BaseModel):
    """Request model for updating a strategy"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    asset: Optional[StrategyAsset] = None
    entryLogic: Optional[LogicGroup] = Field(None, alias="entryLogic")
    exitLogic: Optional[LogicGroup] = Field(None, alias="exitLogic")
    stopLossPct: Optional[float] = Field(None, alias="stopLossPct", ge=0, le=100)
    takeProfitPct: Optional[float] = Field(None, alias="takeProfitPct", ge=0, le=100)
    isPublic: Optional[bool] = Field(None, alias="isPublic")
    isFavorite: Optional[bool] = Field(None, alias="isFavorite")
    isPrebuilt: Optional[bool] = Field(None, alias="isPrebuilt")
    tags: Optional[List[str]] = None

    class Config:
        populate_by_name = True


class StrategyResponse(BaseModel):
    """Response model for a saved strategy"""

    id: int
    userId: str = Field(..., alias="userId")
    name: str
    description: Optional[str] = None
    asset: str
    entryLogic: dict = Field(..., alias="entryLogic")
    exitLogic: dict = Field(..., alias="exitLogic")
    stopLossPct: float = Field(..., alias="stopLossPct")
    takeProfitPct: float = Field(..., alias="takeProfitPct")
    isPublic: bool = Field(..., alias="isPublic")
    isFavorite: bool = Field(..., alias="isFavorite")
    tags: Optional[List[str]] = None
    createdAt: Optional[str] = Field(None, alias="createdAt")
    updatedAt: Optional[str] = Field(None, alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True


class StrategyListResponse(BaseModel):
    """Response model for list of strategies"""

    strategies: List[StrategyResponse]
    total: int


# ============================================
# Backtest Save/Load Schemas
# ============================================


class BacktestSaveRequest(BaseModel):
    """Request model for saving a backtest result"""

    strategyId: Optional[int] = Field(None, alias="strategyId")
    asset: StrategyAsset
    initialCapital: float = Field(..., alias="initialCapital", gt=0)
    finalEquity: float = Field(..., alias="finalEquity")
    totalTrades: int = Field(0, alias="totalTrades", ge=0)
    winRate: float = Field(0, alias="winRate", ge=0, le=1)
    totalReturn: float = Field(0, alias="totalReturn")
    maxDrawdown: float = Field(0, alias="maxDrawdown")
    sharpeRatio: float = Field(0, alias="sharpeRatio")
    trades: List[dict] = []
    equityCurve: List[dict] = Field([], alias="equityCurve")
    executionTimeMs: Optional[int] = Field(None, alias="executionTimeMs")

    class Config:
        populate_by_name = True


class BacktestResponse(BaseModel):
    """Response model for a saved backtest"""

    id: int
    strategyId: Optional[int] = Field(None, alias="strategyId")
    userId: str = Field(..., alias="userId")
    asset: str
    initialCapital: float = Field(..., alias="initialCapital")
    finalEquity: float = Field(..., alias="finalEquity")
    metrics: VisualBacktestMetrics
    trades: List[dict] = []
    equityCurve: List[dict] = Field([], alias="equityCurve")
    executionTimeMs: Optional[int] = Field(None, alias="executionTimeMs")
    status: str
    errorMessage: Optional[str] = Field(None, alias="errorMessage")
    createdAt: Optional[str] = Field(None, alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True


class BacktestListResponse(BaseModel):
    """Response model for list of backtests"""

    backtests: List[BacktestResponse]
    total: int
