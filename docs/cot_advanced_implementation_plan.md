# COT Advanced Features - Implementation Plan

Based on the available database columns and the advanced features document, here's a comprehensive implementation strategy.

---

## Available Data Columns Summary

### Core Positions (All/Old/Other buckets)
- **Positions**: `*_Positions_Long_*`, `*_Positions_Short_*`, `*_Positions_Spread_*`
- **Groups**: Prod_Merc, Swap, M_Money, Other_Rept, NonRept

### Changes (Weekly)
- `Change_in_*_Long_All`, `Change_in_*_Short_All`, `Change_in_*_Spread_All`

### Percentage of OI
- `Pct_of_OI_*_Long_*`, `Pct_of_OI_*_Short_*`, `Pct_of_OI_*_Spread_*`

### Trader Counts
- `Traders_*_Long_*`, `Traders_*_Short_*`, `Traders_*_Spread_*`

### Concentration Ratios
- `Conc_Gross_LE_4_TDR_*`, `Conc_Gross_LE_8_TDR_*`
- `Conc_Net_LE_4_TDR_*`, `Conc_Net_LE_8_TDR_*`

### Term Structure Buckets
- **All**: Total positions
- **Old**: Front/near-month contracts
- **Other**: Back/deferred contracts

---

## Phase 1: Flow Decomposition & Crowding Metrics

### 1.1 Flow Decomposition Dashboard
**What it shows**: Break down weekly net change into 4 components per trader group

**Backend Calculation**:
```python
# For each group (e.g., Managed Money):
change_long = Change_in_M_Money_Long_All
change_short = Change_in_M_Money_Short_All

# Decompose:
new_longs = max(0, change_long)
long_liquidation = abs(min(0, change_long))
new_shorts = max(0, change_short)
short_covering = abs(min(0, change_short))
```

**Frontend Visualization**:
- **Stacked bar chart** showing 4 components per week
- Color coding: Green (new longs), Light green (short covering), Red (new shorts), Light red (long liquidation)
- Tooltip explaining what each flow type means

**User-Friendly Interpretation**:
| Flow Pattern | Meaning |
|--------------|---------|
| New Longs dominant | Aggressive buying, bullish conviction |
| Short Covering dominant | Forced buying, less conviction |
| New Shorts dominant | Aggressive selling, bearish conviction |
| Long Liquidation dominant | Profit taking or capitulation |

---

### 1.2 Participation & Average Position Size
**What it shows**: Whale-driven vs broad participation

**Backend Calculation**:
```python
avg_contracts_per_trader_long = M_Money_Positions_Long_All / Traders_M_Money_Long_All
avg_contracts_per_trader_short = M_Money_Positions_Short_All / Traders_M_Money_Short_All

# Flag whale moves:
is_whale_driven = (avg_size_current > avg_size_historical_90th_percentile) and (trader_count_change <= 0)
```

**Frontend Visualization**:
- **Dual-axis line chart**: Avg contracts/trader (left) vs Trader count (right)
- **Alert badge** when whale-driven move detected
- Simple gauge showing "Broad Participation" ↔ "Whale Driven"

---

### 1.3 Crowding Score
**What it shows**: Risk concentration in few hands

**Backend Calculation**:
```python
# Crowding = High % of OI + Few traders
crowding_score = (Pct_of_OI_M_Money_Long_All / 100) * (1 / log(Traders_M_Money_Long_All + 1))

# Normalize to 0-100 scale using historical percentile
```

**Frontend Visualization**:
- **Heatmap grid** showing crowding by group (rows) and long/short (columns)
- Color scale: Green (dispersed) → Yellow → Red (concentrated)
- Tooltip: "X% of OI held by Y traders"

---

### 1.4 Spread vs Directional Decomposition
**What it shows**: Relative-value vs macro/directional flows

**Backend Calculation**:
```python
directional_exposure = abs(long - short)
spread_exposure = spread_positions

spread_ratio = spread_exposure / (directional_exposure + spread_exposure + 1)
# High ratio = more relative-value trading
# Low ratio = more directional/macro flows
```

**Frontend Visualization**:
- **Stacked area chart** over time: Directional vs Spread exposure
- **Regime label**: "Relative Value Mode" vs "Directional Mode"

