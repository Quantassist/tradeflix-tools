"use client"

import { useState, useEffect } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowRight, Info, RefreshCw, BookOpen, ChevronDown, Calculator, Scale } from "lucide-react"
import { arbitrageApi } from "@/lib/api/arbitrage"
import type { ArbitrageResponse } from "@/types"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils"
import { ArbitrageSpreadChart } from "@/components/charts/arbitrage-spread-chart"
import { ArbitrageHeatmap, MultiCommodityTracker, USDINRSensitivity, ArbitrageHistoryChart } from "@/components/arbitrage"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export default function ArbitrageCalculatorPage() {
  const t = useTranslations('arbitrage')
  const [loading, setLoading] = useState(false)
  const [autoFetchLoading, setAutoFetchLoading] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [result, setResult] = useState<ArbitrageResponse | null>(null)
  const [formData, setFormData] = useState({
    comex_price_usd: "",
    mcx_price_inr: "",
    usdinr_rate: "",
    import_duty_percent: "2.5",
    contract_size_grams: "10",  // MCX Gold is quoted per 10 grams
  })

  const handleAutoFetch = async (autoCalculate = false) => {
    setAutoFetchLoading(true)
    try {
      const data = await arbitrageApi.getRealtime("GOLD")

      // Extract values from nested response structure
      const comexPrice = data.fair_value?.comex_price_usd
      const mcxPrice = data.arbitrage?.mcx_price
      const usdinrRate = data.fair_value?.usdinr_rate
      const mcxSource = data.data_sources?.mcx

      if (!comexPrice || !usdinrRate) {
        throw new Error("Invalid response from API")
      }

      const newFormData = {
        ...formData,
        comex_price_usd: comexPrice.toFixed(2),
        mcx_price_inr: mcxPrice ? mcxPrice.toFixed(2) : formData.mcx_price_inr,
        usdinr_rate: usdinrRate.toFixed(2),
      }
      setFormData(newFormData)

      // Show different toast based on MCX data source
      const isRealMcx = mcxSource === "DhanHQ"
      const mcxStatus = mcxPrice
        ? `MCX: ₹${mcxPrice.toFixed(2)}${!isRealMcx ? " (estimated)" : ""}`
        : "MCX: Not available (enter manually)"

      if (isRealMcx) {
        toast.success(`Live prices fetched! COMEX: $${comexPrice.toFixed(2)}, ${mcxStatus}, USD/INR: ${usdinrRate.toFixed(2)}`)
      } else {
        toast.warning(`Prices fetched. COMEX: $${comexPrice.toFixed(2)}, ${mcxStatus}, USD/INR: ${usdinrRate.toFixed(2)}. MCX price is estimated - DhanHQ may be unavailable.`)
      }

      // Auto-calculate arbitrage after fetching prices
      if (autoCalculate && newFormData.mcx_price_inr) {
        await calculateArbitrage(newFormData)
      }
    } catch (error: unknown) {
      console.error("Error auto-fetching prices:", error)
      toast.error("Failed to fetch live prices. Please enter values manually.")
    } finally {
      setAutoFetchLoading(false)
    }
  }

  const calculateArbitrage = async (data: typeof formData) => {
    setLoading(true)
    try {
      const response = await arbitrageApi.calculate({
        comex_price_usd: parseFloat(data.comex_price_usd),
        mcx_price_inr: parseFloat(data.mcx_price_inr),
        usdinr_rate: parseFloat(data.usdinr_rate),
        import_duty_percent: parseFloat(data.import_duty_percent),
        contract_size_grams: parseInt(data.contract_size_grams),
      })
      setResult(response)
      toast.success("Arbitrage analysis complete!")
    } catch (error: unknown) {
      console.error("Error calculating arbitrage:", error)
      toast.error("Failed to calculate arbitrage. Please check your inputs and try again.")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch and calculate on page load
  useEffect(() => {
    handleAutoFetch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await arbitrageApi.calculate({
        comex_price_usd: parseFloat(formData.comex_price_usd),
        mcx_price_inr: parseFloat(formData.mcx_price_inr),
        usdinr_rate: parseFloat(formData.usdinr_rate),
        import_duty_percent: parseFloat(formData.import_duty_percent),
        contract_size_grams: parseInt(formData.contract_size_grams),
      })
      setResult(response)
      toast.success("Arbitrage analysis complete!")
    } catch (error: unknown) {
      console.error("Error calculating arbitrage:", error)
      toast.error("Failed to calculate arbitrage. Please check your inputs and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">{t('pageSubtitle')}</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            {t('headerDescription')}
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Understanding Arbitrage - Progressive Disclosure */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full group">
            <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border border-emerald-200/50 dark:border-emerald-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      Understanding Arbitrage Trading
                      <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                        Guide
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Learn how arbitrage opportunities work between COMEX and MCX markets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {guideOpen ? "Hide Guide" : "Show Guide"}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2">
          <div className="mt-4 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Fair Value
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                    (Intl Price × FX Rate) + Duty + Transport Cost
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Premium
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    Domestic Price - Fair Value = Premium/Discount
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
                    Positive Premium
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Domestic market is expensive - consider selling MCX
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200/50 dark:border-red-800/50">
                <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-full -mr-3 -mt-3" />
                <div className="relative">
                  <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    Negative Premium
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                    Import opportunity - domestic market is cheaper
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modern Input Form */}
        <StyledCard variant="purple">
          <StyledCardHeader
            icon={Info}
            title={t('inputParameters')}
            description={t('inputDescription')}
            variant="purple"
          />
          <StyledCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Auto-fetch Live Prices Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-dashed border-purple-400 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 py-5"
                onClick={() => handleAutoFetch(false)}
                disabled={autoFetchLoading}
              >
                {autoFetchLoading ? (
                  <span className="flex items-center gap-2 text-purple-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t('fetchingPrices')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-purple-600">
                    <RefreshCw className="h-4 w-4" />
                    {t('autoFetch')}
                  </span>
                )}
              </Button>

              {/* Price Data Group */}
              <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('priceData')}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="comex_price_usd" className="text-xs text-blue-600 font-medium">{t('comexLabel')}</Label>
                    <Input
                      id="comex_price_usd"
                      type="number"
                      step="0.01"
                      placeholder="2650.00"
                      value={formData.comex_price_usd}
                      onChange={(e) =>
                        setFormData({ ...formData, comex_price_usd: e.target.value })
                      }
                      required
                      className="bg-white border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mcx_price_inr" className="text-xs text-purple-600 font-medium">{t('mcxLabel')}</Label>
                    <Input
                      id="mcx_price_inr"
                      type="number"
                      step="0.01"
                      placeholder="75500.00"
                      value={formData.mcx_price_inr}
                      onChange={(e) =>
                        setFormData({ ...formData, mcx_price_inr: e.target.value })
                      }
                      required
                      className="bg-white border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usdinr_rate" className="text-xs text-green-600 font-medium">{t('usdinrLabel')}</Label>
                  <Input
                    id="usdinr_rate"
                    type="number"
                    step="0.01"
                    placeholder="84.50"
                    value={formData.usdinr_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, usdinr_rate: e.target.value })
                    }
                    required
                    className="bg-white border-green-200 focus:border-green-400"
                  />
                </div>
              </div>

              {/* Parameters Group */}
              <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('parameters')}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="import_duty_percent" className="text-xs text-orange-600 font-medium">{t('importDutyLabel')}</Label>
                    <Input
                      id="import_duty_percent"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={formData.import_duty_percent}
                      onChange={(e) =>
                        setFormData({ ...formData, import_duty_percent: e.target.value })
                      }
                      required
                      className="bg-white border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contract_size_grams" className="text-xs text-slate-600 font-medium">{t('quoteUnitLabel')}</Label>
                    <Input
                      id="contract_size_grams"
                      type="number"
                      placeholder="10"
                      value={formData.contract_size_grams}
                      onChange={(e) =>
                        setFormData({ ...formData, contract_size_grams: e.target.value })
                      }
                      required
                      className="bg-white"
                    />
                  </div>
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
                    {t('analyzingMarkets')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t('calculateArbitrage')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </StyledCardContent>
        </StyledCard>

        {/* Modern Results Card */}
        <StyledCard variant="orange">
          <StyledCardHeader
            icon={Sparkles}
            title={t('arbitrageAnalysis')}
            description={result ? t('liveMarketAnalysis') : t('resultsDescription')}
            variant="orange"
          />
          <StyledCardContent>
            {result ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                {/* Modern Signal Status with Gradient */}
                <div className={`rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] ${result.arbitrage.signal.includes("long")
                  ? "border-green-300 bg-linear-to-br from-green-50 to-emerald-50"
                  : result.arbitrage.signal.includes("short")
                    ? "border-red-300 bg-linear-to-br from-red-50 to-rose-50"
                    : "border-gray-300 bg-linear-to-br from-gray-50 to-slate-50"
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.arbitrage.signal.includes("long") ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold text-lg">
                      {result.arbitrage.signal.toUpperCase().replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm">
                    Premium: {formatPercent(result.arbitrage.premium_percent)}
                  </p>
                </div>

                {/* Modern Recommendation Card */}
                <div className="rounded-2xl border-2 border-blue-200 p-5 bg-linear-to-br from-blue-50 to-cyan-50 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-sm font-medium mb-1">{t('recommendation')}</div>
                  <p className="text-sm">{result.recommendation}</p>
                  <div className="mt-2">
                    <Badge variant={result.risk_level === "low" ? "default" : result.risk_level === "high" ? "destructive" : "outline"}>
                      {t('risk')}: {result.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Modern Price Comparison with Gradients */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-xl border-2 border-purple-100 bg-linear-to-r from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-semibold text-purple-900">{t('mcxPrice')}</span>
                    <span className="font-mono font-bold text-lg text-purple-700">
                      {formatCurrency(result.arbitrage.mcx_price)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-xl border-2 border-blue-100 bg-linear-to-r from-blue-50 to-cyan-50 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-semibold text-blue-900">{t('fairValue')}</span>
                    <span className="font-mono font-bold text-lg text-blue-700">
                      {formatCurrency(result.arbitrage.fair_value)}
                    </span>
                  </div>

                  <div className={`flex justify-between items-center p-4 rounded-xl border-2 bg-linear-to-r hover:shadow-md transition-all duration-300 ${result.arbitrage.premium > 0
                    ? "border-green-200 from-green-50 to-emerald-50"
                    : "border-red-200 from-red-50 to-rose-50"
                    }`}>
                    <span className={`text-sm font-semibold ${result.arbitrage.premium > 0 ? "text-green-900" : "text-red-900"
                      }`}>{t('premium')}</span>
                    <span className={`font-mono font-bold text-lg ${result.arbitrage.premium > 0 ? "text-green-700" : "text-red-700"
                      }`}>
                      {formatCurrency(result.arbitrage.premium)}
                    </span>
                  </div>
                </div>

                {/* Fair Value Details */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{t('fairValueCalculation')}</div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('comexPrice')}</span>
                    <span className="font-mono">${formatNumber(result.fair_value.comex_price_usd)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('usdinrRate')}</span>
                    <span className="font-mono">₹{formatNumber(result.fair_value.usdinr_rate)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('pricePerGram')}</span>
                    <span className="font-mono">₹{formatNumber(result.fair_value.price_per_gram_inr)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('importDuty')}</span>
                    <span className="font-mono">{formatNumber(result.fair_value.import_duty_percent)}%</span>
                  </div>
                </div>

                {/* Profit Analysis */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{t('profitAnalysis')}</div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('grossProfit')}</span>
                    <span className={`font-mono font-semibold ${result.profit_analysis.gross_profit > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {formatCurrency(result.profit_analysis.gross_profit)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('totalCosts')}</span>
                    <span className="font-mono">
                      {formatCurrency(result.profit_analysis.total_costs)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm bg-primary/5">
                    <span className="font-medium">{t('netProfit')}</span>
                    <span className={`font-mono font-semibold ${result.profit_analysis.net_profit > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {formatCurrency(result.profit_analysis.net_profit)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>{t('netProfitPercent')}</span>
                    <span className={`font-mono font-semibold ${result.profit_analysis.net_profit_percent > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {formatPercent(result.profit_analysis.net_profit_percent)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center">
                <div className="text-muted-foreground animate-pulse">
                  <div className="p-4 bg-linear-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-purple-600" />
                  </div>
                  <p className="text-lg font-medium">{t('enterValues')}</p>
                  <p className="text-sm mt-1">{t('toSeeAnalysis')}</p>
                </div>
              </div>
            )}
          </StyledCardContent>
        </StyledCard>
      </div>

      {/* Chart Visualization */}
      {result && (
        <ArbitrageSpreadChart
          fairValue={result.arbitrage.fair_value}
          mcxPrice={result.arbitrage.mcx_price}
          premium={result.arbitrage.premium}
          profitAnalysis={result.profit_analysis}
        />
      )}

      {/* Arbitrage Heatmap */}
      {result && (
        <ArbitrageHeatmap
          premiumPercent={result.arbitrage.premium_percent}
          premium={result.arbitrage.premium}
          signal={result.arbitrage.signal}
          commodity="GOLD"
        />
      )}

      {/* Show these sections only after arbitrage is calculated */}
      {result && (
        <>
          {/* Multi-Commodity Tracker */}
          <MultiCommodityTracker />

          {/* USD/INR Sensitivity Analysis */}
          <USDINRSensitivity
            initialComexPrice={result.fair_value.comex_price_usd}
            initialUsdinr={result.fair_value.usdinr_rate}
          />

          {/* Historical Arbitrage Data */}
          <ArbitrageHistoryChart />
        </>
      )}

    </div>
  )
}
