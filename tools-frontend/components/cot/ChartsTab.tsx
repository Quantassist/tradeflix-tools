"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import type { COTChartDataResponse } from "@/types"
import { InterpretationGuideButton } from "./InterpretationGuideButton"
import { HelpButton } from "./HelpButton"
import { Activity, AlertTriangle, BarChart3, TrendingUp, TrendingUp as TrendUp } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface ChartsTabProps {
    chartData: COTChartDataResponse | null
    weeksAnalyzed: number
    prepareNetPositionChartData: () => { date: string; "Managed Money": number; "Producer/Merchant": number; "Swap Dealer": number; "Other Reportables": number }[]
    prepareLongShortChartData: () => { date: string; "MM Long": number; "MM Short": number; "Comm Long": number; "Comm Short": number }[]
    prepareOIChartData: () => { date: string; "Open Interest": number; "Managed Money Net": number }[]
}

export function ChartsTab({ chartData, weeksAnalyzed, prepareNetPositionChartData, prepareLongShortChartData, prepareOIChartData }: ChartsTabProps) {
    if (!chartData) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Run analysis to see charts
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Historical Charts</h3>
                    <p className="text-sm text-muted-foreground">
                        {weeksAnalyzed} weeks of positioning data
                    </p>
                </div>
                <InterpretationGuideButton tabKey="charts" />
            </div>

            {chartData && (
                <div className="space-y-6">
                    {/* Net Position Comparison Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendUp className="h-5 w-5 text-orange-600" />
                                Net Position Comparison
                            </CardTitle>
                            <CardDescription>Track divergence between key market participants</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={prepareNetPositionChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" />
                                    <Tooltip
                                        formatter={(value: number) => formatNumber(value, 0)}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="Producer/Merchant" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Commercials" />
                                    <Line type="monotone" dataKey="Managed Money" stroke="#f97316" strokeWidth={2.5} dot={false} name="Managed Money" />
                                    <Line type="monotone" dataKey="Swap Dealer" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Swap Dealers" />
                                    <Line type="monotone" dataKey="Other Reportables" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>

                            {/* Pattern Indicators */}
                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-amber-800 dark:text-amber-300">Divergence</div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Opposite moves → Reversal signal</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Convergence</div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">All aligning → Trend confirmation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                        <Activity className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Crossover</div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">MM crosses Comm → Trend change</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Long/Short Positions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Long vs Short Positions
                            </CardTitle>
                            <CardDescription>Position breakdown for key market participants</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={prepareLongShortChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" />
                                    <Tooltip
                                        formatter={(value: number) => formatNumber(Math.abs(value), 0)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="MM Long" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.7} name="MM Long" />
                                    <Area type="monotone" dataKey="MM Short" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.7} name="MM Short" />
                                    <Area type="monotone" dataKey="Comm Long" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} name="Comm Long" />
                                    <Area type="monotone" dataKey="Comm Short" stackId="4" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} name="Comm Short" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Open Interest Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-600" />
                                Open Interest Analysis
                            </CardTitle>
                            <CardDescription>OI vs Managed Money positioning</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={prepareOIChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" />
                                    <Tooltip
                                        formatter={(value: number) => formatNumber(value, 0)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar yAxisId="left" dataKey="Open Interest" fill="#10b981" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Open Interest" />
                                    <Line yAxisId="right" type="monotone" dataKey="Managed Money Net" stroke="#f97316" strokeWidth={2.5} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>

                            {/* OI Interpretation Guide */}
                            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <div className="text-sm font-medium mb-2">How to Read Open Interest</div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-muted-foreground">OI ↑ + Price ↑ = New longs (bullish)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-muted-foreground">OI ↓ + Price ↑ = Short covering</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-muted-foreground">OI ↑ + Price ↓ = New shorts (bearish)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-muted-foreground">OI ↓ + Price ↓ = Long liquidation</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    )
}
