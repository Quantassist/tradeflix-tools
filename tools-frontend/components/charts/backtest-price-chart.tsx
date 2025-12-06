"use client"

import React, { useMemo } from "react"
import {
    ResponsiveContainer,
    ComposedChart,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Area,
    Scatter,
    ReferenceLine,
} from "recharts"
import type { VisualBacktestResult, Candle } from "@/types"

interface BacktestPriceChartProps {
    data: Candle[]
    result: VisualBacktestResult | null
}

// Custom triangle marker for entry signals (pointing up, below the price line)
const EntryMarker = (props: { cx?: number; cy?: number }) => {
    const { cx, cy } = props
    if (!cx || !cy) return null
    const size = 10
    const offset = 15 // Distance below the price point
    // Triangle pointing up (▲)
    const points = `${cx},${cy + offset - size} ${cx - size * 0.7},${cy + offset + size * 0.5} ${cx + size * 0.7},${cy + offset + size * 0.5}`
    return (
        <polygon
            points={points}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={1.5}
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
        />
    )
}

// Custom triangle marker for exit signals (pointing down, above the price line)
const ExitMarker = (props: { cx?: number; cy?: number; payload?: { tradeProfit?: number } }) => {
    const { cx, cy, payload } = props
    if (!cx || !cy) return null
    const isWin = (payload?.tradeProfit || 0) > 0
    const size = 10
    const offset = 15 // Distance above the price point
    // Triangle pointing down (▼)
    const points = `${cx},${cy - offset + size} ${cx - size * 0.7},${cy - offset - size * 0.5} ${cx + size * 0.7},${cy - offset - size * 0.5}`
    return (
        <polygon
            points={points}
            fill={isWin ? "#10b981" : "#ef4444"}
            stroke="#fff"
            strokeWidth={1.5}
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
        />
    )
}

// Format date for x-axis display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// Shared margin for both charts to ensure alignment
const CHART_MARGIN = { top: 10, right: 10, left: 10, bottom: 0 }
const Y_AXIS_WIDTH = 70

export function BacktestPriceChart({ data, result }: BacktestPriceChartProps) {
    // Merge candle data with equity data and trade signals
    const chartData = useMemo(() => data.map((candle) => {
        const equityPoint = result?.equityCurve.find((e) => e.date === candle.date)
        const entryTrade = result?.trades.find((t) => t.entryDate === candle.date)
        const exitTrade = result?.trades.find((t) => t.exitDate === candle.date)

        return {
            ...candle,
            equity: equityPoint ? equityPoint.equity : null,
            entrySignal: entryTrade ? entryTrade.entryPrice : null,
            exitSignal: exitTrade ? exitTrade.exitPrice : null,
            tradeProfit: exitTrade ? exitTrade.profitPct : null,
        }
    }), [data, result])

    // Calculate tick indices for x-axis (show ~6 ticks) - shared between both charts
    const xAxisTicks = useMemo(() => {
        if (chartData.length === 0) return []
        const step = Math.max(1, Math.floor(chartData.length / 6))
        return chartData.filter((_, i) => i % step === 0).map(d => d.date)
    }, [chartData])

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                <p>Run a backtest to see chart data</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Price Chart */}
            <div className="h-[60%]">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-sm text-indigo-700 font-semibold">Price Action</h3>
                    <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="10" viewBox="0 0 12 10">
                                <polygon points="6,0 0,10 12,10" fill="#10b981" />
                            </svg>
                            Entry
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="10" viewBox="0 0 12 10">
                                <polygon points="6,10 0,0 12,0" fill="#ef4444" />
                            </svg>
                            Exit
                        </span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={chartData} margin={CHART_MARGIN}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={{ stroke: "#d1d5db" }}
                            tickLine={{ stroke: "#d1d5db" }}
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            ticks={xAxisTicks}
                            tickFormatter={formatDate}
                            height={30}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={["auto", "auto"]}
                            axisLine={{ stroke: "#d1d5db" }}
                            tickLine={{ stroke: "#d1d5db" }}
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            width={Y_AXIS_WIDTH}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e7ff",
                                fontSize: "12px",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
                            }}
                            itemStyle={{ color: "#374151" }}
                            labelStyle={{ color: "#4f46e5", fontWeight: 600 }}
                            formatter={(value: number, name: string) => {
                                if (name === "entrySignal") return [`₹${value?.toFixed(2)}`, "Buy"]
                                if (name === "exitSignal") return [`₹${value?.toFixed(2)}`, "Sell"]
                                if (typeof value === "number") return [`₹${value.toFixed(2)}`, name]
                                return [value, name]
                            }}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="close"
                            stroke="#6366f1"
                            fill="url(#colorPrice)"
                            strokeWidth={2}
                            name="Price"
                        />
                        <Scatter
                            yAxisId="right"
                            name="Entry"
                            dataKey="entrySignal"
                            shape={<EntryMarker />}
                            legendType="none"
                        />
                        <Scatter
                            yAxisId="right"
                            name="Exit"
                            dataKey="exitSignal"
                            shape={<ExitMarker />}
                            legendType="none"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Equity Chart */}
            {result && (
                <div className="flex-1 border-t border-gray-100 pt-2">
                    <h3 className="text-sm text-emerald-700 font-semibold mb-2 px-1">Equity Curve</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <ComposedChart data={chartData} margin={CHART_MARGIN}>
                            <defs>
                                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={{ stroke: "#d1d5db" }}
                                tickLine={{ stroke: "#d1d5db" }}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                ticks={xAxisTicks}
                                tickFormatter={formatDate}
                                height={30}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={["auto", "auto"]}
                                axisLine={{ stroke: "#d1d5db" }}
                                tickLine={{ stroke: "#d1d5db" }}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                width={Y_AXIS_WIDTH}
                                tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                            />
                            <ReferenceLine y={result.initialEquity} stroke="#9ca3af" strokeDasharray="3 3" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #d1fae5",
                                    fontSize: "12px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                                }}
                                labelStyle={{ color: "#059669", fontWeight: 600 }}
                                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Equity"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="equity"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorEquity)"
                                strokeWidth={2}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default BacktestPriceChart
