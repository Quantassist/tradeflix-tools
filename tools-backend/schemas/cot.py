from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum


class TraderCategory(str, Enum):
    """Trader categories in Disaggregated COT report"""

    PRODUCER_MERCHANT = "producer_merchant"
    SWAP_DEALER = "swap_dealer"
    MANAGED_MONEY = "managed_money"
    OTHER_REPORTABLES = "other_reportables"
    NON_REPORTABLES = "non_reportables"


class SentimentLevel(str, Enum):
    """Sentiment levels for gauges"""

    EXTREME_BEAR = "extreme_bear"
    BEARISH = "bearish"
    NEUTRAL = "neutral"
    BULLISH = "bullish"
    EXTREME_BULL = "extreme_bull"


class COTPositionData(BaseModel):
    """COT position data for a specific date (legacy format for backward compatibility)"""

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


class DisaggregatedPositionData(BaseModel):
    """Disaggregated COT position data with all four trader categories"""

    report_date: str
    market_name: Optional[str] = None
    commodity_name: Optional[str] = None
    commodity_group: Optional[str] = None
    open_interest: int

    # Producer/Merchant (Commercials) - hedgers
    producer_merchant_long: int
    producer_merchant_short: int
    producer_merchant_net: int
    producer_merchant_pct_long: Optional[float] = None
    producer_merchant_pct_short: Optional[float] = None

    # Swap Dealers - banks/dealers
    swap_dealer_long: int
    swap_dealer_short: int
    swap_dealer_spread: int = 0
    swap_dealer_net: int
    swap_dealer_pct_long: Optional[float] = None
    swap_dealer_pct_short: Optional[float] = None

    # Managed Money - funds/CTAs/hedge funds
    managed_money_long: int
    managed_money_short: int
    managed_money_spread: int = 0
    managed_money_net: int
    managed_money_pct_long: Optional[float] = None
    managed_money_pct_short: Optional[float] = None

    # Other Reportables - remaining large traders
    other_reportables_long: int
    other_reportables_short: int
    other_reportables_spread: int = 0
    other_reportables_net: int
    other_reportables_pct_long: Optional[float] = None
    other_reportables_pct_short: Optional[float] = None

    # Non-Reportables (Small Traders)
    non_reportables_long: int
    non_reportables_short: int
    non_reportables_net: int
    non_reportables_pct_long: Optional[float] = None
    non_reportables_pct_short: Optional[float] = None


class WeeklyChange(BaseModel):
    """Week-over-week change data"""

    change_open_interest: int = 0
    change_prod_merc_long: int = 0
    change_prod_merc_short: int = 0
    change_swap_long: int = 0
    change_swap_short: int = 0
    change_m_money_long: int = 0
    change_m_money_short: int = 0
    change_other_rept_long: int = 0
    change_other_rept_short: int = 0
    change_nonrept_long: int = 0
    change_nonrept_short: int = 0

    # Computed net changes
    change_prod_merc_net: int = 0
    change_swap_net: int = 0
    change_m_money_net: int = 0
    change_other_rept_net: int = 0
    change_nonrept_net: int = 0


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
    extreme_level: Optional[str] = Field(
        default=None, description="extremely_bullish, extremely_bearish"
    )


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


# ============================================================================
# New Disaggregated COT Schemas
# ============================================================================


class CategoryPercentile(BaseModel):
    """Percentile data for a single trader category"""

    category: str
    current_net: int
    percentile_1y: float = Field(ge=0, le=100)
    percentile_3y: Optional[float] = Field(default=None, ge=0, le=100)
    cot_index: float = Field(ge=0, le=100, description="COT Index (0-100 scale)")
    is_extreme: bool = False
    extreme_type: Optional[str] = None
    sentiment: SentimentLevel = SentimentLevel.NEUTRAL


class SentimentGauge(BaseModel):
    """Sentiment gauge for a trader category"""

    category: str
    sentiment: SentimentLevel
    percentile: float
    net_position: int
    four_week_change: int = 0
    consecutive_weeks_direction: int = (
        0  # positive = weeks adding, negative = weeks reducing
    )
    description: str


