# Strategy to Backtest Architecture

This document explains how a visual strategy defined in JSON is converted into a deterministic backtesting engine that can be executed against historical price data.

## Overview

The backtesting system follows a **4-stage pipeline**:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  JSON Strategy  │ -> │ Indicator        │ -> │ Data            │ -> │ Backtest        │
│  (Tree)         │    │ Extraction       │    │ Preparation     │    │ Execution       │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Stage 1: Strategy JSON Structure

The strategy is represented as a **recursive tree structure** with two main branches: `entryLogic` and `exitLogic`.

### Schema Definition

```python
# Core Types
class StrategyCondition:
    id: str
    type: "CONDITION"
    left: IndicatorConfig      # Left operand (e.g., RSI)
    comparator: Comparator     # >, <, ==, CROSS_ABOVE, CROSS_BELOW
    right: IndicatorConfig     # Right operand (e.g., EMA)
    value: Optional[float]     # Static value override (e.g., 30)

class LogicGroup:
    id: str
    type: "GROUP"
    operator: "AND" | "OR"
    children: List[Condition | LogicGroup]  # Recursive!
```

### Example Strategy JSON

```json
{
  "id": "rsi-ema-strategy",
  "name": "RSI Oversold + EMA Trend",
  "asset": "GOLD",
  "entryLogic": {
    "id": "root-entry",
    "type": "GROUP",
    "operator": "AND",
    "children": [
      {
        "id": "e1",
        "type": "CONDITION",
        "left": { "type": "RSI", "period": 14 },
        "comparator": "<",
        "right": { "type": "PRICE", "period": 0 },
        "value": 30
      },
      {
        "id": "e2",
        "type": "CONDITION",
        "left": { "type": "PRICE", "period": 0 },
        "comparator": ">",
        "right": { "type": "EMA", "period": 200 }
      }
    ]
  },
  "exitLogic": {
    "id": "root-exit",
    "type": "GROUP",
    "operator": "OR",
    "children": [
      {
        "id": "x1",
        "type": "CONDITION",
        "left": { "type": "RSI", "period": 14 },
        "comparator": ">",
        "right": { "type": "PRICE", "period": 0 },
        "value": 70
      }
    ]
  },
  "stopLossPct": 2.0,
  "takeProfitPct": 5.0
}
```

This represents: **Enter when RSI(14) < 30 AND Price > EMA(200). Exit when RSI(14) > 70.**

---

## Stage 2: Indicator Extraction

Before backtesting, we traverse the strategy tree to extract all unique indicator configurations.

### Algorithm

```python
def extract_configs_from_strategy(strategy: Dict) -> List[Dict]:
    """
    Recursively walk the strategy tree and collect all indicator configs.
    """
    configs = set()  # Deduplicate by "TYPE_PERIOD" key
    config_list = []

    def extract_from_node(node):
        if node["type"] == "CONDITION":
            # Extract left indicator
            left = node["left"]
            if left["type"] not in STATIC_TYPES:
                key = f"{left['type']}_{left['period']}"
                if key not in configs:
                    configs.add(key)
                    config_list.append(left)
            
            # Extract right indicator (if not using static value)
            if node.get("value") is None:
                right = node["right"]
                # ... same logic
        
        elif node["type"] == "GROUP":
            for child in node["children"]:
                extract_from_node(child)
    
    extract_from_node(strategy["entryLogic"])
    extract_from_node(strategy["exitLogic"])
    
    return config_list
```

### Output Example

For the strategy above, extraction yields:
```python
[
    {"type": "RSI", "period": 14},
    {"type": "EMA", "period": 200}
]
```

### Static vs Calculated Indicators

| Type | Examples | Calculation |
|------|----------|-------------|
| **Static** | PRICE, OPEN, HIGH, LOW, VOLUME, PREV_HIGH, PREV_LOW, USDINR, CPR_* | Direct lookup from candle data |
| **Calculated** | SMA, EMA, RSI, MACD, STOCH, ATR, BB_* | Computed using TA-Lib |

---

## Stage 3: Data Preparation

Historical price data is transformed into a format suitable for backtesting with all required indicators pre-calculated.

### Step 3.1: Format Conversion

