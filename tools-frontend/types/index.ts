// Common types
export type TimeFrame = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y"

// ============================================================================
// Visual Strategy Builder Types (Recursive Tree Structure)
// ============================================================================

export type StrategyAsset = "GOLD" | "SILVER" | "PLATINUM" | "PALLADIUM"

export enum StrategyIndicatorType {
  // Moving Averages
  SMA = "SMA",
  EMA = "EMA",
  // Momentum Indicators
  RSI = "RSI",
  MACD = "MACD",
  MACD_SIGNAL = "MACD_SIGNAL",
  MACD_HIST = "MACD_HIST",
  STOCH_K = "STOCH_K",
  STOCH_D = "STOCH_D",
  // Volatility Indicators
  ATR = "ATR",
  BB_UPPER = "BB_UPPER",
  BB_MIDDLE = "BB_MIDDLE",
  BB_LOWER = "BB_LOWER",
  // Price Data
  PRICE = "PRICE",
  OPEN = "OPEN",
  HIGH = "HIGH",
  LOW = "LOW",
  VOLUME = "VOLUME",
  PREV_HIGH = "PREV_HIGH",
  PREV_LOW = "PREV_LOW",
  // External Data
  USDINR = "USDINR",
  // Pivot Points
  CPR_PIVOT = "CPR_PIVOT",
  CPR_TC = "CPR_TC",
  CPR_BC = "CPR_BC",
  // Seasonal Indicators
  MONTH = "MONTH",
  DAY_OF_MONTH = "DAY_OF_MONTH",
  DAY_OF_YEAR = "DAY_OF_YEAR",
  DAYS_TO_EVENT = "DAYS_TO_EVENT",
  DAYS_FROM_EVENT = "DAYS_FROM_EVENT",
  IS_EVENT_WINDOW = "IS_EVENT_WINDOW",
  IS_FAVORABLE_MONTH = "IS_FAVORABLE_MONTH",
}

export enum StrategyComparator {
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  EQUALS = "EQUALS",
  CROSSES_ABOVE = "CROSSES_ABOVE",
  CROSSES_BELOW = "CROSSES_BELOW",
}

export type IndicatorConfig = {
  type: StrategyIndicatorType | string  // Allow string for dynamic seasonal types
  period?: number
  source?: "close" | "open" | "high" | "low"
  event?: string  // For seasonal event-based indicators (DAYS_TO_EVENT, etc.)
}

export type StrategyCondition = {
  id: string
  type: "CONDITION"
  left: IndicatorConfig
  comparator: StrategyComparator | string  // Allow string for dynamic comparators
  right?: IndicatorConfig  // Optional when using static value
  value?: number // Static value override (when comparing to a fixed number)
}

export type LogicGroup = {
  id: string
  type: "GROUP"
  operator: "AND" | "OR"
  children: StrategyNode[]
}

export type StrategyNode = StrategyCondition | LogicGroup

export type VisualStrategy = {
  id: string
  name: string
  asset: StrategyAsset
  entryLogic: LogicGroup
  exitLogic: LogicGroup
  stopLossPct: number
  takeProfitPct: number
}

// Candle data with dynamic indicator values
export type Candle = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  usdinr?: number
  [key: string]: string | number | undefined
}

// Visual backtest trade
export type VisualBacktestTrade = {
  entryDate: string
  entryPrice: number
  exitDate?: string
  exitPrice?: number
  profit?: number
  profitPct?: number
  type: "LONG" | "SHORT"
  status: "OPEN" | "CLOSED"
}

// Visual backtest metrics
export type VisualBacktestMetrics = {
  totalReturn: number
  winRate: number
  maxDrawdown: number
  sharpeRatio: number
  tradesCount: number
}

// Visual backtest result
export type VisualBacktestResult = {
  trades: VisualBacktestTrade[]
  finalEquity: number
  initialEquity: number
  metrics: VisualBacktestMetrics
  equityCurve: { date: string; equity: number }[]
  priceData: Candle[]
}

// Visual backtest request
export type VisualBacktestRequest = {
  strategy: VisualStrategy
  startDate?: string
  endDate?: string
  initialCapital?: number
}

// ============================================================================
// Legacy Backtesting Types (kept for backward compatibility)
// ============================================================================

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
  // Retracement levels
  level_0: number
  level_236: number
  level_382: number
  level_500: number
  level_618: number
  level_786: number
  level_100: number
  // Extension levels
  ext_1272?: number
  ext_1618?: number
  ext_2000?: number
  ext_2618?: number
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

