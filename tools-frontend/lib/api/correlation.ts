import { apiClient } from "../api-client"
import type { 
  CorrelationRequest, 
  CorrelationMatrixResponse,
  RollingCorrelationResponse,
  BetaCalculationResponse,
  DiversificationScore,
  CorrelationBreakdownResponse,
  MultiPeriodCorrelationResponse,
  PeriodCorrelation,
  DivergenceResponse,
  TradingSignalsResponse
} from "@/types"

export const correlationApi = {
  getMatrix: async (data: CorrelationRequest): Promise<CorrelationMatrixResponse> => {
    return apiClient.post("/correlation/matrix", data)
  },

  getRolling: async (asset1: string, asset2: string, windowDays: number, periodDays: number): Promise<RollingCorrelationResponse> => {
    return apiClient.post("/correlation/rolling", {
      asset1,
      asset2,
      window_days: windowDays,
      period_days: periodDays,
    })
  },

  getBeta: async (asset: string, benchmark: string, periodDays: number): Promise<BetaCalculationResponse> => {
    return apiClient.post("/correlation/beta", {
      asset,
      benchmark,
      period_days: periodDays,
    })
  },

  getDiversification: async (assets: string[], periodDays: number): Promise<DiversificationScore> => {
    return apiClient.post("/correlation/diversification", {
      assets,
      period_days: periodDays,
    })
  },

  getBreakdown: async (asset1: string, asset2: string, periodDays: number): Promise<CorrelationBreakdownResponse> => {
    return apiClient.get(
      `/correlation/breakdown?asset1=${asset1}&asset2=${asset2}&period_days=${periodDays}`
    )
  },

  // Multi-period comparison (calls matrix endpoint multiple times)
  getMultiPeriodComparison: async (asset1: string, asset2: string, periods: number[] = [30, 90, 180, 365]): Promise<MultiPeriodCorrelationResponse> => {
    const periodResults: PeriodCorrelation[] = []
    
    for (const period of periods) {
      try {
        const result = await apiClient.post("/correlation/matrix", {
          assets: [asset1, asset2],
          period_days: period,
        }) as CorrelationMatrixResponse
        
        const pair = result.correlations[0]
        periodResults.push({
          period_days: period,
          correlation: pair?.correlation ?? 0,
          strength: pair?.strength ?? "unknown",
          start_date: result.start_date,
          end_date: result.end_date,
        })
      } catch (error) {
        console.error(`Failed to fetch ${period}-day correlation:`, error)
        // Skip this period if it fails
      }
    }
    
    if (periodResults.length === 0) {
      throw new Error("Failed to fetch correlation data for any period")
    }

    // Determine trend
    const correlations = periodResults.map(p => p.correlation)
    const shortTerm = correlations[0] ?? 0
    const longTerm = correlations[correlations.length - 1] ?? 0
    const diff = shortTerm - longTerm

    let trend = "stable"
    let interpretation = ""
    if (Math.abs(diff) > 0.15) {
      trend = diff > 0 ? "strengthening" : "weakening"
      interpretation = diff > 0 
        ? `Correlation is currently stronger than historical average (${shortTerm.toFixed(2)} vs ${longTerm.toFixed(2)}). This may indicate a temporary regime.`
        : `Correlation is currently weaker than historical average (${shortTerm.toFixed(2)} vs ${longTerm.toFixed(2)}). Watch for potential mean reversion.`
    } else {
      interpretation = `Correlation is stable across timeframes (${shortTerm.toFixed(2)} short-term vs ${longTerm.toFixed(2)} long-term). Relationship is consistent.`
    }

    return {
      asset1,
      asset2,
      periods: periodResults,
      trend,
      interpretation,
    }
  },

  // Divergence detection
  getDivergence: async (asset1: string, asset2: string, periodDays: number = 90, lookbackDays: number = 30): Promise<DivergenceResponse> => {
    return apiClient.post("/correlation/divergence", {
      asset1,
      asset2,
      period_days: periodDays,
      lookback_days: lookbackDays,
    })
  },

  // Trading signals
  getTradingSignals: async (asset1: string, asset2: string, periodDays: number = 90, lookbackDays: number = 30): Promise<TradingSignalsResponse> => {
    return apiClient.post("/correlation/signals", {
      asset1,
      asset2,
      period_days: periodDays,
      lookback_days: lookbackDays,
    })
  },
}
