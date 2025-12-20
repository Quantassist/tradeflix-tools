"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from 'next-intl'
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, AlertCircle, Pencil, Trash2, ChevronDown, RefreshCw, Zap, BookOpen, TrendingUp, CalendarDays, BarChart3, Activity, Settings2 } from "lucide-react"
import { seasonalEventsApi, SeasonalEvent } from "@/lib/api/seasonal-events"
import { formatPercent } from "@/lib/utils"
import { toast } from "sonner"
import { SeasonalAnalysisCharts } from "@/components/charts/seasonal-analysis-charts"
import { SeasonalAdvancedCharts } from "@/components/charts/seasonal-advanced-charts"
import { CalendarHeatmap } from "@/components/charts/calendar-heatmap"
import { RecessionIndicators } from "@/components/charts/recession-indicators"
import { EconomicEventsAnalysis } from "@/components/charts/economic-events-analysis"
import { SeasonalStrategyPicker } from "@/components/seasonal/SeasonalStrategyPicker"
import { AddEventDialog } from "@/components/seasonal/add-event-dialog"
import { EditEventDialog } from "@/components/seasonal/edit-event-dialog"
import { DeleteEventDialog } from "@/components/seasonal/delete-event-dialog"
import { MetalType, CurrencyType } from "@/lib/api/metals-prices"

// Animation variants
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
}

const cardVariants = {
  hidden: { opacity: 1, scale: 1 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
    transition: { duration: 0.2 }
  }
}

// Event type icons for display
const EVENT_TYPE_ICONS: Record<string, string> = {
  festival_india: "🪔",
  holiday_trading_india: "🇮🇳",
  holiday_trading_us: "🇺🇸",
  holiday_trading_global: "🌍",
  election_india: "🗳️",
  election_global: "🌐",
  budget_india: "💰",
  policy_event: "📋",
  fomc_meeting: "🏦",
  macro_release: "📊",
  custom: "✨",
}


// Events Management Section Component
interface EventsManagementSectionProps {
  events: SeasonalEvent[]
  filteredEvents: SeasonalEvent[]
  loading: boolean
  selectedCommodity: string
  setSelectedCommodity: (value: string) => void
  selectedYear: string
  setSelectedYear: (value: string) => void
  availableYears: number[]
  loadEvents: () => void
  handleEditClick: (event: SeasonalEvent) => void
  handleDeleteClick: (event: SeasonalEvent) => void
}

