import { apiClient } from "../api-client"
import type { PivotRequest, PivotResponse } from "@/types"

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
    days: number = 30
  ): Promise<any> => {
    return apiClient.get(`/pivots/historical?symbol=${symbol}&days=${days}`)
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
