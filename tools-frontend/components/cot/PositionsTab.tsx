"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Target, Briefcase, Users, Lightbulb } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { DisaggCOTAnalysisResponse } from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"

interface PositionsTabProps {
    result: DisaggCOTAnalysisResponse
}

export function PositionsTab({ result }: PositionsTabProps) {
    const t = useTranslations('cot')

    return (
        <div className="space-y-6">
            {/* Header with context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('positions')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('reportDate')}: <span className="font-medium text-foreground">{result.latest_report_date}</span>
                    </p>
                </div>
                <InterpretationGuideButton tabKey="positions" />
            </div>

            {/* Key Metrics Summary - Quick glance for new users */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-4 border border-orange-100 dark:border-orange-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-400">{t('speculators')}</span>
                    </div>
                    <div className={`text-xl font-bold ${result.current_positions.managed_money_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {result.current_positions.managed_money_net >= 0 ? "+" : ""}{formatNumber(result.current_positions.managed_money_net, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t('netPosition')}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{t('commercials')}</span>
                    </div>
                    <div className={`text-xl font-bold ${result.current_positions.producer_merchant_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {result.current_positions.producer_merchant_net >= 0 ? "+" : ""}{formatNumber(result.current_positions.producer_merchant_net, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t('netPosition')}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{t('openInterest')}</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {formatNumber(result.current_positions.open_interest, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t('totalContracts')}</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-900/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-400">{t('weeklyDelta')}</span>
                    </div>
                    <div className={`text-xl font-bold ${result.weekly_changes.change_open_interest >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {result.weekly_changes.change_open_interest >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_open_interest, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t('change')}</div>
                </div>
            </div>

            {/* Main Position Cards */}
            <div className="space-y-4">
                {/* Primary Traders - Most Important */}
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full" />
                        {t('keyMarketParticipants')}
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Managed Money - Highlighted */}
                        <Card className="relative overflow-hidden border-orange-200/50 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8" />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                                            <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">{t('managedMoney')}</CardTitle>
                                            <CardDescription className="text-xs">{t('hedgeFundsSpeculators')}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-0">
                                        {t('keyIndicator')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-1">{t('long')}</div>
                                        <div className="text-lg font-semibold text-emerald-600">{formatNumber(result.current_positions.managed_money_long, 0)}</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-1">{t('short')}</div>
                                        <div className="text-lg font-semibold text-red-600">{formatNumber(result.current_positions.managed_money_short, 0)}</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-orange-100/50 dark:bg-orange-900/30">
                                        <div className="text-xs text-muted-foreground mb-1">{t('net')}</div>
                                        <div className={`text-lg font-bold ${result.current_positions.managed_money_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatNumber(result.current_positions.managed_money_net, 0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-orange-100 dark:border-orange-900/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t('weeklyChange')}</span>
                                    <span className={`text-sm font-medium ${result.weekly_changes.change_m_money_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {result.weekly_changes.change_m_money_net >= 0 ? "↑" : "↓"} {result.weekly_changes.change_m_money_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_m_money_net, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Producer/Merchant */}
                        <Card className="relative overflow-hidden border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8" />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">{t('commercials')}</CardTitle>
                                            <CardDescription className="text-xs">{t('producersMerchantsHedgers')}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{t('smartMoney')}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-1">{t('long')}</div>
                                        <div className="text-lg font-semibold text-emerald-600">{formatNumber(result.current_positions.producer_merchant_long, 0)}</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-1">{t('short')}</div>
                                        <div className="text-lg font-semibold text-red-600">{formatNumber(result.current_positions.producer_merchant_short, 0)}</div>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/30">
                                        <div className="text-xs text-muted-foreground mb-1">{t('net')}</div>
                                        <div className={`text-lg font-bold ${result.current_positions.producer_merchant_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatNumber(result.current_positions.producer_merchant_net, 0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t('weeklyChange')}</span>
                                    <span className={`text-sm font-medium ${result.weekly_changes.change_prod_merc_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {result.weekly_changes.change_prod_merc_net >= 0 ? "↑" : "↓"} {result.weekly_changes.change_prod_merc_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_prod_merc_net, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Traders - Modern Design */}
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-slate-400 rounded-full" />
                        {t('otherMarketParticipants')}
                    </h4>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Swap Dealers */}
                        <Card className="relative overflow-hidden border-purple-200/50 dark:border-purple-800/50 bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-6 -mt-6" />
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                        <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{t('swapDealers')}</div>
                                        <div className="text-xs text-muted-foreground">{t('banksInstitutions')}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('long')}</div>
                                        <div className="text-base font-semibold text-emerald-600">{formatNumber(result.current_positions.swap_dealer_long, 0)}</div>
                                    </div>
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('short')}</div>
                                        <div className="text-base font-semibold text-red-600">{formatNumber(result.current_positions.swap_dealer_short, 0)}</div>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{t('netPosition')}</span>
                                        <span className={`text-lg font-bold ${result.current_positions.swap_dealer_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatNumber(result.current_positions.swap_dealer_net, 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t('weeklyDelta')}</span>
                                    <span className={`text-sm font-medium ${result.weekly_changes.change_swap_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {result.weekly_changes.change_swap_net >= 0 ? "↑" : "↓"} {result.weekly_changes.change_swap_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_swap_net, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Other Reportables */}
                        <Card className="relative overflow-hidden border-slate-200/50 dark:border-slate-700/50 bg-linear-to-br from-slate-50/50 to-transparent dark:from-slate-900/20">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/5 rounded-full -mr-6 -mt-6" />
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{t('otherReportables')}</div>
                                        <div className="text-xs text-muted-foreground">{t('propTradersFamilyOffices')}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('long')}</div>
                                        <div className="text-base font-semibold text-emerald-600">{formatNumber(result.current_positions.other_reportables_long, 0)}</div>
                                    </div>
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('short')}</div>
                                        <div className="text-base font-semibold text-red-600">{formatNumber(result.current_positions.other_reportables_short, 0)}</div>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('netPosition')}</span>
                                        <span className={`text-lg font-bold ${result.current_positions.other_reportables_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatNumber(result.current_positions.other_reportables_net, 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t('weeklyDelta')}</span>
                                    <span className={`text-sm font-medium ${result.weekly_changes.change_other_rept_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {result.weekly_changes.change_other_rept_net >= 0 ? "↑" : "↓"} {result.weekly_changes.change_other_rept_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_other_rept_net, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Non-Reportables */}
                        <Card className="relative overflow-hidden border-gray-200/50 dark:border-gray-700/50 bg-linear-to-br from-gray-50/50 to-transparent dark:from-gray-900/20">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/5 rounded-full -mr-6 -mt-6" />
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{t('nonReportables')}</div>
                                        <div className="text-xs text-muted-foreground">{t('smallRetailTraders')}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('long')}</div>
                                        <div className="text-base font-semibold text-emerald-600">{formatNumber(result.current_positions.non_reportables_long, 0)}</div>
                                    </div>
                                    <div className="text-center p-2.5 rounded-lg bg-white/60 dark:bg-black/20">
                                        <div className="text-xs text-muted-foreground mb-0.5">{t('short')}</div>
                                        <div className="text-base font-semibold text-red-600">{formatNumber(result.current_positions.non_reportables_short, 0)}</div>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('netPosition')}</span>
                                        <span className={`text-lg font-bold ${result.current_positions.non_reportables_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatNumber(result.current_positions.non_reportables_net, 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{t('weeklyDelta')}</span>
                                    <span className={`text-sm font-medium ${result.weekly_changes.change_nonrept_net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {result.weekly_changes.change_nonrept_net >= 0 ? "↑" : "↓"} {result.weekly_changes.change_nonrept_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_nonrept_net, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Educational tip for new users */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                        <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-300">{t('proTip')}</span>
                        <span className="text-amber-700 dark:text-amber-400 ml-1">
                            {t('proTipDivergence')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
