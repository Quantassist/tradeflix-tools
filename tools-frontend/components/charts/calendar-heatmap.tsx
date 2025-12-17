"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Loader2, TrendingUp, TrendingDown, Info } from "lucide-react"
import { metalsPricesApi, CalendarHeatmapDay, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface CalendarHeatmapProps {
    metal?: MetalType
    currency?: CurrencyType
    yearsBack?: number
    onSettingsChange?: (settings: { metal: MetalType; currency: CurrencyType; yearsBack: number }) => void
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// Color scale for returns
const getReturnColor = (avgReturn: number): string => {
    // Use return magnitude for color intensity
    const intensity = Math.min(Math.abs(avgReturn) * 20, 100)

    if (avgReturn > 0) {
        // Green shades for positive returns
        if (intensity > 60) return "bg-emerald-600 text-white"
        if (intensity > 40) return "bg-emerald-500 text-white"
        if (intensity > 20) return "bg-emerald-400 text-white"
        if (intensity > 10) return "bg-emerald-300 text-emerald-900"
        return "bg-emerald-200 text-emerald-800"
    } else if (avgReturn < 0) {
        // Red shades for negative returns
        if (intensity > 60) return "bg-red-600 text-white"
        if (intensity > 40) return "bg-red-500 text-white"
        if (intensity > 20) return "bg-red-400 text-white"
        if (intensity > 10) return "bg-red-300 text-red-900"
        return "bg-red-200 text-red-800"
    }
    return "bg-gray-100 text-gray-600"
}

export function CalendarHeatmap({
    metal: initialMetal = "GOLD",
    currency: initialCurrency = "INR",
    yearsBack: initialYearsBack = 10,
    onSettingsChange,
}: CalendarHeatmapProps) {
    const [loading, setLoading] = useState(false)
    const [heatmapData, setHeatmapData] = useState<CalendarHeatmapDay[]>([])
    const [metal, setMetal] = useState<MetalType>(initialMetal)
    const [currency, setCurrency] = useState<CurrencyType>(initialCurrency)
    const [yearsBack, setYearsBack] = useState(initialYearsBack)
    const [selectedDay, setSelectedDay] = useState<CalendarHeatmapDay | null>(null)

    // Create a lookup map for quick access
    const dataMap = useMemo(() => {
        const map = new Map<string, CalendarHeatmapDay>()
        heatmapData.forEach(day => {
            map.set(`${day.month}-${day.day}`, day)
        })
        return map
    }, [heatmapData])

    // Calculate statistics
    const stats = useMemo(() => {
        if (heatmapData.length === 0) return null

        const returns = heatmapData.map(d => d.avg_return)
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
        const bestDay = heatmapData.reduce((best, day) =>
            day.avg_return > best.avg_return ? day : best, heatmapData[0])
        const worstDay = heatmapData.reduce((worst, day) =>
            day.avg_return < worst.avg_return ? day : worst, heatmapData[0])
        const positiveDays = heatmapData.filter(d => d.avg_return > 0).length

        return {
            avgReturn,
            bestDay,
            worstDay,
            positiveDays,
            totalDays: heatmapData.length,
            positiveRate: (positiveDays / heatmapData.length) * 100
        }
    }, [heatmapData])

    const loadHeatmapData = async () => {
        setLoading(true)
        try {
            const response = await metalsPricesApi.getCalendarHeatmap(metal, currency, yearsBack)
            setHeatmapData(response.daily_data || [])
        } catch (error) {
            console.error("Error loading heatmap data:", error)
            toast.error("Failed to load calendar heatmap data")
            setHeatmapData([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHeatmapData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metal, currency, yearsBack])

    useEffect(() => {
        onSettingsChange?.({ metal, currency, yearsBack })
    }, [metal, currency, yearsBack, onSettingsChange])

    const getDayData = (month: number, day: number): CalendarHeatmapDay | undefined => {
        return dataMap.get(`${month}-${day}`)
    }

    const formatDate = (month: number, day: number): string => {
        return `${MONTHS[month - 1]} ${day}`
    }

    return (
        <Card className="border-2 border-amber-200/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-amber-100 rounded-xl">
                            <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Interactive Calendar Heatmap</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                    {heatmapData.length} days analyzed
                                </Badge>
                                <span className="text-xs text-gray-500">Daily return patterns</span>
                            </CardDescription>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value={metal} onValueChange={(v) => setMetal(v as MetalType)}>
                            <SelectTrigger className="w-28 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">Gold</SelectItem>
                                <SelectItem value="SILVER">Silver</SelectItem>
                                <SelectItem value="PLATINUM">Platinum</SelectItem>
                                <SelectItem value="PALLADIUM">Palladium</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyType)}>
                            <SelectTrigger className="w-20 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={yearsBack.toString()} onValueChange={(v) => setYearsBack(parseInt(v))}>
                            <SelectTrigger className="w-24 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 Years</SelectItem>
                                <SelectItem value="10">10 Years</SelectItem>
                                <SelectItem value="15">15 Years</SelectItem>
                                <SelectItem value="20">20 Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : heatmapData.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No heatmap data available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Statistics Summary */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                                >
                                    <p className="text-xs text-amber-600 font-medium mb-1">Avg Daily Return</p>
                                    <p className={`text-xl font-bold ${stats.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(3)}%
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200"
                                >
                                    <p className="text-xs text-emerald-600 font-medium mb-1">Best Day</p>
                                    <p className="text-xl font-bold text-emerald-600">
                                        {formatDate(stats.bestDay.month, stats.bestDay.day)}
                                    </p>
                                    <p className="text-xs text-emerald-500">+{stats.bestDay.avg_return.toFixed(2)}%</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200"
                                >
                                    <p className="text-xs text-red-600 font-medium mb-1">Worst Day</p>
                                    <p className="text-xl font-bold text-red-600">
                                        {formatDate(stats.worstDay.month, stats.worstDay.day)}
                                    </p>
                                    <p className="text-xs text-red-500">{stats.worstDay.avg_return.toFixed(2)}%</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                                >
                                    <p className="text-xs text-blue-600 font-medium mb-1">Positive Days</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {stats.positiveRate.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-blue-500">{stats.positiveDays} of {stats.totalDays}</p>
                                </motion.div>
                            </div>
                        )}

                        {/* Calendar Grid */}
                        <div className="overflow-x-auto">
                            <TooltipProvider delayDuration={100}>
                                <div className="min-w-[800px]">
                                    {/* Month Headers */}
                                    <div className="grid grid-cols-12 gap-1 mb-2">
                                        {MONTHS.map((month) => (
                                            <div key={month} className="text-center text-xs font-medium text-gray-600 py-1">
                                                {month}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day Rows */}
                                    {Array.from({ length: 31 }, (_, dayIdx) => (
                                        <div key={dayIdx} className="grid grid-cols-12 gap-1 mb-1">
                                            {MONTHS.map((_, monthIdx) => {
                                                const day = dayIdx + 1
                                                const month = monthIdx + 1
                                                const isValidDay = day <= DAYS_IN_MONTH[monthIdx]
                                                const dayData = isValidDay ? getDayData(month, day) : undefined

                                                if (!isValidDay) {
                                                    return <div key={`${month}-${day}`} className="h-6" />
                                                }

                                                if (!dayData) {
                                                    return (
                                                        <div
                                                            key={`${month}-${day}`}
                                                            className="h-6 bg-gray-50 rounded text-[10px] flex items-center justify-center text-gray-400"
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                }

                                                const colorClass = getReturnColor(dayData.avg_return)

                                                return (
                                                    <Tooltip key={`${month}-${day}`}>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                className={`h-6 rounded text-[10px] flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 ${colorClass}`}
                                                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                                                onClick={() => setSelectedDay(dayData)}
                                                            >
                                                                {day}
                                                            </motion.div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="p-3 max-w-xs">
                                                            <div className="space-y-2">
                                                                <p className="font-semibold text-sm">{formatDate(month, day)}</p>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                                    <span className="text-gray-500">Avg Return:</span>
                                                                    <span className={`font-medium ${dayData.avg_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                        {dayData.avg_return >= 0 ? '+' : ''}{dayData.avg_return.toFixed(3)}%
                                                                    </span>
                                                                    <span className="text-gray-500">Win Rate:</span>
                                                                    <span className="font-medium">{dayData.win_rate.toFixed(1)}%</span>
                                                                    <span className="text-gray-500">Best:</span>
                                                                    <span className="text-emerald-600">+{dayData.best_return.toFixed(2)}%</span>
                                                                    <span className="text-gray-500">Worst:</span>
                                                                    <span className="text-red-600">{dayData.worst_return.toFixed(2)}%</span>
                                                                    <span className="text-gray-500">Samples:</span>
                                                                    <span>{dayData.occurrences} years</span>
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </TooltipProvider>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded bg-red-600" />
                                    <div className="w-4 h-4 rounded bg-red-400" />
                                    <div className="w-4 h-4 rounded bg-red-200" />
                                </div>
                                <span className="text-xs text-gray-500">Negative</span>
                            </div>
                            <div className="w-4 h-4 rounded bg-gray-100 border" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Positive</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded bg-emerald-200" />
                                    <div className="w-4 h-4 rounded bg-emerald-400" />
                                    <div className="w-4 h-4 rounded bg-emerald-600" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                        </div>

                        {/* Selected Day Details */}
                        {selectedDay && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-lg text-gray-800">
                                            {formatDate(selectedDay.month, selectedDay.day)} - Detailed Analysis
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Based on {selectedDay.occurrences} years of historical data
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Avg Return</p>
                                        <p className={`text-lg font-bold ${selectedDay.avg_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {selectedDay.avg_return >= 0 ? '+' : ''}{selectedDay.avg_return.toFixed(3)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Win Rate</p>
                                        <p className="text-lg font-bold text-blue-600">{selectedDay.win_rate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Best Return</p>
                                        <p className="text-lg font-bold text-emerald-600">+{selectedDay.best_return.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Worst Return</p>
                                        <p className="text-lg font-bold text-red-600">{selectedDay.worst_return.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Data Points</p>
                                        <p className="text-lg font-bold text-gray-700">{selectedDay.occurrences}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Info Note */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                This heatmap shows the average daily return for each calendar day based on {yearsBack} years of historical data.
                                Darker green indicates stronger positive returns, while darker red indicates stronger negative returns.
                                Click on any day to see detailed statistics.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
