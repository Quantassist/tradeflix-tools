"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Building2, Lightbulb, Target } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { DisaggCOTAnalysisResponse } from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"
import { getSentimentColor, getSentimentLabel } from "./utils"

interface SentimentTabProps {
    result: DisaggCOTAnalysisResponse
}

export function SentimentTab({ result }: SentimentTabProps) {
    // PASTE TAB CONTENT HERE
    // From page.tsx, search for: Sentiment Tab - Modernized
    // Copy the content INSIDE TabsContent (lines ~1560-1760)
    // After pasting, add any missing imports at the top

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Market Sentiment</h3>
                    <p className="text-sm text-muted-foreground">
                        Based on {result.weeks_analyzed} weeks of historical data
                    </p>
                </div>
                <InterpretationGuideButton tabKey="sentiment" />
            </div>

            {/* Quick Sentiment Overview */}
            <div className="grid grid-cols-2 gap-4">
                {/* Speculators Sentiment Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5" />
                            <span className="text-sm font-medium opacity-90">Speculators</span>
                        </div>
                        <div className="text-4xl font-bold mb-1">
                            {result.managed_money_sentiment.percentile.toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-80 mb-3">Percentile Rank</div>
                        <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                            {getSentimentLabel(result.managed_money_sentiment.sentiment)}
                        </Badge>
                    </div>
                </div>

                {/* Commercials Sentiment Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5" />
                            <span className="text-sm font-medium opacity-90">Commercials</span>
                        </div>
                        <div className="text-4xl font-bold mb-1">
                            {result.producer_merchant_sentiment.percentile.toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-80 mb-3">Percentile Rank</div>
                        <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                            {getSentimentLabel(result.producer_merchant_sentiment.sentiment)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Detailed Sentiment Analysis */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Managed Money Detailed */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/50">
                                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Managed Money</CardTitle>
                                    <CardDescription className="text-xs">Hedge funds & speculators</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Modern Gauge */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Bearish</span>
                                <span>Neutral</span>
                                <span>Bullish</span>
                            </div>
                            <div className="relative h-3 bg-gradient-to-r from-emerald-400 via-slate-300 to-red-400 rounded-full">
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-orange-500 rounded-full shadow-lg transition-all duration-500"
                                    style={{ left: `calc(${result.managed_money_sentiment.percentile}% - 10px)` }}
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-bold text-orange-600">{result.managed_money_sentiment.percentile.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">Net Position</div>
                                <div className={`text-sm font-semibold ${result.managed_money_sentiment.net_position >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatNumber(result.managed_money_sentiment.net_position, 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">4-Week Δ</div>
                                <div className={`text-sm font-semibold ${result.managed_money_sentiment.four_week_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {result.managed_money_sentiment.four_week_change >= 0 ? "+" : ""}{formatNumber(result.managed_money_sentiment.four_week_change, 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">Streak</div>
                                <div className="text-sm font-semibold">
                                    {Math.abs(result.managed_money_sentiment.consecutive_weeks_direction)}w {result.managed_money_sentiment.consecutive_weeks_direction > 0 ? "↑" : "↓"}
                                </div>
                            </div>
                        </div>

                        {result.managed_money_percentile.is_extreme && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    <strong>Contrarian Alert:</strong> Extreme positioning often precedes reversals.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Commercials Detailed */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Commercials</CardTitle>
                                    <CardDescription className="text-xs">Producers & hedgers (Smart Money)</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Modern Gauge - Inverted for commercials */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Price Bullish</span>
                                <span>Neutral</span>
                                <span>Price Bearish</span>
                            </div>
                            <div className="relative h-3 bg-gradient-to-r from-red-400 via-slate-300 to-emerald-400 rounded-full">
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-lg transition-all duration-500"
                                    style={{ left: `calc(${result.producer_merchant_sentiment.percentile}% - 10px)` }}
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-bold text-blue-600">{result.producer_merchant_sentiment.percentile.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">Net Position</div>
                                <div className={`text-sm font-semibold ${result.producer_merchant_sentiment.net_position >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatNumber(result.producer_merchant_sentiment.net_position, 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">4-Week Δ</div>
                                <div className={`text-sm font-semibold ${result.producer_merchant_sentiment.four_week_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {result.producer_merchant_sentiment.four_week_change >= 0 ? "+" : ""}{formatNumber(result.producer_merchant_sentiment.four_week_change, 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <div className="text-xs text-muted-foreground mb-1">Streak</div>
                                <div className="text-sm font-semibold">
                                    {Math.abs(result.producer_merchant_sentiment.consecutive_weeks_direction)}w {result.producer_merchant_sentiment.consecutive_weeks_direction > 0 ? "↑" : "↓"}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                <strong>Smart Money:</strong> Commercials are contrarian. Heavy shorts = price tops, heavy longs = bottoms.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* All Category Percentiles - Simplified */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">All Categories</CardTitle>
                            <CardDescription>Percentile rankings vs {result.weeks_analyzed}-week history</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Simplified percentile bars */}
                        {[
                            { label: "Managed Money", percentile: result.managed_money_percentile?.percentile_1y ?? 50, isExtreme: result.managed_money_percentile?.is_extreme, color: "orange" },
                            { label: "Commercials", percentile: result.producer_merchant_percentile?.percentile_1y ?? 50, isExtreme: result.producer_merchant_percentile?.is_extreme, color: "blue" },
                            { label: "Swap Dealers", percentile: result.swap_dealer_percentile?.percentile_1y ?? 50, isExtreme: result.swap_dealer_percentile?.is_extreme, color: "purple" },
                            { label: "Other Reportables", percentile: result.other_reportables_percentile?.percentile_1y ?? 50, isExtreme: result.other_reportables_percentile?.is_extreme, color: "slate" },
                            { label: "Non-Reportables", percentile: result.non_reportables_percentile?.percentile_1y ?? 50, isExtreme: result.non_reportables_percentile?.is_extreme, color: "gray" },
                        ].map((item) => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.label}</span>
                                    <span className={`font-semibold ${item.percentile >= 80 || item.percentile <= 20
                                        ? "text-amber-600"
                                        : "text-foreground"
                                        }`}>
                                        {item.percentile.toFixed(0)}%
                                        {item.isExtreme && " ⚠️"}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${item.color === "orange" ? "bg-orange-500" :
                                            item.color === "blue" ? "bg-blue-500" :
                                                item.color === "purple" ? "bg-purple-500" :
                                                    item.color === "slate" ? "bg-slate-500" : "bg-gray-400"
                                            }`}
                                        style={{ width: `${item.percentile}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
