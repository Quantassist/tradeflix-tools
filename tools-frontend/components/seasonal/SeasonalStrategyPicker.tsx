"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CardContent } from "@/components/ui/card"
import { StyledCard, StyledCardHeader } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Play,
    TrendingUp,
    TrendingDown,
    Calendar,
    Sparkles,
    Building2,
    Sun,
    ArrowRight,
    Info,
    BookOpen
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTranslations } from 'next-intl'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// Seasonal strategy templates that match the backend
export interface SeasonalStrategy {
    id: string
    name: string
    description: string
    category: "seasonal"
    strategy_type: "festival" | "monthly" | "economic"
    historical_avg_return: number
    historical_win_rate: number
    entry_logic: Record<string, unknown>
    exit_logic: Record<string, unknown>
    stopLossPct: number
    takeProfitPct: number
    notes: string
}

const SEASONAL_STRATEGIES: SeasonalStrategy[] = [
    {
        id: "seasonal-diwali-long",
        name: "Diwali Season Long",
        description: "Buy 10 days before Diwali, exit 5 days after",
        category: "seasonal",
        strategy_type: "festival",
        historical_avg_return: 2.3,
        historical_win_rate: 75,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "DIWALI" },
                    comparator: "LESS_THAN",
                    value: 11,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "DIWALI" },
                    comparator: "GREATER_THAN",
                    value: 0,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "DAYS_FROM_EVENT", event: "DIWALI" },
                    comparator: "GREATER_THAN",
                    value: 5,
                },
            ],
        },
        stopLossPct: 3.0,
        takeProfitPct: 5.0,
        notes: "Peak gold buying season in India. Dhanteras sees highest demand.",
    },
    {
        id: "seasonal-akshaya-tritiya",
        name: "Akshaya Tritiya",
        description: "Buy 7 days before Akshaya Tritiya",
        category: "seasonal",
        strategy_type: "festival",
        historical_avg_return: 1.8,
        historical_win_rate: 70,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "AKSHAYA_TRITIYA" },
                    comparator: "LESS_THAN",
                    value: 8,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "AKSHAYA_TRITIYA" },
                    comparator: "GREATER_THAN",
                    value: 0,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "DAYS_FROM_EVENT", event: "AKSHAYA_TRITIYA" },
                    comparator: "GREATER_THAN",
                    value: 3,
                },
            ],
        },
        stopLossPct: 2.5,
        takeProfitPct: 4.0,
        notes: "Most auspicious day for gold purchase.",
    },
    {
        id: "seasonal-dhanteras-quick",
        name: "Dhanteras Quick",
        description: "Short-term trade around Dhanteras",
        category: "seasonal",
        strategy_type: "festival",
        historical_avg_return: 1.2,
        historical_win_rate: 68,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "DHANTERAS" },
                    comparator: "LESS_THAN",
                    value: 4,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "DHANTERAS" },
                    comparator: "GREATER_THAN",
                    value: 0,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "DAYS_FROM_EVENT", event: "DHANTERAS" },
                    comparator: "GREATER_THAN",
                    value: 1,
                },
            ],
        },
        stopLossPct: 1.5,
        takeProfitPct: 2.5,
        notes: "Peak gold buying day of the year.",
    },
    {
        id: "seasonal-favorable-months",
        name: "Favorable Months",
        description: "Trade only during Sep-Feb with RSI filter",
        category: "seasonal",
        strategy_type: "monthly",
        historical_avg_return: 8.5,
        historical_win_rate: 62,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "IS_FAVORABLE_MONTH" },
                    comparator: "EQUALS",
                    value: 1,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "RSI", period: 14 },
                    comparator: "LESS_THAN",
                    value: 40,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "RSI", period: 14 },
                    comparator: "GREATER_THAN",
                    value: 70,
                },
            ],
        },
        stopLossPct: 3.0,
        takeProfitPct: 8.0,
        notes: "Avoids weak summer months (May-Aug).",
    },
    {
        id: "seasonal-pre-budget",
        name: "Pre-Budget Play",
        description: "Position before Union Budget (Feb 1)",
        category: "seasonal",
        strategy_type: "economic",
        historical_avg_return: 1.5,
        historical_win_rate: 58,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "UNION_BUDGET" },
                    comparator: "LESS_THAN",
                    value: 6,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "UNION_BUDGET" },
                    comparator: "GREATER_THAN",
                    value: 0,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "DAYS_FROM_EVENT", event: "UNION_BUDGET" },
                    comparator: "GREATER_THAN",
                    value: 1,
                },
            ],
        },
        stopLossPct: 2.0,
        takeProfitPct: 3.0,
        notes: "Gold import duty changes often announced in budget.",
    },
    {
        id: "seasonal-christmas-rally",
        name: "Christmas Rally",
        description: "Year-end rally around Christmas",
        category: "seasonal",
        strategy_type: "festival",
        historical_avg_return: 1.4,
        historical_win_rate: 60,
        entry_logic: {
            id: "root-entry",
            type: "GROUP",
            operator: "AND",
            children: [
                {
                    id: "e1",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "CHRISTMAS" },
                    comparator: "LESS_THAN",
                    value: 8,
                },
                {
                    id: "e2",
                    type: "CONDITION",
                    left: { type: "DAYS_TO_EVENT", event: "CHRISTMAS" },
                    comparator: "GREATER_THAN",
                    value: 0,
                },
            ],
        },
        exit_logic: {
            id: "root-exit",
            type: "GROUP",
            operator: "OR",
            children: [
                {
                    id: "x1",
                    type: "CONDITION",
                    left: { type: "DAYS_FROM_EVENT", event: "NEW_YEAR" },
                    comparator: "GREATER_THAN",
                    value: 3,
                },
            ],
        },
        stopLossPct: 2.0,
        takeProfitPct: 3.5,
        notes: "Global jewelry demand and portfolio rebalancing.",
    },
]

