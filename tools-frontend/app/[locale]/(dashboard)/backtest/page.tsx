"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Play, Loader2, Settings, BarChart3, IndianRupee, Save, FolderOpen, Star, StarOff, X, Calendar as CalendarIcon, ChevronDown, Trash2, Tag, Library, Check, BookOpen, Target, TrendingUp, AlertTriangle } from "lucide-react"
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
  listBacktests,
  deleteStrategy,
  getDateRange,
  linkBacktestsToStrategy,
  getPrebuiltStrategies,
  type SavedStrategy,
  type DateRangeResponse,
  type PrebuiltStrategy,
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
import { useSession } from "@/lib/auth-client"

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
  const t = useTranslations('backtest')
  const { toast } = useToast()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [loading, setLoading] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
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
  const [isPrebuilt, setIsPrebuilt] = useState(false)
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([])
  const [prebuiltStrategies, setPrebuiltStrategies] = useState<PrebuiltStrategy[]>([])
  const [loadingStrategies, setLoadingStrategies] = useState(false)
  const [currentStrategyId, setCurrentStrategyId] = useState<number | null>(null)
  const [loadedStrategyName, setLoadedStrategyName] = useState<string | null>(null)
  const [strategyTags, setStrategyTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [deletingStrategyId, setDeletingStrategyId] = useState<number | null>(null)
  const [showTrades, setShowTrades] = useState(false)
  const [strategyListTab, setStrategyListTab] = useState<"my" | "prebuilt">("prebuilt")

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

  // Load seasonal strategy from localStorage if navigating from seasonal page
  useEffect(() => {
    const seasonalStrategyJson = localStorage.getItem("seasonal_strategy_to_backtest")
    if (seasonalStrategyJson) {
      try {
        const seasonalStrategy = JSON.parse(seasonalStrategyJson)
        setStrategy({
          id: seasonalStrategy.id || "seasonal-1",
          name: seasonalStrategy.name || "Seasonal Strategy",
          asset: seasonalStrategy.asset || "GOLD",
          entryLogic: seasonalStrategy.entryLogic,
          exitLogic: seasonalStrategy.exitLogic,
          stopLossPct: seasonalStrategy.stopLossPct || 2.0,
          takeProfitPct: seasonalStrategy.takeProfitPct || 5.0,
        })
        setLoadedStrategyName(seasonalStrategy.name)
        // Clear localStorage after loading
        localStorage.removeItem("seasonal_strategy_to_backtest")
        toast({
          title: "Seasonal Strategy Loaded",
          description: `"${seasonalStrategy.name}" is ready to backtest`,
        })
      } catch (error) {
        console.error("Failed to parse seasonal strategy:", error)
        localStorage.removeItem("seasonal_strategy_to_backtest")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      // Auto-save backtest results in background (non-blocking) - only if user is logged in
      if (userId) {
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
        }, userId).catch((err) => {
          console.error("Failed to auto-save backtest:", err)
        })
      }
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
    setIsPrebuilt(false)
    setStrategyTags([])
    setTagInput("")
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
        isPrebuilt,
        tags: strategyTags.length > 0 ? strategyTags : undefined,
      }

      let saved: SavedStrategy

      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save strategies",
          variant: "destructive",
        })
        return
      }

      if (currentStrategyId) {
        // Update existing strategy
        saved = await updateStrategy(currentStrategyId, strategyData, userId)
        toast({
          title: "Strategy Updated!",
          description: `"${strategyName}" has been updated successfully`,
        })
      } else {
        // Create new strategy
        saved = await saveStrategy(strategyData, userId)

        // Link any orphan backtests to the newly saved strategy
        try {
          const linkResult = await linkBacktestsToStrategy(saved.id, userId)
          if (linkResult.linked > 0) {
            console.log(`Linked ${linkResult.linked} backtest(s) to strategy ${saved.id}`)
          }
        } catch (linkError) {
          console.error("Failed to link backtests:", linkError)
        }

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

  // Load saved strategies and prebuilt strategies
  const handleOpenLoadDialog = async () => {
    setLoadDialogOpen(true)
    setLoadingStrategies(true)
    try {
      const [userResponse, prebuiltResponse] = await Promise.all([
        userId ? listStrategies(userId, { limit: 50 }) : Promise.resolve({ strategies: [], total: 0 }),
        getPrebuiltStrategies(),
      ])
      setSavedStrategies(userResponse.strategies)
      setPrebuiltStrategies(prebuiltResponse)
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

  // Load a prebuilt strategy
  const handleLoadPrebuiltStrategy = (prebuilt: PrebuiltStrategy) => {
    setStrategy({
      id: `prebuilt-${prebuilt.id}`,
      name: prebuilt.name,
      asset: prebuilt.asset as StrategyAsset,
      entryLogic: prebuilt.entry_logic as LogicGroup,
      exitLogic: prebuilt.exit_logic as LogicGroup,
      stopLossPct: prebuilt.stop_loss_pct,
      takeProfitPct: prebuilt.take_profit_pct,
    })
    setLoadedStrategyName(prebuilt.name)
    setCurrentStrategyId(null) // Prebuilt strategies don't have a user strategy ID
    setLoadDialogOpen(false)
    toast({
      title: "Strategy Loaded",
      description: `Loaded prebuilt strategy: ${prebuilt.name}`,
    })
  }

  // Show delete confirmation
  const handleDeleteClick = (strategyId: number) => {
    setDeletingStrategyId(strategyId)
  }

  // Confirm delete
  const handleConfirmDelete = async (strategyId: number) => {
    if (!userId) return
    try {
      await deleteStrategy(strategyId, userId)
      setSavedStrategies((prev) => prev.filter((s) => s.id !== strategyId))

      // If we deleted the currently loaded strategy, clear it
      if (currentStrategyId === strategyId) {
        setCurrentStrategyId(null)
        setLoadedStrategyName(null)
      }

      toast({
        title: "Strategy Deleted",
        description: "The strategy has been permanently deleted",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete strategy",
        variant: "destructive",
      })
    } finally {
      setDeletingStrategyId(null)
    }
  }

  // Cancel delete
  const handleCancelDelete = () => {
    setDeletingStrategyId(null)
  }

  // Add tag to strategy
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!strategyTags.includes(newTag)) {
        setStrategyTags([...strategyTags, newTag])
      }
      setTagInput("")
    }
  }

  // Remove tag from strategy
  const handleRemoveTag = (tagToRemove: string) => {
    setStrategyTags(strategyTags.filter((tag) => tag !== tagToRemove))
  }

  // Load a specific strategy and its latest backtest results
  const handleLoadStrategy = async (saved: SavedStrategy) => {
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
    setLoadDialogOpen(false)

    // Try to load the latest backtest results for this strategy
    try {
      const backtestResponse = userId ? await listBacktests(userId, { strategyId: saved.id, limit: 1 }) : { backtests: [] }
      if (backtestResponse.backtests && backtestResponse.backtests.length > 0) {
        const latestBacktest = backtestResponse.backtests[0]
        // Reconstruct the result from saved backtest data
        const reconstructedResult: VisualBacktestResult = {
          metrics: {
            totalReturn: latestBacktest.metrics.totalReturn,
            winRate: latestBacktest.metrics.winRate,
            maxDrawdown: latestBacktest.metrics.maxDrawdown,
            sharpeRatio: latestBacktest.metrics.sharpeRatio,
            tradesCount: latestBacktest.metrics.tradesCount,
          },
          trades: latestBacktest.trades as VisualBacktestResult["trades"],
          equityCurve: latestBacktest.equityCurve as VisualBacktestResult["equityCurve"],
          finalEquity: latestBacktest.finalEquity,
          initialEquity: latestBacktest.initialCapital,
          priceData: [], // Price data is not stored in backtest results
        }
        setResult(reconstructedResult)
        setPriceData([]) // We don't have price data stored
        setActiveTab("results")
        toast({
          title: "Strategy Loaded",
          description: `"${saved.name}" loaded with previous results`,
        })
        return
      }
    } catch (error) {
      console.error("Failed to load backtest results:", error)
    }

    // No results found
    setResult(null)
    setPriceData([])
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
              <div className="w-1 h-6 bg-linear-to-b from-indigo-500 to-purple-500 rounded-full" />
              <h1 className="text-lg font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {t('pageTitle')}
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
              <span>{t('period')}:</span>
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
              <span>{t('capital')}:</span>
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
            {loading ? t('running') : t('runBacktest')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-5">
        {/* Understanding Backtesting - Progressive Disclosure */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full group mb-5">
              <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-indigo-50 via-purple-50 to-violet-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-violet-950/30 border border-indigo-200/50 dark:border-indigo-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {t('guide.title')}
                        <Badge variant="outline" className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700">
                          Guide
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('guide.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {guideOpen ? t('guide.hideGuide') : t('guide.showGuide')}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2 mb-5">
            <div className="rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                        <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      {t('concepts.entryExitRules.title')}
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
                      {t('concepts.entryExitRules.description')}
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {t('concepts.winRateReturns.title')}
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                      {t('concepts.winRateReturns.description')}
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      {t('concepts.riskManagement.title')}
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                      {t('concepts.riskManagement.description')}
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      {t('concepts.maxDrawdown.title')}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-400 leading-relaxed">
                      {t('concepts.maxDrawdown.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs Row with Strategy Actions */}
          <div className="flex items-center justify-between mb-5">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-10 shadow-sm">
              <TabsTrigger
                value="strategy"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 h-8 text-sm font-medium text-slate-600"
              >
                <Settings size={14} className="mr-1.5" />
                {t('tabs.strategy')}
              </TabsTrigger>
              <TabsTrigger
                value="results"
                disabled={!result}
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md px-4 h-8 text-sm font-medium text-slate-600 disabled:opacity-40"
              >
                <BarChart3 size={14} className="mr-1.5" />
                {t('tabs.results')}
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
                  onClick={handleOpenLoadDialog}
                  variant="outline"
                  size="sm"
                  className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <Library size={14} className="mr-1.5" />
                  {t('strategyLibrary.title')}
                </Button>
                <Button
                  onClick={handleOpenSaveDialog}
                  variant="outline"
                  size="sm"
                  className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <Save size={14} className="mr-1.5" />
                  {t('strategyLibrary.save')}
                </Button>
              </div>
            </div>
          </div>

          {/* Strategy Builder Tab */}
          <TabsContent value="strategy" className="mt-0" forceMount hidden={activeTab !== "strategy"}>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-slate-800">
                  {t('strategyBuilder.title')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('strategyBuilder.description')}
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

                {/* Trades List - Progressive Disclosure */}
                {result.trades.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowTrades(!showTrades)}
                      className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <BarChart3 size={16} className="text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-slate-800">{t('results.tradeHistory.title')}</h3>
                          <p className="text-xs text-slate-500">{result.trades.length} {t('results.tradeHistory.completedTrades')}</p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform duration-200 ${showTrades ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showTrades && (
                      <div className="border-t border-slate-100">
                        {/* Table Header */}
                        <div className="grid grid-cols-6 gap-4 px-5 py-2.5 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          <div>#</div>
                          <div>{t('results.tradeHistory.entryDate')}</div>
                          <div className="text-right">{t('results.tradeHistory.entryPrice')}</div>
                          <div>{t('results.tradeHistory.exitDate')}</div>
                          <div className="text-right">{t('results.tradeHistory.exitPrice')}</div>
                          <div className="text-right">{t('results.tradeHistory.pnl')}</div>
                        </div>

                        {/* Trade Rows */}
                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                          {result.trades.map((trade, index) => {
                            const isProfit = (trade.profitPct || 0) > 0
                            return (
                              <div
                                key={index}
                                className="grid grid-cols-6 gap-4 px-5 py-3 text-sm hover:bg-slate-50 transition-colors"
                              >
                                <div className="text-slate-400 font-medium">{index + 1}</div>
                                <div className="text-slate-700">
                                  {new Date(trade.entryDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-right font-mono text-slate-700">
                                  ₹{trade.entryPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-slate-700">
                                  {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }) : "-"}
                                </div>
                                <div className="text-right font-mono text-slate-700">
                                  {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "-"}
                                </div>
                                <div className={`text-right font-semibold ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                                  <span className="inline-flex items-center gap-1">
                                    {isProfit ? "+" : ""}
                                    {((trade.profitPct || 0) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            <span className="font-medium text-emerald-600">
                              {result.trades.filter(t => (t.profitPct || 0) > 0).length} wins
                            </span>
                            {" · "}
                            <span className="font-medium text-red-500">
                              {result.trades.filter(t => (t.profitPct || 0) <= 0).length} losses
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-500">Total Return: </span>
                            <span className={`font-semibold ${result.metrics.totalReturn >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {result.metrics.totalReturn >= 0 ? "+" : ""}
                              {(result.metrics.totalReturn * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              {currentStrategyId ? "Update Strategy" : "Save New Strategy"}
            </DialogTitle>
            <DialogDescription>
              {currentStrategyId
                ? `Update "${loadedStrategyName}" with your changes.`
                : "Save your strategy to load it later or share with others."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Tag size={12} />
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {strategyTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g., momentum, gold, swing"
                className="h-8 text-sm"
              />
              <p className="text-[11px] text-slate-400">Press Enter to add a tag</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrebuilt}
                  onChange={(e) => setIsPrebuilt(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Mark as Prebuilt Strategy</span>
              </label>
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
                : currentStrategyId
                  ? "Update Strategy"
                  : "Save Strategy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strategy Library Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library size={18} className="text-indigo-600" />
              {t('strategyLibrary.title')}
            </DialogTitle>
            <DialogDescription>
              {t('strategyLibrary.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selection */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setStrategyListTab("prebuilt")}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${strategyListTab === "prebuilt"
                ? "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {t('strategyLibrary.prebuiltStrategies')} ({prebuiltStrategies.length})
            </button>
            <button
              onClick={() => setStrategyListTab("my")}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${strategyListTab === "my"
                ? "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {t('strategyLibrary.mySaved')} ({savedStrategies.length})
            </button>
          </div>

          <div className="py-2">
            {loadingStrategies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : strategyListTab === "prebuilt" ? (
              /* Prebuilt Strategies Tab */
              prebuiltStrategies.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No prebuilt strategies available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {prebuiltStrategies.map((prebuilt) => (
                    <button
                      key={prebuilt.id}
                      onClick={() => handleLoadPrebuiltStrategy(prebuilt)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{prebuilt.name}</span>
                        {prebuilt.category && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 capitalize">
                            {prebuilt.category}
                          </span>
                        )}
                      </div>
                      {prebuilt.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{prebuilt.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prebuilt.asset}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          SL: {prebuilt.stop_loss_pct}% | TP: {prebuilt.take_profit_pct}%
                        </span>
                        {prebuilt.tags && prebuilt.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {prebuilt.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : savedStrategies.length === 0 ? (
              /* My Strategies Tab - Empty */
              <div className="text-center py-8 text-slate-500">
                <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved strategies yet</p>
                <p className="text-xs text-slate-400 mt-1">Save your first strategy to see it here</p>
              </div>
            ) : (
              /* My Strategies Tab - List */
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {savedStrategies.map((saved) => (
                  <div
                    key={saved.id}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => handleLoadStrategy(saved)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 truncate">{saved.name}</span>
                          {saved.isFavorite && (
                            <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                          )}
                        </div>
                        {saved.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{saved.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {saved.asset}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            SL: {saved.stopLossPct}% | TP: {saved.takeProfitPct}%
                          </span>
                          {/* Display tags */}
                          {saved.tags && saved.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {saved.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600"
                                >
                                  {tag}
                                </span>
                              ))}
                              {saved.tags.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{saved.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {saved.createdAt ? new Date(saved.createdAt).toLocaleDateString() : ""}
                        </span>
                        {deletingStrategyId === saved.id ? (
                          // Confirmation UI
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                            <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleConfirmDelete(saved.id)
                              }}
                              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                              title="Confirm delete"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCancelDelete()
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          // Delete button
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteClick(saved.id)
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete strategy"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
