"use client"

import { useState, useEffect, useRef } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber } from "@/lib/utils"
import { PieChart, Shield, AlertTriangle, CheckCircle, ArrowRight, Info, TrendingUp, TrendingDown } from "lucide-react"
import { correlationApi } from "@/lib/api/correlation"
import type { DiversificationScore } from "@/types"
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

export function DiversificationAnalysis() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<DiversificationScore | null>(null)
    const [selectedAssets, setSelectedAssets] = useState<string[]>(["GOLD", "SILVER", "CRUDE"])
    const [periodDays, setPeriodDays] = useState("90")
    const [newAsset, setNewAsset] = useState("")
    const initialLoadRef = useRef(false)

    // Auto-calculate on mount
    useEffect(() => {
        if (initialLoadRef.current) return
        initialLoadRef.current = true

        const timer = setTimeout(() => {
            setLoading(true)
            correlationApi.getDiversification(["GOLD", "SILVER", "CRUDE"], 90)
                .then(response => setResult(response))
                .catch(err => console.error("Auto-calc diversification error:", err))
                .finally(() => setLoading(false))
        }, 250)

        return () => clearTimeout(timer)
    }, [])

    const handleAddAsset = (asset: string) => {
        if (asset && !selectedAssets.includes(asset) && selectedAssets.length < 10) {
            setSelectedAssets([...selectedAssets, asset])
            setNewAsset("")
        }
    }

    const handleRemoveAsset = (asset: string) => {
        if (selectedAssets.length > 2) {
            setSelectedAssets(selectedAssets.filter((a) => a !== asset))
        } else {
            toast.error("Minimum 2 assets required")
        }
    }

    const handleCalculate = async () => {
        if (selectedAssets.length < 2) {
            toast.error("Please select at least 2 assets")
            return
        }

        setLoading(true)
        try {
            const response = await correlationApi.getDiversification(selectedAssets, parseInt(periodDays))
            setResult(response)
            toast.success("Diversification analysis complete!")
        } catch (error) {
            console.error("Error analyzing diversification:", error)
            toast.error("Failed to analyze. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case "excellent": return "text-green-700 bg-green-100 border-green-300"
            case "good": return "text-blue-700 bg-blue-100 border-blue-300"
            case "moderate": return "text-yellow-700 bg-yellow-100 border-yellow-300"
            case "poor": return "text-red-700 bg-red-100 border-red-300"
            default: return "text-gray-700 bg-gray-100 border-gray-300"
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 75) return "text-green-600"
        if (score >= 60) return "text-blue-600"
        if (score >= 40) return "text-yellow-600"
        return "text-red-600"
    }

    const getScoreBorderColor = (score: number) => {
        if (score >= 75) return "border-green-500"
        if (score >= 60) return "border-blue-500"
        if (score >= 40) return "border-yellow-500"
        return "border-red-500"
    }

    const getScoreGradient = (score: number) => {
        if (score >= 75) return "from-green-500 to-emerald-500"
        if (score >= 60) return "from-blue-500 to-cyan-500"
        if (score >= 40) return "from-yellow-500 to-orange-500"
        return "from-red-500 to-rose-500"
    }

    return (
        <StyledCard variant="pink">
            <StyledCardHeader
                icon={PieChart}
                title="Portfolio Diversification Analysis"
                description="Analyze how well your portfolio assets are diversified"
                variant="pink"
            />
            <StyledCardContent>
                {/* Asset Selection Section */}
                <div className="p-4 bg-slate-50 rounded-xl border mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-slate-600">Selected Assets:</span>
                        {selectedAssets.map((asset) => (
                            <Badge
                                key={asset}
                                className="px-3 py-1 bg-rose-100 text-rose-700 border-rose-200 cursor-pointer hover:bg-rose-200 transition-colors"
                                onClick={() => handleRemoveAsset(asset)}
                            >
                                {AVAILABLE_ASSETS.find(a => a.value === asset)?.label || asset} ×
                            </Badge>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={newAsset} onValueChange={handleAddAsset}>
                            <SelectTrigger className="w-40 bg-white border-rose-200">
                                <SelectValue placeholder="+ Add Asset" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ASSETS.filter((a) => !selectedAssets.includes(a.value)).map((a) => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={periodDays} onValueChange={setPeriodDays}>
                            <SelectTrigger className="w-28 bg-white">
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
                        <Button
                            onClick={handleCalculate}
                            disabled={loading || selectedAssets.length < 2}
                            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Analyze <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results */}
                {result ? (
                    <div className="space-y-5">
                        {/* Score Display - Centered with Ring */}
                        <div className="flex justify-center py-4">
                            <div className="relative">
                                {/* Outer ring with gradient */}
                                <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${getScoreGradient(result.diversification_score)} p-1`}>
                                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-bold ${getScoreColor(result.diversification_score)}`}>
                                            {formatNumber(result.diversification_score, 0)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">out of 100</span>
                                    </div>
                                </div>
                                <Badge className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 text-sm font-semibold ${getRatingColor(result.rating)}`}>
                                    {result.rating.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-3 gap-4 mt-8">
                            <div className="p-4 rounded-xl border-2 bg-white text-center hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {result.avg_correlation > 0.5 ? (
                                        <TrendingUp className="h-4 w-4 text-red-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-green-500" />
                                    )}
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Avg Correlation</span>
                                </div>
                                <p className={`text-2xl font-bold ${result.avg_correlation > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatNumber(result.avg_correlation, 3)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {result.avg_correlation > 0.5 ? "High - Less diverse" : "Low - Well diverse"}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-white text-center hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Max Correlation</span>
                                </div>
                                <p className={`text-2xl font-bold ${result.max_correlation > 0.7 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatNumber(result.max_correlation, 3)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Highest pair correlation</p>
                            </div>
                            <div className="p-4 rounded-xl border-2 bg-white text-center hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <TrendingDown className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Min Correlation</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatNumber(result.min_correlation, 3)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Lowest pair correlation</p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Recommendations
                            </h4>
                            {result.recommendations.slice(0, 3).map((rec, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border-2 flex items-start gap-3 ${rec.includes("✅") ? "bg-green-50 border-green-200" :
                                        rec.includes("⚠️") ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                                        }`}
                                >
                                    {rec.includes("✅") ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    ) : rec.includes("⚠️") ? (
                                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-sm">{rec.replace(/[✅⚠️💡]/g, "").trim()}</span>
                                </div>
                            ))}
                        </div>

                        {/* Portfolio Summary */}
                        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <PieChart className="h-5 w-5 text-rose-600" />
                                </div>
                                <div className="text-sm text-rose-800">
                                    <p className="font-semibold">Portfolio Summary</p>
                                    <p><strong>Assets:</strong> {result.portfolio_assets.join(", ")} | <strong>Score:</strong> {formatNumber(result.diversification_score, 0)}/100 | <strong>Risk Level:</strong> {result.avg_correlation > 0.6 ? "High" : result.avg_correlation > 0.3 ? "Moderate" : "Low"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-48 items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="p-4 bg-rose-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Shield className="h-8 w-8 text-rose-600" />
                            </div>
                            <p className="text-lg font-medium">Analyze Diversification</p>
                            <p className="text-sm mt-1">Add assets and click Analyze to check portfolio health</p>
                        </div>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
