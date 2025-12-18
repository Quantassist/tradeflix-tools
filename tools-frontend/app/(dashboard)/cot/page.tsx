"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import {
  BarChart3, TrendingUp, TrendingDown, AlertCircle, ArrowRight, Activity,
  Users, Building2, Briefcase, Target, RefreshCw, BookOpen, ChevronDown
} from "lucide-react"
import { cotApi } from "@/lib/api/cot"
import type {
  DisaggCOTAnalysisResponse,
  COTChartDataResponse,
  ExtremePositioningAlert,
  COTTradingSignal,
  AvailableCommodity,
  FlowDecompositionResponse,
  ConcentrationResponse,
  SqueezeRiskResponse,
  AdvancedCOTSummary,
  CurveAnalysisResponse,
  SpreadAnalysisResponse,
  HerdingAnalysisResponse,
  CrossMarketPressureResponse,
  VolatilityAnalysisResponse,
  MLRegimeAnalysisResponse
} from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"
import { AdvancedTab, AlertsTab, AnalysisTab, ChartsTab, PositionsTab, SentimentTab, HelpButton } from "@/components/cot"


export default function COTReportPage() {
  const [loading, setLoading] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [result, setResult] = useState<DisaggCOTAnalysisResponse | null>(null)
  const [chartData, setChartData] = useState<COTChartDataResponse | null>(null)
  const [alerts, setAlerts] = useState<ExtremePositioningAlert[]>([])
  const [tradingSignal, setTradingSignal] = useState<COTTradingSignal | null>(null)
  const [commodities, setCommodities] = useState<AvailableCommodity[]>([])
  const [commodity, setCommodity] = useState("GOLD")
  const [weeks, setWeeks] = useState("52")

  // Advanced analytics state (Priority 1)
  const [flowData, setFlowData] = useState<FlowDecompositionResponse | null>(null)
  const [concentrationData, setConcentrationData] = useState<ConcentrationResponse | null>(null)
  const [squeezeData, setSqueezeData] = useState<SqueezeRiskResponse | null>(null)
  const [advancedSummary, setAdvancedSummary] = useState<AdvancedCOTSummary | null>(null)
  const [loadingAdvanced, setLoadingAdvanced] = useState(false)

  // Priority 2 analytics state
  const [curveData, setCurveData] = useState<CurveAnalysisResponse | null>(null)
  const [spreadData, setSpreadData] = useState<SpreadAnalysisResponse | null>(null)
  const [herdingData, setHerdingData] = useState<HerdingAnalysisResponse | null>(null)

  // Priority 3 analytics state
  const [crossMarketData, setCrossMarketData] = useState<CrossMarketPressureResponse | null>(null)
  const [volatilityData, setVolatilityData] = useState<VolatilityAnalysisResponse | null>(null)
  const [mlRegimeData, setMlRegimeData] = useState<MLRegimeAnalysisResponse | null>(null)

  // Load available commodities on mount
  useEffect(() => {
    const loadCommodities = async () => {
      try {
        const data = await cotApi.disagg.getCommodities()
        setCommodities(data)
      } catch (error) {
        console.error("Error loading commodities:", error)
      }
    }
    loadCommodities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Fetch all data in parallel
      const [analysisData, chartDataResult, alertsData, signalData] = await Promise.all([
        cotApi.disagg.getAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.getChartData(commodity, parseInt(weeks)),
        cotApi.disagg.getExtremeAlerts(commodity, parseInt(weeks)),
        cotApi.disagg.getTradingSignal(commodity, parseInt(weeks)),
      ])

      setResult(analysisData)
      setChartData(chartDataResult)
      setAlerts(alertsData)
      setTradingSignal(signalData)

      // Fetch advanced analytics in background
      fetchAdvancedData()

      toast.success("COT analysis complete!")
    } catch (error) {
      console.error("Error fetching COT data:", error)
      toast.error("Failed to fetch COT data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchAdvancedData = async () => {
    setLoadingAdvanced(true)
    try {
      // Fetch Priority 1, 2, and 3 data in parallel
      const [flow, concentration, squeeze, summary, curve, spread, herding, crossMarket, volatility, mlRegime] = await Promise.all([
        cotApi.disagg.advanced.getFlowDecomposition(commodity, 12),
        cotApi.disagg.advanced.getConcentration(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSqueezeRisk(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSummary(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getCurveAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSpreadAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getHerdingAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getCrossMarketPressure(parseInt(weeks), 5),
        cotApi.disagg.advanced.getVolatilityRegime(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getMLRegime(commodity, parseInt(weeks)),
      ])
      // Priority 1
      setFlowData(flow)
      setConcentrationData(concentration)
      setSqueezeData(squeeze)
      setAdvancedSummary(summary)
      // Priority 2
      setCurveData(curve)
      setSpreadData(spread)
      setHerdingData(herding)
      // Priority 3
      setCrossMarketData(crossMarket)
      setVolatilityData(volatility)
      setMlRegimeData(mlRegime)
    } catch (error) {
      console.error("Error fetching advanced data:", error)
    } finally {
      setLoadingAdvanced(false)
    }
  }

  // Prepare chart data
  const prepareNetPositionChartData = () => {
    if (!chartData) return []
    return chartData.net_positions.dates.map((date, i) => ({
      date: date.slice(5), // Show MM-DD format
      "Producer/Merchant": chartData.net_positions.producer_merchant_net[i],
      "Swap Dealer": chartData.net_positions.swap_dealer_net[i],
      "Managed Money": chartData.net_positions.managed_money_net[i],
      "Other Reportables": chartData.net_positions.other_reportables_net[i],
    }))
  }

  // Prepare stacked area chart data (long/short positions)
  const prepareLongShortChartData = () => {
    if (!chartData) return []
    return chartData.long_short_positions.dates.map((date, i) => ({
      date: date.slice(5),
      "MM Long": chartData.long_short_positions.managed_money_long[i],
      "MM Short": -chartData.long_short_positions.managed_money_short[i], // Negative for visual
      "Comm Long": chartData.long_short_positions.producer_merchant_long[i],
      "Comm Short": -chartData.long_short_positions.producer_merchant_short[i],
    }))
  }

  // Prepare Open Interest chart data
  const prepareOIChartData = () => {
    if (!chartData) return []
    return chartData.net_positions.dates.map((date, i) => ({
      date: date.slice(5),
      "Open Interest": chartData.net_positions.open_interest[i],
      "Managed Money Net": chartData.net_positions.managed_money_net[i],
    }))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">COT Report Visualizer</h1>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Disaggregated Futures Only Report</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Analyze institutional positioning across Producer/Merchant, Swap Dealers, Managed Money, and Other Reportables
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Understanding COT Reports - Progressive Disclosure */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full group">
            <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border border-amber-200/50 dark:border-amber-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      Understanding Disaggregated COT Reports
                      <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                        Guide
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Learn about the four trader categories and how to interpret their positions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {guideOpen ? "Hide Guide" : "Show Guide"}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-amber-600 dark:text-amber-400 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2">
          <div className="mt-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-4 -mt-4" />
                <div className="relative">
                  <div className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Producer/Merchant
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                    Commercial hedgers (miners, refiners). <span className="font-medium">Contrarian indicator</span> - extreme shorts often mark tops.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 border border-purple-200/50 dark:border-purple-800/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-4 -mt-4" />
                <div className="relative">
                  <div className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                      <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Swap Dealers
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-400 leading-relaxed">
                    Banks facilitating OTC derivatives. Often neutral, hedging client exposures.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200/50 dark:border-orange-800/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full -mr-4 -mt-4" />
                <div className="relative">
                  <div className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                      <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    Managed Money
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
                    Hedge funds and CTAs. <span className="font-medium">Trend followers</span> - extreme longs often signal overcrowding.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 border border-slate-200/50 dark:border-slate-700/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/10 rounded-full -mr-4 -mt-4" />
                <div className="relative">
                  <div className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    Other Reportables
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed">
                    Remaining large traders including proprietary traders and family offices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Input and Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Input Card - Modern Design */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-linear-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 via-amber-500 to-yellow-500" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold">Analysis Parameters</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Configure your COT analysis</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="commodity" className="text-sm font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Commodity
                </Label>
                <Select value={commodity} onValueChange={setCommodity}>
                  <SelectTrigger id="commodity" className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-orange-500/20 focus:border-orange-500">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="MICRO GOLD">Micro Gold</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="COPPER">Copper</SelectItem>
                    <SelectItem value="CRUDE">Crude Oil</SelectItem>
                    <SelectItem value="NATURAL GAS">Natural Gas</SelectItem>
                    {commodities.filter(c =>
                      !["GOLD", "SILVER", "COPPER", "CRUDE", "NATURAL GAS", "MICRO GOLD"].includes(c.commodity_name.toUpperCase())
                    ).slice(0, 10).map(c => (
                      <SelectItem key={c.commodity_name} value={c.commodity_name}>
                        {c.commodity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeks" className="text-sm font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Lookback Period
                </Label>
                <Select value={weeks} onValueChange={setWeeks}>
                  <SelectTrigger id="weeks" className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-orange-500/20 focus:border-orange-500">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="13">3 Months (13 weeks)</SelectItem>
                    <SelectItem value="26">6 Months (26 weeks)</SelectItem>
                    <SelectItem value="52">1 Year (52 weeks)</SelectItem>
                    <SelectItem value="104">2 Years (104 weeks)</SelectItem>
                    <SelectItem value="156">3 Years (156 weeks)</SelectItem>
                    <SelectItem value="260">5 Years (260 weeks)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Affects percentile rankings, sentiment analysis, and charts.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze COT Data
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trading Signal Card - Modern Design */}
        <Card className="lg:col-span-3 relative overflow-hidden border-0 shadow-lg bg-linear-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-yellow-500 via-amber-500 to-orange-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-linear-to-br from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-semibold">Trading Signal</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">
                    {result ? `${result.commodity} • ${result.data_as_of_date}` : "Run analysis to see signals"}
                  </p>
                </div>
              </CardTitle>
              <HelpButton helpKey="tradingSignal" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tradingSignal ? (
              <div className="space-y-4">
                {/* Main Signal Display */}
                <div className={`relative overflow-hidden rounded-2xl p-5 ${tradingSignal.signal.includes("buy")
                  ? "bg-linear-to-br from-emerald-500 to-green-600 text-white"
                  : tradingSignal.signal.includes("sell")
                    ? "bg-linear-to-br from-red-500 to-rose-600 text-white"
                    : "bg-linear-to-br from-slate-500 to-slate-600 text-white"
                  }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        {tradingSignal.signal.includes("buy") ? (
                          <TrendingUp className="h-8 w-8" />
                        ) : tradingSignal.signal.includes("sell") ? (
                          <TrendingDown className="h-8 w-8" />
                        ) : (
                          <Activity className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <div className="text-3xl font-bold tracking-tight">
                          {tradingSignal.signal.toUpperCase().replace("_", " ")}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {tradingSignal.signal_type.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-base px-4 py-1.5 font-semibold backdrop-blur-sm">
                      {tradingSignal.confidence.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="relative text-sm mt-4 opacity-95 leading-relaxed">{tradingSignal.reasoning}</p>
                  {tradingSignal.historical_accuracy && (
                    <p className="relative text-xs mt-3 opacity-80 italic border-t border-white/20 pt-3">
                      {tradingSignal.historical_accuracy}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Managed Money</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{tradingSignal.managed_money_percentile.toFixed(0)}th</div>
                    <div className="text-xs text-muted-foreground">Percentile</div>
                  </div>
                  <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Commercials</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{tradingSignal.producer_merchant_percentile.toFixed(0)}th</div>
                    <div className="text-xs text-muted-foreground">Percentile</div>
                  </div>
                  <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border border-slate-100 dark:border-slate-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-400">4-Week Δ</span>
                    </div>
                    <div className={`text-xl font-bold ${tradingSignal.managed_money_4wk_change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {tradingSignal.managed_money_4wk_change > 0 ? "+" : ""}{formatNumber(tradingSignal.managed_money_4wk_change, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Contracts</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                  <p className="text-muted-foreground font-medium">Select parameters and analyze to see trading signals</p>
                  <p className="text-xs text-muted-foreground mt-1">Choose a commodity and lookback period, then click Analyze</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      {result && (
        <Tabs defaultValue="positions" className="space-y-6 min-h-0">
          <TabsList className="grid w-full grid-cols-6 h-14 p-1.5 bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border shadow-sm">
            <TabsTrigger
              value="positions"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Positions</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="percentiles"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Sentiment</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Charts</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Analysis</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Advanced</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 font-medium transition-all duration-200 h-full"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Alerts</span>
                {alerts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                    {alerts.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Positions Tab - Modernized */}

          <TabsContent value="positions" className="space-y-6">
            <PositionsTab result={result} />
          </TabsContent>

          {/* Sentiment Tab - Modernized */}

          <TabsContent value="percentiles" className="space-y-6">
            <SentimentTab result={result} />
          </TabsContent>

          {/* Charts Tab - Modernized */}
          <TabsContent value="charts" className="space-y-6">
            <ChartsTab chartData={chartData} weeksAnalyzed={result.weeks_analyzed} prepareNetPositionChartData={prepareNetPositionChartData} prepareLongShortChartData={prepareLongShortChartData} prepareOIChartData={prepareOIChartData} />
          </TabsContent>

          {/* Analysis Tab - Modernized */}
          <TabsContent value="analysis" className="space-y-6">
            <AnalysisTab result={result} chartData={chartData} />
          </TabsContent>

          {/* Advanced Analytics Tab - Modernized */}
          <TabsContent value="advanced" className="space-y-6">
            <AdvancedTab loadingAdvanced={loadingAdvanced} advancedSummary={advancedSummary} flowData={flowData} squeezeData={squeezeData} concentrationData={concentrationData} curveData={curveData} spreadData={spreadData} herdingData={herdingData} crossMarketData={crossMarketData} volatilityData={volatilityData} mlRegimeData={mlRegimeData} />
          </TabsContent>


          {/* Alerts Tab - Modernized */}
          <TabsContent value="alerts" className="space-y-6">
            <AlertsTab alerts={alerts} />
          </TabsContent>
        </Tabs>
      )}

    </div>
  )
}
