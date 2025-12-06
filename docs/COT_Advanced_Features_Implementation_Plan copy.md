# COT Advanced Features - Implementation Plan

## Executive Summary

This document outlines the implementation plan for three major feature categories that will transform our COT module from basic positioning analytics into an institutional-grade market intelligence system:

1. **Trader-Group Aggregation Engine** - Smart money vs crowd indicators
2. **Curve Buckets & Concentration Structure** - Term structure and squeeze risk
3. **Regime Definitions & Alert Logic** - State machines and cross-market signals

---

## Feature Category 1: Trader-Group Aggregation Engine

### 1.1 Canonical Group Features

**Objective**: For each week and contract, compute standardized metrics for each trader group.

#### Data Requirements

| Column Type | Fields Used |
|-------------|-------------|
| Position Data | `*_Positions_Long_All`, `*_Positions_Short_All` |
| OI Share | `Pct_of_OI_*_Long_All`, `Pct_of_OI_*_Short_All` |
| Trader Counts | `Traders_*_Long_All`, `Traders_*_Short_All` |

#### Computed Metrics Per Group

```python
@dataclass
class GroupCanonicalFeatures:
    group_name: str  # prod_merc, swap_dealer, managed_money, other_rept, non_rept
    
    # Position metrics
    net_position: int           # long - short
    gross_position: int         # long + short
    long_short_ratio: float     # long / short (handle div by zero)
    
    # Market share metrics
    share_of_oi_long: float     # group long / total OI
    share_of_oi_short: float    # group short / total OI
    share_of_oi_net: float      # (group long - group short) / total OI
    
    # Participation metrics
    share_of_reported_long: float   # group long / total reported long
    share_of_reported_short: float  # group short / total reported short
    
    # Trader count metrics
    trader_count_long: int
    trader_count_short: int
    avg_position_per_trader_long: float  # long / trader_count_long
    avg_position_per_trader_short: float # short / trader_count_short
```

#### Implementation

**Backend Service**: `services/cot_group_aggregation_service.py`

```python
class GroupAggregationService:
    def compute_canonical_features(
        self, 
        commodity: str, 
        report_date: date
    ) -> Dict[str, GroupCanonicalFeatures]:
        """Compute all canonical features for all groups for a given week."""
        
    def get_historical_features(
        self,
        commodity: str,
        weeks: int = 52
    ) -> List[Dict[str, GroupCanonicalFeatures]]:
        """Get time series of canonical features."""
```

**API Endpoint**: `GET /cot/disagg/group-features/{commodity}`

**Response Schema**:
```python
class GroupFeaturesResponse(BaseModel):
    commodity: str
    report_date: date
    groups: Dict[str, GroupCanonicalFeatures]
    historical: List[Dict[str, GroupCanonicalFeatures]]  # Optional
```

---

### 1.2 Smart Money vs Crowd Indicators

**Objective**: Create composite indicators that aggregate "smart money" and "trend follower" groups.

#### Composite Definitions

| Composite | Groups Included | Rationale |
|-----------|-----------------|-----------|
| **Smart Money** | Commercials (Prod/Merc) + Swap Dealers | Hedgers with physical exposure, informed |
| **Trend Followers** | Managed Money | CTAs, momentum-driven |
| **Retail Crowd** | Non-Reportables | Small traders, often wrong at extremes |
| **Institutional Mix** | Other Reportables | Mixed, less predictive |

#### Computed Indicators

```python
@dataclass
class SmartMoneyCrowdIndicators:
    # Net positions
    smart_money_net: int
    trend_follower_net: int
    retail_net: int
    
    # Composite ratios
    smart_vs_crowd_ratio: float  # smart_money_net / trend_follower_net
    smart_money_conviction: float  # |smart_money_net| / smart_money_gross
    
    # Weekly changes
    smart_money_change: int
    trend_follower_change: int
    
    # Regime labels
    regime_label: str  # See regime definitions below
    regime_confidence: float
```

#### Regime Labels (Smart vs Crowd)

| Label | Condition | Interpretation |
|-------|-----------|----------------|
| `smart_buying_weakness` | Smart ↑, Price ↓, Crowd ↓ | Accumulation - bullish |
| `smart_selling_strength` | Smart ↓, Price ↑, Crowd ↑ | Distribution - bearish |
| `funds_chasing_highs` | Crowd ↑↑, Price ↑, Smart flat/↓ | Late cycle - caution |
| `funds_capitulating` | Crowd ↓↓, Price ↓, Smart ↑ | Capitulation - opportunity |
| `aligned_bullish` | Smart ↑, Crowd ↑ | Strong trend |
| `aligned_bearish` | Smart ↓, Crowd ↓ | Strong downtrend |
| `divergence_bullish` | Smart ↑, Crowd ↓ | Contrarian buy |
| `divergence_bearish` | Smart ↓, Crowd ↑ | Contrarian sell |

