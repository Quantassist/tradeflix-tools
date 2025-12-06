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


class StrategyComparator(str, Enum):
    """Comparison operators for strategy conditions"""

    GREATER_THAN = ">"
    LESS_THAN = "<"
    EQUALS = "=="
    CROSSES_ABOVE = "CROSS_ABOVE"
    CROSSES_BELOW = "CROSS_BELOW"


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


class StrategyCondition(BaseModel):
    """A single condition comparing two values"""

    id: str
    type: Literal["CONDITION"]
    left: IndicatorConfig
    comparator: StrategyComparator
    right: IndicatorConfig
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
