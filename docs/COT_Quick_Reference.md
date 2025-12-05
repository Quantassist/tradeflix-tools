# COT Report Visualizer - Quick Reference Card

## 🎯 At a Glance

| Feature | Purpose | Key Insight |
|---------|---------|-------------|
| **Position Breakdown** | See who's long/short | Track smart money vs speculators |
| **Sentiment Gauges** | Historical context | Extremes signal reversals |
| **Squeeze Risk** | Liquidation potential | High risk = volatile moves ahead |
| **Flow Decomposition** | Weekly changes | What's driving the market now |
| **ML Regime** | Market classification | Adapt strategy to environment |

---

## 📊 Trader Categories Cheat Sheet

| Category | Who They Are | What to Watch |
|----------|--------------|---------------|
| 🏭 **Commercials** | Producers, hedgers | Smart money - follow at extremes |
| 💼 **Managed Money** | Hedge funds, CTAs | Contrarian indicator at extremes |
| 🏦 **Swap Dealers** | Banks, institutions | Reflects hedging demand |
| 👥 **Other Reportables** | Large misc. traders | Less predictive |
| 🧑‍💻 **Non-Reportables** | Retail traders | Often wrong at extremes |

---

## 🚦 Signal Interpretation

### Percentile Zones

```
0%  ←──────────────────────────────────────────→ 100%
    │ EXTREME  │  BEARISH │ NEUTRAL │ BULLISH │ EXTREME │
    │  BEAR    │          │         │         │  BULL   │
    └──────────┴──────────┴─────────┴─────────┴─────────┘
         ↑                                          ↑
    BUY ZONE                                   SELL ZONE
    (Contrarian)                              (Contrarian)
```

### Quick Decision Matrix

| Managed Money | Commercials | Signal |
|---------------|-------------|--------|
| >90% (Extreme Bull) | <10% (Extreme Bear) | 🔴 **STRONG SELL** |
| >75% (Bullish) | <25% (Bearish) | 🟠 **SELL** |
| 40-60% (Neutral) | 40-60% (Neutral) | ⚪ **NEUTRAL** |
| <25% (Bearish) | >75% (Bullish) | 🟢 **BUY** |
| <10% (Extreme Bear) | >90% (Extreme Bull) | 🟢 **STRONG BUY** |

---

## 📈 Chart Patterns to Watch

### 1. Divergence Pattern (High Probability Reversal)
```
Managed Money: ████████████████████ 95%
Commercials:   ██                   5%
               ↓
         REVERSAL LIKELY
```

### 2. Alignment Pattern (Trend Continuation)
```
Managed Money: ████████████████ 80%
Commercials:   ████████████     60%
               ↓
         TREND CONTINUES
```

### 3. Crossover Pattern (Trend Change)
```
Before: MM > Comm
After:  MM < Comm
        ↓
   TREND CHANGING
```

---

## ⚠️ Risk Scores

### Squeeze Risk (0-100)

| Score | Level | Action |
|-------|-------|--------|
| 0-30 | 🟢 Low | Normal trading |
| 30-60 | 🟡 Moderate | Monitor closely |
| 60-80 | 🟠 High | Reduce size |
| 80-100 | 🔴 Extreme | Contrarian opportunity |

### Crowding Score (0-100)

| Score | Level | Meaning |
|-------|-------|---------|
| 0-30 | 🟢 Low | Balanced market |
| 30-60 | 🟡 Moderate | Some crowding |
| 60+ | 🔴 High | Reversal risk elevated |

---

## 🔄 Flow Types Explained

| Flow | Color | Meaning | Implication |
|------|-------|---------|-------------|
| New Longs | 🟢 | Fresh buying | Bullish |
| Long Liquidation | 🔴 | Longs exiting | Profit taking |
| New Shorts | 🔴 | Fresh selling | Bearish |
| Short Covering | 🟢 | Shorts exiting | Can fuel rallies |

**Dominant Flow** = Largest component = What's driving the market

---

## 🎭 Market Regimes

| Regime | Description | Best Strategy |
|--------|-------------|---------------|
| 📈 **Trend Following** | Specs aligned with trend | Momentum, breakouts |
| 🔄 **Mean Reversion** | Extreme positioning | Contrarian, fades |
| 📥 **Accumulation** | Smart money building | Early trend entry |
| 📤 **Distribution** | Smart money selling | Exit longs, prepare short |
| 〰️ **Choppy** | No clear pattern | Reduce size, wait |

---

## 🔔 Alert Triggers

| Alert Type | Trigger | Priority |
|------------|---------|----------|
| Extreme Long | >90th percentile | 🔴 High |
| Extreme Short | <10th percentile | 🔴 High |
| Squeeze Risk | Score >70 | 🟠 Medium |
| Smart Money Alignment | Rare convergence | 🔴 High |
| Overcrowding | MM + Retail both extreme | 🟠 Medium |

---

## 📅 Data Schedule

| Event | When |
|-------|------|
| CFTC Release | Friday 3:30 PM ET |
| Data As Of | Previous Tuesday |
| Best Trading Window | Monday-Wednesday |

---

## ✅ Pre-Trade Checklist

Before taking a COT-based trade:

- [ ] Check percentile extremes (>90 or <10)
- [ ] Verify commercial/spec divergence
- [ ] Review squeeze risk score
- [ ] Check flow decomposition
- [ ] Confirm with price action
- [ ] Set appropriate stop loss
- [ ] Size position for weekly timeframe

---

## 🚫 Common Mistakes

1. ❌ Trading COT signals without price confirmation
2. ❌ Using COT for day trading (it's weekly data)
3. ❌ Ignoring the trend and only trading contrarian
4. ❌ Not waiting for extreme readings
5. ❌ Over-sizing positions on COT signals alone

---

## 💡 Pro Tips

1. **Best signals** come at 90th/10th percentile extremes
2. **Commercials are right** at major turning points
3. **Managed Money is wrong** at extremes (contrarian)
4. **Rising OI + Rising Price** = Strong trend
5. **Divergence** between categories = Reversal setup
6. **Weekly changes** matter as much as absolute levels

---

*Quick Reference v1.0 | COT Report Visualizer | Tradeflix Tools*
