import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Calendar, Network, BarChart3, Activity } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Active Calculators",
      value: "5",
      description: "All systems operational",
      icon: Activity,
      trend: "+100%",
    },
    {
      title: "API Endpoints",
      value: "28",
      description: "Available endpoints",
      icon: Network,
      trend: "+28",
    },
    {
      title: "Database Status",
      value: "Connected",
      description: "TimescaleDB Cloud",
      icon: BarChart3,
      trend: "Healthy",
    },
  ]

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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs font-medium text-green-600 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calculators Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Calculators</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calc) => (
            <a
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
            </a>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Backend API and database status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">API Base URL</span>
            <span className="text-sm font-mono">http://localhost:8000/api/v1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Database</span>
            <span className="text-sm font-mono">TimescaleDB Cloud</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Framework</span>
            <span className="text-sm font-mono">Next.js 16 + FastAPI</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
