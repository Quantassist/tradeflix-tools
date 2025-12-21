"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Gauge, Clock, Calendar, BookOpen, Target, Building2, Briefcase, Lightbulb } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { DisaggCOTAnalysisResponse, COTChartDataResponse } from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"
import { HelpButton } from "./HelpButton"
import { calculateCOTIndex } from "./utils"

interface AnalysisTabProps {
    result: DisaggCOTAnalysisResponse
    chartData: COTChartDataResponse | null
}

export function AnalysisTab({ result, chartData }: AnalysisTabProps) {
    const t = useTranslations('cot')

    // Calculate next COT release date (Friday 3:30 PM ET)
    const getNextCOTRelease = () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
        const nextFriday = new Date(now)
        nextFriday.setDate(now.getDate() + daysUntilFriday)
        nextFriday.setHours(15, 30, 0, 0)
        return nextFriday
    }

    const nextRelease = getNextCOTRelease()
    const daysUntilRelease = Math.ceil((nextRelease.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    // Calculate COT indices
    const mmIndex = chartData ? calculateCOTIndex(result.current_positions.managed_money_net, chartData.net_positions.managed_money_net) : 50
    const commIndex = chartData ? calculateCOTIndex(result.current_positions.producer_merchant_net, chartData.net_positions.producer_merchant_net) : 50
    const swapIndex = chartData ? calculateCOTIndex(result.current_positions.swap_dealer_net, chartData.net_positions.swap_dealer_net) : 50

    // OI Signal calculation
    const oiChange = result.weekly_changes.change_open_interest
    const mmChange = result.weekly_changes.change_m_money_net
    let oiSignal = { label: t('neutral'), color: 'slate', desc: t('noClearSignal'), icon: Activity }
    if (oiChange > 0 && mmChange > 0) {
        oiSignal = { label: t('bullishTrend'), color: 'emerald', desc: t('newLongsEntering'), icon: TrendingUp }
    } else if (oiChange > 0 && mmChange < 0) {
        oiSignal = { label: t('bearishTrend'), color: 'red', desc: t('newShortsEntering'), icon: TrendingDown }
    } else if (oiChange < 0 && mmChange > 0) {
        oiSignal = { label: t('shortCovering'), color: 'amber', desc: t('rallyMayNotSustain'), icon: TrendingUp }
    } else if (oiChange < 0 && mmChange < 0) {
        oiSignal = { label: t('longLiquidation'), color: 'orange', desc: t('bearishButExhausting'), icon: TrendingDown }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('deepAnalysis')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('cotIndexOISignals')}
                    </p>
                </div>
                <InterpretationGuideButton tabKey="analysis" />
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-400">{t('mmCotIndex')}</span>
                    </div>
                    <div className={`text-2xl font-bold ${mmIndex >= 80 ? 'text-red-600' : mmIndex <= 20 ? 'text-emerald-600' : 'text-foreground'}`}>
                        {mmIndex.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {mmIndex >= 80 ? t('extremeBullish') : mmIndex <= 20 ? t('extremeBearish') : t('neutralZone')}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{t('commCotIndex')}</span>
                    </div>
                    <div className={`text-2xl font-bold ${commIndex >= 80 ? 'text-red-600' : commIndex <= 20 ? 'text-emerald-600' : 'text-foreground'}`}>
                        {commIndex.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {commIndex >= 80 ? t('extremeBullish') : commIndex <= 20 ? t('extremeBearish') : t('neutralZone')}
                    </div>
                </div>
                <div className={`bg-gradient-to-br from-${oiSignal.color}-50 to-${oiSignal.color}-100/50 dark:from-${oiSignal.color}-950/30 dark:to-${oiSignal.color}-900/20 rounded-xl p-4 border border-${oiSignal.color}-100 dark:border-${oiSignal.color}-900/50`}>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full bg-${oiSignal.color}-500`} />
                        <span className={`text-xs font-medium text-${oiSignal.color}-700 dark:text-${oiSignal.color}-400`}>{t('oiSignal')}</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">{oiSignal.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{oiSignal.desc}</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-400">{t('nextReportLabel')}</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                        {daysUntilRelease === 0 ? t('today') : daysUntilRelease === 1 ? t('tomorrow') : `${daysUntilRelease} ${t('days')}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t('fridayTime')}</div>
                </div>
            </div>

            {/* COT Index Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* COT Index Card */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50">
                                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{t('cotIndex')}</CardTitle>
                                    <CardDescription className="text-xs">{t('normalizedPositioning')}</CardDescription>
                                </div>
                            </div>
                            <HelpButton helpKey="cotIndex" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {chartData && (
                            <>
                                {/* Managed Money */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-medium">{t('managedMoney')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={mmIndex >= 80 ? "destructive" : mmIndex <= 20 ? "default" : "secondary"} className="text-xs">
                                                {mmIndex >= 80 ? t('sellZone') : mmIndex <= 20 ? t('buyZone') : t('neutral')}
                                            </Badge>
                                            <span className="font-mono text-sm font-bold">{mmIndex.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-3 bg-gradient-to-r from-emerald-400 via-slate-300 to-red-400 rounded-full">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-500 rounded-full shadow-lg transition-all duration-500"
                                            style={{ left: `calc(${mmIndex}% - 8px)` }}
                                        />
                                    </div>
                                </div>

                                {/* Commercials */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">{t('commercials')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={commIndex >= 80 ? "destructive" : commIndex <= 20 ? "default" : "secondary"} className="text-xs">
                                                {commIndex >= 80 ? t('sellZone') : commIndex <= 20 ? t('buyZone') : t('neutral')}
                                            </Badge>
                                            <span className="font-mono text-sm font-bold">{commIndex.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-3 bg-gradient-to-r from-emerald-400 via-slate-300 to-red-400 rounded-full">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg transition-all duration-500"
                                            style={{ left: `calc(${commIndex}% - 8px)` }}
                                        />
                                    </div>
                                </div>

                                {/* Swap Dealers */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-violet-500" />
                                            <span className="text-sm font-medium">{t('swapDealers')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={swapIndex >= 80 ? "destructive" : swapIndex <= 20 ? "default" : "secondary"} className="text-xs">
                                                {swapIndex >= 80 ? t('sellZone') : swapIndex <= 20 ? t('buyZone') : t('neutral')}
                                            </Badge>
                                            <span className="font-mono text-sm font-bold">{swapIndex.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-3 bg-gradient-to-r from-emerald-400 via-slate-300 to-red-400 rounded-full">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-violet-500 rounded-full shadow-lg transition-all duration-500"
                                            style={{ left: `calc(${swapIndex}% - 8px)` }}
                                        />
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                    <span className="text-emerald-600 font-medium">← {t('buyZone')} (0-20)</span>
                                    <span>{t('neutral')} (20-80)</span>
                                    <span className="text-red-600 font-medium">{t('sellZone')} (80-100) →</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Open Interest Analysis */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                                    <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{t('openInterestAnalysis')}</CardTitle>
                                    <CardDescription className="text-xs">{t('trendConfirmationSignals')}</CardDescription>
                                </div>
                            </div>
                            <HelpButton helpKey="openInterest" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* OI Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-4 rounded-xl bg-white/50 dark:bg-black/20 border">
                                <div className="text-xs text-muted-foreground mb-1">{t('currentOI')}</div>
                                <div className="text-xl font-bold">{formatNumber(result.current_positions.open_interest, 0)}</div>
                                <div className={`text-xs font-medium mt-1 ${oiChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {oiChange >= 0 ? '↑' : '↓'} {formatNumber(Math.abs(oiChange), 0)} {t('thisWeek')}
                                </div>
                            </div>
                            <div className={`text-center p-4 rounded-xl border bg-${oiSignal.color}-50 dark:bg-${oiSignal.color}-950/30 border-${oiSignal.color}-200 dark:border-${oiSignal.color}-800`}>
                                <div className="text-xs text-muted-foreground mb-1">{t('trendSignal')}</div>
                                <div className={`text-lg font-bold text-${oiSignal.color}-700 dark:text-${oiSignal.color}-400`}>{oiSignal.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">{oiSignal.desc}</div>
                            </div>
                        </div>

                        {/* OI Interpretation Guide */}
                        <div className="rounded-xl border overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium">{t('howToReadOIPrice')}</div>
                            <div className="divide-y dark:divide-slate-800">
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-sm"><span className="font-medium text-emerald-600">{t('oiUpPriceUp')}</span> = {t('newLongsBullish')}</span>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    <span className="text-sm"><span className="font-medium text-red-600">{t('oiUpPriceDown')}</span> = {t('newShortsBearish')}</span>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    <span className="text-sm"><span className="font-medium text-amber-600">{t('oiDownPriceUp')}</span> = {t('shortCovering')}</span>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                    <span className="text-sm"><span className="font-medium text-orange-600">{t('oiDownPriceDown')}</span> = {t('longLiquidation')}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Calendar & Case Studies */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Report Calendar */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('reportCalendar')}</CardTitle>
                                <CardDescription className="text-xs">{t('weeklyReleaseSchedule')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Next Release Highlight */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium opacity-90">{t('nextRelease')}</span>
                                </div>
                                <div className="text-2xl font-bold mb-1">
                                    {nextRelease.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                                    {daysUntilRelease === 0 ? t('today') : daysUntilRelease === 1 ? t('tomorrow') : t('inDays', { days: daysUntilRelease })}
                                </Badge>
                            </div>
                        </div>

                        {/* Data Info */}
                        <div className="space-y-2">
                            <div className="flex justify-between p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                <span className="text-sm text-muted-foreground">{t('dataAsOf')}</span>
                                <span className="text-sm font-medium">{result.data_as_of_date}</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                <span className="text-sm text-muted-foreground">{t('dataLag')}</span>
                                <span className="text-sm font-medium">{t('threeDays')}</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                <span className="text-sm text-muted-foreground">{t('analysisPeriod')}</span>
                                <span className="text-sm font-medium">{result.weeks_analyzed} {t('weeks')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Historical Case Studies */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('historicalCaseStudies')}</CardTitle>
                                <CardDescription className="text-xs">{t('learnFromPast')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-100 dark:border-red-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xs">🔴</div>
                                    <span className="font-semibold text-red-800 dark:text-red-300">{t('classicTop')}</span>
                                </div>
                                <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                                    {t('classicTopDesc')}
                                </p>
                                <Badge variant="outline" className="text-xs border-red-200 text-red-600">{t('extremeDivergence')}</Badge>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-100 dark:border-emerald-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xs">🟢</div>
                                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">{t('classicBottom')}</span>
                                </div>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                                    {t('classicBottomDesc')}
                                </p>
                                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600">{t('capitulationSignal')}</Badge>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs">📊</div>
                                    <span className="font-semibold text-blue-800 dark:text-blue-300">{t('smartMoneyAlign')}</span>
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                                    {t('smartMoneyAlignDesc')}
                                </p>
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">{t('rareSignal')}</Badge>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs">⚠️</div>
                                    <span className="font-semibold text-amber-800 dark:text-amber-300">{t('overcrowding')}</span>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                                    {t('overcrowdingDesc')}
                                </p>
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">{t('contrarianSetup')}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Educational Tip */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 shrink-0">
                    <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <div className="font-medium text-sm text-indigo-800 dark:text-indigo-300">{t('proTipDivergenceTrading')}</div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                        {t('proTipDivergenceTradingDesc')}
                    </p>
                </div>
            </div>
        </div>
    )
}
