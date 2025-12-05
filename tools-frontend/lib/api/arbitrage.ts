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
    return apiClient.get(`/arbitrage/realtime?commodity=${commodity}`)
  },

  getSensitivity: async (
    commodity: string,
    domesticPrice: number,
    internationalPrice: number,
    exchangeRate: number
  ): Promise<unknown> => {
    return apiClient.get(
      `/arbitrage/sensitivity?commodity=${commodity}&domestic_price=${domesticPrice}&international_price=${internationalPrice}&exchange_rate=${exchangeRate}`
    )
  },
}
