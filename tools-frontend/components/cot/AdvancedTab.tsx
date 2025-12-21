"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, Globe, AlertTriangle, TrendingUp, TrendingDown, Activity, RefreshCw, Sparkles, Users, BarChart3, Gauge, Target, Building2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'
import type {
    FlowDecompositionResponse,
    ConcentrationResponse,
    SqueezeRiskResponse,
    AdvancedCOTSummary,
    CurveAnalysisResponse,
    SpreadAnalysisResponse,
    HerdingAnalysisResponse,
    CrossMarketPressureResponse,
    VolatilityAnalysisResponse,
    MLRegimeAnalysisResponse
} from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"
import { HelpButton } from "./HelpButton"

interface AdvancedTabProps {
    loadingAdvanced: boolean
    advancedSummary: AdvancedCOTSummary | null
    flowData: FlowDecompositionResponse | null
    squeezeData: SqueezeRiskResponse | null
    concentrationData: ConcentrationResponse | null
    curveData: CurveAnalysisResponse | null
    spreadData: SpreadAnalysisResponse | null
    herdingData: HerdingAnalysisResponse | null
    crossMarketData: CrossMarketPressureResponse | null
    volatilityData: VolatilityAnalysisResponse | null
    mlRegimeData: MLRegimeAnalysisResponse | null
}

