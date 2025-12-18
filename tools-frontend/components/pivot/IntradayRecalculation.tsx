"use client"

import { useState } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCcw, Clock, TrendingUp, TrendingDown, AlertCircle, BookOpen, Target, Lightbulb, Timer } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { PivotResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"

type IntradayRecalculationProps = {
    originalPivotData: PivotResponse | null
}

export function IntradayRecalculation({ originalPivotData }: IntradayRecalculationProps) {
    const [intradayHigh, setIntradayHigh] = useState("")
    const [intradayLow, setIntradayLow] = useState("")
    const [currentPrice, setCurrentPrice] = useState("")
    const [recalculatedData, setRecalculatedData] = useState<{
        newCPR: { tc: number; pivot: number; bc: number; width: number }
        newFloor: { r1: number; r2: number; r3: number; s1: number; s2: number; s3: number; pivot: number }
        comparison: { cprShift: string; biasChange: string }
    } | null>(null)

    const handleRecalculate = () => {
        if (!originalPivotData) {
            toast.error("Calculate original pivots first")
            return
        }

        const high = parseFloat(intradayHigh)
        const low = parseFloat(intradayLow)
        const close = parseFloat(currentPrice) || originalPivotData.ohlc.close

        if (isNaN(high) || isNaN(low)) {
            toast.error("Please enter valid intraday high and low values")
            return
        }

        if (high <= low) {
            toast.error("High must be greater than low")
            return
        }

        // Calculate new CPR using intraday data
        const newPivot = (high + low + close) / 3
        const newBC = (high + low) / 2
        const newTC = 2 * newPivot - newBC
        const newWidth = Math.abs(newTC - newBC)

        // Calculate new floor pivots
        const range = high - low
        const newR1 = 2 * newPivot - low
        const newR2 = newPivot + range
        const newR3 = newR1 + range
        const newS1 = 2 * newPivot - high
        const newS2 = newPivot - range
        const newS3 = newS1 - range

        // Compare with original
        const originalPivot = originalPivotData.cpr.pivot
        const pivotShift = newPivot - originalPivot
        const pivotShiftPercent = (pivotShift / originalPivot) * 100

        let cprShift = "neutral"
        if (pivotShiftPercent > 0.3) cprShift = "bullish"
        else if (pivotShiftPercent < -0.3) cprShift = "bearish"

        const priceAboveNewPivot = close > newPivot
        const priceAboveOldPivot = close > originalPivot
        let biasChange = "unchanged"
        if (priceAboveNewPivot !== priceAboveOldPivot) {
            biasChange = priceAboveNewPivot ? "turned bullish" : "turned bearish"
        }

        setRecalculatedData({
            newCPR: { tc: newTC, pivot: newPivot, bc: newBC, width: newWidth },
            newFloor: { r1: newR1, r2: newR2, r3: newR3, s1: newS1, s2: newS2, s3: newS3, pivot: newPivot },
            comparison: { cprShift, biasChange },
        })

        toast.success("Pivots recalculated with intraday data")
    }

    const handleReset = () => {
        setIntradayHigh("")
        setIntradayLow("")
        setCurrentPrice("")
        setRecalculatedData(null)
    }

    return (
        <StyledCard variant="purple">
            <StyledCardHeader
                icon={RefreshCcw}
                title="Intraday Recalculation"
                description="Recalculate pivots using current session's high/low for dynamic levels"
                variant="purple"
                action={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md">
                                <BookOpen className="h-4 w-4 mr-2" />
                                How to Use
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg text-white">
                                        <RefreshCcw className="h-4 w-4" />
                                    </div>
                                    Intraday Recalculation Guide
                                </DialogTitle>
                                <DialogDescription>Master dynamic pivot levels for real-time trading decisions</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4 text-sm">
                                {/* What is it */}
                                <div className="p-4 rounded-xl bg-linear-to-br from-violet-50 to-purple-50 border border-violet-100">
                                    <h4 className="font-bold text-violet-800 mb-2 flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" />
                                        What is Intraday Recalculation?
                                    </h4>
                                    <p className="text-violet-700 text-xs">
                                        Traditional pivots use <strong>yesterday&apos;s</strong> high/low/close. Intraday recalculation uses <strong>today&apos;s developing</strong> high/low to create dynamic levels that adapt as the session progresses.
                                    </p>
                                </div>

                                {/* When to use */}
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                        <Timer className="h-4 w-4" />
                                        When to Use This Feature
                                    </h4>
                                    <ul className="text-blue-700 text-xs space-y-1">
                                        <li>• <strong>Mid-session adjustments:</strong> After a significant move breaks original pivots</li>
                                        <li>• <strong>Gap days:</strong> When market opens far from previous close</li>
                                        <li>• <strong>High volatility:</strong> When original pivots become irrelevant</li>
                                        <li>• <strong>Afternoon trading:</strong> To get fresh levels for the second half</li>
                                    </ul>
                                </div>

                                {/* Real-life example */}
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Real-Life Trading Example
                                    </h4>
                                    <div className="text-amber-700 text-xs space-y-2">
                                        <p><strong>Scenario:</strong> Gold opens at ₹62,500 (yesterday&apos;s close: ₹62,000). By 11 AM, it has made a high of ₹62,800 and low of ₹62,400.</p>
                                        <p><strong>Problem:</strong> Original pivots based on yesterday&apos;s range are now too low and not useful.</p>
                                        <p><strong>Solution:</strong> Enter today&apos;s high (62,800) and low (62,400) to get new pivot levels that reflect current market conditions.</p>
                                        <p><strong>Result:</strong> Fresh S1/R1 levels that are actually relevant for afternoon trading decisions.</p>
                                    </div>
                                </div>

                                {/* How to interpret */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                        <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                                            <TrendingUp className="h-4 w-4" />
                                            Bullish Shift
                                        </div>
                                        <p className="text-green-600 text-xs">New pivot is higher than original. Market is showing strength - look for long entries at new supports.</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                        <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                                            <TrendingDown className="h-4 w-4" />
                                            Bearish Shift
                                        </div>
                                        <p className="text-red-600 text-xs">New pivot is lower than original. Market is showing weakness - look for short entries at new resistances.</p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />
            <StyledCardContent>
                <div className="space-y-4">
                    {!originalPivotData ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Calculate original pivots first to enable intraday recalculation</p>
                        </div>
                    ) : (
                        <>
                            {/* Input Fields - Compact 2-column layout */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Intraday High</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={formatNumber(originalPivotData.ohlc.high)}
                                        value={intradayHigh}
                                        onChange={(e) => setIntradayHigh(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Intraday Low</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={formatNumber(originalPivotData.ohlc.low)}
                                        value={intradayLow}
                                        onChange={(e) => setIntradayLow(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Current Price (optional)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={formatNumber(originalPivotData.ohlc.close)}
                                        value={currentPrice}
                                        onChange={(e) => setCurrentPrice(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleRecalculate} className="gap-2">
                                    <RefreshCcw className="h-4 w-4" />
                                    Recalculate
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>

                            {/* Results */}
                            {recalculatedData && (
                                <div className="space-y-4 pt-4 border-t">
                                    {/* Comparison Alert */}
                                    <div className={`p-3 rounded-lg border ${recalculatedData.comparison.cprShift === "bullish"
                                        ? "bg-green-50 border-green-200"
                                        : recalculatedData.comparison.cprShift === "bearish"
                                            ? "bg-red-50 border-red-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {recalculatedData.comparison.cprShift === "bullish" && <TrendingUp className="h-4 w-4 text-green-600" />}
                                            {recalculatedData.comparison.cprShift === "bearish" && <TrendingDown className="h-4 w-4 text-red-600" />}
                                            {recalculatedData.comparison.cprShift === "neutral" && <AlertCircle className="h-4 w-4 text-gray-600" />}
                                            <span className="font-medium">
                                                CPR Shift: {recalculatedData.comparison.cprShift.toUpperCase()}
                                            </span>
                                        </div>
                                        {recalculatedData.comparison.biasChange !== "unchanged" && (
                                            <p className="text-sm text-muted-foreground">
                                                Market bias has {recalculatedData.comparison.biasChange}
                                            </p>
                                        )}
                                    </div>

                                    {/* New CPR Levels */}
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Recalculated CPR
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                                                <div className="text-xs text-blue-600">TC</div>
                                                <div className="font-mono font-semibold">₹{formatNumber(recalculatedData.newCPR.tc)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    vs ₹{formatNumber(originalPivotData.cpr.tc)}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                                                <div className="text-xs text-blue-600">Pivot</div>
                                                <div className="font-mono font-semibold">₹{formatNumber(recalculatedData.newCPR.pivot)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    vs ₹{formatNumber(originalPivotData.cpr.pivot)}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                                                <div className="text-xs text-blue-600">BC</div>
                                                <div className="font-mono font-semibold">₹{formatNumber(recalculatedData.newCPR.bc)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    vs ₹{formatNumber(originalPivotData.cpr.bc)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Floor Pivots */}
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Recalculated Floor Pivots
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="space-y-1">
                                                <div className="flex justify-between p-1.5 rounded bg-red-50 text-red-700">
                                                    <span>R3:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.r3)}</span>
                                                </div>
                                                <div className="flex justify-between p-1.5 rounded bg-red-50 text-red-600">
                                                    <span>R2:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.r2)}</span>
                                                </div>
                                                <div className="flex justify-between p-1.5 rounded bg-red-50 text-red-500">
                                                    <span>R1:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.r1)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between p-1.5 rounded bg-green-50 text-green-500">
                                                    <span>S1:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.s1)}</span>
                                                </div>
                                                <div className="flex justify-between p-1.5 rounded bg-green-50 text-green-600">
                                                    <span>S2:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.s2)}</span>
                                                </div>
                                                <div className="flex justify-between p-1.5 rounded bg-green-50 text-green-700">
                                                    <span>S3:</span>
                                                    <span className="font-mono">₹{formatNumber(recalculatedData.newFloor.s3)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Note */}
                                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                                        <strong>Note:</strong> Intraday recalculation uses current session data to provide
                                        dynamic pivot levels. These are useful for adjusting your trading plan as the
                                        session progresses.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </StyledCardContent>
        </StyledCard>
    )
}

export default IntradayRecalculation
