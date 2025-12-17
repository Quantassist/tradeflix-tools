import { apiClient } from "../api-client"
import type { PivotRequest, PivotResponse, MultiTimeframePivotResponse, PivotAccuracyResponse } from "@/types"

export const pivotApi = {
  calculate: async (data: PivotRequest): Promise<PivotResponse> => {
    return apiClient.post("/pivots/calculate", data)
  },

  findNearestLevel: async (
    currentPrice: number,
    high: number,
    low: number,
    close: number,
    method: string = "cpr"
  ): Promise<PivotResponse> => {
    return apiClient.get(
      `/pivots/nearest?current_price=${currentPrice}&high=${high}&low=${low}&close=${close}&method=${method}`
    )
  },

  getHistorical: async (
    symbol: string,
    timeframe: string = "daily",
    days: number = 30,
    exchange: string = "COMEX"
  ): Promise<PivotAccuracyResponse> => {
    return apiClient.get(`/pivots/history?symbol=${symbol}&timeframe=${timeframe}&days=${days}&exchange=${exchange}`)
  },

  // Get multi-timeframe pivots with confluence detection
  getMultiTimeframePivots: async (
    symbol: string,
    exchange: string = "COMEX"
  ): Promise<MultiTimeframePivotResponse> => {
    return apiClient.get(
      `/pivots/multi-timeframe?symbol=${symbol}&exchange=${exchange}`
    )
  },

  // Auto-fetch previous period OHLC data
  getAutoPivots: async (
    symbol: string,
    timeframe: string = "daily",
    exchange: string = "COMEX"
  ): Promise<{
    symbol: string
    exchange: string
    timeframe: string
    ohlc_date: string
    ohlc: { high: number; low: number; close: number }
    cpr: any
    floor_pivots: any
    fibonacci: any
    current_price: number
    nearest_level: any
    market_bias: string
    data_source: string
  }> => {
    return apiClient.get(
      `/pivots/auto?symbol=${symbol}&timeframe=${timeframe}&exchange=${exchange}`
    )
  },
}
