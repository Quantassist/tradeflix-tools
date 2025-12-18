export type HelpContentItem = {
  title: string
  description: string
  items: { label: string; explanation: string }[]
}

export const helpContent: Record<string, HelpContentItem> = {
  producerMerchant: {
    title: "Producer/Merchant Positions",
    description: "Commercial hedgers who produce or process the physical commodity. They typically hedge their business exposure.",
    items: [
      { label: "Long Positions", explanation: "Contracts betting on price increases - often hedging future production costs" },
      { label: "Short Positions", explanation: "Contracts betting on price decreases - often hedging inventory or future sales" },
      { label: "Net Position", explanation: "Long minus Short. Negative = net short (bearish hedge), Positive = net long (bullish hedge)" },
      { label: "Interpretation", explanation: "Commercials are considered 'smart money'. When they're heavily short, they expect lower prices. When long, they expect higher prices." },
    ]
  },
  swapDealer: {
    title: "Swap Dealer Positions",
    description: "Financial institutions that facilitate swaps and manage risk. They often take the opposite side of commercial hedgers.",
    items: [
      { label: "Role", explanation: "Swap dealers provide liquidity and risk transfer services to commercial clients" },
      { label: "Hedging", explanation: "Their positions often reflect the aggregate hedging needs of their clients" },
      { label: "Net Position", explanation: "Can indicate overall market hedging demand direction" },
    ]
  },
  managedMoney: {
    title: "Managed Money Positions",
    description: "Professional money managers including CTAs, hedge funds, and commodity pools. They are trend-followers and speculators.",
    items: [
      { label: "Speculative Nature", explanation: "These traders seek profit from price movements, not hedging" },
      { label: "Trend Following", explanation: "Managed money often follows trends - they buy in uptrends and sell in downtrends" },
      { label: "Contrarian Signal", explanation: "Extreme managed money positioning often precedes reversals. When they're all long, who's left to buy?" },
      { label: "Net Position", explanation: "Positive = bullish speculation, Negative = bearish speculation" },
    ]
  },
  otherReportables: {
    title: "Other Reportables",
    description: "Large traders that don't fit other categories - includes merchants, processors, and other commercial entities.",
    items: [
      { label: "Diverse Group", explanation: "This category includes various large traders with different motivations" },
      { label: "Less Predictive", explanation: "Due to mixed composition, signals are less clear than other categories" },
    ]
  },
  nonReportables: {
    title: "Non-Reportables",
    description: "Small traders whose positions fall below CFTC reporting thresholds. Often retail traders and small speculators.",
    items: [
      { label: "Small Traders", explanation: "Positions too small to require individual reporting to CFTC" },
      { label: "Retail Sentiment", explanation: "Often represents retail trader sentiment - historically a contrarian indicator" },
      { label: "Calculation", explanation: "Derived by subtracting all reportable positions from total open interest" },
      { label: "Contrarian Use", explanation: "When small traders are extremely bullish, it often signals a top. Extreme bearishness may signal a bottom." },
    ]
  },
  openInterest: {
    title: "Open Interest",
    description: "Total number of outstanding futures contracts that have not been settled or closed.",
    items: [
      { label: "Market Participation", explanation: "Higher OI = more market participation and liquidity" },
      { label: "Trend Confirmation", explanation: "Rising OI with rising price confirms bullish trend. Rising OI with falling price confirms bearish trend." },
      { label: "Trend Exhaustion", explanation: "Falling OI with price move suggests trend exhaustion - positions being closed" },
      { label: "Weekly Change", explanation: "Shows how much new money entered or exited the market this week" },
    ]
  },
  historicalPercentiles: {
    title: "Historical Percentile Rankings",
    description: "Compare current positioning across all trader categories against historical ranges.",
    items: [
      { label: "Percentile Rank", explanation: "Where current net position falls within the historical range (0-100%)" },
      { label: "Extreme Readings", explanation: "Above 80% or below 20% indicates historically extreme positioning" },
      { label: "Category Comparison", explanation: "Compare how different trader types are positioned relative to their own history" },
      { label: "Divergence Signals", explanation: "When categories show opposite extremes, significant moves often follow" },
    ]
  },
  sentimentGauges: {
    title: "Sentiment Gauges",
    description: "Visual representation of current positioning relative to historical levels over the past year.",
    items: [
      { label: "Percentile", explanation: "Shows where current net position ranks vs. the past 52 weeks. 90th percentile = more bullish than 90% of readings" },
      { label: "Extreme Bull (>80%)", explanation: "Positioning is very bullish historically - potential contrarian sell signal" },
      { label: "Extreme Bear (<20%)", explanation: "Positioning is very bearish historically - potential contrarian buy signal" },
      { label: "Neutral (40-60%)", explanation: "Positioning is near historical average - no strong signal" },
    ]
  },
  netPositionChart: {
    title: "Net Position Chart",
    description: "Historical net positions for each trader category over time.",
    items: [
      { label: "Managed Money (Blue)", explanation: "Speculator positioning - watch for extremes and divergences from price" },
      { label: "Commercial (Green)", explanation: "Hedger positioning - often moves opposite to price" },
      { label: "Divergences", explanation: "When commercials and specs diverge significantly, a reversal may be near" },
    ]
  },
  openInterestChart: {
    title: "Open Interest Chart",
    description: "Total number of outstanding contracts in the market.",
    items: [
      { label: "Rising OI + Rising Price", explanation: "New money entering - trend is strong and likely to continue" },
      { label: "Rising OI + Falling Price", explanation: "New shorts entering - bearish trend strengthening" },
      { label: "Falling OI + Rising Price", explanation: "Short covering rally - may not be sustainable" },
      { label: "Falling OI + Falling Price", explanation: "Long liquidation - bearish but may be exhausting" },
    ]
  },
  longShortChart: {
    title: "Long/Short Breakdown",
    description: "Separate view of long and short positions for managed money.",
    items: [
      { label: "Gross Longs", explanation: "Total long contracts held - shows bullish conviction" },
      { label: "Gross Shorts", explanation: "Total short contracts held - shows bearish conviction" },
      { label: "Ratio Analysis", explanation: "Long/Short ratio above 2 = very bullish, below 0.5 = very bearish" },
    ]
  },
  cotIndex: {
    title: "COT Index",
    description: "Normalized indicator showing current positioning relative to a historical range.",
    items: [
      { label: "Calculation", explanation: "(Current - Min) / (Max - Min) × 100, using 52-week lookback" },
      { label: "Above 80", explanation: "Extremely bullish positioning - contrarian bearish signal" },
      { label: "Below 20", explanation: "Extremely bearish positioning - contrarian bullish signal" },
      { label: "Best Use", explanation: "Combine with price action - look for divergences at extremes" },
    ]
  },
  crowdingScore: {
    title: "Crowding Score",
    description: "Measures how crowded or one-sided the market positioning has become.",
    items: [
      { label: "Score 0-100", explanation: "Higher scores indicate more crowded positioning with higher reversal risk" },
      { label: "Low (0-30)", explanation: "Balanced positioning - no significant crowding concerns" },
      { label: "Moderate (30-60)", explanation: "Some crowding detected - monitor for potential reversals" },
      { label: "High (60+)", explanation: "Significant crowding - elevated risk of sharp reversals when positions unwind" },
    ]
  },
  squeezeRiskScore: {
    title: "Squeeze Risk Score",
    description: "Vulnerability to forced position liquidation that could accelerate price moves.",
    items: [
      { label: "What It Measures", explanation: "Combines speculative positioning extremes with concentration to assess squeeze potential" },
      { label: "Low Risk (0-30)", explanation: "Positions are balanced and well-distributed" },
      { label: "Moderate (30-60)", explanation: "Some vulnerability exists - watch for catalysts" },
      { label: "High Risk (60+)", explanation: "Significant squeeze potential - forced liquidation could cause sharp moves" },
    ]
  },
  flowMomentum: {
    title: "Flow Momentum",
    description: "Measures the strength and consistency of recent position flows.",
    items: [
      { label: "Score Meaning", explanation: "Higher scores indicate stronger, more consistent directional flows" },
      { label: "Strong Momentum", explanation: "Sustained flows in one direction - trend likely to continue" },
      { label: "Weak Momentum", explanation: "Mixed or choppy flows - trend may be weakening" },
      { label: "Reversal Signal", explanation: "Momentum diverging from price can signal upcoming reversals" },
    ]
  },
  currentRegime: {
    title: "Current Market Regime",
    description: "Classification of the current market environment based on positioning patterns.",
    items: [
      { label: "Trend Following", explanation: "Specs aligned with trend - momentum strategies work best" },
      { label: "Mean Reversion", explanation: "Extreme positioning - contrarian/reversal strategies favored" },
      { label: "Accumulation", explanation: "Smart money quietly building positions - early trend stage" },
      { label: "Distribution", explanation: "Smart money selling to specs - late trend stage, potential top" },
      { label: "Confidence", explanation: "How certain the classification is based on positioning signals" },
    ]
  },
  squeezeRisk: {
    title: "Squeeze Risk Analysis",
    description: "Measures the potential for forced position liquidation that could accelerate price moves.",
    items: [
      { label: "Long Squeeze Risk", explanation: "Risk of longs being forced to sell. High when specs are heavily long with concentrated positions" },
      { label: "Short Squeeze Risk", explanation: "Risk of shorts being forced to cover. High when specs are heavily short with concentrated positions" },
      { label: "Spec Factor", explanation: "How extreme is speculative positioning relative to history" },
      { label: "Concentration", explanation: "How concentrated are positions among few traders - higher = more squeeze risk" },
      { label: "Score 0-100", explanation: "0-30 = Low risk, 30-60 = Moderate, 60-80 = High, 80+ = Extreme" },
    ]
  },
  flowDecomposition: {
    title: "Flow Decomposition",
    description: "Breaks down weekly position changes into actionable flow components.",
    items: [
      { label: "New Longs", explanation: "Fresh buying - aggressive bullish positioning" },
      { label: "Long Liquidation", explanation: "Longs exiting - profit taking or stop losses hit" },
      { label: "New Shorts", explanation: "Fresh selling - aggressive bearish positioning" },
      { label: "Short Covering", explanation: "Shorts exiting - can fuel rallies if large" },
      { label: "Dominant Flow", explanation: "The largest component tells you what's driving the market this week" },
    ]
  },
  concentration: {
    title: "Position Concentration",
    description: "Measures how concentrated positions are among the largest traders.",
    items: [
      { label: "Top 4 Concentration", explanation: "% of positions held by 4 largest traders. Above 50% = highly concentrated" },
      { label: "Top 8 Concentration", explanation: "% of positions held by 8 largest traders" },
      { label: "High Concentration Risk", explanation: "When few traders hold most positions, their exit can move markets dramatically" },
      { label: "HHI Score", explanation: "Herfindahl-Hirschman Index - higher = more concentrated" },
    ]
  },
  curveAnalysis: {
    title: "Curve Structure Analysis",
    description: "Analyzes positioning across different contract maturities.",
    items: [
      { label: "Front Month", explanation: "Near-term contracts - often reflect immediate supply/demand" },
      { label: "Back Months", explanation: "Deferred contracts - reflect longer-term expectations" },
      { label: "Contango", explanation: "Back months higher than front - normal for most commodities" },
      { label: "Backwardation", explanation: "Front months higher - indicates tight supply or strong demand" },
    ]
  },
  spreadAnalysis: {
    title: "Spread vs Directional",
    description: "Distinguishes between outright directional bets and spread/arbitrage positions.",
    items: [
      { label: "Directional", explanation: "Pure long or short bets on price direction" },
      { label: "Spread Positions", explanation: "Positions that profit from price relationships, not direction" },
      { label: "High Spread Ratio", explanation: "More sophisticated positioning - less directional conviction" },
      { label: "Low Spread Ratio", explanation: "Strong directional conviction in the market" },
    ]
  },
  herdingAnalysis: {
    title: "Herding Analysis",
    description: "Measures whether traders are moving together or diverging.",
    items: [
      { label: "Herding Score", explanation: "How aligned are different trader categories - high = everyone betting same way" },
      { label: "High Herding Risk", explanation: "When everyone is positioned the same way, reversals can be violent" },
      { label: "Divergence", explanation: "When categories disagree - often precedes trend changes" },
    ]
  },
  mlRegime: {
    title: "ML Regime Classification",
    description: "Machine learning-based classification of current market regime.",
    items: [
      { label: "Trend Following", explanation: "Specs aligned with trend - momentum strategies work" },
      { label: "Mean Reversion", explanation: "Extreme positioning - reversal strategies favored" },
      { label: "Accumulation", explanation: "Smart money building positions quietly" },
      { label: "Distribution", explanation: "Smart money selling to specs - potential top" },
      { label: "Confidence", explanation: "How certain the model is about the classification" },
    ]
  },
  volatilityRegime: {
    title: "COT-Implied Volatility",
    description: "Uses positioning data to infer expected market volatility.",
    items: [
      { label: "Gross Positions", explanation: "Total long + short across all categories - high = active market" },
      { label: "Spread Ratio", explanation: "Higher spread activity often precedes volatility" },
      { label: "Vol Regime", explanation: "Low/Normal/Elevated/High based on positioning metrics" },
      { label: "Vol Skew", explanation: "Whether volatility expectations favor upside or downside moves" },
    ]
  },
  crossMarket: {
    title: "Cross-Market Pressure",
    description: "Compares speculative pressure across all commodities to identify crowded trades.",
    items: [
      { label: "Spec Pressure", explanation: "(Managed Money Net - Commercial Net) / Open Interest" },
      { label: "Most Crowded Long", explanation: "Commodities where specs are most bullish - contrarian sell candidates" },
      { label: "Most Crowded Short", explanation: "Commodities where specs are most bearish - contrarian buy candidates" },
      { label: "Rotation Signals", explanation: "Where money is flowing into/out of across commodities" },
    ]
  },
  extremeAlerts: {
    title: "Extreme Positioning Alerts",
    description: "Notifications when positioning reaches historically extreme levels.",
    items: [
      { label: "Extreme Long Alert", explanation: "Net position in top 10% of historical range - potential reversal zone" },
      { label: "Extreme Short Alert", explanation: "Net position in bottom 10% of historical range - potential reversal zone" },
      { label: "Action", explanation: "Don't trade against the trend immediately - wait for confirmation" },
      { label: "Best Use", explanation: "Combine with technical analysis for timing entries" },
    ]
  },
  tradingSignal: {
    title: "Trading Signal",
    description: "Composite signal based on multiple COT factors.",
    items: [
      { label: "Signal Types", explanation: "Strong Buy/Buy/Neutral/Sell/Strong Sell based on positioning" },
      { label: "Confidence", explanation: "How many factors align - High/Medium/Low" },
      { label: "Contrarian Basis", explanation: "Signals are contrarian - extreme bullish positioning = sell signal" },
      { label: "Timing", explanation: "COT signals are weekly - best for swing/position trading, not day trading" },
    ]
  },
}
