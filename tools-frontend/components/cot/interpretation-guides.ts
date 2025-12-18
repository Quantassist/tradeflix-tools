export type InterpretationGuide = {
  title: string
  subtitle: string
  sections: {
    title: string
    icon: string
    color: string
    items: { term: string; meaning: string; signal?: string }[]
  }[]
  quickReference: { condition: string; interpretation: string; action: string }[]
  proTips: string[]
}

export const tabInterpretationGuides: Record<string, InterpretationGuide> = {
  positions: {
    title: "Positions Tab Interpretation Guide",
    subtitle: "Understanding trader category positions and what they mean for market direction",
    sections: [
      {
        title: "Producer/Merchant (Commercials)",
        icon: "🏭",
        color: "blue",
        items: [
          { term: "Net Long", meaning: "Commercials buying to hedge future purchases", signal: "Bullish - they expect higher prices" },
          { term: "Net Short", meaning: "Commercials selling to hedge inventory/production", signal: "Bearish - they expect lower prices" },
          { term: "Extreme Short (>90th %ile)", meaning: "Maximum hedging activity", signal: "Often marks price TOPS - contrarian sell" },
          { term: "Extreme Long (<10th %ile)", meaning: "Unusual bullish hedging", signal: "Often marks price BOTTOMS - contrarian buy" },
        ]
      },
      {
        title: "Managed Money (Speculators)",
        icon: "💼",
        color: "orange",
        items: [
          { term: "Net Long", meaning: "Hedge funds/CTAs betting on higher prices", signal: "Trend is up, but watch for crowding" },
          { term: "Net Short", meaning: "Speculators betting on lower prices", signal: "Trend is down, but watch for squeeze" },
          { term: "Extreme Long (>90th %ile)", meaning: "Everyone is bullish", signal: "CONTRARIAN SELL - who's left to buy?" },
          { term: "Extreme Short (<10th %ile)", meaning: "Everyone is bearish", signal: "CONTRARIAN BUY - capitulation signal" },
        ]
      },
      {
        title: "Swap Dealers",
        icon: "🏦",
        color: "purple",
        items: [
          { term: "Net Position", meaning: "Reflects aggregate client hedging needs", signal: "Less predictive than Commercials" },
          { term: "Large Changes", meaning: "Institutional flow shifting", signal: "Monitor for trend confirmation" },
        ]
      },
      {
        title: "Open Interest",
        icon: "📊",
        color: "green",
        items: [
          { term: "Rising OI + Rising Price", meaning: "New longs entering", signal: "BULLISH - trend is strong" },
          { term: "Rising OI + Falling Price", meaning: "New shorts entering", signal: "BEARISH - trend is strong" },
          { term: "Falling OI + Rising Price", meaning: "Shorts covering", signal: "WEAK RALLY - may not sustain" },
          { term: "Falling OI + Falling Price", meaning: "Longs liquidating", signal: "EXHAUSTION - bottom may be near" },
        ]
      },
    ],
    quickReference: [
      { condition: "MM >90% + Comm <10%", interpretation: "Classic top formation", action: "Prepare to sell/short" },
      { condition: "MM <10% + Comm >90%", interpretation: "Classic bottom formation", action: "Prepare to buy/long" },
      { condition: "All categories aligned", interpretation: "Strong trend in progress", action: "Trade with trend" },
      { condition: "Weekly change >2 std dev", interpretation: "Significant repositioning", action: "Watch for reversal" },
    ],
    proTips: [
      "Commercials are the 'smart money' - they know their industry",
      "Managed Money extremes are contrarian signals",
      "Weekly changes matter as much as absolute levels",
      "Combine with price action for timing",
    ]
  },
  sentiment: {
    title: "Sentiment Tab Interpretation Guide",
    subtitle: "Reading market sentiment through positioning percentiles and gauges",
    sections: [
      {
        title: "Percentile Rankings",
        icon: "📈",
        color: "blue",
        items: [
          { term: "0-10th Percentile", meaning: "Extreme bearish positioning", signal: "CONTRARIAN BUY zone" },
          { term: "10-25th Percentile", meaning: "Bearish positioning", signal: "Cautiously bullish" },
          { term: "25-75th Percentile", meaning: "Neutral positioning", signal: "No strong signal" },
          { term: "75-90th Percentile", meaning: "Bullish positioning", signal: "Cautiously bearish" },
          { term: "90-100th Percentile", meaning: "Extreme bullish positioning", signal: "CONTRARIAN SELL zone" },
        ]
      },
      {
        title: "Sentiment Gauge Reading",
        icon: "🎯",
        color: "orange",
        items: [
          { term: "Gauge in Green Zone", meaning: "Bearish extreme (0-20%)", signal: "Potential buying opportunity" },
          { term: "Gauge in Yellow Zone", meaning: "Neutral (20-80%)", signal: "Wait for extremes" },
          { term: "Gauge in Red Zone", meaning: "Bullish extreme (80-100%)", signal: "Potential selling opportunity" },
        ]
      },
      {
        title: "Category Divergences",
        icon: "⚡",
        color: "amber",
        items: [
          { term: "MM vs Comm Divergence", meaning: "Speculators and hedgers disagree", signal: "HIGH PROBABILITY reversal setup" },
          { term: "All Categories Same Direction", meaning: "Market consensus", signal: "Trend likely to continue" },
          { term: "Rapid Percentile Change", meaning: "Fast repositioning", signal: "Momentum shift underway" },
        ]
      },
    ],
    quickReference: [
      { condition: "MM Gauge in Red + Comm Gauge in Green", interpretation: "Maximum divergence", action: "Strong contrarian sell" },
      { condition: "MM Gauge in Green + Comm Gauge in Red", interpretation: "Maximum divergence", action: "Strong contrarian buy" },
      { condition: "All gauges near 50%", interpretation: "Balanced market", action: "Wait for extremes" },
      { condition: "Gauge moved 30%+ in one week", interpretation: "Rapid sentiment shift", action: "Watch for continuation" },
    ],
    proTips: [
      "Best signals come at 90th/10th percentile extremes",
      "Divergence between categories is more powerful than absolute levels",
      "Historical percentiles are based on 52-week lookback",
      "Sentiment extremes can persist - wait for price confirmation",
    ]
  },
  charts: {
    title: "Charts Tab Interpretation Guide",
    subtitle: "Visual analysis of historical positioning patterns and trends",
    sections: [
      {
        title: "Net Position Chart Patterns",
        icon: "📉",
        color: "blue",
        items: [
          { term: "Divergence Pattern", meaning: "Commercials and MM moving opposite directions", signal: "REVERSAL likely within 2-4 weeks" },
          { term: "Convergence Pattern", meaning: "All categories moving same direction", signal: "Strong trend - trade with it" },
          { term: "Crossover", meaning: "MM crosses above/below Commercial line", signal: "Trend change signal" },
          { term: "Extreme Spread", meaning: "Maximum gap between MM and Comm", signal: "Peak divergence - reversal imminent" },
        ]
      },
      {
        title: "Long vs Short Analysis",
        icon: "📊",
        color: "green",
        items: [
          { term: "Gross Long Increasing", meaning: "New buying pressure", signal: "Bullish momentum" },
          { term: "Gross Short Increasing", meaning: "New selling pressure", signal: "Bearish momentum" },
          { term: "Both Increasing", meaning: "Active two-way market", signal: "High conviction on both sides" },
          { term: "Both Decreasing", meaning: "Positions being closed", signal: "Trend exhaustion" },
        ]
      },
      {
        title: "Open Interest Trends",
        icon: "📈",
        color: "purple",
        items: [
          { term: "OI Uptrend", meaning: "New money entering market", signal: "Trend has conviction" },
          { term: "OI Downtrend", meaning: "Money leaving market", signal: "Trend losing steam" },
          { term: "OI Spike", meaning: "Sudden large positioning", signal: "Major move may follow" },
          { term: "OI at Extremes", meaning: "Historical high/low participation", signal: "Watch for reversal" },
        ]
      },
    ],
    quickReference: [
      { condition: "MM peaks while Comm troughs", interpretation: "Classic reversal setup", action: "Prepare for trend change" },
      { condition: "OI rising with price", interpretation: "Healthy uptrend", action: "Stay long, trail stops" },
      { condition: "OI falling with price rising", interpretation: "Short covering rally", action: "Don't chase - weak rally" },
      { condition: "Sharp OI drop after extreme", interpretation: "Capitulation", action: "Look for reversal entry" },
    ],
    proTips: [
      "Look for divergences at price extremes",
      "OI confirms trend strength - always check it",
      "Weekly chart patterns are more reliable than daily",
      "Combine chart patterns with percentile readings",
    ]
  },
  analysis: {
    title: "Analysis Tab Interpretation Guide",
    subtitle: "Deep dive into COT Index, OI analysis, and historical patterns",
    sections: [
      {
        title: "COT Index Reading",
        icon: "🎯",
        color: "purple",
        items: [
          { term: "COT Index 0-20", meaning: "Current position near 52-week low", signal: "BEARISH EXTREME - contrarian buy" },
          { term: "COT Index 20-40", meaning: "Below average positioning", signal: "Mildly bearish" },
          { term: "COT Index 40-60", meaning: "Average positioning", signal: "Neutral - no signal" },
          { term: "COT Index 60-80", meaning: "Above average positioning", signal: "Mildly bullish" },
          { term: "COT Index 80-100", meaning: "Current position near 52-week high", signal: "BULLISH EXTREME - contrarian sell" },
        ]
      },
      {
        title: "OI Trend Signals",
        icon: "📊",
        color: "green",
        items: [
          { term: "Bullish Trend Strong", meaning: "Rising OI + Rising MM net", signal: "New longs driving market up" },
          { term: "Bearish Trend Strong", meaning: "Rising OI + Falling MM net", signal: "New shorts driving market down" },
          { term: "Short Covering Rally", meaning: "Falling OI + Rising MM net", signal: "Rally may not sustain" },
          { term: "Long Liquidation", meaning: "Falling OI + Falling MM net", signal: "Decline may be exhausting" },
        ]
      },
      {
        title: "Case Study Patterns",
        icon: "📚",
        color: "amber",
        items: [
          { term: "Classic Top", meaning: "MM >90%, Comm <10%, price at highs", signal: "High probability reversal down" },
          { term: "Classic Bottom", meaning: "MM <10%, Comm >90%, price at lows", signal: "High probability reversal up" },
          { term: "Smart Money Alignment", meaning: "Comm covering + MM adding same direction", signal: "Rare but powerful signal" },
          { term: "Overcrowding", meaning: "MM + Small traders both extreme", signal: "Maximum contrarian opportunity" },
        ]
      },
    ],
    quickReference: [
      { condition: "COT Index >80 for MM", interpretation: "Speculators extremely bullish", action: "Look for sell signals" },
      { condition: "COT Index <20 for Comm", interpretation: "Commercials extremely bearish", action: "Confirms sell signal" },
      { condition: "OI Signal = Long Liquidation", interpretation: "Selling pressure exhausting", action: "Watch for bottom" },
      { condition: "All COT Indices near 50", interpretation: "Balanced market", action: "Wait for extremes" },
    ],
    proTips: [
      "COT Index normalizes data for easy comparison",
      "Color coding: Green = buy zone, Red = sell zone",
      "Historical case studies show typical outcomes",
      "Combine COT Index with OI signals for confirmation",
    ]
  },
  advanced: {
    title: "Advanced Analytics Interpretation Guide",
    subtitle: "Professional-grade metrics for sophisticated COT analysis",
    sections: [
      {
        title: "Summary Scores",
        icon: "📊",
        color: "blue",
        items: [
          { term: "Crowding Score 0-30", meaning: "Balanced positioning", signal: "Normal market conditions" },
          { term: "Crowding Score 30-60", meaning: "Some concentration", signal: "Monitor for reversals" },
          { term: "Crowding Score 60+", meaning: "Highly crowded trade", signal: "HIGH REVERSAL RISK" },
          { term: "Squeeze Risk 60+", meaning: "Vulnerable to forced liquidation", signal: "Expect volatile moves" },
          { term: "Flow Momentum High", meaning: "Strong consistent flows", signal: "Trend likely to continue" },
        ]
      },
      {
        title: "Market Regimes",
        icon: "🎭",
        color: "purple",
        items: [
          { term: "Trend Following", meaning: "Specs aligned with trend", signal: "Use momentum strategies" },
          { term: "Mean Reversion", meaning: "Extreme positioning", signal: "Use contrarian strategies" },
          { term: "Accumulation", meaning: "Smart money building quietly", signal: "Early trend - position early" },
          { term: "Distribution", meaning: "Smart money selling to specs", signal: "Late trend - prepare to exit" },
        ]
      },
      {
        title: "Flow Decomposition",
        icon: "🔄",
        color: "green",
        items: [
          { term: "New Longs Dominant", meaning: "Fresh buying pressure", signal: "Bullish conviction" },
          { term: "Long Liquidation Dominant", meaning: "Longs exiting", signal: "Profit taking or stops hit" },
          { term: "New Shorts Dominant", meaning: "Fresh selling pressure", signal: "Bearish conviction" },
          { term: "Short Covering Dominant", meaning: "Shorts exiting", signal: "Can fuel sharp rallies" },
        ]
      },
      {
        title: "Squeeze & Concentration",
        icon: "⚠️",
        color: "red",
        items: [
          { term: "Long Squeeze Risk High", meaning: "Longs vulnerable", signal: "Sharp decline possible" },
          { term: "Short Squeeze Risk High", meaning: "Shorts vulnerable", signal: "Sharp rally possible" },
          { term: "Top 4 Concentration >50%", meaning: "Few traders hold most positions", signal: "Their exit = big move" },
          { term: "Herding Score >70", meaning: "Everyone betting same way", signal: "Reversal risk elevated" },
        ]
      },
    ],
    quickReference: [
      { condition: "Crowding >60 + Squeeze >60", interpretation: "Extreme risk", action: "Reduce position size" },
      { condition: "Regime = Mean Reversion", interpretation: "Contrarian opportunity", action: "Fade the crowd" },
      { condition: "Flow = New Longs + OI Rising", interpretation: "Strong bullish conviction", action: "Stay with trend" },
      { condition: "Herding >70 + MM Extreme", interpretation: "Maximum crowding", action: "Prepare for reversal" },
    ],
    proTips: [
      "Advanced metrics are most useful at extremes",
      "Regime classification helps choose strategy type",
      "Flow decomposition shows what's driving the market NOW",
      "Combine multiple metrics for higher confidence",
    ]
  },
  alerts: {
    title: "Alerts Tab Interpretation Guide",
    subtitle: "Understanding and acting on COT positioning alerts",
    sections: [
      {
        title: "Extreme Positioning Alerts",
        icon: "🚨",
        color: "red",
        items: [
          { term: "Extreme Long Alert", meaning: "Category >90th percentile net long", signal: "Potential top forming" },
          { term: "Extreme Short Alert", meaning: "Category <10th percentile net short", signal: "Potential bottom forming" },
          { term: "Percentile Value", meaning: "How extreme the positioning is", signal: "Higher = more extreme" },
          { term: "Deviation %", meaning: "How far from average", signal: "Larger = stronger signal" },
        ]
      },
      {
        title: "Alert Categories",
        icon: "📋",
        color: "amber",
        items: [
          { term: "Managed Money Alert", meaning: "Speculator positioning extreme", signal: "CONTRARIAN signal" },
          { term: "Commercial Alert", meaning: "Hedger positioning extreme", signal: "SMART MONEY signal" },
          { term: "Divergence Alert", meaning: "Categories at opposite extremes", signal: "HIGH PROBABILITY reversal" },
          { term: "Squeeze Risk Alert", meaning: "Forced liquidation likely", signal: "Expect volatility" },
        ]
      },
      {
        title: "Acting on Alerts",
        icon: "✅",
        color: "green",
        items: [
          { term: "Don't Trade Immediately", meaning: "Alerts are early warnings", signal: "Wait for price confirmation" },
          { term: "Check Multiple Alerts", meaning: "More alerts = stronger signal", signal: "Confluence is key" },
          { term: "Review Historical Context", meaning: "See what happened before", signal: "Learn from patterns" },
          { term: "Set Price Alerts", meaning: "Combine with technical levels", signal: "Better timing" },
        ]
      },
    ],
    quickReference: [
      { condition: "MM Extreme Long + Comm Extreme Short", interpretation: "Classic top setup", action: "Prepare short positions" },
      { condition: "MM Extreme Short + Comm Extreme Long", interpretation: "Classic bottom setup", action: "Prepare long positions" },
      { condition: "Multiple categories alerting", interpretation: "Strong signal", action: "Higher conviction trade" },
      { condition: "Alert + Price at key level", interpretation: "Confluence", action: "Consider entry" },
    ],
    proTips: [
      "Alerts are early warnings, not immediate trade signals",
      "Best alerts combine positioning + price extremes",
      "Check suggested action for each alert",
      "Track alert accuracy over time to calibrate",
    ]
  },
}
