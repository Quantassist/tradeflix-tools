import { apiClient } from "../api-client"
import type { ArbitrageRequest, ArbitrageResponse } from "@/types"

export const arbitrageApi = {
  calculate: async (data: ArbitrageRequest): Promise<ArbitrageResponse> => {
    return apiClient.post("/arbitrage/calculate", data)
  },

  getRealtime: async (commodity: string): Promise<{
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
      signal: string
    }
    profit_analysis: {
      gross_profit: number
      net_profit: number
      net_profit_percent: number
    }
    recommendation: string
    risk_level: string
    data_sources: {
      comex: string
      mcx: string
      usdinr: string
    }
  }> => {
    return apiClient.get(`/arbitrage/realtime?symbol=${commodity}`)
  },

  getSensitivity: async (
    commodity: string,
    comexPriceUsd: number,
    currentUsdinr: number,
    usdinrChange: number,
    contractSize: number = 10
  ): Promise<{
    analysis: {
      current_usdinr: number
      new_usdinr: number
      usdinr_change: number
      current_fair_value: number
      new_fair_value: number
      fair_value_change: number
      fair_value_change_percent: number
    }
    interpretation: {
      impact_per_rupee: number
      direction: string
      magnitude: string
    }
  }> => {
    return apiClient.post(
      `/arbitrage/sensitivity?comex_price_usd=${comexPriceUsd}&current_usdinr=${currentUsdinr}&usdinr_change=${usdinrChange}&contract_size=${contractSize}`
    )
  },

  getHistory: async (
    symbol: string = "GOLD",
    days: number = 30,
    maxPoints: number = 500
  ): Promise<{
    symbol: string
    days: number
    data_count: number
    total_points?: number
    downsampled?: boolean
    data: Array<{
      recorded_at: string
      comex_price_usd: number
      mcx_price_inr: number
      usdinr_rate: number
      fair_value_inr: number
      premium: number
      premium_percent: number
      signal: string
      z_score: number | null
      percentile: number | null
    }>
    statistics: {
      average_premium_percent: number
      std_deviation: number
      min_premium_percent: number
      max_premium_percent: number
      signal_distribution: Record<string, number>
    } | null
    message?: string
  }> => {
    return apiClient.get(`/arbitrage/history?symbol=${symbol}&days=${days}&max_points=${maxPoints}`)
  },

  recordHistory: async (symbol: string = "GOLD"): Promise<{
    message: string
    id: number
    symbol: string
    recorded_at: string
    premium_percent: number
  }> => {
    return apiClient.post(`/arbitrage/history/record?symbol=${symbol}`)
  },
}
