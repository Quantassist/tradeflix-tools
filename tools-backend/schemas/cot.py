from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class COTPositionData(BaseModel):
    """COT position data for a specific date"""
    report_date: date
    
    # Commercial positions (hedgers)
    commercial_long: int
    commercial_short: int
    commercial_net: int
    
    # Non-commercial positions (speculators)
    non_commercial_long: int
    non_commercial_short: int
    non_commercial_net: int
    
    # Non-reportable positions (small traders)
    non_reportable_long: int
    non_reportable_short: int
    non_reportable_net: int
    
    # Open interest
    open_interest: int


class COTRequest(BaseModel):
    """Request for COT data"""
    commodity: str = Field(description="GOLD, SILVER, CRUDE, etc.")
    weeks: int = Field(default=52, ge=1, le=260, description="Number of weeks of data")


class COTPercentileData(BaseModel):
    """Percentile analysis for COT positions"""
    current_net_position: int
    percentile_1y: float = Field(ge=0, le=100, description="Percentile over 1 year")
    percentile_3y: float = Field(ge=0, le=100, description="Percentile over 3 years")
    percentile_5y: float = Field(ge=0, le=100, description="Percentile over 5 years")
    is_extreme: bool = Field(description="True if in top/bottom 10%")
    extreme_level: Optional[str] = Field(default=None, description="extremely_bullish, extremely_bearish")


class COTSignal(BaseModel):
    """Trading signal based on COT data"""
    signal: str = Field(description="strong_buy, buy, neutral, sell, strong_sell")
    confidence: str = Field(description="high, medium, low")
    reasoning: str
    commercial_bias: str = Field(description="bullish, bearish, neutral")
    speculator_bias: str = Field(description="bullish, bearish, neutral")


class COTAnalysisResponse(BaseModel):
    """Complete COT analysis response"""
    commodity: str
    latest_report_date: date
    weeks_analyzed: int
    
    # Current positions
    current_positions: COTPositionData
    
    # Percentile analysis
    commercial_percentile: COTPercentileData
    non_commercial_percentile: COTPercentileData
    
    # Changes from previous week
    commercial_net_change: int
    non_commercial_net_change: int
    open_interest_change: int
    
    # Trading signal
    signal: COTSignal
    
    # Historical context
    avg_commercial_net: float
    avg_non_commercial_net: float


class COTHistoricalResponse(BaseModel):
    """Historical COT data"""
    commodity: str
    start_date: date
    end_date: date
    data_points: List[COTPositionData]
    total_weeks: int


class COTChangeAnalysis(BaseModel):
    """Week-over-week change analysis"""
    report_date: date
    previous_date: date
    
    commercial_net_change: int
    commercial_net_change_percent: float
    
    non_commercial_net_change: int
    non_commercial_net_change_percent: float
    
    open_interest_change: int
    open_interest_change_percent: float
    
    interpretation: str


class COTExtremePositioning(BaseModel):
    """Extreme positioning alert"""
    commodity: str
    report_date: date
    position_type: str = Field(description="commercial or non_commercial")
    net_position: int
    percentile: float
    extreme_type: str = Field(description="extremely_bullish or extremely_bearish")
    historical_context: str
    potential_reversal: bool


class COTComparisonRequest(BaseModel):
    """Request for comparing multiple commodities"""
    commodities: List[str] = Field(min_length=2, max_length=5)
    weeks: int = Field(default=52, ge=4, le=260)


class COTComparisonItem(BaseModel):
    """COT comparison for a single commodity"""
    commodity: str
    commercial_net: int
    commercial_percentile: float
    non_commercial_net: int
    non_commercial_percentile: float
    signal: str
    sentiment: str = Field(description="bullish, bearish, neutral")


class COTComparisonResponse(BaseModel):
    """Comparison of COT data across commodities"""
    commodities: List[str]
    report_date: date
    weeks_analyzed: int
    comparison_data: List[COTComparisonItem]
    most_bullish: str
    most_bearish: str
