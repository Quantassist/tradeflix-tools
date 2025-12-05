import type { BacktestRequest, BacktestResponse } from "@/types"

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

export async function getStrategyTemplates(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/backtest/templates`)

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`)
  }

  return response.json()
}
