import type {
  BacktestRequest,
  BacktestResponse,
  VisualBacktestRequest,
  VisualBacktestResult,
  VisualStrategy,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function runBacktest(request: BacktestRequest): Promise<BacktestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/backtest/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  const response = await fetch(`${API_BASE_URL}/api/v1/backtest/templates`)

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Backtest engine options
 */
export type BacktestEngine = "legacy" | "backtesting"

/**
 * Run a visual backtest with the recursive strategy builder format
 * 
 * @param strategy - The visual strategy configuration
 * @param options - Optional parameters including dates, capital, and engine selection
 * @returns Backtest results with trades, metrics, and equity curve
 */
export async function runVisualBacktest(
  strategy: VisualStrategy,
  options?: {
    startDate?: string
    endDate?: string
    initialCapital?: number
    engine?: BacktestEngine  // "legacy" or "backtesting" (uses backtesting.py)
  }
): Promise<VisualBacktestResult> {
  const request: VisualBacktestRequest = {
    strategy,
    startDate: options?.startDate,
    endDate: options?.endDate,
    initialCapital: options?.initialCapital ?? 10000,
  }

  // Use backtesting.py engine by default for better performance
  const engine = options?.engine ?? "backtesting"
  const url = `${API_BASE_URL}/api/v1/backtest/run-visual?engine=${engine}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Visual backtest failed: ${errorText || response.statusText}`)
  }

  return response.json()
}
