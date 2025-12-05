"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-2xl">Pivot Levels Visualization</CardTitle>
        <CardDescription className="text-base">Support and resistance levels with current price</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
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
      </CardContent>
    </Card>
  )
}
