"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Calendar,
  Network,
  BarChart3,
  Activity,
  X,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const t = useTranslations('navigation')

  const navigation = [
    {
      name: t('dashboard'),
      href: "/dashboard",
      icon: LayoutDashboard,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: t('backtest'),
      href: "/backtest",
      icon: Activity,
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      name: t('pivot'),
      href: "/pivot",
      icon: TrendingUp,
      gradient: "from-cyan-500 to-teal-500",
    },
    {
      name: t('arbitrage'),
      href: "/arbitrage",
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-500",
    },
    {
      name: t('seasonal'),
      href: "/seasonal",
      icon: Calendar,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: t('correlation'),
      href: "/correlation",
      icon: Network,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      name: t('cot'),
      href: "/cot",
      icon: BarChart3,
      gradient: "from-violet-500 to-purple-500",
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-white dark:bg-linear-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
          {/* Header with Logo */}
          <div className="relative flex h-20 items-center justify-between px-6 border-b border-slate-200 dark:border-white/10">
            <Link href="/" className="flex items-center gap-3 group" onClick={close}>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-105">
                <TrendingUp className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-bold bg-linear-to-r from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-200 dark:via-yellow-200 dark:to-orange-200 bg-clip-text text-transparent">
                  Bullion Brain
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">Trading Tools</p>
              </div>
            </Link>

            {/* Close button - mobile only */}
            <button
              onClick={close}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 mb-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t('mainMenu')}
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-lg"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-linear-to-b from-amber-400 to-orange-500" />
                  )}

                  {/* Icon with gradient background */}
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? `bg-linear-to-br ${item.gradient} shadow-lg`
                        : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
                    )} />
                  </div>

                  <span className="flex-1">{item.name}</span>

                  {/* Hover arrow indicator */}
                  <div className={cn(
                    "opacity-0 transform translate-x-2 transition-all duration-200",
                    "group-hover:opacity-100 group-hover:translate-x-0",
                    isActive && "opacity-100 translate-x-0"
                  )}>
                    <div className="h-1.5 w-1.5 rounded-full bg-linear-to-r from-amber-400 to-orange-500" />
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tradeflix Tools</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