// Multi-timeframe pivot types
export type TimeframePivotData = {
  ohlc: OHLCInput
  ohlc_date: string
  cpr: CPRLevels
  floor_pivots: FloorPivotLevels
  fibonacci: FibonacciLevels
}

export type ConfluenceLevel = {
  name: string
  value: number
  timeframe: string
}

export type ConfluenceZone = {
  value: number
  strength: number
  levels: ConfluenceLevel[]
  description: string
}

export type NearestConfluence = ConfluenceZone & {
  distance: number
  distance_percent: number
}

export type MultiTimeframePivotResponse = {
  symbol: string
  exchange: string
  current_price: number
  timeframes: {
    daily: TimeframePivotData
    weekly: TimeframePivotData
    monthly: TimeframePivotData
  }
  confluence_zones: ConfluenceZone[]
  nearest_confluence: NearestConfluence | null
  market_bias: string
}

// Pivot Accuracy Types
export type LevelAccuracy = {
  times_tested: number
  times_respected: number
  accuracy_percent: number
  avg_rejection_distance: number
}

export type CPRStatistics = {
  narrow_cpr_days: number
  wide_cpr_days: number
  normal_cpr_days: number
  narrow_cpr_trending_accuracy: number
  wide_cpr_range_accuracy: number
}

export type PivotAccuracyResponse = {
  symbol: string
  timeframe: string
  period_analyzed: string
  total_sessions: number
  level_accuracy: Record<string, LevelAccuracy>
  cpr_statistics: CPRStatistics
  best_performing_levels: string[]
  notes: string
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

// Rolling Correlation Types
export type RollingCorrelationRequest = {
  asset1: string
  asset2: string
  window_days: number
  period_days: number
}

export type RollingCorrelationPoint = {
  date: string
  correlation: number
  strength: string
}

export type RollingCorrelationResponse = {
  asset1: string
  asset2: string
  window_days: number
  period_days: number
  data_points: RollingCorrelationPoint[]
  current_correlation: number
  avg_correlation: number
  max_correlation: number
  min_correlation: number
}

// Beta Calculation Types
export type BetaCalculationRequest = {
  asset: string
  benchmark: string
  period_days: number
}

export type BetaCalculationResponse = {
  asset: string
  benchmark: string
  period_days: number
  beta: number
  alpha: number
  r_squared: number
  correlation: number
  interpretation: string
  volatility_ratio: number
}

// Diversification Analysis Types
export type DiversificationAnalysisRequest = {
  assets: string[]
  period_days: number
}

export type DiversificationScore = {
  portfolio_assets: string[]
  avg_correlation: number
  max_correlation: number
  min_correlation: number
  diversification_score: number
  rating: string
  recommendations: string[]
}

// Correlation Breakdown Types
export type CorrelationBreakdownResponse = {
  asset_pair: { asset1: string; asset2: string }
  period_days: number
  correlation: number
  strength: string
  direction: string
  p_value: number
  confidence_interval_lower: number
  confidence_interval_upper: number
  asset1_volatility: number
  asset2_volatility: number
  asset1_return: number
  asset2_return: number
  covariance: number
  sample_size: number
  interpretation: string
}

// Multi-Period Correlation Types
export type MultiPeriodCorrelationRequest = {
  asset1: string
  asset2: string
  periods: number[]
}

export type PeriodCorrelation = {
  period_days: number
  correlation: number
  strength: string
  start_date: string
  end_date: string
}

export type MultiPeriodCorrelationResponse = {
  asset1: string
  asset2: string
  periods: PeriodCorrelation[]
  trend: string
  interpretation: string
}

// Divergence Detection Types
export type DivergenceRequest = {
  asset1: string
  asset2: string
  period_days: number
  lookback_days: number
}

export type DivergenceResponse = {
  asset1: string
  asset2: string
  period_days: number
  lookback_days: number
  beta: number
  correlation: number
  has_divergence: boolean
  divergence_score: number
  z_score: number
  expected_move: number
  actual_move: number
  divergence_pct: number
  signal: string
  interpretation: string
}

// Lead-Lag Analysis Types
export type LeadLagResponse = {
  asset1: string
  asset2: string
  leading_asset: string | null
  lag_periods: number
  lag_direction: number
  correlation_at_lag: number
  correlation_at_zero: number
  all_lag_correlations: Record<number, number>
  interpretation: string
}

// Trading Signals Types
export type TradingSignal = {
  type: string
  signal: string
  strength: string
  reason: string
}

export type TradingSignalsResponse = {
  asset1: string
  asset2: string
  period_days: number
  correlation: number
  beta: number
  divergence: DivergenceResponse
  lead_lag: LeadLagResponse
  overall_signal: string
  confidence: string
  signals: TradingSignal[]
  signal_count: number
  summary: string
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

// ============================================================================
// Disaggregated COT Types
// ============================================================================

export type SentimentLevel = "extreme_bear" | "bearish" | "neutral" | "bullish" | "extreme_bull"

export type DisaggregatedPositionData = {
  report_date: string
  market_name: string | null
  commodity_name: string | null
  commodity_group: string | null
  open_interest: number
  // Producer/Merchant (Commercials)
  producer_merchant_long: number
  producer_merchant_short: number
  producer_merchant_net: number
  producer_merchant_pct_long: number | null
  producer_merchant_pct_short: number | null
  // Swap Dealers
  swap_dealer_long: number
  swap_dealer_short: number
  swap_dealer_spread: number
  swap_dealer_net: number
  swap_dealer_pct_long: number | null
  swap_dealer_pct_short: number | null
  // Managed Money
  managed_money_long: number
  managed_money_short: number
  managed_money_spread: number
  managed_money_net: number
  managed_money_pct_long: number | null
  managed_money_pct_short: number | null
  // Other Reportables
  other_reportables_long: number
  other_reportables_short: number
  other_reportables_spread: number
  other_reportables_net: number
  other_reportables_pct_long: number | null
  other_reportables_pct_short: number | null
  // Non-Reportables (Small Traders)
  non_reportables_long: number
  non_reportables_short: number
  non_reportables_net: number
  non_reportables_pct_long: number | null
  non_reportables_pct_short: number | null
}

export type WeeklyChange = {
  change_open_interest: number
  change_prod_merc_long: number
  change_prod_merc_short: number
  change_swap_long: number
  change_swap_short: number
  change_m_money_long: number
  change_m_money_short: number
  change_other_rept_long: number
  change_other_rept_short: number
  change_nonrept_long: number
  change_nonrept_short: number
  change_prod_merc_net: number
  change_swap_net: number
  change_m_money_net: number
  change_other_rept_net: number
  change_nonrept_net: number
}

export type CategoryPercentile = {
  category: string
  current_net: number
  percentile_1y: number
  percentile_3y: number | null
  cot_index: number
  is_extreme: boolean
  extreme_type: string | null
  sentiment: SentimentLevel
}

export type SentimentGauge = {
  category: string
  sentiment: SentimentLevel
  percentile: number
  net_position: number
  four_week_change: number
  consecutive_weeks_direction: number
  description: string
}

export type DisaggCOTAnalysisResponse = {
  commodity: string
  market_name: string | null
  latest_report_date: string
  data_as_of_date: string
  weeks_analyzed: number
  current_positions: DisaggregatedPositionData
  weekly_changes: WeeklyChange
  producer_merchant_percentile: CategoryPercentile
  swap_dealer_percentile: CategoryPercentile
  managed_money_percentile: CategoryPercentile
  other_reportables_percentile: CategoryPercentile
  non_reportables_percentile: CategoryPercentile
  managed_money_sentiment: SentimentGauge
  producer_merchant_sentiment: SentimentGauge
  signal: COTSignal
  avg_managed_money_net: number
  avg_producer_merchant_net: number
}

export type DisaggCOTHistoricalResponse = {
  commodity: string
  market_name: string | null
  start_date: string
  end_date: string
  data_points: DisaggregatedPositionData[]
  total_weeks: number
}

export type NetPositionTimeSeries = {
  dates: string[]
  producer_merchant_net: number[]
  swap_dealer_net: number[]
  managed_money_net: number[]
  other_reportables_net: number[]
  non_reportables_net: number[]
  open_interest: number[]
}

export type LongShortTimeSeries = {
  dates: string[]
  producer_merchant_long: number[]
  producer_merchant_short: number[]
  swap_dealer_long: number[]
  swap_dealer_short: number[]
  managed_money_long: number[]
  managed_money_short: number[]
  other_reportables_long: number[]
  other_reportables_short: number[]
  non_reportables_long: number[]
  non_reportables_short: number[]
}

export type COTChartDataResponse = {
  commodity: string
  market_name: string | null
  net_positions: NetPositionTimeSeries
  long_short_positions: LongShortTimeSeries
}

export type ExtremePositioningAlert = {
  commodity: string
  report_date: string
  category: string
  net_position: number
  percentile: number
  extreme_type: string
  deviation_from_avg: number
  deviation_pct: number
  historical_context: string
  potential_reversal: boolean
  suggested_action: string
}

export type COTTradingSignal = {
  signal_type: string
  signal: string
  confidence: string
  managed_money_percentile: number
  producer_merchant_percentile: number
  managed_money_4wk_change: number
  reasoning: string
  historical_accuracy: string | null
}

export type AvailableCommodity = {
  commodity_name: string
  market_name: string
  commodity_group: string | null
  commodity_subgroup: string | null
  latest_report_date: string
  total_reports: number
}

// ============================================================================
// Advanced COT Analytics Types
// ============================================================================

export type FlowComponent = {
  new_longs: number
  long_liquidation: number
  new_shorts: number
  short_covering: number
  net_flow: number
  dominant_flow: string
  interpretation: string
}

export type FlowDecompositionData = {
  report_date: string
  producer_merchant: FlowComponent
  swap_dealer: FlowComponent
  managed_money: FlowComponent
  other_reportables: FlowComponent
}

export type FlowDecompositionResponse = {
  commodity: string
  weeks_analyzed: number
  current_week: FlowDecompositionData
  historical_data: FlowDecompositionData[]
  summary: string
}

export type ParticipationMetrics = {
  category: string
  total_long_positions: number
  total_short_positions: number
  traders_long: number
  traders_short: number
  avg_contracts_per_trader_long: number
  avg_contracts_per_trader_short: number
  trader_count_change: number
  is_whale_driven: boolean
  participation_trend: string
  interpretation: string
}

export type ParticipationResponse = {
  commodity: string
  report_date: string
  metrics: ParticipationMetrics[]
  overall_participation: string
  whale_alert: string | null
}

export type ConcentrationMetrics = {
  side: string
  top_4_gross: number
  top_8_gross: number
  top_4_net: number
  top_8_net: number
  concentration_ratio: number
  is_concentrated: boolean
  percentile_vs_history: number
}

export type ConcentrationResponse = {
  commodity: string
  report_date: string
  long_concentration: ConcentrationMetrics
  short_concentration: ConcentrationMetrics
  crowding_score: number
  crowding_level: string
  interpretation: string
  historical_context: string
}

export type SqueezeRiskMetrics = {
  squeeze_type: string
  risk_score: number
  risk_level: string
  spec_positioning_factor: number
  concentration_factor: number
  commercial_positioning_factor: number
  retail_factor: number
  managed_money_percentile: number
  concentration_top_4: number
  commercial_net_direction: string
  non_reportable_bias: string
  interpretation: string
  historical_precedent: string | null
}

export type SqueezeRiskResponse = {
  commodity: string
  report_date: string
  long_squeeze_risk: SqueezeRiskMetrics
  short_squeeze_risk: SqueezeRiskMetrics
  dominant_risk: string
  overall_vulnerability: string
  suggested_action: string
}

export type AdvancedCOTSummary = {
  commodity: string
  report_date: string
  crowding_score: number
  squeeze_risk_score: number
  flow_momentum_score: number
  concentration_score: number
  alerts: string[]
  current_regime: string
  regime_confidence: number
  primary_insight: string
  suggested_action: string
}

// ============================================================================
// Priority 2: Curve, Spread, and Herding Types
// ============================================================================

export type CurveBucketPositioning = {
  category: string
  front_long: number
  front_short: number
  front_net: number
  front_spread: number
  back_long: number
  back_short: number
  back_net: number
  back_spread: number
  front_pct_of_total: number
  curve_bias: string
  curve_bias_score: number
  interpretation: string
}

export type CurveAnalysisResponse = {
  commodity: string
  report_date: string
  total_oi: number
  front_oi: number
  back_oi: number
  front_oi_pct: number
  positioning: CurveBucketPositioning[]
  roll_stress_score: number
  roll_stress_level: string
  curve_summary: string
  roll_warning: string | null
}

export type SpreadDirectionalBreakdown = {
  category: string
  directional_long: number
  directional_short: number
  directional_net: number
  spread_positions: number
  spread_pct_of_total: number
  directional_pct_of_total: number
  exposure_type: string
  interpretation: string
}

export type SpreadAnalysisResponse = {
  commodity: string
  report_date: string
  breakdown: SpreadDirectionalBreakdown[]
  total_spread_positions: number
  total_directional_positions: number
  market_spread_ratio: number
  market_mode: string
  mode_strength: string
  spread_change_wow: number
  directional_change_wow: number
  interpretation: string
}

export type HerdingType = 
  | "broad_herding"
  | "oligopoly"
  | "dispersed"
  | "capitulation"
  | "normal"

export type HerdingMetrics = {
  category: string
  traders_long: number
  traders_short: number
  total_traders: number
  trader_count_change: number
  net_position: number
  avg_position_size: number
  long_short_trader_ratio: number
  position_per_trader_percentile: number
  herding_type: HerdingType
  herding_intensity: number
  interpretation: string
}

export type HerdingAnalysisResponse = {
  commodity: string
  report_date: string
  categories: HerdingMetrics[]
  overall_herding_score: number
  overall_herding_type: HerdingType
  smart_money_direction: string
  crowd_direction: string
  divergence_detected: boolean
  herding_alert: string | null
  interpretation: string
}

// ============================================================================
// Priority 3: Cross-Market, Volatility, and ML Regime Types
// ============================================================================

export type SpeculativePressureItem = {
  commodity: string
  commodity_group: string | null
  report_date: string
  managed_money_net: number
  commercial_net: number
  open_interest: number
  spec_pressure: number
  spec_pressure_percentile: number
  mm_percentile: number
  commercial_percentile: number
  crowding_level: string
  pressure_change: number
  pressure_direction: string
}

export type SectorPressure = {
  sector: string
  avg_pressure: number
  commodities_count: number
}

export type CrossMarketPressureResponse = {
  report_date: string
  commodities_analyzed: number
  most_crowded_long: SpeculativePressureItem[]
  most_crowded_short: SpeculativePressureItem[]
  sector_pressure: SectorPressure[]
  rotation_into: string[]
  rotation_out_of: string[]
  avg_spec_pressure: number
  market_sentiment: string
  interpretation: string
}

export type VolatilityRegimeMetrics = {
  commodity: string
  report_date: string
  gross_positions: number
  gross_positions_percentile: number
  gross_positions_change_4wk: number
  spread_ratio: number
  spread_ratio_percentile: number
  concentration_score: number
  implied_vol_regime: string
  vol_regime_score: number
  vol_skew: string
  interpretation: string
}

export type VolRegimeHistoryItem = {
  date: string
  regime: string
  score: number
}

export type VolatilityAnalysisResponse = {
  commodity: string
  report_date: string
  current_metrics: VolatilityRegimeMetrics
  vol_regime_history: VolRegimeHistoryItem[]
  vol_alert: string | null
  interpretation: string
}

export type MLRegimeFeatures = {
  mm_net_percentile: number
  commercial_net_percentile: number
  nonrept_net_percentile: number
  mm_4wk_flow: number
  commercial_4wk_flow: number
  concentration_score: number
  spread_ratio: number
  herding_score: number
  front_back_ratio: number
  gross_positions_percentile: number
}

export type MLRegimeType =
  | "trend_following"
  | "mean_reversion"
  | "accumulation"
  | "distribution"
  | "capitulation"
  | "consolidation"
  | "breakout_setup"

export type FeatureImportance = {
  feature: string
  importance: number
  value: number
}

export type RegimeTransition = {
  regime: string
  probability: number
}

export type MLRegimeClassification = {
  commodity: string
  report_date: string
  primary_regime: MLRegimeType
  primary_confidence: number
  secondary_regime: MLRegimeType | null
  secondary_confidence: number | null
  top_features: FeatureImportance[]
  regime_description: string
  typical_duration_weeks: number
  typical_outcome: string
  historical_win_rate: number | null
  avg_move_after_4wk: number | null
  likely_next_regimes: RegimeTransition[]
  suggested_strategy: string
  risk_level: string
}

export type MLRegimeHistoryItem = {
  report_date: string
  regime: MLRegimeType
  confidence: number
  mm_percentile: number
  commercial_percentile: number
}

export type MLRegimeAnalysisResponse = {
  commodity: string
  report_date: string
  current_regime: MLRegimeClassification
  features: MLRegimeFeatures
  regime_history: MLRegimeHistoryItem[]
  regime_duration_current: number
  regime_distribution: Record<string, number>
  interpretation: string
}