class DisaggCOTRequest(BaseModel):
    """Request for disaggregated COT data"""

    commodity: str = Field(description="GOLD, SILVER, or commodity name pattern")
    weeks: int = Field(default=52, ge=1, le=260, description="Number of weeks of data")


class DisaggCOTAnalysisResponse(BaseModel):
    """Complete disaggregated COT analysis response"""

    commodity: str
    market_name: Optional[str] = None
    latest_report_date: str
    data_as_of_date: str  # COT data is as of Tuesday
    weeks_analyzed: int

    # Current positions
    current_positions: DisaggregatedPositionData

    # Weekly changes
    weekly_changes: WeeklyChange

    # Percentile analysis for each category
    producer_merchant_percentile: CategoryPercentile
    swap_dealer_percentile: CategoryPercentile
    managed_money_percentile: CategoryPercentile
    other_reportables_percentile: CategoryPercentile
    non_reportables_percentile: CategoryPercentile

    # Sentiment gauges
    managed_money_sentiment: SentimentGauge
    producer_merchant_sentiment: SentimentGauge

    # Trading signal
    signal: COTSignal

    # Historical context
    avg_managed_money_net: float
    avg_producer_merchant_net: float


class DisaggCOTHistoricalResponse(BaseModel):
    """Historical disaggregated COT data"""

    commodity: str
    market_name: Optional[str] = None
    start_date: str
    end_date: str
    data_points: List[DisaggregatedPositionData]
    total_weeks: int


class NetPositionTimeSeries(BaseModel):
    """Time series of net positions for charting"""

    dates: List[str]
    producer_merchant_net: List[int]
    swap_dealer_net: List[int]
    managed_money_net: List[int]
    other_reportables_net: List[int]
    non_reportables_net: List[int]
    open_interest: List[int]


class LongShortTimeSeries(BaseModel):
    """Time series of long/short positions for stacked area charts"""

    dates: List[str]
    # Producer/Merchant
    producer_merchant_long: List[int]
    producer_merchant_short: List[int]
    # Swap Dealers
    swap_dealer_long: List[int]
    swap_dealer_short: List[int]
    # Managed Money
    managed_money_long: List[int]
    managed_money_short: List[int]
    # Other Reportables
    other_reportables_long: List[int]
    other_reportables_short: List[int]
    # Non-Reportables
    non_reportables_long: List[int]
    non_reportables_short: List[int]


class COTChartDataResponse(BaseModel):
    """Chart data for COT visualization"""

    commodity: str
    market_name: Optional[str] = None
    net_positions: NetPositionTimeSeries
    long_short_positions: LongShortTimeSeries


class MomentumAnalysis(BaseModel):
    """Momentum analysis for position changes"""

    category: str
    four_week_avg_change: float
    consecutive_weeks_same_direction: int
    direction: str  # "accumulating", "distributing", "neutral"
    momentum_strength: str  # "strong", "moderate", "weak"
    interpretation: str


class DisaggCOTChangeAnalysis(BaseModel):
    """Week-over-week change analysis for disaggregated data"""

    report_date: str
    previous_date: str

    # Changes by category
    producer_merchant_change: int
    producer_merchant_change_pct: float
    swap_dealer_change: int
    swap_dealer_change_pct: float
    managed_money_change: int
    managed_money_change_pct: float
    other_reportables_change: int
    other_reportables_change_pct: float
    non_reportables_change: int
    non_reportables_change_pct: float

    open_interest_change: int
    open_interest_change_pct: float

    # Momentum analysis
    momentum: List[MomentumAnalysis]

    interpretation: str


class COTTradingSignal(BaseModel):
    """Enhanced trading signal based on disaggregated COT data"""

    signal_type: str  # "contrarian_reversal", "trend_confirmation", "capitulation", "smart_money_alignment"
    signal: str  # "strong_buy", "buy", "neutral", "sell", "strong_sell"
    confidence: str  # "high", "medium", "low"

    # Trigger conditions
    managed_money_percentile: float
    producer_merchant_percentile: float
    managed_money_4wk_change: int

    reasoning: str
    historical_accuracy: Optional[str] = (
        None  # e.g., "This signal preceded 3%+ decline within 4 weeks 76% of the time"
    )


