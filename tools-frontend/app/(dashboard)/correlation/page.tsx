"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Network, AlertCircle, Sparkles, ArrowRight, Info, TrendingUp } from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { CorrelationMatrixResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap"
import { toast } from "sonner"

export default function CorrelationMatrixPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CorrelationMatrixResponse | null>(null)
  const [assets, setAssets] = useState("GOLD,SILVER,CRUDE,USDINR")
  const [periodDays, setPeriodDays] = useState("90")

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Network className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Correlation Matrix</h1>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Portfolio Diversification Analysis</span>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-2 hover:border-violet-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Info className="h-5 w-5 text-violet-600" />
              </div>
              Input Parameters
            </CardTitle>
            <CardDescription>Enter assets and time period</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assets">Assets (comma-separated)</Label>
                <Input
                  id="assets"
                  placeholder="GOLD,SILVER,CRUDE,USDINR"
                  value={assets}
                  onChange={(e) => setAssets(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter 2-5 asset symbols separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period (days)</Label>
                <Input
                  id="period"
                  type="number"
                  placeholder="90"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group" 
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-2 hover:border-fuchsia-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-fuchsia-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-fuchsia-600" />
              </div>
              Correlation Matrix
            </CardTitle>
            <CardDescription>
              {result ? `${result.assets.length} assets analyzed` : "Results will appear here after calculation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
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
                  <div className="p-4 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-violet-600" />
                  </div>
                  <p className="text-lg font-medium">Enter assets and calculate</p>
                  <p className="text-sm mt-1">to see correlation matrix</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Visualization */}
      {result && result.matrix && (
        <CorrelationHeatmap
          matrix={result.matrix}
          assets={result.assets}
        />
      )}

      <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Info className="h-5 w-5 text-indigo-600" />
            </div>
            About Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            Correlation measures how two assets move together. Values range from -1 to +1.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>+1: Perfect positive correlation (move together)</li>
            <li>0: No correlation (independent movement)</li>
            <li>-1: Perfect negative correlation (move opposite)</li>
            <li>Low correlation between assets provides better diversification</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
