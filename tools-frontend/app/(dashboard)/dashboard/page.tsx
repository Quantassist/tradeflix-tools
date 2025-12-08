import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Calendar, Network, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
    const calculators = [
        {
            name: "Pivot Calculator",
            description: "Calculate CPR, Floor, and Fibonacci pivot points",
            icon: TrendingUp,
            href: "/pivot",
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            name: "Arbitrage Heatmap",
            description: "Identify arbitrage opportunities across markets",
            icon: DollarSign,
            href: "/arbitrage",
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            name: "Seasonal Trends",
            description: "Analyze seasonal patterns and events",
            icon: Calendar,
            href: "/seasonal",
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            name: "Correlation Matrix",
            description: "Multi-asset correlation analysis",
            icon: Network,
            href: "/correlation",
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
        {
            name: "COT Report",
            description: "CFTC positioning and sentiment analysis",
            icon: BarChart3,
            href: "/cot",
            color: "text-red-600",
            bgColor: "bg-red-100",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Welcome to Bullion Brain</h1>
                <p className="text-muted-foreground">
                    Advanced analytics and calculators for commodities trading
                </p>
            </div>

            {/* Calculators Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Available Tools</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {calculators.map((calc) => (
                        <Link
                            key={calc.name}
                            href={calc.href}
                            className="group"
                        >
                            <Card className="transition-all hover:shadow-lg hover:border-primary">
                                <CardHeader>
                                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${calc.bgColor} mb-2`}>
                                        <calc.icon className={`h-6 w-6 ${calc.color}`} />
                                    </div>
                                    <CardTitle className="group-hover:text-primary transition-colors">
                                        {calc.name}
                                    </CardTitle>
                                    <CardDescription>{calc.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