#### Implementation

**Backend Service**: Add to `cot_group_aggregation_service.py`

```python
def compute_smart_crowd_indicators(
    self,
    commodity: str,
    report_date: date,
    price_data: Optional[List[float]] = None  # For regime labeling
) -> SmartMoneyCrowdIndicators:
    """Compute smart money vs crowd composite indicators."""
    
def classify_smart_crowd_regime(
    self,
    current: SmartMoneyCrowdIndicators,
    previous: SmartMoneyCrowdIndicators,
    price_change: float
) -> Tuple[str, float]:  # (regime_label, confidence)
    """Classify the current smart money vs crowd regime."""
```

**API Endpoint**: `GET /cot/disagg/smart-crowd/{commodity}`

---

### 1.3 Participation Metrics

**Objective**: Distinguish broad participation from concentrated moves.

#### Key Metrics

```python
@dataclass
class ParticipationMetrics:
    # Trader counts
    total_traders_long: int
    total_traders_short: int
    trader_count_change: int  # vs previous week
    
    # Participation breadth
    avg_position_size: float  # total OI / total traders
    position_size_percentile: float  # vs history
    
    # Concentration indicators
    is_broad_move: bool  # net change with rising trader count
    is_concentrated_move: bool  # net change with falling trader count
    whale_indicator: float  # 0-100, higher = more concentrated
    
    # Interpretation
    participation_regime: str  # broad_accumulation, whale_driven, retail_fomo, etc.
```

#### Participation Regimes

| Regime | Condition | Implication |
|--------|-----------|-------------|
| `broad_accumulation` | Net ↑, Traders ↑, Avg size stable | Healthy trend building |
| `broad_distribution` | Net ↓, Traders ↑, Avg size stable | Healthy selling |
| `whale_accumulation` | Net ↑, Traders ↓, Avg size ↑↑ | Few large players buying |
| `whale_distribution` | Net ↓, Traders ↓, Avg size ↑↑ | Few large players selling |
| `retail_fomo` | Net ↑, Traders ↑↑, Avg size ↓ | Many small traders piling in |
| `retail_panic` | Net ↓, Traders ↑↑, Avg size ↓ | Many small traders selling |

#### Implementation

**API Endpoint**: `GET /cot/disagg/participation/{commodity}`

---

## Feature Category 2: Curve Buckets & Concentration Structure

### 2.1 Curve Bucket Analysis

**Objective**: Compare positioning across contract maturities (All vs Old vs Other).

#### CFTC Bucket Definitions

| Bucket | Description |
|--------|-------------|
| **All** | All contract months combined |
| **Old** | First expiring contract month (front month) |
| **Other** | All other contract months (deferred) |

#### Computed Metrics

```python
@dataclass
class CurveBucketAnalysis:
    commodity: str
    report_date: date
    
    # Per-group bucket breakdown
    groups: Dict[str, GroupBucketPositions]
    
    # Aggregate metrics
    front_month_bias: float  # (Old net - Other net) / All net
    hedging_concentration: str  # front_loaded, back_loaded, balanced
    spec_curve_preference: str  # front_month_spec, deferred_spec, balanced
    
    # Roll indicators
    roll_pressure_score: float  # 0-100
    roll_direction: str  # rolling_out, rolling_in, neutral

@dataclass
class GroupBucketPositions:
    group_name: str
    
    # All months
    all_long: int
    all_short: int
    all_net: int
    
    # Old (front) month
    old_long: int
    old_short: int
    old_net: int
    
    # Other (deferred) months
    other_long: int
    other_short: int
    other_net: int
    
    # Derived
    front_back_ratio: float  # old_net / other_net
    front_concentration: float  # |old_net| / |all_net|
```

#### Curve Regimes

| Regime | Condition | Trading Implication |
|--------|-----------|---------------------|
| `front_month_hedging_pressure` | Commercials heavy in Old, light in Other | Near-term supply pressure |
| `back_end_accumulation` | Managed Money heavy in Other | Long-term bullish positioning |
| `curve_flattening_by_funds` | Funds reducing front/back spread | Expect curve normalization |
| `roll_stress` | High roll pressure + concentration | Volatility around roll dates |

