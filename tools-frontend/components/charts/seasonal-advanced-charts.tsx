"use client"

import { useState, useEffect, useCallback } from "react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, ReferenceLine, Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Bell, TrendingUp, TrendingDown, Activity, AlertTriangle,
    CheckCircle, Loader2
} from "lucide-react"
import {
    metalsPricesApi,
    MetalType,
    CurrencyType,
    UpcomingAlert,
    TrajectoryPoint,
    SeasonalEventAnalysis
} from "@/lib/api/metals-prices"

// Note: MetalType and CurrencyType are used for prop types
import { toast } from "sonner"

interface SeasonalAdvancedChartsProps {
    metal?: MetalType
    currency?: CurrencyType
    yearsBack?: number
    daysWindow?: number
}

// Custom tooltip for trajectory chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TrajectoryTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: number }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as TrajectoryPoint
        return (
            <div className="bg-white p-3 border-2 rounded-lg shadow-lg">
                <p className="font-semibold text-sm mb-1">
                    Day {label !== undefined && label >= 0 ? `+${label}` : label}
                </p>
                <div className="space-y-1 text-xs">
                    <p>
                        <span className="text-muted-foreground">Avg Return:</span>{" "}
                        <span className={`font-bold ${data.avg_return >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {data.avg_return >= 0 ? "+" : ""}{data.avg_return.toFixed(2)}%
                        </span>
                    </p>
                    <p>
                        <span className="text-muted-foreground">Upper Band:</span>{" "}
                        <span className="text-green-600">+{data.upper_band.toFixed(2)}%</span>
                    </p>
                    <p>
                        <span className="text-muted-foreground">Lower Band:</span>{" "}
                        <span className="text-red-600">{data.lower_band.toFixed(2)}%</span>
                    </p>
                </div>
            </div>
        )
    }
    return null
}

export function SeasonalAdvancedCharts({
    metal = "GOLD",
    currency = "INR",
    yearsBack = 10,
    daysWindow = 7
}: SeasonalAdvancedChartsProps) {
    const [loading, setLoading] = useState(true)
    const [alerts, setAlerts] = useState<UpcomingAlert[]>([])
    const [events, setEvents] = useState<SeasonalEventAnalysis[]>([])
    const [selectedEvent, setSelectedEvent] = useState<SeasonalEventAnalysis | null>(null)
    const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])
    const [trajectoryLoading, setTrajectoryLoading] = useState(false)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [alertsRes, eventsRes] = await Promise.all([
                metalsPricesApi.getUpcomingAlerts(metal, currency, yearsBack, 60),
                metalsPricesApi.getSeasonalEventsAnalysis(metal, currency, yearsBack, daysWindow, daysWindow),
            ])

            setAlerts(alertsRes.alerts || [])
            setEvents(eventsRes.events || [])

            // Auto-select first event for trajectory
            if (eventsRes.events?.length > 0 && !selectedEvent) {
                setSelectedEvent(eventsRes.events[0])
            }
        } catch (err) {
            console.error("Error loading advanced analysis:", err)
            toast.error("Failed to load advanced analysis data")
        } finally {
            setLoading(false)
        }
    }, [metal, currency, yearsBack, daysWindow, selectedEvent])

    // Load trajectory when event is selected
    const loadTrajectory = useCallback(async () => {
        if (!selectedEvent) return

        setTrajectoryLoading(true)
        try {
            const res = await metalsPricesApi.getEventTrajectory(
                selectedEvent.month,
                selectedEvent.day,
                metal,
                currency,
                yearsBack,
                daysWindow,
                daysWindow
            )
            setTrajectory(res.trajectory || [])
        } catch (err) {
            console.error("Error loading trajectory:", err)
            setTrajectory([])
        } finally {
            setTrajectoryLoading(false)
        }
    }, [selectedEvent, metal, currency, yearsBack, daysWindow])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        loadTrajectory()
    }, [loadTrajectory])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-muted-foreground">Loading advanced analysis...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Upcoming Alerts Section */}
            {alerts.length > 0 && (
                <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Upcoming Event Alerts</CardTitle>
                        </div>
                        <CardDescription>Events happening in the next 60 days with historical context</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border-2 ${alert.alert_type === "opportunity"
                                        ? "border-green-200 bg-green-50"
                                        : "border-amber-200 bg-amber-50"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            {alert.alert_type === "opportunity" ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            )}
                                            <div>
                                                <p className="font-semibold">{alert.event_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {alert.event_date} • {alert.days_until} days away
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={alert.alert_type === "opportunity" ? "default" : "secondary"}>
                                            {alert.alert_type === "opportunity" ? "Opportunity" : "Caution"}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-sm">{alert.message}</p>
                                    <div className="mt-2 flex gap-4 text-xs">
                                        <span>
                                            Win Rate: <strong>{alert.win_rate.toFixed(0)}%</strong>
                                        </span>
                                        <span>
                                            Best: <strong className="text-green-600">+{alert.best_return.toFixed(1)}%</strong>
                                        </span>
                                        <span>
                                            Worst: <strong className="text-red-600">{alert.worst_return.toFixed(1)}%</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Event Trajectory Chart */}
            <Card className="border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-600" />
                            <div>
                                <CardTitle className="text-lg">Event-Relative Performance</CardTitle>
                                <CardDescription>
                                    Cumulative returns from -{daysWindow} to +{daysWindow} days around event
                                </CardDescription>
                            </div>
                        </div>
                        <Select
                            value={selectedEvent?.name || ""}
                            onValueChange={(v) => {
                                const event = events.find(e => e.name === v)
                                if (event) setSelectedEvent(event)
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select event" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map((event) => (
                                    <SelectItem key={event.name} value={event.name}>
                                        {event.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {trajectoryLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                    ) : trajectory.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trajectory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="day"
                                        tickFormatter={(v) => v === 0 ? "Event" : v > 0 ? `+${v}` : v}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `${v.toFixed(1)}%`}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip content={<TrajectoryTooltip />} />
                                    <Legend />
                                    <ReferenceLine x={0} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" label="Event" />
                                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone"
                                        dataKey="upper_band"
                                        stroke="none"
                                        fill="url(#colorBand)"
                                        name="Upper Band"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lower_band"
                                        stroke="none"
                                        fill="url(#colorBand)"
                                        name="Lower Band"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_return"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                                        name="Avg Return"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            Select an event to view its trajectory
                        </div>
                    )}
                    {selectedEvent && (
                        <div className="mt-4 grid grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-purple-50 text-center">
                                <p className="text-xs text-muted-foreground">Avg Change</p>
                                <p className={`text-lg font-bold ${selectedEvent.avg_price_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {selectedEvent.avg_price_change >= 0 ? "+" : ""}{selectedEvent.avg_price_change.toFixed(2)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-50 text-center">
                                <p className="text-xs text-muted-foreground">Win Rate</p>
                                <p className="text-lg font-bold text-purple-600">{selectedEvent.win_rate.toFixed(0)}%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50 text-center">
                                <p className="text-xs text-muted-foreground">Best Return</p>
                                <p className="text-lg font-bold text-green-600">+{selectedEvent.best_return.toFixed(2)}%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 text-center">
                                <p className="text-xs text-muted-foreground">Worst Return</p>
                                <p className="text-lg font-bold text-red-600">{selectedEvent.worst_return.toFixed(2)}%</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Trading Insights */}
            <Card className="border-2 border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-lg">Trading Insights</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Best Events */}
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4" />
                                Best Performing Events
                            </h4>
                            <div className="space-y-2">
                                {events.filter(e => e.avg_price_change > 0).slice(0, 3).map((event, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{event.name}</span>
                                        <span className="font-bold text-green-600">+{event.avg_price_change.toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Worst Events */}
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                            <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                                <TrendingDown className="h-4 w-4" />
                                Weakest Performing Events
                            </h4>
                            <div className="space-y-2">
                                {events.filter(e => e.avg_price_change < 0).slice(-3).reverse().map((event, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{event.name}</span>
                                        <span className="font-bold text-red-600">{event.avg_price_change.toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Highest Win Rate */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                                <CheckCircle className="h-4 w-4" />
                                Most Reliable Events (Win Rate)
                            </h4>
                            <div className="space-y-2">
                                {[...events].sort((a, b) => b.win_rate - a.win_rate).slice(0, 3).map((event, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{event.name}</span>
                                        <span className="font-bold text-blue-600">{event.win_rate.toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Highest Volatility */}
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                                <Activity className="h-4 w-4" />
                                Most Volatile Events
                            </h4>
                            <div className="space-y-2">
                                {[...events].sort((a, b) => b.volatility_increase_pct - a.volatility_increase_pct).slice(0, 3).map((event, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{event.name}</span>
                                        <span className="font-bold text-amber-600">+{event.volatility_increase_pct.toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
