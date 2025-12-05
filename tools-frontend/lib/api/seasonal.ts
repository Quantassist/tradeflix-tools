import { apiClient } from "../api-client"

export const seasonalApi = {
  getEvents: async (commodity?: string) => {
    const params = commodity ? `?commodity=${commodity}` : ""
    return apiClient.get(`/seasonal/events${params}`)
  },

  getCalendar: async (year: number) => {
    return apiClient.get(`/seasonal/calendar/${year}`)
  },

  getUpcoming: async (days: number = 30) => {
    return apiClient.get(`/seasonal/upcoming?days=${days}`)
  },

  getEventImpact: async (eventId: number) => {
    return apiClient.get(`/seasonal/event/${eventId}/impact`)
  },

  getBestOpportunities: async (commodity?: string) => {
    const params = commodity ? `?commodity=${commodity}` : ""
    return apiClient.get(`/seasonal/best-opportunities${params}`)
  },
}
