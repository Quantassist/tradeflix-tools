import { apiClient } from "../api-client"
import type { CorrelationRequest, CorrelationMatrixResponse } from "@/types"

export const correlationApi = {
  getMatrix: async (data: CorrelationRequest): Promise<CorrelationMatrixResponse> => {
    return apiClient.post("/correlation/matrix", data)
  },

  getRolling: async (asset1: string, asset2: string, windowDays: number, periodDays: number) => {
    return apiClient.post("/correlation/rolling", {
      asset1,
      asset2,
      window_days: windowDays,
      period_days: periodDays,
    })
  },

  getBeta: async (asset: string, benchmark: string, periodDays: number) => {
    return apiClient.post("/correlation/beta", {
      asset,
      benchmark,
      period_days: periodDays,
    })
  },

  getDiversification: async (assets: string[], periodDays: number) => {
    return apiClient.post("/correlation/diversification", {
      assets,
      period_days: periodDays,
    })
  },

  getBreakdown: async (asset1: string, asset2: string, periodDays: number) => {
    return apiClient.get(
      `/correlation/breakdown?asset1=${asset1}&asset2=${asset2}&period_days=${periodDays}`
    )
  },
}
