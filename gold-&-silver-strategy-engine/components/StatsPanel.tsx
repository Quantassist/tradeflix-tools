import React from 'react';
import { BacktestResult } from '../types';

const StatsPanel: React.FC<{ result: BacktestResult | null }> = ({ result }) => {
  if (!result) return (
    <div className="bg-slate-900 h-full rounded-xl border border-slate-800 flex items-center justify-center p-8 text-slate-500 text-sm">
      Run backtest to see results
    </div>
  );

  const StatItem = ({ label, value, color = "text-slate-200" }: any) => (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatItem 
        label="Total Return" 
        value={`${(result.metrics.totalReturn * 100).toFixed(2)}%`}
        color={result.metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}
      />
      <StatItem 
        label="Win Rate" 
        value={`${(result.metrics.winRate * 100).toFixed(1)}%`} 
      />
       <StatItem 
        label="Trades" 
        value={result.metrics.tradesCount} 
      />
      <StatItem 
        label="Max Drawdown" 
        value={`${(result.metrics.maxDrawdown * 100).toFixed(2)}%`}
        color="text-rose-400"
      />
      <StatItem 
        label="Sharpe Ratio" 
        value={result.metrics.sharpeRatio.toFixed(2)} 
        color="text-blue-300"
      />
    </div>
  );
};

export default StatsPanel;