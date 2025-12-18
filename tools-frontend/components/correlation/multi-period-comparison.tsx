"use client"

import { useState, useEffect, useRef } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber } from "@/lib/utils"
import { Clock, TrendingUp, TrendingDown, ArrowRight, Info, Minus, Calendar, BarChart3 } from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { MultiPeriodCorrelationResponse } from "@/types"
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

export function MultiPeriodComparison() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<MultiPeriodCorrelationResponse | null>(null)
    const [asset1, setAsset1] = useState("GOLD")
    const [asset2, setAsset2] = useState("USDINR")
    const initialLoadRef = useRef(false)

    // Auto-calculate on mount
    useEffect(() => {
        if (initialLoadRef.current) return
        initialLoadRef.current = true

        const timer = setTimeout(() => {
            setLoading(true)
            correlationApi.getMultiPeriodComparison("GOLD", "USDINR", [30, 90, 180, 365])
                .then(response => setResult(response))
                .catch(err => console.error("Auto-calc multi-period error:", err))
                .finally(() => setLoading(false))
        }, 200)

        return () => clearTimeout(timer)
    }, [])

    const handleCalculate = async () => {
        if (asset1 === asset2) {
            toast.error("Please select two different assets")
            return
        }

        setLoading(true)
        try {
            const response = await correlationApi.getMultiPeriodComparison(asset1, asset2, [30, 90, 180, 365])
            setResult(response)
            toast.success("Multi-period analysis complete!")
        } catch (error) {
            console.error("Error calculating multi-period correlation:", error)
            toast.error("Failed to calculate. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const getCorrelationColor = (value: number) => {
        if (value > 0.7) return "bg-green-500"
        if (value > 0.3) return "bg-green-300"
        if (value > -0.3) return "bg-gray-300"
        if (value > -0.7) return "bg-red-300"
        return "bg-red-500"
    }

    const getCorrelationTextColor = (value: number) => {
        if (value > 0.7) return "text-green-700"
        if (value > 0.3) return "text-green-600"
        if (value > -0.3) return "text-gray-600"
        if (value > -0.7) return "text-red-600"
        return "text-red-700"
    }

    const getTrendIcon = (trend: string) => {
        if (trend === "strengthening") return <TrendingUp className="h-4 w-4 text-green-600" />
        if (trend === "weakening") return <TrendingDown className="h-4 w-4 text-red-600" />
        return <Minus className="h-4 w-4 text-gray-600" />
    }

    const getTrendBadge = (trend: string) => {
        if (trend === "strengthening") return <Badge className="bg-green-100 text-green-700">Strengthening</Badge>
        if (trend === "weakening") return <Badge className="bg-red-100 text-red-700">Weakening</Badge>
        return <Badge className="bg-gray-100 text-gray-700">Stable</Badge>
    }

    const getPeriodLabel = (days: number) => {
        if (days === 30) return "30 Days"
        if (days === 90) return "90 Days"
        if (days === 180) return "6 Months"
        if (days === 365) return "1 Year"
        return `${days} Days`
    }

    return (
        <StyledCard variant="indigo">
            <StyledCardHeader
                icon={Clock}
                title="Multi-Period Correlation Analysis"
                description="Compare correlation across different time periods (30d, 90d, 6m, 1y)"
                variant="indigo"
            />
            <StyledCardContent>
                {/* Input Section */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-indigo-700">Asset 1</Label>
                        <Select value={asset1} onValueChange={setAsset1}>
                            <SelectTrigger className="bg-white border-indigo-200">
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-violet-700">Asset 2</Label>
                        <Select value={asset2} onValueChange={setAsset2}>
                            <SelectTrigger className="bg-white border-violet-200">
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Compare <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results Section */}
                {result ? (
                    <div className="space-y-5">
                        {/* Period Comparison Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            {result.periods.map((period, index) => {
                                const colors = [
                                    "from-blue-500 to-blue-600",
                                    "from-indigo-500 to-indigo-600",
                                    "from-violet-500 to-violet-600",
                                    "from-purple-500 to-purple-600"
                                ]
                                return (
                                    <div
                                        key={period.period_days}
                                        className="relative overflow-hidden rounded-xl border-2 bg-white shadow-sm hover:shadow-lg transition-all"
                                    >
                                        <div className={`h-1.5 bg-linear-to-r ${colors[index]}`} />
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-600">
                                                    {getPeriodLabel(period.period_days)}
                                                </span>
                                            </div>
                                            <div className={`text-3xl font-bold ${getCorrelationTextColor(period.correlation)}`}>
                                                {period.correlation > 0 ? "+" : ""}{formatNumber(period.correlation, 3)}
                                            </div>
                                            <Badge className={`mt-2 ${period.strength === "strong" ? "bg-green-100 text-green-700" :
                                                period.strength === "moderate" ? "bg-blue-100 text-blue-700" :
                                                    "bg-gray-100 text-gray-700"
                                                }`}>
                                                {period.strength.replace("_", " ")}
                                            </Badge>
                                            {/* Visual bar */}
                                            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${period.correlation > 0.5 ? "bg-green-500" :
                                                        period.correlation > 0 ? "bg-green-300" :
                                                            period.correlation > -0.5 ? "bg-red-300" : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${((period.correlation + 1) / 2) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Trend Summary */}
                        <div className={`p-5 rounded-xl border-2 ${result.trend === "strengthening" ? "bg-green-50 border-green-200" :
                            result.trend === "weakening" ? "bg-red-50 border-red-200" :
                                "bg-indigo-50 border-indigo-200"
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {getTrendIcon(result.trend)}
                                    <span className="text-lg font-semibold">Trend Analysis</span>
                                </div>
                                {getTrendBadge(result.trend)}
                            </div>
                            <p className="text-sm">{result.interpretation}</p>
                        </div>

                        {/* Detailed Table */}
                        <div className="overflow-hidden border-2 rounded-xl">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Period</th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Correlation</th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Strength</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.periods.map((period) => (
                                        <tr key={period.period_days} className="border-t hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                                                    <span className="font-medium">{getPeriodLabel(period.period_days)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`text-lg font-bold ${getCorrelationTextColor(period.correlation)}`}>
                                                    {period.correlation > 0 ? "+" : ""}{formatNumber(period.correlation, 3)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className="capitalize">
                                                    {period.strength.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm text-slate-500">
                                                {period.start_date} → {period.end_date}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Key Insights */}
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Key Insights</p>
                                    <p><strong>Short-term (30d):</strong> {formatNumber(result.periods[0]?.correlation ?? 0, 3)} | <strong>Long-term (1y):</strong> {formatNumber(result.periods[result.periods.length - 1]?.correlation ?? 0, 3)}</p>
                                    {result.trend !== "stable" && (
                                        <p className="mt-1 text-xs">{result.trend === "strengthening" ? "⚠️ Relationship stronger than historical norm - may revert to mean" : "⚠️ Relationship weaker than historical norm - watch for regime change"}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-48 items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="p-4 bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Clock className="h-8 w-8 text-indigo-600" />
                            </div>
                            <p className="text-lg font-medium">Compare Time Periods</p>
                            <p className="text-sm mt-1">Select two assets and click Compare to analyze</p>
                        </div>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
