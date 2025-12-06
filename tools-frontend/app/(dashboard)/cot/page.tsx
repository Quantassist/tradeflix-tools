"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart3, TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowRight, Info, Activity,
  Users, Building2, Briefcase, AlertTriangle, Target, RefreshCw
} from "lucide-react"
import { cotApi } from "@/lib/api/cot"
import type {
  DisaggCOTAnalysisResponse,
  COTChartDataResponse,
  ExtremePositioningAlert,
  COTTradingSignal,
  AvailableCommodity,
  SentimentLevel,
  CategoryPercentile,
  FlowDecompositionResponse,
  ConcentrationResponse,
  SqueezeRiskResponse,
  AdvancedCOTSummary,
  CurveAnalysisResponse,
  SpreadAnalysisResponse,
  HerdingAnalysisResponse,
  CrossMarketPressureResponse,
  VolatilityAnalysisResponse,
  MLRegimeAnalysisResponse
} from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import { Clock, Calendar, BookOpen, Gauge, TrendingUp as TrendUp, Brain, Zap, Globe, HelpCircle } from "lucide-react"

// Sentiment color mapping
const getSentimentColor = (sentiment: SentimentLevel) => {
  switch (sentiment) {
    case "extreme_bull": return "bg-red-100 text-red-700 border-red-300"
    case "bullish": return "bg-orange-100 text-orange-700 border-orange-300"
    case "neutral": return "bg-gray-100 text-gray-700 border-gray-300"
    case "bearish": return "bg-blue-100 text-blue-700 border-blue-300"
    case "extreme_bear": return "bg-green-100 text-green-700 border-green-300"
    default: return "bg-gray-100 text-gray-700 border-gray-300"
  }
}

const getSentimentLabel = (sentiment: SentimentLevel) => {
  switch (sentiment) {
    case "extreme_bull": return "Extreme Bull"
    case "bullish": return "Bullish"
    case "neutral": return "Neutral"
    case "bearish": return "Bearish"
    case "extreme_bear": return "Extreme Bear"
    default: return sentiment
  }
}

const getSignalColor = (signal: string) => {
  if (signal === "strong_buy" || signal === "buy") return "text-green-600 bg-green-50 border-green-200"
  if (signal === "strong_sell" || signal === "sell") return "text-red-600 bg-red-50 border-red-200"
  return "text-gray-600 bg-gray-50 border-gray-200"
}

// Category icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Producer/Merchant": return <Building2 className="h-4 w-4" />
    case "Swap Dealer": return <Briefcase className="h-4 w-4" />
    case "Managed Money": return <Target className="h-4 w-4" />
    case "Other Reportables": return <Users className="h-4 w-4" />
    default: return <Users className="h-4 w-4" />
  }
}