---

## Phase 2: Concentration & Squeeze Analytics

### 2.1 Concentration Index
**What it shows**: Top-4 vs Top-8 trader dominance

**Backend Calculation**:
```python
concentration_ratio = Conc_Gross_LE_4_TDR_Long_All / Conc_Gross_LE_8_TDR_Long_All

# Interpretation:
# Ratio close to 1.0 = Top 4 dominate even among top 8 (very concentrated)
# Ratio close to 0.5 = More evenly spread among top 8
```

**Frontend Visualization**:
- **Donut chart** showing Top-4 vs Next-4 vs Rest
- **Trend line** of concentration ratio over time
- Alert when ratio > 0.8 (extreme concentration)

---

### 2.2 Squeeze Vulnerability Metrics
**What it shows**: Probability of forced liquidation events

**Backend Calculation**:
```python
# Long Squeeze Risk (longs vulnerable to forced selling):
long_squeeze_score = (
    (nonrept_long_pct_oi > 15) * 0.3 +  # Retail heavily long
    (mm_net_percentile > 80) * 0.3 +     # Funds extremely long
    (commercial_net < 0) * 0.2 +          # Commercials net short
    (conc_gross_4_long > 40) * 0.2        # Concentrated longs
) * 100

# Short Squeeze Risk (shorts vulnerable):
short_squeeze_score = (
    (mm_short_pct_oi > 20) * 0.3 +       # Funds heavily short
    (conc_gross_4_short > 40) * 0.3 +    # Concentrated shorts
    (commercial_net > 0) * 0.2 +          # Commercials net long
    (mm_net_percentile < 20) * 0.2        # Extreme bearish positioning
) * 100
```

**Frontend Visualization**:
- **Dual gauge meters**: Long Squeeze Risk | Short Squeeze Risk
- Color zones: Green (0-30), Yellow (30-60), Red (60-100)
- **Historical context**: "Last time this score was reached: [date], price moved X%"

---

### 2.3 Herding Classification
**What it shows**: Market structure regime

**Backend Calculation**:
```python
# Classify into regimes:
if trader_count > median and concentration < 60 and abs(net) > threshold:
    regime = "Broad Herding"  # Many traders, all leaning same way
elif trader_count < median and concentration > 70:
    regime = "Oligopoly Dominance"  # Few big players control
elif abs(net) < threshold and gross_long + gross_short > high_threshold:
    regime = "Dispersed/Conflicted"  # High activity, no consensus
else:
    regime = "Normal"
```

**Frontend Visualization**:
- **Regime badge** with icon and color
- **Pie chart** showing trader distribution
- **Historical regime timeline** (last 12 weeks)

---

## Phase 3: Term Structure & Curve Positioning

### 3.1 Curve Bucket Analysis
**What it shows**: Front vs back month positioning by trader type

**Backend Calculation**:
```python
# For each group:
front_net = positions_long_old - positions_short_old
back_net = positions_long_other - positions_short_other

curve_bias = front_net - back_net
# Positive = more bullish on front, bearish on back (backwardation bet)
# Negative = more bullish on back, bearish on front (contango bet)
```

**Frontend Visualization**:
- **Grouped bar chart**: Front vs Back net by trader group
- **Curve bias indicator**: Arrow showing which end is favored
- **Interpretation panel**: "Commercials hedging front-month, Funds positioned for backwardation"

---

### 3.2 Roll Stress Indicator
**What it shows**: Potential roll-pressure events

**Backend Calculation**:
```python
# High stress when:
# 1. Large OI concentrated in Old (front)
# 2. High concentration among few traders
# 3. Approaching roll date

old_oi_ratio = Open_Interest_Old / Open_Interest_All
roll_stress = old_oi_ratio * (Conc_Gross_LE_4_TDR_Long_Old / 100)

# Flag if roll_stress > 0.3 and within 2 weeks of typical roll
```

**Frontend Visualization**:
- **Calendar view** with roll dates highlighted
- **Stress meter** for current period
- **Alert**: "High roll pressure expected - potential front-month dislocation"

---

## Phase 4: Cross-Asset & Regime Classification

### 4.1 Speculative Pressure Index
**What it shows**: Cross-market crowding comparison

