import React, { useState, useEffect } from 'react';
import StrategyBuilder from './components/StrategyBuilder';
import Charts from './components/Charts';
import StatsPanel from './components/StatsPanel';
import { Strategy, BacktestResult, Candle, IndicatorType, Comparator, Asset } from './types';
import { generateMockData } from './services/calcService';
import { runBacktest } from './services/backtestService';
import { generatePythonCode, analyzeStrategy } from './services/geminiService';
import { Play, Code, BarChart2, Brain, Copy, Layers, Coins, Activity } from 'lucide-react';

// Default Strategy: RSI Oversold & Volume Spike
const DEFAULT_STRATEGY: Strategy = {
  id: '1',
  name: 'RSI Oversold + Volume Reversal',
  asset: 'GOLD',
  entryLogic: {
    id: 'root-entry',
    type: 'GROUP',
    operator: 'AND',
    children: [
        {
          id: 'e1',
          type: 'CONDITION',
          left: { type: IndicatorType.RSI, period: 14 },
          comparator: Comparator.LESS_THAN,
          right: { type: IndicatorType.PRICE, period: 0 }, // Placeholder
          value: 30 // STATIC VALUE: RSI < 30
        },
        {
          id: 'e2',
          type: 'CONDITION',
          left: { type: IndicatorType.PRICE, period: 0 },
          comparator: Comparator.GREATER_THAN,
          right: { type: IndicatorType.EMA, period: 200 }, // Trend Filter
        }
    ]
  },
  exitLogic: {
    id: 'root-exit',
    type: 'GROUP',
    operator: 'OR',
    children: [
       {
          id: 'x1',
          type: 'CONDITION',
          left: { type: IndicatorType.RSI, period: 14 },
          comparator: Comparator.GREATER_THAN,
          right: { type: IndicatorType.PRICE, period: 0 }, 
          value: 70 // STATIC VALUE: RSI > 70
        }
    ]
  },
  stopLossPct: 2.0,
  takeProfitPct: 5.0
};

export default function App() {
  const [strategy, setStrategy] = useState<Strategy>(DEFAULT_STRATEGY);
  const [data, setData] = useState<Candle[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [view, setView] = useState<'VISUAL' | 'CODE'>('VISUAL');
  const [pythonCode, setPythonCode] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Load initial data based on asset
  useEffect(() => {
    // Generate 10 years of data (approx 3650 days)
    const mockData = generateMockData(strategy.asset, 3650);
    setData(mockData);
    setResult(null); // Reset results on data change
  }, [strategy.asset]);

  const handleAssetChange = (asset: Asset) => {
    setStrategy(prev => ({ ...prev, asset }));
  };

  const handleRunBacktest = () => {
    if (data.length === 0) return;
    const res = runBacktest(strategy, data);
    setResult(res);
  };

  const handleGenerateCode = async () => {
    setView('CODE');
    if (pythonCode && strategy.asset === 'GOLD') return; // Simple cache check
    setLoadingAI(true);
    const code = await generatePythonCode(strategy);
    setPythonCode(code);
    setLoadingAI(false);
  };

  const handleAnalyze = async () => {
    setLoadingAI(true);
    const text = await analyzeStrategy(strategy);
    setAiAnalysis(text);
    setLoadingAI(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-yellow-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 font-bold ${strategy.asset === 'GOLD' ? 'bg-yellow-500' : 'bg-slate-300'}`}>
              <Coins size={18} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">QuantFlow Metals</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">10 Year Backtest Engine</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
             {/* Asset Selector */}
             <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => handleAssetChange('GOLD')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${strategy.asset === 'GOLD' ? 'bg-yellow-500 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  GOLD
                </button>
                <button 
                  onClick={() => handleAssetChange('SILVER')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${strategy.asset === 'SILVER' ? 'bg-slate-300 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  SILVER
                </button>
             </div>

             <div className="h-6 w-px bg-slate-800 mx-2"></div>

             <button 
              onClick={handleRunBacktest}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
            >
              <Play size={16} fill="currentColor" /> Run Backtest
            </button>
             <button 
              onClick={handleGenerateCode}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium text-sm border border-slate-700 transition-colors"
            >
              <Code size={16} /> Export Python
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* Left Panel: Builder */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} /> Strategy Logic
            </h2>
            <button 
              onClick={handleAnalyze} 
              disabled={loadingAI}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Brain size={12} /> {loadingAI ? 'Analyzing...' : 'AI Analyze'}
            </button>
          </div>

          <StrategyBuilder strategy={strategy} setStrategy={setStrategy} />

          {aiAnalysis && (
            <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl text-sm text-slate-300">
              <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                <Brain size={16} /> AI Insight
              </h4>
              <p className="whitespace-pre-line leading-relaxed text-xs opacity-80">{aiAnalysis}</p>
            </div>
          )}
        </div>

        {/* Right Panel: Visualization or Code */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
           
           {/* Stats Bar */}
           <StatsPanel result={result} />

           {/* Main View Area */}
           <div className="flex-1 min-h-[500px] bg-slate-900/50 rounded-2xl border border-slate-800 p-1 overflow-hidden relative shadow-2xl shadow-black/50">
              
              {/* Tabs */}
              <div className="absolute top-4 right-4 flex bg-slate-800/80 backdrop-blur rounded-lg p-1 z-10 border border-slate-700">
                <button 
                  onClick={() => setView('VISUAL')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'VISUAL' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <BarChart2 size={14} className="inline mr-1" /> Chart
                </button>
                <button 
                  onClick={() => setView('CODE')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'CODE' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Code size={14} className="inline mr-1" /> Python
                </button>
              </div>

              {view === 'VISUAL' ? (
                <div className="p-4 h-full">
                  <Charts data={data} result={result} />
                </div>
              ) : (
                <div className="p-0 h-full overflow-hidden flex flex-col">
                  <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-mono">strategy_{strategy.asset.toLowerCase()}.py</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(pythonCode)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-yellow-100/80 bg-slate-950/80">
                    {loadingAI ? 'Generating Python code with Gemini...' : pythonCode || '# Run "Export to Python" to generate code.'}
                  </pre>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}