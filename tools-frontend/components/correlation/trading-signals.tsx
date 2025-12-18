"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber } from "@/lib/utils"
import {
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    AlertTriangle,
    Target,
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    Minus
} from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { TradingSignalsResponse } from "@/types"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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

export function TradingSignals() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<TradingSignalsResponse | null>(null)
    const [asset1, setAsset1] = useState("GOLD")
    const [asset2, setAsset2] = useState("USDINR")
    const [periodDays, setPeriodDays] = useState("90")
    const [lookbackDays, setLookbackDays] = useState("30")
    const initialLoadRef = useRef(false)

    // Auto-calculate on mount
    useEffect(() => {
        if (initialLoadRef.current) return
        initialLoadRef.current = true

        const timer = setTimeout(() => {
            setLoading(true)
            correlationApi.getTradingSignals("GOLD", "USDINR", 90, 30)
                .then(response => setResult(response))
                .catch(err => console.error("Auto-calc signals error:", err))
                .finally(() => setLoading(false))
        }, 300)

        return () => clearTimeout(timer)
    }, [])

    const handleCalculate = async () => {
        if (asset1 === asset2) {
            toast.error("Please select two different assets")
            return
        }

        setLoading(true)
        try {
            const response = await correlationApi.getTradingSignals(
                asset1,
                asset2,
                parseInt(periodDays),
                parseInt(lookbackDays)
            )
            setResult(response)
            toast.success("Trading signals generated!")
        } catch (error) {
            console.error("Error generating signals:", error)
            toast.error("Failed to generate signals. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const getSignalColor = (signal: string) => {
        if (signal.includes("buy") || signal === "strong_buy") return "text-green-700 bg-green-100 border-green-300"
        if (signal.includes("sell") || signal === "strong_sell") return "text-red-700 bg-red-100 border-red-300"
        return "text-gray-700 bg-gray-100 border-gray-300"
    }

    const getSignalIcon = (signal: string) => {
        if (signal.includes("buy") || signal === "strong_buy") return <TrendingUp className="h-5 w-5 text-green-600" />
        if (signal.includes("sell") || signal === "strong_sell") return <TrendingDown className="h-5 w-5 text-red-600" />
        return <Minus className="h-5 w-5 text-gray-600" />
    }

    const getConfidenceColor = (confidence: string) => {
        if (confidence === "high") return "bg-green-500"
        if (confidence === "medium") return "bg-yellow-500"
        return "bg-gray-400"
    }

    const getSignalTypeIcon = (type: string) => {
        switch (type) {
            case "mean_reversion": return <Activity className="h-4 w-4" />
            case "trend_following": return <TrendingUp className="h-4 w-4" />
            case "lead_lag": return <Clock className="h-4 w-4" />
            case "breakout_confirmation": return <Target className="h-4 w-4" />
            default: return <Zap className="h-4 w-4" />
        }
    }

    return (
        <Card className="border-2">
            <CardHeader className="pb-4 bg-amber-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Correlation-Based Trading Signals
                </CardTitle>
                <CardDescription>
                    Generate trading signals based on divergence, lead-lag, and correlation analysis
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                {/* Input Section */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-amber-700">Asset 1</Label>
                        <Select value={asset1} onValueChange={setAsset1}>
                            <SelectTrigger className="bg-white border-amber-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-orange-700">Asset 2</Label>
                        <Select value={asset2} onValueChange={setAsset2}>
                            <SelectTrigger className="bg-white border-orange-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">History (days)</Label>
                        <Input type="number" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} className="bg-white" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Lookback (days)</Label>
                        <Input type="number" value={lookbackDays} onChange={(e) => setLookbackDays(e.target.value)} className="bg-white" />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleCalculate} disabled={loading} className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">Generate <ArrowRight className="h-4 w-4" /></span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results */}
                {result ? (
                    <div className="space-y-5">
                        {/* Overall Signal Card */}
                        <div className={`p-5 rounded-xl border-2 ${getSignalColor(result.overall_signal)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/50 rounded-xl">
                                        {getSignalIcon(result.overall_signal)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold capitalize">{result.overall_signal.replace("_", " ")}</h3>
                                        <p className="text-sm opacity-80">{result.summary}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 rounded-full ${getConfidenceColor(result.confidence)}`} />
                                        <span className="font-semibold capitalize">{result.confidence} confidence</span>
                                    </div>
                                    <span className="text-sm opacity-75">{result.signal_count} signal(s) detected</span>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200 text-center">
                                <p className="text-xs text-blue-600 uppercase font-medium mb-1">Correlation</p>
                                <p className="text-2xl font-bold text-blue-700">{formatNumber(result.correlation, 3)}</p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-purple-50 border-purple-200 text-center">
                                <p className="text-xs text-purple-600 uppercase font-medium mb-1">Beta</p>
                                <p className="text-2xl font-bold text-purple-700">{formatNumber(result.beta, 3)}</p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-amber-50 border-amber-200 text-center">
                                <p className="text-xs text-amber-600 uppercase font-medium mb-1">Z-Score</p>
                                <p className="text-2xl font-bold text-amber-700">{formatNumber(result.divergence.z_score, 2)}</p>
                            </div>
                            <div className={`p-4 rounded-xl border-2 text-center ${result.divergence.has_divergence ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <p className="text-xs uppercase font-medium mb-1">Divergence</p>
                                <div className="flex items-center justify-center gap-2">
                                    {result.divergence.has_divergence ? <XCircle className="h-6 w-6 text-red-600" /> : <CheckCircle className="h-6 w-6 text-green-600" />}
                                    <span className="text-xl font-bold">{result.divergence.has_divergence ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Divergence & Lead-Lag Analysis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Divergence Analysis
                                </h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-amber-700">Expected Move:</span>
                                        <span className="font-bold">{formatNumber(result.divergence.expected_move, 2)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-amber-700">Actual Move:</span>
                                        <span className="font-bold">{formatNumber(result.divergence.actual_move, 2)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                                        <span className="text-sm text-amber-700">Difference:</span>
                                        <span className={`font-bold ${result.divergence.divergence_pct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.divergence.divergence_pct > 0 ? '+' : ''}{formatNumber(result.divergence.divergence_pct, 2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Lead-Lag Analysis
                                </h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">Leading Asset:</span>
                                        <span className="font-bold uppercase">
                                            {result.lead_lag.leading_asset === "asset1" ? result.asset1 :
                                                result.lead_lag.leading_asset === "asset2" ? result.asset2 : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">Lag Period:</span>
                                        <span className="font-bold">{result.lead_lag.lag_periods} day(s)</span>
                                    </div>
                                    <div className="pt-2 border-t border-blue-200">
                                        <p className="text-xs text-blue-800">{result.lead_lag.interpretation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Signals */}
                        {result.signals.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-600" /> Active Signals ({result.signals.length})
                                </h4>
                                {result.signals.map((signal, index) => (
                                    <div key={index} className="p-4 rounded-xl border-2 bg-white hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-100 rounded-lg">{getSignalTypeIcon(signal.type)}</div>
                                                <div>
                                                    <span className="font-semibold capitalize">{signal.type.replace("_", " ")}</span>
                                                    <p className="text-sm text-muted-foreground">{signal.reason}</p>
                                                </div>
                                            </div>
                                            <Badge className={`px-3 py-1 ${getSignalColor(signal.signal)}`}>
                                                {signal.signal.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex h-48 items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Zap className="h-8 w-8 text-amber-600" />
                            </div>
                            <p className="text-lg font-medium">Generate Trading Signals</p>
                            <p className="text-sm mt-1">Select assets and click Generate to analyze</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
