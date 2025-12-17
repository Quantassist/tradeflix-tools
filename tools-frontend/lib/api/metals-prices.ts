import { apiClient } from "../api-client"

export type MetalType = "GOLD" | "SILVER" | "PLATINUM" | "PALLADIUM"
export type CurrencyType = "USD" | "INR"

export interface PriceDataPoint {
  date: string
  price: number
  usd_inr_rate: number | null
}

export interface PriceRangeResponse {
  metal: MetalType
  currency: CurrencyType
  start_date: string
  end_date: string
  prices: PriceDataPoint[]
  count: number
}

export interface EventImpact {
  has_data: boolean
  error?: string
  avg_price_before?: number
  avg_price_during?: number
  avg_price_after?: number
  change_before_to_during?: number
  change_during_to_after?: number
  change_7d?: number
  max_gain?: number
  max_loss?: number
  volatility?: number
  volatility_before?: number
  volatility_after?: number
  data_points?: number
}

export interface YearlyPerformance {
  year: number
  event_date: string
  change_7d: number
  pre_event_change: number
  post_event_change: number
  max_gain: number
  max_loss: number
  volatility: number
  avg_price_before: number
  avg_price_after: number
}

export interface HistoricalPerformance {
  has_data: boolean
  error?: string
  occurrences?: number
  avg_change_7d?: number
  median_change_7d?: number
  std_dev?: number
  avg_max_gain?: number
  avg_max_loss?: number
  avg_volatility?: number
  win_rate?: number
  best_return?: number
  worst_return?: number
  best_year?: number
  worst_year?: number
  yearly_data?: YearlyPerformance[]
}

export interface MonthlySeasonality {
  month: number
  month_name: string
  avg_return: number
  median_return: number
  std_dev: number
  win_rate: number
  best_return: number
  worst_return: number
  occurrences: number
}

export interface SeasonalEventAnalysis {
  name: string
  event_type: string
  month: number
  day: number
  is_lunar_based: boolean
  avg_price_change: number
  win_rate: number
  occurrences: number
  best_return: number
  worst_return: number
  avg_volatility: number
  // Volatility analysis fields
  volatility_increase_pct: number
  normal_volatility: number
  event_volatility: number
  yearly_data: YearlyPerformance[]
}

export interface DataStats {
  min_date: string | null
  max_date: string | null
  total_records: number
}

// New interfaces for additional features
export interface TrajectoryPoint {
  day: number
  avg_return: number
  std_dev: number
  upper_band: number
  lower_band: number
  occurrences: number
}

export interface EventTrajectory {
  has_data: boolean
  trajectory: TrajectoryPoint[]
  years_analyzed: number
}

export interface UpcomingAlert {
  event_name: string
  event_type: string
  event_date: string
  days_until: number
  alert_type: "opportunity" | "caution"
  message: string
  avg_change: number
  win_rate: number
  best_return: number
  worst_return: number
  occurrences: number
}

export interface VolatilityAnalysis {
  has_data: boolean
  avg_normal_volatility: number
  avg_pre_event_volatility: number
  avg_event_week_volatility: number
  avg_post_event_volatility: number
  pre_event_volatility_increase_pct: number
  event_week_volatility_increase_pct: number
  post_event_volatility_increase_pct: number
  years_analyzed: number
}

export interface CalendarHeatmapDay {
  month: number
  day: number
  avg_return: number
  win_rate: number
  occurrences: number
  best_return: number
  worst_return: number
}

export interface RecessionPeriod {
  name: string
  type: string
  start_date: string
  end_date: string
  duration_days?: number
  price_change_pct?: number
  max_gain_pct?: number
  max_drawdown_pct?: number
  volatility?: number
  start_price?: number
  end_price?: number
  data_points?: number
  has_data: boolean
  error?: string
}

export interface RecessionIndicatorsResponse {
  metal: MetalType
  currency: CurrencyType
  recession_periods: RecessionPeriod[]
  summary: {
    total_periods: number
    periods_with_data: number
    avg_price_change: number
    positive_periods: number
    positive_rate: number
    avg_volatility: number
    best_period: string | null
    best_return: number | null
    worst_period: string | null
    worst_return: number | null
  }
}

