"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Loader2, AlertTriangle, Shield, Info, BarChart3 } from "lucide-react"
import { metalsPricesApi, RecessionIndicatorsResponse, MetalType, CurrencyType } from "@/lib/api/metals-prices"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"

interface RecessionIndicatorsProps {
    metal?: MetalType
    currency?: CurrencyType
    onSettingsChange?: (settings: { metal: MetalType; currency: CurrencyType }) => void
}

const RECESSION_TYPE_COLORS: Record<string, string> = {
    global: "bg-red-100 text-red-700 border-red-200",
    us: "bg-blue-100 text-blue-700 border-blue-200",
    regional: "bg-amber-100 text-amber-700 border-amber-200",
    commodity: "bg-purple-100 text-purple-700 border-purple-200",
    financial: "bg-indigo-100 text-indigo-700 border-indigo-200",
    trade: "bg-orange-100 text-orange-700 border-orange-200",
    inflation: "bg-rose-100 text-rose-700 border-rose-200",
}

const RECESSION_TYPE_LABELS: Record<string, string> = {
    global: "Global Crisis",
    us: "US Recession",
    regional: "Regional",
    commodity: "Commodity",
    financial: "Financial",
    trade: "Trade War",
    inflation: "Inflation",
}

export function RecessionIndicators({
    metal: initialMetal = "GOLD",
    currency: initialCurrency = "INR",
    onSettingsChange,
}: RecessionIndicatorsProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<RecessionIndicatorsResponse | null>(null)
    const [metal, setMetal] = useState<MetalType>(initialMetal)
    const [currency, setCurrency] = useState<CurrencyType>(initialCurrency)

    const loadData = async () => {
        setLoading(true)
        try {
            const response = await metalsPricesApi.getRecessionIndicators(metal, currency)
            setData(response)
        } catch (error) {
            console.error("Error loading recession indicators:", error)
            toast.error("Failed to load recession indicators")
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metal, currency])

    useEffect(() => {
        onSettingsChange?.({ metal, currency })
    }, [metal, currency, onSettingsChange])

    // Prepare chart data
    const chartData = data?.recession_periods
        .filter(p => p.has_data)
        .map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
            fullName: p.name,
            change: p.price_change_pct || 0,
            type: p.type,
        })) || []

    return (
        <Card className="border-2 border-rose-200/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-50 via-red-50 to-pink-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-rose-100 rounded-xl">
                            <AlertTriangle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Recession & Crisis Indicators</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                    {data?.summary.periods_with_data || 0} periods analyzed
                                </Badge>
                                <span className="text-xs text-gray-500">Historical crisis performance</span>
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value={metal} onValueChange={(v) => setMetal(v as MetalType)}>
                            <SelectTrigger className="w-28 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">Gold</SelectItem>
                                <SelectItem value="SILVER">Silver</SelectItem>
                                <SelectItem value="PLATINUM">Platinum</SelectItem>
                                <SelectItem value="PALLADIUM">Palladium</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyType)}>
                            <SelectTrigger className="w-20 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                    </div>
                ) : !data ? (
                    <div className="text-center py-16 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No recession data available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border border-rose-200"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-rose-600" />
                                    <p className="text-xs text-rose-600 font-medium">Safe Haven Rate</p>
                                </div>
                                <p className="text-2xl font-bold text-rose-700">
                                    {data.summary.positive_rate}%
                                </p>
                                <p className="text-xs text-rose-500 mt-1">
                                    {data.summary.positive_periods} of {data.summary.periods_with_data} crises
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                    <p className="text-xs text-blue-600 font-medium">Avg Return</p>
                                </div>
                                <p className={`text-2xl font-bold ${data.summary.avg_price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {data.summary.avg_price_change >= 0 ? '+' : ''}{data.summary.avg_price_change}%
                                </p>
                                <p className="text-xs text-blue-500 mt-1">During crisis periods</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    <p className="text-xs text-emerald-600 font-medium">Best Performance</p>
                                </div>
                                <p className="text-lg font-bold text-emerald-600 truncate">
                                    {data.summary.best_period || "N/A"}
                                </p>
                                <p className="text-xs text-emerald-500 mt-1">
                                    {data.summary.best_return ? `+${data.summary.best_return}%` : "N/A"}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    <p className="text-xs text-red-600 font-medium">Worst Performance</p>
                                </div>
                                <p className="text-lg font-bold text-red-600 truncate">
                                    {data.summary.worst_period || "N/A"}
                                </p>
                                <p className="text-xs text-red-500 mt-1">
                                    {data.summary.worst_return ? `${data.summary.worst_return}%` : "N/A"}
                                </p>
                            </motion.div>
                        </div>

                        {/* Bar Chart */}
                        {chartData.length > 0 && (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0].payload
                                                    return (
                                                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                            <p className="font-semibold text-sm">{item.fullName}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{RECESSION_TYPE_LABELS[item.type] || item.type}</p>
                                                            <p className={`text-sm font-bold mt-1 ${item.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {item.change >= 0 ? '+' : ''}{item.change}%
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
                                        <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.change >= 0 ? "#10b981" : "#ef4444"}
                                                    className="cursor-pointer"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Recession Periods Table */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700">Crisis Period Details</h4>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-3 font-semibold text-gray-700">Crisis Period</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Type</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Duration</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Return</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Max Gain</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Max DD</th>
                                            <th className="text-center p-3 font-semibold text-gray-700">Volatility</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recession_periods.map((period, idx) => (
                                            <tr key={period.name} className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-800">{period.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(period.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(period.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full border ${RECESSION_TYPE_COLORS[period.type] || 'bg-gray-100 text-gray-700'}`}>
                                                        {RECESSION_TYPE_LABELS[period.type] || period.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center text-gray-600">
                                                    {period.has_data ? `${period.duration_days}d` : '-'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {period.has_data ? (
                                                        <span className={`font-bold ${period.price_change_pct && period.price_change_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {period.price_change_pct && period.price_change_pct >= 0 ? '+' : ''}{period.price_change_pct?.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">No Data</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {period.has_data ? (
                                                        <span className="text-emerald-600 font-medium">+{period.max_gain_pct?.toFixed(1)}%</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {period.has_data ? (
                                                        <span className="text-red-600 font-medium">{period.max_drawdown_pct?.toFixed(1)}%</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-center text-gray-600">
                                                    {period.has_data ? `${period.volatility?.toFixed(2)}%` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                This analysis shows how {metal.toLowerCase()} performed during major economic crises and recessions.
                                A positive return indicates {metal.toLowerCase()} acted as a safe-haven asset during that period.
                                Historical performance does not guarantee future results.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
