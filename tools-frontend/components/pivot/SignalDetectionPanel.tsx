"use client"

import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Activity, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { PivotResponse } from "@/types"

type SignalDetectionPanelProps = {
    pivotData: PivotResponse
    currentPrice?: number
}

type Signal = {
    type: "bullish" | "bearish" | "neutral" | "warning"
    title: string
    description: string
    confidence: "high" | "medium" | "low"
    category: "cpr" | "fibonacci" | "floor" | "general"
}

export function SignalDetectionPanel({ pivotData, currentPrice }: SignalDetectionPanelProps) {
    const price = currentPrice || pivotData.ohlc.close
    const signals: Signal[] = []

    // CPR Analysis
    const { tc, bc, classification, width_percent } = pivotData.cpr
    const { r1, r2, r3, s1, s2, s3 } = pivotData.floor_pivots
    const fib = pivotData.fibonacci

    // CPR Position Analysis
    if (price > tc) {
        signals.push({
            type: "bullish",
            title: "Price Above CPR",
            description: `Price is trading above Top Central (TC: ${tc.toFixed(2)}). Bullish bias for the session.`,
            confidence: "high",
            category: "cpr",
        })
    } else if (price < bc) {
        signals.push({
            type: "bearish",
            title: "Price Below CPR",
            description: `Price is trading below Bottom Central (BC: ${bc.toFixed(2)}). Bearish bias for the session.`,
            confidence: "high",
            category: "cpr",
        })
    } else {
        signals.push({
            type: "neutral",
            title: "Price Within CPR",
            description: `Price is consolidating within CPR zone (${bc.toFixed(2)} - ${tc.toFixed(2)}). Wait for breakout.`,
            confidence: "medium",
            category: "cpr",
        })
    }

    // CPR Width Analysis
    if (classification === "narrow") {
        signals.push({
            type: "warning",
            title: "Narrow CPR Detected",
            description: `CPR width is only ${width_percent.toFixed(2)}%. Expect a trending day with potential breakout.`,
            confidence: "high",
            category: "cpr",
        })
    } else if (classification === "wide") {
        signals.push({
            type: "neutral",
            title: "Wide CPR Detected",
            description: `CPR width is ${width_percent.toFixed(2)}%. Expect range-bound trading within CPR levels.`,
            confidence: "medium",
            category: "cpr",
        })
    }

    // Floor Pivot Proximity Signals
    const proximityThreshold = 0.005 // 0.5%

    if (Math.abs(price - r1) / price < proximityThreshold) {
        signals.push({
            type: "warning",
            title: "Approaching R1 Resistance",
            description: `Price is within 0.5% of R1 (${r1.toFixed(2)}). Watch for rejection or breakout.`,
            confidence: "high",
            category: "floor",
        })
    }
    if (Math.abs(price - r2) / price < proximityThreshold) {
        signals.push({
            type: "warning",
            title: "Approaching R2 Resistance",
            description: `Price is within 0.5% of R2 (${r2.toFixed(2)}). Strong resistance zone.`,
            confidence: "high",
            category: "floor",
        })
    }
    if (Math.abs(price - s1) / price < proximityThreshold) {
        signals.push({
            type: "warning",
            title: "Approaching S1 Support",
            description: `Price is within 0.5% of S1 (${s1.toFixed(2)}). Watch for bounce or breakdown.`,
            confidence: "high",
            category: "floor",
        })
    }
    if (Math.abs(price - s2) / price < proximityThreshold) {
        signals.push({
            type: "warning",
            title: "Approaching S2 Support",
            description: `Price is within 0.5% of S2 (${s2.toFixed(2)}). Strong support zone.`,
            confidence: "high",
            category: "floor",
        })
    }

    // Fibonacci Golden Zone Detection
    if (price <= fib.level_618 && price >= fib.level_786) {
        signals.push({
            type: "bullish",
            title: "Golden Zone Entry",
            description: `Price is in the 61.8%-78.6% Fibonacci retracement zone. High-probability reversal area.`,
            confidence: "high",
            category: "fibonacci",
        })
    }

    // 50% Retracement
    if (Math.abs(price - fib.level_500) / price < proximityThreshold) {
        signals.push({
            type: "neutral",
            title: "At 50% Retracement",
            description: `Price is at the 50% Fibonacci level (${fib.level_500.toFixed(2)}). Classic support/resistance.`,
            confidence: "medium",
            category: "fibonacci",
        })
    }

    // Breakout Signals
    if (price > fib.level_0) {
        signals.push({
            type: "bullish",
            title: "Breakout Above Swing High",
            description: `Price has broken above the swing high. Target Fibonacci extensions (127.2%, 161.8%).`,
            confidence: "medium",
            category: "fibonacci",
        })
    }
    if (price < fib.level_100) {
        signals.push({
            type: "bearish",
            title: "Breakdown Below Swing Low",
            description: `Price has broken below the swing low. Bearish continuation likely.`,
            confidence: "medium",
            category: "fibonacci",
        })
    }

    // Failed Retracement Signal
    if (price > fib.level_382 && price < fib.level_0) {
        signals.push({
            type: "bullish",
            title: "Shallow Retracement",
            description: `Price failed to reach 38.2% retracement. Strong trend momentum indicated.`,
            confidence: "medium",
            category: "fibonacci",
        })
    }

    // Extreme Levels
    if (price >= r3) {
        signals.push({
            type: "warning",
            title: "At R3 Extreme",
            description: `Price is at or above R3 (${r3.toFixed(2)}). Overbought territory - consider taking profits.`,
            confidence: "high",
            category: "floor",
        })
    }
    if (price <= s3) {
        signals.push({
            type: "warning",
            title: "At S3 Extreme",
            description: `Price is at or below S3 (${s3.toFixed(2)}). Oversold territory - potential reversal zone.`,
            confidence: "high",
            category: "floor",
        })
    }

    const getSignalIcon = (type: string) => {
        switch (type) {
            case "bullish": return <TrendingUp className="h-4 w-4" />
            case "bearish": return <TrendingDown className="h-4 w-4" />
            case "warning": return <AlertTriangle className="h-4 w-4" />
            default: return <Activity className="h-4 w-4" />
        }
    }

    // Group signals by type
    const bullishSignals = signals.filter(s => s.type === "bullish")
    const bearishSignals = signals.filter(s => s.type === "bearish")
    const warningSignals = signals.filter(s => s.type === "warning")
    const neutralSignals = signals.filter(s => s.type === "neutral")

    // Calculate overall bias
    const bullishCount = bullishSignals.length
    const bearishCount = bearishSignals.length
    const overallBias = bullishCount > bearishCount ? "bullish" : bearishCount > bullishCount ? "bearish" : "neutral"

    return (
        <StyledCard variant="orange">
            <StyledCardHeader
                icon={Zap}
                title="Signal Detection"
                description="Trading signals from pivot analysis"
                variant="orange"
                action={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm">
                                <BookOpen className="h-3 w-3 mr-1" />
                                Guide
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg text-white">
                                        <Zap className="h-4 w-4" />
                                    </div>
                                    Signal Detection Guide
                                </DialogTitle>
                                <DialogDescription>Understanding trading signals</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 mt-3 text-sm">
                                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                    <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Bullish Signals
                                    </div>
                                    <p className="text-green-600 text-xs">Price above CPR or approaching support levels. Consider long positions.</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                    <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                                        <TrendingDown className="h-4 w-4" />
                                        Bearish Signals
                                    </div>
                                    <p className="text-red-600 text-xs">Price below CPR or approaching resistance levels. Consider short positions.</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                                    <div className="flex items-center gap-2 font-semibold text-amber-700 mb-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        Warning Signals
                                    </div>
                                    <p className="text-amber-600 text-xs">Price near key levels or narrow CPR detected. Be cautious and watch for breakouts.</p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />
            <StyledCardContent>
                {/* Overall Bias Badge */}
                <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-slate-50 border">
                    <span className="text-xs text-slate-500">Overall Bias:</span>
                    <Badge
                        className={`text-xs ${overallBias === "bullish" ? "bg-green-100 text-green-700 border-green-300" :
                            overallBias === "bearish" ? "bg-red-100 text-red-700 border-red-300" :
                                "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                    >
                        {overallBias === "bullish" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {overallBias === "bearish" && <TrendingDown className="h-3 w-3 mr-1" />}
                        {overallBias.toUpperCase()} BIAS
                    </Badge>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* Compact Signal Summary - Always visible at top */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div className="p-1.5 rounded bg-green-50 border border-green-100">
                            <div className="text-base font-bold text-green-600">{bullishCount}</div>
                            <div className="text-[10px] text-green-600">Bullish</div>
                        </div>
                        <div className="p-1.5 rounded bg-red-50 border border-red-100">
                            <div className="text-base font-bold text-red-600">{bearishCount}</div>
                            <div className="text-[10px] text-red-600">Bearish</div>
                        </div>
                        <div className="p-1.5 rounded bg-amber-50 border border-amber-100">
                            <div className="text-base font-bold text-amber-600">{warningSignals.length}</div>
                            <div className="text-[10px] text-amber-600">Warning</div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                            <div className="text-base font-bold text-slate-600">{neutralSignals.length}</div>
                            <div className="text-[10px] text-slate-600">Neutral</div>
                        </div>
                    </div>

                    {/* Compact Signal List */}
                    {signals.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No signals at current price</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {signals.map((signal, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2 rounded border text-sm flex items-center justify-between gap-2 ${signal.type === "bullish" ? "bg-green-50/50 border-green-100" :
                                        signal.type === "bearish" ? "bg-red-50/50 border-red-100" :
                                            signal.type === "warning" ? "bg-amber-50/50 border-amber-100" :
                                                "bg-slate-50/50 border-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`shrink-0 ${signal.type === "bullish" ? "text-green-600" :
                                            signal.type === "bearish" ? "text-red-600" :
                                                signal.type === "warning" ? "text-amber-600" :
                                                    "text-slate-600"
                                            }`}>
                                            {getSignalIcon(signal.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-xs truncate">{signal.title}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{signal.description.slice(0, 60)}...</div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`shrink-0 text-[10px] px-1.5 py-0 ${signal.confidence === "high" ? "bg-green-100 text-green-700 border-green-200" :
                                            signal.confidence === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                "bg-slate-100 text-slate-600 border-slate-200"
                                            }`}
                                    >
                                        {signal.confidence === "high" ? "High" : signal.confidence === "medium" ? "Med" : "Low"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </StyledCardContent>
        </StyledCard>
    )
}

export default SignalDetectionPanel
