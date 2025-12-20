"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from 'next-intl'
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Network, AlertCircle, Sparkles, ArrowRight, Info, TrendingUp, Activity, Calculator, Clock, PieChart, Zap, BookOpen, ChevronDown, ArrowUpDown, GitBranch, Scale } from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { CorrelationMatrixResponse, RollingCorrelationResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap"
import { RollingCorrelationChart } from "@/components/charts/rolling-correlation-chart"
import { BetaCalculator } from "@/components/correlation/beta-calculator"
import { MultiPeriodComparison } from "@/components/correlation/multi-period-comparison"
import { DiversificationAnalysis } from "@/components/correlation/diversification-analysis"
import { TradingSignals } from "@/components/correlation/trading-signals"
import { toast } from "sonner"

const AVAILABLE_ASSETS = [
  { value: "GOLD", label: "Gold" },
  { value: "SILVER", label: "Silver" },
  { value: "CRUDE", label: "Crude Oil" },
  { value: "USDINR", label: "USD/INR" },
  { value: "DXY", label: "Dollar Index" },
  { value: "COPPER", label: "Copper" },
  { value: "PLATINUM", label: "Platinum" },
  { value: "NATURALGAS", label: "Natural Gas" },
]

export default function CorrelationMatrixPage() {
  const t = useTranslations('correlation')
  const [loading, setLoading] = useState(false)
  const [rollingLoading, setRollingLoading] = useState(false)
  const [result, setResult] = useState<CorrelationMatrixResponse | null>(null)
  const [rollingResult, setRollingResult] = useState<RollingCorrelationResponse | null>(null)
  const [assets, setAssets] = useState("GOLD,SILVER,CRUDE,USDINR")
  const [periodDays, setPeriodDays] = useState("90")
  const [activeTab, setActiveTab] = useState("rolling")
  const [guideOpen, setGuideOpen] = useState(false)
  const initialLoadRef = useRef(false)

  // Auto-calculate tabbed sections on page load (non-blocking)
  // Note: Correlation matrix is NOT auto-calculated - user must click Calculate
  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    // Fire calculations for tabbed sections after page renders
    // Use a longer delay to ensure API is ready
    const timer = setTimeout(() => {
      // Calculate rolling correlation with defaults
      setRollingLoading(true)
      correlationApi.getRolling("GOLD", "USDINR", 30, 180)
        .then(response => {
          // Only set result if we have valid data points with actual variation
          // Check that max != min (indicating actual data, not defaults)
          const hasValidData = response &&
            response.data_points &&
            response.data_points.length > 0 &&
            response.max_correlation !== response.min_correlation

          if (hasValidData) {
            setRollingResult(response)
          }
        })
        .catch(err => console.error("Auto-calc rolling error:", err))
        .finally(() => setRollingLoading(false))
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const assetList = assets.split(",").map(a => a.trim())
      const response = await correlationApi.getMatrix({
        assets: assetList,
        period_days: parseInt(periodDays),
      })
      setResult(response)
      toast.success("Correlation matrix calculated successfully!")
    } catch (error) {
      console.error("Error calculating correlation:", error)
      toast.error("Failed to calculate correlation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getCorrelationColor = (value: number) => {
    if (value > 0.7) return "bg-green-100 text-green-800 border-green-200"
    if (value > 0.3) return "bg-blue-100 text-blue-800 border-blue-200"
    if (value > -0.3) return "bg-gray-100 text-gray-800 border-gray-200"
    if (value > -0.7) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Network className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">{t('pageSubtitle')}</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Analyze correlation between multiple assets to build a well-diversified portfolio
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Understanding Correlation - Progressive Disclosure */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full group">
            <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30 border border-violet-200/50 dark:border-violet-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      Understanding Correlation Analysis
                      <Badge variant="outline" className="text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700">
                        Guide
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Learn how correlation values help build diversified portfolios
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    {guideOpen ? "Hide Guide" : "Show Guide"}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-violet-600 dark:text-violet-400 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2">
          <div className="mt-4 rounded-xl border border-violet-200/50 dark:border-violet-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <ArrowUpDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    +1 Correlation
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Perfect positive - assets move together in the same direction.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 border border-slate-200/50 dark:border-slate-700/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <GitBranch className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    0 Correlation
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed">
                    No relationship - assets move independently of each other.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200/50 dark:border-red-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                      <ArrowUpDown className="h-4 w-4 text-red-600 dark:text-red-400 rotate-90" />
                    </div>
                    -1 Correlation
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                    Perfect negative - assets move in opposite directions.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200/50 dark:border-violet-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                      <Scale className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    Diversification
                  </div>
                  <p className="text-sm text-violet-700 dark:text-violet-400 leading-relaxed">
                    Low correlation between assets provides better risk reduction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Parameters - StyledCard like arbitrage */}
        <StyledCard variant="purple">
          <StyledCardHeader
            icon={Info}
            title="Input Parameters"
            description="Enter assets and time period"
            variant="purple"
          />
          <StyledCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Assets Group */}
              <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assets</div>
                <div className="space-y-1">
                  <Label htmlFor="assets" className="text-xs text-purple-600 font-medium">Assets (comma-separated)</Label>
                  <Input
                    id="assets"
                    placeholder="GOLD,SILVER,CRUDE,USDINR"
                    value={assets}
                    onChange={(e) => setAssets(e.target.value)}
                    required
                    className="bg-white border-purple-200 focus:border-purple-400"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter 2-5 asset symbols separated by commas
                  </p>
                </div>
              </div>

              {/* Parameters Group */}
              <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Parameters</div>
                <div className="space-y-1">
                  <Label htmlFor="period" className="text-xs text-violet-600 font-medium">Period (days)</Label>
                  <Input
                    id="period"
                    type="number"
                    placeholder="90"
                    value={periodDays}
                    onChange={(e) => setPeriodDays(e.target.value)}
                    required
                    className="bg-white border-violet-200 focus:border-violet-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Correlations...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Calculate Correlation
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </StyledCardContent>
        </StyledCard>

        {/* Correlation Matrix Results - StyledCard */}
        <StyledCard variant="pink">
          <StyledCardHeader
            icon={Sparkles}
            title="Correlation Matrix"
            description={result ? `${result.assets.length} assets analyzed` : "Results will appear here after calculation"}
            variant="pink"
          />
          <StyledCardContent>
            {result ? (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <div className="text-sm text-muted-foreground">
                  Period: {result.start_date} to {result.end_date} ({result.period_days} days)
                </div>

                {/* Modern Correlation Pairs */}
                <div className="space-y-3">
                  {result.correlations.map((pair, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-md transition-all duration-300 ${getCorrelationColor(
                        pair.correlation
                      )}`}
                    >
                      <div>
                        <div className="font-medium">
                          {pair.asset1} vs {pair.asset2}
                        </div>
                        <div className="text-xs opacity-75">
                          {pair.strength} • p-value: {pair.p_value !== null ? formatNumber(pair.p_value, 3) : "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {pair.correlation > 0 ? "+" : ""}
                          {formatNumber(pair.correlation, 3)}
                        </div>
                        <div className="text-xs">
                          n={pair.sample_size}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="bg-green-100">Strong Positive (&gt;0.7)</Badge>
                  <Badge variant="outline" className="bg-blue-100">Moderate (0.3-0.7)</Badge>
                  <Badge variant="outline" className="bg-gray-100">Weak (-0.3 to 0.3)</Badge>
                  <Badge variant="outline" className="bg-orange-100">Moderate Negative (-0.7 to -0.3)</Badge>
                  <Badge variant="outline" className="bg-red-100">Strong Negative (&lt;-0.7)</Badge>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center text-muted-foreground animate-pulse">
                  <div className="p-4 bg-linear-to-br from-violet-100 to-fuchsia-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-violet-600" />
                  </div>
                  <p className="text-lg font-medium">Enter assets and calculate</p>
                  <p className="text-sm mt-1">to see correlation matrix</p>
                </div>
              </div>
            )}
          </StyledCardContent>
        </StyledCard>
      </div>

      {/* Heatmap Visualization */}
      {result && result.matrix && (
        <CorrelationHeatmap
          matrix={result.matrix}
          assets={result.assets}
        />
      )}

      {/* Advanced Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 p-1.5 bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border shadow-sm mb-6">
          <TabsTrigger
            value="rolling"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 font-medium transition-all duration-200 h-full"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Rolling</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="beta"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 font-medium transition-all duration-200 h-full"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Beta</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="multiperiod"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 font-medium transition-all duration-200 h-full"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Multi-Period</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="diversification"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 font-medium transition-all duration-200 h-full"
          >
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Diversification</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="signals"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 font-medium transition-all duration-200 h-full"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Signals</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rolling" forceMount className={activeTab === "rolling" ? "space-y-6" : "hidden"}>
          <RollingCorrelationSection
            rollingResult={rollingResult}
            setRollingResult={setRollingResult}
            rollingLoading={rollingLoading}
            setRollingLoading={setRollingLoading}
          />
        </TabsContent>

        <TabsContent value="beta" forceMount className={activeTab === "beta" ? "" : "hidden"}>
          <BetaCalculator />
        </TabsContent>

        <TabsContent value="multiperiod" forceMount className={activeTab === "multiperiod" ? "" : "hidden"}>
          <MultiPeriodComparison />
        </TabsContent>

        <TabsContent value="diversification" forceMount className={activeTab === "diversification" ? "" : "hidden"}>
          <DiversificationAnalysis />
        </TabsContent>

        <TabsContent value="signals" forceMount className={activeTab === "signals" ? "" : "hidden"}>
          <TradingSignals />
        </TabsContent>
      </Tabs>

    </div>
  )
}

// Rolling Correlation Section Component
function RollingCorrelationSection({
  rollingResult,
  setRollingResult,
  rollingLoading,
  setRollingLoading,
}: {
  rollingResult: RollingCorrelationResponse | null
  setRollingResult: (result: RollingCorrelationResponse | null) => void
  rollingLoading: boolean
  setRollingLoading: (loading: boolean) => void
}) {
  const [asset1, setAsset1] = useState("GOLD")
  const [asset2, setAsset2] = useState("USDINR")
  const [windowDays, setWindowDays] = useState("30")
  const [periodDays, setPeriodDays] = useState("180")

  const handleCalculateRolling = async () => {
    if (asset1 === asset2) {
      toast.error("Please select two different assets")
      return
    }

    setRollingLoading(true)
    try {
      const response = await correlationApi.getRolling(
        asset1,
        asset2,
        parseInt(windowDays),
        parseInt(periodDays)
      )
      setRollingResult(response)
      toast.success("Rolling correlation calculated!")
    } catch (error) {
      console.error("Error calculating rolling correlation:", error)
      toast.error("Failed to calculate. Please try again.")
    } finally {
      setRollingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <StyledCard variant="purple">
        <StyledCardHeader
          icon={Activity}
          title="Rolling Correlation Analysis"
          description="Track how correlation changes over time between two assets"
          variant="purple"
        />
        <StyledCardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-purple-600 font-medium">Asset 1</Label>
              <Select value={asset1} onValueChange={setAsset1}>
                <SelectTrigger className="bg-white border-purple-200 focus:border-purple-400">
                  <SelectValue>
                    {AVAILABLE_ASSETS.find(a => a.value === asset1)?.label || "Select asset"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ASSETS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-violet-600 font-medium">Asset 2</Label>
              <Select value={asset2} onValueChange={setAsset2}>
                <SelectTrigger className="bg-white border-violet-200 focus:border-violet-400">
                  <SelectValue>
                    {AVAILABLE_ASSETS.find(a => a.value === asset2)?.label || "Select asset"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ASSETS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600 font-medium">Window (days)</Label>
              <Input
                type="number"
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
                placeholder="30"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600 font-medium">Period (days)</Label>
              <Input
                type="number"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                placeholder="180"
                className="bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCalculateRolling}
                disabled={rollingLoading}
                className="w-full bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {rollingLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Calculate
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </StyledCardContent>
      </StyledCard>

      {rollingResult && rollingResult.data_points && rollingResult.data_points.length > 0 && (
        <RollingCorrelationChart data={rollingResult} />
      )}
    </div>
  )
}