#### Implementation

**Backend Service**: `services/cot_curve_analysis_service.py`

```python
class CurveAnalysisService:
    def analyze_curve_buckets(
        self,
        commodity: str,
        report_date: date
    ) -> CurveBucketAnalysis:
        """Analyze positioning across curve buckets."""
        
    def detect_roll_regime(
        self,
        commodity: str,
        weeks: int = 8
    ) -> RollRegimeAnalysis:
        """Detect roll-related positioning patterns."""
```

**API Endpoint**: `GET /cot/disagg/curve-buckets/{commodity}`

---

### 2.2 Roll and Basis Regimes

**Objective**: Combine COT curve data with term structure to identify roll/basis opportunities.

#### Required External Data

| Data | Source | Purpose |
|------|--------|---------|
| Front month price | Market data | Current spot proxy |
| Deferred prices | Market data | Term structure |
| Calendar spreads | Computed | Contango/backwardation |

#### Computed Metrics

```python
@dataclass
class RollBasisRegime:
    commodity: str
    report_date: date
    
    # Term structure
    curve_shape: str  # contango, backwardation, flat
    front_back_spread: float  # % difference
    
    # COT + Curve combined
    hedging_curve_alignment: str  # aligned, divergent
    spec_curve_bet: str  # betting_on_backwardation, betting_on_contango, neutral
    
    # Regime classification
    regime: str  # See table below
    regime_confidence: float
    
    # Trade signals
    calendar_spread_signal: str  # buy_spread, sell_spread, neutral
    roll_timing_signal: str  # roll_early, roll_late, roll_normal
```

#### Roll/Basis Regimes

| Regime | COT Signal | Curve Signal | Trade Idea |
|--------|------------|--------------|------------|
| `front_squeeze_setup` | Specs heavy front, Comm light | Backwardation | Buy front, sell back |
| `contango_roll_pressure` | Comm rolling, Specs holding | Steep contango | Sell front, buy back |
| `backwardation_accumulation` | Specs adding deferred | Backwardation | Buy deferred |
| `curve_normalization` | Specs reducing spread | Flat | Close spread trades |

#### Implementation

**API Endpoint**: `GET /cot/disagg/roll-basis/{commodity}`

---

### 2.3 Crowding and Squeeze Risk (Enhanced)

**Objective**: Use concentration data to detect squeeze risk with higher precision.

#### Data Sources

| Field | Description |
|-------|-------------|
| `Conc_Gross_LE_4_TDR_Long_All` | % of long OI held by top 4 traders |
| `Conc_Gross_LE_4_TDR_Short_All` | % of short OI held by top 4 traders |
| `Conc_Gross_LE_8_TDR_Long_All` | % of long OI held by top 8 traders |
| `Conc_Gross_LE_8_TDR_Short_All` | % of short OI held by top 8 traders |
| `Conc_Net_LE_4_TDR_Long_All` | Net % by top 4 long traders |
| `Conc_Net_LE_4_TDR_Short_All` | Net % by top 4 short traders |

#### Enhanced Squeeze Risk Model

```python
@dataclass
class EnhancedSqueezeRisk:
    commodity: str
    report_date: date
    
    # Concentration metrics
    top4_long_concentration: float
    top4_short_concentration: float
    top8_long_concentration: float
    top8_short_concentration: float
    
    # Concentration asymmetry
    long_short_concentration_ratio: float  # top4_long / top4_short
    concentration_skew: str  # long_concentrated, short_concentrated, balanced
    
    # Squeeze scores (0-100)
    long_squeeze_score: float
    short_squeeze_score: float
    
    # Squeeze risk factors
    long_squeeze_factors: List[SqueezeRiskFactor]
    short_squeeze_factors: List[SqueezeRiskFactor]
    
    # Alerts
    squeeze_alert: Optional[str]
    gap_risk_level: str  # low, medium, high, extreme

@dataclass
class SqueezeRiskFactor:
    factor_name: str
    factor_value: float
    factor_weight: float
    contribution: float  # factor_value * factor_weight
    description: str
```

#### Squeeze Score Calculation

```python
def calculate_squeeze_score(side: str) -> float:
    """
    Long Squeeze Score = weighted sum of:
    - Managed Money long percentile (30%)
    - Top 4 long concentration (25%)
    - Long/Short concentration ratio (20%)
    - Trader count trend (declining = higher risk) (15%)
    - Recent price momentum (rising = higher squeeze risk for longs) (10%)
    
    Short Squeeze Score = inverse factors
    """
```