class ExtremePositioningAlert(BaseModel):
    """Alert for extreme positioning"""

    commodity: str
    report_date: str
    category: str
    net_position: int
    percentile: float
    extreme_type: str  # "extremely_bullish", "extremely_bearish"
    deviation_from_avg: float
    deviation_pct: float
    historical_context: str
    potential_reversal: bool
    suggested_action: str


class DisaggCOTComparisonItem(BaseModel):
    """Comparison item for disaggregated COT data"""

    commodity: str
    market_name: Optional[str] = None
    report_date: str

    # Net positions
    producer_merchant_net: int
    swap_dealer_net: int
    managed_money_net: int
    other_reportables_net: int
    non_reportables_net: int

    # Percentiles
    producer_merchant_percentile: float
    managed_money_percentile: float

    # Signal
    signal: str
    sentiment: str


class DisaggCOTComparisonResponse(BaseModel):
    """Comparison of disaggregated COT data across commodities"""

    commodities: List[str]
    report_date: str
    weeks_analyzed: int
    comparison_data: List[DisaggCOTComparisonItem]
    most_bullish: str
    most_bearish: str
    divergences: List[str]  # Notable divergences between commodities


class AvailableCommodity(BaseModel):
    """Available commodity in COT database"""

    commodity_name: str
    market_name: str
    commodity_group: Optional[str] = None
    commodity_subgroup: Optional[str] = None
    latest_report_date: str
    total_reports: int


# ============================================================================
# Advanced COT Analytics Schemas
# ============================================================================


class FlowType(str, Enum):
    """Types of position flows"""

    NEW_LONGS = "new_longs"
    LONG_LIQUIDATION = "long_liquidation"
    NEW_SHORTS = "new_shorts"
    SHORT_COVERING = "short_covering"


class FlowComponent(BaseModel):
    """Single flow component for a trader category"""

    new_longs: int = 0
    long_liquidation: int = 0
    new_shorts: int = 0
    short_covering: int = 0
    net_flow: int = 0
    dominant_flow: str = ""  # Which flow type is dominant
    interpretation: str = ""


class FlowDecompositionData(BaseModel):
    """Flow decomposition for a single week"""

    report_date: str
    producer_merchant: FlowComponent
    swap_dealer: FlowComponent
    managed_money: FlowComponent
    other_reportables: FlowComponent


class FlowDecompositionResponse(BaseModel):
    """Complete flow decomposition analysis"""

    commodity: str
    weeks_analyzed: int
    current_week: FlowDecompositionData
    historical_data: List[FlowDecompositionData]
    summary: str  # Overall interpretation


class ParticipationMetrics(BaseModel):
    """Participation and average position size metrics"""

    category: str
    total_long_positions: int
    total_short_positions: int
    traders_long: int
    traders_short: int
    avg_contracts_per_trader_long: float
    avg_contracts_per_trader_short: float
    trader_count_change: int  # vs previous week
    is_whale_driven: bool
    participation_trend: str  # "broadening", "narrowing", "stable"
    interpretation: str


class ParticipationResponse(BaseModel):
    """Participation analysis response"""

    commodity: str
    report_date: str
    metrics: List[ParticipationMetrics]
    overall_participation: str  # "broad", "concentrated", "mixed"
    whale_alert: Optional[str] = None


class ConcentrationMetrics(BaseModel):
    """Concentration analysis for a single side"""

    side: str  # "long" or "short"
    top_4_gross: float  # % of OI held by top 4
    top_8_gross: float  # % of OI held by top 8
    top_4_net: float
    top_8_net: float
    concentration_ratio: float  # top_4 / top_8 (closer to 1 = more concentrated)
    is_concentrated: bool
    percentile_vs_history: float  # How concentrated vs historical


class ConcentrationResponse(BaseModel):
    """Concentration analysis response"""

    commodity: str
    report_date: str
    long_concentration: ConcentrationMetrics
    short_concentration: ConcentrationMetrics
    crowding_score: float  # 0-100, higher = more crowded
    crowding_level: str  # "low", "moderate", "high", "extreme"
    interpretation: str
    historical_context: str


