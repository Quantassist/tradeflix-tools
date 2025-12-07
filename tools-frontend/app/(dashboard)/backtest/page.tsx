"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Loader2, Settings, BarChart3, IndianRupee, Save, FolderOpen, Star, StarOff, X, FilePlus, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subMonths, subYears } from "date-fns"
import type { DateRange } from "react-day-picker"
import { StrategyBuilder } from "@/components/backtest/StrategyBuilder"
import { StatsPanel } from "@/components/backtest/StatsPanel"
import { BacktestPriceChart } from "@/components/charts/backtest-price-chart"
import {
  runVisualBacktest,
  saveStrategy,
  updateStrategy,
  saveBacktest,
  listStrategies,
  getDateRange,
  type SavedStrategy,
  type DateRangeResponse,
} from "@/lib/api/backtest"
import { useToast } from "@/hooks/use-toast"
import type {
  VisualStrategy,
  VisualBacktestResult,
  StrategyAsset,
  Candle,
  LogicGroup,
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

  // Save strategy state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [savingStrategy, setSavingStrategy] = useState(false)
  const [strategyName, setStrategyName] = useState("")
  const [strategyDescription, setStrategyDescription] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([])
  const [loadingStrategies, setLoadingStrategies] = useState(false)
  const [currentStrategyId, setCurrentStrategyId] = useState<number | null>(null)
  const [loadedStrategyName, setLoadedStrategyName] = useState<string | null>(null)
  const [saveAsNew, setSaveAsNew] = useState(false)

  // Period selection state
  type PeriodOption = "1M" | "6M" | "1Y" | "3Y" | "MAX" | "CUSTOM"
  const [periodOption, setPeriodOption] = useState<PeriodOption>("MAX")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [availableDateRange, setAvailableDateRange] = useState<DateRangeResponse | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Fetch available date range when asset changes
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const range = await getDateRange(strategy.asset)
        setAvailableDateRange(range)
      } catch (error) {
        console.error("Failed to fetch date range:", error)
      }
    }
    fetchDateRange()
  }, [strategy.asset])

  // Calculate start/end dates based on period option
  const getBacktestDates = (): { startDate?: string; endDate?: string } => {
    const today = new Date()

    if (periodOption === "CUSTOM" && dateRange?.from) {
      return {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(today, "yyyy-MM-dd"),
      }
    }

    if (periodOption === "MAX") {
      return {} // Backend will use all available data
    }

    let startDate: Date
    switch (periodOption) {
      case "1M":
        startDate = subMonths(today, 1)
        break
      case "6M":
        startDate = subMonths(today, 6)
        break
      case "1Y":
        startDate = subYears(today, 1)
        break
      case "3Y":
        startDate = subYears(today, 3)
        break
      default:
        return {}
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    }
  }

  const handleAssetChange = (asset: StrategyAsset) => {
    setStrategy((prev) => ({ ...prev, asset }))
  }

  const handleRunBacktest = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getBacktestDates()
      const response = await runVisualBacktest(strategy, {
        initialCapital,
        startDate,
        endDate,
      })

      setResult(response)
      setPriceData(response.priceData)
      setActiveTab("results") // Auto-switch to results tab

      toast({
        title: "Backtest Complete!",
        description: `Analyzed ${response.metrics.tradesCount} trades with ${(response.metrics.winRate * 100).toFixed(1)}% win rate`,
      })

      // Auto-save backtest results in background (non-blocking)
      saveBacktest({
        strategyId: currentStrategyId || undefined,
        asset: strategy.asset,
        initialCapital,
        finalEquity: response.finalEquity,
        totalTrades: response.metrics.tradesCount,
        winRate: response.metrics.winRate,
        totalReturn: response.metrics.totalReturn,
        maxDrawdown: response.metrics.maxDrawdown,
        sharpeRatio: response.metrics.sharpeRatio,
        trades: response.trades as unknown as Record<string, unknown>[],
        equityCurve: response.equityCurve as unknown as Record<string, unknown>[],
      }).catch((err) => {
        console.error("Failed to auto-save backtest:", err)
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

  // Open save dialog with current strategy name
  const handleOpenSaveDialog = () => {
    setStrategyName(loadedStrategyName || strategy.name)
    setStrategyDescription("")
    setIsFavorite(false)
    setSaveAsNew(false) // Default to update if loaded
    setSaveDialogOpen(true)
  }

  // Clear loaded strategy and start fresh
  const handleNewStrategy = () => {
    setStrategy(DEFAULT_STRATEGY)
    setCurrentStrategyId(null)
    setLoadedStrategyName(null)
    setResult(null)
    setPriceData([])
    toast({
      title: "New Strategy",
      description: "Started with a fresh strategy template",
    })
  }

  // Save strategy to database (create or update)
  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your strategy",
        variant: "destructive",
      })
      return
    }

    setSavingStrategy(true)
    try {
      const strategyData = {
        name: strategyName.trim(),
        description: strategyDescription.trim() || undefined,
        asset: strategy.asset,
        entryLogic: strategy.entryLogic as unknown as Record<string, unknown>,
        exitLogic: strategy.exitLogic as unknown as Record<string, unknown>,
        stopLossPct: strategy.stopLossPct,
        takeProfitPct: strategy.takeProfitPct,
        isFavorite,
      }

      let saved: SavedStrategy
      const isUpdate = currentStrategyId && !saveAsNew

      if (isUpdate) {
        // Update existing strategy
        saved = await updateStrategy(currentStrategyId, strategyData)
        toast({
          title: "Strategy Updated!",
          description: `"${strategyName}" has been updated successfully`,
        })
      } else {
        // Create new strategy
        saved = await saveStrategy(strategyData)
        toast({
          title: "Strategy Saved!",
          description: `"${strategyName}" has been saved as a new strategy`,
        })
      }

      setCurrentStrategyId(saved.id)
      setLoadedStrategyName(strategyName.trim())
      setStrategy((prev) => ({ ...prev, name: strategyName.trim() }))
      setSaveDialogOpen(false)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save strategy",
        variant: "destructive",
      })
    } finally {
      setSavingStrategy(false)
    }
  }

  // Load saved strategies
  const handleOpenLoadDialog = async () => {
    setLoadDialogOpen(true)
    setLoadingStrategies(true)
    try {
      const response = await listStrategies({ limit: 50 })
      setSavedStrategies(response.strategies)
    } catch (error) {
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "Failed to load strategies",
        variant: "destructive",
      })
    } finally {
      setLoadingStrategies(false)
    }
  }

  // Load a specific strategy
  const handleLoadStrategy = (saved: SavedStrategy) => {
    setStrategy({
      id: saved.id.toString(),
      name: saved.name,
      asset: saved.asset as StrategyAsset,
      entryLogic: saved.entryLogic as unknown as LogicGroup,
      exitLogic: saved.exitLogic as unknown as LogicGroup,
      stopLossPct: saved.stopLossPct,
      takeProfitPct: saved.takeProfitPct,
    })
    setCurrentStrategyId(saved.id)
    setLoadedStrategyName(saved.name)
    setResult(null)
    setPriceData([])
    setLoadDialogOpen(false)

    toast({
      title: "Strategy Loaded",
      description: `"${saved.name}" has been loaded`,
    })
  }

  return (
    <div className="-m-6 bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky -top-6 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Title with gradient accent */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Strategy Backtester
              </h1>
            </div>

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

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarIcon size={12} />
              <span>Period:</span>
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium bg-slate-50 border-slate-200 min-w-[140px] justify-between"
                >
                  {periodOption === "CUSTOM" && dateRange?.from ? (
                    <span className="truncate">
                      {format(dateRange.from, "MMM yyyy")}
                      {dateRange.to && ` - ${format(dateRange.to, "MMM yyyy")}`}
                    </span>
                  ) : (
                    <span>
                      {periodOption === "1M" && "1 Month"}
                      {periodOption === "6M" && "6 Months"}
                      {periodOption === "1Y" && "1 Year"}
                      {periodOption === "3Y" && "3 Years"}
                      {periodOption === "MAX" && "Max"}
                      {periodOption === "CUSTOM" && "Custom"}
                    </span>
                  )}
                  <ChevronDown size={14} className="ml-1 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b border-slate-100">
                  <div className="grid grid-cols-3 gap-1">
                    {(["1M", "6M", "1Y", "3Y", "MAX", "CUSTOM"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setPeriodOption(option)
                          if (option !== "CUSTOM") {
                            setCalendarOpen(false)
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${periodOption === option
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {option === "1M" && "1 Month"}
                        {option === "6M" && "6 Months"}
                        {option === "1Y" && "1 Year"}
                        {option === "3Y" && "3 Years"}
                        {option === "MAX" && "Max"}
                        {option === "CUSTOM" && "Custom"}
                      </button>
                    ))}
                  </div>
                </div>
                {periodOption === "CUSTOM" && (
                  <div className="p-2">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) => {
                        if (!availableDateRange) return false
                        const minDate = new Date(availableDateRange.minDate)
                        const maxDate = new Date(availableDateRange.maxDate)
                        return date < minDate || date > maxDate
                      }}
                    />
                    {availableDateRange && (
                      <p className="text-[10px] text-slate-400 text-center mt-2">
                        Data available: {format(new Date(availableDateRange.minDate), "MMM d, yyyy")} - {format(new Date(availableDateRange.maxDate), "MMM d, yyyy")}
                      </p>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => setCalendarOpen(false)}
                        className="h-7 text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
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

          {/* Run Button */}
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
          {/* Tabs Row with Strategy Actions */}
          <div className="flex items-center justify-between mb-5">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-10 shadow-sm">
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

            {/* Strategy Name & Actions */}
            <div className="flex items-center gap-3">
              {/* Loaded Strategy Indicator */}
              {loadedStrategyName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-xs font-medium text-indigo-700 max-w-[180px] truncate">
                    {loadedStrategyName}
                  </span>
                  <button
                    onClick={handleNewStrategy}
                    className="p-0.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                    title="Start new strategy"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleNewStrategy}
                  variant="outline"
                  size="sm"
                  className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <FilePlus size={14} className="mr-1.5" />
                  New
                </Button>
                <Button
                  onClick={handleOpenLoadDialog}
                  variant="outline"
                  size="sm"
                  className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <FolderOpen size={14} className="mr-1.5" />
                  Load
                </Button>
                <Button
                  onClick={handleOpenSaveDialog}
                  variant="outline"
                  size="sm"
                  className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <Save size={14} className="mr-1.5" />
                  Save
                </Button>
              </div>
            </div>
          </div>

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

      {/* Save Strategy Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentStrategyId && !saveAsNew ? "Update Strategy" : "Save New Strategy"}
            </DialogTitle>
            <DialogDescription>
              {currentStrategyId && !saveAsNew
                ? `Update "${loadedStrategyName}" with your changes.`
                : "Save your strategy to load it later or share with others."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Save as new toggle when editing existing strategy */}
            {currentStrategyId && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSaveAsNew(false)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${!saveAsNew
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  Update Existing
                </button>
                <button
                  type="button"
                  onClick={() => setSaveAsNew(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${saveAsNew
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  Save as New
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Strategy Name</label>
              <Input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="My Trading Strategy"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (optional)</label>
              <Textarea
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="Describe your strategy..."
                className="resize-none h-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isFavorite
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                  }`}
              >
                {isFavorite ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                {isFavorite ? "Favorite" : "Add to Favorites"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveStrategy}
              disabled={savingStrategy || !strategyName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {savingStrategy ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              {savingStrategy
                ? "Saving..."
                : currentStrategyId && !saveAsNew
                  ? "Update Strategy"
                  : "Save Strategy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Strategy Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Load Strategy</DialogTitle>
            <DialogDescription>
              Select a saved strategy to load into the builder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingStrategies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : savedStrategies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved strategies yet</p>
                <p className="text-xs text-slate-400 mt-1">Save your first strategy to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {savedStrategies.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => handleLoadStrategy(saved)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 truncate">{saved.name}</span>
                          {saved.isFavorite && (
                            <Star size={12} className="text-amber-500 flex-shrink-0" fill="currentColor" />
                          )}
                        </div>
                        {saved.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{saved.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {saved.asset}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            SL: {saved.stopLossPct}% | TP: {saved.takeProfitPct}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {saved.createdAt ? new Date(saved.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
