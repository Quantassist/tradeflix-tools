"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, BarChart3, Loader2, AlertCircle, Award, Target, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { metalsPricesApi, MonthlySeasonality, SeasonalEventAnalysis, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface SeasonalAnalysisChartsProps {
    metal?: MetalType
    currency?: CurrencyType
    onSettingsChange?: (settings: { metal: MetalType; currency: CurrencyType; yearsBack: number; daysWindow: number }) => void
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3
        }
    }
}

const cardHoverVariants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: { duration: 0.2 }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload

        // Monthly data tooltip
        if (data.month_name) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl"
                >
                    <p className="font-semibold text-base mb-2 text-gray-800">{data.month_name}</p>
                    <div className="space-y-1.5 text-sm">
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Avg Return:</span>
                            <span className={`font-bold ${data.avg_return >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {data.avg_return >= 0 ? "+" : ""}{data.avg_return.toFixed(2)}%
                            </span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Win Rate:</span>
                            <span className="font-semibold text-gray-700">{data.win_rate.toFixed(1)}%</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Best:</span>
                            <span className="text-emerald-600 font-medium">+{data.best_return.toFixed(2)}%</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Worst:</span>
                            <span className="text-red-500 font-medium">{data.worst_return.toFixed(2)}%</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
                            Based on {data.occurrences} years
                        </p>
                    </div>
                </motion.div>
            )
        }

        // Event data tooltip
        if (data.name) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl max-w-xs"
                >
                    <p className="font-semibold text-base mb-2 text-gray-800">{data.name}</p>
                    <div className="space-y-1.5 text-sm">
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Avg Change:</span>
                            <span className={`font-bold ${data.avg_price_change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {data.avg_price_change >= 0 ? "+" : ""}{data.avg_price_change.toFixed(2)}%
                            </span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Win Rate:</span>
                            <span className="font-semibold text-gray-700">{data.win_rate.toFixed(1)}%</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Best:</span>
                            <span className="text-emerald-600 font-medium">+{data.best_return.toFixed(2)}%</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-gray-500">Worst:</span>
                            <span className="text-red-500 font-medium">{data.worst_return.toFixed(2)}%</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
                            Analyzed {data.occurrences} years
                        </p>
                    </div>
                </motion.div>
            )
        }
    }
    return null
}

