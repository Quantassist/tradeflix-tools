import type {
  BacktestRequest,
  BacktestResponse,
  VisualBacktestRequest,
  VisualBacktestResult,
  VisualStrategy,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Get common headers for API requests
 * @param userId - The authenticated user's ID from better-auth session
 */
const getHeaders = (userId?: string): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  if (userId) {
    headers["X-User-Id"] = userId
  }
  return headers
}

export async function runBacktest(request: BacktestRequest): Promise<BacktestResponse> {
  const response = await fetch(`${API_BASE_URL}/backtest/run`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Backtest failed: ${response.statusText}`)
  }

  return response.json()
}

interface StrategyTemplate {
  name: string
  description: string
  entry_conditions: Array<{
    indicator: string
    operator: string
    value: number
  }>
  exit_conditions: Array<{
    type: string
    value: number
  }>
}

export async function getStrategyTemplates(): Promise<StrategyTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/backtest/templates`)

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Prebuilt strategy from database
 */
export interface PrebuiltStrategy {
  id: number
  name: string
  description?: string
  asset: string
  category?: string
  entry_logic: Record<string, unknown>
  exit_logic: Record<string, unknown>
  stop_loss_pct: number
  take_profit_pct: number
  tags?: string[]
}

/**
 * Get all prebuilt strategies from the database
 */
export async function getPrebuiltStrategies(category?: string): Promise<PrebuiltStrategy[]> {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  
  const url = `${API_BASE_URL}/backtest/prebuilt-strategies${params.toString() ? `?${params.toString()}` : ""}`
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch prebuilt strategies: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Get a specific prebuilt strategy by ID
 */
export async function getPrebuiltStrategy(strategyId: number): Promise<PrebuiltStrategy> {
  const response = await fetch(`${API_BASE_URL}/backtest/prebuilt-strategies/${strategyId}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch prebuilt strategy: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Date range response from the API
 */
export interface DateRangeResponse {
  minDate: string
  maxDate: string
  asset: string
}

/**
 * Get available date range for backtesting data
 */
export async function getDateRange(asset: string): Promise<DateRangeResponse> {
  const response = await fetch(`${API_BASE_URL}/backtest/date-range/${asset}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get date range: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Run a visual backtest with the recursive strategy builder format
 * 
 * @param strategy - The visual strategy configuration
 * @param options - Optional parameters including dates and capital
 * @returns Backtest results with trades, metrics, and equity curve
 */
export async function runVisualBacktest(
  strategy: VisualStrategy,
  options?: {
    startDate?: string
    endDate?: string
    initialCapital?: number
  }
): Promise<VisualBacktestResult> {
  const request: VisualBacktestRequest = {
    strategy,
    startDate: options?.startDate,
    endDate: options?.endDate,
    initialCapital: options?.initialCapital ?? 10000,
  }

  const url = `${API_BASE_URL}/backtest/run-visual`

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Visual backtest failed: ${errorText || response.statusText}`)
  }

  return response.json()
}


// ============================================
// Strategy CRUD API
// ============================================

export interface SavedStrategy {
  id: number
  userId: string
  name: string
  description?: string
  asset: string
  entryLogic: Record<string, unknown>
  exitLogic: Record<string, unknown>
  stopLossPct: number
  takeProfitPct: number
  isPublic: boolean
  isFavorite: boolean
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface StrategyListResponse {
  strategies: SavedStrategy[]
  total: number
}

export interface SaveStrategyRequest {
  name: string
  description?: string
  asset: string
  entryLogic: Record<string, unknown>
  exitLogic: Record<string, unknown>
  stopLossPct: number
  takeProfitPct: number
  isPublic?: boolean
  isFavorite?: boolean
  isPrebuilt?: boolean
  tags?: string[]
}

/**
 * Save a new strategy
 */
export async function saveStrategy(request: SaveStrategyRequest, userId: string): Promise<SavedStrategy> {
  const response = await fetch(`${API_BASE_URL}/backtest/strategies`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to save strategy: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * List user's strategies
 */
export async function listStrategies(userId: string, options?: {
  asset?: string
  isFavorite?: boolean
  limit?: number
  offset?: number
}): Promise<StrategyListResponse> {
  const params = new URLSearchParams()
  if (options?.asset) params.set("asset", options.asset)
  if (options?.isFavorite !== undefined) params.set("is_favorite", String(options.isFavorite))
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.offset) params.set("offset", String(options.offset))

  const url = `${API_BASE_URL}/backtest/strategies?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to list strategies: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Get a specific strategy by ID
 */
export async function getStrategy(strategyId: number, userId: string): Promise<SavedStrategy> {
  const response = await fetch(`${API_BASE_URL}/backtest/strategies/${strategyId}`, {
    method: "GET",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get strategy: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Update an existing strategy
 */
export async function updateStrategy(
  strategyId: number,
  request: Partial<SaveStrategyRequest>,
  userId: string
): Promise<SavedStrategy> {
  const response = await fetch(`${API_BASE_URL}/backtest/strategies/${strategyId}`, {
    method: "PUT",
    headers: getHeaders(userId),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update strategy: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(strategyId: number, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/backtest/strategies/${strategyId}`, {
    method: "DELETE",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete strategy: ${errorText || response.statusText}`)
  }
}


// ============================================
// Backtest Results CRUD API
// ============================================

export interface SavedBacktest {
  id: number
  strategyId?: number
  userId: string
  asset: string
  initialCapital: number
  finalEquity: number
  metrics: {
    totalReturn: number
    winRate: number
    maxDrawdown: number
    sharpeRatio: number
    tradesCount: number
  }
  trades: Record<string, unknown>[]
  equityCurve: Record<string, unknown>[]
  executionTimeMs?: number
  status: string
  errorMessage?: string
  createdAt?: string
}

export interface BacktestListResponse {
  backtests: SavedBacktest[]
  total: number
}

export interface SaveBacktestRequest {
  strategyId?: number
  asset: string
  initialCapital: number
  finalEquity: number
  totalTrades: number
  winRate: number
  totalReturn: number
  maxDrawdown: number
  sharpeRatio: number
  trades: Record<string, unknown>[]
  equityCurve: Record<string, unknown>[]
  executionTimeMs?: number
}

/**
 * Save a backtest result
 */
export async function saveBacktest(request: SaveBacktestRequest, userId: string): Promise<SavedBacktest> {
  const response = await fetch(`${API_BASE_URL}/backtest/backtests/save`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to save backtest: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * List user's backtest results
 */
export async function listBacktests(userId: string, options?: {
  strategyId?: number
  asset?: string
  limit?: number
  offset?: number
}): Promise<BacktestListResponse> {
  const params = new URLSearchParams()
  if (options?.strategyId) params.set("strategy_id", String(options.strategyId))
  if (options?.asset) params.set("asset", options.asset)
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.offset) params.set("offset", String(options.offset))

  const url = `${API_BASE_URL}/backtest/backtests?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to list backtests: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Get a specific backtest by ID
 */
export async function getBacktest(backtestId: number, userId: string): Promise<SavedBacktest> {
  const response = await fetch(`${API_BASE_URL}/backtest/backtests/${backtestId}`, {
    method: "GET",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get backtest: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete a backtest result
 */
export async function deleteBacktest(backtestId: number, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/backtest/backtests/${backtestId}`, {
    method: "DELETE",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete backtest: ${errorText || response.statusText}`)
  }
}

/**
 * Link orphan backtests (with no strategy_id) to a strategy
 */
export async function linkBacktestsToStrategy(strategyId: number, userId: string): Promise<{ linked: number; backtestId?: number }> {
  const response = await fetch(`${API_BASE_URL}/backtest/backtests/link-to-strategy?strategy_id=${strategyId}`, {
    method: "PATCH",
    headers: getHeaders(userId),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to link backtests: ${errorText || response.statusText}`)
  }

  return response.json()
}
