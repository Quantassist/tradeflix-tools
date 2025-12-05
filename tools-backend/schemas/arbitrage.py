from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ArbitrageCalculationRequest(BaseModel):
    """Request for arbitrage calculation"""

    comex_price_usd: float = Field(
        gt=0, description="COMEX price in USD per troy ounce"
    )
    mcx_price_inr: float = Field(gt=0, description="MCX price in INR per 10 grams")
    usdinr_rate: float = Field(gt=0, description="USD/INR exchange rate")
    import_duty_percent: float = Field(
        default=2.5, ge=0, le=100, description="Import duty percentage"
    )
    contract_size_grams: int = Field(
        default=10, gt=0, description="Quote unit in grams (10 for MCX Gold)"
    )


class FairValueResult(BaseModel):
    """Fair value calculation result"""

    comex_price_usd: float
    usdinr_rate: float
    price_per_gram_inr: float
    import_duty_percent: float
    fair_value_inr: float
    contract_size_grams: int


class ArbitrageMetrics(BaseModel):
    """Arbitrage opportunity metrics"""

    mcx_price: float
    fair_value: float
    premium: float
    premium_percent: float
    z_score: Optional[float] = None
    percentile: Optional[float] = None
    signal: str  # "strong_long", "long", "neutral", "short", "strong_short"


class ProfitAnalysis(BaseModel):
    """Profit potential analysis"""

    gross_profit: float
    brokerage: float
    exchange_fees: float
    tax: float
    total_costs: float
    net_profit: float
    net_profit_percent: float


class USDINRSensitivity(BaseModel):
    """USDINR sensitivity analysis"""

    current_usdinr: float
    new_usdinr: float
    usdinr_change: float
    current_fair_value: float
    new_fair_value: float
    fair_value_change: float
    fair_value_change_percent: float


class ArbitrageCalculationResponse(BaseModel):
    """Complete arbitrage analysis response"""

    timestamp: datetime
    symbol: str
    fair_value: FairValueResult
    arbitrage: ArbitrageMetrics
    profit_analysis: ProfitAnalysis
    recommendation: str
    risk_level: str  # "low", "medium", "high"


class ArbitrageHistoryRequest(BaseModel):
    """Request for historical arbitrage data"""

    symbol: str
    days: int = Field(default=30, ge=1, le=365)


class ArbitrageAlertRequest(BaseModel):
    """Request to set up arbitrage alert"""

    symbol: str
    alert_type: str = Field(description="premium_above, premium_below, signal_change")
    threshold: float = Field(description="Threshold value (e.g., premium % or z-score)")
    notification_channel: str = Field(
        default="telegram", description="telegram, email, or both"
    )