export function SeasonalAnalysisCharts({ metal = "GOLD", currency = "INR", onSettingsChange }: SeasonalAnalysisChartsProps) {
    const [loading, setLoading] = useState(true)
    const [monthlyData, setMonthlyData] = useState<MonthlySeasonality[]>([])
    const [eventsData, setEventsData] = useState<SeasonalEventAnalysis[]>([])
    const [selectedMetal, setSelectedMetal] = useState<MetalType>(metal)
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(currency)
    const [yearsBack, setYearsBack] = useState(10)
    const [daysWindow, setDaysWindow] = useState(7)
    const [error, setError] = useState<string | null>(null)
    const [selectedEventForChart, setSelectedEventForChart] = useState<string>("")

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange?.({ metal: selectedMetal, currency: selectedCurrency, yearsBack, daysWindow })
    }, [selectedMetal, selectedCurrency, yearsBack, daysWindow, onSettingsChange])

    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [monthlyResponse, eventsResponse] = await Promise.all([
                metalsPricesApi.getMonthlySeasonality(selectedMetal, selectedCurrency, yearsBack),
                metalsPricesApi.getSeasonalEventsAnalysis(selectedMetal, selectedCurrency, yearsBack, daysWindow, daysWindow)
            ])

            setMonthlyData(monthlyResponse.monthly_data || [])
            setEventsData(eventsResponse.events || [])

            if (monthlyResponse.monthly_data?.length > 0 || eventsResponse.events?.length > 0) {
                toast.success("Seasonal analysis loaded successfully")
            }
        } catch (err) {
            console.error("Error loading seasonal analysis:", err)
            setError("Failed to load seasonal analysis data. Please ensure the backend is running and has data.")
            toast.error("Failed to load seasonal analysis")
        } finally {
            setLoading(false)
        }
    }, [selectedMetal, selectedCurrency, yearsBack, daysWindow])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Process monthly data for chart
    const processedMonthlyData = monthlyData.map(m => ({
        ...m,
        fill: m.avg_return >= 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
    }))

    // Process events data for chart
    const processedEventsData = eventsData
        .filter(e => e.occurrences > 0)
        .sort((a, b) => Math.abs(b.avg_price_change) - Math.abs(a.avg_price_change))
        .slice(0, 10)
        .map(e => ({
            ...e,
            fill: e.avg_price_change >= 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
        }))

    // Calculate summary stats
    const bestMonth = monthlyData.reduce((best, m) =>
        m.avg_return > (best?.avg_return || -Infinity) ? m : best, monthlyData[0])
    const worstMonth = monthlyData.reduce((worst, m) =>
        m.avg_return < (worst?.avg_return || Infinity) ? m : worst, monthlyData[0])
    const avgAnnualReturn = monthlyData.reduce((sum, m) => sum + m.avg_return, 0)

    // Generate trading insights
    const generateInsights = () => {
        const insights: { type: 'bullish' | 'bearish' | 'neutral'; text: string; icon: React.ReactNode }[] = []

        if (bestMonth && bestMonth.avg_return > 1) {
            insights.push({
                type: 'bullish',
                text: `${bestMonth.month_name} historically shows strong performance with +${bestMonth.avg_return.toFixed(2)}% average return`,
                icon: <ArrowUpRight className="h-4 w-4" />
            })
        }

        if (worstMonth && worstMonth.avg_return < -1) {
            insights.push({
                type: 'bearish',
                text: `Consider caution in ${worstMonth.month_name} - historical average of ${worstMonth.avg_return.toFixed(2)}%`,
                icon: <ArrowDownRight className="h-4 w-4" />
            })
        }

        const highWinRateMonths = monthlyData.filter(m => m.win_rate >= 70)
        if (highWinRateMonths.length > 0) {
            insights.push({
                type: 'bullish',
                text: `${highWinRateMonths.map(m => m.month_name).join(', ')} show ${highWinRateMonths[0].win_rate.toFixed(0)}%+ win rate`,
                icon: <Sparkles className="h-4 w-4" />
            })
        }

        const topEvent = processedEventsData[0]
        if (topEvent && Math.abs(topEvent.avg_price_change) > 1) {
            insights.push({
                type: topEvent.avg_price_change >= 0 ? 'bullish' : 'bearish',
                text: `${topEvent.name} shows ${topEvent.avg_price_change >= 0 ? '+' : ''}${topEvent.avg_price_change.toFixed(2)}% average impact`,
                icon: topEvent.avg_price_change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
            })
        }

        return insights
    }

    const insights = generateInsights()

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-96 space-y-4"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="h-12 w-12 text-emerald-600" />
                </motion.div>
                <p className="text-gray-500 font-medium">Loading seasonal analysis...</p>
            </motion.div>
        )
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-96 space-y-4"
            >
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-gray-500 font-medium text-center">{error}</p>
            </motion.div>
        )
    }

    const hasData = monthlyData.some(m => m.occurrences > 0) || eventsData.length > 0

    if (!hasData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-96 space-y-4"
            >
                <BarChart3 className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                    <p className="text-gray-500 font-medium">No historical price data available</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Please ensure the metals_prices_spot table has data
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Controls */}
            <motion.div variants={itemVariants}>
                <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Metal:</span>
                                <Select value={selectedMetal} onValueChange={(v) => setSelectedMetal(v as MetalType)}>
                                    <SelectTrigger className="w-[130px] bg-white border-gray-200 hover:border-gray-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GOLD">Gold</SelectItem>
                                        <SelectItem value="SILVER">Silver</SelectItem>
                                        <SelectItem value="PLATINUM">Platinum</SelectItem>
                                        <SelectItem value="PALLADIUM">Palladium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Currency:</span>
                                <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as CurrencyType)}>
                                    <SelectTrigger className="w-[100px] bg-white border-gray-200 hover:border-gray-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INR">INR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Years:</span>
                                <Select value={yearsBack.toString()} onValueChange={(v) => setYearsBack(parseInt(v))}>
                                    <SelectTrigger className="w-[100px] bg-white border-gray-200 hover:border-gray-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 Years</SelectItem>
                                        <SelectItem value="10">10 Years</SelectItem>
                                        <SelectItem value="15">15 Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Window:</span>
                                <Select value={daysWindow.toString()} onValueChange={(v) => setDaysWindow(parseInt(v))}>
                                    <SelectTrigger className="w-[120px] bg-white border-gray-200 hover:border-gray-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">±3 Days</SelectItem>
                                        <SelectItem value="5">±5 Days</SelectItem>
                                        <SelectItem value="7">±7 Days</SelectItem>
                                        <SelectItem value="10">±10 Days</SelectItem>
                                        <SelectItem value="14">±14 Days</SelectItem>
                                        <SelectItem value="30">±30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Trading Insights - Moved to top */}
            {insights.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="border border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-violet-600" />
                                Trading Insights
                            </CardTitle>
                            <CardDescription>
                                Key observations based on {yearsBack} years of historical data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <AnimatePresence>
                                    {insights.map((insight, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`flex items-start gap-3 p-4 rounded-xl border ${insight.type === 'bullish'
                                                ? 'bg-emerald-50/50 border-emerald-200'
                                                : insight.type === 'bearish'
                                                    ? 'bg-red-50/50 border-red-200'
                                                    : 'bg-gray-50/50 border-gray-200'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${insight.type === 'bullish'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : insight.type === 'bearish'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {insight.icon}
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Summary Stats */}
            {bestMonth && worstMonth && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-xl">
                                        <Award className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Best Month</p>
                                        <p className="text-2xl font-bold text-emerald-600">{bestMonth.month_name}</p>
                                        <p className="text-sm font-semibold text-emerald-700">+{bestMonth.avg_return.toFixed(2)}% avg</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-rose-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Worst Month</p>
                                        <p className="text-2xl font-bold text-red-600">{worstMonth.month_name}</p>
                                        <p className="text-sm font-semibold text-red-700">{worstMonth.avg_return.toFixed(2)}% avg</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Target className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Avg Annual Return</p>
                                        <p className={`text-2xl font-bold ${avgAnnualReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {avgAnnualReturn >= 0 ? "+" : ""}{avgAnnualReturn.toFixed(2)}%
                                        </p>
                                        <p className="text-sm text-gray-500">Sum of monthly avgs</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}

            {/* Monthly Seasonality Chart */}
            {processedMonthlyData.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="shadow-sm border border-gray-200 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-amber-600" />
                                        Monthly Seasonality - {selectedMetal}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Average monthly returns based on {yearsBack} years of historical data
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="text-base px-3 py-1 bg-white/80">
                                    {selectedCurrency}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={processedMonthlyData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis
                                        dataKey="month_name"
                                        tick={{ fontSize: 12, fontWeight: 500, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                        tickLine={false}
                                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                    <Bar dataKey="avg_return" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                        {processedMonthlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList
                                            dataKey="win_rate"
                                            position="top"
                                            formatter={(value: number) => `${value.toFixed(0)}%`}
                                            style={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Legend */}
                            <div className="flex justify-center gap-8 mt-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-600">Positive Return</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-600">Negative Return</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Top Events by Impact */}
            {processedEventsData.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="shadow-sm border border-gray-200 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                Major Events Impact Analysis
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Historical price impact around major events (±{daysWindow} days)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={Math.max(350, processedEventsData.length * 45)}>
                                <BarChart
                                    data={processedEventsData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 100, left: 140, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        tickFormatter={(value) => `${value}%`}
                                        axisLine={{ stroke: '#d1d5db' }}
                                        tickLine={false}
                                        domain={['auto', 'auto']}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={130}
                                        tick={{ fontSize: 12, fontWeight: 500, fill: '#374151' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                    <Bar dataKey="avg_price_change" radius={[0, 8, 8, 0]} maxBarSize={35}>
                                        {processedEventsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList
                                            dataKey="avg_price_change"
                                            position="right"
                                            formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                                            style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Events Table */}
                            <div className="mt-6 overflow-x-auto">
                                <p className="text-sm text-gray-500 mb-3">
                                    Analysis window: ±{daysWindow} days around event
                                </p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/50">
                                            <th className="text-left p-3 font-semibold text-gray-700">Event</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Date</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Avg Change</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Win Rate</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Best</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Worst</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Volatility ↑</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Years</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedEventsData.map((event, idx) => (
                                            <motion.tr
                                                key={idx}
                                                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <td className="p-3 font-medium text-gray-800">{event.name}</td>
                                                <td className="p-3 text-center text-gray-500">
                                                    {new Date(2024, event.month - 1, event.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className={`p-3 text-center font-bold ${event.avg_price_change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                    {event.avg_price_change >= 0 ? "+" : ""}{event.avg_price_change.toFixed(2)}%
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge
                                                        variant={event.win_rate >= 60 ? "default" : "secondary"}
                                                        className={event.win_rate >= 60 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                                                    >
                                                        {event.win_rate.toFixed(0)}%
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center text-emerald-600 font-medium">+{event.best_return.toFixed(2)}%</td>
                                                <td className="p-3 text-center text-red-500 font-medium">{event.worst_return.toFixed(2)}%</td>
                                                <td className="p-3 text-center">
                                                    {event.volatility_increase_pct > 0 ? (
                                                        <span className="text-amber-600 font-medium">+{event.volatility_increase_pct.toFixed(0)}%</span>
                                                    ) : (
                                                        <span className="text-emerald-600 font-medium">{event.volatility_increase_pct.toFixed(0)}%</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center text-gray-500">{event.occurrences}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Year-wise Performance Chart */}
            {eventsData.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="shadow-sm border border-gray-200 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                                        Year-wise Performance Analysis
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {selectedMetal}&apos;s Performance ({selectedCurrency}): ±{daysWindow} days Pre and Post Event
                                    </CardDescription>
                                </div>
                                <Select
                                    value={selectedEventForChart || eventsData[0]?.name || ""}
                                    onValueChange={setSelectedEventForChart}
                                >
                                    <SelectTrigger className="w-[200px] bg-white border-gray-200">
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eventsData.map((event) => (
                                            <SelectItem key={event.name} value={event.name}>
                                                {event.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {(() => {
                                const selectedEvent = eventsData.find(e => e.name === (selectedEventForChart || eventsData[0]?.name))
                                if (!selectedEvent?.yearly_data?.length) {
                                    return (
                                        <div className="flex items-center justify-center h-64 text-gray-400">
                                            No yearly data available for this event
                                        </div>
                                    )
                                }

                                // Sort yearly data by year ascending
                                const chartData = [...selectedEvent.yearly_data]
                                    .sort((a, b) => a.year - b.year)
                                    .map(d => ({
                                        year: d.year.toString(),
                                        pre: d.pre_event_change,
                                        post: d.post_event_change,
                                    }))

                                return (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
                                                axisLine={{ stroke: '#d1d5db' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={(value) => `${value}%`}
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={{ stroke: '#d1d5db' }}
                                                tickLine={false}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl"
                                                            >
                                                                <p className="font-bold text-base mb-3 text-gray-800">{label}</p>
                                                                <div className="space-y-2">
                                                                    <p className="flex items-center gap-2 text-sm">
                                                                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#1e3a5f' }}></span>
                                                                        <span className="text-gray-500">Pre-Event:</span>
                                                                        <span className={`font-bold ${(payload[0]?.value as number) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {(payload[0]?.value as number) >= 0 ? '+' : ''}{(payload[0]?.value as number)?.toFixed(2)}%
                                                                        </span>
                                                                    </p>
                                                                    <p className="flex items-center gap-2 text-sm">
                                                                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#94a3b8' }}></span>
                                                                        <span className="text-gray-500">Post-Event:</span>
                                                                        <span className={`font-bold ${(payload[1]?.value as number) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {(payload[1]?.value as number) >= 0 ? '+' : ''}{(payload[1]?.value as number)?.toFixed(2)}%
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Bar
                                                dataKey="pre"
                                                name="Pre-Event"
                                                fill="#1e3a5f"
                                                radius={[4, 4, 0, 0]}
                                            >
                                                <LabelList
                                                    dataKey="pre"
                                                    position="top"
                                                    formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                                                    style={{ fontSize: 10, fontWeight: 600, fill: '#1e3a5f' }}
                                                />
                                            </Bar>
                                            <Bar
                                                dataKey="post"
                                                name="Post-Event"
                                                fill="#94a3b8"
                                                radius={[4, 4, 0, 0]}
                                            >
                                                <LabelList
                                                    dataKey="post"
                                                    position="top"
                                                    formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                                                    style={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )
                            })()}

                            {/* Legend */}
                            <div className="flex justify-center gap-8 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e3a5f' }}></div>
                                    <span className="text-sm text-gray-600">Pre-Event ({daysWindow} days before)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#94a3b8' }}></div>
                                    <span className="text-sm text-gray-600">Post-Event ({daysWindow} days after)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    )
}
