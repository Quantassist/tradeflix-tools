"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight, Target, Info, RefreshCw } from "lucide-react"
import { pivotApi } from "@/lib/api/pivot"
import type { PivotResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { PivotLevelsChart } from "@/components/charts/pivot-levels-chart"
import { toast } from "sonner"

export default function PivotCalculatorPage() {
  const [loading, setLoading] = useState(false)
  const [autoFetchLoading, setAutoFetchLoading] = useState(false)
  const [result, setResult] = useState<PivotResponse | null>(null)
  const [formData, setFormData] = useState({
    symbol: "GOLD",
    high: "",
    low: "",
    close: "",
    timeframe: "daily",
  })

  const handleAutoFetch = async () => {
    setAutoFetchLoading(true)
    try {
      const data = await pivotApi.getAutoPivots(
        formData.symbol,
        formData.timeframe,
        "COMEX"
      )
      setFormData({
        ...formData,
        high: data.ohlc.high.toFixed(2),
        low: data.ohlc.low.toFixed(2),
        close: data.ohlc.close.toFixed(2),
      })
      toast.success(`Fetched ${formData.timeframe} OHLC for ${formData.symbol} (${data.ohlc_date})`)
    } catch (error: unknown) {
      console.error("Error auto-fetching OHLC:", error)
      toast.error("Failed to fetch OHLC data. Please enter values manually.")
    } finally {
      setAutoFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await pivotApi.calculate({
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        ohlc: {
          high: parseFloat(formData.high),
          low: parseFloat(formData.low),
          close: parseFloat(formData.close),
        },
      })
      setResult(response)
      toast.success("Pivot levels calculated successfully!")
    } catch (error: any) {
      console.error("Error calculating pivots:", error)
      toast.error("Failed to calculate pivots. Please check your inputs and try again.")
      let errorMessage = "Failed to calculate pivots."
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        errorMessage = "Cannot connect to backend API. Please ensure:\n\n1. Backend server is running at http://localhost:8000\n2. Run: cd tools-backend && .venv\\Scripts\\python.exe main.py"
      } else if (error.response) {
        errorMessage = `API Error: ${error.response.data?.detail || error.response.statusText}`
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (type: string) => {
    if (type === "resistance") return <TrendingUp className="h-4 w-4 text-red-600" />
    if (type === "support") return <TrendingDown className="h-4 w-4 text-green-600" />
    return <Minus className="h-4 w-4 text-blue-600" />
  }

  const getLevelColor = (type: string) => {
    if (type === "resistance") return "text-red-600 bg-red-50 border-red-200"
    if (type === "support") return "text-green-600 bg-green-50 border-green-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Calculator className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Pivot Calculator</h1>
              <div className="flex items-center gap-2 mt-1">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Precision Trading Levels</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Calculate CPR, Floor, and Fibonacci pivot points for precise intraday trading decisions
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modern Input Form */}
        <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              Input Parameters
            </CardTitle>
            <CardDescription>
              Enter previous day's High, Low, and Close prices
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Select
                  value={formData.symbol}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, symbol: value })
                  }
                >
                  <SelectTrigger id="symbol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="CRUDE">Crude Oil</SelectItem>
                    <SelectItem value="USDINR">USD/INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select
                  value={formData.timeframe}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, timeframe: value })
                  }
                >
                  <SelectTrigger id="timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-fetch HLC Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                onClick={handleAutoFetch}
                disabled={autoFetchLoading}
              >
                {autoFetchLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Fetching Live Data...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Auto-Fetch Previous {formData.timeframe.charAt(0).toUpperCase() + formData.timeframe.slice(1)} HLC
                  </span>
                )}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="high">High Price</Label>
                <Input
                  id="high"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 62500"
                  value={formData.high}
                  onChange={(e) =>
                    setFormData({ ...formData, high: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low">Low Price</Label>
                <Input
                  id="low"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 62000"
                  value={formData.low}
                  onChange={(e) =>
                    setFormData({ ...formData, low: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="close">Close Price</Label>
                <Input
                  id="close"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 62300"
                  value={formData.close}
                  onChange={(e) =>
                    setFormData({ ...formData, close: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Calculating Levels...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Calculate Pivots
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modern Results Card */}
        <Card className="border-2 hover:border-teal-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-teal-600" />
              </div>
              Pivot Levels
            </CardTitle>
            <CardDescription>
              {result
                ? `${result.symbol} - ${result.timeframe.toUpperCase()} pivots`
                : "Results will appear here after calculation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {result ? (
              <div className="animate-in slide-in-from-bottom duration-500">
                <Tabs defaultValue="cpr" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cpr">CPR</TabsTrigger>
                    <TabsTrigger value="floor">Floor Pivots</TabsTrigger>
                    <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
                  </TabsList>

                  {/* Modern CPR Levels */}
                  <TabsContent value="cpr" className="space-y-3">
                    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">TC (Top Central)</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.cpr.tc)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Pivot</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.cpr.pivot)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">BC (Bottom Central)</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.cpr.bc)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">CPR Width:</span>
                          <span className="font-medium">₹{formatNumber(result.cpr.width)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Classification:</span>
                          <Badge variant="outline">{result.cpr.classification.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Floor Pivots */}
                  <TabsContent value="floor" className="space-y-3">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600" />
                          <span className="font-medium">R3</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.r3)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600" />
                          <span className="font-medium">R2</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.r2)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600" />
                          <span className="font-medium">R1</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.r1)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Pivot</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.pivot)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">S1</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.s1)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">S2</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.s2)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">S3</span>
                        </div>
                        <span className="font-mono font-semibold">₹{formatNumber(result.floor_pivots.s3)}</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Fibonacci Levels */}
                  <TabsContent value="fibonacci" className="space-y-3">
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">0% (Low)</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_0)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">23.6%</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_236)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">38.2%</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_382)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">50.0%</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_500)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">61.8%</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_618)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">78.6%</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_786)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">100% (High)</span>
                        <span className="font-mono font-semibold">₹{formatNumber(result.fibonacci.level_100)}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center">
                <div className="text-muted-foreground animate-pulse">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calculator className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium">Enter values and calculate</p>
                  <p className="text-sm mt-1">to see pivot levels</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <Tabs defaultValue="cpr" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cpr">CPR Method</TabsTrigger>
          <TabsTrigger value="floor">Floor Pivots</TabsTrigger>
          <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
        </TabsList>
        <TabsContent value="cpr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Central Pivot Range (CPR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                CPR is calculated using three levels: TC (Top Central), Pivot, and BC (Bottom Central).
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pivot = (High + Low + Close) / 3</li>
                <li>BC = (High + Low) / 2</li>
                <li>TC = (Pivot - BC) + Pivot</li>
              </ul>
              <p className="text-muted-foreground">
                Narrow CPR indicates a trending day, while wide CPR suggests consolidation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="floor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Floor Pivot Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Traditional pivot points with support and resistance levels.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pivot = (High + Low + Close) / 3</li>
                <li>R1 = (2 × Pivot) - Low</li>
                <li>S1 = (2 × Pivot) - High</li>
                <li>R2 = Pivot + (High - Low)</li>
                <li>S2 = Pivot - (High - Low)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fibonacci" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fibonacci Pivot Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Pivot points calculated using Fibonacci ratios (38.2%, 61.8%, 100%).
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pivot = (High + Low + Close) / 3</li>
                <li>R1 = Pivot + 0.382 × (High - Low)</li>
                <li>R2 = Pivot + 0.618 × (High - Low)</li>
                <li>S1 = Pivot - 0.382 × (High - Low)</li>
                <li>S2 = Pivot - 0.618 × (High - Low)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chart Visualization */}
      {result && (
        <PivotLevelsChart
          cpr={result.cpr}
          floorPivots={result.floor_pivots}
          currentPrice={result.ohlc.close}
        />
      )}
    </div>
  )
}
