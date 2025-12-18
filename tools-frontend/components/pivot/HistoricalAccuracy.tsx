"use client"

import { useState } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, RefreshCw, Trophy, TrendingUp, Info, BookOpen, Target, CheckCircle2, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { pivotApi } from "@/lib/api/pivot"
import type { PivotAccuracyResponse } from "@/types"
import { toast } from "sonner"

export function HistoricalAccuracy() {
    const [loading, setLoading] = useState(false)
    const [symbol, setSymbol] = useState("GOLD")
    const [timeframe, setTimeframe] = useState("daily")
    const [days, setDays] = useState("30")
    const [exchange, setExchange] = useState("COMEX")
    const [data, setData] = useState<PivotAccuracyResponse | null>(null)

    const handleFetch = async () => {
        setLoading(true)
        try {
            const response = await pivotApi.getHistorical(symbol, timeframe, parseInt(days), exchange)
            setData(response)
            toast.success(`Fetched real accuracy data for ${symbol} from ${exchange}`)
        } catch (error) {
            console.error("Error fetching historical accuracy:", error)
            toast.error("Failed to fetch accuracy data. Check if API credentials are configured.")
        } finally {
            setLoading(false)
        }
    }

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return "text-green-600 bg-green-50"
        if (accuracy >= 70) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
    }

    const getAccuracyBadge = (accuracy: number) => {
        if (accuracy >= 80) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>
        if (accuracy >= 70) return <Badge className="bg-yellow-100 text-yellow-700">Good</Badge>
        return <Badge className="bg-red-100 text-red-700">Fair</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <StyledCard variant="orange">
                <StyledCardHeader
                    icon={BarChart3}
                    title="Historical Accuracy"
                    description="Track how often pivot levels are respected over time"
                    variant="orange"
                    action={
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Understanding Accuracy
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="p-2 bg-linear-to-br from-orange-500 to-amber-600 rounded-lg text-white">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                        Historical Accuracy Guide
                                    </DialogTitle>
                                    <DialogDescription>Learn how to interpret pivot level performance</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 mt-4">
                                    {/* What is Respected */}
                                    <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 border">
                                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-slate-600" />
                                            What Does &quot;Respected&quot; Mean?
                                        </h4>
                                        <p className="text-sm text-slate-600 mb-3">
                                            A level is <strong>respected</strong> when price approaches it and reverses direction within a tolerance (0.3%). This indicates the level acted as support or resistance.
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span className="text-green-700">Respected = Price reversed</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-red-700">Not respected = Price broke through</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accuracy Ratings */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 border border-green-100 text-center">
                                            <div className="text-3xl font-bold text-green-600 mb-1">80%+</div>
                                            <Badge className="bg-green-100 text-green-700">Excellent</Badge>
                                            <p className="text-xs text-green-600 mt-2">High reliability level</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-yellow-50 to-amber-50 border border-yellow-100 text-center">
                                            <div className="text-3xl font-bold text-yellow-600 mb-1">70-79%</div>
                                            <Badge className="bg-yellow-100 text-yellow-700">Good</Badge>
                                            <p className="text-xs text-yellow-600 mt-2">Moderate reliability</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-red-50 to-orange-50 border border-red-100 text-center">
                                            <div className="text-3xl font-bold text-red-600 mb-1">&lt;70%</div>
                                            <Badge className="bg-red-100 text-red-700">Fair</Badge>
                                            <p className="text-xs text-red-600 mt-2">Use with caution</p>
                                        </div>
                                    </div>

                                    {/* CPR Types */}
                                    <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            CPR Width Categories
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-blue-700">Narrow (&lt;0.3%)</div>
                                                <p className="text-xs text-slate-600">Expect trending day</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-purple-700">Normal (0.3-0.7%)</div>
                                                <p className="text-xs text-slate-600">Balanced day</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-orange-700">Wide (&gt;0.7%)</div>
                                                <p className="text-xs text-slate-600">Range-bound day</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
                <StyledCardContent>
                    {/* Controls Row */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Exchange</label>
                            <Select value={exchange} onValueChange={setExchange}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COMEX">COMEX</SelectItem>
                                    <SelectItem value="MCX">MCX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Symbol</label>
                            <Select value={symbol} onValueChange={setSymbol}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GOLD">Gold</SelectItem>
                                    <SelectItem value="SILVER">Silver</SelectItem>
                                    <SelectItem value="CRUDE">Crude</SelectItem>
                                    <SelectItem value="COPPER">Copper</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Timeframe</label>
                            <Select value={timeframe} onValueChange={setTimeframe}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Period</label>
                            <Select value={days} onValueChange={setDays}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="60">60 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleFetch} disabled={loading} className="gap-2">
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Analyze
                        </Button>
                    </div>

                    {data ? (
                        <div className="space-y-4 mt-4">
                            {/* Best Performing Levels */}
                            < div className="p-3 rounded-lg bg-amber-50 border border-amber-200" >
                                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                                    <Trophy className="h-4 w-4" />
                                    Best Performing Levels
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {data.best_performing_levels.map((level, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                            {idx + 1}. {level}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Level Accuracy Table */}
                            < div className="rounded-lg border overflow-hidden" >
                                <div className="bg-muted px-4 py-2 text-sm font-medium grid grid-cols-5 gap-2">
                                    <span>Level</span>
                                    <span className="text-center">Tested</span>
                                    <span className="text-center">Respected</span>
                                    <span className="text-center">Accuracy</span>
                                    <span className="text-center">Rating</span>
                                </div>
                                <div className="divide-y max-h-64 overflow-y-auto">
                                    {Object.entries(data.level_accuracy).map(([level, stats]) => (
                                        <div key={level} className="px-4 py-2 text-sm grid grid-cols-5 gap-2 items-center hover:bg-muted/50">
                                            <span className="font-medium">{level}</span>
                                            <span className="text-center text-muted-foreground">{stats.times_tested}</span>
                                            <span className="text-center text-muted-foreground">{stats.times_respected}</span>
                                            <span className={`text-center font-mono font-semibold rounded px-2 py-0.5 ${getAccuracyColor(stats.accuracy_percent)}`}>
                                                {stats.accuracy_percent.toFixed(1)}%
                                            </span>
                                            <span className="text-center">{getAccuracyBadge(stats.accuracy_percent)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div >

                            {/* CPR Statistics */}
                            < div className="grid grid-cols-3 gap-3" >
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{data.cpr_statistics.narrow_cpr_days}</div>
                                    <div className="text-xs text-blue-600">Narrow CPR Days</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.cpr_statistics.narrow_cpr_trending_accuracy}% trending accuracy
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{data.cpr_statistics.normal_cpr_days}</div>
                                    <div className="text-xs text-purple-600">Normal CPR Days</div>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{data.cpr_statistics.wide_cpr_days}</div>
                                    <div className="text-xs text-orange-600">Wide CPR Days</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.cpr_statistics.wide_cpr_range_accuracy}% range accuracy
                                    </div>
                                </div>
                            </div >

                            {/* Note */}
                            < div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground" >
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{data.notes}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Select parameters and click &quot;Analyze&quot; to view historical accuracy</p>
                        </div>
                    )}
                </StyledCardContent>
            </StyledCard>
        </div>
    )
}

export default HistoricalAccuracy
