"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Loader2, Settings, BarChart3, IndianRupee } from "lucide-react"
import { Input } from "@/components/ui/input"
import { StrategyBuilder } from "@/components/backtest/StrategyBuilder"
import { StatsPanel } from "@/components/backtest/StatsPanel"
import { BacktestPriceChart } from "@/components/charts/backtest-price-chart"
import { runVisualBacktest } from "@/lib/api/backtest"
import { useToast } from "@/hooks/use-toast"
import type {
  VisualStrategy,
  VisualBacktestResult,
  StrategyAsset,
  Candle,
} from "@/types"
import { StrategyIndicatorType, StrategyComparator } from "@/types"

// Default Strategy: RSI Oversold + EMA Trend Filter
const DEFAULT_STRATEGY: VisualStrategy = {
  id: "1",
  name: "RSI Oversold + EMA Trend",
  asset: "GOLD",
  entryLogic: {
    id: "root-entry",
    type: "GROUP",
    operator: "AND",
    children: [
      {
        id: "e1",
        type: "CONDITION",
        left: { type: StrategyIndicatorType.RSI, period: 14 },
        comparator: StrategyComparator.LESS_THAN,
        right: { type: StrategyIndicatorType.PRICE, period: 0 },
        value: 30,
      },
      {
        id: "e2",
        type: "CONDITION",
        left: { type: StrategyIndicatorType.PRICE, period: 0 },
        comparator: StrategyComparator.GREATER_THAN,
        right: { type: StrategyIndicatorType.EMA, period: 200 },
      },
    ],
  },
  exitLogic: {
    id: "root-exit",
    type: "GROUP",
    operator: "OR",
    children: [
      {
        id: "x1",
        type: "CONDITION",
        left: { type: StrategyIndicatorType.RSI, period: 14 },
        comparator: StrategyComparator.GREATER_THAN,
        right: { type: StrategyIndicatorType.PRICE, period: 0 },
        value: 70,
      },
    ],
  },
  stopLossPct: 2.0,
  takeProfitPct: 5.0,
}

export default function BacktestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<VisualStrategy>(DEFAULT_STRATEGY)
  const [result, setResult] = useState<VisualBacktestResult | null>(null)
  const [priceData, setPriceData] = useState<Candle[]>([])
  const [activeTab, setActiveTab] = useState<string>("strategy")
  const [initialCapital, setInitialCapital] = useState<number>(100000)

  const handleAssetChange = (asset: StrategyAsset) => {
    setStrategy((prev) => ({ ...prev, asset }))
  }

  const handleRunBacktest = async () => {
    setLoading(true)
    try {
      const response = await runVisualBacktest(strategy, {
        initialCapital,
      })

      setResult(response)
      setPriceData(response.priceData)
      setActiveTab("results") // Auto-switch to results tab

      toast({
        title: "Backtest Complete!",
        description: `Analyzed ${response.metrics.tradesCount} trades with ${(response.metrics.winRate * 100).toFixed(1)}% win rate`,
      })
    } catch (error) {
      toast({
        title: "Backtest Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="-m-6 bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky -top-6 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold text-slate-800">
              Strategy Backtester
            </h1>

            {/* Asset Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(["GOLD", "SILVER", "PLATINUM", "PALLADIUM"] as StrategyAsset[]).map((asset) => (
                <button
                  key={asset}
                  onClick={() => handleAssetChange(asset)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${strategy.asset === asset
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Capital Input */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <IndianRupee size={12} />
              <span>Capital:</span>
            </div>
            <Input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value) || 100000)}
              className="w-28 h-8 text-xs text-right font-medium bg-slate-50 border-slate-200 focus:ring-indigo-500"
              min={1000}
              step={10000}
            />
          </div>

          <Button
            onClick={handleRunBacktest}
            disabled={loading}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 shadow-sm"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <Play size={14} className="mr-2" fill="currentColor" />
            )}
            {loading ? "Running..." : "Run Backtest"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-10 mb-5 shadow-sm">
            <TabsTrigger
              value="strategy"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 h-8 text-sm font-medium text-slate-600"
            >
              <Settings size={14} className="mr-1.5" />
              Strategy
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={!result}
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md px-4 h-8 text-sm font-medium text-slate-600 disabled:opacity-40"
            >
              <BarChart3 size={14} className="mr-1.5" />
              Results
              {result && (
                <span className="ml-1.5 text-xs opacity-80">
                  ({result.metrics.tradesCount})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Strategy Builder Tab */}
          <TabsContent value="strategy" className="mt-0" forceMount hidden={activeTab !== "strategy"}>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-slate-800">
                  Build Your Strategy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define entry and exit conditions using technical indicators
                </p>
              </div>

              <StrategyBuilder strategy={strategy} setStrategy={setStrategy} />
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0 space-y-4" forceMount hidden={activeTab !== "results"}>
            {result && (
              <>
                <StatsPanel result={result} />

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-[500px]">
                  <BacktestPriceChart data={priceData} result={result} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
