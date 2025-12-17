"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, TrendingDown, Info, Star } from "lucide-react"
import { metalsPricesApi, SeasonalEventAnalysis, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from "recharts"

interface FestivalStatisticsProps {
    metal?: MetalType
    currency?: CurrencyType
    yearsBack?: number
}

// Festival configurations with cultural context
const FESTIVAL_CONFIG: Record<string, { emoji: string; description: string; significance: string }> = {
    "Diwali": {
        emoji: "🪔",
        description: "Festival of Lights - Peak gold buying season in India",
        significance: "Dhanteras (2 days before) sees highest gold demand. Considered auspicious for new purchases."
    },
    "Akshaya Tritiya": {
        emoji: "✨",
        description: "Most auspicious day for gold purchase",
        significance: "Believed that gold bought on this day brings prosperity. Second highest gold buying day after Dhanteras."
    },
    "Dhanteras": {
        emoji: "💰",
        description: "Day of wealth - Start of Diwali festivities",
        significance: "Traditionally the biggest gold buying day in India. Part of 5-day Diwali celebration."
    },
    "Navratri": {
        emoji: "🙏",
        description: "Nine nights of worship",
        significance: "Gold jewelry purchases common during this period for religious ceremonies."
    },
    "Ganesh Chaturthi": {
        emoji: "🐘",
        description: "Birthday of Lord Ganesha",
        significance: "Gold offerings and jewelry purchases for the festival."
    },
    "Onam": {
        emoji: "🌾",
        description: "Kerala's harvest festival",
        significance: "Major gold buying season in South India, especially Kerala."
    },
    "Pongal": {
        emoji: "🍚",
        description: "Tamil harvest festival",
        significance: "Gold purchases common in Tamil Nadu during this period."
    },
    "Raksha Bandhan": {
        emoji: "🎀",
        description: "Festival celebrating sibling bond",
        significance: "Gold rakhi and jewelry gifts drive demand."
    },
    "Karva Chauth": {
        emoji: "🌙",
        description: "Festival for married women",
        significance: "Gold jewelry gifts from husbands are traditional."
    },
}

export function FestivalStatistics({
    metal: initialMetal = "GOLD",
    currency: initialCurrency = "INR",
    yearsBack: initialYearsBack = 10,
}: FestivalStatisticsProps) {
    const [loading, setLoading] = useState(false)
    const [events, setEvents] = useState<SeasonalEventAnalysis[]>([])
    const [metal, setMetal] = useState<MetalType>(initialMetal)
    const [currency, setCurrency] = useState<CurrencyType>(initialCurrency)
    const [yearsBack, setYearsBack] = useState(initialYearsBack)
    const [selectedFestival, setSelectedFestival] = useState<SeasonalEventAnalysis | null>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const response = await metalsPricesApi.getSeasonalEventsAnalysis(metal, currency, yearsBack, 7, 7)
            setEvents(response.events || [])
        } catch (error) {
            console.error("Error loading festival data:", error)
            toast.error("Failed to load festival statistics")
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metal, currency, yearsBack])

    // Filter only Indian festivals
    const festivalEvents = useMemo(() => {
        return events.filter(e =>
            e.event_type === "festival_india" ||
            e.event_type === "holiday_trading_india"
        )
    }, [events])

    // Sort by average return
    const sortedFestivals = useMemo(() => {
        return [...festivalEvents].sort((a, b) => b.avg_price_change - a.avg_price_change)
    }, [festivalEvents])

    // Calculate overall festival statistics
    const overallStats = useMemo(() => {
        if (festivalEvents.length === 0) return null

        const avgReturn = festivalEvents.reduce((sum, e) => sum + e.avg_price_change, 0) / festivalEvents.length
        const avgWinRate = festivalEvents.reduce((sum, e) => sum + e.win_rate, 0) / festivalEvents.length
        const bestFestival = sortedFestivals[0]
        const worstFestival = sortedFestivals[sortedFestivals.length - 1]

        return {
            avgReturn,
            avgWinRate,
            bestFestival,
            worstFestival,
            totalFestivals: festivalEvents.length,
        }
    }, [festivalEvents, sortedFestivals])

    // Prepare chart data for comparison
    const comparisonData = sortedFestivals.map(f => ({
        name: f.name.length > 12 ? f.name.substring(0, 12) + "..." : f.name,
        fullName: f.name,
        avgReturn: f.avg_price_change,
        winRate: f.win_rate,
        bestReturn: f.best_return,
        worstReturn: f.worst_return,
    }))

    // Get festival config
    const getFestivalConfig = (name: string) => {
        for (const [key, config] of Object.entries(FESTIVAL_CONFIG)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return config
            }
        }
        return { emoji: "🎉", description: "Indian festival", significance: "Traditional gold buying occasion" }
    }

    return (
        <Card className="border-2 border-amber-200/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-amber-100 rounded-xl">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Festival Statistics</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                    {festivalEvents.length} Indian festivals
                                </Badge>
                                <span className="text-xs text-gray-500">Gold buying season analysis</span>
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value={metal} onValueChange={(v) => setMetal(v as MetalType)}>
                            <SelectTrigger className="w-28 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">Gold</SelectItem>
                                <SelectItem value="SILVER">Silver</SelectItem>
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
                ) : festivalEvents.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No festival data available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Overall Stats */}
                        {overallStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
                                >
                                    <p className="text-xs text-amber-600 font-medium mb-1">Avg Festival Return</p>
                                    <p className={`text-2xl font-bold ${overallStats.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {overallStats.avgReturn >= 0 ? '+' : ''}{overallStats.avgReturn.toFixed(2)}%
                                    </p>
                                    <p className="text-xs text-amber-500 mt-1">±7 day window</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                                >
                                    <p className="text-xs text-blue-600 font-medium mb-1">Avg Win Rate</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {overallStats.avgWinRate.toFixed(0)}%
                                    </p>
                                    <p className="text-xs text-blue-500 mt-1">Positive returns</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200"
                                >
                                    <div className="flex items-center gap-1 mb-1">
                                        <Star className="h-3 w-3 text-emerald-600" />
                                        <p className="text-xs text-emerald-600 font-medium">Best Festival</p>
                                    </div>
                                    <p className="text-lg font-bold text-emerald-600 truncate">
                                        {overallStats.bestFestival?.name || "N/A"}
                                    </p>
                                    <p className="text-xs text-emerald-500">
                                        +{overallStats.bestFestival?.avg_price_change.toFixed(2)}%
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200"
                                >
                                    <div className="flex items-center gap-1 mb-1">
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                        <p className="text-xs text-red-600 font-medium">Weakest Festival</p>
                                    </div>
                                    <p className="text-lg font-bold text-red-600 truncate">
                                        {overallStats.worstFestival?.name || "N/A"}
                                    </p>
                                    <p className="text-xs text-red-500">
                                        {overallStats.worstFestival?.avg_price_change.toFixed(2)}%
                                    </p>
                                </motion.div>
                            </div>
                        )}

                        {/* Comparison Bar Chart */}
                        {comparisonData.length > 0 && (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0].payload
                                                    const config = getFestivalConfig(item.fullName)
                                                    return (
                                                        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xl">{config.emoji}</span>
                                                                <p className="font-semibold text-sm">{item.fullName}</p>
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                <p className={`font-bold ${item.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    Avg Return: {item.avgReturn >= 0 ? '+' : ''}{item.avgReturn.toFixed(2)}%
                                                                </p>
                                                                <p>Win Rate: {item.winRate.toFixed(1)}%</p>
                                                                <p className="text-emerald-600">Best: +{item.bestReturn.toFixed(2)}%</p>
                                                                <p className="text-red-600">Worst: {item.worstReturn.toFixed(2)}%</p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
                                        <Bar dataKey="avgReturn" radius={[0, 4, 4, 0]}>
                                            {comparisonData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.avgReturn >= 0 ? "#f59e0b" : "#ef4444"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Festival Cards */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700">Festival Details</h4>
                            <div className="grid gap-3 md:grid-cols-2">
                                {sortedFestivals.map((festival) => {
                                    const config = getFestivalConfig(festival.name)
                                    const isSelected = selectedFestival?.name === festival.name

                                    return (
                                        <motion.div
                                            key={festival.name}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                                ? 'ring-2 ring-amber-400 bg-amber-50'
                                                : 'bg-white hover:bg-gray-50 hover:shadow-md'
                                                }`}
                                            onClick={() => setSelectedFestival(isSelected ? null : festival)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{config.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-medium text-gray-800">{festival.name}</span>
                                                        <span className={`font-bold ${festival.avg_price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {festival.avg_price_change >= 0 ? '+' : ''}{festival.avg_price_change.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                                        <span className="text-gray-500">
                                                            Win Rate: <strong>{festival.win_rate.toFixed(0)}%</strong>
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {festival.occurrences} years
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="mt-4 pt-4 border-t space-y-3"
                                                >
                                                    <p className="text-xs text-gray-600 italic">{config.significance}</p>

                                                    <div className="grid grid-cols-4 gap-3 text-xs">
                                                        <div>
                                                            <p className="text-gray-500">Best Year</p>
                                                            <p className="font-semibold text-emerald-600">+{festival.best_return.toFixed(2)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Worst Year</p>
                                                            <p className="font-semibold text-red-600">{festival.worst_return.toFixed(2)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Volatility</p>
                                                            <p className="font-semibold text-gray-700">{festival.avg_volatility.toFixed(2)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Vol Increase</p>
                                                            <p className="font-semibold text-amber-600">+{festival.volatility_increase_pct.toFixed(1)}%</p>
                                                        </div>
                                                    </div>

                                                    {/* Yearly Performance Mini Chart */}
                                                    {festival.yearly_data && festival.yearly_data.length > 0 && (
                                                        <div className="h-32 mt-2">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={festival.yearly_data}>
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                                                                    <Tooltip
                                                                        formatter={(value: number) => [`${value.toFixed(2)}%`, "Return"]}
                                                                        labelFormatter={(label) => `Year: ${label}`}
                                                                    />
                                                                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="change_7d"
                                                                        stroke="#f59e0b"
                                                                        strokeWidth={2}
                                                                        dot={{ fill: "#f59e0b", r: 3 }}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                Indian festivals drive significant gold demand. Diwali season (Dhanteras to Diwali) typically sees
                                the highest gold purchases. This analysis shows price movements in the ±7 day window around each festival
                                based on {yearsBack} years of data.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
