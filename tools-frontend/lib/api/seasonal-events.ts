import { apiClient } from "../api-client"

// Event type enum matching backend
export type EventType =
  | "festival_india"
  | "holiday_trading_india"
  | "holiday_trading_us"
  | "holiday_trading_global"
  | "election_india"
  | "election_global"
  | "budget_india"
  | "policy_event"
  | "fomc_meeting"
  | "macro_release"
  | "custom"

export type RecurrenceType =
  | "none"
  | "annual"
  | "lunar"
  | "quarterly"
  | "monthly"
  | "weekly"

export interface SeasonalEvent {
  id: number
  name: string
  event_type: EventType
  description: string | null
  country: string
  region: string | null
  start_date: string
  end_date: string | null
  recurrence: RecurrenceType
  recurrence_month: number | null
  recurrence_day: number | null
  is_lunar_based: boolean
  event_time: string | null
  timezone: string
  duration_days: number
  avg_price_change_percent: number | null
  win_rate: number | null
  volatility_multiplier: number | null
  volume_change_percent: number | null
  analysis_window_before: number
  analysis_window_after: number
  affects_gold: boolean
  affects_silver: boolean
  event_metadata: Record<string, unknown> | null
  data_source: string | null
  source_url: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface SeasonalEventCreate {
  name: string
  event_type: EventType
  description?: string
  country?: string
  region?: string
  start_date: string
  end_date?: string
  recurrence?: RecurrenceType
  recurrence_month?: number
  recurrence_day?: number
  is_lunar_based?: boolean
  event_time?: string
  timezone?: string
  duration_days?: number
  avg_price_change_percent?: number
  win_rate?: number
  volatility_multiplier?: number
  volume_change_percent?: number
  analysis_window_before?: number
  analysis_window_after?: number
  affects_gold?: boolean
  affects_silver?: boolean
  event_metadata?: Record<string, unknown>
  data_source?: string
  source_url?: string
}

export interface SeasonalEventUpdate extends Partial<SeasonalEventCreate> {
  is_active?: boolean
  is_verified?: boolean
}

export interface SeasonalEventListResponse {
  events: SeasonalEvent[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface EventTypeInfo {
  value: EventType
  label: string
  description: string
  examples: string[]
}

export interface ListEventsParams {
  page?: number
  page_size?: number
  event_type?: EventType
  country?: string
  is_active?: boolean
  start_date_from?: string
  start_date_to?: string
  search?: string
}

export const seasonalEventsApi = {
  // List events with pagination and filtering
  listEvents: async (params: ListEventsParams = {}): Promise<SeasonalEventListResponse> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set("page", params.page.toString())
    if (params.page_size) searchParams.set("page_size", params.page_size.toString())
    if (params.event_type) searchParams.set("event_type", params.event_type)
    if (params.country) searchParams.set("country", params.country)
    if (params.is_active !== undefined) searchParams.set("is_active", params.is_active.toString())
    if (params.start_date_from) searchParams.set("start_date_from", params.start_date_from)
    if (params.start_date_to) searchParams.set("start_date_to", params.start_date_to)
    if (params.search) searchParams.set("search", params.search)
    
    const queryString = searchParams.toString()
    return apiClient.get(`/seasonal-events/${queryString ? `?${queryString}` : ""}`)
  },

  // Get upcoming events
  getUpcoming: async (days: number = 30, eventType?: EventType, limit: number = 10): Promise<SeasonalEvent[]> => {
    const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() })
    if (eventType) params.set("event_type", eventType)
    return apiClient.get(`/seasonal-events/upcoming?${params.toString()}`)
  },

  // Get all event types with descriptions
  getEventTypes: async (): Promise<EventTypeInfo[]> => {
    return apiClient.get("/seasonal-events/types")
  },

  // Get single event by ID
  getEvent: async (eventId: number): Promise<SeasonalEvent> => {
    return apiClient.get(`/seasonal-events/${eventId}`)
  },

  // Create new event
  createEvent: async (data: SeasonalEventCreate): Promise<SeasonalEvent> => {
    // Filter out undefined and empty string values to avoid validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
    )
    return apiClient.post("/seasonal-events/", cleanedData)
  },

  // Update event
  updateEvent: async (eventId: number, data: SeasonalEventUpdate): Promise<SeasonalEvent> => {
    // Filter out undefined and empty string values to avoid validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
    )
    return apiClient.put(`/seasonal-events/${eventId}`, cleanedData)
  },

  // Delete event
  deleteEvent: async (eventId: number): Promise<void> => {
    return apiClient.delete(`/seasonal-events/${eventId}`)
  },

  // Toggle active status
  toggleActive: async (eventId: number): Promise<SeasonalEvent> => {
    return apiClient.post(`/seasonal-events/${eventId}/toggle-active`, {})
  },

  // Verify event (admin)
  verifyEvent: async (eventId: number): Promise<SeasonalEvent> => {
    return apiClient.post(`/seasonal-events/${eventId}/verify`, {})
  },
}
