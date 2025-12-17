"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, DollarSign, Building2, Globe, FileText, Info } from "lucide-react"
import { metalsPricesApi, SeasonalEventAnalysis, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"

interface EconomicEventsAnalysisProps {
    metal?: MetalType
    currency?: CurrencyType
    yearsBack?: number
}

// Economic event categories
const ECONOMIC_EVENT_TYPES = {
    fomc: { label: "FOMC Meetings", icon: Building2, color: "blue" },
    budget: { label: "Budget Events", icon: FileText, color: "amber" },
    policy: { label: "Policy Events", icon: Globe, color: "purple" },
    macro: { label: "Macro Releases", icon: DollarSign, color: "emerald" },
}

// Map event types to categories
const EVENT_TYPE_MAP: Record<string, keyof typeof ECONOMIC_EVENT_TYPES> = {
    fomc_meeting: "fomc",
    budget_india: "budget",
    policy_event: "policy",
    macro_release: "macro",
}

export function EconomicEventsAnalysis({
    metal: initialMetal = "GOLD",
    currency: initialCurrency = "INR",
    yearsBack: initialYearsBack = 10,
}: EconomicEventsAnalysisProps) {
    const [loading, setLoading] = useState(false)
    const [events, setEvents] = useState<SeasonalEventAnalysis[]>([])
    const [metal, setMetal] = useState<MetalType>(initialMetal)
    const [currency, setCurrency] = useState<CurrencyType>(initialCurrency)
    const [yearsBack, setYearsBack] = useState(initialYearsBack)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    const loadData = async () => {
        setLoading(true)
        try {
            const response = await metalsPricesApi.getSeasonalEventsAnalysis(metal, currency, yearsBack, 7, 7)
            setEvents(response.events || [])
        } catch (error) {
            console.error("Error loading economic events:", error)
            toast.error("Failed to load economic events analysis")
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metal, currency, yearsBack])

    // Filter economic events only
    const economicEvents = useMemo(() => {
        return events.filter(e =>
            e.event_type === "fomc_meeting" ||
            e.event_type === "budget_india" ||
            e.event_type === "policy_event" ||
            e.event_type === "macro_release"
        )
    }, [events])

    // Group events by category
    const groupedEvents = useMemo(() => {
        const groups: Record<string, SeasonalEventAnalysis[]> = {
            fomc: [],
            budget: [],
            policy: [],
            macro: [],
        }

        economicEvents.forEach(event => {
            const category = EVENT_TYPE_MAP[event.event_type]
            if (category) {
                groups[category].push(event)
            }
        })

        return groups
    }, [economicEvents])

    // Filter events based on selected category
    const filteredEvents = useMemo(() => {
        if (selectedCategory === "all") return economicEvents
        return groupedEvents[selectedCategory] || []
    }, [selectedCategory, economicEvents, groupedEvents])

    // Calculate category statistics
    const categoryStats = useMemo(() => {
        return Object.entries(groupedEvents).map(([key, categoryEvents]) => {
            if (categoryEvents.length === 0) return { key, avgReturn: 0, winRate: 0, count: 0 }

            const avgReturn = categoryEvents.reduce((sum, e) => sum + e.avg_price_change, 0) / categoryEvents.length
            const avgWinRate = categoryEvents.reduce((sum, e) => sum + e.win_rate, 0) / categoryEvents.length

            return {
                key,
                avgReturn: avgReturn,
                winRate: avgWinRate,
                count: categoryEvents.length,
            }
        })
    }, [groupedEvents])

    // Prepare chart data
    const chartData = filteredEvents.map(e => ({
        name: e.name.length > 20 ? e.name.substring(0, 20) + "..." : e.name,
        fullName: e.name,
        avgReturn: e.avg_price_change,
        winRate: e.win_rate,
        volatility: e.avg_volatility,
        type: e.event_type,
    }))

    return (
        <Card className="border-2 border-indigo-200/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-100 rounded-xl">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Economic Events Deep Analysis</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                    {economicEvents.length} economic events
                                </Badge>
                                <span className="text-xs text-gray-500">FOMC, Budget, Policy impacts</span>
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
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : economicEvents.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No economic events data available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Category Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categoryStats.map((stat, idx) => {
                                const config = ECONOMIC_EVENT_TYPES[stat.key as keyof typeof ECONOMIC_EVENT_TYPES]
                                if (!config || stat.count === 0) return null
                                const Icon = config.icon

                                return (
                                    <motion.div
                                        key={stat.key}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCategory === stat.key
                                            ? `ring-2 ring-${config.color}-400 bg-${config.color}-50`
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        onClick={() => setSelectedCategory(selectedCategory === stat.key ? "all" : stat.key)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className={`h-4 w-4 text-${config.color}-600`} />
                                            <p className="text-xs font-medium text-gray-600">{config.label}</p>
                                        </div>
                                        <p className={`text-xl font-bold ${stat.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {stat.winRate.toFixed(0)}% win rate • {stat.count} events
                                        </p>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Category Filter Tabs */}
                        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="all">All Events</TabsTrigger>
                                <TabsTrigger value="fomc">FOMC</TabsTrigger>
                                <TabsTrigger value="budget">Budget</TabsTrigger>
                                <TabsTrigger value="policy">Policy</TabsTrigger>
                                <TabsTrigger value="macro">Macro</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Bar Chart */}
                        {chartData.length > 0 && (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0].payload
                                                    return (
                                                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                            <p className="font-semibold text-sm">{item.fullName}</p>
                                                            <div className="mt-2 space-y-1 text-xs">
                                                                <p className={`font-bold ${item.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    Avg Return: {item.avgReturn >= 0 ? '+' : ''}{item.avgReturn.toFixed(2)}%
                                                                </p>
                                                                <p>Win Rate: {item.winRate.toFixed(1)}%</p>
                                                                <p>Volatility: {item.volatility.toFixed(2)}%</p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
                                        <Bar dataKey="avgReturn" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.avgReturn >= 0 ? "#10b981" : "#ef4444"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Detailed Event Table */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-gray-700">Event Details ({filteredEvents.length} events)</h4>
                            </div>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-3 font-semibold text-gray-700">Event</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Type</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Date</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Avg Return</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Win Rate</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Best</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Worst</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Years</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEvents.slice(0, 15).map((event, idx) => (
                                            <tr key={event.name} className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                <td className="p-3 font-medium text-gray-800 max-w-[200px] truncate" title={event.name}>
                                                    {event.name}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className="text-[10px] capitalize">
                                                        {event.event_type.replace(/_/g, " ").replace("india", "").trim()}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center text-gray-600">
                                                    {event.month}/{event.day}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`font-bold ${event.avg_price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {event.avg_price_change >= 0 ? '+' : ''}{event.avg_price_change.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`font-medium ${event.win_rate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {event.win_rate.toFixed(0)}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center text-emerald-600 font-medium">
                                                    +{event.best_return.toFixed(1)}%
                                                </td>
                                                <td className="p-3 text-center text-red-600 font-medium">
                                                    {event.worst_return.toFixed(1)}%
                                                </td>
                                                <td className="p-3 text-center text-gray-500">
                                                    {event.occurrences}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredEvents.length > 15 && (
                                <p className="text-xs text-gray-500 text-center">
                                    Showing 15 of {filteredEvents.length} events. Use category filters to narrow down.
                                </p>
                            )}
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                Economic events like FOMC meetings, budget announcements, and policy changes can significantly impact
                                precious metal prices. This analysis shows the average price movement in the ±7 day window around each event
                                based on {yearsBack} years of historical data.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