**Backend Calculation**:
```python
# For each commodity:
spec_pressure = (mm_net - commercial_net) / open_interest

# Rank all commodities by spec_pressure
# Identify: Most crowded long, Most crowded short, Neutral
```

**Frontend Visualization**:
- **Horizontal bar chart** ranking commodities by spec pressure
- Color gradient: Red (crowded long) → Gray → Green (crowded short)
- **Rotation indicator**: Show which sectors are gaining/losing spec interest

---

### 4.2 Positioning Regime Classification
**What it shows**: Current market regime with historical context

**Backend Calculation**:
```python
# Build feature vector:
features = [
    mm_net_percentile,
    commercial_net_percentile,
    concentration_score,
    flow_momentum_4wk,
    spread_ratio,
    trader_count_change
]

# Classify into regimes (rule-based or ML):
regimes = {
    "Speculative Mania": mm_pct > 85 and nonrept_pct > 70,
    "Hedger Capitulation": commercial_pct < 15 and mm_pct > 75,
    "Two-Sided Distribution": abs(mm_net) < threshold and gross_high,
    "Accumulation": mm_pct < 30 and flow_momentum > 0,
    "Distribution": mm_pct > 70 and flow_momentum < 0,
    "Neutral": default
}
```

**Frontend Visualization**:
- **Large regime badge** with icon and description
- **Historical behavior panel**: "This regime historically led to X% move over Y weeks"
- **Confidence meter**: How strongly current data matches the regime pattern

---

## Implementation Priority

### Priority 1 (High Impact, Moderate Effort)
1. **Flow Decomposition** - Directly uses existing Change_in_* columns
2. **Squeeze Vulnerability** - High value for risk management
3. **Concentration Index** - Uses existing Conc_* columns

### Priority 2 (High Impact, Higher Effort)
4. **Participation/Whale Detection** - Requires trader count analysis
5. **Curve Bucket Analysis** - Uses Old/Other buckets
6. **Positioning Regime Classification** - Combines multiple metrics

### Priority 3 (Advanced)
7. **Cross-Asset Speculative Pressure** - Requires multi-commodity queries
8. **Roll Stress Indicator** - Needs roll date calendar
9. **Crowding Heatmap** - Complex visualization

---

## API Endpoints to Create

```
POST /api/v1/cot/disagg/advanced/flow-decomposition
POST /api/v1/cot/disagg/advanced/crowding-metrics
POST /api/v1/cot/disagg/advanced/squeeze-risk
POST /api/v1/cot/disagg/advanced/concentration
POST /api/v1/cot/disagg/advanced/curve-analysis
POST /api/v1/cot/disagg/advanced/regime-classification
GET  /api/v1/cot/disagg/advanced/cross-market-pressure
```

---

## Frontend Tab Structure

```
COT Report Visualizer
├── Positions (existing)
├── Sentiment (existing)
├── Charts (existing)
├── Analysis (existing)
├── Alerts (existing)
└── Advanced (NEW)
    ├── Flow Analysis
    │   ├── Flow Decomposition Chart
    │   └── Participation Metrics
    ├── Risk Metrics
    │   ├── Squeeze Vulnerability Gauges
    │   ├── Concentration Index
    │   └── Crowding Heatmap
    ├── Curve Structure
    │   ├── Front vs Back Positioning
    │   └── Roll Stress Calendar
    └── Regime Analysis
        ├── Current Regime Badge
        ├── Historical Behavior
        └── Cross-Market Pressure (if multi-commodity)
```

---

## User Experience Principles

1. **Progressive Disclosure**: Show simple summary first, details on click
2. **Plain English Labels**: "Whale Alert" not "High Avg Position Size Anomaly"
3. **Actionable Insights**: Every metric should suggest what to do
4. **Historical Context**: Always show "last time this happened..."
5. **Color Consistency**: Green=bullish/safe, Red=bearish/risky, Yellow=caution
6. **Tooltips Everywhere**: Explain every metric on hover

---

## Next Steps

1. Implement Priority 1 features (Flow Decomposition, Squeeze Risk, Concentration)
2. Create new backend service: `cot_advanced_service.py`
3. Add new schemas for advanced metrics
4. Create new frontend tab with sub-sections
5. Add comprehensive tooltips and educational content
