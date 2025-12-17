"use client"

import { useState, useEffect, useRef } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber } from "@/lib/utils"
import { Calculator, TrendingUp, ArrowRight, Info, Gauge, BarChart2, Percent } from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { BetaCalculationResponse } from "@/types"
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

export function BetaCalculator() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<BetaCalculationResponse | null>(null)
    const [asset, setAsset] = useState("SILVER")
    const [benchmark, setBenchmark] = useState("GOLD")
    const [periodDays, setPeriodDays] = useState("90")
    const [expectedMove, setExpectedMove] = useState("")
    const [calculatedMove, setCalculatedMove] = useState<number | null>(null)
    const initialLoadRef = useRef(false)

    // Auto-calculate on mount
    useEffect(() => {
        if (initialLoadRef.current) return
        initialLoadRef.current = true

        const timer = setTimeout(() => {
            setLoading(true)
            correlationApi.getBeta("SILVER", "GOLD", 90)
                .then(response => setResult(response))
                .catch(err => console.error("Auto-calc beta error:", err))
                .finally(() => setLoading(false))
        }, 150)

        return () => clearTimeout(timer)
    }, [])

    const handleCalculate = async () => {
        if (asset === benchmark) {
            toast.error("Asset and benchmark must be different")
            return
        }

        setLoading(true)
        try {
            const response = await correlationApi.getBeta(asset, benchmark, parseInt(periodDays))
            setResult(response)
            setCalculatedMove(null)
            toast.success("Beta calculated successfully!")
        } catch (error) {
            console.error("Error calculating beta:", error)
            toast.error("Failed to calculate beta. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleScenarioCalculation = () => {
        if (!result || !expectedMove) return
        const move = parseFloat(expectedMove)
        if (isNaN(move)) return

        const assetMove = result.beta * move
        setCalculatedMove(assetMove)
    }

    const getBetaInterpretation = (beta: number) => {
        if (beta > 1.5) return { label: "Very High", color: "text-red-600 bg-red-50 border-red-200" }
        if (beta > 1.2) return { label: "High", color: "text-orange-600 bg-orange-50 border-orange-200" }
        if (beta > 0.8) return { label: "Similar", color: "text-blue-600 bg-blue-50 border-blue-200" }
        if (beta > 0.5) return { label: "Lower", color: "text-green-600 bg-green-50 border-green-200" }
        return { label: "Low", color: "text-gray-600 bg-gray-50 border-gray-200" }
    }

    return (
        <StyledCard variant="green">
            <StyledCardHeader
                icon={Calculator}
                title="Beta (Sensitivity) Calculator"
                description="Calculate how much an asset moves relative to a benchmark"
                variant="green"
            />
            <StyledCardContent>
                {/* Input Section */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-emerald-700">Asset</Label>
                        <Select value={asset} onValueChange={setAsset}>
                            <SelectTrigger className="bg-white border-emerald-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-teal-700">Benchmark</Label>
                        <Select value={benchmark} onValueChange={setBenchmark}>
                            <SelectTrigger className="bg-white border-teal-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Period</Label>
                        <Select value={periodDays} onValueChange={setPeriodDays}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="60">60 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                                <SelectItem value="180">180 days</SelectItem>
                                <SelectItem value="365">1 year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Calculate <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results Section */}
                {result ? (
                    <div className="space-y-5">
                        {/* Main Beta Display */}
                        <div className="flex justify-center py-2">
                            <div className={`relative p-6 rounded-2xl border-2 ${getBetaInterpretation(result.beta).color}`}>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Gauge className="h-5 w-5" />
                                        <span className="text-sm font-semibold uppercase">Beta Value</span>
                                    </div>
                                    <p className="text-5xl font-bold">{formatNumber(result.beta, 3)}</p>
                                    <Badge className="mt-2">{getBetaInterpretation(result.beta).label} Sensitivity</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border-2 bg-white hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <Percent className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase">R² (Explained)</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-700">{formatNumber(result.r_squared * 100, 1)}%</p>
                                <p className="text-xs text-slate-500 mt-1">Variance explained by benchmark</p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-white hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart2 className="h-4 w-4 text-purple-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Correlation</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-700">{formatNumber(result.correlation, 3)}</p>
                                <p className="text-xs text-slate-500 mt-1">Linear relationship strength</p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-white hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Vol Ratio</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-700">{formatNumber(result.volatility_ratio, 2)}x</p>
                                <p className="text-xs text-slate-500 mt-1">Relative volatility</p>
                            </div>
                        </div>

                        {/* Interpretation */}
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="font-medium text-emerald-900 mb-1">Analysis</p>
                                    <p className="text-sm text-emerald-800">{result.interpretation}</p>
                                </div>
                            </div>
                        </div>

                        {/* Scenario Calculator */}
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Scenario Calculator
                            </h5>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm text-amber-800">If {result.benchmark} moves</span>
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Enter %"
                                    value={expectedMove}
                                    onChange={(e) => setExpectedMove(e.target.value)}
                                    className="w-24 bg-white"
                                />
                                <Button size="sm" variant="outline" onClick={handleScenarioCalculation} className="border-amber-300 hover:bg-amber-100">
                                    Calculate
                                </Button>
                                {calculatedMove !== null && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 shadow-sm">
                                        <span className="text-sm text-amber-800">→ {result.asset}:</span>
                                        <span className={`text-xl font-bold ${calculatedMove >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {calculatedMove >= 0 ? "+" : ""}{formatNumber(calculatedMove, 2)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-48 items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="p-4 bg-emerald-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Calculator className="h-8 w-8 text-emerald-600" />
                            </div>
                            <p className="text-lg font-medium">Calculate Beta</p>
                            <p className="text-sm mt-1">Select assets and click Calculate to analyze</p>
                        </div>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
