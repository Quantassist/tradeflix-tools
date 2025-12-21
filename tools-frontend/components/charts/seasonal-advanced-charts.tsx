"use client"

import { useState, useEffect, useCallback } from "react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, ReferenceLine, Legend
} from "recharts"
import { CardContent } from "@/components/ui/card"
import { StyledCard, StyledCardHeader } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import {
    Bell, TrendingUp, TrendingDown, Activity, AlertTriangle,
    CheckCircle, Loader2, BookOpen, Info
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdvancedEventDropdown } from "@/components/ui/advanced-event-dropdown"
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
import { useTranslations } from 'next-intl'

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
    const t = useTranslations('seasonal')
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

            // Auto-select Diwali as default, or first event if Diwali not found
            if (eventsRes.events?.length > 0 && !selectedEvent) {
                const diwaliEvent = eventsRes.events.find(e =>
                    e.name.toLowerCase().includes('diwali')
                )
                setSelectedEvent(diwaliEvent || eventsRes.events[0])
            }
        } catch (err) {
            console.error("Error loading advanced analysis:", err)
            toast.error(t('loadingAdvancedAnalysis'))
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

    return (
        <div className="space-y-6">
            {/* Show loading state inline instead of replacing entire component */}
            {loading && (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <span className="ml-2 text-muted-foreground">{t('loadingAdvancedAnalysis')}</span>
                </div>
            )}
            {/* Upcoming Alerts Section - Compact Grid Layout */}
            {alerts.length > 0 && (
                <StyledCard variant="blue">
                    <StyledCardHeader
                        icon={Bell}
                        title={t('upcomingEventAlerts')}
                        description={t('eventsInDays', { count: alerts.length, days: 60 })}
                        variant="blue"
                        action={
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        {t('learnHowItWorks')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-3 text-xl">
                                            <div className="p-2 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                                                <Bell className="h-5 w-5" />
                                            </div>
                                            {t('upcomingAlertsGuide')}
                                        </DialogTitle>
                                        <DialogDescription>{t('stayAhead')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                                <Info className="h-4 w-4" />
                                                {t('whatAreEventAlerts')}
                                            </h4>
                                            <p className="text-sm text-blue-700">
                                                {t('eventAlertsDesc')}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border">
                                            <h4 className="font-bold text-slate-800 mb-2">{t('alertTypes')}</h4>
                                            <ul className="text-sm text-slate-600 space-y-2">
                                                <li>• <strong className="text-green-600">{t('opportunityGreen')}</strong>: {t('opportunityDesc')}</li>
                                                <li>• <strong className="text-amber-600">{t('cautionAmber')}</strong>: {t('cautionDesc')}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        }
                    />
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${alert.alert_type === "opportunity"
                                        ? "border-green-200 bg-green-50/50"
                                        : "border-amber-200 bg-amber-50/50"
                                        } hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start gap-2">
                                        {alert.alert_type === "opportunity" ? (
                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{alert.event_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {alert.days_until} days • {new Date(alert.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className={`font-bold ${alert.avg_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {alert.avg_change >= 0 ? '+' : ''}{alert.avg_change.toFixed(1)}%
                                        </span>
                                        <span className="text-muted-foreground">
                                            {alert.win_rate.toFixed(0)}% {t('win')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </StyledCard>
            )}

            {/* Event Trajectory Chart */}
            <StyledCard variant="purple">
                <StyledCardHeader
                    icon={Activity}
                    title={t('eventRelativePerformance')}
                    description={t('cumulativeReturns', { days: daysWindow })}
                    variant="purple"
                    action={
                        <div className="flex items-center gap-2">
                            <AdvancedEventDropdown
                                events={events.map(e => ({
                                    name: e.name,
                                    value: e.avg_price_change,
                                    type: e.event_type
                                }))}
                                selectedEvents={selectedEvent ? [selectedEvent.name] : []}
                                onSelectionChange={(selected) => {
                                    if (selected.length > 0 && selected[0] !== selectedEvent?.name) {
                                        const event = events.find(e => e.name === selected[0])
                                        if (event) setSelectedEvent(event)
                                    }
                                }}
                                placeholder="Select event..."
                                singleSelect
                            />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        {t('learnHowItWorks')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-3 text-xl">
                                            <div className="p-2 bg-linear-to-br from-purple-500 to-pink-600 rounded-lg text-white">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            {t('eventTrajectoryGuide')}
                                        </DialogTitle>
                                        <DialogDescription>{t('understandingPriceMovement')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div className="p-4 rounded-xl bg-linear-to-br from-purple-50 to-pink-50 border border-purple-100">
                                            <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                                <Info className="h-4 w-4" />
                                                {t('whatIsEventTrajectory')}
                                            </h4>
                                            <p className="text-sm text-purple-700">
                                                {t('eventTrajectoryDesc')}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border">
                                            <h4 className="font-bold text-slate-800 mb-2">{t('readingTheChart')}</h4>
                                            <ul className="text-sm text-slate-600 space-y-2">
                                                <li>• {t('blueLineDesc')}</li>
                                                <li>• {t('shadedAreaDesc')}</li>
                                                <li>• {t('day0Desc')}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                />
                <CardContent className="pt-4">
                    {trajectoryLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                    ) : trajectory.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trajectory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) => value === 0 ? "Event" : value > 0 ? `+${value}` : value}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                                    />
                                    <Tooltip content={<TrajectoryTooltip />} />
                                    <Legend />
                                    <ReferenceLine x={0} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone"
                                        dataKey="upper_band"
                                        stroke="none"
                                        fill="url(#bandGradient)"
                                        name="Upper Band"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lower_band"
                                        stroke="none"
                                        fill="url(#bandGradient)"
                                        name="Lower Band"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_return"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Avg Return"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            {selectedEvent && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    <div className="p-3 rounded-lg bg-purple-50 text-center">
                                        <p className="text-xs text-muted-foreground">{t('avgChange')}</p>
                                        <p className={`text-lg font-bold ${selectedEvent.avg_price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedEvent.avg_price_change >= 0 ? '+' : ''}{selectedEvent.avg_price_change.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-50 text-center">
                                        <p className="text-xs text-muted-foreground">Win Rate</p>
                                        <p className="text-lg font-bold text-blue-600">{selectedEvent.win_rate.toFixed(0)}%</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-50 text-center">
                                        <p className="text-xs text-muted-foreground">{t('bestReturn')}</p>
                                        <p className="text-lg font-bold text-green-600">+{selectedEvent.best_return.toFixed(2)}%</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-red-50 text-center">
                                        <p className="text-xs text-muted-foreground">{t('worstReturn')}</p>
                                        <p className="text-lg font-bold text-red-600">{selectedEvent.worst_return.toFixed(2)}%</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            {t('selectEventToView')}
                        </div>
                    )}
                </CardContent>
            </StyledCard>

            {/* Trading Insights */}
            <StyledCard variant="orange">
                <StyledCardHeader
                    icon={TrendingUp}
                    title={t('tradingInsightsAdvanced')}
                    description={t('bestWorstAnalysis')}
                    variant="orange"
                    action={
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {t('learnHowItWorks')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="p-2 bg-linear-to-br from-orange-500 to-amber-600 rounded-lg text-white">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        {t('tradingInsightsGuideAdvanced')}
                                    </DialogTitle>
                                    <DialogDescription>{t('quickReference')}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="p-4 rounded-xl bg-linear-to-br from-orange-50 to-amber-50 border border-orange-100">
                                        <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            {t('whatAreTradingInsightsAdvanced')}
                                        </h4>
                                        <p className="text-sm text-orange-700">
                                            {t('tradingInsightsDescAdvanced')}
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
                <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Best Events */}
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4" />
                                {t('bestPerformingEvents')}
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
                                {t('weakestPerformingEvents')}
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
                                {t('mostReliableEvents')}
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
                                {t('mostVolatileEvents')}
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
            </StyledCard>
        </div>
    )
}