#### Implementation

**API Endpoint**: `GET /cot/disagg/squeeze-risk-enhanced/{commodity}`

---

## Feature Category 3: Regime Definitions & Alert Logic

### 3.1 Positioning Regimes (State Machine)

**Objective**: Define discrete positioning states and track transitions.

#### State Definitions

```python
class PositioningState(Enum):
    EXTREME_BULL = "extreme_bull"      # ≥80th percentile
    BULL = "bull"                       # 60-80th percentile
    NEUTRAL = "neutral"                 # 40-60th percentile
    BEAR = "bear"                       # 20-40th percentile
    EXTREME_BEAR = "extreme_bear"       # ≤20th percentile
```

#### State Machine

```python
@dataclass
class PositioningRegime:
    commodity: str
    report_date: date
    
    # Per-group states
    group_states: Dict[str, PositioningState]
    
    # State transitions (vs previous week)
    transitions: List[StateTransition]
    
    # Composite regime
    composite_regime: str  # See table below
    regime_strength: float  # 0-100
    
    # Duration tracking
    weeks_in_current_regime: int
    avg_regime_duration: float

@dataclass
class StateTransition:
    group: str
    from_state: PositioningState
    to_state: PositioningState
    transition_type: str  # upgrade, downgrade, extreme_entry, extreme_exit
```

#### Composite Regime Rules

| Regime | Managed Money | Commercials | Signal |
|--------|---------------|-------------|--------|
| `contrarian_sell` | EXTREME_BULL | EXTREME_BEAR | Strong sell |
| `contrarian_buy` | EXTREME_BEAR | EXTREME_BULL | Strong buy |
| `trend_continuation_bull` | BULL | BEAR | Hold longs |
| `trend_continuation_bear` | BEAR | BULL | Hold shorts |
| `neutral_consolidation` | NEUTRAL | NEUTRAL | Range-bound |
| `divergence_building` | Moving opposite to Commercials | Reduce exposure |

#### Implementation

**Backend Service**: `services/cot_regime_service.py`

```python
class RegimeService:
    def get_positioning_regime(
        self,
        commodity: str,
        report_date: date
    ) -> PositioningRegime:
        """Get current positioning regime with state machine."""
        
    def get_regime_history(
        self,
        commodity: str,
        weeks: int = 52
    ) -> List[PositioningRegime]:
        """Get historical regime classifications."""
        
    def detect_regime_transitions(
        self,
        commodity: str,
        lookback_weeks: int = 4
    ) -> List[RegimeTransitionAlert]:
        """Detect significant regime transitions."""
```

**API Endpoint**: `GET /cot/disagg/positioning-regime/{commodity}`

---

### 3.2 Flow and Momentum Regimes

**Objective**: Classify market flow states using position changes and momentum.

#### Flow State Definitions

```python
class FlowState(Enum):
    ACCUMULATION = "accumulation"      # Net ↑, MA > 0
    DISTRIBUTION = "distribution"      # Net ↓, MA < 0
    CAPITULATION = "capitulation"      # Large drop, extreme bear
    SQUEEZE = "squeeze"                # Large jump from extreme
    CONSOLIDATION = "consolidation"    # Small changes, neutral
```

#### Flow Regime Model

```python
@dataclass
class FlowMomentumRegime:
    commodity: str
    report_date: date
    
    # Raw flow data
    net_change_1w: int
    net_change_4w: int
    net_change_8w: int
    
    # Moving averages
    net_change_ma4: float  # 4-week MA of net changes
    net_change_ma8: float  # 8-week MA of net changes
    
    # Momentum indicators
    flow_momentum: float  # net_change_1w / net_change_ma4
    flow_acceleration: float  # (ma4 - ma8) / ma8
    
    # Statistical measures
    net_change_zscore: float  # Current change vs historical std
    is_multi_sigma_move: bool  # |zscore| > 2
    
    # Flow state
    flow_state: FlowState
    state_confidence: float
    
    # Alerts
    flow_alerts: List[FlowAlert]

@dataclass
class FlowAlert:
    alert_type: str  # capitulation, squeeze, momentum_shift
    severity: str  # info, warning, critical
    message: str
    triggered_at: date
```

#### Flow State Classification Logic

