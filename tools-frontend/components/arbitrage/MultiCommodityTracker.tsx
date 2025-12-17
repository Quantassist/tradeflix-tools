"use client"

import { useState, useEffect } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, TrendingUp, TrendingDown, Minus, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { arbitrageApi } from "@/lib/api/arbitrage"
import { toast } from "sonner"

type CommodityData = {
    symbol: string
    name: string
    comexPrice: number
    mcxPrice: number
    fairValue: number
    premium: number
    premiumPercent: number
    signal: string
    loading: boolean
    error: string | null
    mcxSource: string
}

type CommodityConfig = {
    symbol: string
    name: string
    contractSize: number
    unit: string
    importDuty: number
}

const COMMODITIES: CommodityConfig[] = [
    { symbol: "GOLD", name: "Gold", contractSize: 10, unit: "10g", importDuty: 2.5 },
    { symbol: "SILVER", name: "Silver", contractSize: 1, unit: "1kg", importDuty: 2.5 },
]

function getSignalConfig(signal: string) {
    if (signal.includes("strong_long")) {
        return { icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", label: "Strong Buy" }
    }
    if (signal.includes("long")) {
        return { icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", label: "Buy" }
    }
    if (signal.includes("strong_short")) {
        return { icon: TrendingDown, color: "text-red-600", bg: "bg-red-100", label: "Strong Sell" }
    }
    if (signal.includes("short")) {
        return { icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", label: "Sell" }
    }
    return { icon: Minus, color: "text-yellow-600", bg: "bg-yellow-50", label: "Neutral" }
}

function getPremiumColor(premiumPercent: number) {
    if (premiumPercent < -0.8) return "bg-green-500"
    if (premiumPercent < -0.3) return "bg-green-400"
    if (premiumPercent > 1.2) return "bg-red-500"
    if (premiumPercent > 0.7) return "bg-orange-400"
    return "bg-yellow-400"
}

export function MultiCommodityTracker() {
    const [commodities, setCommodities] = useState<CommodityData[]>(
        COMMODITIES.map((c) => ({
            symbol: c.symbol,
            name: c.name,
            comexPrice: 0,
            mcxPrice: 0,
            fairValue: 0,
            premium: 0,
            premiumPercent: 0,
            signal: "neutral",
            loading: false,
            error: null,
            mcxSource: "",
        }))
    )
    const [refreshing, setRefreshing] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchCommodityData = async (symbol: string, config: CommodityConfig) => {
        try {
            const data = await arbitrageApi.getRealtime(symbol)
            return {
                symbol,
                name: config.name,
                comexPrice: data.fair_value?.comex_price_usd || 0,
                mcxPrice: data.arbitrage?.mcx_price || 0,
                fairValue: data.arbitrage?.fair_value || 0,
                premium: data.arbitrage?.premium || 0,
                premiumPercent: data.arbitrage?.premium_percent || 0,
                signal: data.arbitrage?.signal || "neutral",
                loading: false,
                error: null,
                mcxSource: data.data_sources?.mcx || "unknown",
            }
        } catch {
            return {
                symbol,
                name: config.name,
                comexPrice: 0,
                mcxPrice: 0,
                fairValue: 0,
                premium: 0,
                premiumPercent: 0,
                signal: "neutral",
                loading: false,
                error: "Failed to fetch",
                mcxSource: "",
            }
        }
    }

    const refreshAll = async () => {
        setRefreshing(true)
        setCommodities((prev) => prev.map((c) => ({ ...c, loading: true })))

        try {
            const results = await Promise.all(
                COMMODITIES.map((config) => fetchCommodityData(config.symbol, config))
            )
            setCommodities(results)
            setLastUpdated(new Date())

            const successCount = results.filter((r) => !r.error).length
            if (successCount === results.length) {
                toast.success(`All ${successCount} commodities updated`)
            } else {
                toast.warning(`${successCount}/${results.length} commodities updated`)
            }
        } catch {
            toast.error("Failed to refresh commodity data")
        } finally {
            setRefreshing(false)
        }
    }

    useEffect(() => {
        refreshAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <StyledCard variant="indigo">
            <StyledCardHeader
                icon={Layers}
                title="Multi-Commodity Tracker"
                description="Real-time arbitrage across multiple commodities"
                variant="indigo"
                action={
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-xs text-muted-foreground">
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshAll}
                            disabled={refreshing}
                            className="gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                            Refresh All
                        </Button>
                    </div>
                }
            />
            <StyledCardContent>
                <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-7 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <div>Commodity</div>
                        <div className="text-right">COMEX</div>
                        <div className="text-right">MCX</div>
                        <div className="text-right">Fair Value</div>
                        <div className="text-right">Premium</div>
                        <div className="text-center">Heatmap</div>
                        <div className="text-center">Signal</div>
                    </div>

                    {/* Commodity Rows */}
                    {commodities.map((commodity) => {
                        const signalConfig = getSignalConfig(commodity.signal)
                        const SignalIcon = signalConfig.icon

                        return (
                            <div
                                key={commodity.symbol}
                                className={cn(
                                    "grid grid-cols-7 gap-4 px-4 py-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md",
                                    commodity.error
                                        ? "border-red-200 bg-red-50/50"
                                        : "border-gray-100 hover:border-gray-200"
                                )}
                            >
                                {/* Commodity Name */}
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold">{commodity.name}</div>
                                    {commodity.mcxSource === "estimated" && (
                                        <Badge variant="outline" className="text-xs">Est.</Badge>
                                    )}
                                </div>

                                {/* COMEX Price */}
                                <div className="text-right">
                                    {commodity.loading ? (
                                        <Skeleton className="h-5 w-20 ml-auto" />
                                    ) : (
                                        <span className="font-mono">${commodity.comexPrice.toFixed(2)}</span>
                                    )}
                                </div>

                                {/* MCX Price */}
                                <div className="text-right">
                                    {commodity.loading ? (
                                        <Skeleton className="h-5 w-24 ml-auto" />
                                    ) : (
                                        <span className="font-mono">₹{commodity.mcxPrice.toFixed(2)}</span>
                                    )}
                                </div>

                                {/* Fair Value */}
                                <div className="text-right">
                                    {commodity.loading ? (
                                        <Skeleton className="h-5 w-24 ml-auto" />
                                    ) : (
                                        <span className="font-mono text-muted-foreground">
                                            ₹{commodity.fairValue.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Premium */}
                                <div className="text-right">
                                    {commodity.loading ? (
                                        <Skeleton className="h-5 w-16 ml-auto" />
                                    ) : (
                                        <span
                                            className={cn(
                                                "font-mono font-semibold",
                                                commodity.premiumPercent > 0 ? "text-red-600" : "text-green-600"
                                            )}
                                        >
                                            {commodity.premiumPercent > 0 ? "+" : ""}
                                            {commodity.premiumPercent.toFixed(2)}%
                                        </span>
                                    )}
                                </div>

                                {/* Heatmap Bar */}
                                <div className="flex items-center justify-center">
                                    {commodity.loading ? (
                                        <Skeleton className="h-4 w-full" />
                                    ) : (
                                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500",
                                                    getPremiumColor(commodity.premiumPercent)
                                                )}
                                                style={{
                                                    width: `${Math.min(100, Math.max(10, 50 + commodity.premiumPercent * 20))}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Signal */}
                                <div className="flex items-center justify-center">
                                    {commodity.loading ? (
                                        <Skeleton className="h-6 w-20" />
                                    ) : commodity.error ? (
                                        <Badge variant="destructive" className="text-xs">Error</Badge>
                                    ) : (
                                        <Badge className={cn("gap-1", signalConfig.bg, signalConfig.color)}>
                                            <SignalIcon className="h-3 w-3" />
                                            {signalConfig.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Cross-Commodity Analysis */}
                {!refreshing && commodities.filter((c) => !c.error).length >= 2 && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                        <h4 className="font-medium text-sm mb-2">Cross-Commodity Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                            {(() => {
                                const gold = commodities.find((c) => c.symbol === "GOLD")
                                const silver = commodities.find((c) => c.symbol === "SILVER")
                                if (!gold || !silver || gold.error || silver.error) return "Insufficient data for analysis"

                                const goldPremium = gold.premiumPercent
                                const silverPremium = silver.premiumPercent
                                const diff = Math.abs(goldPremium - silverPremium)

                                if (diff > 0.5) {
                                    if (goldPremium > silverPremium) {
                                        return `Gold premium (${goldPremium.toFixed(2)}%) is ${diff.toFixed(2)}% higher than Silver (${silverPremium.toFixed(2)}%) - Gold may correct relative to Silver`
                                    } else {
                                        return `Silver premium (${silverPremium.toFixed(2)}%) is ${diff.toFixed(2)}% higher than Gold (${goldPremium.toFixed(2)}%) - Silver may correct relative to Gold`
                                    }
                                }
                                return `Gold and Silver premiums are aligned (${goldPremium.toFixed(2)}% vs ${silverPremium.toFixed(2)}%) - No divergence detected`
                            })()}
                        </p>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
