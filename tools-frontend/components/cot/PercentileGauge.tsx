"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Building2, Briefcase, Target, Users } from "lucide-react"
import type { CategoryPercentile } from "@/types"
import { formatNumber } from "@/lib/utils"
import { getSentimentColor, getSentimentLabel } from "./utils"

const getCategoryIcon = (category: string) => {
    switch (category) {
        case "Producer/Merchant": return <Building2 className="h-4 w-4" />
        case "Swap Dealer": return <Briefcase className="h-4 w-4" />
        case "Managed Money": return <Target className="h-4 w-4" />
        case "Other Reportables": return <Users className="h-4 w-4" />
        default: return <Users className="h-4 w-4" />
    }
}

export function PercentileGauge({ percentile, label }: { percentile: CategoryPercentile; label: string }) {
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