```python
def classify_flow_state(
    net_change: int,
    ma4: float,
    ma8: float,
    zscore: float,
    current_percentile: float
) -> FlowState:
    
    # Capitulation: Large multi-sigma drop while in extreme bear
    if zscore < -2 and current_percentile < 20:
        return FlowState.CAPITULATION
    
    # Squeeze: Large multi-sigma jump from extreme bear toward neutral
    if zscore > 2 and current_percentile < 40 and net_change > 0:
        return FlowState.SQUEEZE
    
    # Accumulation: Net increasing, MA positive
    if net_change > 0 and ma4 > 0:
        return FlowState.ACCUMULATION
    
    # Distribution: Net decreasing, MA negative
    if net_change < 0 and ma4 < 0:
        return FlowState.DISTRIBUTION
    
    return FlowState.CONSOLIDATION
```

#### Implementation

**API Endpoint**: `GET /cot/disagg/flow-regime/{commodity}`

---

### 3.3 Cross-Market and Structural Regimes

**Objective**: Aggregate signals across related markets for macro regime detection.

#### Market Groups

| Group | Commodities |
|-------|-------------|
| **Precious Metals** | Gold, Silver, Platinum, Palladium |
| **Energy** | Crude Oil, Natural Gas, Heating Oil, Gasoline |
| **Grains** | Corn, Wheat, Soybeans |
| **Softs** | Sugar, Coffee, Cotton, Cocoa |
| **Currencies** | EUR, GBP, JPY, CHF, AUD, CAD |

#### Cross-Market Metrics

```python
@dataclass
class CrossMarketRegime:
    group_name: str  # precious_metals, energy, etc.
    report_date: date
    
    # Aggregate positioning
    avg_managed_money_percentile: float
    avg_commercial_percentile: float
    
    # Breadth indicators
    pct_bullish: float  # % of commodities with MM > 60th percentile
    pct_bearish: float  # % of commodities with MM < 40th percentile
    breadth_thrust: bool  # >80% aligned in one direction
    
    # Concentration aggregate
    avg_top4_concentration: float
    max_top4_concentration: float
    concentration_dispersion: float
    
    # Trader count aggregate
    avg_trader_count_change: float
    shrinking_participation: bool  # Majority showing declining traders
    
    # Regime classification
    macro_regime: str  # See table below
    liquidity_regime: str  # normal, fragile, crisis
    
    # Risk indicators
    de_risking_score: float  # 0-100
    crowding_score: float  # 0-100

@dataclass  
class StructuralRegime:
    report_date: date
    
    # Cross-market aggregates
    market_groups: Dict[str, CrossMarketRegime]
    
    # Global indicators
    global_spec_pressure: float  # Avg across all commodities
    global_concentration: float
    global_participation_trend: str  # expanding, contracting, stable
    
    # Macro regime
    macro_state: str
    risk_appetite: str  # risk_on, risk_off, neutral
```

#### Macro Regime Definitions

| Regime | Condition | Implication |
|--------|-----------|-------------|
| `broad_fund_de_risking` | >70% commodities with MM ↓, declining traders | Risk-off, reduce exposure |
| `broad_fund_accumulation` | >70% commodities with MM ↑, rising traders | Risk-on, add exposure |
| `sector_rotation` | Mixed signals across groups | Selective opportunities |
| `fragile_liquidity` | High concentration + shrinking traders | Tighten stops, reduce size |
| `crowded_long` | High spec pressure + high concentration | Reversal risk elevated |
| `crowded_short` | Low spec pressure + high concentration | Squeeze risk elevated |

#### Implementation

**Backend Service**: `services/cot_cross_market_service.py`

```python
class CrossMarketService:
    def get_cross_market_regime(
        self,
        market_group: str,  # precious_metals, energy, etc.
        report_date: date
    ) -> CrossMarketRegime:
        """Get cross-market regime for a commodity group."""
        
    def get_structural_regime(
        self,
        report_date: date
    ) -> StructuralRegime:
        """Get global structural regime across all markets."""
        
    def detect_macro_shifts(
        self,
        lookback_weeks: int = 4
    ) -> List[MacroShiftAlert]:
        """Detect significant macro regime shifts."""
```

**API Endpoints**:
- `GET /cot/disagg/cross-market/{market_group}`
- `GET /cot/disagg/structural-regime`
- `GET /cot/disagg/macro-alerts`

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Create `GroupCanonicalFeatures` model | P0 | 2 days |
| Implement canonical feature computation | P0 | 3 days |
| Add API endpoint for group features | P0 | 1 day |
| Unit tests for group aggregation | P0 | 2 days |

### Phase 2: Smart Money Engine (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Implement smart money composites | P0 | 2 days |
| Build regime classification logic | P0 | 3 days |
| Add participation metrics | P1 | 2 days |
| Frontend visualization | P1 | 3 days |

