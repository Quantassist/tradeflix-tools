"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type COTPositioningChartProps = {
  data: Array<{
    date: string
    commercial: number
    nonCommercial: number
    openInterest: number
  }>
}

export function COTPositioningChart({ data }: COTPositioningChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>COT Positioning Over Time</CardTitle>
        <CardDescription>Commercial vs Non-Commercial net positions</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCommercial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorNonCommercial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="commercial" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorCommercial)" 
              name="Commercial Net"
            />
            <Area 
              type="monotone" 
              dataKey="nonCommercial" 
              stroke="#f97316" 
              fillOpacity={1} 
              fill="url(#colorNonCommercial)" 
              name="Speculator Net"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <div>
              <div className="font-medium">Commercial (Smart Money)</div>
              <div className="text-xs text-muted-foreground">Hedgers & Producers</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <div>
              <div className="font-medium">Non-Commercial (Speculators)</div>
              <div className="text-xs text-muted-foreground">Large Funds & Traders</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
