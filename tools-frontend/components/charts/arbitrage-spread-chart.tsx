"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

type ArbitrageSpreadChartProps = {
  fairValue: number
  mcxPrice: number
  premium: number
  profitAnalysis: {
    gross_profit: number
    brokerage: number
    exchange_fees: number
    tax: number
    total_costs: number
    net_profit: number
  }
}

type TooltipPayload = {
  payload: {
    name: string
    fill: string
    description?: string
  }
  value: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white p-4 border-2 rounded-xl shadow-xl">
        <p className="font-semibold text-base mb-1">{data.payload.name}</p>
        <p className="text-2xl font-mono font-bold" style={{ color: data.payload.fill }}>
          {formatCurrency(Math.abs(data.value))}
        </p>
        {data.payload.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.payload.description}</p>
        )}
      </div>
    )
  }
  return null
}

export function ArbitrageSpreadChart({ fairValue, mcxPrice, premium, profitAnalysis }: ArbitrageSpreadChartProps) {
  const priceData = [
    {
      name: 'Fair Value',
      value: fairValue,
      fill: 'url(#colorFair)',
      description: 'COMEX + Duty + Costs'
    },
    {
      name: 'MCX Price',
      value: mcxPrice,
      fill: 'url(#colorMCX)',
      description: 'Current Market Price'
    },
    {
      name: premium > 0 ? 'Premium' : 'Discount',
      value: Math.abs(premium),
      fill: premium > 0 ? 'url(#colorProfit)' : 'url(#colorLoss)',
      description: premium > 0 ? 'Arbitrage Opportunity' : 'No Opportunity'
    },
  ]

  const profitData = [
    {
      name: 'Gross\nProfit',
      value: profitAnalysis.gross_profit,
      fill: 'url(#colorProfit)',
      description: 'Before costs'
    },
    {
      name: 'Brokerage',
      value: -profitAnalysis.brokerage,
      fill: '#ef4444',
      description: 'Trading fees'
    },
    {
      name: 'Exchange\nFees',
      value: -profitAnalysis.exchange_fees,
      fill: '#f97316',
      description: 'Exchange charges'
    },
    {
      name: 'Tax',
      value: -profitAnalysis.tax,
      fill: '#eab308',
      description: 'GST & duties'
    },
    {
      name: 'Net\nProfit',
      value: profitAnalysis.net_profit,
      fill: profitAnalysis.net_profit > 0 ? 'url(#colorNetProfit)' : 'url(#colorNetLoss)',
      description: 'Final P&L'
    },
  ]

  const isProfitable = profitAnalysis.net_profit > 0

  return (
    <div className="space-y-6">
      {/* Price Comparison Chart */}
      <StyledCard variant="blue">
        <StyledCardHeader
          icon={DollarSign}
          title="Price Comparison"
          description="Fair value vs MCX price analysis"
          variant="blue"
          action={
            premium > 0 ? (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-semibold flex items-center gap-1 shadow-sm">
                <TrendingUp className="h-5 w-5" />
                Opportunity
              </div>
            ) : null
          }
        />
        <StyledCardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={priceData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorMCX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 14, fontWeight: 600 }}
                axisLine={{ stroke: '#9ca3af' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#9ca3af' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} maxBarSize={120}>
                {priceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => formatCurrency(value)}
                  style={{ fontSize: 12, fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </StyledCardContent>
      </StyledCard>

      {/* Profit Breakdown Chart */}
      <StyledCard variant={isProfitable ? "green" : "pink"}>
        <StyledCardHeader
          icon={isProfitable ? TrendingUp : TrendingDown}
          title="Profit Breakdown"
          description="Detailed profit and cost analysis"
          variant={isProfitable ? "green" : "pink"}
          action={
            <div className={`px-5 py-2.5 rounded-xl font-bold text-lg shadow-sm ${isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {formatCurrency(profitAnalysis.net_profit)}
            </div>
          }
        />
        <StyledCardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={profitData} margin={{ top: 30, right: 40, left: 40, bottom: 60 }}>
              <defs>
                <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="colorNetLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={0}
                textAnchor="middle"
                height={80}
                tick={{ fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#9ca3af' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#9ca3af' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} maxBarSize={100}>
                {profitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => formatCurrency(Math.abs(value))}
                  style={{ fontSize: 11, fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-6 flex justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded"></div>
              <span className="text-sm font-medium">Profit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-medium">Costs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-b from-green-600 to-green-700 rounded"></div>
              <span className="text-sm font-medium">Net Result</span>
            </div>
          </div>
        </StyledCardContent>
      </StyledCard>
    </div>
  )
}