```python
def prepare_data_for_backtest(data: List[Dict]) -> pd.DataFrame:
    """
    Convert candle list to backtesting.py format.
    
    Input:  [{"date": "2024-01-01", "open": 100, "high": 105, ...}, ...]
    Output: DataFrame with DatetimeIndex and capitalized columns
    """
    df = pd.DataFrame(data)
    
    # Rename to backtesting.py convention
    df = df.rename(columns={
        "open": "Open", "high": "High", "low": "Low",
        "close": "Close", "volume": "Volume", "date": "Date"
    })
    
    # Set DatetimeIndex
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date")
    
    # Add derived columns
    df["PREV_HIGH"] = df["High"].shift(1).fillna(df["High"])
    df["PREV_LOW"] = df["Low"].shift(1).fillna(df["Low"])
    df["PREV_CLOSE"] = df["Close"].shift(1).fillna(df["Close"])
    
    # Calculate CPR (Central Pivot Range)
    cpr_df = calculate_weekly_cpr(df)
    df["CPR_PIVOT"] = cpr_df["CPR_PIVOT"]
    df["CPR_TC"] = cpr_df["CPR_TC"]
    df["CPR_BC"] = cpr_df["CPR_BC"]
    
    return df
```

### Step 3.2: Indicator Calculation

```python
def add_indicators_to_data(df: pd.DataFrame, configs: List[Dict]) -> pd.DataFrame:
    """
    Calculate and add indicator columns to DataFrame.
    """
    close = df["Close"].values
    high = df["High"].values
    low = df["Low"].values
    
    for config in configs:
        ind_type = config["type"]
        period = config.get("period", 14)
        key = f"{ind_type}_{period}"
        
        if ind_type == "SMA":
            df[key] = talib.SMA(close, period)
        elif ind_type == "EMA":
            df[key] = talib.EMA(close, period)
        elif ind_type == "RSI":
            df[key] = talib.RSI(close, period)
        elif ind_type == "MACD":
            macd, signal, hist = talib.MACD(close)
            df[f"MACD_{period}"] = macd
            df[f"MACD_SIGNAL_{period}"] = signal
            df[f"MACD_HIST_{period}"] = hist
        # ... other indicators
    
    return df.fillna(0)  # Replace NaN with 0 for warmup periods
```

### Resulting DataFrame Structure

```
Date        | Open    | High    | Low     | Close   | RSI_14 | EMA_200 | ...
------------|---------|---------|---------|---------|--------|---------|----
2024-01-01  | 75000.0 | 75500.0 | 74800.0 | 75200.0 | 45.2   | 74500.0 | ...
2024-01-02  | 75200.0 | 76000.0 | 75100.0 | 75800.0 | 52.1   | 74520.0 | ...
```

---

## Stage 4: Backtest Execution

The backtest engine iterates through each bar and evaluates the strategy tree to generate signals.

### 4.1: Condition Evaluation

```python
def evaluate_condition(data: pd.DataFrame, condition: Dict, idx: int) -> bool:
    """
    Evaluate a single condition at bar index `idx`.
    """
    # Get left value
    left_config = condition["left"]
    val_a = get_indicator_value(data, left_config, idx)
    
    # Get right value (static or indicator)
    if condition.get("value") is not None:
        val_b = condition["value"]  # Static: RSI < 30
    else:
        val_b = get_indicator_value(data, condition["right"], idx)
    
    # Get previous values for crossover detection
    prev_val_a = get_indicator_value(data, left_config, idx - 1)
    prev_val_b = ...
    
    # Evaluate comparator
    comparator = condition["comparator"]
    
    if comparator == ">":
        return val_a > val_b
    elif comparator == "<":
        return val_a < val_b
    elif comparator == "==":
        return abs(val_a - val_b) < 0.01
    elif comparator == "CROSS_ABOVE":
        return prev_val_a <= prev_val_b and val_a > val_b
    elif comparator == "CROSS_BELOW":
        return prev_val_a >= prev_val_b and val_a < val_b
```

### 4.2: Recursive Node Evaluation

```python
def evaluate_node(data: pd.DataFrame, node: Dict, idx: int) -> bool:
    """
    Recursively evaluate a strategy node (condition or group).
    """
    if node["type"] == "CONDITION":
        return evaluate_condition(data, node, idx)
    
    elif node["type"] == "GROUP":
        children = node["children"]
        
        if not children:
            return False  # Empty group = no signal
        
        if node["operator"] == "AND":
            # ALL conditions must be true
            return all(evaluate_node(data, child, idx) for child in children)
        else:  # OR
            # ANY condition must be true
            return any(evaluate_node(data, child, idx) for child in children)
```

