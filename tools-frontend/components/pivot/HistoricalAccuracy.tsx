"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, RefreshCw, Trophy, TrendingUp, Info, BookOpen, Target, CheckCircle2, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { pivotApi } from "@/lib/api/pivot"
import type { PivotAccuracyResponse } from "@/types"
import { toast } from "sonner"

export function HistoricalAccuracy() {
    const t = useTranslations('pivot.historicalAccuracy')
    const tSymbols = useTranslations('pivot.symbols')
    const [loading, setLoading] = useState(false)
    const [symbol, setSymbol] = useState("GOLD")
    const [timeframe, setTimeframe] = useState("daily")
    const [days, setDays] = useState("30")
    const [exchange, setExchange] = useState("COMEX")
    const [data, setData] = useState<PivotAccuracyResponse | null>(null)

    const handleFetch = async () => {
        setLoading(true)
        try {
            const response = await pivotApi.getHistorical(symbol, timeframe, parseInt(days), exchange)
            setData(response)
            toast.success(`Fetched real accuracy data for ${symbol} from ${exchange}`)
        } catch (error) {
            console.error("Error fetching historical accuracy:", error)
            toast.error("Failed to fetch accuracy data. Check if API credentials are configured.")
        } finally {
            setLoading(false)
        }
    }

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return "text-green-600 bg-green-50"
        if (accuracy >= 70) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
    }

    const getAccuracyBadge = (accuracy: number) => {
        if (accuracy >= 80) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>
        if (accuracy >= 70) return <Badge className="bg-yellow-100 text-yellow-700">Good</Badge>
        return <Badge className="bg-red-100 text-red-700">Fair</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <StyledCard variant="orange">
                <StyledCardHeader
                    icon={BarChart3}
                    title={t('title')}
                    description={t('description')}
                    variant="orange"
                    action={
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {t('understandingAccuracy')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="p-2 bg-linear-to-br from-orange-500 to-amber-600 rounded-lg text-white">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                        {t('guideTitle')}
                                    </DialogTitle>
                                    <DialogDescription>{t('guideDescription')}</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 mt-4">
                                    {/* What is Respected */}
                                    <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 border">
                                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-slate-600" />
                                            {t('whatRespectedMean')}
                                        </h4>
                                        <p className="text-sm text-slate-600 mb-3">
                                            {t('respectedExplanation')}
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span className="text-green-700">{t('respectedLabel')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-red-700">{t('notRespectedLabel')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accuracy Ratings */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 border border-green-100 text-center">
                                            <div className="text-3xl font-bold text-green-600 mb-1">80%+</div>
                                            <Badge className="bg-green-100 text-green-700">{t('excellent')}</Badge>
                                            <p className="text-xs text-green-600 mt-2">{t('highReliability')}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-yellow-50 to-amber-50 border border-yellow-100 text-center">
                                            <div className="text-3xl font-bold text-yellow-600 mb-1">70-79%</div>
                                            <Badge className="bg-yellow-100 text-yellow-700">{t('good')}</Badge>
                                            <p className="text-xs text-yellow-600 mt-2">{t('moderateReliability')}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-linear-to-br from-red-50 to-orange-50 border border-red-100 text-center">
                                            <div className="text-3xl font-bold text-red-600 mb-1">&lt;70%</div>
                                            <Badge className="bg-red-100 text-red-700">{t('fair')}</Badge>
                                            <p className="text-xs text-red-600 mt-2">{t('useWithCaution')}</p>
                                        </div>
                                    </div>

                                    {/* CPR Types */}
                                    <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            {t('cprWidthCategories')}
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-blue-700">{t('narrow')}</div>
                                                <p className="text-xs text-slate-600">{t('expectTrendingDay')}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-purple-700">{t('normal')}</div>
                                                <p className="text-xs text-slate-600">{t('balancedDay')}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border">
                                                <div className="font-semibold text-orange-700">{t('wide')}</div>
                                                <p className="text-xs text-slate-600">{t('rangeBoundDay')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    }
                />
                <StyledCardContent>
                    {/* Controls Row */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">{t('exchange')}</label>
                            <Select value={exchange} onValueChange={setExchange}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COMEX">COMEX</SelectItem>
                                    <SelectItem value="MCX">MCX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">{t('symbol')}</label>
                            <Select value={symbol} onValueChange={setSymbol}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GOLD">{tSymbols('gold')}</SelectItem>
                                    <SelectItem value="SILVER">{tSymbols('silver')}</SelectItem>
                                    <SelectItem value="CRUDE">{tSymbols('crudeOil')}</SelectItem>
                                    <SelectItem value="COPPER">{tSymbols('copper')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">{t('timeframe')}</label>
                            <Select value={timeframe} onValueChange={setTimeframe}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">{t('daily')}</SelectItem>
                                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">{t('period')}</label>
                            <Select value={days} onValueChange={setDays}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">{t('days30')}</SelectItem>
                                    <SelectItem value="60">{t('days60')}</SelectItem>
                                    <SelectItem value="90">{t('days90')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleFetch} disabled={loading} className="gap-2">
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {t('analyze')}
                        </Button>
                    </div>

                    {data ? (
                        <div className="space-y-4 mt-4">
                            {/* Best Performing Levels */}
                            < div className="p-3 rounded-lg bg-amber-50 border border-amber-200" >
                                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                                    <Trophy className="h-4 w-4" />
                                    {t('bestPerformingLevels')}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {data.best_performing_levels.map((level, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                            {idx + 1}. {level}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Level Accuracy Table */}
                            < div className="rounded-lg border overflow-hidden" >
                                <div className="bg-muted px-4 py-2 text-sm font-medium grid grid-cols-5 gap-2">
                                    <span>{t('level')}</span>
                                    <span className="text-center">{t('tested')}</span>
                                    <span className="text-center">{t('respected')}</span>
                                    <span className="text-center">{t('accuracy')}</span>
                                    <span className="text-center">{t('rating')}</span>
                                </div>
                                <div className="divide-y max-h-64 overflow-y-auto">
                                    {Object.entries(data.level_accuracy).map(([level, stats]) => (
                                        <div key={level} className="px-4 py-2 text-sm grid grid-cols-5 gap-2 items-center hover:bg-muted/50">
                                            <span className="font-medium">{level}</span>
                                            <span className="text-center text-muted-foreground">{stats.times_tested}</span>
                                            <span className="text-center text-muted-foreground">{stats.times_respected}</span>
                                            <span className={`text-center font-mono font-semibold rounded px-2 py-0.5 ${getAccuracyColor(stats.accuracy_percent)}`}>
                                                {stats.accuracy_percent.toFixed(1)}%
                                            </span>
                                            <span className="text-center">{getAccuracyBadge(stats.accuracy_percent)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div >

                            {/* CPR Statistics */}
                            < div className="grid grid-cols-3 gap-3" >
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{data.cpr_statistics.narrow_cpr_days}</div>
                                    <div className="text-xs text-blue-600">{t('narrowCprDays')}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.cpr_statistics.narrow_cpr_trending_accuracy}% {t('trendingAccuracy')}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{data.cpr_statistics.normal_cpr_days}</div>
                                    <div className="text-xs text-purple-600">{t('normalCprDays')}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{data.cpr_statistics.wide_cpr_days}</div>
                                    <div className="text-xs text-orange-600">{t('wideCprDays')}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.cpr_statistics.wide_cpr_range_accuracy}% {t('rangeAccuracy')}
                                    </div>
                                </div>
                            </div >

                            {/* Note */}
                            < div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground" >
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{data.notes}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>{t('selectParametersPrompt')}</p>
                        </div>
                    )}
                </StyledCardContent>
            </StyledCard>
        </div>
    )
}

export default HistoricalAccuracy