function EventsManagementSection({
  events,
  filteredEvents,
  loading,
  selectedCommodity,
  setSelectedCommodity,
  selectedYear,
  setSelectedYear,
  availableYears,
  loadEvents,
  handleEditClick,
  handleDeleteClick,
}: EventsManagementSectionProps) {
  return (
    <Card className="border-2 border-emerald-200/60 shadow-lg overflow-hidden">
      <CardHeader className="bg-linear-to-r from-emerald-50 via-green-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Manage Seasonal Events</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">{events.length} events</Badge>
              </CardDescription>
            </div>
          </div>
          <AddEventDialog onEventCreated={loadEvents} />
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap p-4 bg-gray-50/50 rounded-xl border border-gray-100">
          <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-emerald-300 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              <SelectItem value="GOLD">Gold</SelectItem>
              <SelectItem value="SILVER">Silver</SelectItem>
              <SelectItem value="CRUDE">Crude Oil</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px] bg-white border-gray-200 hover:border-emerald-300 transition-colors">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={loadEvents}
            disabled={loading}
            variant="outline"
            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </span>
            )}
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const avgImpact = event.avg_price_change_percent || 0
              const eventIcon = EVENT_TYPE_ICONS[event.event_type] || "📅"
              return (
                <motion.div
                  key={event.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="h-full border border-gray-200 hover:border-emerald-300 transition-colors duration-300 overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-gray-50 via-emerald-50/50 to-green-50/50 border-b py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xl">{eventIcon}</span>
                        <span className="font-semibold">{event.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                        <span>•</span>
                        <span>{event.start_date}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">Country</span>
                        <span className="font-medium text-sm">{event.country}</span>
                      </div>
                      {avgImpact !== 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs">Avg Impact</span>
                          <span className={`font-bold ${avgImpact > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {avgImpact > 0 ? '+' : ''}{formatPercent(avgImpact)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">Affects</span>
                        <span className="flex gap-1">
                          {event.affects_gold && <span title="Gold" className="text-lg">🥇</span>}
                          {event.affects_silver && <span title="Silver" className="text-lg">🥈</span>}
                        </span>
                      </div>
                      {event.description && (
                        <div className="p-2.5 rounded-lg bg-gray-50 text-xs text-gray-600 leading-relaxed">
                          {event.description}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={event.is_active ? "default" : "secondary"}
                            className={`text-[10px] ${event.is_active ? 'bg-emerald-500' : ''}`}
                          >
                            {event.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {event.is_verified && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => handleEditClick(event)}
                            title="Edit event"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteClick(event)}
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              className="col-span-full flex flex-col items-center justify-center py-16 space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 font-medium">
                  {loading ? "Loading events..." : selectedYear !== "all" ? `No events found for ${selectedYear}` : "No seasonal events found"}
                </p>
                {!loading && selectedYear === "all" && (
                  <p className="text-sm text-gray-400 mt-1">
                    Click &quot;Add Event&quot; to create your first seasonal event
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SeasonalTrendsPage() {
  const t = useTranslations('seasonal')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<SeasonalEvent[]>([])
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [guideOpen, setGuideOpen] = useState(false)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["overview"]))

  // Shared settings state for analysis components
  const [analysisSettings, setAnalysisSettings] = useState({
    metal: "GOLD" as MetalType,
    currency: "INR" as CurrencyType,
    yearsBack: 10,
    daysWindow: 7
  })

  // Handler for settings changes from SeasonalAnalysisCharts
  const handleSettingsChange = useCallback((settings: { metal: MetalType; currency: CurrencyType; yearsBack: number; daysWindow: number }) => {
    setAnalysisSettings(settings)
  }, [])

  // Edit/Delete dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SeasonalEvent | null>(null)

  const handleEditClick = (event: SeasonalEvent) => {
    setSelectedEvent(event)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (event: SeasonalEvent) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const loadEvents = async () => {
    setLoading(true)
    try {
      const response = await seasonalEventsApi.listEvents({ page_size: 50 })
      const eventsList = response.events || []
      setEvents(eventsList)
      if (eventsList.length > 0) {
        toast.success(`Loaded ${eventsList.length} seasonal events`)
      }
    } catch (error) {
      console.error("Error loading events:", error)
      toast.error("Failed to load seasonal events. Please try again.")
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedCommodity])

  // Extract unique years from events for the filter dropdown
  const availableYears = Array.from(
    new Set(
      events
        .map(e => e.start_date ? new Date(e.start_date).getFullYear() : null)
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a) // Sort descending (newest first)

  // Filter events based on selected year
  const filteredEvents = selectedYear === "all"
    ? events
    : events.filter(e => {
      if (!e.start_date) return false
      const eventYear = new Date(e.start_date).getFullYear()
      return eventYear === parseInt(selectedYear)
    })

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header with Gradient */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-green-500 to-teal-500 p-8 md:p-10 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Calendar className="h-10 w-10" />
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white/90">{t('pageSubtitle')}</span>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
            Analyze seasonal patterns and event-based trading opportunities throughout the year
          </p>
        </motion.div>
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute right-10 top-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Understanding Seasonal Trading - Progressive Disclosure */}
      <motion.div variants={itemVariants}>
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full group">
              <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border border-emerald-200/50 dark:border-emerald-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        Understanding Seasonal Trading
                        <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                          Guide
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Learn how seasonal patterns and events affect commodity prices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {guideOpen ? "Hide Guide" : "Show Guide"}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2">
            <div className="mt-4 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                      <span className="text-xl">🪔</span>
                      Festival Demand
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                      Diwali and Dhanteras typically increase gold demand in India
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border border-pink-200/50 dark:border-pink-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-pink-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-pink-800 dark:text-pink-300 flex items-center gap-2 mb-2">
                      <span className="text-xl">💒</span>
                      Wedding Season
                    </div>
                    <p className="text-sm text-pink-700 dark:text-pink-400 leading-relaxed">
                      Wedding season affects gold and silver prices significantly
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 mb-2">
                      <span className="text-xl">🌾</span>
                      Harvest Cycles
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                      Harvest cycles impact agricultural commodity prices
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-3 -mt-3" />
                  <div className="relative">
                    <div className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                      <span className="text-xl">📊</span>
                      Tax Planning
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                      Year-end tax planning affects precious metals demand
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Global Analysis Controls - Sticky Header */}
      <motion.div variants={itemVariants} className="sticky -top-6 z-50 -mx-6 px-6 pt-6 pb-2 bg-background">
        <Card className="border-2 border-emerald-300 bg-white shadow-lg backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">Metal:</span>
                  <Select
                    value={analysisSettings.metal}
                    onValueChange={(v) => setAnalysisSettings(prev => ({ ...prev, metal: v as MetalType }))}
                  >
                    <SelectTrigger className="w-[120px] bg-white border-emerald-200 hover:border-emerald-400 transition-colors font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOLD">🥇 Gold</SelectItem>
                      <SelectItem value="SILVER">🥈 Silver</SelectItem>
                      <SelectItem value="PLATINUM">💎 Platinum</SelectItem>
                      <SelectItem value="PALLADIUM">⚪ Palladium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">Currency:</span>
                  <Select
                    value={analysisSettings.currency}
                    onValueChange={(v) => setAnalysisSettings(prev => ({ ...prev, currency: v as CurrencyType }))}
                  >
                    <SelectTrigger className="w-[90px] bg-white border-emerald-200 hover:border-emerald-400 transition-colors font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">🇮🇳 INR</SelectItem>
                      <SelectItem value="USD">🇺🇸 USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">Period:</span>
                  <Select
                    value={analysisSettings.yearsBack.toString()}
                    onValueChange={(v) => setAnalysisSettings(prev => ({ ...prev, yearsBack: parseFloat(v) }))}
                  >
                    <SelectTrigger className="w-[110px] bg-white border-emerald-200 hover:border-emerald-400 transition-colors font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.083">1 Month</SelectItem>
                      <SelectItem value="0.25">3 Months</SelectItem>
                      <SelectItem value="0.5">6 Months</SelectItem>
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="15">15 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">Window:</span>
                  <Select
                    value={analysisSettings.daysWindow.toString()}
                    onValueChange={(v) => setAnalysisSettings(prev => ({ ...prev, daysWindow: parseInt(v) }))}
                  >
                    <SelectTrigger className="w-[110px] bg-white border-emerald-200 hover:border-emerald-400 transition-colors font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">±3 Days</SelectItem>
                      <SelectItem value="5">±5 Days</SelectItem>
                      <SelectItem value="7">±7 Days</SelectItem>
                      <SelectItem value="10">±10 Days</SelectItem>
                      <SelectItem value="14">±14 Days</SelectItem>
                      <SelectItem value="30">±30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 font-medium">
                📊 Global Analysis Settings
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab-based Content - Only loads data for active tab */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => {
          setVisitedTabs(prev => new Set([...prev, value]))
        }}>
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-gray-100 border border-gray-200 rounded-xl">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Event Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview & Seasonality */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <SeasonalStrategyPicker />
            <SeasonalAnalysisCharts
              metal={analysisSettings.metal}
              currency={analysisSettings.currency}
              yearsBack={analysisSettings.yearsBack}
              daysWindow={analysisSettings.daysWindow}
              onSettingsChange={handleSettingsChange}
            />
          </TabsContent>

          {/* Tab 2: Calendar Analysis */}
          <TabsContent value="calendar" className="mt-6">
            {visitedTabs.has("calendar") && (
              <CalendarHeatmap
                metal={analysisSettings.metal}
                currency={analysisSettings.currency}
                yearsBack={analysisSettings.yearsBack}
              />
            )}
          </TabsContent>

          {/* Tab 3: Event Deep Dive */}
          <TabsContent value="events" className="mt-6 space-y-6">
            {visitedTabs.has("events") && (
              <>
                <SeasonalAdvancedCharts
                  metal={analysisSettings.metal}
                  currency={analysisSettings.currency}
                  yearsBack={analysisSettings.yearsBack}
                  daysWindow={analysisSettings.daysWindow}
                />
                <EconomicEventsAnalysis
                  metal={analysisSettings.metal}
                  currency={analysisSettings.currency}
                  yearsBack={analysisSettings.yearsBack}
                />
              </>
            )}
          </TabsContent>

          {/* Tab 4: Market Conditions */}
          <TabsContent value="market" className="mt-6">
            {visitedTabs.has("market") && (
              <RecessionIndicators
                metal={analysisSettings.metal}
                currency={analysisSettings.currency}
              />
            )}
          </TabsContent>

          {/* Tab 5: Event Management */}
          <TabsContent value="manage" className="mt-6">
            {visitedTabs.has("manage") && (
              <EventsManagementSection
                events={events}
                filteredEvents={filteredEvents}
                loading={loading}
                selectedCommodity={selectedCommodity}
                setSelectedCommodity={setSelectedCommodity}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                availableYears={availableYears}
                loadEvents={loadEvents}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Event Dialog */}
      <EditEventDialog
        event={selectedEvent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEventUpdated={loadEvents}
      />

      {/* Delete Event Dialog */}
      <DeleteEventDialog
        event={selectedEvent}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onEventDeleted={loadEvents}
      />
    </motion.div>
  )
}