const getStrategyIcon = (type: string) => {
    switch (type) {
        case "festival":
            return <Sparkles className="h-4 w-4" />
        case "monthly":
            return <Calendar className="h-4 w-4" />
        case "economic":
            return <Building2 className="h-4 w-4" />
        default:
            return <Sun className="h-4 w-4" />
    }
}

const getStrategyTypeLabel = (type: string) => {
    switch (type) {
        case "festival":
            return "Festival"
        case "monthly":
            return "Monthly"
        case "economic":
            return "Economic"
        default:
            return type
    }
}

const getStrategyTypeBadgeColor = (type: string) => {
    switch (type) {
        case "festival":
            return "bg-amber-100 text-amber-700 border-amber-200"
        case "monthly":
            return "bg-blue-100 text-blue-700 border-blue-200"
        case "economic":
            return "bg-purple-100 text-purple-700 border-purple-200"
        default:
            return "bg-slate-100 text-slate-700 border-slate-200"
    }
}

export function SeasonalStrategyPicker() {
    const t = useTranslations('seasonal')
    const router = useRouter()
    const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null)

    const handleBacktest = (strategy: SeasonalStrategy) => {
        // Store strategy in localStorage for the backtest page to pick up
        localStorage.setItem("seasonal_strategy_to_backtest", JSON.stringify({
            id: strategy.id,
            name: strategy.name,
            asset: "GOLD",
            entryLogic: strategy.entry_logic,
            exitLogic: strategy.exit_logic,
            stopLossPct: strategy.stopLossPct,
            takeProfitPct: strategy.takeProfitPct,
        }))

        // Navigate to backtest page
        router.push("/backtest?source=seasonal")
    }

    return (
        <StyledCard variant="indigo">
            <StyledCardHeader
                icon={Play}
                title={t('seasonalStrategyBacktester')}
                description={t('prebuiltStrategies')}
                variant="indigo"
                action={
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {t('learnHowItWorks')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-xl">
                                        <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                                            <Play className="h-5 w-5" />
                                        </div>
                                        {t('strategyBacktesterGuide')}
                                    </DialogTitle>
                                    <DialogDescription>{t('testStrategies')}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="p-4 rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                                        <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            {t('whatIsBacktesting')}
                                        </h4>
                                        <p className="text-sm text-indigo-700">
                                            {t('backtestingDesc')}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border">
                                        <h4 className="font-bold text-slate-800 mb-2">{t('prebuiltStrategiesTitle')}</h4>
                                        <ul className="text-sm text-slate-600 space-y-2">
                                            <li>• <strong>{t('festivalStrategies')}</strong>: {t('festivalStrategiesDesc')}</li>
                                            <li>• <strong>{t('monthlyStrategies')}</strong>: {t('monthlyStrategiesDesc')}</li>
                                            <li>• <strong>{t('economicStrategies')}</strong>: {t('economicStrategiesDesc')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/backtest")}
                            className="text-xs"
                        >
                            {t('openFullBacktester')}
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                }
            />
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SEASONAL_STRATEGIES.map((strategy) => (
                        <div
                            key={strategy.id}
                            className={`
                relative p-4 rounded-lg border transition-all cursor-pointer
                ${hoveredStrategy === strategy.id
                                    ? "border-indigo-300 bg-indigo-50/50 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }
              `}
                            onMouseEnter={() => setHoveredStrategy(strategy.id)}
                            onMouseLeave={() => setHoveredStrategy(null)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md ${getStrategyTypeBadgeColor(strategy.strategy_type)}`}>
                                        {getStrategyIcon(strategy.strategy_type)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-slate-800">{strategy.name}</h4>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] px-1.5 py-0 mt-0.5 ${getStrategyTypeBadgeColor(strategy.strategy_type)}`}
                                        >
                                            {getStrategyTypeLabel(strategy.strategy_type)}
                                        </Badge>
                                    </div>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="p-1 text-slate-400 hover:text-slate-600">
                                                <Info className="h-3.5 w-3.5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[200px]">
                                            <p className="text-xs">{strategy.notes}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                {strategy.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1">
                                    {strategy.historical_avg_return >= 0 ? (
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                    <span className={`text-xs font-semibold ${strategy.historical_avg_return >= 0 ? "text-emerald-600" : "text-red-600"
                                        }`}>
                                        {strategy.historical_avg_return >= 0 ? "+" : ""}
                                        {strategy.historical_avg_return}%
                                    </span>
                                    <span className="text-[10px] text-slate-400">avg</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold text-slate-700">
                                        {strategy.historical_win_rate}%
                                    </span>
                                    <span className="text-[10px] text-slate-400">win rate</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                size="sm"
                                className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleBacktest(strategy)
                                }}
                            >
                                <Play className="h-3 w-3 mr-1" fill="currentColor" />
                                {t('runBacktest')}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </StyledCard>
    )
}

export { SEASONAL_STRATEGIES }
