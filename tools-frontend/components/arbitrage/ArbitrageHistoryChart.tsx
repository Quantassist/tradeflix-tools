"use client"

import { useState, useEffect } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts"
import { History, RefreshCw, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { arbitrageApi } from "@/lib/api/arbitrage"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

type HistoryDataPoint = {
    recorded_at: string
    comex_price_usd: number
    mcx_price_inr: number
    usdinr_rate: number
    fair_value_inr: number
    premium: number
    premium_percent: number
    signal: string
    z_score: number | null
    percentile: number | null
}

type HistoryStatistics = {
    average_premium_percent: number
    std_deviation: number
    min_premium_percent: number
    max_premium_percent: number
    signal_distribution: Record<string, number>
}

type HistoryResponse = {
    symbol: string
    days: number
    data_count: number
    total_points?: number
    downsampled?: boolean
    data: HistoryDataPoint[]
    statistics: HistoryStatistics | null
    message?: string
}

type TooltipPayloadItem = {
    value: number
    dataKey: string
    payload?: {
        recorded_at?: string
        fullDate?: string
    }
}

function CustomTooltip({ active, payload, t }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; t: (key: string) => string }) {
    if (active && payload && payload.length) {
        const premiumPercent = payload.find(p => p.dataKey === "premium_percent")?.value || 0
        const fullDate = payload[0]?.payload?.fullDate || ""
        return (
            <div className="bg-white p-3 border-2 rounded-xl shadow-xl">
                <p className="text-xs text-muted-foreground mb-1 font-medium">{fullDate}</p>
                <p className={cn(
                    "text-lg font-bold font-mono",
                    premiumPercent > 0 ? "text-red-600" : "text-green-600"
                )}>
                    {premiumPercent > 0 ? "+" : ""}{premiumPercent.toFixed(3)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {premiumPercent > 0.7 ? t('premiumZone') : premiumPercent < -0.3 ? t('discountZone') : t('fairValueZone')}
                </p>
            </div>
        )
    }
    return null
}

export function ArbitrageHistoryChart() {
    const t = useTranslations('arbitrage.history')
    const [loading, setLoading] = useState(false)
    const [recording, setRecording] = useState(false)
    const [data, setData] = useState<HistoryResponse | null>(null)
    const [symbol, setSymbol] = useState("GOLD")
    const [days, setDays] = useState("30")

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const response = await arbitrageApi.getHistory(symbol, parseInt(days))
            setData(response)
            if (response.data_count === 0) {
                toast.info("No historical data yet. Click 'Record Now' to start collecting data.")
            }
        } catch {
            toast.error("Failed to fetch historical data")
        } finally {
            setLoading(false)
        }
    }

    const recordNow = async () => {
        setRecording(true)
        try {
            await arbitrageApi.recordHistory(symbol)
            toast.success("Arbitrage data recorded successfully")
            fetchHistory()
        } catch {
            toast.error("Failed to record arbitrage data")
        } finally {
            setRecording(false)
        }
    }

    useEffect(() => {
        fetchHistory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, days])

    // Format date based on timeframe - show year for longer periods
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        const daysNum = parseInt(days)
        if (daysNum === 0 || daysNum > 365) {
            // For multi-year views, show month and year
            return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        } else if (daysNum > 90) {
            // For 6 months to 1 year, show month and day
            return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        }
        // For shorter periods, show day and month
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    }

    // Format full date for tooltip (always includes year)
    const formatFullDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    }

    const chartData = data?.data?.map(d => ({
        ...d,
        date: formatDate(d.recorded_at),
        fullDate: formatFullDate(d.recorded_at),
        time: new Date(d.recorded_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    })).reverse() || []

    return (
        <StyledCard variant="purple">
            <StyledCardHeader
                icon={History}
                title={t('title')}
                description={t('description')}
                variant="purple"
                action={
                    <div className="flex items-center gap-3 flex-wrap">
                        <Select value={symbol} onValueChange={setSymbol}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">{t('gold')}</SelectItem>
                                <SelectItem value="SILVER">{t('silver')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={days} onValueChange={setDays}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">{t('days7')}</SelectItem>
                                <SelectItem value="30">{t('days30')}</SelectItem>
                                <SelectItem value="90">{t('days90')}</SelectItem>
                                <SelectItem value="180">{t('months6')}</SelectItem>
                                <SelectItem value="365">{t('year1')}</SelectItem>
                                <SelectItem value="730">{t('years2')}</SelectItem>
                                <SelectItem value="1825">{t('years5')}</SelectItem>
                                <SelectItem value="0">{t('max')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchHistory}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            {t('refresh')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={recordNow}
                            disabled={recording}
                            className="gap-2 bg-violet-600 hover:bg-violet-700"
                        >
                            {recording ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <BarChart3 className="h-4 w-4" />
                            )}
                            {t('recordNow')}
                        </Button>
                    </div>
                }
            />
            <StyledCardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-[300px] w-full" />
                        <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                ) : data?.data_count === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">{t('noHistoricalData')}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            {data.message || t('noDataMessage')}
                        </p>
                        <Button onClick={recordNow} disabled={recording} className="mt-4 gap-2">
                            <BarChart3 className="h-4 w-4" />
                            {t('recordFirstDataPoint')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Chart */}
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        axisLine={{ stroke: '#9ca3af' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        axisLine={{ stroke: '#9ca3af' }}
                                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'Premium %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280' } }}
                                    />
                                    <Tooltip content={<CustomTooltip t={t} />} />

                                    {/* Reference lines for zones */}
                                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="5 5" />
                                    <ReferenceLine y={0.7} stroke="#f97316" strokeDasharray="3 3" label={{ value: "Premium", fill: "#f97316", fontSize: 10 }} />
                                    <ReferenceLine y={-0.3} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Discount", fill: "#22c55e", fontSize: 10 }} />

                                    <Area
                                        type="monotone"
                                        dataKey="premium_percent"
                                        fill="url(#premiumGradient)"
                                        stroke="none"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="premium_percent"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={chartData.length > 100 ? false : { fill: "#8b5cf6", strokeWidth: 0, r: 2 }}
                                        activeDot={{ r: 5, fill: "#8b5cf6" }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Statistics & Signal Distribution */}
                        {data?.statistics && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Stats Cards */}
                                <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-4 rounded-xl bg-linear-to-br from-violet-50 to-purple-50 border border-violet-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                            <p className="text-xs text-violet-600 font-medium uppercase tracking-wide">{t('avgPremium')}</p>
                                        </div>
                                        <p className={cn(
                                            "text-2xl font-bold font-mono",
                                            data.statistics.average_premium_percent > 0 ? "text-red-600" : "text-green-600"
                                        )}>
                                            {data.statistics.average_premium_percent > 0 ? "+" : ""}
                                            {data.statistics.average_premium_percent.toFixed(3)}%
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-gray-100 border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                            <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">{t('stdDeviation')}</p>
                                        </div>
                                        <p className="text-2xl font-bold font-mono text-slate-700">
                                            ±{data.statistics.std_deviation.toFixed(3)}%
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingDown className="w-3 h-3 text-green-600" />
                                            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">{t('minBestBuy')}</p>
                                        </div>
                                        <p className="text-2xl font-bold font-mono text-green-600">
                                            {data.statistics.min_premium_percent.toFixed(3)}%
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-linear-to-br from-red-50 to-rose-50 border border-red-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-3 h-3 text-red-600" />
                                            <p className="text-xs text-red-600 font-medium uppercase tracking-wide">{t('maxBestSell')}</p>
                                        </div>
                                        <p className="text-2xl font-bold font-mono text-red-600">
                                            +{data.statistics.max_premium_percent.toFixed(3)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Signal Distribution */}
                                {data?.statistics?.signal_distribution && (
                                    <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <BarChart3 className="w-3 h-3 text-amber-600" />
                                            <h4 className="text-xs text-amber-600 font-medium uppercase tracking-wide">{t('signalDistribution')}</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(data.statistics.signal_distribution)
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .map(([signal, count]) => {
                                                    const total = Object.values(data.statistics!.signal_distribution).reduce((a, b) => a + b, 0)
                                                    const percentage = ((count as number) / total * 100).toFixed(0)
                                                    return (
                                                        <div key={signal} className="flex items-center justify-between text-xs">
                                                            <span className={cn(
                                                                "font-medium capitalize",
                                                                signal.includes("long") ? "text-green-700" :
                                                                    signal.includes("short") ? "text-red-700" : "text-amber-700"
                                                            )}>
                                                                {signal.replace("_", " ")}
                                                            </span>
                                                            <span className="font-mono text-gray-600">{count} ({percentage}%)</span>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Count */}
                        <div className="text-xs text-muted-foreground text-center">
                            Showing {data?.data_count || 0} data points
                            {data?.downsampled && data?.total_points && (
                                <span className="text-amber-600"> (downsampled from {data.total_points} for performance)</span>
                            )}
                            {days === "0" ? " (all available data)" : ` over ${days} days`}
                        </div>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
