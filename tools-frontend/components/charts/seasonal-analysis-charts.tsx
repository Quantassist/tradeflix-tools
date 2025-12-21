"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { StyledCard, StyledCardHeader } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, BarChart3, Loader2, AlertCircle, Award, Target, Sparkles, ArrowUpRight, ArrowDownRight, BookOpen, Info } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdvancedEventDropdown } from "@/components/ui/advanced-event-dropdown"
import { metalsPricesApi, MonthlySeasonality, SeasonalEventAnalysis, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from 'next-intl'

interface SeasonalAnalysisChartsProps {
    metal?: MetalType
    currency?: CurrencyType
    yearsBack?: number
    daysWindow?: number
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


export function SeasonalAnalysisCharts({
    metal = "GOLD",
    currency = "INR",
    yearsBack: propYearsBack = 10,
    daysWindow: propDaysWindow = 7,
    onSettingsChange
}: SeasonalAnalysisChartsProps) {
    const t = useTranslations('seasonal')
    const [loading, setLoading] = useState(true)
    const [monthlyData, setMonthlyData] = useState<MonthlySeasonality[]>([])
    const [eventsData, setEventsData] = useState<SeasonalEventAnalysis[]>([])
    const [selectedMetal, setSelectedMetal] = useState<MetalType>(metal)
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(currency)
    const [yearsBack, setYearsBack] = useState(propYearsBack)
    const [daysWindow, setDaysWindow] = useState(propDaysWindow)

    // Sync with parent props when they change
    useEffect(() => {
        setSelectedMetal(metal)
    }, [metal])

    useEffect(() => {
        setSelectedCurrency(currency)
    }, [currency])

    useEffect(() => {
        setYearsBack(propYearsBack)
    }, [propYearsBack])

    useEffect(() => {
        setDaysWindow(propDaysWindow)
    }, [propDaysWindow])
    const [error, setError] = useState<string | null>(null)
    const [selectedEventForChart, setSelectedEventForChart] = useState<string>("Diwali")
    // Selected events for Major Events chart (user can add/remove)
    // Note: Union Budget excluded from default selection as requested
    const [selectedMajorEvents, setSelectedMajorEvents] = useState<string[]>([
        "Christmas", "Diwali", "New Year", "Republic Day", "Dhanteras",
        "Chinese New Year", "Independence Day", "Akshaya Tritiya"
    ])

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
                // toast.success(t('loadingSeasonalAnalysis'))
            }
        } catch (err) {
            console.error("Error loading seasonal analysis:", err)
            setError(t('noHistoricalData'))
            toast.error(t('noHistoricalData'))
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

    // Process events data for chart - filter for selected major events only
    const processedEventsData = eventsData
        .filter(e => e.occurrences > 0 && selectedMajorEvents.some(name =>
            e.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(e.name.toLowerCase())
        ))
        .sort((a, b) => b.avg_price_change - a.avg_price_change)
        .map(e => ({
            ...e,
            fill: e.avg_price_change >= 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
        }))

    // Toggle event selection
    const toggleEventSelection = (eventName: string) => {
        setSelectedMajorEvents(prev =>
            prev.includes(eventName)
                ? prev.filter(n => n !== eventName)
                : [...prev, eventName]
        )
    }


    // Calculate major events summary stats
    const majorEventsStats = processedEventsData.length > 0 ? {
        avgReturn: processedEventsData.reduce((sum, e) => sum + e.avg_price_change, 0) / processedEventsData.length,
        avgWinRate: processedEventsData.reduce((sum, e) => sum + e.win_rate, 0) / processedEventsData.length,
        bestEvent: processedEventsData.reduce((best, e) => e.avg_price_change > best.avg_price_change ? e : best, processedEventsData[0]),
        worstEvent: processedEventsData.reduce((worst, e) => e.avg_price_change < worst.avg_price_change ? e : worst, processedEventsData[0]),
    } : null

    // Event emoji/icon mapping
    const getEventEmoji = (name: string): string => {
        const lower = name.toLowerCase()
        if (lower.includes('diwali')) return '🪔'
        if (lower.includes('christmas')) return '🎄'
        if (lower.includes('new year')) return '🎉'
        if (lower.includes('republic')) return '🇮🇳'
        if (lower.includes('dhanteras')) return '💰'
        if (lower.includes('chinese')) return '🐉'
        if (lower.includes('independence')) return '🏛️'
        if (lower.includes('budget')) return '📊'
        if (lower.includes('akshaya')) return '✨'
        return '📅'
    }

    const getEventDescription = (name: string): string => {
        const lower = name.toLowerCase()
        if (lower.includes('diwali')) return 'Festival of Lights - Peak gold buying season'
        if (lower.includes('christmas')) return 'Global holiday - Gift buying season'
        if (lower.includes('new year')) return 'New Year celebrations'
        if (lower.includes('republic')) return 'India Republic Day'
        if (lower.includes('dhanteras')) return 'Day of wealth - Start of Diwali festivities'
        if (lower.includes('chinese')) return 'Lunar New Year - Major Asian gold demand'
        if (lower.includes('independence')) return 'India Independence Day'
        if (lower.includes('budget')) return 'India Union Budget announcement'
        if (lower.includes('akshaya')) return 'Most auspicious day for gold purchase'
        return 'Seasonal event'
    }

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

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-96 space-y-4"
            >
                <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                <div className="text-center">
                    <p className="text-gray-600 font-medium">Loading seasonal analysis...</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Analyzing historical price patterns
                    </p>
                </div>
            </motion.div>
        )
    }

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
            {/* Trading Insights */}
            {insights.length > 0 && (
                <motion.div variants={itemVariants}>
                    <StyledCard variant="purple">
                        <StyledCardHeader
                            icon={Sparkles}
                            title={t('tradingInsights')}
                            description={t('keyObservations', { years: yearsBack >= 1 ? `${yearsBack} years` : `${Math.round(yearsBack * 12)} months` })}
                            variant="purple"
                            action={
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-linear-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white shadow-md">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            {t('learnHowItWorks')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-3 text-xl">
                                                <div className="p-2 bg-linear-to-br from-violet-500 to-fuchsia-600 rounded-lg text-white">
                                                    <Sparkles className="h-5 w-5" />
                                                </div>
                                                {t('tradingInsightsGuide')}
                                            </DialogTitle>
                                            <DialogDescription>{t('understandingInsights')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 mt-4">
                                            <div className="p-4 rounded-xl bg-linear-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
                                                <h4 className="font-bold text-violet-800 mb-2 flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    {t('whatAreTradingInsights')}
                                                </h4>
                                                <p className="text-sm text-violet-700">
                                                    {t('tradingInsightsDesc')}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border">
                                                <h4 className="font-bold text-slate-800 mb-2">{t('insightTypes')}</h4>
                                                <ul className="text-sm text-slate-600 space-y-2">
                                                    <li>• <strong className="text-emerald-600">{t('bullishGreen')}</strong>: {t('bullishDesc')}</li>
                                                    <li>• <strong className="text-red-600">{t('bearishRed')}</strong>: {t('bearishDesc')}</li>
                                                    <li>• <strong className="text-gray-600">{t('neutralGray')}</strong>: {t('neutralDesc')}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            }
                        />
                        <CardContent className="pt-4 pb-6">
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
                    </StyledCard>
                </motion.div>
            )}

            {/* Summary Stats */}
            {bestMonth && worstMonth && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-emerald-200 bg-linear-to-br from-emerald-50 to-green-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-xl">
                                        <Award className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('bestMonth')}</p>
                                        <p className="text-2xl font-bold text-emerald-600">{bestMonth.month_name}</p>
                                        <p className="text-sm font-semibold text-emerald-700">+{bestMonth.avg_return.toFixed(2)}% avg</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-red-200 bg-linear-to-br from-red-50 to-rose-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('worstMonth')}</p>
                                        <p className="text-2xl font-bold text-red-600">{worstMonth.month_name}</p>
                                        <p className="text-sm font-semibold text-red-700">{worstMonth.avg_return.toFixed(2)}% avg</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
                        <Card className="border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50/50 h-full shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Target className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('avgAnnualReturn')}</p>
                                        <p className={`text-2xl font-bold ${avgAnnualReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {avgAnnualReturn >= 0 ? "+" : ""}{avgAnnualReturn.toFixed(2)}%
                                        </p>
                                        <p className="text-sm text-gray-500">{t('sumOfMonthlyAvgs')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}

            {/* Monthly Seasonality Chart */}
            {(processedMonthlyData.length > 0 || loading) && (
                <motion.div variants={itemVariants}>
                    <StyledCard variant="orange">
                        <StyledCardHeader
                            icon={Calendar}
                            title={loading ? t('monthlySeasonalityLoading', { metal: selectedMetal }) : `${t('monthlySeasonality')} - ${selectedMetal}`}
                            description={t('avgMonthlyReturns', { years: yearsBack >= 1 ? `${yearsBack} years` : `${Math.round(yearsBack * 12)} months` })}
                            variant="orange"
                            action={
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            {t('learnHowItWorks')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-3 text-xl">
                                                <div className="p-2 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg text-white">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                {t('monthlySeasonalityGuide')}
                                            </DialogTitle>
                                            <DialogDescription>{t('understandingSeasonalPatterns')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 mt-4">
                                            <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-100">
                                                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    {t('whatIsMonthlySeasonality')}
                                                </h4>
                                                <p className="text-sm text-amber-700">
                                                    {t('monthlySeasonalityDesc')}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border">
                                                <h4 className="font-bold text-slate-800 mb-2">{t('howToUseData')}</h4>
                                                <ul className="text-sm text-slate-600 space-y-2">
                                                    <li>• {t('greenBarsIndicate')}</li>
                                                    <li>• {t('redBarsIndicate')}</li>
                                                    <li>• {t('winRateShows')}</li>
                                                    <li>• {t('useToTimeEntries')}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            }
                        />
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-[400px]">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">{t('loadingSeasonalityData')}</p>
                                    </div>
                                </div>
                            ) : (
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
                            )}

                            {/* Legend */}
                            <div className="flex justify-center gap-8 mt-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-600">{t('positiveReturn')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-600">{t('negativeReturn')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </StyledCard>
                </motion.div>
            )}

            {/* Top Events by Impact */}
            {eventsData.length > 0 && (
                <motion.div variants={itemVariants}>
                    <StyledCard variant="purple">
                        <StyledCardHeader
                            icon={TrendingUp}
                            title={t('majorEventsImpact')}
                            description={t('historicalPriceImpact', { days: daysWindow, count: processedEventsData.length })}
                            variant="purple"
                            action={
                                <div className="flex items-center gap-2">
                                    <AdvancedEventDropdown
                                        events={eventsData.map(e => ({
                                            name: e.name,
                                            value: e.avg_price_change,
                                            type: e.event_type
                                        }))}
                                        selectedEvents={selectedMajorEvents}
                                        onSelectionChange={setSelectedMajorEvents}
                                        placeholder="Add event..."
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
                                                        <TrendingUp className="h-5 w-5" />
                                                    </div>
                                                    {t('eventImpactGuide')}
                                                </DialogTitle>
                                                <DialogDescription>{t('understandingEventImpact')}</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-4">
                                                <div className="p-4 rounded-xl bg-linear-to-br from-purple-50 to-pink-50 border border-purple-100">
                                                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                                        <Info className="h-4 w-4" />
                                                        {t('whatIsEventImpact')}
                                                    </h4>
                                                    <p className="text-sm text-purple-700">
                                                        {t('eventImpactDesc')}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border">
                                                    <h4 className="font-bold text-slate-800 mb-2">{t('keyMetricsExplained')}</h4>
                                                    <ul className="text-sm text-slate-600 space-y-2">
                                                        <li>• {t('avgChangeMetric')}</li>
                                                        <li>• {t('winRateMetric')}</li>
                                                        <li>• {t('bestWorstMetric')}</li>
                                                        <li>• {t('yearsMetric')}</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            }
                        />
                        {/* Selected Events Tags */}
                        {selectedMajorEvents.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-6 pb-2">
                                {selectedMajorEvents.map((name) => (
                                    <Badge
                                        key={name}
                                        variant="secondary"
                                        className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                                        onClick={() => toggleEventSelection(name)}
                                    >
                                        {name} ×
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <CardContent className="pt-6">
                            {/* Loading State */}
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                    <span className="ml-2 text-gray-500">{t('loadingEventsData')}</span>
                                </div>
                            )}

                            {/* Empty State */}
                            {!loading && processedEventsData.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">{t('noEventsSelected')}</p>
                                    <p className="text-sm mt-1">{t('useDropdownToAdd')}</p>
                                </div>
                            )}

                            {/* Summary Stats Cards */}
                            {!loading && majorEventsStats && processedEventsData.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                                    >
                                        <p className="text-xs text-purple-600 font-medium mb-1">{t('avgEventReturn')}</p>
                                        <p className={`text-2xl font-bold ${majorEventsStats.avgReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {majorEventsStats.avgReturn >= 0 ? '+' : ''}{majorEventsStats.avgReturn.toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-purple-500 mt-1">{t('dayWindow', { days: daysWindow })}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                                    >
                                        <p className="text-xs text-blue-600 font-medium mb-1">{t('avgWinRate')}</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {majorEventsStats.avgWinRate.toFixed(0)}%
                                        </p>
                                        <p className="text-xs text-blue-500 mt-1">{t('positiveReturns')}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-4 bg-linear-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200"
                                    >
                                        <div className="flex items-center gap-1 mb-1">
                                            <Sparkles className="h-3 w-3 text-emerald-600" />
                                            <p className="text-xs text-emerald-600 font-medium">{t('bestEvent')}</p>
                                        </div>
                                        <p className="text-lg font-bold text-emerald-600 truncate">
                                            {majorEventsStats.bestEvent?.name || "N/A"}
                                        </p>
                                        <p className="text-xs text-emerald-500">
                                            +{majorEventsStats.bestEvent?.avg_price_change.toFixed(2)}%
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-4 bg-linear-to-br from-red-50 to-rose-50 rounded-xl border border-red-200"
                                    >
                                        <div className="flex items-center gap-1 mb-1">
                                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                                            <p className="text-xs text-red-600 font-medium">{t('weakestEvent')}</p>
                                        </div>
                                        <p className="text-lg font-bold text-red-600 truncate">
                                            {majorEventsStats.worstEvent?.name || "N/A"}
                                        </p>
                                        <p className="text-xs text-red-500">
                                            {majorEventsStats.worstEvent?.avg_price_change.toFixed(2)}%
                                        </p>
                                    </motion.div>
                                </div>
                            )}

                            {/* Bar Chart */}
                            {!loading && processedEventsData.length > 0 && (
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
                            )}

                            {/* Event Detail Cards */}
                            {!loading && processedEventsData.length > 0 && (
                                <div className="mt-6 mb-6">
                                    <h4 className="font-semibold text-sm text-gray-700 mb-3">{t('eventDetails')}</h4>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {processedEventsData.map((event, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-4 rounded-xl border bg-white hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{getEventEmoji(event.name)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium text-gray-800 truncate">{event.name}</span>
                                                            <span className={`font-bold text-lg ${event.avg_price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {event.avg_price_change >= 0 ? '+' : ''}{event.avg_price_change.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">{getEventDescription(event.name)}</p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                                            <span className="text-gray-500">
                                                                {t('winRateLabel')}: <strong>{event.win_rate.toFixed(0)}%</strong>
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {event.occurrences} {t('yearsLabel')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Events Table */}
                            <div className="mt-6 overflow-x-auto">
                                <p className="text-sm text-gray-500 mb-3">
                                    {t('analysisWindow', { days: daysWindow })}
                                </p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/50">
                                            <th className="text-left p-3 font-semibold text-gray-700">{t('eventHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('dateHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('avgChangeHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('winRateHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('bestHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('worstHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('volatilityHeader')}</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">{t('yearsHeader')}</th>
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
                    </StyledCard>
                </motion.div>
            )}

            {/* Year-wise Performance Chart */}
            {eventsData.length > 0 && (
                <motion.div variants={itemVariants}>
                    <StyledCard variant="indigo">
                        <StyledCardHeader
                            icon={BarChart3}
                            title={t('yearWisePerformance')}
                            description={t('yearWiseDescription', { metal: selectedMetal, currency: selectedCurrency, days: daysWindow })}
                            variant="indigo"
                            action={
                                <div className="flex items-center gap-2">
                                    <AdvancedEventDropdown
                                        events={eventsData.map(e => ({
                                            name: e.name,
                                            value: e.avg_price_change,
                                            type: e.event_type
                                        }))}
                                        selectedEvents={selectedEventForChart ? [selectedEventForChart] : (eventsData[0] ? [eventsData[0].name] : [])}
                                        onSelectionChange={(events) => setSelectedEventForChart(events[0] || "")}
                                        placeholder="Select event..."
                                        singleSelect
                                    />
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                {t('learnHowItWorks')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-3 text-xl">
                                                    <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                                                        <BarChart3 className="h-5 w-5" />
                                                    </div>
                                                    {t('yearWiseGuide')}
                                                </DialogTitle>
                                                <DialogDescription>{t('understandingYearWise')}</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-4">
                                                <div className="p-4 rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                                                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                                        <Info className="h-4 w-4" />
                                                        {t('whatIsYearWise')}
                                                    </h4>
                                                    <p className="text-sm text-indigo-700">
                                                        {t('yearWiseDesc')}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border">
                                                    <h4 className="font-bold text-slate-800 mb-2">{t('readingTheChartYearWise')}</h4>
                                                    <ul className="text-sm text-slate-600 space-y-2">
                                                        <li>• {t('preEventBlue')}</li>
                                                        <li>• {t('postEventPurple')}</li>
                                                        <li>• {t('consistentPatterns')}</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            }
                        />
                        <CardContent className="pt-6">
                            {(() => {
                                const selectedEvent = eventsData.find(e => e.name === (selectedEventForChart || eventsData[0]?.name))
                                if (!selectedEvent?.yearly_data?.length) {
                                    return (
                                        <div className="flex items-center justify-center h-64 text-gray-400">
                                            {t('noYearlyData')}
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
                                                                        <span className="text-gray-500">{t('preEvent')}:</span>
                                                                        <span className={`font-bold ${(payload[0]?.value as number) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {(payload[0]?.value as number) >= 0 ? '+' : ''}{(payload[0]?.value as number)?.toFixed(2)}%
                                                                        </span>
                                                                    </p>
                                                                    <p className="flex items-center gap-2 text-sm">
                                                                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#94a3b8' }}></span>
                                                                        <span className="text-gray-500">{t('postEvent')}:</span>
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
                                    <span className="text-sm text-gray-600">{t('preEventLegend', { days: daysWindow })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#94a3b8' }}></div>
                                    <span className="text-sm text-gray-600">{t('postEventLegend', { days: daysWindow })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </StyledCard>
                </motion.div>
            )}
        </motion.div>
    )
}