### 4.3: Strategy Execution Loop

Using the `backtesting.py` library:

```python
class DynamicStrategy(Strategy):
    entry_logic = {}
    exit_logic = {}
    stop_loss_pct = 2.0
    take_profit_pct = 5.0
    
    def next(self):
        """Called on each new bar."""
        idx = len(self.data) - 1
        df = self.data.df
        
        if not self.position:
            # Check entry conditions
            if evaluate_node(df, self.entry_logic, idx):
                current_price = self.data.Close[-1]
                sl_price = current_price * (1 - self.stop_loss_pct / 100)
                tp_price = current_price * (1 + self.take_profit_pct / 100)
                
                self.buy(sl=sl_price, tp=tp_price)
        else:
            # Check exit conditions
            if evaluate_node(df, self.exit_logic, idx):
                self.position.close()
```

---

## Determinism Guarantees

The backtesting engine is **fully deterministic** because:

1. **No Lookahead Bias**: Indicators are calculated using only past data. At bar `i`, only data from bars `0` to `i` is accessible.

2. **Fixed Execution Order**: 
   - Exit conditions are checked first (close existing position)
   - Entry conditions are checked second (open new position)
   - SL/TP orders are handled by the engine

3. **Consistent Indicator Calculation**: TA-Lib uses standard formulas:
   - RSI: Wilder's smoothed RSI
   - EMA: Exponential moving average with standard alpha
   - MACD: 12/26/9 periods by default

4. **Reproducible Results**: Same strategy + same data = same results every time.

---

## Execution Flow Diagram

```
For each bar (i = 1 to N):
    │
    ├─► If in position:
    │   │
    │   ├─► Check Stop Loss: price <= entry * (1 - SL%)
    │   │   └─► If hit: CLOSE position, record loss
    │   │
    │   ├─► Check Take Profit: price >= entry * (1 + TP%)
    │   │   └─► If hit: CLOSE position, record profit
    │   │
    │   └─► Evaluate exit_logic tree at bar i
    │       └─► If TRUE: CLOSE position
    │
    └─► If not in position:
        │
        └─► Evaluate entry_logic tree at bar i
            └─► If TRUE: OPEN position with SL/TP orders
```

---

## Output Format

```json
{
  "trades": [
    {
      "entryDate": "2024-01-15",
      "entryPrice": 75200.0,
      "exitDate": "2024-01-22",
      "exitPrice": 78500.0,
      "profit": 3300.0,
      "profitPct": 0.0439,
      "type": "LONG",
      "status": "CLOSED"
    }
  ],
  "finalEquity": 11250.0,
  "initialEquity": 10000.0,
  "metrics": {
    "totalReturn": 0.125,
    "winRate": 0.65,
    "maxDrawdown": -0.08,
    "sharpeRatio": 1.45,
    "tradesCount": 15
  },
  "equityCurve": [
    {"date": "2024-01-01", "equity": 10000.0},
    {"date": "2024-01-02", "equity": 10050.0}
  ],
  "priceData": [...]
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `schemas/visual_backtest.py` | Pydantic models for strategy JSON validation |
| `services/backtest_engine.py` | Main backtesting engine using backtesting.py |
| `services/strategy_engine.py` | Legacy backtest engine (manual loop) |
| `services/calc_service.py` | TA-Lib indicator calculations |
| `api/v1/endpoints/backtest.py` | REST API endpoint |

---

## Supported Indicators

| Category | Indicators |
|----------|------------|
| **Moving Averages** | SMA, EMA |
| **Momentum** | RSI, MACD, MACD_SIGNAL, MACD_HIST, STOCH_K, STOCH_D |
| **Volatility** | ATR, BB_UPPER, BB_MIDDLE, BB_LOWER |
| **Price** | PRICE (close), OPEN, HIGH, LOW, VOLUME, PREV_HIGH, PREV_LOW |
| **Pivot Points** | CPR_PIVOT, CPR_TC, CPR_BC |
| **External** | USDINR |

---

## Comparators

| Comparator | Symbol | Description |
|------------|--------|-------------|
| GREATER_THAN | `>` | A > B |
| LESS_THAN | `<` | A < B |
| EQUALS | `==` | A ≈ B (within 0.01) |
| CROSSES_ABOVE | `CROSS_ABOVE` | A was ≤ B, now A > B |
| CROSSES_BELOW | `CROSS_BELOW` | A was ≥ B, now A < B |
