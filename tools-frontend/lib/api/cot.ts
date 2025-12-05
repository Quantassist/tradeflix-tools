import { apiClient } from "../api-client"
import type { 
  COTRequest, 
  COTAnalysisResponse,
  DisaggCOTAnalysisResponse,
  DisaggCOTHistoricalResponse,
  COTChartDataResponse,
  ExtremePositioningAlert,
  COTTradingSignal,
  AvailableCommodity,
  // Advanced COT types
  FlowDecompositionResponse,
  ParticipationResponse,
  ConcentrationResponse,
  SqueezeRiskResponse,
  AdvancedCOTSummary,
  // Priority 2 types
  CurveAnalysisResponse,
  SpreadAnalysisResponse,
  HerdingAnalysisResponse,
  // Priority 3 types
  CrossMarketPressureResponse,
  VolatilityAnalysisResponse,
  MLRegimeAnalysisResponse,
} from "@/types"

export const cotApi = {
  // Legacy endpoints (FMP-based)
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

  // New Disaggregated COT endpoints (database-based)
  disagg: {
    // Get available commodities
    getCommodities: async (group?: string): Promise<AvailableCommodity[]> => {
      const params = group ? `?group=${encodeURIComponent(group)}` : ""
      return apiClient.get(`/cot/disagg/commodities${params}`)
    },

    // Get comprehensive analysis
    getAnalysis: async (commodity: string, weeks: number = 52): Promise<DisaggCOTAnalysisResponse> => {
      return apiClient.get(`/cot/disagg/analysis?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
    },

    // Get historical data
    getHistorical: async (commodity: string, weeks: number = 52): Promise<DisaggCOTHistoricalResponse> => {
      return apiClient.get(`/cot/disagg/historical?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
    },

    // Get chart-ready data
    getChartData: async (commodity: string, weeks: number = 52): Promise<COTChartDataResponse> => {
      return apiClient.get(`/cot/disagg/chart-data?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
    },

    // Get extreme positioning alerts
    getExtremeAlerts: async (commodity: string, weeks: number = 52): Promise<ExtremePositioningAlert[]> => {
      return apiClient.get(`/cot/disagg/extreme-alerts?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
    },

    // Get trading signal
    getTradingSignal: async (commodity: string, weeks: number = 52): Promise<COTTradingSignal> => {
      return apiClient.get(`/cot/disagg/trading-signal?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
    },

    // Advanced analytics endpoints
    advanced: {
      // Get flow decomposition analysis
      getFlowDecomposition: async (commodity: string, weeks: number = 12): Promise<FlowDecompositionResponse> => {
        return apiClient.get(`/cot/disagg/advanced/flow-decomposition?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get participation and whale detection metrics
      getParticipation: async (commodity: string, weeks: number = 52): Promise<ParticipationResponse> => {
        return apiClient.get(`/cot/disagg/advanced/participation?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get concentration and crowding metrics
      getConcentration: async (commodity: string, weeks: number = 52): Promise<ConcentrationResponse> => {
        return apiClient.get(`/cot/disagg/advanced/concentration?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get squeeze risk analysis
      getSqueezeRisk: async (commodity: string, weeks: number = 52): Promise<SqueezeRiskResponse> => {
        return apiClient.get(`/cot/disagg/advanced/squeeze-risk?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get comprehensive advanced summary
      getSummary: async (commodity: string, weeks: number = 52): Promise<AdvancedCOTSummary> => {
        return apiClient.get(`/cot/disagg/advanced/summary?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Priority 2: Curve, Spread, and Herding Analysis
      
      // Get curve structure analysis (front vs back month)
      getCurveAnalysis: async (commodity: string, weeks: number = 52): Promise<CurveAnalysisResponse> => {
        return apiClient.get(`/cot/disagg/advanced/curve-analysis?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get spread vs directional analysis
      getSpreadAnalysis: async (commodity: string, weeks: number = 52): Promise<SpreadAnalysisResponse> => {
        return apiClient.get(`/cot/disagg/advanced/spread-analysis?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get herding analysis
      getHerdingAnalysis: async (commodity: string, weeks: number = 52): Promise<HerdingAnalysisResponse> => {
        return apiClient.get(`/cot/disagg/advanced/herding-analysis?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Priority 3: Cross-Market, Volatility, and ML Regime Analysis

      // Get cross-market speculative pressure
      getCrossMarketPressure: async (weeks: number = 52, topN: number = 5): Promise<CrossMarketPressureResponse> => {
        return apiClient.get(`/cot/disagg/advanced/cross-market-pressure?weeks=${weeks}&top_n=${topN}`)
      },

      // Get volatility regime analysis
      getVolatilityRegime: async (commodity: string, weeks: number = 52): Promise<VolatilityAnalysisResponse> => {
        return apiClient.get(`/cot/disagg/advanced/volatility-regime?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },

      // Get ML regime classification
      getMLRegime: async (commodity: string, weeks: number = 52): Promise<MLRegimeAnalysisResponse> => {
        return apiClient.get(`/cot/disagg/advanced/ml-regime?commodity=${encodeURIComponent(commodity)}&weeks=${weeks}`)
      },
    },
  },
}
