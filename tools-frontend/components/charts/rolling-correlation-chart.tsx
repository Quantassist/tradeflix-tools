"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { RollingCorrelationResponse } from "@/types"
import { useTranslations } from 'next-intl'

type RollingCorrelationChartProps = {
    data: RollingCorrelationResponse
}

export function RollingCorrelationChart({ data }: RollingCorrelationChartProps) {
    const t = useTranslations('correlation.rollingChart')
    const { data_points, current_correlation, avg_correlation, max_correlation, min_correlation } = data

    // Calculate chart dimensions
    const chartHeight = 200
    const chartWidth = 100 // percentage

    // Normalize correlation values to chart coordinates
    const normalizeY = (value: number) => {
        // Correlation ranges from -1 to 1, map to chart height
        return chartHeight - ((value + 1) / 2) * chartHeight
    }

    // Generate SVG path for the line chart
    const generatePath = () => {
        if (data_points.length === 0) return ""
        if (data_points.length === 1) return `M 0 ${normalizeY(data_points[0].correlation)}`

        const stepX = chartWidth / (data_points.length - 1)

        return data_points
            .map((point, index) => {
                const x = index * stepX
                const y = normalizeY(point.correlation)
                return `${index === 0 ? "M" : "L"} ${x} ${y}`
            })
            .join(" ")
    }

    // Detect regime changes (correlation crossing thresholds)
    const regimeChanges = data_points.reduce((changes, point, index) => {
        if (index === 0) return changes
        const prev = data_points[index - 1]

        // Check for crossing 0.7 or -0.7 thresholds
        if ((prev.correlation < 0.7 && point.correlation >= 0.7) ||
            (prev.correlation >= 0.7 && point.correlation < 0.7) ||
            (prev.correlation > -0.7 && point.correlation <= -0.7) ||
            (prev.correlation <= -0.7 && point.correlation > -0.7)) {
            changes.push({ index, date: point.date, correlation: point.correlation })
        }
        return changes
    }, [] as { index: number; date: string; correlation: number }[])

    // Determine current regime
    const getRegimeColor = (corr: number) => {
        if (corr > 0.7) return "text-green-600 bg-green-100"
        if (corr > 0.3) return "text-blue-600 bg-blue-100"
        if (corr > -0.3) return "text-gray-600 bg-gray-100"
        if (corr > -0.7) return "text-orange-600 bg-orange-100"
        return "text-red-600 bg-red-100"
    }

    const getRegimeLabel = (corr: number) => {
        if (corr > 0.7) return t('strongPositive')
        if (corr > 0.3) return t('moderatePositive')
        if (corr > -0.3) return t('weakNeutral')
        if (corr > -0.7) return t('moderateNegative')
        return t('strongNegative')
    }

    // Calculate volatility of correlation
    const correlationVolatility = Math.abs(max_correlation - min_correlation)
    const isVolatile = correlationVolatility > 0.5

    return (
        <Card className="shadow-xl border-2">
            <CardHeader className="bg-linear-to-r from-purple-50 via-violet-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Activity className="h-6 w-6 text-purple-600" />
                            {t('title')}: {data.asset1} vs {data.asset2}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                            {data.window_days}-{t('description')} {data.period_days} {t('days')}
                        </CardDescription>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white px-4 py-2 rounded-lg border-2 border-purple-200">
                            <p className="text-xs text-muted-foreground">{t('current')}</p>
                            <p className={`text-xl font-bold ${current_correlation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {current_correlation > 0 ? '+' : ''}{formatNumber(current_correlation, 3)}
                            </p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-200">
                            <p className="text-xs text-muted-foreground">{t('average')}</p>
                            <p className="text-xl font-bold text-blue-600">{formatNumber(avg_correlation, 3)}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">{t('max')}</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">{formatNumber(max_correlation, 3)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-muted-foreground">{t('min')}</span>
                        </div>
                        <p className="text-lg font-bold text-red-700">{formatNumber(min_correlation, 3)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-muted-foreground">{t('range')}</span>
                        </div>
                        <p className="text-lg font-bold text-purple-700">{formatNumber(correlationVolatility, 3)}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${getRegimeColor(current_correlation)}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs">{t('currentRegime')}</span>
                        </div>
                        <p className="text-lg font-bold">{getRegimeLabel(current_correlation)}</p>
                    </div>
                </div>

                {/* Chart with Legend */}
                <div className="relative bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    {/* Chart Legend */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-green-500"></div>
                                <span className="text-green-600">{t('strongPositiveThreshold')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-gray-400"></div>
                                <span className="text-gray-600">{t('neutral')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-red-500"></div>
                                <span className="text-red-600">{t('strongNegativeThreshold')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Container with Y-axis labels on left */}
                    <div className="flex">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between h-48 pr-2 text-xs font-medium w-10">
                            <span className="text-gray-500">+1.0</span>
                            <span className="text-green-600">+0.7</span>
                            <span className="text-gray-600">0</span>
                            <span className="text-red-600">-0.7</span>
                            <span className="text-gray-500">-1.0</span>
                        </div>

                        {/* SVG Chart */}
                        <div className="flex-1 relative">
                            <svg
                                viewBox={`0 0 100 ${chartHeight}`}
                                className="w-full h-48"
                                preserveAspectRatio="none"
                            >
                                {/* Background zones */}
                                <rect x="0" y={normalizeY(1)} width="100" height={normalizeY(0.7) - normalizeY(1)} fill="#dcfce7" fillOpacity="0.3" />
                                <rect x="0" y={normalizeY(-0.7)} width="100" height={normalizeY(-1) - normalizeY(-0.7)} fill="#fee2e2" fillOpacity="0.3" />

                                {/* Grid lines */}
                                <line x1="0" y1={normalizeY(1)} x2="100" y2={normalizeY(1)} stroke="#e5e7eb" strokeWidth="0.5" />
                                <line x1="0" y1={normalizeY(0.7)} x2="100" y2={normalizeY(0.7)} stroke="#22c55e" strokeWidth="0.5" strokeDasharray="4,4" />
                                <line x1="0" y1={normalizeY(0)} x2="100" y2={normalizeY(0)} stroke="#6b7280" strokeWidth="1" />
                                <line x1="0" y1={normalizeY(-0.7)} x2="100" y2={normalizeY(-0.7)} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4,4" />
                                <line x1="0" y1={normalizeY(-1)} x2="100" y2={normalizeY(-1)} stroke="#e5e7eb" strokeWidth="0.5" />

                                {/* Correlation line */}
                                <path
                                    d={generatePath()}
                                    fill="none"
                                    stroke="url(#correlationGradient)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient id="correlationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    {/* X-axis label */}
                    <div className="text-center text-xs text-gray-500 mt-2">
                        {t('timePeriod')} ({data.period_days} {t('days')}) →
                    </div>
                </div>

                {/* Regime Changes Alert */}
                {regimeChanges.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <h5 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {t('regimeChangesDetected')} ({regimeChanges.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {regimeChanges.slice(-5).map((change, idx) => (
                                <Badge key={idx} variant="outline" className="bg-amber-100">
                                    {change.date}: {formatNumber(change.correlation, 2)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Volatility Warning */}
                {isVolatile && (
                    <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                        <h5 className="font-semibold text-sm text-orange-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {t('highCorrelationVolatility')}
                        </h5>
                        <p className="text-xs text-orange-800 mt-1">
                            {t('volatilityWarning')} {formatNumber(correlationVolatility, 2)}{t('volatilityWarningEnd')}
                        </p>
                    </div>
                )}

                {/* Interpretation */}
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h5 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('interpretation')}
                    </h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li>• <strong>{t('currentVsAverage')}</strong> {current_correlation > avg_correlation ? t('above') : t('below')} {t('historicalAverageBy')} {formatNumber(Math.abs(current_correlation - avg_correlation), 3)}</li>
                        <li>• <strong>{t('stability')}</strong> {isVolatile ? t('unstableRelationship') : t('stableRelationship')}</li>
                        <li>• <strong>{t('regime')}</strong> {t('currentlyIn')} {getRegimeLabel(current_correlation).toLowerCase()} {t('correlationRegime')}</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
