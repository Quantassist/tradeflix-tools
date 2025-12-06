import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, Scatter } from 'recharts';
import { BacktestResult, Candle } from '../types';

interface Props {
  data: Candle[];
  result: BacktestResult | null;
}

const Charts: React.FC<Props> = ({ data, result }) => {
  // Merge candle data with equity data and trade signals
  const chartData = data.map(candle => {
    const equityPoint = result?.equityCurve.find(e => e.date === candle.date);
    
    // Check for trade events on this date
    const entryTrade = result?.trades.find(t => t.entryDate === candle.date);
    const exitTrade = result?.trades.find(t => t.exitDate === candle.date);

    return {
      ...candle,
      equity: equityPoint ? equityPoint.equity : null,
      entrySignal: entryTrade ? entryTrade.entryPrice : null,
      exitSignal: exitTrade ? exitTrade.exitPrice : null,
      tradeProfit: exitTrade ? exitTrade.profitPct : null
    };
  });

  // Custom Shapes for signals
  const EntryMarker = (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy) return null;
    return (
      <polygon points={`${cx},${cy+10} ${cx-6},${cy+22} ${cx+6},${cy+22}`} fill="#10b981" stroke="#064e3b" strokeWidth={1} />
    );
  };

  const ExitMarker = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isWin = payload.tradeProfit > 0;
    return (
      <polygon points={`${cx},${cy-10} ${cx-6},${cy-22} ${cx+6},${cy-22}`} fill={isWin ? "#10b981" : "#ef4444"} stroke="#0f172a" strokeWidth={1} />
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Price Chart */}
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 min-h-[300px]">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs text-slate-400">Price Action & Signals</h3>
            <div className="flex gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Buy Entry</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Sell Exit</span>
            </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={['auto', 'auto']} 
              stroke="#64748b"
              tick={{fontSize: 10}}
              width={40}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: any, name: string) => {
                  if (name === 'entrySignal') return [value, 'Buy Price'];
                  if (name === 'exitSignal') return [value, 'Sell Price'];
                  if (typeof value === 'number') return [value.toFixed(2), name];
                  return [value, name];
              }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              dot={false} 
              strokeWidth={2}
              name="Price"
            />
            
            {/* Entry Markers */}
            <Scatter 
              yAxisId="right"
              name="Entry" 
              dataKey="entrySignal" 
              shape={<EntryMarker />} 
              legendType="none"
            />

            {/* Exit Markers */}
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
        <div className="h-[200px] bg-slate-900 rounded-xl border border-slate-800 p-4">
           <h3 className="text-xs text-slate-400 mb-2">Equity Curve</h3>
           <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis 
                domain={['auto', 'auto']} 
                stroke="#64748b" 
                tick={{fontSize: 10}} 
                width={40}
                tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
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
  );
};

export default Charts;