export function AdvancedTab({
    loadingAdvanced,
    advancedSummary,
    flowData,
    squeezeData,
    concentrationData,
    curveData,
    spreadData,
    herdingData,
    crossMarketData,
    volatilityData,
    mlRegimeData
}: AdvancedTabProps) {
    const t = useTranslations('cot')

    if (loadingAdvanced) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-medium text-foreground">{t('loadingAdvancedAnalytics')}</p>
                    <p className="text-sm text-muted-foreground">{t('analyzingSqueezeRisk')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('advancedAnalytics')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('squeezeRiskFlowML')}
                    </p>
                </div>
                <InterpretationGuideButton tabKey="advanced" />
            </div>

            {advancedSummary ? (
                <>
                    {/* Summary Cards - Modern Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Crowding Score */}
                        <div className={`relative overflow-hidden rounded-xl p-4 border ${advancedSummary.crowding_score > 60
                            ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'
                            : advancedSummary.crowding_score > 40
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800'
                                : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className={`h-4 w-4 ${advancedSummary.crowding_score > 60 ? 'text-red-600' : advancedSummary.crowding_score > 40 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <span className="text-xs font-medium text-muted-foreground">{t('crowding')}</span>
                            </div>
                            <div className="text-3xl font-bold">{advancedSummary.crowding_score.toFixed(0)}</div>
                            <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${advancedSummary.crowding_score > 60 ? 'bg-red-500' : advancedSummary.crowding_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${advancedSummary.crowding_score}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {advancedSummary.crowding_score > 60 ? t('highRisk') : advancedSummary.crowding_score > 40 ? t('moderate') : t('lowRisk')}
                            </p>
                        </div>

                        {/* Squeeze Risk */}
                        <div className={`relative overflow-hidden rounded-xl p-4 border ${advancedSummary.squeeze_risk_score > 60
                            ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'
                            : advancedSummary.squeeze_risk_score > 40
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800'
                                : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className={`h-4 w-4 ${advancedSummary.squeeze_risk_score > 60 ? 'text-red-600' : advancedSummary.squeeze_risk_score > 40 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <span className="text-xs font-medium text-muted-foreground">{t('squeezeRisk')}</span>
                            </div>
                            <div className="text-3xl font-bold">{advancedSummary.squeeze_risk_score.toFixed(0)}</div>
                            <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${advancedSummary.squeeze_risk_score > 60 ? 'bg-red-500' : advancedSummary.squeeze_risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${advancedSummary.squeeze_risk_score}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {advancedSummary.squeeze_risk_score > 60 ? t('vulnerable') : advancedSummary.squeeze_risk_score > 40 ? t('moderate') : t('stable')}
                            </p>
                        </div>

                        {/* Flow Momentum */}
                        <div className="relative overflow-hidden rounded-xl p-4 border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-muted-foreground">{t('flowMomentum')}</span>
                            </div>
                            <div className="text-3xl font-bold">{advancedSummary.flow_momentum_score.toFixed(0)}</div>
                            <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${advancedSummary.flow_momentum_score}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {advancedSummary.flow_momentum_score > 60 ? t('strong') : advancedSummary.flow_momentum_score > 40 ? t('moderate') : t('weak')}
                            </p>
                        </div>

                        {/* Current Regime */}
                        <div className="relative overflow-hidden rounded-xl p-4 border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full -mr-8 -mt-8" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="h-4 w-4 text-violet-600" />
                                    <span className="text-xs font-medium text-muted-foreground">{t('regime')}</span>
                                </div>
                                <div className="text-lg font-bold capitalize text-violet-700 dark:text-violet-300">
                                    {advancedSummary.current_regime.replace('_', ' ')}
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="text-xs text-muted-foreground">{t('confidence')}:</span>
                                    <span className="text-xs font-bold">{advancedSummary.regime_confidence.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {advancedSummary.alerts.length > 0 && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 overflow-hidden">
                            <div className="px-4 py-3 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800 dark:text-amber-300">{t('activeAlerts')} ({advancedSummary.alerts.length})</span>
                            </div>
                            <div className="p-3 space-y-2">
                                {advancedSummary.alerts.map((alert, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2.5 bg-white/60 dark:bg-black/20 rounded-lg text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <span className="text-amber-900 dark:text-amber-200">{alert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Primary Insight Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <span className="font-semibold">{t('primaryInsight')}</span>
                            </div>
                            <p className="text-lg font-medium mb-4">{advancedSummary.primary_insight}</p>
                            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <div className="text-xs opacity-80 mb-1">{t('suggestedAction')}</div>
                                <p className="font-medium">{advancedSummary.suggested_action}</p>
                            </div>
                        </div>
                    </div>

                    {/* Squeeze Risk Details */}
                    {squeezeData && (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Long Squeeze Risk */}
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/10">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{t('longSqueezeRisk')}</CardTitle>
                                                <CardDescription className="text-xs">{t('forcedLongLiquidation')}</CardDescription>
                                            </div>
                                        </div>
                                        <HelpButton helpKey="squeezeRisk" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-bold">{squeezeData.long_squeeze_risk.risk_score.toFixed(0)}</div>
                                        <Badge className={`${squeezeData.long_squeeze_risk.risk_level === 'extreme' ? 'bg-red-600' :
                                            squeezeData.long_squeeze_risk.risk_level === 'high' ? 'bg-orange-600' :
                                                squeezeData.long_squeeze_risk.risk_level === 'moderate' ? 'bg-amber-600' : 'bg-emerald-600'
                                            } text-white`}>
                                            {squeezeData.long_squeeze_risk.risk_level.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${squeezeData.long_squeeze_risk.risk_score > 60 ? 'bg-red-500' :
                                                squeezeData.long_squeeze_risk.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${squeezeData.long_squeeze_risk.risk_score}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                            <div className="text-xs text-muted-foreground">{t('specFactor')}</div>
                                            <div className="text-sm font-semibold">{(squeezeData.long_squeeze_risk.spec_positioning_factor * 100).toFixed(0)}%</div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                            <div className="text-xs text-muted-foreground">{t('concentration')}</div>
                                            <div className="text-sm font-semibold">{(squeezeData.long_squeeze_risk.concentration_factor * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{squeezeData.long_squeeze_risk.interpretation}</p>
                                </CardContent>
                            </Card>

                            {/* Short Squeeze Risk */}
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/10">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{t('shortSqueezeRisk')}</CardTitle>
                                                <CardDescription className="text-xs">{t('forcedShortCovering')}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-bold">{squeezeData.short_squeeze_risk.risk_score.toFixed(0)}</div>
                                        <Badge className={`${squeezeData.short_squeeze_risk.risk_level === 'extreme' ? 'bg-red-600' :
                                            squeezeData.short_squeeze_risk.risk_level === 'high' ? 'bg-orange-600' :
                                                squeezeData.short_squeeze_risk.risk_level === 'moderate' ? 'bg-amber-600' : 'bg-emerald-600'
                                            } text-white`}>
                                            {squeezeData.short_squeeze_risk.risk_level.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${squeezeData.short_squeeze_risk.risk_score > 60 ? 'bg-red-500' :
                                                squeezeData.short_squeeze_risk.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${squeezeData.short_squeeze_risk.risk_score}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                            <div className="text-xs text-muted-foreground">{t('specFactor')}</div>
                                            <div className="text-sm font-semibold">{(squeezeData.short_squeeze_risk.spec_positioning_factor * 100).toFixed(0)}%</div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/20">
                                            <div className="text-xs text-muted-foreground">{t('concentration')}</div>
                                            <div className="text-sm font-semibold">{(squeezeData.short_squeeze_risk.concentration_factor * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{squeezeData.short_squeeze_risk.interpretation}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Flow Decomposition */}
                    {flowData && flowData.current_week && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        {t('flowDecomposition')}
                                    </div>
                                    <HelpButton helpKey="flowDecomposition" />
                                </CardTitle>
                                <CardDescription>{flowData.summary}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Managed Money Flows */}
                                    <div className="p-4 rounded-lg border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-orange-600" />
                                                <span className="font-medium">{t('managedMoney')}</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {flowData.current_week.managed_money.dominant_flow.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('newLongs')}</div>
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(flowData.current_week.managed_money.new_longs, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                                                <div className="text-xs text-red-600 dark:text-red-400">{t('longLiquidationLabel')}</div>
                                                <div className="font-bold text-red-700 dark:text-red-300">{formatNumber(flowData.current_week.managed_money.long_liquidation, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                                                <div className="text-xs text-red-600 dark:text-red-400">{t('newShorts')}</div>
                                                <div className="font-bold text-red-700 dark:text-red-300">{formatNumber(flowData.current_week.managed_money.new_shorts, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('shortCoveringLabel')}</div>
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(flowData.current_week.managed_money.short_covering, 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commercial Flows */}
                                    <div className="p-4 rounded-lg border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium">{t('commercials')}</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {flowData.current_week.producer_merchant.dominant_flow.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('newLongs')}</div>
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(flowData.current_week.producer_merchant.new_longs, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                                                <div className="text-xs text-red-600 dark:text-red-400">{t('longLiquidationLabel')}</div>
                                                <div className="font-bold text-red-700 dark:text-red-300">{formatNumber(flowData.current_week.producer_merchant.long_liquidation, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                                                <div className="text-xs text-red-600 dark:text-red-400">{t('newShorts')}</div>
                                                <div className="font-bold text-red-700 dark:text-red-300">{formatNumber(flowData.current_week.producer_merchant.new_shorts, 0)}</div>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('shortCoveringLabel')}</div>
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(flowData.current_week.producer_merchant.short_covering, 0)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Concentration Analysis */}
                    {concentrationData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-purple-600" />
                                        {t('concentrationAnalysis')}
                                    </div>
                                    <HelpButton helpKey="concentration" />
                                </CardTitle>
                                <CardDescription>{concentrationData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-4 rounded-lg border">
                                        <div className="font-medium mb-2">{t('longSideConcentration')}</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{t('top4Traders')}</span>
                                                <span className="font-mono">{concentrationData.long_concentration.top_4_gross.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>{t('top8Traders')}</span>
                                                <span className="font-mono">{concentrationData.long_concentration.top_8_gross.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>{t('concentrationRatio')}</span>
                                                <span className="font-mono">{concentrationData.long_concentration.concentration_ratio.toFixed(2)}</span>
                                            </div>
                                            {concentrationData.long_concentration.is_concentrated && (
                                                <Badge variant="destructive" className="mt-2">{t('highlyConcentrated')}</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border">
                                        <div className="font-medium mb-2">{t('shortSideConcentration')}</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{t('top4Traders')}</span>
                                                <span className="font-mono">{concentrationData.short_concentration.top_4_gross.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>{t('top8Traders')}</span>
                                                <span className="font-mono">{concentrationData.short_concentration.top_8_gross.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>{t('concentrationRatio')}</span>
                                                <span className="font-mono">{concentrationData.short_concentration.concentration_ratio.toFixed(2)}</span>
                                            </div>
                                            {concentrationData.short_concentration.is_concentrated && (
                                                <Badge variant="destructive" className="mt-2">{t('highlyConcentrated')}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">{concentrationData.historical_context}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 2: Curve Structure Analysis */}
                    {curveData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                                        {t('curveStructureAnalysis')}
                                    </div>
                                    <HelpButton helpKey="curveAnalysis" />
                                </CardTitle>
                                <CardDescription>{curveData.curve_summary}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3 mb-4">
                                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                                        <div className="text-xs text-indigo-600">{t('frontMonthOI')}</div>
                                        <div className="text-xl font-bold">{formatNumber(curveData.front_oi, 0)}</div>
                                        <div className="text-sm text-indigo-700">{curveData.front_oi_pct.toFixed(1)}% {t('ofTotal')}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                                        <div className="text-xs text-purple-600">{t('backMonthOI')}</div>
                                        <div className="text-xl font-bold">{formatNumber(curveData.back_oi, 0)}</div>
                                        <div className="text-sm text-purple-700">{(100 - curveData.front_oi_pct).toFixed(1)}% of total</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${curveData.roll_stress_level === 'critical' ? 'bg-red-50 border-red-200' : curveData.roll_stress_level === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                        <div className="text-xs">{t('rollStress')}</div>
                                        <div className="text-xl font-bold">{curveData.roll_stress_score.toFixed(0)}/100</div>
                                        <div className="text-sm capitalize">{curveData.roll_stress_level}</div>
                                    </div>
                                </div>
                                {curveData.roll_warning && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                                        <span className="text-amber-800 text-sm">⚠️ {curveData.roll_warning}</span>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {curveData.positioning.map((pos, i) => (
                                        <div key={i} className="p-3 rounded-lg border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">{pos.category}</span>
                                                <Badge variant={pos.curve_bias === 'front_heavy' ? 'default' : pos.curve_bias === 'back_heavy' ? 'secondary' : 'outline'}>
                                                    {pos.curve_bias.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>{t('frontNet')}: <span className={pos.front_net >= 0 ? 'text-green-600' : 'text-red-600'}>{formatNumber(pos.front_net, 0)}</span></div>
                                                <div>{t('backNet')}: <span className={pos.back_net >= 0 ? 'text-green-600' : 'text-red-600'}>{formatNumber(pos.back_net, 0)}</span></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{pos.interpretation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 2: Spread vs Directional Analysis */}
                    {spreadData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-cyan-600" />
                                        {t('spreadVsDirectional')}
                                    </div>
                                    <HelpButton helpKey="spreadAnalysis" />
                                </CardTitle>
                                <CardDescription>{spreadData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3 mb-4">
                                    <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                                        <div className="text-xs text-cyan-600">{t('marketMode')}</div>
                                        <div className="text-lg font-bold capitalize">{spreadData.market_mode.replace('_', ' ')}</div>
                                        <div className="text-sm text-cyan-700">{spreadData.mode_strength} strength</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="text-xs text-blue-600">{t('spreadRatio')}</div>
                                        <div className="text-xl font-bold">{spreadData.market_spread_ratio.toFixed(1)}%</div>
                                        <div className="text-sm text-blue-700">{t('ofTotalPositions')}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">{t('wowChange')}</div>
                                        <div className="text-sm">
                                            <span className={spreadData.spread_change_wow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {t('spread')}: {spreadData.spread_change_wow >= 0 ? '+' : ''}{formatNumber(spreadData.spread_change_wow, 0)}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className={spreadData.directional_change_wow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {t('directional')}: {spreadData.directional_change_wow >= 0 ? '+' : ''}{formatNumber(spreadData.directional_change_wow, 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {spreadData.breakdown.map((item, i) => (
                                        <div key={i} className="p-3 rounded-lg border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">{item.category}</span>
                                                <Badge variant={item.exposure_type === 'spread_dominant' ? 'secondary' : item.exposure_type === 'directional_dominant' ? 'default' : 'outline'}>
                                                    {item.exposure_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-4 text-sm mb-1">
                                                <div>Spread: <span className="font-mono">{item.spread_pct_of_total.toFixed(0)}%</span></div>
                                                <div>Directional: <span className="font-mono">{item.directional_pct_of_total.toFixed(0)}%</span></div>
                                            </div>
                                            <Progress value={item.spread_pct_of_total} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">{item.interpretation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 2: Herding Analysis */}
                    {herdingData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-amber-600" />
                                        {t('herdingMarketStructure')}
                                    </div>
                                    <HelpButton helpKey="herdingAnalysis" />
                                </CardTitle>
                                <CardDescription>{herdingData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {herdingData.herding_alert && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                                        <span className="text-amber-800 text-sm">{herdingData.herding_alert}</span>
                                    </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-3 mb-4">
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                        <div className="text-xs text-amber-600">{t('herdingScore')}</div>
                                        <div className="text-xl font-bold">{herdingData.overall_herding_score.toFixed(0)}/100</div>
                                        <Progress value={herdingData.overall_herding_score} className="h-2 mt-1" />
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                                        <div className="text-xs text-purple-600">{t('marketStructure')}</div>
                                        <div className="text-lg font-bold capitalize">{herdingData.overall_herding_type.replace('_', ' ')}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${herdingData.divergence_detected ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="text-xs">{t('smartMoneyVsCrowd')}</div>
                                        <div className="text-sm">
                                            <span className="capitalize">Smart: {herdingData.smart_money_direction}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="capitalize">Crowd: {herdingData.crowd_direction}</span>
                                        </div>
                                        {herdingData.divergence_detected && (
                                            <Badge variant="outline" className="mt-1 text-yellow-700 border-yellow-400">Divergence!</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {herdingData.categories.map((cat, i) => (
                                        <div key={i} className="p-3 rounded-lg border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">{cat.category}</span>
                                                <Badge variant={cat.herding_type === 'capitulation' ? 'destructive' : cat.herding_type === 'oligopoly' ? 'secondary' : 'outline'}>
                                                    {cat.herding_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                                <div>Long Traders: <span className="font-mono">{cat.traders_long}</span></div>
                                                <div>Short Traders: <span className="font-mono">{cat.traders_short}</span></div>
                                                <div>L/S Ratio: <span className="font-mono">{cat.long_short_trader_ratio.toFixed(2)}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-muted-foreground">Herding Intensity:</span>
                                                <Progress value={cat.herding_intensity} className="h-2 flex-1" />
                                                <span className="text-xs font-mono">{cat.herding_intensity.toFixed(0)}%</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{cat.interpretation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 3: ML Regime Classification */}
                    {mlRegimeData && (
                        <Card className="border-2 border-violet-200">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-violet-600" />
                                        {t('mlRegimeAnalysis')}
                                    </div>
                                    <HelpButton helpKey="mlRegime" />
                                </CardTitle>
                                <CardDescription>{mlRegimeData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3 mb-4">
                                    <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                                        <div className="text-xs text-violet-600 mb-1">{t('currentRegime')}</div>
                                        <div className="text-lg font-bold capitalize">{mlRegimeData.current_regime.primary_regime.replace('_', ' ')}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={mlRegimeData.current_regime.primary_confidence} className="h-2 flex-1" />
                                            <span className="text-xs font-mono">{mlRegimeData.current_regime.primary_confidence.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="text-xs text-blue-600 mb-1">Duration</div>
                                        <div className="text-xl font-bold">{mlRegimeData.regime_duration_current} weeks</div>
                                        <div className="text-sm text-blue-700">Typical: {mlRegimeData.current_regime.typical_duration_weeks} weeks</div>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${mlRegimeData.current_regime.risk_level === 'high' ? 'bg-red-50 border-red-200' : mlRegimeData.current_regime.risk_level === 'moderate' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                                        <div className="text-xs mb-1">Risk Level</div>
                                        <div className="text-lg font-bold capitalize">{mlRegimeData.current_regime.risk_level}</div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 mb-4">
                                    <div className="p-3 rounded-lg border">
                                        <div className="font-medium mb-2">Regime Description</div>
                                        <p className="text-sm text-muted-foreground">{mlRegimeData.current_regime.regime_description}</p>
                                        <p className="text-sm mt-2"><strong>Typical Outcome:</strong> {mlRegimeData.current_regime.typical_outcome}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-green-50">
                                        <div className="font-medium mb-2 text-green-800">Suggested Strategy</div>
                                        <p className="text-sm text-green-700">{mlRegimeData.current_regime.suggested_strategy}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-3 rounded-lg border">
                                        <div className="font-medium mb-2">Top Features</div>
                                        <div className="space-y-2">
                                            {mlRegimeData.current_regime.top_features.slice(0, 4).map((feat, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="text-xs w-32 truncate">{feat.feature.replace(/_/g, ' ')}</span>
                                                    <Progress value={feat.importance * 100} className="h-2 flex-1" />
                                                    <span className="text-xs font-mono w-12">{feat.value.toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg border">
                                        <div className="font-medium mb-2">Likely Next Regimes</div>
                                        <div className="space-y-2">
                                            {mlRegimeData.current_regime.likely_next_regimes.map((trans, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span className="text-sm capitalize">{trans.regime.replace('_', ' ')}</span>
                                                    <Badge variant="outline">{(trans.probability * 100).toFixed(0)}%</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 3: Volatility Regime */}
                    {volatilityData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-orange-600" />
                                        {t('volatilityAnalysis')}
                                    </div>
                                    <HelpButton helpKey="volatilityRegime" />
                                </CardTitle>
                                <CardDescription>{volatilityData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {volatilityData.vol_alert && (
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                                        <span className="text-orange-800 text-sm">{volatilityData.vol_alert}</span>
                                    </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-4 mb-4">
                                    <div className={`p-3 rounded-lg border ${volatilityData.current_metrics.implied_vol_regime === 'high' ? 'bg-red-50 border-red-200' : volatilityData.current_metrics.implied_vol_regime === 'elevated' ? 'bg-orange-50 border-orange-200' : volatilityData.current_metrics.implied_vol_regime === 'low' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="text-xs">Vol Regime</div>
                                        <div className="text-lg font-bold capitalize">{volatilityData.current_metrics.implied_vol_regime}</div>
                                        <div className="text-sm">{volatilityData.current_metrics.vol_regime_score.toFixed(0)}/100</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">Gross Positions</div>
                                        <div className="text-lg font-bold">{formatNumber(volatilityData.current_metrics.gross_positions, 0)}</div>
                                        <div className="text-sm">P{volatilityData.current_metrics.gross_positions_percentile.toFixed(0)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">Spread Ratio</div>
                                        <div className="text-lg font-bold">{volatilityData.current_metrics.spread_ratio.toFixed(1)}%</div>
                                        <div className="text-sm">P{volatilityData.current_metrics.spread_ratio_percentile.toFixed(0)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">Vol Skew</div>
                                        <div className="text-lg font-bold capitalize">{volatilityData.current_metrics.vol_skew.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={volatilityData.vol_regime_history.slice().reverse()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority 3: Cross-Market Pressure */}
                    {crossMarketData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-teal-600" />
                                        {t('crossMarketPressure')}
                                    </div>
                                    <HelpButton helpKey="crossMarket" />
                                </CardTitle>
                                <CardDescription>{crossMarketData.interpretation}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3 mb-4">
                                    <div className={`p-3 rounded-lg border ${crossMarketData.market_sentiment === 'risk_on' ? 'bg-green-50 border-green-200' : crossMarketData.market_sentiment === 'risk_off' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="text-xs">Market Sentiment</div>
                                        <div className="text-lg font-bold capitalize">{crossMarketData.market_sentiment.replace('_', ' ')}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">Commodities Analyzed</div>
                                        <div className="text-xl font-bold">{crossMarketData.commodities_analyzed}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="text-xs text-slate-600">Avg Spec Pressure</div>
                                        <div className="text-xl font-bold">{crossMarketData.avg_spec_pressure.toFixed(1)}%</div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 mb-4">
                                    <div className="p-3 rounded-lg border">
                                        <div className="font-medium mb-2 text-green-700">Most Crowded Long</div>
                                        <div className="space-y-2">
                                            {crossMarketData.most_crowded_long.slice(0, 3).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="truncate max-w-[150px]">{item.commodity}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-green-700">P{item.spec_pressure_percentile.toFixed(0)}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg border">
                                        <div className="font-medium mb-2 text-red-700">Most Crowded Short</div>
                                        <div className="space-y-2">
                                            {crossMarketData.most_crowded_short.slice(0, 3).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="truncate max-w-[150px]">{item.commodity}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-red-700">P{item.spec_pressure_percentile.toFixed(0)}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {(crossMarketData.rotation_into.length > 0 || crossMarketData.rotation_out_of.length > 0) && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {crossMarketData.rotation_into.length > 0 && (
                                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                                <div className="font-medium mb-1 text-green-800">Rotation Into</div>
                                                <div className="text-sm text-green-700">{crossMarketData.rotation_into.join(', ')}</div>
                                            </div>
                                        )}
                                        {crossMarketData.rotation_out_of.length > 0 && (
                                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                                <div className="font-medium mb-1 text-red-800">Rotation Out Of</div>
                                                <div className="text-sm text-red-700">{crossMarketData.rotation_out_of.join(', ')}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <Gauge className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>{t('runAnalysisAdvanced')}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
