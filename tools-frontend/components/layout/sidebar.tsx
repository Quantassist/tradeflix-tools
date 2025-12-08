"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Calendar,
  Network,
  BarChart3,
  Activity,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Backtest Engine",
    href: "/backtest",
    icon: Activity,
  },
  {
    name: "Pivot Calculator",
    href: "/pivot",
    icon: TrendingUp,
  },
  {
    name: "Arbitrage Heatmap",
    href: "/arbitrage",
    icon: DollarSign,
  },
  {
    name: "Seasonal Trends",
    href: "/seasonal",
    icon: Calendar,
  },
  {
    name: "Correlation Matrix",
    href: "/correlation",
    icon: Network,
  },
  {
    name: "COT Report",
    href: "/cot",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Bullion Brain</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Tradeflix Tools</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
