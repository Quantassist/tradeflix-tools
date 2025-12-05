"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowRight, Info, RefreshCw } from "lucide-react"
import { arbitrageApi } from "@/lib/api/arbitrage"
import type { ArbitrageResponse } from "@/types"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils"
import { ArbitrageSpreadChart } from "@/components/charts/arbitrage-spread-chart"
import { toast } from "sonner"

export default function ArbitrageCalculatorPage() {
  const [loading, setLoading] = useState(false)
  const [autoFetchLoading, setAutoFetchLoading] = useState(false)
  const [result, setResult] = useState<ArbitrageResponse | null>(null)
  const [formData, setFormData] = useState({
    comex_price_usd: "",
    mcx_price_inr: "",
    usdinr_rate: "",
    import_duty_percent: "2.5",
    contract_size_grams: "10",  // MCX Gold is quoted per 10 grams
  })

  const handleAutoFetch = async () => {
    setAutoFetchLoading(true)
    try {
      const data = await arbitrageApi.getRealtime("GOLD")

      // Extract values from nested response structure
      const comexPrice = data.fair_value?.comex_price_usd
      const mcxPrice = data.arbitrage?.mcx_price
      const usdinrRate = data.fair_value?.usdinr_rate

      if (!comexPrice || !usdinrRate) {
        throw new Error("Invalid response from API")
      }

      setFormData({
        ...formData,
        comex_price_usd: comexPrice.toFixed(2),
        mcx_price_inr: mcxPrice ? mcxPrice.toFixed(2) : formData.mcx_price_inr,
        usdinr_rate: usdinrRate.toFixed(2),
      })

      const mcxStatus = mcxPrice
        ? `MCX: ₹${mcxPrice.toFixed(2)}`
        : "MCX: Not available (enter manually)"

      toast.success(`Live prices fetched! COMEX: $${comexPrice.toFixed(2)}, ${mcxStatus}, USD/INR: ${usdinrRate.toFixed(2)}`)
    } catch (error: unknown) {
      console.error("Error auto-fetching prices:", error)
      toast.error("Failed to fetch live prices. Please enter values manually.")
    } finally {
      setAutoFetchLoading(false)
    }
  }

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
    } catch (error: any) {
      console.error("Error calculating arbitrage:", error)
      toast.error("Failed to calculate arbitrage. Please check your inputs and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Arbitrage Heatmap</h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Real-time Opportunity Analysis</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Identify profitable arbitrage opportunities between COMEX and MCX markets with advanced analytics
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modern Input Form */}
        <Card className="border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              Input Parameters
            </CardTitle>
            <CardDescription>
              Enter market prices and parameters for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Auto-fetch Live Prices Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300"
                onClick={handleAutoFetch}
                disabled={autoFetchLoading}
              >
                {autoFetchLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Fetching Live Prices...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Auto-Fetch COMEX, MCX & USD/INR
                  </span>
                )}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="comex_price_usd">COMEX Price ($/oz)</Label>
                <Input
                  id="comex_price_usd"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2000"
                  value={formData.comex_price_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, comex_price_usd: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  International gold price per troy ounce
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcx_price_inr">MCX Price (₹/10g)</Label>
                <Input
                  id="mcx_price_inr"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 62500"
                  value={formData.mcx_price_inr}
                  onChange={(e) =>
                    setFormData({ ...formData, mcx_price_inr: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Domestic MCX gold price per 10 grams
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usdinr_rate">USD/INR Rate</Label>
                <Input
                  id="usdinr_rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 83.50"
                  value={formData.usdinr_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, usdinr_rate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="import_duty_percent">Import Duty (%)</Label>
                <Input
                  id="import_duty_percent"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  value={formData.import_duty_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, import_duty_percent: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_size_grams">Quote Unit (grams)</Label>
                <Input
                  id="contract_size_grams"
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.contract_size_grams}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_size_grams: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  MCX Gold is quoted per 10 grams
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Markets...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Calculate Arbitrage
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modern Results Card */}
        <Card className="border-2 hover:border-orange-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              Arbitrage Analysis
            </CardTitle>
            <CardDescription>
              {result ? "Live market opportunity analysis" : "Results will appear here after calculation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {result ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                {/* Modern Signal Status with Gradient */}
                <div className={`rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] ${result.arbitrage.signal.includes("long")
                  ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
                  : result.arbitrage.signal.includes("short")
                    ? "border-red-300 bg-gradient-to-br from-red-50 to-rose-50"
                    : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50"
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
                <div className="rounded-2xl border-2 border-blue-200 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-sm font-medium mb-1">Recommendation</div>
                  <p className="text-sm">{result.recommendation}</p>
                  <div className="mt-2">
                    <Badge variant={result.risk_level === "low" ? "default" : result.risk_level === "high" ? "destructive" : "outline"}>
                      Risk: {result.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Modern Price Comparison with Gradients */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-semibold text-purple-900">MCX Price</span>
                    <span className="font-mono font-bold text-lg text-purple-700">
                      {formatCurrency(result.arbitrage.mcx_price)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-semibold text-blue-900">Fair Value</span>
                    <span className="font-mono font-bold text-lg text-blue-700">
                      {formatCurrency(result.arbitrage.fair_value)}
                    </span>
                  </div>

                  <div className={`flex justify-between items-center p-4 rounded-xl border-2 bg-gradient-to-r hover:shadow-md transition-all duration-300 ${result.arbitrage.premium > 0
                    ? "border-green-200 from-green-50 to-emerald-50"
                    : "border-red-200 from-red-50 to-rose-50"
                    }`}>
                    <span className={`text-sm font-semibold ${result.arbitrage.premium > 0 ? "text-green-900" : "text-red-900"
                      }`}>Premium</span>
                    <span className={`font-mono font-bold text-lg ${result.arbitrage.premium > 0 ? "text-green-700" : "text-red-700"
                      }`}>
                      {formatCurrency(result.arbitrage.premium)}
                    </span>
                  </div>
                </div>

                {/* Fair Value Details */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Fair Value Calculation</div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>COMEX Price</span>
                    <span className="font-mono">${formatNumber(result.fair_value.comex_price_usd)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>USD/INR Rate</span>
                    <span className="font-mono">₹{formatNumber(result.fair_value.usdinr_rate)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Price per Gram</span>
                    <span className="font-mono">₹{formatNumber(result.fair_value.price_per_gram_inr)}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Import Duty</span>
                    <span className="font-mono">{formatNumber(result.fair_value.import_duty_percent)}%</span>
                  </div>
                </div>

                {/* Profit Analysis */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Profit Analysis</div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Gross Profit</span>
                    <span className={`font-mono font-semibold ${result.profit_analysis.gross_profit > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {formatCurrency(result.profit_analysis.gross_profit)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Total Costs</span>
                    <span className="font-mono">
                      {formatCurrency(result.profit_analysis.total_costs)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm bg-primary/5">
                    <span className="font-medium">Net Profit</span>
                    <span className={`font-mono font-semibold ${result.profit_analysis.net_profit > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {formatCurrency(result.profit_analysis.net_profit)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Net Profit %</span>
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
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-purple-600" />
                  </div>
                  <p className="text-lg font-medium">Enter values and calculate</p>
                  <p className="text-sm mt-1">to see arbitrage analysis</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Modern Info Card */}
      <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Info className="h-5 w-5 text-indigo-600" />
            </div>
            About Arbitrage Trading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Arbitrage is the simultaneous purchase and sale of the same asset in different markets to profit from price differences.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Fair Value = (International Price × Exchange Rate) + Import Duty + Transport Cost</li>
            <li>Premium = Domestic Price - Fair Value</li>
            <li>Positive premium indicates domestic market is expensive</li>
            <li>Negative premium indicates import opportunity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
