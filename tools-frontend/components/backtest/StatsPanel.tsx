"use client"

import React from "react"
import { TrendingUp, Target, BarChart3, TrendingDown, Activity } from "lucide-react"
import type { VisualBacktestResult } from "@/types"

interface StatsPanelProps {
    result: VisualBacktestResult | null
}

export function StatsPanel({ result }: StatsPanelProps) {
    if (!result) {
        return null
    }

    const stats = [
        {
            label: "Total Return",
            value: `${(result.metrics.totalReturn * 100).toFixed(2)}%`,
            positive: result.metrics.totalReturn >= 0,
            icon: TrendingUp,
            bgColor: result.metrics.totalReturn >= 0 ? "bg-emerald-50" : "bg-rose-50",
            iconColor: result.metrics.totalReturn >= 0 ? "text-emerald-500" : "text-rose-500",
        },
        {
            label: "Win Rate",
            value: `${(result.metrics.winRate * 100).toFixed(1)}%`,
            icon: Target,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            label: "Trades",
            value: result.metrics.tradesCount,
            icon: BarChart3,
            bgColor: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
        {
            label: "Max Drawdown",
            value: `${(result.metrics.maxDrawdown * 100).toFixed(2)}%`,
            negative: true,
            icon: TrendingDown,
            bgColor: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        {
            label: "Sharpe Ratio",
            value: result.metrics.sharpeRatio.toFixed(2),
            icon: Activity,
            bgColor: "bg-violet-50",
            iconColor: "text-violet-500",
        },
    ]

    return (
        <div className="grid grid-cols-5 gap-3">
            {stats.map((stat) => {
                const Icon = stat.icon
                return (
                    <div key={stat.label} className={`${stat.bgColor} rounded-xl p-4 border border-slate-100`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon size={14} className={stat.iconColor} />
                            <span className="text-xs text-slate-600 font-medium">{stat.label}</span>
                        </div>
                        <div className={`text-xl font-bold tabular-nums ${stat.positive !== undefined
                                ? stat.positive ? "text-emerald-700" : "text-rose-700"
                                : stat.negative
                                    ? "text-rose-700"
                                    : "text-slate-800"
                            }`}>
                            {stat.value}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default StatsPanel