class SqueezeRiskMetrics(BaseModel):
    """Squeeze vulnerability metrics"""

    squeeze_type: str  # "long_squeeze" or "short_squeeze"
    risk_score: float  # 0-100
    risk_level: str  # "low", "moderate", "high", "extreme"

    # Contributing factors
    spec_positioning_factor: float  # 0-1
    concentration_factor: float  # 0-1
    commercial_positioning_factor: float  # 0-1
    retail_factor: float  # 0-1

    # Details
    managed_money_percentile: float
    concentration_top_4: float
    commercial_net_direction: str  # "long", "short", "neutral"
    non_reportable_bias: str  # "long", "short", "neutral"

    interpretation: str
    historical_precedent: Optional[str] = None


class SqueezeRiskResponse(BaseModel):
    """Squeeze risk analysis response"""

    commodity: str
    report_date: str
    long_squeeze_risk: SqueezeRiskMetrics
    short_squeeze_risk: SqueezeRiskMetrics
    dominant_risk: str  # "long_squeeze", "short_squeeze", "balanced"
    overall_vulnerability: str  # "low", "moderate", "high"
    suggested_action: str


class RegimeType(str, Enum):
    """Market positioning regimes"""

    SPECULATIVE_MANIA = "speculative_mania"
    HEDGER_CAPITULATION = "hedger_capitulation"
    ACCUMULATION = "accumulation"
    DISTRIBUTION = "distribution"
    TWO_SIDED = "two_sided"
    NEUTRAL = "neutral"


class RegimeClassification(BaseModel):
    """Regime classification result"""

    current_regime: RegimeType
    confidence: float  # 0-100
    regime_description: str
    historical_behavior: str  # What typically happens after this regime
    avg_return_after_4wk: Optional[float] = None
    avg_return_after_8wk: Optional[float] = None
    regime_duration_weeks: int  # How long in current regime
    previous_regime: Optional[RegimeType] = None


class AdvancedCOTSummary(BaseModel):
    """Summary of all advanced COT metrics"""

    commodity: str
    report_date: str

    # Quick scores (0-100)
    crowding_score: float
    squeeze_risk_score: float
    flow_momentum_score: float
    concentration_score: float

    # Key alerts
    alerts: List[str]

    # Regime
    current_regime: str
    regime_confidence: float

    # Actionable insight
    primary_insight: str
    suggested_action: str


# ============================================================================
# Priority 2: Curve, Spread, and Herding Analytics
# ============================================================================


class CurveBucketPositioning(BaseModel):
    """Positioning breakdown by curve bucket (front vs back)"""

    category: str  # "Producer/Merchant", "Swap Dealer", etc.

    # Front month (Old) positions
    front_long: int
    front_short: int
    front_net: int
    front_spread: int = 0

    # Back month (Other) positions
    back_long: int
    back_short: int
    back_net: int
    back_spread: int = 0

    # Derived metrics
    front_pct_of_total: float  # What % of this group's positions are in front
    curve_bias: str  # "front_heavy", "back_heavy", "balanced"
    curve_bias_score: float  # -100 to +100 (positive = front heavy)
    interpretation: str


class CurveAnalysisResponse(BaseModel):
    """Complete curve structure analysis"""

    commodity: str
    report_date: str

    # Overall OI breakdown
    total_oi: int
    front_oi: int
    back_oi: int
    front_oi_pct: float

    # Positioning by category
    positioning: List[CurveBucketPositioning]

    # Roll stress metrics
    roll_stress_score: float  # 0-100
    roll_stress_level: str  # "low", "moderate", "high", "critical"
    days_to_typical_roll: Optional[int] = None

    # Interpretation
    curve_summary: str
    roll_warning: Optional[str] = None


class SpreadDirectionalBreakdown(BaseModel):
    """Spread vs directional exposure for a trader category"""

    category: str

    # Directional exposure (outright long/short)
    directional_long: int
    directional_short: int
    directional_net: int

    # Spread exposure (calendar spreads, basis trades)
    spread_positions: int

    # Ratios
    spread_pct_of_total: float  # Spread / (Directional + Spread)
    directional_pct_of_total: float

    # Classification
    exposure_type: str  # "directional_dominant", "spread_dominant", "balanced"
    interpretation: str


