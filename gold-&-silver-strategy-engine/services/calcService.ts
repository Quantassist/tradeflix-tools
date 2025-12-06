
import { Candle, IndicatorConfig, IndicatorType, Asset } from '../types';

// --- Mock Data Generator (10 Years) ---
export const generateMockData = (asset: Asset, days: number = 3650): Candle[] => {
  const data: Candle[] = [];
  
  // Config based on asset
  let price = asset === 'GOLD' ? 1200 : 15; // Starting price ~10 years ago
  let usdinr = 60; // Starting USDINR ~10 years ago
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 10);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Asset Random Walk
    // Gold is slightly less volatile daily than Silver
    const volatility = asset === 'GOLD' ? 0.012 : 0.02; 
    const trend = 0.0002; // Slight upward bias over 10 years
    
    const change = 1 + (Math.random() * volatility * 2 - volatility) + trend;
    const open = price;
    const close = price * change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    // USDINR Random Walk (Correlated inversely sometimes, but generally drifting up)
    const fxChange = 1 + (Math.random() * 0.005 * 2 - 0.005) + 0.0001; 
    usdinr = usdinr * fxChange;

    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      usdinr: Number(usdinr.toFixed(2))
    });
    price = close;
  }
  return data;
};

// --- Indicators ---

const calculateSMA = (data: Candle[], period: number): number[] => {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
    sma[i] = sum / period;
  }
  return sma;
};

const calculateEMA = (data: Candle[], period: number): number[] => {
  const ema = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  
  // Initial SMA as first EMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  ema[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i].close * k) + (ema[i - 1] * (1 - k));
  }
  return ema;
};

const calculateRSI = (data: Candle[], period: number): number[] => {
  const rsi = new Array(data.length).fill(null);
  let gains = 0;
  let losses = 0;

  // First Avg Gain/Loss
  for (let i = 1; i < period + 1; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

    const rs = avgGain / avgLoss;
    rsi[i] = 100 - (100 / (1 + rs));
  }

  return rsi;
};

// Calculate Weekly CPR on daily data
// We simulate "Weekly" by taking every 5 candles as a block
const calculateWeeklyCPR = (data: Candle[]): { pivot: number[], tc: number[], bc: number[] } => {
    const pivot = new Array(data.length).fill(0);
    const tc = new Array(data.length).fill(0);
    const bc = new Array(data.length).fill(0);

    const DAYS_IN_WEEK = 5;

    for (let i = 0; i < data.length; i++) {
        // Find the start of the current "week" block
        // In a real app, use Date object. Here we use index modulo.
        const currentBlockStart = Math.floor(i / DAYS_IN_WEEK) * DAYS_IN_WEEK;
        
        // We need the PREVIOUS week's data to calculate THIS week's pivot
        const prevBlockStart = currentBlockStart - DAYS_IN_WEEK;

        if (prevBlockStart >= 0) {
            // Calculate High, Low, Close of the previous 5 days
            let prevHigh = -Infinity;
            let prevLow = Infinity;
            let prevClose = data[prevBlockStart + DAYS_IN_WEEK - 1].close; // Close of the last day of prev week

            for (let j = 0; j < DAYS_IN_WEEK; j++) {
                const idx = prevBlockStart + j;
                if (idx < data.length) {
                    if (data[idx].high > prevHigh) prevHigh = data[idx].high;
                    if (data[idx].low < prevLow) prevLow = data[idx].low;
                }
            }

            // Calculate Pivots
            const p = (prevHigh + prevLow + prevClose) / 3;
            const b = (prevHigh + prevLow) / 2; // Bottom Central
            const t = (p - b) + p; // Top Central

            pivot[i] = p;
            bc[i] = b;
            tc[i] = t;
        } else {
            // First week, no data, use current open/close as fallback
            pivot[i] = data[i].close;
            bc[i] = data[i].close;
            tc[i] = data[i].close;
        }
    }
    return { pivot, tc, bc };
};


// --- Augment Data with Indicators ---
export const calculateIndicators = (data: Candle[], configs: IndicatorConfig[]): Candle[] => {
  const enhancedData = JSON.parse(JSON.stringify(data)); // Deep copy

  // 1. Pre-populate basic derived columns for fast access
  enhancedData.forEach((candle: Candle, index: number) => {
     if (index > 0) {
       candle['PREV_HIGH'] = data[index - 1].high;
       candle['PREV_LOW'] = data[index - 1].low;
       candle['PREV_CLOSE'] = data[index - 1].close;
     } else {
       candle['PREV_HIGH'] = candle.high; // Fallback
       candle['PREV_LOW'] = candle.low;
     }
     candle['USDINR'] = candle.usdinr; // Expose as main key if needed
  });

  // 1b. Calculate CPR (Always calculate as they are fundamental to "Weekly" requirement)
  const { pivot, tc, bc } = calculateWeeklyCPR(data);
  enhancedData.forEach((candle: Candle, index: number) => {
      candle['CPR_PIVOT'] = pivot[index];
      candle['CPR_TC'] = tc[index];
      candle['CPR_BC'] = bc[index];
  });

  // 2. Calculate Technicals
  configs.forEach(config => {
    // Skip static types that are already on the candle or handled specially
    const STATIC_TYPES = [
        IndicatorType.PRICE, IndicatorType.OPEN, IndicatorType.HIGH, IndicatorType.LOW, IndicatorType.VOLUME, 
        IndicatorType.PREV_HIGH, IndicatorType.PREV_LOW, IndicatorType.USDINR,
        IndicatorType.CPR_PIVOT, IndicatorType.CPR_TC, IndicatorType.CPR_BC
    ];

    if (STATIC_TYPES.includes(config.type)) {
      return;
    }

    const key = `${config.type}_${config.period}`;
    let values: number[] = [];

    switch (config.type) {
      case IndicatorType.SMA:
        values = calculateSMA(data, config.period);
        break;
      case IndicatorType.EMA:
        values = calculateEMA(data, config.period);
        break;
      case IndicatorType.RSI:
        values = calculateRSI(data, config.period);
        break;
    }

    enhancedData.forEach((candle: Candle, index: number) => {
      candle[key] = values[index];
    });
  });

  return enhancedData;
};
