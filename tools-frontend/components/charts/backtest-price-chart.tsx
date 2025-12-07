"use client"

import React, { useMemo, useState } from "react"
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

// Maximum data points to render for performance
const MAX_DATA_POINTS = 500

// Custom tooltip for trade markers
interface MarkerTooltipProps {
    x: number
    y: number
    type: "entry" | "exit"
    price: number
    date: string
    profit?: number
}

const MarkerTooltip = ({ x, y, type, price, date, profit }: MarkerTooltipProps) => {
    const isEntry = type === "entry"
    const bgColor = isEntry ? "#10b981" : (profit && profit > 0 ? "#10b981" : "#ef4444")

    return (
        <g>
            <rect
                x={x - 50}
                y={isEntry ? y + 25 : y - 55}
                width={100}
                height={40}
                rx={4}
                fill={bgColor}
                opacity={0.95}
            />
            <text
                x={x}
                y={isEntry ? y + 40 : y - 40}
                textAnchor="middle"
                fill="#fff"
                fontSize={10}
                fontWeight={600}
            >
                {isEntry ? "BUY" : "SELL"} @ ₹{price.toFixed(2)}
            </text>
            <text
                x={x}
                y={isEntry ? y + 54 : y - 26}
                textAnchor="middle"
                fill="#fff"
                fontSize={9}
                opacity={0.9}
            >
                {new Date(date).toLocaleDateString()}
                {!isEntry && profit !== undefined && ` (${profit > 0 ? "+" : ""}${profit.toFixed(1)}%)`}
            </text>
        </g>
    )
}

// Custom triangle marker for entry signals (pointing up, below the price line)
const EntryMarker = (props: {
    cx?: number
    cy?: number
    payload?: { date?: string; entrySignal?: number }
    onHover?: (data: MarkerTooltipProps | null) => void
}) => {
    const { cx, cy, payload, onHover } = props
    if (!cx || !cy || !payload?.entrySignal) return null
    const size = 10
    const offset = 15
    const points = `${cx},${cy + offset - size} ${cx - size * 0.7},${cy + offset + size * 0.5} ${cx + size * 0.7},${cy + offset + size * 0.5}`
    return (
        <polygon
            points={points}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={1.5}
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => onHover?.({ x: cx, y: cy, type: "entry", price: payload.entrySignal!, date: payload.date || "" })}
            onMouseLeave={() => onHover?.(null)}
        />
    )
}

// Custom triangle marker for exit signals (pointing down, above the price line)
const ExitMarker = (props: {
    cx?: number
    cy?: number
    payload?: { tradeProfit?: number; date?: string; exitSignal?: number }
    onHover?: (data: MarkerTooltipProps | null) => void
}) => {
    const { cx, cy, payload, onHover } = props
    if (!cx || !cy || !payload?.exitSignal) return null
    const isWin = (payload?.tradeProfit || 0) > 0
    const size = 10
    const offset = 15
    const points = `${cx},${cy - offset + size} ${cx - size * 0.7},${cy - offset - size * 0.5} ${cx + size * 0.7},${cy - offset - size * 0.5}`
    return (
        <polygon
            points={points}
            fill={isWin ? "#10b981" : "#ef4444"}
            stroke="#fff"
            strokeWidth={1.5}
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => onHover?.({ x: cx, y: cy, type: "exit", price: payload.exitSignal!, date: payload.date || "", profit: payload.tradeProfit })}
            onMouseLeave={() => onHover?.(null)}
        />
    )
}

// Format date for x-axis display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// Shared margin for both charts to ensure alignment
const CHART_MARGIN = { top: 10, right: 70, left: 10, bottom: 0 }
const Y_AXIS_WIDTH = 60

// Downsample data while preserving trade points
const downsampleData = <T extends { date: string }>(
    data: T[],
    maxPoints: number,
    preserveDates: Set<string>
): T[] => {
    if (data.length <= maxPoints) return data

    const step = Math.ceil(data.length / maxPoints)
    const result: T[] = []

    for (let i = 0; i < data.length; i++) {
        // Always include first, last, and trade dates
        if (i === 0 || i === data.length - 1 || preserveDates.has(data[i].date) || i % step === 0) {
            result.push(data[i])
        }
    }

    return result
}

export function BacktestPriceChart({ data, result }: BacktestPriceChartProps) {
    // State for marker tooltip
    const [markerTooltip, setMarkerTooltip] = useState<MarkerTooltipProps | null>(null)

    // Get all trade dates that must be preserved
    const tradeDates = useMemo(() => {
        const dates = new Set<string>()
        result?.trades.forEach(t => {
            if (t.entryDate) dates.add(t.entryDate)
            if (t.exitDate) dates.add(t.exitDate)
        })
        return dates
    }, [result])

    // Merge candle data with equity data and trade signals, then downsample
    const chartData = useMemo(() => {
        const fullData = data.map((candle) => {
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
        })

        // Downsample for performance while preserving trade points
        return downsampleData(fullData, MAX_DATA_POINTS, tradeDates)
    }, [data, result, tradeDates])

    // Calculate tick indices for x-axis (show ~6 ticks) - shared between both charts
    const xAxisTicks = useMemo(() => {
        if (chartData.length === 0) return []
        const step = Math.max(1, Math.floor(chartData.length / 6))
        return chartData.filter((_, i) => i % step === 0).map(d => d.date)
    }, [chartData])

    if (data.length === 0) {
        // If we have result but no price data, show a message to re-run backtest
        if (result) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                    <div className="text-center">
                        <p className="font-medium">Previous Results Loaded</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Run the backtest again to see the price chart and equity curve
                        </p>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">
                        Initial: ₹{result.initialEquity.toLocaleString()} → Final: ₹{result.finalEquity.toLocaleString()}
                    </div>
                </div>
            )
        }
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
                            shape={<EntryMarker onHover={setMarkerTooltip} />}
                            legendType="none"
                        />
                        <Scatter
                            yAxisId="right"
                            name="Exit"
                            dataKey="exitSignal"
                            shape={<ExitMarker onHover={setMarkerTooltip} />}
                            legendType="none"
                        />
                        {/* Custom tooltip for trade markers */}
                        {markerTooltip && <MarkerTooltip {...markerTooltip} />}
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
                                orientation="right"
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