class SpreadAnalysisResponse(BaseModel):
    """Spread vs directional analysis"""

    commodity: str
    report_date: str

    # Breakdown by category
    breakdown: List[SpreadDirectionalBreakdown]

    # Market-wide metrics
    total_spread_positions: int
    total_directional_positions: int
    market_spread_ratio: float  # Overall spread % of market

    # Regime
    market_mode: str  # "relative_value", "directional", "mixed"
    mode_strength: str  # "strong", "moderate", "weak"

    # Week-over-week change
    spread_change_wow: int
    directional_change_wow: int

    interpretation: str


class HerdingType(str, Enum):
    """Types of herding/dispersion regimes"""

    BROAD_HERDING = "broad_herding"  # Many traders, same direction
    OLIGOPOLY = "oligopoly"  # Few big players dominate
    DISPERSED = "dispersed"  # High activity, no consensus
    CAPITULATION = "capitulation"  # Extreme one-sided with falling counts
    NORMAL = "normal"


class HerdingMetrics(BaseModel):
    """Herding analysis for a trader category"""

    category: str

    # Trader counts
    traders_long: int
    traders_short: int
    total_traders: int
    trader_count_change: int  # vs previous week

    # Position metrics
    net_position: int
    avg_position_size: float

    # Herding indicators
    long_short_trader_ratio: float  # traders_long / traders_short
    position_per_trader_percentile: float  # vs historical

    # Classification
    herding_type: HerdingType
    herding_intensity: float  # 0-100
    interpretation: str


class HerdingAnalysisResponse(BaseModel):
    """Complete herding analysis"""

    commodity: str
    report_date: str

    # Per-category analysis
    categories: List[HerdingMetrics]

    # Market-wide herding
    overall_herding_score: float  # 0-100
    overall_herding_type: HerdingType

    # Smart money vs crowd
    smart_money_direction: str  # "bullish", "bearish", "neutral"
    crowd_direction: str  # "bullish", "bearish", "neutral"
    divergence_detected: bool

    # Alerts
    herding_alert: Optional[str] = None
    interpretation: str


class ComprehensiveAdvancedAnalysis(BaseModel):
    """All advanced analytics in one response"""

    commodity: str
    report_date: str

    # Priority 1 metrics
    summary: AdvancedCOTSummary
    squeeze_risk: SqueezeRiskResponse
    concentration: ConcentrationResponse
    flow_decomposition: FlowDecompositionResponse

    # Priority 2 metrics
    curve_analysis: Optional[CurveAnalysisResponse] = None
    spread_analysis: Optional[SpreadAnalysisResponse] = None
    herding_analysis: Optional[HerdingAnalysisResponse] = None


# ============================================================================
# Priority 3: Cross-Market, Volatility, and ML Regime Analytics
# ============================================================================


class SpeculativePressureItem(BaseModel):
    """Speculative pressure for a single commodity"""

    commodity: str
    commodity_group: Optional[str] = None
    report_date: str

    # Net positions
    managed_money_net: int
    commercial_net: int
    open_interest: int

    # Pressure metrics
    spec_pressure: float  # (MM_net - Commercial_net) / OI, normalized
    spec_pressure_percentile: float  # vs own history

    # Positioning
    mm_percentile: float
    commercial_percentile: float

    # Classification
    crowding_level: str  # "extreme_long", "long", "neutral", "short", "extreme_short"

    # Week-over-week
    pressure_change: float
    pressure_direction: str  # "increasing", "decreasing", "stable"


class CrossMarketPressureResponse(BaseModel):
    """Cross-market speculative pressure analysis"""

    report_date: str
    commodities_analyzed: int

    # Rankings
    most_crowded_long: List[SpeculativePressureItem]
    most_crowded_short: List[SpeculativePressureItem]

    # Sector aggregates
    sector_pressure: List[dict]  # {sector, avg_pressure, commodities_count}

    # Rotation signals
    rotation_into: List[str]  # Commodities seeing increased spec interest
    rotation_out_of: List[str]  # Commodities seeing decreased spec interest

    # Overall market
    avg_spec_pressure: float
    market_sentiment: str  # "risk_on", "risk_off", "mixed"

    interpretation: str


