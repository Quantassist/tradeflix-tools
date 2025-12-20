"use client"

import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

type ArbitrageLevel = "strong_discount" | "discount" | "fair" | "premium" | "strong_premium"

type ArbitrageHeatmapProps = {
    premiumPercent: number
    premium: number
    signal: string
    commodity?: string
}

function getArbitrageLevel(premiumPercent: number): ArbitrageLevel {
    if (premiumPercent < -0.8) return "strong_discount"
    if (premiumPercent < -0.3) return "discount"
    if (premiumPercent > 1.2) return "strong_premium"
    if (premiumPercent > 0.7) return "premium"
    return "fair"
}

function getHeatmapConfig(level: ArbitrageLevel, t: (key: string) => string) {
    const configs = {
        strong_discount: {
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-linear-to-br from-green-50 to-emerald-100",
            borderColor: "border-green-400",
            textColor: "text-green-700",
            label: t('strongDiscount'),
            description: t('strongDiscountDesc'),
            icon: TrendingUp,
            action: t('buyMcx'),
        },
        discount: {
            color: "from-green-400 to-green-500",
            bgColor: "bg-linear-to-br from-green-50 to-green-100",
            borderColor: "border-green-300",
            textColor: "text-green-600",
            label: t('discount'),
            description: t('discountDesc'),
            icon: TrendingUp,
            action: t('considerBuy'),
        },
        fair: {
            color: "from-yellow-400 to-amber-500",
            bgColor: "bg-linear-to-br from-yellow-50 to-amber-100",
            borderColor: "border-yellow-300",
            textColor: "text-yellow-700",
            label: t('fairValue'),
            description: t('fairValueDesc'),
            icon: Minus,
            action: t('neutral'),
        },
        premium: {
            color: "from-orange-400 to-orange-500",
            bgColor: "bg-linear-to-br from-orange-50 to-orange-100",
            borderColor: "border-orange-300",
            textColor: "text-orange-600",
            label: t('premium'),
            description: t('premiumDesc'),
            icon: TrendingDown,
            action: t('considerSell'),
        },
        strong_premium: {
            color: "from-red-500 to-rose-600",
            bgColor: "bg-linear-to-br from-red-50 to-rose-100",
            borderColor: "border-red-400",
            textColor: "text-red-700",
            label: t('strongPremium'),
            description: t('strongPremiumDesc'),
            icon: TrendingDown,
            action: t('sellMcx'),
        },
    }
    return configs[level]
}

const heatmapScale = [
    { level: "strong_discount" as const, range: "< -0.8%", color: "bg-green-500" },
    { level: "discount" as const, range: "-0.8% to -0.3%", color: "bg-green-400" },
    { level: "fair" as const, range: "±0.3% to ±0.7%", color: "bg-yellow-400" },
    { level: "premium" as const, range: "0.7% to 1.2%", color: "bg-orange-400" },
    { level: "strong_premium" as const, range: "> 1.2%", color: "bg-red-500" },
]

export function ArbitrageHeatmap({ premiumPercent, premium, signal, commodity = "GOLD" }: ArbitrageHeatmapProps) {
    const t = useTranslations('arbitrage.heatmap')
    const level = getArbitrageLevel(premiumPercent)
    const config = getHeatmapConfig(level, t)
    const Icon = config.icon

    return (
        <StyledCard variant="amber" className={cn(config.borderColor)}>
            <StyledCardHeader
                icon={Activity}
                title={t('title')}
                description={`${t('description')} - ${commodity}`}
                variant="amber"
                action={
                    <Badge className={cn("text-sm px-3 py-1 shadow-sm", config.bgColor, config.textColor, config.borderColor)}>
                        {config.action}
                    </Badge>
                }
            />
            <StyledCardContent className="space-y-6">
                {/* Main Heatmap Display */}
                <div className={cn("rounded-2xl p-6 border-2 transition-all duration-500", config.bgColor, config.borderColor)}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-3 rounded-xl bg-linear-to-br", config.color)}>
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className={cn("text-2xl font-bold", config.textColor)}>{config.label}</h3>
                                <p className="text-sm text-muted-foreground">{config.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Premium Display */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('premiumPercent')}</p>
                            <p className={cn("text-3xl font-bold font-mono", config.textColor)}>
                                {premiumPercent > 0 ? "+" : ""}{premiumPercent.toFixed(3)}%
                            </p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('premiumRupees')}</p>
                            <p className={cn("text-3xl font-bold font-mono", config.textColor)}>
                                {premium > 0 ? "+" : ""}₹{premium.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Heatmap Scale Legend */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{t('arbitrageScale')}</h4>
                    <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                        {heatmapScale.map((item) => (
                            <div
                                key={item.level}
                                className={cn(
                                    "flex-1 transition-all duration-300",
                                    item.color,
                                    level === item.level ? "ring-2 ring-offset-2 ring-gray-900 scale-105 z-10" : "opacity-70"
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('strongDiscount')}</span>
                        <span>{t('fairValue')}</span>
                        <span>{t('strongPremium')}</span>
                    </div>
                </div>

                {/* Scale Details */}
                <div className="grid grid-cols-5 gap-2 text-xs">
                    {heatmapScale.map((item) => (
                        <div
                            key={item.level}
                            className={cn(
                                "p-2 rounded-lg text-center transition-all duration-300",
                                level === item.level ? "bg-gray-100 ring-1 ring-gray-300" : ""
                            )}
                        >
                            <div className={cn("w-4 h-4 rounded mx-auto mb-1", item.color)} />
                            <p className="font-medium">{item.range}</p>
                        </div>
                    ))}
                </div>

                {/* Signal Info */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                    <span className="text-sm text-muted-foreground">{t('currentSignal')}</span>
                    <Badge variant={signal.includes("long") ? "default" : signal.includes("short") ? "destructive" : "secondary"}>
                        {signal.toUpperCase().replace("_", " ")}
                    </Badge>
                </div>
            </StyledCardContent>
        </StyledCard>
    )
}
