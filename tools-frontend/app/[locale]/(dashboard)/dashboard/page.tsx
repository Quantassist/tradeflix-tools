import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    DollarSign,
    Calendar,
    Network,
    BarChart3,
    Sparkles,
    Target,
    LineChart,
    Zap,
    Shield,
    Clock,
    ChevronRight,
    FlaskConical
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
    const t = useTranslations('dashboard')
    const tTools = useTranslations('tools')

    const tools = [
        {
            name: tTools('pivot.name'),
            shortDesc: tTools('pivot.shortDesc'),
            description: tTools('pivot.description'),
            features: [tTools('pivot.features.cpr'), tTools('pivot.features.fibonacci'), tTools('pivot.features.floor'), tTools('pivot.features.multiTimeframe')],
            icon: TrendingUp,
            href: "/pivot",
            gradient: "from-blue-500 to-indigo-600",
            lightGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
            iconBg: "bg-blue-100 dark:bg-blue-900/50",
            iconColor: "text-blue-600 dark:text-blue-400",
            badge: tTools('pivot.badge'),
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        },
        {
            name: tTools('arbitrage.name'),
            shortDesc: tTools('arbitrage.shortDesc'),
            description: tTools('arbitrage.description'),
            features: [tTools('arbitrage.features.fairValue'), tTools('arbitrage.features.alerts'), tTools('arbitrage.features.historical'), tTools('arbitrage.features.multiCommodity')],
            icon: DollarSign,
            href: "/arbitrage",
            gradient: "from-emerald-500 to-teal-600",
            lightGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            badge: tTools('arbitrage.badge'),
            badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        },
        {
            name: tTools('seasonal.name'),
            shortDesc: tTools('seasonal.shortDesc'),
            description: tTools('seasonal.description'),
            features: [tTools('seasonal.features.festival'), tTools('seasonal.features.economic'), tTools('seasonal.features.monthly'), tTools('seasonal.features.winRate')],
            icon: Calendar,
            href: "/seasonal",
            gradient: "from-violet-500 to-purple-600",
            lightGradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
            iconBg: "bg-violet-100 dark:bg-violet-900/50",
            iconColor: "text-violet-600 dark:text-violet-400",
            badge: null,
            badgeColor: "",
        },
        {
            name: tTools('correlation.name'),
            shortDesc: tTools('correlation.shortDesc'),
            description: tTools('correlation.description'),
            features: [tTools('correlation.features.realtime'), tTools('correlation.features.beta'), tTools('correlation.features.divergence'), tTools('correlation.features.hedging')],
            icon: Network,
            href: "/correlation",
            gradient: "from-orange-500 to-amber-600",
            lightGradient: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
            iconBg: "bg-orange-100 dark:bg-orange-900/50",
            iconColor: "text-orange-600 dark:text-orange-400",
            badge: null,
            badgeColor: "",
        },
        {
            name: tTools('cot.name'),
            shortDesc: tTools('cot.shortDesc'),
            description: tTools('cot.description'),
            features: [tTools('cot.features.position'), tTools('cot.features.percentile'), tTools('cot.features.sentiment'), tTools('cot.features.contrarian')],
            icon: BarChart3,
            href: "/cot",
            gradient: "from-rose-500 to-pink-600",
            lightGradient: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
            iconBg: "bg-rose-100 dark:bg-rose-900/50",
            iconColor: "text-rose-600 dark:text-rose-400",
            badge: tTools('cot.badge'),
            badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
        },
        {
            name: tTools('backtest.name'),
            shortDesc: tTools('backtest.shortDesc'),
            description: tTools('backtest.description'),
            features: [tTools('backtest.features.simulation'), tTools('backtest.features.metrics'), tTools('backtest.features.drawdown'), tTools('backtest.features.riskAdjusted')],
            icon: FlaskConical,
            href: "/backtest",
            gradient: "from-cyan-500 to-blue-600",
            lightGradient: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30",
            iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
            iconColor: "text-cyan-600 dark:text-cyan-400",
            badge: tTools('backtest.badge'),
            badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
        },
    ]

    const stats = [
        { label: t('stats.analyticsTools'), value: "6", icon: Zap },
        { label: t('stats.yearsOfData'), value: "10+", icon: Clock },
        { label: t('stats.analysisTypes'), value: "15+", icon: LineChart },
    ]

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-10">
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
                            {t('platformBadge')}
                        </Badge>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                        {t('welcome')} <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{t('brandName')}</span>
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-2xl mb-6">
                        {t('subtitle')}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/10">
                                    <stat.icon className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-white font-semibold text-base">{stat.value}</div>
                                    <div className="text-slate-400 text-xs">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tools Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('analyticsSuite')}</h2>
                        <p className="text-sm text-muted-foreground">{t('analyticsSuiteDescription')}</p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                        <Link
                            key={tool.name}
                            href={tool.href}
                            className="group"
                        >
                            <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br ${tool.lightGradient} overflow-hidden`}>
                                {/* Colored top bar */}
                                <div className={`h-1 bg-gradient-to-r ${tool.gradient}`} />

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-xl ${tool.iconBg} transition-transform group-hover:scale-110`}>
                                            <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
                                        </div>
                                        {tool.badge && (
                                            <Badge className={`${tool.badgeColor} border-0 text-xs`}>
                                                {tool.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="pt-3">
                                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                                            {tool.name}
                                            <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </CardTitle>
                                        <p className="text-xs font-medium text-muted-foreground">{tool.shortDesc}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                                        {tool.description}
                                    </p>

                                    {/* Feature Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {tool.features.slice(0, 3).map((feature) => (
                                            <span
                                                key={feature}
                                                className="text-xs px-2 py-1 rounded-md bg-white/60 dark:bg-black/20 text-muted-foreground"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                        {tool.features.length > 3 && (
                                            <span className="text-xs px-2 py-1 rounded-md bg-white/60 dark:bg-black/20 text-muted-foreground">
                                                +{tool.features.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Why Use Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                    <CardContent className="pt-6">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 w-fit mb-4">
                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold mb-2">{t('whyUse.dataDecisions.title')}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {t('whyUse.dataDecisions.description')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                    <CardContent className="pt-6">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 w-fit mb-4">
                            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-semibold mb-2">{t('whyUse.riskManagement.title')}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {t('whyUse.riskManagement.description')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                    <CardContent className="pt-6">
                        <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/50 w-fit mb-4">
                            <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h3 className="text-sm font-semibold mb-2">{t('whyUse.saveTime.title')}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {t('whyUse.saveTime.description')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Start Tip */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{t('quickStartTip.title')}</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        {t('quickStartTip.description')}
                    </p>
                </div>
            </div>
        </div>
    )
}