class VolatilityRegimeMetrics(BaseModel):
    """COT-implied volatility regime metrics"""

    commodity: str
    report_date: str

    # Position-based volatility indicators
    gross_positions: int  # Total long + short across all categories
    gross_positions_percentile: float
    gross_positions_change_4wk: int

    # Spread activity (proxy for vol expectations)
    spread_ratio: float
    spread_ratio_percentile: float

    # Concentration (high concentration = potential vol spike)
    concentration_score: float

    # Derived volatility regime
    implied_vol_regime: str  # "low", "normal", "elevated", "high"
    vol_regime_score: float  # 0-100

    # Directional bias
    vol_skew: str  # "call_skew" (upside vol), "put_skew" (downside vol), "neutral"

    interpretation: str


class VolatilityAnalysisResponse(BaseModel):
    """COT-implied volatility analysis"""

    commodity: str
    report_date: str

    current_metrics: VolatilityRegimeMetrics

    # Historical context
    vol_regime_history: List[dict]  # [{date, regime, score}]

    # Alerts
    vol_alert: Optional[str] = None

    interpretation: str


class MLRegimeFeatures(BaseModel):
    """Feature vector for ML regime classification"""

    # Positioning features
    mm_net_percentile: float
    commercial_net_percentile: float
    nonrept_net_percentile: float

    # Flow features
    mm_4wk_flow: float  # Normalized 4-week change
    commercial_4wk_flow: float

    # Structure features
    concentration_score: float
    spread_ratio: float
    herding_score: float

    # Curve features
    front_back_ratio: float

    # Volatility features
    gross_positions_percentile: float


class MLRegimeType(str, Enum):
    """ML-classified market regimes"""

    TREND_FOLLOWING = "trend_following"  # Specs aligned with trend
    MEAN_REVERSION = "mean_reversion"  # Extreme positioning, reversal likely
    ACCUMULATION = "accumulation"  # Smart money building, specs light
    DISTRIBUTION = "distribution"  # Smart money selling, specs heavy
    CAPITULATION = "capitulation"  # Forced liquidation
    CONSOLIDATION = "consolidation"  # Low conviction, range-bound
    BREAKOUT_SETUP = "breakout_setup"  # Building pressure for move


class MLRegimeClassification(BaseModel):
    """ML-based regime classification result"""

    commodity: str
    report_date: str

    # Current regime
    primary_regime: MLRegimeType
    primary_confidence: float  # 0-100

    secondary_regime: Optional[MLRegimeType] = None
    secondary_confidence: Optional[float] = None

    # Feature importance for this classification
    top_features: List[dict]  # [{feature, importance, value}]

    # Regime characteristics
    regime_description: str
    typical_duration_weeks: int
    typical_outcome: str

    # Historical performance
    historical_win_rate: Optional[float] = (
        None  # % of times this regime led to predicted outcome
    )
    avg_move_after_4wk: Optional[float] = None

    # Transition probabilities
    likely_next_regimes: List[dict]  # [{regime, probability}]

    # Actionable
    suggested_strategy: str
    risk_level: str  # "low", "moderate", "high"


class MLRegimeHistoryItem(BaseModel):
    """Historical regime classification"""

    report_date: str
    regime: MLRegimeType
    confidence: float
    mm_percentile: float
    commercial_percentile: float


class MLRegimeAnalysisResponse(BaseModel):
    """Complete ML regime analysis"""

    commodity: str
    report_date: str

    # Current classification
    current_regime: MLRegimeClassification

    # Features used
    features: MLRegimeFeatures

    # Historical regimes
    regime_history: List[MLRegimeHistoryItem]
    regime_duration_current: int  # Weeks in current regime

    # Regime statistics
    regime_distribution: dict  # {regime: count} over history

    interpretation: str
