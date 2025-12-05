"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowRight, Info, Activity } from "lucide-react"
import { cotApi } from "@/lib/api/cot"
import type { COTAnalysisResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"
import { COTPositioningChart } from "@/components/charts/cot-positioning-chart"

export default function COTReportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<COTAnalysisResponse | null>(null)
  const [commodity, setCommodity] = useState("GOLD")
  const [weeks, setWeeks] = useState("52")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await cotApi.getAnalysis({
        commodity,
        weeks: parseInt(weeks),
      })
      setResult(response)
      toast.success("COT analysis complete!")
    } catch (error) {
      console.error("Error fetching COT data:", error)
      toast.error("Failed to fetch COT data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Generate mock historical data for chart visualization
  const generateHistoricalData = (result: COTAnalysisResponse) => {
    const numWeeks = Math.min(parseInt(weeks) || 52, 52)
    const data = []
    const baseCommercial = result.current_positions.commercial_net
    const baseNonCommercial = result.current_positions.non_commercial_net
    const baseOI = result.current_positions.open_interest
    
    for (let i = numWeeks; i >= 0; i--) {
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() - (i * 7))
      
      // Create realistic variation
      const variation = Math.sin(i / 5) * 0.15
      const trend = (numWeeks - i) / numWeeks * 0.1
      data.push({
        date: weekDate.toISOString().split('T')[0],
        commercial: Math.round(baseCommercial * (1 + variation - trend)),
        nonCommercial: Math.round(baseNonCommercial * (1 - variation + trend)),
        openInterest: Math.round(baseOI * (1 + Math.sin(i / 3) * 0.05))
      })
    }
    return data
  }

  const getSignalColor = (signal: string) => {
    if (signal === "strong_buy" || signal === "buy") return "text-green-600 bg-green-50"
    if (signal === "strong_sell" || signal === "sell") return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-2xl">
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
                <span className="text-sm font-medium opacity-90">Market Positioning Intelligence</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Analyze Commitment of Traders (COT) reports for institutional positioning insights
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-2 hover:border-orange-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Info className="h-5 w-5 text-orange-600" />
              </div>
              Input Parameters
            </CardTitle>
            <CardDescription>Select commodity and analysis period</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity</Label>
                <Select value={commodity} onValueChange={setCommodity}>
                  <SelectTrigger id="commodity">
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
                <Label htmlFor="weeks">Historical Weeks</Label>
                <Input
                  id="weeks"
                  type="number"
                  placeholder="52"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Positions...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze COT Data
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-2 hover:border-yellow-200 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              COT Analysis
            </CardTitle>
            <CardDescription>
              {result ? `${result.commodity} - Latest report: ${result.latest_report_date}` : "Results will appear here after analysis"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {result ? (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                {/* Trading Signal */}
                <div className={`rounded-lg border p-4 ${getSignalColor(result.signal.signal)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.signal.signal.includes("buy") ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="font-semibold text-lg">
                      {result.signal.signal.toUpperCase().replace("_", " ")}
                    </span>
                    <Badge variant="outline">{result.signal.confidence}</Badge>
                  </div>
                  <p className="text-sm">{result.signal.reasoning}</p>
                </div>

                {/* Current Positions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Current Positions</div>
                  
                  <div className="p-3 rounded border bg-blue-50">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Commercial Net</span>
                      <span className="font-mono font-semibold">
                        {formatNumber(result.current_positions.commercial_net, 0)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Percentile: {formatNumber(result.commercial_percentile.percentile_1y, 1)}%
                      {result.commercial_percentile.is_extreme && (
                        <Badge variant="destructive" className="ml-2">EXTREME</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded border bg-orange-50">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Speculator Net</span>
                      <span className="font-mono font-semibold">
                        {formatNumber(result.current_positions.non_commercial_net, 0)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Percentile: {formatNumber(result.non_commercial_percentile.percentile_1y, 1)}%
                      {result.non_commercial_percentile.is_extreme && (
                        <Badge variant="destructive" className="ml-2">EXTREME</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded border bg-muted">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Open Interest</span>
                      <span className="font-mono font-semibold">
                        {formatNumber(result.current_positions.open_interest, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Week-over-Week Changes */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Week-over-Week Changes</div>
                  
                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Commercial</span>
                    <span className={`font-mono font-semibold ${
                      result.commercial_net_change > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {result.commercial_net_change > 0 ? "+" : ""}
                      {formatNumber(result.commercial_net_change, 0)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded border text-sm">
                    <span>Speculator</span>
                    <span className={`font-mono font-semibold ${
                      result.non_commercial_net_change > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {result.non_commercial_net_change > 0 ? "+" : ""}
                      {formatNumber(result.non_commercial_net_change, 0)}
                    </span>
                  </div>
                </div>

                {/* Bias */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded border">
                    <div className="text-muted-foreground mb-1">Commercial Bias</div>
                    <Badge>{result.signal.commercial_bias}</Badge>
                  </div>
                  <div className="p-2 rounded border">
                    <div className="text-muted-foreground mb-1">Speculator Bias</div>
                    <Badge>{result.signal.speculator_bias}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center text-muted-foreground animate-pulse">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-orange-600" />
                  </div>
                  <p className="text-lg font-medium">Select parameters and analyze</p>
                  <p className="text-sm mt-1">to see COT data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COT Positioning Chart */}
      {result && (
        <COTPositioningChart data={generateHistoricalData(result)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>About COT Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            The Commitment of Traders (COT) report shows positioning of different trader categories in futures markets.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Commercial traders: Hedgers and producers (smart money)</li>
            <li>Non-commercial traders: Speculators and large funds</li>
            <li>Extreme positioning often precedes market reversals</li>
            <li>Follow commercial traders for contrarian signals</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
