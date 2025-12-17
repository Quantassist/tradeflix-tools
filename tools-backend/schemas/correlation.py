from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import date


class AssetPair(BaseModel):
    """Asset pair for correlation analysis"""

    asset1: str = Field(description="First asset symbol")
    asset2: str = Field(description="Second asset symbol")


class CorrelationRequest(BaseModel):
    """Request for correlation calculation"""

    assets: List[str] = Field(min_length=2, description="List of asset symbols")
    period_days: int = Field(
        default=90, ge=7, le=365, description="Analysis period in days"
    )
    timeframe: str = Field(
        default="daily", description="Data timeframe (daily, weekly)"
    )


class CorrelationPair(BaseModel):
    """Correlation between two assets"""

    asset1: str
    asset2: str
    correlation: float = Field(
        ge=-1, le=1, description="Pearson correlation coefficient"
    )
    strength: str = Field(description="very_strong, strong, moderate, weak, very_weak")
    direction: str = Field(description="positive or negative")
    p_value: Optional[float] = Field(
        default=None, description="Statistical significance"
    )
    sample_size: int


class CorrelationMatrixResponse(BaseModel):
    """Correlation matrix response"""

    assets: List[str]
    period_days: int
    start_date: date
    end_date: date
    correlations: List[CorrelationPair]
    matrix: Dict[str, Dict[str, float]]  # 2D matrix for heatmap


class RollingCorrelationRequest(BaseModel):
    """Request for rolling correlation analysis"""

    asset1: str
    asset2: str
    window_days: int = Field(default=30, ge=7, le=90, description="Rolling window size")
    period_days: int = Field(
        default=180, ge=30, le=730, description="Total analysis period"
    )


class RollingCorrelationPoint(BaseModel):
    """Single point in rolling correlation"""

    date: date
    correlation: float
    strength: str


class RollingCorrelationResponse(BaseModel):
    """Rolling correlation time series"""

    asset1: str
    asset2: str
    window_days: int
    period_days: int
    data_points: List[RollingCorrelationPoint]
    current_correlation: float
    avg_correlation: float
    max_correlation: float
    min_correlation: float


class BetaCalculationRequest(BaseModel):
    """Request for beta calculation"""

    asset: str = Field(description="Asset to calculate beta for")
    benchmark: str = Field(default="GOLD", description="Benchmark asset")
    period_days: int = Field(default=90, ge=30, le=365)


class BetaCalculationResponse(BaseModel):
    """Beta calculation response"""

    asset: str
    benchmark: str
    period_days: int
    beta: float = Field(description="Beta coefficient")
    alpha: float = Field(description="Alpha (excess return)")
    r_squared: float = Field(ge=0, le=1, description="R-squared value")
    correlation: float
    interpretation: str
    volatility_ratio: float = Field(
        description="Asset volatility / Benchmark volatility"
    )


class DiversificationAnalysisRequest(BaseModel):
    """Request for portfolio diversification analysis"""

    assets: List[str] = Field(min_length=2, max_length=10)
    period_days: int = Field(default=90, ge=30, le=365)


class DiversificationScore(BaseModel):
    """Diversification score for portfolio"""

    portfolio_assets: List[str]
    avg_correlation: float
    max_correlation: float
    min_correlation: float
    diversification_score: float = Field(
        ge=0, le=100, description="0=poor, 100=excellent"
    )
    rating: str = Field(description="excellent, good, moderate, poor")
    recommendations: List[str]


class CorrelationBreakdownResponse(BaseModel):
    """Detailed correlation breakdown"""

    asset_pair: AssetPair
    period_days: int
    correlation: float
    strength: str
    direction: str

    # Statistical metrics
    p_value: float
    confidence_interval_lower: float
    confidence_interval_upper: float

    # Volatility metrics
    asset1_volatility: float
    asset2_volatility: float

    # Return metrics
    asset1_return: float
    asset2_return: float

    # Additional insights
    covariance: float
    sample_size: int
    interpretation: str


class DivergenceRequest(BaseModel):
    """Request for divergence detection"""

    asset1: str = Field(description="Primary asset (e.g., GOLD)")
    asset2: str = Field(description="Reference asset (e.g., USDINR)")
    period_days: int = Field(
        default=90, ge=30, le=365, description="Historical period for beta calculation"
    )
    lookback_days: int = Field(
        default=30, ge=5, le=90, description="Recent period to check for divergence"
    )


class DivergenceResponse(BaseModel):
    """Divergence detection response"""

    asset1: str
    asset2: str
    period_days: int
    lookback_days: int

    # Beta and correlation
    beta: float
    correlation: float

    # Divergence metrics
    has_divergence: bool
    divergence_score: float
    z_score: float
    expected_move: float
    actual_move: float
    divergence_pct: float
    signal: str
    interpretation: str


class LeadLagResponse(BaseModel):
    """Lead-lag analysis response"""

    asset1: str
    asset2: str
    leading_asset: Optional[str]
    lag_periods: int
    lag_direction: int
    correlation_at_lag: float
    correlation_at_zero: float
    all_lag_correlations: Dict[int, float]
    interpretation: str


class TradingSignal(BaseModel):
    """Individual trading signal"""

    type: str
    signal: str
    strength: str
    reason: str


class TradingSignalsResponse(BaseModel):
    """Correlation-based trading signals response"""

    asset1: str
    asset2: str
    period_days: int

    # Core metrics
    correlation: float
    beta: float

    # Divergence info
    divergence: DivergenceResponse

    # Lead-lag info
    lead_lag: LeadLagResponse

    # Trading signals
    overall_signal: str
    confidence: str
    signals: List[TradingSignal]
    signal_count: int
    summary: str
