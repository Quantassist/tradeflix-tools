"use client"

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import type { EquityPoint, MonthlyReturn } from "@/types"

type BacktestResultsChartProps = {
  equityCurve: EquityPoint[]
  monthlyReturns: MonthlyReturn[]
  initialCapital: number
  finalCapital: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border-2 rounded-xl shadow-xl">
        <p className="text-sm text-muted-foreground mb-1">
          {new Date(data.date).toLocaleDateString()}
        </p>
        <p className="text-lg font-mono font-bold text-green-600">
          ₹{data.equity.toLocaleString()}
        </p>
        {data.drawdown_percent !== undefined && (
          <p className="text-sm text-red-600">
            Drawdown: {data.drawdown_percent.toFixed(2)}%
          </p>
        )}
      </div>
    )
  }
  return null
}

const MonthlyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border-2 rounded-xl shadow-xl">
        <p className="text-sm font-semibold mb-1">{data.month}</p>
        <p className="text-lg font-mono font-bold" style={{ color: data.return_percent >= 0 ? '#16a34a' : '#dc2626' }}>
          {data.return_percent >= 0 ? '+' : ''}{data.return_percent.toFixed(2)}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.trades} trade{data.trades !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

export function BacktestResultsChart({ equityCurve, monthlyReturns, initialCapital, finalCapital }: BacktestResultsChartProps) {
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100
  const isProfit = totalReturn >= 0

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Equity Curve
              </CardTitle>
              <CardDescription className="text-blue-100">
                Account balance over time
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Total Return</div>
              <div className={`text-3xl font-bold ${isProfit ? 'text-green-300' : 'text-red-300'}`}>
                {isProfit ? '+' : ''}{totalReturn.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Drawdown Analysis
          </CardTitle>
          <CardDescription className="text-red-100">
            Peak-to-trough decline
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="drawdown_percent" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#drawdownGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Returns */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Monthly Returns
          </CardTitle>
          <CardDescription className="text-green-100">
            Performance breakdown by month
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-')
                  const date = new Date(parseInt(year), parseInt(month) - 1)
                  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<MonthlyTooltip />} />
              <Bar 
                dataKey="return_percent" 
                radius={[8, 8, 0, 0]}
                fill="#10b981"
              >
                {monthlyReturns.map((entry, index) => (
                  <rect 
                    key={`cell-${index}`}
                    fill={entry.return_percent >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
