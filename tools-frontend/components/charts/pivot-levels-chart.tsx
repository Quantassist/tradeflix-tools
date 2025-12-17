"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { Button } from "@/components/ui/button"
import { BarChart3, BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { CPRLevels, PivotResponse } from "@/types"

type PivotLevelsChartProps = {
  cpr: CPRLevels
  floorPivots: PivotResponse["floor_pivots"]
  currentPrice: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-sm">{data.name}</p>
        <p className="text-lg font-mono" style={{ color: data.color }}>
          ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{data.type}</p>
      </div>
    )
  }
  return null
}

export function PivotLevelsChart({ cpr, floorPivots, currentPrice }: PivotLevelsChartProps) {
  // Create data for horizontal bar chart
  const data = [
    { name: "R3", value: floorPivots.r3, type: "resistance", color: "#dc2626" },
    { name: "R2", value: floorPivots.r2, type: "resistance", color: "#ef4444" },
    { name: "R1", value: floorPivots.r1, type: "resistance", color: "#f87171" },
    { name: "TC", value: cpr.tc, type: "cpr", color: "#3b82f6" },
    { name: "Pivot", value: cpr.pivot, type: "cpr", color: "#2563eb" },
    { name: "BC", value: cpr.bc, type: "cpr", color: "#1d4ed8" },
    { name: "S1", value: floorPivots.s1, type: "support", color: "#86efac" },
    { name: "S2", value: floorPivots.s2, type: "support", color: "#4ade80" },
    { name: "S3", value: floorPivots.s3, type: "support", color: "#22c55e" },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Pivot Levels Visualization</h2>
              <p className="text-slate-500">Support and resistance levels with current price</p>
            </div>
          </div>

          {/* Help Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md">
                <BookOpen className="h-4 w-4 mr-2" />
                Reading the Chart
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  Chart Reading Guide
                </DialogTitle>
                <DialogDescription>How to interpret the pivot levels chart</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-3 text-sm">
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Resistance Levels (R1-R3)
                  </div>
                  <p className="text-red-600 text-xs">Price barriers above current price. Expect selling pressure at these levels.</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 font-semibold text-blue-700 mb-1">
                    <Minus className="h-4 w-4" />
                    CPR Zone (TC, Pivot, BC)
                  </div>
                  <p className="text-blue-600 text-xs">Central Pivot Range - the day&apos;s equilibrium zone. Price tends to gravitate here.</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Support Levels (S1-S3)
                  </div>
                  <p className="text-green-600 text-xs">Price floors below current price. Expect buying pressure at these levels.</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-amber-700 text-xs"><strong>Orange dashed line</strong> shows current price position relative to all levels.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chart Content */}
        <div>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 80, left: 80, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={['dataMin - 500', 'dataMax + 500']} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 14, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />

              {/* Current Price Reference Line */}
              <ReferenceLine
                x={currentPrice}
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 5"
                label={{
                  value: `Current: ₹${currentPrice.toLocaleString('en-IN')}`,
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              />

              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm font-medium">Resistance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span className="text-sm font-medium">CPR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm font-medium">Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-orange-500 border-dashed"></div>
              <span className="text-sm font-medium text-orange-600">Current Price</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
