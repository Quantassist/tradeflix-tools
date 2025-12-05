import { apiClient } from "../api-client"
import type { COTRequest, COTAnalysisResponse } from "@/types"

export const cotApi = {
  getAnalysis: async (data: COTRequest): Promise<COTAnalysisResponse> => {
    return apiClient.post("/cot/analysis", data)
  },

  getHistorical: async (commodity: string, weeks: number) => {
    return apiClient.get(`/cot/historical?commodity=${commodity}&weeks=${weeks}`)
  },

  getChanges: async (commodity: string) => {
    return apiClient.get(`/cot/changes?commodity=${commodity}`)
  },

  getExtreme: async (commodity: string, weeks: number) => {
    return apiClient.get(`/cot/extreme?commodity=${commodity}&weeks=${weeks}`)
  },

  compare: async (commodities: string[], weeks: number) => {
    return apiClient.post("/cot/compare", {
      commodities,
      weeks,
    })
  },
}
