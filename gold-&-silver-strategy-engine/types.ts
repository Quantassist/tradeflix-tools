
export type Asset = 'GOLD' | 'SILVER';

export enum IndicatorType {
  SMA = 'SMA',
  EMA = 'EMA',
  RSI = 'RSI',
  PRICE = 'PRICE', // Current Close
  OPEN = 'OPEN',
  HIGH = 'HIGH',
  LOW = 'LOW',
  VOLUME = 'VOLUME',
  PREV_HIGH = 'PREV_HIGH',
  PREV_LOW = 'PREV_LOW',
  USDINR = 'USDINR', // External asset correlation
  CPR_PIVOT = 'CPR_PIVOT', // Central Pivot Range - Pivot
  CPR_TC = 'CPR_TC', // Central Pivot Range - Top
  CPR_BC = 'CPR_BC' // Central Pivot Range - Bottom
}

export enum Comparator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUALS = '==',
  CROSSES_ABOVE = 'CROSS_ABOVE',
  CROSSES_BELOW = 'CROSS_BELOW'
}

export interface IndicatorConfig {
  type: IndicatorType;
  period: number; // e.g., 14 for RSI, 20 for SMA
  source?: 'close' | 'open' | 'high' | 'low';
}

export interface Condition {
  id: string;
  type: 'CONDITION';
  left: IndicatorConfig;
  comparator: Comparator;
  right: IndicatorConfig; 
  value?: number; // Optional static value override
}

export interface LogicGroup {
  id: string;
  type: 'GROUP';
  operator: 'AND' | 'OR';
  children: (Condition | LogicGroup)[];
}

export type StrategyNode = Condition | LogicGroup;

export interface Strategy {
  id: string;
  name: string;
  asset: Asset;
  entryLogic: LogicGroup;
  exitLogic: LogicGroup;
  stopLossPct: number;
  takeProfitPct: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  usdinr?: number; // Correlated asset
  [key: string]: string | number | undefined;
}

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  profit?: number;
  profitPct?: number;
  type: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
}

export interface BacktestResult {
  trades: Trade[];
  finalEquity: number;
  initialEquity: number;
  metrics: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    tradesCount: number;
  };
  equityCurve: { date: string; equity: number }[];
}
