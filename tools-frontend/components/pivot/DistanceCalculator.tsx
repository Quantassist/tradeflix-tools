"use client"

import { useState } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ruler, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, BookOpen, Target } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { PivotResponse } from "@/types"
import { formatNumber } from "@/lib/utils"

type DistanceCalculatorProps = {
    pivotData: PivotResponse
    initialPrice?: number
}

type LevelInfo = {
    name: string
    value: number
    type: "resistance" | "support" | "pivot" | "fibonacci"
    category: string
}

export function DistanceCalculator({ pivotData, initialPrice }: DistanceCalculatorProps) {
    const defaultPrice = initialPrice || pivotData.ohlc.close
    const [currentPrice, setCurrentPrice] = useState<number>(defaultPrice)
    const [inputPrice, setInputPrice] = useState<string>(String(defaultPrice))

    const handlePriceUpdate = () => {
        const price = parseFloat(inputPrice)
        if (!isNaN(price) && price > 0) {
            setCurrentPrice(price)
        }
    }

    // Collect all levels
    const allLevels: LevelInfo[] = [
        // CPR Levels
        { name: "TC (Top Central)", value: pivotData.cpr.tc, type: "pivot", category: "CPR" },
        { name: "Pivot", value: pivotData.cpr.pivot, type: "pivot", category: "CPR" },
        { name: "BC (Bottom Central)", value: pivotData.cpr.bc, type: "pivot", category: "CPR" },
        // Floor Pivots
        { name: "R3", value: pivotData.floor_pivots.r3, type: "resistance", category: "Floor" },
        { name: "R2", value: pivotData.floor_pivots.r2, type: "resistance", category: "Floor" },
        { name: "R1", value: pivotData.floor_pivots.r1, type: "resistance", category: "Floor" },
        { name: "S1", value: pivotData.floor_pivots.s1, type: "support", category: "Floor" },
        { name: "S2", value: pivotData.floor_pivots.s2, type: "support", category: "Floor" },
        { name: "S3", value: pivotData.floor_pivots.s3, type: "support", category: "Floor" },
        // Fibonacci Levels
        { name: "Fib 0%", value: pivotData.fibonacci.level_0, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 23.6%", value: pivotData.fibonacci.level_236, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 38.2%", value: pivotData.fibonacci.level_382, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 50%", value: pivotData.fibonacci.level_500, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 61.8%", value: pivotData.fibonacci.level_618, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 78.6%", value: pivotData.fibonacci.level_786, type: "fibonacci", category: "Fibonacci" },
        { name: "Fib 100%", value: pivotData.fibonacci.level_100, type: "fibonacci", category: "Fibonacci" },
    ]

    // Add extension levels if available
    if (pivotData.fibonacci.ext_1272) {
        allLevels.push({ name: "Fib 127.2%", value: pivotData.fibonacci.ext_1272, type: "fibonacci", category: "Extensions" })
    }
    if (pivotData.fibonacci.ext_1618) {
        allLevels.push({ name: "Fib 161.8%", value: pivotData.fibonacci.ext_1618, type: "fibonacci", category: "Extensions" })
    }
    if (pivotData.fibonacci.ext_2000) {
        allLevels.push({ name: "Fib 200%", value: pivotData.fibonacci.ext_2000, type: "fibonacci", category: "Extensions" })
    }
    if (pivotData.fibonacci.ext_2618) {
        allLevels.push({ name: "Fib 261.8%", value: pivotData.fibonacci.ext_2618, type: "fibonacci", category: "Extensions" })
    }

    // Sort by value (descending - highest first)
    const sortedLevels = [...allLevels].sort((a, b) => b.value - a.value)

    // Find nearest level
    const nearestLevel = sortedLevels.reduce((nearest, level) => {
        const currentDistance = Math.abs(level.value - currentPrice)
        const nearestDistance = Math.abs(nearest.value - currentPrice)
        return currentDistance < nearestDistance ? level : nearest
    }, sortedLevels[0])

    // Find next resistance and support
    const nextResistance = sortedLevels.find(l => l.value > currentPrice)
    const nextSupport = [...sortedLevels].reverse().find(l => l.value < currentPrice)

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "resistance": return <TrendingUp className="h-3 w-3" />
            case "support": return <TrendingDown className="h-3 w-3" />
            case "pivot": return <Minus className="h-3 w-3" />
            default: return null
        }
    }

    return (
        <StyledCard variant="indigo">
            <StyledCardHeader
                icon={Ruler}
                title="Distance Calculator"
                description="Distance to key levels"
                variant="indigo"
                action={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm">
                                <BookOpen className="h-3 w-3 mr-1" />
                                Guide
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                                        <Ruler className="h-4 w-4" />
                                    </div>
                                    Distance Calculator Guide
                                </DialogTitle>
                                <DialogDescription>Understanding price distances to pivot levels</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 mt-3 text-sm">
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                    <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                                        <ArrowUp className="h-4 w-4" />
                                        Next Resistance
                                    </div>
                                    <p className="text-red-600 text-xs">The nearest level above current price. Consider taking profits or placing stop-loss here.</p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                    <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                                        <ArrowDown className="h-4 w-4" />
                                        Next Support
                                    </div>
                                    <p className="text-green-600 text-xs">The nearest level below current price. Consider buying or placing stop-loss here.</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                                    <div className="flex items-center gap-2 font-semibold text-amber-700 mb-1">
                                        <Target className="h-4 w-4" />
                                        Nearest Level
                                    </div>
                                    <p className="text-amber-600 text-xs">The closest pivot level to current price. Watch for reactions here.</p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />
            <StyledCardContent>
                {/* Price Input Row */}
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-slate-50 border">
                    <span className="text-xs text-slate-500">Price:</span>
                    <Input
                        type="number"
                        step="0.01"
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePriceUpdate()}
                        className="font-mono h-7 w-28 text-sm bg-white"
                    />
                    <Button onClick={handlePriceUpdate} variant="outline" size="sm" className="h-7 text-xs">
                        Update
                    </Button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* PROMINENT: Next Resistance & Support - Always visible at top */}
                    <div className="grid grid-cols-2 gap-2">
                        {nextResistance ? (
                            <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                                <div className="flex items-center gap-1 text-red-600 text-[10px] font-semibold uppercase mb-0.5">
                                    <ArrowUp className="h-3 w-3" />
                                    Next Resistance
                                </div>
                                <div className="font-mono font-bold text-lg text-red-700">
                                    ₹{formatNumber(nextResistance.value)}
                                </div>
                                <div className="text-xs text-red-600 font-medium">
                                    +₹{formatNumber(nextResistance.value - currentPrice)} <span className="opacity-70">({((nextResistance.value - currentPrice) / currentPrice * 100).toFixed(2)}%)</span>
                                </div>
                                <div className="text-[10px] text-red-500 mt-1">{nextResistance.name}</div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-muted-foreground text-sm">
                                No resistance above
                            </div>
                        )}
                        {nextSupport ? (
                            <div className="p-3 rounded-lg bg-green-50 border-2 border-green-200">
                                <div className="flex items-center gap-1 text-green-600 text-[10px] font-semibold uppercase mb-0.5">
                                    <ArrowDown className="h-3 w-3" />
                                    Next Support
                                </div>
                                <div className="font-mono font-bold text-lg text-green-700">
                                    ₹{formatNumber(nextSupport.value)}
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                    -₹{formatNumber(currentPrice - nextSupport.value)} <span className="opacity-70">({((currentPrice - nextSupport.value) / currentPrice * 100).toFixed(2)}%)</span>
                                </div>
                                <div className="text-[10px] text-green-500 mt-1">{nextSupport.name}</div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-muted-foreground text-sm">
                                No support below
                            </div>
                        )}
                    </div>

                    {/* Nearest Level Highlight */}
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                                NEAREST
                            </Badge>
                            <span className="text-sm font-medium">{nearestLevel.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-mono font-semibold text-sm">₹{formatNumber(nearestLevel.value)}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                                {Math.abs((nearestLevel.value - currentPrice) / currentPrice * 100).toFixed(2)}% away
                            </span>
                        </div>
                    </div>

                    {/* Compact All Levels List */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {sortedLevels.map((level, idx) => {
                            const distance = level.value - currentPrice
                            const distancePercent = (distance / currentPrice) * 100
                            const isNearest = level.name === nearestLevel.name
                            const isAbove = distance > 0

                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-1.5 rounded text-sm border ${isNearest
                                        ? "bg-amber-50 border-amber-200"
                                        : "bg-slate-50/50 border-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {getTypeIcon(level.type)}
                                        <span className="font-medium text-xs">{level.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-mono font-medium">₹{formatNumber(level.value)}</span>
                                        <span className={`font-mono min-w-[50px] text-right ${isAbove ? "text-red-500" : "text-green-500"}`}>
                                            {isAbove ? "+" : ""}{distancePercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </StyledCardContent>
        </StyledCard>
    )
}

export default DistanceCalculator
