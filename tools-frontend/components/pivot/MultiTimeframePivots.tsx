"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layers, TrendingUp, TrendingDown, Target, RefreshCw, Zap, AlertCircle, Calendar, Clock, CalendarDays, Info, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { pivotApi } from "@/lib/api/pivot"
import type { MultiTimeframePivotResponse, TimeframePivotData } from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"

type TimeframeKey = "daily" | "weekly" | "monthly"

const TIMEFRAME_CONFIG: Record<TimeframeKey, { label: string; icon: typeof Calendar; gradient: string; accent: string; bg: string }> = {
    daily: { label: "Daily", icon: Clock, gradient: "from-blue-500 to-cyan-500", accent: "text-blue-600", bg: "bg-blue-50" },
    weekly: { label: "Weekly", icon: Calendar, gradient: "from-violet-500 to-purple-500", accent: "text-violet-600", bg: "bg-violet-50" },
    monthly: { label: "Monthly", icon: CalendarDays, gradient: "from-amber-500 to-orange-500", accent: "text-amber-600", bg: "bg-amber-50" },
}

// Modern Timeframe Card with visual hierarchy
function TimeframeCard({
    timeframe,
    data,
    currentPrice
}: {
    timeframe: TimeframeKey
    data: TimeframePivotData
    currentPrice: number
}) {
    const config = TIMEFRAME_CONFIG[timeframe]
    const Icon = config.icon

    return (
        <div className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Header with gradient */}
            <div className={`bg-linear-to-r ${config.gradient} p-4 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-bold text-lg">{config.label}</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{data.ohlc_date}</span>
                </div>
                {/* CPR Classification */}
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-white/80 text-xs">CPR:</span>
                    <Badge className={`text-xs ${data.cpr.classification === "narrow" ? "bg-yellow-400 text-yellow-900" : "bg-white/30 text-white"}`}>
                        {data.cpr.classification.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Pivot Levels - Visual Layout */}
            <div className="p-3 space-y-1">
                {/* Resistance Zone */}
                <div className="space-y-1">
                    {[
                        { label: "R3", value: data.floor_pivots.r3 },
                        { label: "R2", value: data.floor_pivots.r2 },
                        { label: "R1", value: data.floor_pivots.r1 },
                    ].map((level) => {
                        const dist = ((level.value - currentPrice) / currentPrice * 100)
                        return (
                            <div key={level.label} className="flex items-center justify-between py-1 px-2 rounded hover:bg-red-50/50 transition-colors">
                                <span className="text-red-600 font-medium text-sm w-8">{level.label}</span>
                                <div className="flex-1 mx-2 h-1 bg-linear-to-r from-red-200 to-red-100 rounded-full" />
                                <span className="font-mono text-sm font-semibold">${formatNumber(level.value)}</span>
                                <span className="text-red-500 text-xs ml-2 w-14 text-right">+{dist.toFixed(2)}%</span>
                            </div>
                        )
                    })}
                </div>

                {/* CPR Zone - Highlighted */}
                <div className="my-2 p-2 rounded-lg bg-linear-to-r from-slate-50 to-slate-100 border border-slate-200">
                    {[
                        { label: "TC", value: data.cpr.tc },
                        { label: "Pivot", value: data.cpr.pivot },
                        { label: "BC", value: data.cpr.bc },
                    ].map((level) => {
                        const dist = ((level.value - currentPrice) / currentPrice * 100)
                        return (
                            <div key={level.label} className="flex items-center justify-between py-1 px-1">
                                <span className={`${config.accent} font-semibold text-sm w-10`}>{level.label}</span>
                                <span className="font-mono text-sm font-bold">${formatNumber(level.value)}</span>
                                <span className={`text-xs ml-2 w-14 text-right ${dist > 0 ? "text-red-500" : "text-green-500"}`}>
                                    {dist > 0 ? "+" : ""}{dist.toFixed(2)}%
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Support Zone */}
                <div className="space-y-1">
                    {[
                        { label: "S1", value: data.floor_pivots.s1 },
                        { label: "S2", value: data.floor_pivots.s2 },
                        { label: "S3", value: data.floor_pivots.s3 },
                    ].map((level) => {
                        const dist = ((level.value - currentPrice) / currentPrice * 100)
                        return (
                            <div key={level.label} className="flex items-center justify-between py-1 px-2 rounded hover:bg-green-50/50 transition-colors">
                                <span className="text-green-600 font-medium text-sm w-8">{level.label}</span>
                                <div className="flex-1 mx-2 h-1 bg-linear-to-r from-green-100 to-green-200 rounded-full" />
                                <span className="font-mono text-sm font-semibold">${formatNumber(level.value)}</span>
                                <span className="text-green-500 text-xs ml-2 w-14 text-right">{dist.toFixed(2)}%</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export function MultiTimeframePivots() {
    const t = useTranslations('pivot.multiTimeframe')
    const tSymbols = useTranslations('pivot.symbols')
    const [loading, setLoading] = useState(false)
    const [symbol, setSymbol] = useState("GOLD")
    const [data, setData] = useState<MultiTimeframePivotResponse | null>(null)

    const handleFetch = async (selectedSymbol?: string) => {
        const symbolToFetch = selectedSymbol || symbol
        setLoading(true)
        try {
            const response = await pivotApi.getMultiTimeframePivots(symbolToFetch, "COMEX")
            setData(response)
            toast.success(`Fetched multi-timeframe pivots for ${symbolToFetch}`)
        } catch (error) {
            console.error("Error fetching multi-timeframe pivots:", error)
            toast.error("Failed to fetch pivot data")
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch on component mount
    useEffect(() => {
        handleFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="space-y-6">
            {/* Modern Header with Controls */}
            <StyledCard variant="purple">
                <StyledCardHeader
                    icon={Layers}
                    title={t('title')}
                    description={t('description')}
                    variant="purple"
                    action={
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {t('learnHow')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="p-2 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg text-white">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        {t('guideTitle')}
                                    </DialogTitle>
                                    <DialogDescription>{t('guideDescription')}</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 mt-4">
                                    {/* Visual Guide Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-100">
                                            <Clock className="h-6 w-6 text-blue-600 mb-2" />
                                            <h4 className="font-bold text-blue-800">{t('daily')}</h4>
                                            <p className="text-xs text-blue-600 mt-1">{t('dailyDesc')}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-violet-50 to-purple-50 border border-violet-100">
                                            <Calendar className="h-6 w-6 text-violet-600 mb-2" />
                                            <h4 className="font-bold text-violet-800">{t('weekly')}</h4>
                                            <p className="text-xs text-violet-600 mt-1">{t('weeklyDesc')}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-100">
                                            <CalendarDays className="h-6 w-6 text-amber-600 mb-2" />
                                            <h4 className="font-bold text-amber-800">{t('monthly')}</h4>
                                            <p className="text-xs text-amber-600 mt-1">{t('monthlyDesc')}</p>
                                        </div>
                                    </div>

                                    {/* Level Abbreviations */}
                                    <div className="p-4 rounded-xl bg-slate-50 border">
                                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-slate-600" />
                                            {t('levelAbbreviations')}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">D_S1</Badge>
                                                <span className="text-slate-600">{t('dailySupport1')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">D_R2</Badge>
                                                <span className="text-slate-600">{t('dailyResistance2')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-violet-100 text-violet-700 border-violet-200">W_CPR_TC</Badge>
                                                <span className="text-slate-600">{t('weeklyCprTc')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">M_Fib_618</Badge>
                                                <span className="text-slate-600">{t('monthlyFib618')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confluence Explanation */}
                                    <div className="p-4 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200">
                                        <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            {t('whatIsConfluence')}
                                        </h4>
                                        <p className="text-sm text-amber-700 mb-3">
                                            {t('confluenceExplanation')}
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge className="bg-amber-200 text-amber-800">2x = {t('moderate')}</Badge>
                                            <Badge className="bg-orange-200 text-orange-800">3x = {t('strong')}</Badge>
                                            <Badge className="bg-red-200 text-red-800">4x+ = {t('veryStrong')}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
                <StyledCardContent>
                    {/* Controls Row */}
                    <div className="flex items-center gap-4">
                        <Select value={symbol} onValueChange={setSymbol}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">{tSymbols('gold')}</SelectItem>
                                <SelectItem value="SILVER">{tSymbols('silver')}</SelectItem>
                                <SelectItem value="CRUDE">{tSymbols('crudeOil')}</SelectItem>
                                <SelectItem value="COPPER">{tSymbols('copper')}</SelectItem>
                                <SelectItem value="NATURALGAS">{tSymbols('naturalGas')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => handleFetch()} disabled={loading} className="gap-2">
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {t('fetchAllTimeframes')}
                        </Button>

                        {data && (
                            <div className="ml-auto flex items-center gap-4">
                                <div className="px-4 py-2 rounded-lg bg-slate-100">
                                    <span className="text-xs text-slate-500">{t('currentPrice')}</span>
                                    <div className="font-mono font-bold text-lg text-slate-800">${formatNumber(data.current_price)}</div>
                                </div>
                                <Badge
                                    className={`px-3 py-1.5 text-sm ${data.market_bias === "bullish" ? "bg-green-100 text-green-700 border-green-200" :
                                        data.market_bias === "bearish" ? "bg-red-100 text-red-700 border-red-200" :
                                            "bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                >
                                    {data.market_bias === "bullish" && <TrendingUp className="h-4 w-4 mr-1" />}
                                    {data.market_bias === "bearish" && <TrendingDown className="h-4 w-4 mr-1" />}
                                    {data.market_bias.toUpperCase()} {t('bias')}
                                </Badge>
                            </div>
                        )}
                    </div>
                </StyledCardContent>
            </StyledCard>

            {
                data ? (
                    <>
                        {/* Confluence Zones Alert */}
                        {
                            data.confluence_zones.length > 0 && (
                                <Card className="border-2 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                                            <Zap className="h-5 w-5" />
                                            {t('confluenceZonesDetected')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('highProbabilityLevels')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {data.confluence_zones.map((zone, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-white rounded-lg border border-amber-200 hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-mono font-bold text-lg">${formatNumber(zone.value)}</span>
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                                            {zone.strength}x {t('confluence')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {zone.levels.map((level, lidx) => (
                                                            <Badge
                                                                key={lidx}
                                                                variant="secondary"
                                                                className={`text-xs ${level.timeframe === "daily" ? "bg-blue-100 text-blue-700" :
                                                                    level.timeframe === "weekly" ? "bg-purple-100 text-purple-700" :
                                                                        "bg-amber-100 text-amber-700"
                                                                    }`}
                                                            >
                                                                {level.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {data.nearest_confluence && (
                                            <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
                                                <div className="flex items-center gap-2 text-amber-800">
                                                    <Target className="h-4 w-4" />
                                                    <span className="font-medium">{t('nearestConfluence')}:</span>
                                                    <span className="font-mono font-bold">${formatNumber(data.nearest_confluence.value)}</span>
                                                    <span className="text-sm">
                                                        ({data.nearest_confluence.distance_percent.toFixed(2)}% {t('away')})
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        }

                        {/* Timeframe Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <TimeframeCard
                                timeframe="daily"
                                data={data.timeframes.daily}
                                currentPrice={data.current_price}
                            />
                            <TimeframeCard
                                timeframe="weekly"
                                data={data.timeframes.weekly}
                                currentPrice={data.current_price}
                            />
                            <TimeframeCard
                                timeframe="monthly"
                                data={data.timeframes.monthly}
                                currentPrice={data.current_price}
                            />
                        </div>
                    </>
                ) : (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                {t('selectSymbolPrompt')}
                            </p>
                        </CardContent>
                    </Card>
                )
            }
        </div>
    )
}

export default MultiTimeframePivots