export const metalsPricesApi = {
  // Get data statistics
  getStats: async (): Promise<DataStats> => {
    return apiClient.get("/metals-prices/stats")
  },

  // Get prices for a date range
  getPrices: async (
    startDate: string,
    endDate: string,
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR"
  ): Promise<PriceRangeResponse> => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metal,
      currency,
    })
    return apiClient.get(`/metals-prices/prices?${params.toString()}`)
  },

  // Get event impact
  getEventImpact: async (
    eventDate: string,
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    daysBefore: number = 7,
    daysAfter: number = 7
  ): Promise<{ event_date: string; metal: MetalType; currency: CurrencyType; impact: EventImpact }> => {
    const params = new URLSearchParams({
      event_date: eventDate,
      metal,
      currency,
      days_before: daysBefore.toString(),
      days_after: daysAfter.toString(),
    })
    return apiClient.get(`/metals-prices/event-impact?${params.toString()}`)
  },

  // Get historical performance for an event
  getHistoricalPerformance: async (
    eventMonth: number,
    eventDay: number,
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10,
    daysBefore: number = 7,
    daysAfter: number = 7
  ): Promise<{ performance: HistoricalPerformance }> => {
    const params = new URLSearchParams({
      event_month: eventMonth.toString(),
      event_day: eventDay.toString(),
      metal,
      currency,
      years_back: yearsBack.toString(),
      days_before: daysBefore.toString(),
      days_after: daysAfter.toString(),
    })
    return apiClient.get(`/metals-prices/historical-performance?${params.toString()}`)
  },

  // Get monthly seasonality
  getMonthlySeasonality: async (
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10
  ): Promise<{ monthly_data: MonthlySeasonality[] }> => {
    const params = new URLSearchParams({
      metal,
      currency,
      years_back: yearsBack.toString(),
    })
    return apiClient.get(`/metals-prices/monthly-seasonality?${params.toString()}`)
  },

  // Get seasonal events analysis with configurable window
  getSeasonalEventsAnalysis: async (
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10,
    daysBefore: number = 7,
    daysAfter: number = 7
  ): Promise<{ events: SeasonalEventAnalysis[]; total_events: number; days_before: number; days_after: number }> => {
    const params = new URLSearchParams({
      metal,
      currency,
      years_back: yearsBack.toString(),
      days_before: daysBefore.toString(),
      days_after: daysAfter.toString(),
    })
    return apiClient.get(`/metals-prices/seasonal-events-analysis?${params.toString()}`)
  },

  // Get event trajectory (cumulative returns around event)
  getEventTrajectory: async (
    eventMonth: number,
    eventDay: number,
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10,
    daysBefore: number = 10,
    daysAfter: number = 10
  ): Promise<EventTrajectory & { metal: MetalType; currency: CurrencyType }> => {
    const params = new URLSearchParams({
      event_month: eventMonth.toString(),
      event_day: eventDay.toString(),
      metal,
      currency,
      years_back: yearsBack.toString(),
      days_before: daysBefore.toString(),
      days_after: daysAfter.toString(),
    })
    return apiClient.get(`/metals-prices/event-trajectory?${params.toString()}`)
  },

  // Get upcoming event alerts
  getUpcomingAlerts: async (
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10,
    alertDays: number = 30
  ): Promise<{ alerts: UpcomingAlert[]; total_alerts: number }> => {
    const params = new URLSearchParams({
      metal,
      currency,
      years_back: yearsBack.toString(),
      alert_days: alertDays.toString(),
    })
    return apiClient.get(`/metals-prices/upcoming-alerts?${params.toString()}`)
  },

  // Get volatility analysis for an event
  getVolatilityAnalysis: async (
    eventMonth: number,
    eventDay: number,
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10
  ): Promise<VolatilityAnalysis & { metal: MetalType; currency: CurrencyType }> => {
    const params = new URLSearchParams({
      event_month: eventMonth.toString(),
      event_day: eventDay.toString(),
      metal,
      currency,
      years_back: yearsBack.toString(),
    })
    return apiClient.get(`/metals-prices/volatility-analysis?${params.toString()}`)
  },

  // Get multi-metal seasonality comparison
  getMultiMetalSeasonality: async (
    currency: CurrencyType = "INR",
    yearsBack: number = 10
  ): Promise<{ metals: Record<MetalType, MonthlySeasonality[]> }> => {
    const params = new URLSearchParams({
      currency,
      years_back: yearsBack.toString(),
    })
    return apiClient.get(`/metals-prices/multi-metal-seasonality?${params.toString()}`)
  },

  // Get calendar heatmap data
  getCalendarHeatmap: async (
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR",
    yearsBack: number = 10
  ): Promise<{ daily_data: CalendarHeatmapDay[]; total_days: number }> => {
    const params = new URLSearchParams({
      metal,
      currency,
      years_back: yearsBack.toString(),
    })
    return apiClient.get(`/metals-prices/calendar-heatmap?${params.toString()}`)
  },

  // Get recession indicators
  getRecessionIndicators: async (
    metal: MetalType = "GOLD",
    currency: CurrencyType = "INR"
  ): Promise<RecessionIndicatorsResponse> => {
    const params = new URLSearchParams({
      metal,
      currency,
    })
    return apiClient.get(`/metals-prices/recession-indicators?${params.toString()}`)
  },
}