// Percentile gauge component
function PercentileGauge({ percentile, label }: { percentile: CategoryPercentile; label: string }) {
  const getPercentileZone = (pct: number) => {
    if (pct <= 20) return { color: "bg-green-500", zone: "Extremely Bearish" }
    if (pct <= 40) return { color: "bg-blue-500", zone: "Below Average" }
    if (pct <= 60) return { color: "bg-gray-400", zone: "Neutral" }
    if (pct <= 80) return { color: "bg-orange-500", zone: "Above Average" }
    return { color: "bg-red-500", zone: "Extremely Bullish" }
  }

  const { color, zone } = getPercentileZone(percentile.percentile_1y)

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getCategoryIcon(label)}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge className={getSentimentColor(percentile.sentiment)}>
          {getSentimentLabel(percentile.sentiment)}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Net: {formatNumber(percentile.current_net, 0)}</span>
          <span>{percentile.percentile_1y.toFixed(1)}th percentile</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full ${color} transition-all duration-500`}
            style={{ width: `${percentile.percentile_1y}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-600">Bearish</span>
          <span className="text-muted-foreground">{zone}</span>
          <span className="text-red-600">Bullish</span>
        </div>
        {percentile.is_extreme && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Extreme positioning detected</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Help content for each section
const helpContent: Record<string, { title: string; description: string; items: { label: string; explanation: string }[] }> = {
  // Positions Tab
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
  // Sentiment Tab
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
  // Charts Tab
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
  // Analysis Tab
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
  // Advanced Tab - Summary Cards
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
  // Alerts Tab
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

// Tab Interpretation Guides - Comprehensive reference for each tab
const tabInterpretationGuides: Record<string, {
  title: string;
  subtitle: string;
  sections: {
    title: string;
    icon: string;
    color: string;
    items: { term: string; meaning: string; signal?: string }[];
  }[];
  quickReference: { condition: string; interpretation: string; action: string }[];
  proTips: string[];
}> = {
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

// Interpretation Guide Button Component
function InterpretationGuideButton({ tabKey }: { tabKey: keyof typeof tabInterpretationGuides }) {
  const guide = tabInterpretationGuides[tabKey]
  if (!guide) return null

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
  }

  const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  }

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-700',
    orange: 'text-orange-700',
    purple: 'text-purple-700',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 font-medium"
        >
          <BookOpen className="h-4 w-4" />
          Interpretation Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              {guide.title}
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-base mt-2">
              {guide.subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-6 py-5">
          {/* Sections */}
          <div className="space-y-6">
            {guide.sections.map((section, sIdx) => (
              <div key={sIdx} className={`rounded-xl border-2 ${bgColorMap[section.color]} overflow-hidden`}>
                <div className={`px-4 py-3 bg-gradient-to-r ${colorMap[section.color]} text-white font-semibold flex items-center gap-2`}>
                  <span className="text-xl">{section.icon}</span>
                  {section.title}
                </div>
                <div className="p-4">
                  <div className="grid gap-2">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="grid grid-cols-12 gap-3 items-start py-2 border-b border-gray-200 last:border-0">
                        <div className={`col-span-3 font-semibold text-sm ${textColorMap[section.color]}`}>
                          {item.term}
                        </div>
                        <div className="col-span-5 text-sm text-gray-600">
                          {item.meaning}
                        </div>
                        {item.signal && (
                          <div className="col-span-4 text-sm font-medium text-gray-800 bg-white px-2 py-1 rounded">
                            → {item.signal}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reference Table */}
          <div className="mt-6 rounded-xl border-2 border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 text-white font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Reference Table
            </div>
            <div className="divide-y">
              <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-slate-100 text-sm font-semibold text-slate-700">
                <div>Condition</div>
                <div>Interpretation</div>
                <div>Action</div>
              </div>
              {guide.quickReference.map((ref, rIdx) => (
                <div key={rIdx} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm hover:bg-slate-50">
                  <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{ref.condition}</div>
                  <div className="text-gray-700">{ref.interpretation}</div>
                  <div className="font-medium text-indigo-700">{ref.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="mt-6 rounded-xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Pro Tips
            </div>
            <div className="p-4 grid gap-2 md:grid-cols-2">
              {guide.proTips.map((tip, tIdx) => (
                <div key={tIdx} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 font-bold">💡</span>
                  <span className="text-amber-800">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t text-center">
          <p className="text-xs text-slate-500">
            COT data is released weekly (Friday 3:30 PM ET). Best used for swing trading and medium-term positioning.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Reusable Help Button Component with Modern UI
function HelpButton({ helpKey }: { helpKey: keyof typeof helpContent }) {
  const content = helpContent[helpKey]
  if (!content) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 shadow-sm transition-all duration-200 hover:scale-105"
        >
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <span className="sr-only">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
          <DialogHeader className="text-white">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-base mt-2 leading-relaxed">
              {content.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content area */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {content.items.map((item, index) => (
              <div
                key={index}
                className="group p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      {item.explanation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with tip */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1.5 bg-amber-100 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800">
              <span className="font-medium">Pro Tip:</span> COT data is released weekly (Friday 3:30 PM ET). Best used for swing trading and medium-term positioning decisions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function COTReportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DisaggCOTAnalysisResponse | null>(null)
  const [chartData, setChartData] = useState<COTChartDataResponse | null>(null)
  const [alerts, setAlerts] = useState<ExtremePositioningAlert[]>([])
  const [tradingSignal, setTradingSignal] = useState<COTTradingSignal | null>(null)
  const [commodities, setCommodities] = useState<AvailableCommodity[]>([])
  const [commodity, setCommodity] = useState("GOLD")
  const [weeks, setWeeks] = useState("52")

  // Advanced analytics state (Priority 1)
  const [flowData, setFlowData] = useState<FlowDecompositionResponse | null>(null)
  const [concentrationData, setConcentrationData] = useState<ConcentrationResponse | null>(null)
  const [squeezeData, setSqueezeData] = useState<SqueezeRiskResponse | null>(null)
  const [advancedSummary, setAdvancedSummary] = useState<AdvancedCOTSummary | null>(null)
  const [loadingAdvanced, setLoadingAdvanced] = useState(false)

  // Priority 2 analytics state
  const [curveData, setCurveData] = useState<CurveAnalysisResponse | null>(null)
  const [spreadData, setSpreadData] = useState<SpreadAnalysisResponse | null>(null)
  const [herdingData, setHerdingData] = useState<HerdingAnalysisResponse | null>(null)

  // Priority 3 analytics state
  const [crossMarketData, setCrossMarketData] = useState<CrossMarketPressureResponse | null>(null)
  const [volatilityData, setVolatilityData] = useState<VolatilityAnalysisResponse | null>(null)
  const [mlRegimeData, setMlRegimeData] = useState<MLRegimeAnalysisResponse | null>(null)

  // Load available commodities on mount
  useEffect(() => {
    const loadCommodities = async () => {
      try {
        const data = await cotApi.disagg.getCommodities()
        setCommodities(data)
      } catch (error) {
        console.error("Error loading commodities:", error)
      }
    }
    loadCommodities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Fetch all data in parallel
      const [analysisData, chartDataResult, alertsData, signalData] = await Promise.all([
        cotApi.disagg.getAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.getChartData(commodity, parseInt(weeks)),
        cotApi.disagg.getExtremeAlerts(commodity, parseInt(weeks)),
        cotApi.disagg.getTradingSignal(commodity, parseInt(weeks)),
      ])

      setResult(analysisData)
      setChartData(chartDataResult)
      setAlerts(alertsData)
      setTradingSignal(signalData)

      // Fetch advanced analytics in background
      fetchAdvancedData()

      toast.success("COT analysis complete!")
    } catch (error) {
      console.error("Error fetching COT data:", error)
      toast.error("Failed to fetch COT data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchAdvancedData = async () => {
    setLoadingAdvanced(true)
    try {
      // Fetch Priority 1, 2, and 3 data in parallel
      const [flow, concentration, squeeze, summary, curve, spread, herding, crossMarket, volatility, mlRegime] = await Promise.all([
        cotApi.disagg.advanced.getFlowDecomposition(commodity, 12),
        cotApi.disagg.advanced.getConcentration(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSqueezeRisk(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSummary(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getCurveAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getSpreadAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getHerdingAnalysis(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getCrossMarketPressure(parseInt(weeks), 5),
        cotApi.disagg.advanced.getVolatilityRegime(commodity, parseInt(weeks)),
        cotApi.disagg.advanced.getMLRegime(commodity, parseInt(weeks)),
      ])
      // Priority 1
      setFlowData(flow)
      setConcentrationData(concentration)
      setSqueezeData(squeeze)
      setAdvancedSummary(summary)
      // Priority 2
      setCurveData(curve)
      setSpreadData(spread)
      setHerdingData(herding)
      // Priority 3
      setCrossMarketData(crossMarket)
      setVolatilityData(volatility)
      setMlRegimeData(mlRegime)
    } catch (error) {
      console.error("Error fetching advanced data:", error)
    } finally {
      setLoadingAdvanced(false)
    }
  }

  // Prepare chart data
  const prepareNetPositionChartData = () => {
    if (!chartData) return []
    return chartData.net_positions.dates.map((date, i) => ({
      date: date.slice(5), // Show MM-DD format
      "Producer/Merchant": chartData.net_positions.producer_merchant_net[i],
      "Swap Dealer": chartData.net_positions.swap_dealer_net[i],
      "Managed Money": chartData.net_positions.managed_money_net[i],
      "Other Reportables": chartData.net_positions.other_reportables_net[i],
    }))
  }

  // Prepare stacked area chart data (long/short positions)
  const prepareLongShortChartData = () => {
    if (!chartData) return []
    return chartData.long_short_positions.dates.map((date, i) => ({
      date: date.slice(5),
      "MM Long": chartData.long_short_positions.managed_money_long[i],
      "MM Short": -chartData.long_short_positions.managed_money_short[i], // Negative for visual
      "Comm Long": chartData.long_short_positions.producer_merchant_long[i],
      "Comm Short": -chartData.long_short_positions.producer_merchant_short[i],
    }))
  }

  // Prepare Open Interest chart data
  const prepareOIChartData = () => {
    if (!chartData) return []
    return chartData.net_positions.dates.map((date, i) => ({
      date: date.slice(5),
      "Open Interest": chartData.net_positions.open_interest[i],
      "Managed Money Net": chartData.net_positions.managed_money_net[i],
    }))
  }

  // Calculate COT Index
  const calculateCOTIndex = (current: number, data: number[]) => {
    if (data.length === 0) return 50
    const min = Math.min(...data)
    const max = Math.max(...data)
    if (max === min) return 50
    return ((current - min) / (max - min)) * 100
  }

  // Get next COT report release date (Friday 3:30 PM ET)
  const getNextCOTRelease = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
    const nextFriday = new Date(now)
    nextFriday.setDate(now.getDate() + daysUntilFriday)
    nextFriday.setHours(15, 30, 0, 0) // 3:30 PM ET
    return nextFriday
  }

  const nextRelease = getNextCOTRelease()
  const daysUntilRelease = Math.ceil((nextRelease.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">COT Report Visualizer</h1>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Disaggregated Futures Only Report</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Analyze institutional positioning across Producer/Merchant, Swap Dealers, Managed Money, and Other Reportables
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Input and Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Input Card */}
        <Card className="border-2 hover:border-orange-200 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-orange-600" />
              Analysis Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity</Label>
                <Select value={commodity} onValueChange={setCommodity}>
                  <SelectTrigger id="commodity">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="COPPER">Copper</SelectItem>
                    <SelectItem value="CRUDE">Crude Oil</SelectItem>
                    <SelectItem value="NATURAL GAS">Natural Gas</SelectItem>
                    {commodities.filter(c =>
                      !["GOLD", "SILVER", "COPPER", "CRUDE", "NATURAL GAS"].includes(c.commodity_name.toUpperCase())
                    ).slice(0, 10).map(c => (
                      <SelectItem key={c.commodity_name} value={c.commodity_name}>
                        {c.commodity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeks">Lookback Period</Label>
                <Select value={weeks} onValueChange={setWeeks}>
                  <SelectTrigger id="weeks">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="13">3 Months (13 weeks)</SelectItem>
                    <SelectItem value="26">6 Months (26 weeks)</SelectItem>
                    <SelectItem value="52">1 Year (52 weeks)</SelectItem>
                    <SelectItem value="104">2 Years (104 weeks)</SelectItem>
                    <SelectItem value="156">3 Years (156 weeks)</SelectItem>
                    <SelectItem value="260">5 Years (260 weeks)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Affects percentile rankings and COT Index calculations
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze COT Data
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trading Signal Card */}
        <Card className="lg:col-span-3 border-2">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-600" />
                Trading Signal
              </div>
              <HelpButton helpKey="tradingSignal" />
            </CardTitle>
            <CardDescription>
              {result ? `${result.commodity} - Data as of ${result.data_as_of_date}` : "Run analysis to see signals"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {tradingSignal ? (
              <div className="space-y-4">
                <div className={`rounded-lg border-2 p-4 ${getSignalColor(tradingSignal.signal)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {tradingSignal.signal.includes("buy") ? (
                        <TrendingUp className="h-8 w-8" />
                      ) : tradingSignal.signal.includes("sell") ? (
                        <TrendingDown className="h-8 w-8" />
                      ) : (
                        <Activity className="h-8 w-8" />
                      )}
                      <div>
                        <div className="text-2xl font-bold">
                          {tradingSignal.signal.toUpperCase().replace("_", " ")}
                        </div>
                        <div className="text-sm opacity-80">
                          Signal Type: {tradingSignal.signal_type.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {tradingSignal.confidence.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm">{tradingSignal.reasoning}</p>
                  {tradingSignal.historical_accuracy && (
                    <p className="text-xs mt-2 opacity-75 italic">
                      {tradingSignal.historical_accuracy}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Managed Money</div>
                    <div className="font-semibold">{tradingSignal.managed_money_percentile.toFixed(1)}th %ile</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Commercials</div>
                    <div className="font-semibold">{tradingSignal.producer_merchant_percentile.toFixed(1)}th %ile</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">4-Week Change</div>
                    <div className={`font-semibold ${tradingSignal.managed_money_4wk_change > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tradingSignal.managed_money_4wk_change > 0 ? "+" : ""}{formatNumber(tradingSignal.managed_money_4wk_change, 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Select parameters and analyze to see trading signals</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      {result && (
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="percentiles">Sentiment</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          </TabsList>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <div className="flex justify-end mb-2">
              <InterpretationGuideButton tabKey="positions" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Producer/Merchant */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Producer/Merchant
                    </div>
                    <HelpButton helpKey="producerMerchant" />
                  </CardTitle>
                  <CardDescription>Commercial hedgers (miners, refiners)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Long</span>
                      <span className="font-mono">{formatNumber(result.current_positions.producer_merchant_long, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Short</span>
                      <span className="font-mono">{formatNumber(result.current_positions.producer_merchant_short, 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-mono font-semibold ${result.current_positions.producer_merchant_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(result.current_positions.producer_merchant_net, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Weekly Change</span>
                      <span className={result.weekly_changes.change_prod_merc_net >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_prod_merc_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_prod_merc_net, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Swap Dealers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      Swap Dealers
                    </div>
                    <HelpButton helpKey="swapDealer" />
                  </CardTitle>
                  <CardDescription>Banks facilitating OTC derivatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Long</span>
                      <span className="font-mono">{formatNumber(result.current_positions.swap_dealer_long, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Short</span>
                      <span className="font-mono">{formatNumber(result.current_positions.swap_dealer_short, 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-mono font-semibold ${result.current_positions.swap_dealer_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(result.current_positions.swap_dealer_net, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Weekly Change</span>
                      <span className={result.weekly_changes.change_swap_net >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_swap_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_swap_net, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Managed Money */}
              <Card className="border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      Managed Money
                      <Badge variant="secondary">Key Indicator</Badge>
                    </div>
                    <HelpButton helpKey="managedMoney" />
                  </CardTitle>
                  <CardDescription>Hedge funds, CTAs, large speculators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Long</span>
                      <span className="font-mono">{formatNumber(result.current_positions.managed_money_long, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Short</span>
                      <span className="font-mono">{formatNumber(result.current_positions.managed_money_short, 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-mono font-semibold ${result.current_positions.managed_money_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(result.current_positions.managed_money_net, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Weekly Change</span>
                      <span className={result.weekly_changes.change_m_money_net >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_m_money_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_m_money_net, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Reportables */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      Other Reportables
                    </div>
                    <HelpButton helpKey="otherReportables" />
                  </CardTitle>
                  <CardDescription>Proprietary traders, family offices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Long</span>
                      <span className="font-mono">{formatNumber(result.current_positions.other_reportables_long, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Short</span>
                      <span className="font-mono">{formatNumber(result.current_positions.other_reportables_short, 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-mono font-semibold ${result.current_positions.other_reportables_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(result.current_positions.other_reportables_net, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Weekly Change</span>
                      <span className={result.weekly_changes.change_other_rept_net >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_other_rept_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_other_rept_net, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Non-Reportables */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      Non-Reportables
                    </div>
                    <HelpButton helpKey="nonReportables" />
                  </CardTitle>
                  <CardDescription>Small traders (retail)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Long</span>
                      <span className="font-mono">{formatNumber(result.current_positions.non_reportables_long, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Short</span>
                      <span className="font-mono">{formatNumber(result.current_positions.non_reportables_short, 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-mono font-semibold ${result.current_positions.non_reportables_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatNumber(result.current_positions.non_reportables_net, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Weekly Change</span>
                      <span className={result.weekly_changes.change_nonrept_net >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_nonrept_net >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_nonrept_net, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Interest */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      Open Interest
                    </div>
                    <HelpButton helpKey="openInterest" />
                  </CardTitle>
                  <CardDescription>Total market participation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {formatNumber(result.current_positions.open_interest, 0)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekly Change</span>
                      <span className={result.weekly_changes.change_open_interest >= 0 ? "text-green-600" : "text-red-600"}>
                        {result.weekly_changes.change_open_interest >= 0 ? "+" : ""}{formatNumber(result.weekly_changes.change_open_interest, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Percentiles Tab */}
          <TabsContent value="percentiles" className="space-y-4">
            <div className="flex justify-end mb-2">
              <InterpretationGuideButton tabKey="sentiment" />
            </div>
            {/* Visual Sentiment Gauges */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Managed Money Sentiment Gauge */}
              <Card className="border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Managed Money Sentiment
                    </div>
                    <HelpButton helpKey="sentimentGauges" />
                  </CardTitle>
                  <CardDescription>{result.managed_money_sentiment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Visual Gauge */}
                    <div className="relative h-8 bg-gradient-to-r from-green-500 via-gray-300 to-red-500 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full w-1 bg-black shadow-lg transition-all duration-500"
                        style={{ left: `${result.managed_money_sentiment.percentile}%` }}
                      />
                      <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-medium text-white">
                        <span>Extreme Bear</span>
                        <span>Neutral</span>
                        <span>Extreme Bull</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={`text-lg px-4 py-2 ${getSentimentColor(result.managed_money_sentiment.sentiment)}`}>
                        {getSentimentLabel(result.managed_money_sentiment.sentiment)}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{result.managed_money_sentiment.percentile.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Percentile Rank</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">Net Position</div>
                        <div className={`font-semibold ${result.managed_money_sentiment.net_position >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatNumber(result.managed_money_sentiment.net_position, 0)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">4-Week Δ</div>
                        <div className={`font-semibold ${result.managed_money_sentiment.four_week_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {result.managed_money_sentiment.four_week_change >= 0 ? "+" : ""}{formatNumber(result.managed_money_sentiment.four_week_change, 0)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">Streak</div>
                        <div className="font-semibold">
                          {Math.abs(result.managed_money_sentiment.consecutive_weeks_direction)}w {result.managed_money_sentiment.consecutive_weeks_direction > 0 ? "↑" : "↓"}
                        </div>
                      </div>
                    </div>

                    {result.managed_money_percentile.is_extreme && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <strong>⚠️ Contrarian Alert:</strong> Extreme positioning often precedes reversals.
                        When funds are extremely bullish, consider contrarian bearish positioning.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Commercial Sentiment Gauge */}
              <Card className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Commercial Hedger Sentiment
                  </CardTitle>
                  <CardDescription>{result.producer_merchant_sentiment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Visual Gauge - Inverted interpretation for commercials */}
                    <div className="relative h-8 bg-gradient-to-r from-red-500 via-gray-300 to-green-500 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full w-1 bg-black shadow-lg transition-all duration-500"
                        style={{ left: `${result.producer_merchant_sentiment.percentile}%` }}
                      />
                      <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-medium text-white">
                        <span>Bullish (for price)</span>
                        <span>Neutral</span>
                        <span>Bearish (for price)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={`text-lg px-4 py-2 ${getSentimentColor(result.producer_merchant_sentiment.sentiment)}`}>
                        {getSentimentLabel(result.producer_merchant_sentiment.sentiment)}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{result.producer_merchant_sentiment.percentile.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Percentile Rank</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">Net Position</div>
                        <div className={`font-semibold ${result.producer_merchant_sentiment.net_position >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatNumber(result.producer_merchant_sentiment.net_position, 0)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">4-Week Δ</div>
                        <div className={`font-semibold ${result.producer_merchant_sentiment.four_week_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {result.producer_merchant_sentiment.four_week_change >= 0 ? "+" : ""}{formatNumber(result.producer_merchant_sentiment.four_week_change, 0)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded text-center">
                        <div className="text-muted-foreground text-xs">Streak</div>
                        <div className="font-semibold">
                          {Math.abs(result.producer_merchant_sentiment.consecutive_weeks_direction)}w {result.producer_merchant_sentiment.consecutive_weeks_direction > 0 ? "↑" : "↓"}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <strong>💡 Smart Money:</strong> Commercials are contrarian indicators.
                      When heavily net short = often marks price tops. When heavily net long = often marks bottoms.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Category Percentiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Historical Percentile Rankings</span>
                  <HelpButton helpKey="historicalPercentiles" />
                </CardTitle>
                <CardDescription>Current positioning vs last {result.weeks_analyzed} weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <PercentileGauge percentile={result.producer_merchant_percentile} label="Producer/Merchant" />
                  <PercentileGauge percentile={result.swap_dealer_percentile} label="Swap Dealer" />
                  <PercentileGauge percentile={result.managed_money_percentile} label="Managed Money" />
                  <PercentileGauge percentile={result.other_reportables_percentile} label="Other Reportables" />
                  <PercentileGauge percentile={result.non_reportables_percentile} label="Non-Reportables" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            <div className="flex justify-end mb-2">
              <InterpretationGuideButton tabKey="charts" />
            </div>
            {chartData && (
              <>
                {/* Net Position Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendUp className="h-5 w-5 text-orange-600" />
                        Net Position Comparison
                      </div>
                      <HelpButton helpKey="netPositionChart" />
                    </CardTitle>
                    <CardDescription>
                      Track divergence between Commercials and Managed Money - sharp divergence often precedes reversals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={prepareNetPositionChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatNumber(value, 0)}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Producer/Merchant" stroke="#3b82f6" strokeWidth={2} dot={false} name="Commercials" />
                        <Line type="monotone" dataKey="Managed Money" stroke="#f97316" strokeWidth={2} dot={false} name="Managed Money" />
                        <Line type="monotone" dataKey="Swap Dealer" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Swap Dealers" />
                        <Line type="monotone" dataKey="Other Reportables" stroke="#6b7280" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Key Patterns to Watch */}
                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="font-medium text-amber-800 text-sm flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Divergence
                        </div>
                        <p className="text-xs text-amber-700 mt-1">Commercials and Specs moving opposite → Potential reversal</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="font-medium text-green-800 text-sm flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" /> Convergence
                        </div>
                        <p className="text-xs text-green-700 mt-1">All categories aligning → Strong trend confirmation</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="font-medium text-blue-800 text-sm flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5" /> Crossover
                        </div>
                        <p className="text-xs text-blue-700 mt-1">Managed Money crosses Commercial → Trend change signal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stacked Long/Short Positions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Long vs Short Positions
                      </div>
                      <HelpButton helpKey="longShortChart" />
                    </CardTitle>
                    <CardDescription>
                      Managed Money and Commercial long/short breakdown over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={prepareLongShortChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatNumber(Math.abs(value), 0)} />
                        <Legend />
                        <Area type="monotone" dataKey="MM Long" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="MM Long" />
                        <Area type="monotone" dataKey="MM Short" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="MM Short" />
                        <Area type="monotone" dataKey="Comm Long" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Comm Long" />
                        <Area type="monotone" dataKey="Comm Short" stackId="4" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name="Comm Short" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Open Interest Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Open Interest Analysis
                      </div>
                      <HelpButton helpKey="openInterestChart" />
                    </CardTitle>
                    <CardDescription>
                      OI rising with price = new longs (bullish). OI falling with price rising = short covering (weaker signal)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={prepareOIChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatNumber(value, 0)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Open Interest" fill="#22c55e" fillOpacity={0.5} name="Open Interest" />
                        <Line yAxisId="right" type="monotone" dataKey="Managed Money Net" stroke="#f97316" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Analysis Tab - COT Index, Report Calendar, Case Studies */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="flex justify-end mb-2">
              <InterpretationGuideButton tabKey="analysis" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* COT Index */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-purple-600" />
                      COT Index
                    </div>
                    <HelpButton helpKey="cotIndex" />
                  </CardTitle>
                  <CardDescription>
                    (Current - Min) / (Max - Min) × 100 over {result.weeks_analyzed} weeks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chartData && (
                    <>
                      <div className="space-y-3">
                        {(() => {
                          const mmIndex = calculateCOTIndex(result.current_positions.managed_money_net, chartData.net_positions.managed_money_net);
                          const mmColor = mmIndex <= 20 ? 'bg-green-500' : mmIndex >= 80 ? 'bg-red-500' : 'bg-yellow-500';
                          const mmZone = mmIndex <= 20 ? 'Bearish Extreme' : mmIndex >= 80 ? 'Bullish Extreme' : 'Neutral';
                          return (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Managed Money</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${mmIndex <= 20 ? 'bg-green-100 text-green-700' : mmIndex >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {mmZone}
                                  </span>
                                  <span className="font-mono">{mmIndex.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${mmColor} transition-all`} style={{ width: `${mmIndex}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                        {(() => {
                          const commIndex = calculateCOTIndex(result.current_positions.producer_merchant_net, chartData.net_positions.producer_merchant_net);
                          const commColor = commIndex <= 20 ? 'bg-green-500' : commIndex >= 80 ? 'bg-red-500' : 'bg-yellow-500';
                          const commZone = commIndex <= 20 ? 'Bearish Extreme' : commIndex >= 80 ? 'Bullish Extreme' : 'Neutral';
                          return (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Commercials</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${commIndex <= 20 ? 'bg-green-100 text-green-700' : commIndex >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {commZone}
                                  </span>
                                  <span className="font-mono">{commIndex.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${commColor} transition-all`} style={{ width: `${commIndex}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                        {(() => {
                          const swapIndex = calculateCOTIndex(result.current_positions.swap_dealer_net, chartData.net_positions.swap_dealer_net);
                          const swapColor = swapIndex <= 20 ? 'bg-green-500' : swapIndex >= 80 ? 'bg-red-500' : 'bg-yellow-500';
                          const swapZone = swapIndex <= 20 ? 'Bearish Extreme' : swapIndex >= 80 ? 'Bullish Extreme' : 'Neutral';
                          return (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Swap Dealers</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${swapIndex <= 20 ? 'bg-green-100 text-green-700' : swapIndex >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {swapZone}
                                  </span>
                                  <span className="font-mono">{swapIndex.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${swapColor} transition-all`} style={{ width: `${swapIndex}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                        <strong>Interpretation:</strong> COT Index &gt;80 = extremely bullish positioning (contrarian bearish).
                        COT Index &lt;20 = extremely bearish positioning (contrarian bullish).
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Open Interest Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Open Interest Analysis
                    </div>
                    <HelpButton helpKey="openInterest" />
                  </CardTitle>
                  <CardDescription>
                    Interpret OI changes with price movement for trend confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="text-sm text-muted-foreground">Current Open Interest</div>
                      <div className="text-2xl font-bold">{formatNumber(result.current_positions.open_interest, 0)}</div>
                      <div className={`text-sm ${result.weekly_changes.change_open_interest >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.weekly_changes.change_open_interest >= 0 ? '↑' : '↓'} {formatNumber(Math.abs(result.weekly_changes.change_open_interest), 0)} this week
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="text-sm text-muted-foreground">OI Trend Signal</div>
                      {(() => {
                        const oiChange = result.weekly_changes.change_open_interest;
                        const mmChange = result.weekly_changes.change_mm_net;
                        let signal = '';
                        let color = '';
                        let desc = '';
                        if (oiChange > 0 && mmChange > 0) {
                          signal = 'Bullish Trend Strong';
                          color = 'text-green-700 bg-green-100';
                          desc = 'New longs entering - bullish conviction';
                        } else if (oiChange > 0 && mmChange < 0) {
                          signal = 'Bearish Trend Strong';
                          color = 'text-red-700 bg-red-100';
                          desc = 'New shorts entering - bearish conviction';
                        } else if (oiChange < 0 && mmChange > 0) {
                          signal = 'Short Covering Rally';
                          color = 'text-amber-700 bg-amber-100';
                          desc = 'Shorts exiting - rally may not sustain';
                        } else if (oiChange < 0 && mmChange < 0) {
                          signal = 'Long Liquidation';
                          color = 'text-orange-700 bg-orange-100';
                          desc = 'Longs exiting - bearish but exhausting';
                        } else {
                          signal = 'Neutral';
                          color = 'text-gray-700 bg-gray-100';
                          desc = 'No clear signal';
                        }
                        return (
                          <>
                            <div className={`text-lg font-bold px-2 py-1 rounded inline-block ${color}`}>{signal}</div>
                            <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* OI Interpretation Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-sm font-medium">Key Relationships</div>
                    <div className="divide-y">
                      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                        <span className="text-green-600 font-medium">↑ OI + ↑ Price</span>
                        <span className="col-span-2">New longs entering - bullish trend strong</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                        <span className="text-red-600 font-medium">↑ OI + ↓ Price</span>
                        <span className="col-span-2">New shorts entering - bearish trend strong</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                        <span className="text-amber-600 font-medium">↓ OI + ↑ Price</span>
                        <span className="col-span-2">Short covering rally - may not sustain</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                        <span className="text-orange-600 font-medium">↓ OI + ↓ Price</span>
                        <span className="col-span-2">Long liquidation - bearish but exhausting</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Calendar */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    COT Report Calendar
                  </CardTitle>
                  <CardDescription>
                    Reports released every Friday at 3:30 PM ET for data as of previous Tuesday
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-sm text-blue-600">Next Report Release</div>
                        <div className="text-xl font-bold text-blue-800">
                          {nextRelease.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-blue-600">
                          {daysUntilRelease === 0 ? "Today!" : daysUntilRelease === 1 ? "Tomorrow" : `In ${daysUntilRelease} days`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Current Data As Of</span>
                      <span className="font-medium">{result.data_as_of_date}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Data Lag</span>
                      <span className="font-medium">3 days (Tuesday → Friday)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Weeks Analyzed</span>
                      <span className="font-medium">{result.weeks_analyzed} weeks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Case Studies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  Historical Case Studies
                </CardTitle>
                <CardDescription>
                  Learn from past extreme positioning events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-medium text-red-800 mb-2">🔴 Classic Top Signal</div>
                    <p className="text-sm text-red-700 mb-2">
                      <strong>March 2024 Gold Top:</strong> Managed Money reached 94th percentile net long,
                      Commercials 91st percentile net short. Gold peaked within 2 weeks, fell 5% over next month.
                    </p>
                    <div className="text-xs text-red-600">
                      Signal: Extreme divergence between speculators and hedgers
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 mb-2">🟢 Classic Bottom Signal</div>
                    <p className="text-sm text-green-700 mb-2">
                      <strong>August 2024 Gold Bottom:</strong> Managed Money 12th percentile (extreme bearish),
                      rapid 4-week liquidation. Gold rallied 8% in following 6 weeks.
                    </p>
                    <div className="text-xs text-green-600">
                      Signal: Capitulation + extreme bearish positioning
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-800 mb-2">📊 Smart Money Alignment</div>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Rare Signal:</strong> When Commercials cover shorts AND Managed Money adds longs
                      simultaneously = High conviction bullish signal. Occurs ~2-3 times per year.
                    </p>
                    <div className="text-xs text-blue-600">
                      Signal: Both smart money and speculators agree
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="font-medium text-amber-800 mb-2">⚠️ Overcrowding Warning</div>
                    <p className="text-sm text-amber-700 mb-2">
                      <strong>Pattern:</strong> Managed Money &gt;85th percentile + Small Traders &gt;80th percentile
                      = Everyone bullish = Classic contrarian sell setup.
                    </p>
                    <div className="text-xs text-amber-600">
                      Historical accuracy: 76% preceded 3%+ decline within 4 weeks
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="flex justify-end mb-2">
              <InterpretationGuideButton tabKey="advanced" />
            </div>
            {loadingAdvanced ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2">Loading advanced analytics...</span>
              </div>
            ) : advancedSummary ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className={`border-2 ${advancedSummary.crowding_score > 60 ? 'border-red-300 bg-red-50' : advancedSummary.crowding_score > 40 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Crowding Score</span>
                        <HelpButton helpKey="crowdingScore" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{advancedSummary.crowding_score.toFixed(0)}</div>
                      <Progress value={advancedSummary.crowding_score} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Higher = more concentrated risk</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${advancedSummary.squeeze_risk_score > 60 ? 'border-red-300 bg-red-50' : advancedSummary.squeeze_risk_score > 40 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Squeeze Risk</span>
                        <HelpButton helpKey="squeezeRiskScore" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{advancedSummary.squeeze_risk_score.toFixed(0)}</div>
                      <Progress value={advancedSummary.squeeze_risk_score} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Vulnerability to forced liquidation</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Flow Momentum</span>
                        <HelpButton helpKey="flowMomentum" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{advancedSummary.flow_momentum_score.toFixed(0)}</div>
                      <Progress value={advancedSummary.flow_momentum_score} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Strength of recent flows</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-300 bg-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Current Regime</span>
                        <HelpButton helpKey="currentRegime" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold capitalize">{advancedSummary.current_regime.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">Confidence: {advancedSummary.regime_confidence.toFixed(0)}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts */}
                {advancedSummary.alerts.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Active Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {advancedSummary.alerts.map((alert, i) => (
                          <div key={i} className="p-2 bg-white rounded border border-amber-200 text-sm">
                            {alert}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actionable Insight */}
                <Card className="border-2 border-blue-300 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Primary Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium text-blue-800">{advancedSummary.primary_insight}</p>
                    <p className="mt-2 text-blue-700"><strong>Suggested Action:</strong> {advancedSummary.suggested_action}</p>
                  </CardContent>
                </Card>

                {/* Squeeze Risk Details */}
                {squeezeData && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Long Squeeze Risk
                          </div>
                          <HelpButton helpKey="squeezeRisk" />
                        </CardTitle>
                        <CardDescription>Risk of forced long liquidation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{squeezeData.long_squeeze_risk.risk_score.toFixed(0)}/100</span>
                            <Badge className={
                              squeezeData.long_squeeze_risk.risk_level === 'extreme' ? 'bg-red-600' :
                                squeezeData.long_squeeze_risk.risk_level === 'high' ? 'bg-orange-600' :
                                  squeezeData.long_squeeze_risk.risk_level === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'
                            }>
                              {squeezeData.long_squeeze_risk.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                          <Progress value={squeezeData.long_squeeze_risk.risk_score} className="h-3" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-muted rounded">
                              <span className="text-muted-foreground">Spec Factor:</span>
                              <span className="ml-1 font-medium">{(squeezeData.long_squeeze_risk.spec_positioning_factor * 100).toFixed(0)}%</span>
                            </div>
                            <div className="p-2 bg-muted rounded">
                              <span className="text-muted-foreground">Concentration:</span>
                              <span className="ml-1 font-medium">{(squeezeData.long_squeeze_risk.concentration_factor * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{squeezeData.long_squeeze_risk.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Short Squeeze Risk
                        </CardTitle>
                        <CardDescription>Risk of forced short covering</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{squeezeData.short_squeeze_risk.risk_score.toFixed(0)}/100</span>
                            <Badge className={
                              squeezeData.short_squeeze_risk.risk_level === 'extreme' ? 'bg-red-600' :
                                squeezeData.short_squeeze_risk.risk_level === 'high' ? 'bg-orange-600' :
                                  squeezeData.short_squeeze_risk.risk_level === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'
                            }>
                              {squeezeData.short_squeeze_risk.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                          <Progress value={squeezeData.short_squeeze_risk.risk_score} className="h-3" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-muted rounded">
                              <span className="text-muted-foreground">Spec Factor:</span>
                              <span className="ml-1 font-medium">{(squeezeData.short_squeeze_risk.spec_positioning_factor * 100).toFixed(0)}%</span>
                            </div>
                            <div className="p-2 bg-muted rounded">
                              <span className="text-muted-foreground">Concentration:</span>
                              <span className="ml-1 font-medium">{(squeezeData.short_squeeze_risk.concentration_factor * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{squeezeData.short_squeeze_risk.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Flow Decomposition */}
                {flowData && flowData.current_week && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          Flow Decomposition (Current Week)
                        </div>
                        <HelpButton helpKey="flowDecomposition" />
                      </CardTitle>
                      <CardDescription>
                        {flowData.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Managed Money Flows */}
                        <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
                          <div className="font-medium text-orange-800 mb-3">Managed Money Flows</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-green-100 rounded">
                              <div className="text-xs text-green-700">New Longs</div>
                              <div className="font-bold text-green-800">{formatNumber(flowData.current_week.managed_money.new_longs, 0)}</div>
                            </div>
                            <div className="p-2 bg-red-100 rounded">
                              <div className="text-xs text-red-700">Long Liquidation</div>
                              <div className="font-bold text-red-800">{formatNumber(flowData.current_week.managed_money.long_liquidation, 0)}</div>
                            </div>
                            <div className="p-2 bg-red-100 rounded">
                              <div className="text-xs text-red-700">New Shorts</div>
                              <div className="font-bold text-red-800">{formatNumber(flowData.current_week.managed_money.new_shorts, 0)}</div>
                            </div>
                            <div className="p-2 bg-green-100 rounded">
                              <div className="text-xs text-green-700">Short Covering</div>
                              <div className="font-bold text-green-800">{formatNumber(flowData.current_week.managed_money.short_covering, 0)}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-orange-700">
                            <strong>Dominant:</strong> {flowData.current_week.managed_money.dominant_flow.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Commercial Flows */}
                        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                          <div className="font-medium text-blue-800 mb-3">Commercial Flows</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-green-100 rounded">
                              <div className="text-xs text-green-700">New Longs</div>
                              <div className="font-bold text-green-800">{formatNumber(flowData.current_week.producer_merchant.new_longs, 0)}</div>
                            </div>
                            <div className="p-2 bg-red-100 rounded">
                              <div className="text-xs text-red-700">Long Liquidation</div>
                              <div className="font-bold text-red-800">{formatNumber(flowData.current_week.producer_merchant.long_liquidation, 0)}</div>
                            </div>
                            <div className="p-2 bg-red-100 rounded">
                              <div className="text-xs text-red-700">New Shorts</div>
                              <div className="font-bold text-red-800">{formatNumber(flowData.current_week.producer_merchant.new_shorts, 0)}</div>
                            </div>
                            <div className="p-2 bg-green-100 rounded">
                              <div className="text-xs text-green-700">Short Covering</div>
                              <div className="font-bold text-green-800">{formatNumber(flowData.current_week.producer_merchant.short_covering, 0)}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-blue-700">
                            <strong>Dominant:</strong> {flowData.current_week.producer_merchant.dominant_flow.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Concentration Analysis */}
                {concentrationData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          Concentration Analysis
                        </div>
                        <HelpButton helpKey="concentration" />
                      </CardTitle>
                      <CardDescription>{concentrationData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-lg border">
                          <div className="font-medium mb-2">Long Side Concentration</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Top 4 Traders</span>
                              <span className="font-mono">{concentrationData.long_concentration.top_4_gross.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Top 8 Traders</span>
                              <span className="font-mono">{concentrationData.long_concentration.top_8_gross.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Concentration Ratio</span>
                              <span className="font-mono">{concentrationData.long_concentration.concentration_ratio.toFixed(2)}</span>
                            </div>
                            {concentrationData.long_concentration.is_concentrated && (
                              <Badge variant="destructive" className="mt-2">Highly Concentrated</Badge>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-lg border">
                          <div className="font-medium mb-2">Short Side Concentration</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Top 4 Traders</span>
                              <span className="font-mono">{concentrationData.short_concentration.top_4_gross.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Top 8 Traders</span>
                              <span className="font-mono">{concentrationData.short_concentration.top_8_gross.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Concentration Ratio</span>
                              <span className="font-mono">{concentrationData.short_concentration.concentration_ratio.toFixed(2)}</span>
                            </div>
                            {concentrationData.short_concentration.is_concentrated && (
                              <Badge variant="destructive" className="mt-2">Highly Concentrated</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{concentrationData.historical_context}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 2: Curve Structure Analysis */}
                {curveData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-indigo-600" />
                          Curve Structure Analysis
                        </div>
                        <HelpButton helpKey="curveAnalysis" />
                      </CardTitle>
                      <CardDescription>{curveData.curve_summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div className="text-xs text-indigo-600">Front Month OI</div>
                          <div className="text-xl font-bold">{formatNumber(curveData.front_oi, 0)}</div>
                          <div className="text-sm text-indigo-700">{curveData.front_oi_pct.toFixed(1)}% of total</div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="text-xs text-purple-600">Back Month OI</div>
                          <div className="text-xl font-bold">{formatNumber(curveData.back_oi, 0)}</div>
                          <div className="text-sm text-purple-700">{(100 - curveData.front_oi_pct).toFixed(1)}% of total</div>
                        </div>
                        <div className={`p-3 rounded-lg border ${curveData.roll_stress_level === 'critical' ? 'bg-red-50 border-red-200' : curveData.roll_stress_level === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="text-xs">Roll Stress</div>
                          <div className="text-xl font-bold">{curveData.roll_stress_score.toFixed(0)}/100</div>
                          <div className="text-sm capitalize">{curveData.roll_stress_level}</div>
                        </div>
                      </div>
                      {curveData.roll_warning && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                          <span className="text-amber-800 text-sm">⚠️ {curveData.roll_warning}</span>
                        </div>
                      )}
                      <div className="space-y-3">
                        {curveData.positioning.map((pos, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{pos.category}</span>
                              <Badge variant={pos.curve_bias === 'front_heavy' ? 'default' : pos.curve_bias === 'back_heavy' ? 'secondary' : 'outline'}>
                                {pos.curve_bias.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Front Net: <span className={pos.front_net >= 0 ? 'text-green-600' : 'text-red-600'}>{formatNumber(pos.front_net, 0)}</span></div>
                              <div>Back Net: <span className={pos.back_net >= 0 ? 'text-green-600' : 'text-red-600'}>{formatNumber(pos.back_net, 0)}</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{pos.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 2: Spread vs Directional Analysis */}
                {spreadData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-cyan-600" />
                          Spread vs Directional Exposure
                        </div>
                        <HelpButton helpKey="spreadAnalysis" />
                      </CardTitle>
                      <CardDescription>{spreadData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                          <div className="text-xs text-cyan-600">Market Mode</div>
                          <div className="text-lg font-bold capitalize">{spreadData.market_mode.replace('_', ' ')}</div>
                          <div className="text-sm text-cyan-700">{spreadData.mode_strength} strength</div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="text-xs text-blue-600">Spread Ratio</div>
                          <div className="text-xl font-bold">{spreadData.market_spread_ratio.toFixed(1)}%</div>
                          <div className="text-sm text-blue-700">of total positions</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">WoW Change</div>
                          <div className="text-sm">
                            <span className={spreadData.spread_change_wow >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Spread: {spreadData.spread_change_wow >= 0 ? '+' : ''}{formatNumber(spreadData.spread_change_wow, 0)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className={spreadData.directional_change_wow >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Dir: {spreadData.directional_change_wow >= 0 ? '+' : ''}{formatNumber(spreadData.directional_change_wow, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {spreadData.breakdown.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{item.category}</span>
                              <Badge variant={item.exposure_type === 'spread_dominant' ? 'secondary' : item.exposure_type === 'directional_dominant' ? 'default' : 'outline'}>
                                {item.exposure_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm mb-1">
                              <div>Spread: <span className="font-mono">{item.spread_pct_of_total.toFixed(0)}%</span></div>
                              <div>Directional: <span className="font-mono">{item.directional_pct_of_total.toFixed(0)}%</span></div>
                            </div>
                            <Progress value={item.spread_pct_of_total} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{item.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 2: Herding Analysis */}
                {herdingData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-amber-600" />
                          Herding & Market Structure
                        </div>
                        <HelpButton helpKey="herdingAnalysis" />
                      </CardTitle>
                      <CardDescription>{herdingData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {herdingData.herding_alert && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                          <span className="text-amber-800 text-sm">{herdingData.herding_alert}</span>
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="text-xs text-amber-600">Herding Score</div>
                          <div className="text-xl font-bold">{herdingData.overall_herding_score.toFixed(0)}/100</div>
                          <Progress value={herdingData.overall_herding_score} className="h-2 mt-1" />
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="text-xs text-purple-600">Market Structure</div>
                          <div className="text-lg font-bold capitalize">{herdingData.overall_herding_type.replace('_', ' ')}</div>
                        </div>
                        <div className={`p-3 rounded-lg border ${herdingData.divergence_detected ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-xs">Smart Money vs Crowd</div>
                          <div className="text-sm">
                            <span className="capitalize">Smart: {herdingData.smart_money_direction}</span>
                          </div>
                          <div className="text-sm">
                            <span className="capitalize">Crowd: {herdingData.crowd_direction}</span>
                          </div>
                          {herdingData.divergence_detected && (
                            <Badge variant="outline" className="mt-1 text-yellow-700 border-yellow-400">Divergence!</Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {herdingData.categories.map((cat, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{cat.category}</span>
                              <Badge variant={cat.herding_type === 'capitulation' ? 'destructive' : cat.herding_type === 'oligopoly' ? 'secondary' : 'outline'}>
                                {cat.herding_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                              <div>Long Traders: <span className="font-mono">{cat.traders_long}</span></div>
                              <div>Short Traders: <span className="font-mono">{cat.traders_short}</span></div>
                              <div>L/S Ratio: <span className="font-mono">{cat.long_short_trader_ratio.toFixed(2)}</span></div>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">Herding Intensity:</span>
                              <Progress value={cat.herding_intensity} className="h-2 flex-1" />
                              <span className="text-xs font-mono">{cat.herding_intensity.toFixed(0)}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{cat.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 3: ML Regime Classification */}
                {mlRegimeData && (
                  <Card className="border-2 border-violet-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-violet-600" />
                          ML Regime Classification
                        </div>
                        <HelpButton helpKey="mlRegime" />
                      </CardTitle>
                      <CardDescription>{mlRegimeData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                          <div className="text-xs text-violet-600 mb-1">Current Regime</div>
                          <div className="text-lg font-bold capitalize">{mlRegimeData.current_regime.primary_regime.replace('_', ' ')}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={mlRegimeData.current_regime.primary_confidence} className="h-2 flex-1" />
                            <span className="text-xs font-mono">{mlRegimeData.current_regime.primary_confidence.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="text-xs text-blue-600 mb-1">Duration</div>
                          <div className="text-xl font-bold">{mlRegimeData.regime_duration_current} weeks</div>
                          <div className="text-sm text-blue-700">Typical: {mlRegimeData.current_regime.typical_duration_weeks} weeks</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${mlRegimeData.current_regime.risk_level === 'high' ? 'bg-red-50 border-red-200' : mlRegimeData.current_regime.risk_level === 'moderate' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="text-xs mb-1">Risk Level</div>
                          <div className="text-lg font-bold capitalize">{mlRegimeData.current_regime.risk_level}</div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div className="p-3 rounded-lg border">
                          <div className="font-medium mb-2">Regime Description</div>
                          <p className="text-sm text-muted-foreground">{mlRegimeData.current_regime.regime_description}</p>
                          <p className="text-sm mt-2"><strong>Typical Outcome:</strong> {mlRegimeData.current_regime.typical_outcome}</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-green-50">
                          <div className="font-medium mb-2 text-green-800">Suggested Strategy</div>
                          <p className="text-sm text-green-700">{mlRegimeData.current_regime.suggested_strategy}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-3 rounded-lg border">
                          <div className="font-medium mb-2">Top Features</div>
                          <div className="space-y-2">
                            {mlRegimeData.current_regime.top_features.slice(0, 4).map((feat, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs w-32 truncate">{feat.feature.replace(/_/g, ' ')}</span>
                                <Progress value={feat.importance * 100} className="h-2 flex-1" />
                                <span className="text-xs font-mono w-12">{feat.value.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <div className="font-medium mb-2">Likely Next Regimes</div>
                          <div className="space-y-2">
                            {mlRegimeData.current_regime.likely_next_regimes.map((trans, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{trans.regime.replace('_', ' ')}</span>
                                <Badge variant="outline">{(trans.probability * 100).toFixed(0)}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 3: Volatility Regime */}
                {volatilityData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-600" />
                          COT-Implied Volatility Regime
                        </div>
                        <HelpButton helpKey="volatilityRegime" />
                      </CardTitle>
                      <CardDescription>{volatilityData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {volatilityData.vol_alert && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                          <span className="text-orange-800 text-sm">{volatilityData.vol_alert}</span>
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-4 mb-4">
                        <div className={`p-3 rounded-lg border ${volatilityData.current_metrics.implied_vol_regime === 'high' ? 'bg-red-50 border-red-200' : volatilityData.current_metrics.implied_vol_regime === 'elevated' ? 'bg-orange-50 border-orange-200' : volatilityData.current_metrics.implied_vol_regime === 'low' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-xs">Vol Regime</div>
                          <div className="text-lg font-bold capitalize">{volatilityData.current_metrics.implied_vol_regime}</div>
                          <div className="text-sm">{volatilityData.current_metrics.vol_regime_score.toFixed(0)}/100</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">Gross Positions</div>
                          <div className="text-lg font-bold">{formatNumber(volatilityData.current_metrics.gross_positions, 0)}</div>
                          <div className="text-sm">P{volatilityData.current_metrics.gross_positions_percentile.toFixed(0)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">Spread Ratio</div>
                          <div className="text-lg font-bold">{volatilityData.current_metrics.spread_ratio.toFixed(1)}%</div>
                          <div className="text-sm">P{volatilityData.current_metrics.spread_ratio_percentile.toFixed(0)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">Vol Skew</div>
                          <div className="text-lg font-bold capitalize">{volatilityData.current_metrics.vol_skew.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={volatilityData.vol_regime_history.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority 3: Cross-Market Pressure */}
                {crossMarketData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-teal-600" />
                          Cross-Market Speculative Pressure
                        </div>
                        <HelpButton helpKey="crossMarket" />
                      </CardTitle>
                      <CardDescription>{crossMarketData.interpretation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className={`p-3 rounded-lg border ${crossMarketData.market_sentiment === 'risk_on' ? 'bg-green-50 border-green-200' : crossMarketData.market_sentiment === 'risk_off' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-xs">Market Sentiment</div>
                          <div className="text-lg font-bold capitalize">{crossMarketData.market_sentiment.replace('_', ' ')}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">Commodities Analyzed</div>
                          <div className="text-xl font-bold">{crossMarketData.commodities_analyzed}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-600">Avg Spec Pressure</div>
                          <div className="text-xl font-bold">{crossMarketData.avg_spec_pressure.toFixed(1)}%</div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div className="p-3 rounded-lg border">
                          <div className="font-medium mb-2 text-green-700">Most Crowded Long</div>
                          <div className="space-y-2">
                            {crossMarketData.most_crowded_long.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-[150px]">{item.commodity}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-green-700">P{item.spec_pressure_percentile.toFixed(0)}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <div className="font-medium mb-2 text-red-700">Most Crowded Short</div>
                          <div className="space-y-2">
                            {crossMarketData.most_crowded_short.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-[150px]">{item.commodity}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-red-700">P{item.spec_pressure_percentile.toFixed(0)}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {(crossMarketData.rotation_into.length > 0 || crossMarketData.rotation_out_of.length > 0) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {crossMarketData.rotation_into.length > 0 && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                              <div className="font-medium mb-1 text-green-800">Rotation Into</div>
                              <div className="text-sm text-green-700">{crossMarketData.rotation_into.join(', ')}</div>
                            </div>
                          )}
                          {crossMarketData.rotation_out_of.length > 0 && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                              <div className="font-medium mb-1 text-red-800">Rotation Out Of</div>
                              <div className="text-sm text-red-700">{crossMarketData.rotation_out_of.join(', ')}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Gauge className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Run analysis to see advanced metrics</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="flex justify-end gap-2 mb-2">
              <InterpretationGuideButton tabKey="alerts" />
              <HelpButton helpKey="extremeAlerts" />
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert, i) => (
                  <Card key={i} className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        {alert.category} - {alert.extreme_type.replace("_", " ").toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">{alert.historical_context}</p>
                        <div className="flex gap-4 text-sm">
                          <span>Net: <strong>{formatNumber(alert.net_position, 0)}</strong></span>
                          <span>Percentile: <strong>{alert.percentile.toFixed(1)}%</strong></span>
                          <span>Deviation: <strong>{alert.deviation_pct.toFixed(1)}%</strong></span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border mt-2">
                          <div className="text-sm font-medium text-amber-800">Suggested Action:</div>
                          <p className="text-sm text-amber-700">{alert.suggested_action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-muted-foreground mb-6">
                      <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No extreme positioning alerts at this time</p>
                      <p className="text-sm">All trader categories are within normal ranges</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Configured Alert Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configured Alert Types</CardTitle>
                    <CardDescription>These alerts will trigger when conditions are met</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Extreme Long Positioning
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when any category exceeds 90th percentile net long</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Extreme Short Positioning
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when any category falls below 10th percentile</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          Squeeze Risk Alert
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when squeeze risk score exceeds 70</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Smart Money Divergence
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when Commercials and Managed Money show extreme divergence</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          Overcrowding Warning
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when Managed Money + Small Traders both at extremes</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Significant Weekly Change
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Triggers when weekly change exceeds 2 standard deviations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Educational Section */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Disaggregated COT Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            The Disaggregated Futures Only COT report breaks down open interest into four trader categories:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="font-medium text-blue-800 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Producer/Merchant
              </div>
              <p className="text-blue-700 mt-1">Commercial hedgers (miners, refiners). Contrarian indicator - extreme shorts often mark tops.</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="font-medium text-purple-800 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Swap Dealers
              </div>
              <p className="text-purple-700 mt-1">Banks facilitating OTC derivatives. Often neutral, hedging client exposures.</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="font-medium text-orange-800 flex items-center gap-2">
                <Target className="h-4 w-4" /> Managed Money
              </div>
              <p className="text-orange-700 mt-1">Hedge funds and CTAs. Trend followers - extreme longs often signal overcrowding.</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="font-medium text-gray-800 flex items-center gap-2">
                <Users className="h-4 w-4" /> Other Reportables
              </div>
              <p className="text-gray-700 mt-1">Remaining large traders including proprietary traders and family offices.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  )
}