### Phase 3: Curve & Concentration (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Implement curve bucket analysis | P0 | 3 days |
| Enhanced squeeze risk model | P0 | 3 days |
| Roll/basis regime detection | P1 | 2 days |
| Frontend charts for curve analysis | P1 | 2 days |

### Phase 4: Regime State Machine (Week 7-8)

| Task | Priority | Effort |
|------|----------|--------|
| Build positioning state machine | P0 | 3 days |
| Implement flow momentum regimes | P0 | 3 days |
| State transition detection | P1 | 2 days |
| Historical regime tracking | P1 | 2 days |

### Phase 5: Cross-Market Intelligence (Week 9-10)

| Task | Priority | Effort |
|------|----------|--------|
| Cross-market aggregation | P0 | 3 days |
| Structural regime detection | P0 | 3 days |
| Macro alert system | P1 | 2 days |
| Dashboard integration | P1 | 2 days |

---

## Database Schema Additions

### New Tables

```sql
-- Canonical group features (computed weekly)
CREATE TABLE cot_group_features (
    id SERIAL PRIMARY KEY,
    commodity VARCHAR(100),
    report_date DATE,
    group_name VARCHAR(50),
    net_position BIGINT,
    gross_position BIGINT,
    long_short_ratio FLOAT,
    share_of_oi_long FLOAT,
    share_of_oi_short FLOAT,
    trader_count_long INT,
    trader_count_short INT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(commodity, report_date, group_name)
);

-- Regime classifications (computed weekly)
CREATE TABLE cot_regimes (
    id SERIAL PRIMARY KEY,
    commodity VARCHAR(100),
    report_date DATE,
    positioning_regime VARCHAR(50),
    flow_regime VARCHAR(50),
    smart_crowd_regime VARCHAR(50),
    regime_confidence FLOAT,
    weeks_in_regime INT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(commodity, report_date)
);

-- Cross-market regimes (computed weekly)
CREATE TABLE cot_cross_market_regimes (
    id SERIAL PRIMARY KEY,
    market_group VARCHAR(50),
    report_date DATE,
    macro_regime VARCHAR(50),
    liquidity_regime VARCHAR(50),
    de_risking_score FLOAT,
    crowding_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(market_group, report_date)
);

-- Regime transition alerts
CREATE TABLE cot_regime_alerts (
    id SERIAL PRIMARY KEY,
    commodity VARCHAR(100),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    triggered_at TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Summary

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cot/disagg/group-features/{commodity}` | GET | Canonical group features |
| `/cot/disagg/smart-crowd/{commodity}` | GET | Smart money vs crowd indicators |
| `/cot/disagg/participation/{commodity}` | GET | Participation metrics |
| `/cot/disagg/curve-buckets/{commodity}` | GET | Curve bucket analysis |
| `/cot/disagg/roll-basis/{commodity}` | GET | Roll and basis regimes |
| `/cot/disagg/squeeze-risk-enhanced/{commodity}` | GET | Enhanced squeeze risk |
| `/cot/disagg/positioning-regime/{commodity}` | GET | Positioning state machine |
| `/cot/disagg/flow-regime/{commodity}` | GET | Flow momentum regime |
| `/cot/disagg/cross-market/{market_group}` | GET | Cross-market regime |
| `/cot/disagg/structural-regime` | GET | Global structural regime |
| `/cot/disagg/macro-alerts` | GET | Macro regime alerts |

---

## Frontend Components

### New Visualizations

1. **Smart Money Dashboard**
   - Composite indicator gauges
   - Smart vs Crowd divergence chart
   - Regime label with confidence

2. **Curve Structure View**
   - Front/Back positioning bars
   - Roll pressure indicator
   - Curve regime label

3. **Regime State Machine**
   - State transition diagram
   - Historical regime timeline
   - Duration statistics

4. **Cross-Market Heatmap**
   - Commodity group grid
   - Color-coded by regime
   - Concentration overlay

5. **Macro Dashboard**
   - Global risk appetite gauge
   - De-risking score trend
   - Liquidity regime indicator

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Regime classification accuracy | >75% (backtested) |
| Alert signal-to-noise ratio | >60% actionable |
| Cross-market correlation detection | >80% accuracy |
| System latency (regime computation) | <5 seconds |
| User engagement with new features | >50% of COT users |

---

*Document Version: 1.0*
*Created: December 2024*
*Status: Implementation Plan*
