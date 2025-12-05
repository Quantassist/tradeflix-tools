// Common types
export type TimeFrame = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y"

// Backtesting Types
export type IndicatorType = "RSI" | "MACD" | "SMA" | "EMA" | "BOLLINGER" | "ATR" | "VWAP" | "PIVOT"

export type EntryCondition = {
  indicator: IndicatorType
  operator: ">" | "<" | ">=" | "<=" | "CROSSES_ABOVE" | "CROSSES_BELOW"
  value: number
  timeframe?: string
}

export type ExitCondition = {
  type: "STOP_LOSS" | "TAKE_PROFIT" | "TRAILING_STOP" | "TIME_BASED" | "INDICATOR"
  value: number
  indicator?: IndicatorType
  operator?: ">" | "<" | ">=" | "<="
}

export type PositionSizing = {
  type: "FIXED" | "PERCENTAGE" | "RISK_BASED"
  value: number
}

export type BacktestStrategy = {
  name: string
  description?: string
  symbol: string
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
  entry_conditions: EntryCondition[]
  exit_conditions: ExitCondition[]
  position_sizing: PositionSizing
  initial_capital: number
  commission_percent: number
  slippage_percent: number
}

export type Trade = {
  entry_date: string
  exit_date: string
  entry_price: number
  exit_price: number
  quantity: number
  pnl: number
  pnl_percent: number
  duration_hours: number
  trade_type: "LONG" | "SHORT"
}

export type PerformanceMetrics = {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  profit_factor: number
  total_pnl: number
  total_pnl_percent: number
  avg_win: number
  avg_loss: number
  max_win: number
  max_loss: number
  max_drawdown: number
  max_drawdown_percent: number
  sharpe_ratio: number
  sortino_ratio: number
  cagr: number
  recovery_factor: number
  avg_trade_duration_hours: number
  longest_winning_streak: number
  longest_losing_streak: number
}

export type EquityPoint = {
  date: string
  equity: number
  drawdown: number
  drawdown_percent: number
}

export type MonthlyReturn = {
  month: string
  return_percent: number
  trades: number
}

export type BacktestRequest = {
  strategy: BacktestStrategy
  start_date: string
  end_date: string
}

export type BacktestResponse = {
  strategy_name: string
  symbol: string
  timeframe: string
  start_date: string
  end_date: string
  initial_capital: number
  final_capital: number
  metrics: PerformanceMetrics
  trades: Trade[]
  equity_curve: EquityPoint[]
  monthly_returns: MonthlyReturn[]
}

// Pivot Calculator Types
export type OHLCInput = {
  high: number
  low: number
  close: number
  date?: string
}

export type PivotRequest = {
  symbol: string
  timeframe: string
  ohlc: OHLCInput
  auto_fetch?: boolean
}

export type CPRLevels = {
  pivot: number
  bc: number
  tc: number
  width: number
  width_percent: number
  classification: string
}

export type FloorPivotLevels = {
  pivot: number
  r1: number
  r2: number
  r3: number
  s1: number
  s2: number
  s3: number
}

export type FibonacciLevels = {
  level_0: number
  level_236: number
  level_382: number
  level_500: number
  level_618: number
  level_786: number
  level_100: number
}

export type PivotResponse = {
  symbol: string
  timeframe: string
  date: string
  ohlc: OHLCInput
  cpr: CPRLevels
  floor_pivots: FloorPivotLevels
  fibonacci: FibonacciLevels
  current_price: number | null
  nearest_level: {
    name: string
    value: number
    distance: number
    distance_percent: number
  } | null
}

// Arbitrage Types
export type ArbitrageRequest = {
  comex_price_usd: number
  mcx_price_inr: number
  usdinr_rate: number
  import_duty_percent: number
  contract_size_grams: number
}

export type ArbitrageResponse = {
  timestamp: string
  symbol: string
  fair_value: {
    comex_price_usd: number
    usdinr_rate: number
    price_per_gram_inr: number
    import_duty_percent: number
    fair_value_inr: number
    contract_size_grams: number
  }
  arbitrage: {
    mcx_price: number
    fair_value: number
    premium: number
    premium_percent: number
    z_score: number | null
    percentile: number | null
    signal: string
  }
  profit_analysis: {
    gross_profit: number
    brokerage: number
    exchange_fees: number
    tax: number
    total_costs: number
    net_profit: number
    net_profit_percent: number
  }
  recommendation: string
  risk_level: string
}

// Seasonal Types
export type SeasonalEvent = {
  id: number
  name: string
  start_date: string
  end_date: string
  commodity: string
  event_type: string
  historical_impact: string
  avg_price_change: number
}

export type SeasonalCalendarResponse = {
  year: number
  total_events: number
  events_by_month: Record<string, SeasonalEvent[]>
}

// Correlation Types
export type CorrelationRequest = {
  assets: string[]
  period_days: number
}

export type CorrelationPair = {
  asset1: string
  asset2: string
  correlation: number
  strength: string
  direction: string
  p_value: number | null
  sample_size: number
}

export type CorrelationMatrixResponse = {
  assets: string[]
  period_days: number
  start_date: string
  end_date: string
  correlations: CorrelationPair[]
  matrix: Record<string, Record<string, number>>
}

// COT Types
export type COTRequest = {
  commodity: string
  weeks: number
}

export type COTPositionData = {
  report_date: string
  commercial_long: number
  commercial_short: number
  commercial_net: number
  non_commercial_long: number
  non_commercial_short: number
  non_commercial_net: number
  open_interest: number
}

export type COTPercentileData = {
  current_net_position: number
  percentile_1y: number
  percentile_3y: number
  percentile_5y: number
  is_extreme: boolean
  extreme_level: string | null
}

export type COTSignal = {
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell"
  confidence: "high" | "medium" | "low"
  reasoning: string
  commercial_bias: "bullish" | "bearish" | "neutral"
  speculator_bias: "bullish" | "bearish" | "neutral"
}

export type COTAnalysisResponse = {
  commodity: string
  latest_report_date: string
  weeks_analyzed: number
  current_positions: COTPositionData
  commercial_percentile: COTPercentileData
  non_commercial_percentile: COTPercentileData
  commercial_net_change: number
  non_commercial_net_change: number
  open_interest_change: number
  signal: COTSignal
  avg_commercial_net: number
  avg_non_commercial_net: number
}
