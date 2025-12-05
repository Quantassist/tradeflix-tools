"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CalendarIcon, Loader2, Info, RefreshCw, AlertCircle } from "lucide-react"
import { format, addYears, addMonths, addWeeks } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { seasonalEventsApi, EventType, RecurrenceType, EventTypeInfo, SeasonalEventCreate } from "@/lib/api/seasonal-events"

interface AddEventDialogProps {
    onEventCreated?: () => void
}

const EVENT_TYPE_ICONS: Record<EventType, string> = {
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

// Fallback event types in case API fails
const DEFAULT_EVENT_TYPES: EventTypeInfo[] = [
    { value: "festival_india", label: "Indian Festival", description: "Diwali, Dhanteras, Akshaya Tritiya, etc.", examples: ["Diwali", "Dhanteras"] },
    { value: "holiday_trading_india", label: "Indian Trading Holiday", description: "MCX/NSE/BSE trading holidays", examples: ["Republic Day"] },
    { value: "holiday_trading_us", label: "US Trading Holiday", description: "COMEX/NYSE trading holidays", examples: ["Thanksgiving"] },
    { value: "holiday_trading_global", label: "Global Trading Holiday", description: "Major global market holidays", examples: ["Christmas"] },
    { value: "election_india", label: "Indian Election", description: "Lok Sabha, state elections", examples: ["Lok Sabha Election"] },
    { value: "election_global", label: "Global Election", description: "Major global elections", examples: ["US Presidential Election"] },
    { value: "budget_india", label: "Indian Budget", description: "Union Budget, interim budget", examples: ["Union Budget"] },
    { value: "policy_event", label: "Policy Event", description: "Import duty changes, RBI policy", examples: ["Import Duty Change"] },
    { value: "fomc_meeting", label: "FOMC Meeting", description: "Federal Reserve meetings", examples: ["FOMC Rate Decision"] },
    { value: "macro_release", label: "Macro Release", description: "Economic data releases (CPI, NFP, GDP)", examples: ["US CPI", "Non-Farm Payrolls"] },
    { value: "custom", label: "Custom Event", description: "User-defined custom events", examples: [] },
]

export function AddEventDialog({ onEventCreated }: AddEventDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingTypes, setLoadingTypes] = useState(false)
    const [eventTypes, setEventTypes] = useState<EventTypeInfo[]>(DEFAULT_EVENT_TYPES)
    const [activeTab, setActiveTab] = useState("basic")

    // Form state
    const [formData, setFormData] = useState<SeasonalEventCreate>({
        name: "",
        event_type: "festival_india",
        description: "",
        country: "India",
        region: "",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: undefined,
        recurrence: "none",
        recurrence_month: undefined,
        recurrence_day: undefined,
        is_lunar_based: false,
        event_time: "",
        timezone: "Asia/Kolkata",
        duration_days: 1,
        affects_gold: true,
        affects_silver: true,
        analysis_window_before: 7,
        analysis_window_after: 7,
        data_source: "",
        source_url: "",
    })

    const [startDate, setStartDate] = useState<Date | undefined>(new Date())
    const [endDate, setEndDate] = useState<Date | undefined>()

    // Future events generation state
    const [generateFutureEvents, setGenerateFutureEvents] = useState(false)
    const [futureYearsCount, setFutureYearsCount] = useState(3)
    const [futureEventsPreview, setFutureEventsPreview] = useState<Date[]>([])
    const [selectedFutureEvents, setSelectedFutureEvents] = useState<Set<string>>(new Set())

    // Generate future events preview based on recurrence type
    useEffect(() => {
        if (!startDate || formData.recurrence === "none" || !generateFutureEvents) {
            setFutureEventsPreview([])
            setSelectedFutureEvents(new Set())
            return
        }

        const dates: Date[] = []
        const baseDate = startDate
        const now = new Date()

        switch (formData.recurrence) {
            case "annual":
            case "lunar":
                // Same date every year (lunar dates are approximate)
                for (let i = 1; i <= futureYearsCount; i++) {
                    const futureDate = addYears(baseDate, i)
                    if (futureDate > now) {
                        dates.push(futureDate)
                    }
                }
                break
            case "quarterly":
                // Every 3 months for the specified years
                const totalQuarters = futureYearsCount * 4
                for (let q = 1; q <= totalQuarters; q++) {
                    const quarterDate = addMonths(baseDate, q * 3)
                    if (quarterDate > now) {
                        dates.push(quarterDate)
                    }
                }
                break
            case "monthly":
                // Same day every month for the specified years
                const totalMonths = futureYearsCount * 12
                for (let m = 1; m <= totalMonths; m++) {
                    const monthDate = addMonths(baseDate, m)
                    if (monthDate > now) {
                        dates.push(monthDate)
                    }
                }
                break
            case "weekly":
                // Same day every week for the specified years
                const totalWeeks = futureYearsCount * 52
                for (let w = 1; w <= totalWeeks; w++) {
                    const weekDate = addWeeks(baseDate, w)
                    if (weekDate > now) {
                        dates.push(weekDate)
                    }
                }
                break
        }

        // Limit to reasonable number and deduplicate by date string
        const uniqueDates = Array.from(
            new Map(dates.map(d => [format(d, "yyyy-MM-dd"), d])).values()
        ).slice(0, 50)

        setFutureEventsPreview(uniqueDates)
        // Select all by default
        setSelectedFutureEvents(new Set(uniqueDates.map(d => format(d, "yyyy-MM-dd"))))
    }, [startDate, formData.recurrence, generateFutureEvents, futureYearsCount])

    // Load event types when dialog opens
    useEffect(() => {
        if (!open) return

        const loadEventTypes = async () => {
            setLoadingTypes(true)
            try {
                const types = await seasonalEventsApi.getEventTypes()
                if (types && Array.isArray(types) && types.length > 0) {
                    setEventTypes(types)
                } else {
                    // Use fallback if API returns empty
                    setEventTypes(DEFAULT_EVENT_TYPES)
                }
            } catch (error) {
                console.error("Failed to load event types:", error)
                // Use fallback on error
                setEventTypes(DEFAULT_EVENT_TYPES)
            } finally {
                setLoadingTypes(false)
            }
        }
        loadEventTypes()
    }, [open])

    const buildPayload = (eventDate: Date, yearSuffix?: number): SeasonalEventCreate => {
        const eventName = yearSuffix
            ? `${formData.name} ${eventDate.getFullYear()}`
            : formData.name

        return {
            ...formData,
            name: eventName,
            start_date: format(eventDate, "yyyy-MM-dd"),
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            event_time: formData.event_time && formData.event_time.match(/^\d{2}:\d{2}$/) ? formData.event_time : undefined,
            description: formData.description?.trim() || undefined,
            region: formData.region?.trim() || undefined,
            data_source: formData.data_source?.trim() || undefined,
            source_url: formData.source_url?.trim() || undefined,
        }
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Event name is required")
            return
        }

        setLoading(true)
        try {
            // Create the main event
            const mainPayload = buildPayload(startDate || new Date())
            await seasonalEventsApi.createEvent(mainPayload)

            // Create future events if enabled and selected
            let futureEventsCreated = 0
            if (generateFutureEvents && selectedFutureEvents.size > 0) {
                const futurePromises = futureEventsPreview
                    .filter(date => selectedFutureEvents.has(format(date, "yyyy-MM-dd")))
                    .map(date => {
                        const payload = buildPayload(date, date.getFullYear())
                        return seasonalEventsApi.createEvent(payload)
                    })

                const results = await Promise.allSettled(futurePromises)
                futureEventsCreated = results.filter(r => r.status === "fulfilled").length
                const failedCount = results.filter(r => r.status === "rejected").length

                if (failedCount > 0) {
                    toast.warning(`${failedCount} future event(s) failed to create`)
                }
            }

            const totalCreated = 1 + futureEventsCreated
            toast.success(`${totalCreated} event(s) created successfully!`)
            setOpen(false)
            resetForm()
            onEventCreated?.()
        } catch (error: unknown) {
            console.error("Failed to create event:", error)
            let errorMessage = "Failed to create event"
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { detail?: string | Array<{ msg: string; loc: string[] }> } } }
                const detail = axiosError.response?.data?.detail
                if (typeof detail === 'string') {
                    errorMessage = detail
                } else if (Array.isArray(detail) && detail.length > 0) {
                    errorMessage = detail.map(e => `${e.loc?.slice(-1)?.[0] || 'field'}: ${e.msg}`).join(', ')
                }
            } else if (error instanceof Error) {
                errorMessage = error.message
            }
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            event_type: "festival_india",
            description: "",
            country: "India",
            region: "",
            start_date: format(new Date(), "yyyy-MM-dd"),
            end_date: undefined,
            recurrence: "none",
            recurrence_month: undefined,
            recurrence_day: undefined,
            is_lunar_based: false,
            event_time: "",
            timezone: "Asia/Kolkata",
            duration_days: 1,
            affects_gold: true,
            affects_silver: true,
            analysis_window_before: 7,
            analysis_window_after: 7,
            data_source: "",
            source_url: "",
        })
        setStartDate(new Date())
        setEndDate(undefined)
        setActiveTab("basic")
        setGenerateFutureEvents(false)
        setFutureYearsCount(3)
        setFutureEventsPreview([])
        setSelectedFutureEvents(new Set())
    }

    const toggleFutureEvent = (dateStr: string) => {
        const newSet = new Set(selectedFutureEvents)
        if (newSet.has(dateStr)) {
            newSet.delete(dateStr)
        } else {
            newSet.add(dateStr)
        }
        setSelectedFutureEvents(newSet)
    }

    const selectAllFutureEvents = () => {
        setSelectedFutureEvents(new Set(futureEventsPreview.map(d => format(d, "yyyy-MM-dd"))))
    }

    const deselectAllFutureEvents = () => {
        setSelectedFutureEvents(new Set())
    }

    const selectedTypeInfo = eventTypes.find(t => t.value === formData.event_type)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span className="text-2xl">{EVENT_TYPE_ICONS[formData.event_type]}</span>
                        Add Seasonal Event
                    </DialogTitle>
                    <DialogDescription>
                        Create a new seasonal event for tracking market patterns
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="timing">Timing</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="event_type">Event Type *</Label>
                            <Select
                                value={formData.event_type}
                                onValueChange={(value: EventType) => setFormData({ ...formData, event_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event type">
                                        {formData.event_type && (
                                            <span className="flex items-center gap-2">
                                                <span>{EVENT_TYPE_ICONS[formData.event_type]}</span>
                                                <span>{eventTypes.find(t => t.value === formData.event_type)?.label || formData.event_type}</span>
                                            </span>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingTypes ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Loading...
                                        </div>
                                    ) : eventTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{EVENT_TYPE_ICONS[type.value]}</span>
                                                <span>{type.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedTypeInfo && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {selectedTypeInfo.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name *</Label>
                            <Input
                                id="name"
                                placeholder={selectedTypeInfo?.examples[0] || "Enter event name"}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the event and its market impact"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="India">🇮🇳 India</SelectItem>
                                        <SelectItem value="USA">🇺🇸 USA</SelectItem>
                                        <SelectItem value="Global">🌍 Global</SelectItem>
                                        <SelectItem value="China">🇨🇳 China</SelectItem>
                                        <SelectItem value="UK">🇬🇧 UK</SelectItem>
                                        <SelectItem value="EU">🇪🇺 EU</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="region">Region (Optional)</Label>
                                <Input
                                    id="region"
                                    placeholder="e.g., Maharashtra, Gujarat"
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Timing Tab */}
                    <TabsContent value="timing" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={1}
                                    value={formData.duration_days}
                                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event_time">Event Time (HH:MM)</Label>
                                <Input
                                    id="event_time"
                                    type="time"
                                    value={formData.event_time}
                                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recurrence">Recurrence</Label>
                            <Select
                                value={formData.recurrence}
                                onValueChange={(value: RecurrenceType) => setFormData({
                                    ...formData,
                                    recurrence: value,
                                    is_lunar_based: value === "lunar"
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">One-time Event</SelectItem>
                                    <SelectItem value="annual">Annual (Same date every year)</SelectItem>
                                    <SelectItem value="lunar">Lunar Calendar (Needs yearly update)</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Future Events Generation */}
                        {formData.recurrence !== "none" && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4" />
                                            Generate Future Events
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically create events for future occurrences
                                        </p>
                                    </div>
                                    <Switch
                                        checked={generateFutureEvents}
                                        onCheckedChange={setGenerateFutureEvents}
                                    />
                                </div>

                                {generateFutureEvents && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="futureYears">
                                                {formData.recurrence === "annual" || formData.recurrence === "lunar"
                                                    ? "Number of Years"
                                                    : "Time Period (Years)"}
                                            </Label>
                                            <Select
                                                value={futureYearsCount.toString()}
                                                onValueChange={(v) => setFutureYearsCount(parseInt(v))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 Year</SelectItem>
                                                    <SelectItem value="2">2 Years</SelectItem>
                                                    <SelectItem value="3">3 Years</SelectItem>
                                                    <SelectItem value="5">5 Years</SelectItem>
                                                    <SelectItem value="10">10 Years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {futureEventsPreview.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm">
                                                        Future Events Preview ({selectedFutureEvents.size}/{futureEventsPreview.length} selected)
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={selectAllFutureEvents}
                                                            className="text-xs h-7"
                                                        >
                                                            Select All
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={deselectAllFutureEvents}
                                                            className="text-xs h-7"
                                                        >
                                                            Deselect All
                                                        </Button>
                                                    </div>
                                                </div>
                                                <ScrollArea className="h-[150px] rounded-md border p-2">
                                                    <div className="space-y-1">
                                                        {futureEventsPreview.map((date, index) => {
                                                            const dateStr = format(date, "yyyy-MM-dd")
                                                            const isSelected = selectedFutureEvents.has(dateStr)
                                                            return (
                                                                <div
                                                                    key={`${index}-${dateStr}`}
                                                                    className={cn(
                                                                        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                                                                        isSelected && "bg-muted"
                                                                    )}
                                                                    onClick={() => toggleFutureEvent(dateStr)}
                                                                >
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onCheckedChange={() => toggleFutureEvent(dateStr)}
                                                                    />
                                                                    <span className="text-sm">
                                                                        {formData.name || "Event"} {format(date, "MMM yyyy")}
                                                                    </span>
                                                                    <Badge variant="outline" className="ml-auto text-xs">
                                                                        {format(date, "PPP")}
                                                                    </Badge>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                                {formData.recurrence === "lunar" && (
                                                    <Alert>
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription className="text-xs">
                                                            Lunar calendar dates are approximate. You may need to adjust individual event dates after creation.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Advanced Tab */}
                    <TabsContent value="advanced" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Commodities Affected</h4>
                            <div className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="affects_gold"
                                        checked={formData.affects_gold}
                                        onCheckedChange={(checked) => setFormData({ ...formData, affects_gold: checked })}
                                    />
                                    <Label htmlFor="affects_gold">Gold 🥇</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="affects_silver"
                                        checked={formData.affects_silver}
                                        onCheckedChange={(checked) => setFormData({ ...formData, affects_silver: checked })}
                                    />
                                    <Label htmlFor="affects_silver">Silver 🥈</Label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="window_before">Analysis Window Before (Days)</Label>
                                <Input
                                    id="window_before"
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={formData.analysis_window_before}
                                    onChange={(e) => setFormData({ ...formData, analysis_window_before: parseInt(e.target.value) || 7 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="window_after">Analysis Window After (Days)</Label>
                                <Input
                                    id="window_after"
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={formData.analysis_window_after}
                                    onChange={(e) => setFormData({ ...formData, analysis_window_after: parseInt(e.target.value) || 7 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="data_source">Data Source</Label>
                            <Input
                                id="data_source"
                                placeholder="e.g., NSE Calendar, FOMC Schedule"
                                value={formData.data_source}
                                onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source_url">Source URL</Label>
                            <Input
                                id="source_url"
                                type="url"
                                placeholder="https://..."
                                value={formData.source_url}
                                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name.trim()}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Event
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
