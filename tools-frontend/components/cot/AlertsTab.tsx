"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { ExtremePositioningAlert } from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"

interface AlertsTabProps {
    alerts: ExtremePositioningAlert[]
}

export function AlertsTab({ alerts }: AlertsTabProps) {
    const t = useTranslations('cot')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('positionAlerts')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('extremePositioningContrarian')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <InterpretationGuideButton tabKey="alerts" />
                </div>
            </div>
            {alerts.length > 0 ? (
                <div className="space-y-4">
                    {alerts.map((alert, i) => (
                        <Card key={i} className="border-0 shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                            <CardHeader className="pb-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                                <CardTitle className="flex items-center gap-3 text-base">
                                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <span className="font-semibold">{alert.category}</span>
                                        <Badge className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
                                            {alert.extreme_type.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">{alert.historical_context}</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <div className="text-xs text-muted-foreground mb-1">{t('netPosition')}</div>
                                            <div className={`text-lg font-bold ${alert.net_position >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {formatNumber(alert.net_position, 0)}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <div className="text-xs text-muted-foreground mb-1">{t('percentile')}</div>
                                            <div className="text-lg font-bold text-amber-600">{alert.percentile.toFixed(0)}%</div>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <div className="text-xs text-muted-foreground mb-1">{t('deviation')}</div>
                                            <div className="text-lg font-bold text-purple-600">{alert.deviation_pct.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Lightbulb className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('suggestedActionLabel')}</span>
                                        </div>
                                        <p className="text-sm text-amber-700 dark:text-amber-400">{alert.suggested_action}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="py-6">
                            <div className="text-center text-muted-foreground mb-6">
                                <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">{t('noExtremeAlerts')}</p>
                                <p className="text-sm">{t('allCategoriesNormal')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configured Alert Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('configuredAlertTypes')}</CardTitle>
                            <CardDescription>{t('alertsWillTrigger')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        {t('extremeLongPositioning')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('extremeLongDesc')}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        {t('extremeShortPositioning')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('extremeShortDesc')}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        {t('squeezeRiskAlert')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('squeezeRiskDesc')}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        {t('smartMoneyDivergence')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('smartMoneyDivergenceDesc')}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        {t('overcrowdingWarning')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('overcrowdingWarningDesc')}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {t('significantWeeklyChange')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('significantWeeklyChangeDesc')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
