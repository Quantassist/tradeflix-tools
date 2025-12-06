
import { Candle, Condition, Strategy, BacktestResult, Trade, Comparator, IndicatorType, LogicGroup, StrategyNode } from '../types';
import { calculateIndicators } from './calcService';

const getValue = (candle: Candle, config: any): number => {
  if (config.type === IndicatorType.PRICE) return candle.close;
  if (config.type === IndicatorType.OPEN) return candle.open;
  if (config.type === IndicatorType.HIGH) return candle.high;
  if (config.type === IndicatorType.LOW) return candle.low;
  if (config.type === IndicatorType.VOLUME) return candle.volume;
  
  if (config.type === IndicatorType.PREV_HIGH) return (candle['PREV_HIGH'] as number) || 0;
  if (config.type === IndicatorType.PREV_LOW) return (candle['PREV_LOW'] as number) || 0;
  if (config.type === IndicatorType.USDINR) return (candle['usdinr'] as number) || 0;
  
  if (config.type === IndicatorType.CPR_PIVOT) return (candle['CPR_PIVOT'] as number) || 0;
  if (config.type === IndicatorType.CPR_TC) return (candle['CPR_TC'] as number) || 0;
  if (config.type === IndicatorType.CPR_BC) return (candle['CPR_BC'] as number) || 0;


  const key = `${config.type}_${config.period}`;
  return (candle[key] as number) || 0;
};

const evaluateCondition = (condition: Condition, candle: Candle, prevCandle: Candle): boolean => {
  const valA = getValue(candle, condition.left);
  const valB = condition.value !== undefined ? condition.value : getValue(candle, condition.right);
  
  const prevValA = getValue(prevCandle, condition.left);
  const prevValB = condition.value !== undefined ? condition.value : getValue(prevCandle, condition.right);

  // Filter out invalid periods (nulls) or missing data
  if (valA === 0 || (condition.value === undefined && valB === 0)) return false;

  switch (condition.comparator) {
    case Comparator.GREATER_THAN: return valA > valB;
    case Comparator.LESS_THAN: return valA < valB;
    case Comparator.EQUALS: return Math.abs(valA - valB) < 0.01;
    case Comparator.CROSSES_ABOVE: return prevValA <= prevValB && valA > valB;
    case Comparator.CROSSES_BELOW: return prevValA >= prevValB && valA < valB;
    default: return false;
  }
};

const evaluateNode = (node: StrategyNode, candle: Candle, prevCandle: Candle): boolean => {
  if (node.type === 'CONDITION') {
    return evaluateCondition(node as Condition, candle, prevCandle);
  } else {
    const group = node as LogicGroup;
    if (group.children.length === 0) return false; // Empty group returns false (safe default)

    if (group.operator === 'AND') {
      return group.children.every(child => evaluateNode(child, candle, prevCandle));
    } else {
      return group.children.some(child => evaluateNode(child, candle, prevCandle));
    }
  }
};

const extractIndicatorConfigs = (node: StrategyNode, configs: Set<string>, list: any[]) => {
  if (node.type === 'CONDITION') {
    const c = node as Condition;
    const add = (conf: any) => {
       if (!conf) return;
       // Skip basic types
       if ([
         IndicatorType.PRICE, IndicatorType.OPEN, IndicatorType.HIGH, IndicatorType.LOW, IndicatorType.VOLUME, 
         IndicatorType.PREV_HIGH, IndicatorType.PREV_LOW, IndicatorType.USDINR,
         IndicatorType.CPR_PIVOT, IndicatorType.CPR_TC, IndicatorType.CPR_BC
       ].includes(conf.type)) return;

       const key = `${conf.type}_${conf.period}`;
       if (!configs.has(key)) {
         configs.add(key);
         list.push(conf);
       }
    };
    add(c.left);
    if (c.value === undefined) add(c.right);
  } else {
    const group = node as LogicGroup;
    group.children.forEach(child => extractIndicatorConfigs(child, configs, list));
  }
};

export const runBacktest = (strategy: Strategy, rawData: Candle[]): BacktestResult => {
  // 1. Identify all unique indicators needed from recursive trees
  const configs = new Set<string>();
  const uniqueConfigs: any[] = [];

  extractIndicatorConfigs(strategy.entryLogic, configs, uniqueConfigs);
  extractIndicatorConfigs(strategy.exitLogic, configs, uniqueConfigs);

  // 2. Pre-calculate indicators
  const data = calculateIndicators(rawData, uniqueConfigs);

  // 3. Loop
  let equity = 10000;
  const initialEquity = equity;
  const trades: Trade[] = [];
  const equityCurve: { date: string; equity: number }[] = [];
  let currentTrade: Trade | null = null;

  for (let i = 1; i < data.length; i++) {
    const candle = data[i];
    const prevCandle = data[i - 1];

    // Check Exit
    if (currentTrade) {
      let exitSignal = false;
      // Stop Loss
      const priceChangePct = (candle.low - currentTrade.entryPrice) / currentTrade.entryPrice;
      if (priceChangePct < -strategy.stopLossPct / 100) {
        exitSignal = true; // Hit SL
      }
      
      // Take Profit
      const profitHighPct = (candle.high - currentTrade.entryPrice) / currentTrade.entryPrice;
      if (profitHighPct > strategy.takeProfitPct / 100) {
         exitSignal = true; // Hit TP
      }

      // Logic Exit
      // Only check logic exit if there are rules defined
      if (strategy.exitLogic.children.length > 0) {
        if (evaluateNode(strategy.exitLogic, candle, prevCandle)) {
          exitSignal = true;
        }
      }

      if (exitSignal) {
        currentTrade.exitDate = candle.date;
        currentTrade.exitPrice = candle.close;
        currentTrade.status = 'CLOSED';
        
        currentTrade.profitPct = (currentTrade.exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice;
        
        equity = equity * (1 + currentTrade.profitPct);
        currentTrade.profit = equity - (equity / (1 + currentTrade.profitPct)); 

        trades.push(currentTrade);
        currentTrade = null;
      }
    }

    // Check Entry (if no trade open)
    if (!currentTrade) {
      // Logic Entry
      if (strategy.entryLogic.children.length > 0) {
        if (evaluateNode(strategy.entryLogic, candle, prevCandle)) {
           currentTrade = {
            entryDate: candle.date,
            entryPrice: candle.close,
            type: 'LONG',
            status: 'OPEN'
          };
        }
      }
    }

    equityCurve.push({ date: candle.date, equity });
  }

  // Calculate Metrics
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const winRate = closedTrades.length > 0 
    ? closedTrades.filter(t => (t.profitPct || 0) > 0).length / closedTrades.length 
    : 0;
  
  const totalReturn = (equity - initialEquity) / initialEquity;
  
  let peak = initialEquity;
  let maxDrawdown = 0;
  equityCurve.forEach(p => {
    if (p.equity > peak) peak = p.equity;
    const dd = (peak - p.equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  const returns = equityCurve.map((e, i) => i === 0 ? 0 : (e.equity - equityCurve[i-1].equity) / equityCurve[i-1].equity);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
  const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); 

  return {
    trades: closedTrades,
    finalEquity: equity,
    initialEquity,
    metrics: {
      totalReturn,
      winRate,
      maxDrawdown,
      sharpeRatio,
      tradesCount: closedTrades.length
    },
    equityCurve
  };
};
