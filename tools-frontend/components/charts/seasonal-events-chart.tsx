"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp } from "lucide-react"

type SeasonalEvent = {
  id?: number
  name: string
  start_date?: string
  end_date?: string | null
  commodity?: string
  event_type?: string
  type?: string
  month?: number
  historical_impact?: string
  typical_impact?: string
  avg_price_change?: number
  avg_price_change_percent?: number | null
  description?: string | null
}

// Map typical_impact string to numeric value
const impactToPercent = (impact?: string): number => {
  if (!impact) return 0
  const impactMap: Record<string, number> = {
    'very_high': 5.0,
    'high': 3.5,
    'medium': 2.0,
    'low': 1.0,
    'very_low': 0.5
  }
  return impactMap[impact.toLowerCase()] || 0
}

type SeasonalEventsChartProps = {
  events: SeasonalEvent[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload

    // Handle monthly aggregated data
    if (data.month && data.avgChange !== undefined) {
      return (
        <div className="bg-white p-4 border-2 rounded-xl shadow-xl">
          <p className="font-semibold text-base mb-1">{data.month}</p>
          <p className="text-2xl font-mono font-bold" style={{ color: data.fill }}>
            {data.avgChange > 0 ? '+' : ''}{data.avgChange.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.eventCount} event{data.eventCount !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }

    // Handle individual event data
    if (data.name && data.avg_price_change !== undefined) {
      return (
        <div className="bg-white p-4 border-2 rounded-xl shadow-xl">
          <p className="font-semibold text-base mb-1">{data.name}</p>
          {data.start_date && (
            <p className="text-sm text-muted-foreground mb-2">
              {new Date(data.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
          <p className="text-2xl font-mono font-bold" style={{ color: data.fill }}>
            {data.avg_price_change > 0 ? '+' : ''}{data.avg_price_change.toFixed(2)}%
          </p>
          {data.start_date && data.end_date && (
            <p className="text-xs text-muted-foreground mt-1">
              Duration: {Math.ceil((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          )}
          {data.event_type && (
            <p className="text-xs mt-2 capitalize">
              <span className="font-semibold">Type:</span> {data.event_type}
            </p>
          )}
        </div>
      )
    }
  }
  return null
}

export function SeasonalEventsChart({ events }: SeasonalEventsChartProps) {
  // Helper function to get month name from month number or date
  const getMonthName = (monthNum?: number, dateStr?: string): string => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (monthNum !== undefined && monthNum !== null) {
      return monthNames[monthNum - 1] || '' // API uses 1-indexed months
    }
    if (dateStr) {
      try {
        const date = new Date(dateStr)
        return monthNames[date.getMonth()]
      } catch {
        return ''
      }
    }
    return ''
  }

  // Get impact value from event (handles both numeric and string impact)
  const getImpactValue = (event: SeasonalEvent): number => {
    if (event.avg_price_change !== undefined) return event.avg_price_change
    return impactToPercent(event.typical_impact)
  }

  // Group events by month and calculate average impact
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const monthlyData = monthOrder.map((month) => {
    const monthEvents = events.filter(e => {
      const eventMonth = getMonthName(e.month, e.start_date)
      return eventMonth === month
    })
    const avgChange = monthEvents.length > 0
      ? monthEvents.reduce((sum, e) => sum + getImpactValue(e), 0) / monthEvents.length
      : 0

    return {
      month,
      avgChange,
      eventCount: monthEvents.length,
      events: monthEvents,
      fill: avgChange > 0 ? 'url(#colorPositive)' : avgChange < 0 ? 'url(#colorNegative)' : '#94a3b8'
    }
  })

  // Top events by impact - normalize to use avg_price_change field for chart
  const topEvents = [...events]
    .map(event => ({
      ...event,
      avg_price_change: getImpactValue(event)
    }))
    .sort((a, b) => Math.abs(b.avg_price_change) - Math.abs(a.avg_price_change))
    .slice(0, 10)
    .map(event => ({
      ...event,
      fill: event.avg_price_change > 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
    }))

  const hasPositive = events.some(e => getImpactValue(e) > 0)
  const hasNegative = events.some(e => getImpactValue(e) < 0)

  return (
    <div className="space-y-6">
      {/* Monthly Distribution Chart */}
      <Card className="shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-600" />
                Monthly Seasonal Impact
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Average price change by month
              </CardDescription>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border-2 border-orange-200">
              <p className="text-xs text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold text-orange-600">{events.length}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#9ca3af' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#9ca3af' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="avgChange" radius={[12, 12, 0, 0]} maxBarSize={80}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="eventCount"
                  position="top"
                  formatter={(value: number) => value > 0 ? `${value} events` : ''}
                  style={{ fontSize: 10, fill: '#6b7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-6 flex-wrap">
            {hasPositive && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded"></div>
                <span className="text-sm font-medium">Bullish Impact</span>
              </div>
            )}
            {hasNegative && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-b from-red-500 to-red-600 rounded"></div>
                <span className="text-sm font-medium">Bearish Impact</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Events Chart */}
      {topEvents.length > 0 && (
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Top Seasonal Events by Impact
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Events with highest price impact
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={topEvents}
                layout="vertical"
                margin={{ top: 20, right: 80, left: 150, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={{ stroke: '#9ca3af' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#9ca3af' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="avg_price_change" radius={[0, 12, 12, 0]} maxBarSize={40}>
                  {topEvents.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="avg_price_change"
                    position="right"
                    formatter={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`}
                    style={{ fontSize: 11, fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
