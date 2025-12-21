"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Loader2, Save } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { seasonalEventsApi, EventType, RecurrenceType, SeasonalEvent, SeasonalEventUpdate } from "@/lib/api/seasonal-events"

interface EditEventDialogProps {
    event: SeasonalEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEventUpdated?: () => void
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

const EVENT_TYPE_OPTIONS = [
    { value: "festival_india", label: "Indian Festival" },
    { value: "holiday_trading_india", label: "Indian Trading Holiday" },
    { value: "holiday_trading_us", label: "US Trading Holiday" },
    { value: "holiday_trading_global", label: "Global Trading Holiday" },
    { value: "election_india", label: "Indian Election" },
    { value: "election_global", label: "Global Election" },
    { value: "budget_india", label: "Indian Budget" },
    { value: "policy_event", label: "Policy Event" },
    { value: "fomc_meeting", label: "FOMC Meeting" },
    { value: "macro_release", label: "Macro Release" },
    { value: "custom", label: "Custom Event" },
]

export function EditEventDialog({ event, open, onOpenChange, onEventUpdated }: EditEventDialogProps) {
    const t = useTranslations('seasonal')
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("basic")

    // Form state
    const [formData, setFormData] = useState<SeasonalEventUpdate>({})
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()

    // Initialize form when event changes
    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name,
                event_type: event.event_type,
                description: event.description || "",
                country: event.country,
                region: event.region || "",
                recurrence: event.recurrence,
                is_lunar_based: event.is_lunar_based,
                event_time: event.event_time || "",
                timezone: event.timezone,
                duration_days: event.duration_days,
                affects_gold: event.affects_gold,
                affects_silver: event.affects_silver,
                analysis_window_before: event.analysis_window_before,
                analysis_window_after: event.analysis_window_after,
                data_source: event.data_source || "",
                source_url: event.source_url || "",
                is_active: event.is_active,
            })
            setStartDate(event.start_date ? parseISO(event.start_date) : undefined)
            setEndDate(event.end_date ? parseISO(event.end_date) : undefined)
            setActiveTab("basic")
        }
    }, [event])

    const handleSubmit = async () => {
        if (!event) return
        if (!formData.name?.trim()) {
            toast.error("Event name is required")
            return
        }

        setLoading(true)
        try {
            const payload: SeasonalEventUpdate = {
                ...formData,
                start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            }

            await seasonalEventsApi.updateEvent(event.id, payload)
            toast.success(`Event "${formData.name}" updated successfully!`)
            onOpenChange(false)
            onEventUpdated?.()
        } catch (error: unknown) {
            console.error("Failed to update event:", error)
            let errorMessage = "Failed to update event"
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { detail?: string | Array<{ msg: string; loc: string[] }> } } }
                const detail = axiosError.response?.data?.detail
                if (typeof detail === 'string') {
                    errorMessage = detail
                } else if (Array.isArray(detail) && detail.length > 0) {
                    // Pydantic validation error - extract first error message
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

    if (!event) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span className="text-2xl">{EVENT_TYPE_ICONS[formData.event_type as EventType] || "📅"}</span>
                        Edit Event
                    </DialogTitle>
                    <DialogDescription>
                        Update the seasonal event details
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
                                                <span>{EVENT_TYPE_ICONS[formData.event_type as EventType]}</span>
                                                <span>{EVENT_TYPE_OPTIONS.find(t => t.value === formData.event_type)?.label}</span>
                                            </span>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPE_OPTIONS.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{EVENT_TYPE_ICONS[type.value as EventType]}</span>
                                                <span>{type.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the event and its market impact"
                                value={formData.description || ""}
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
                                    value={formData.region || ""}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active" className="text-sm">
                                Event is Active
                            </Label>
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
                                    value={formData.duration_days || 1}
                                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event_time">Event Time (HH:MM)</Label>
                                <Input
                                    id="event_time"
                                    type="time"
                                    value={formData.event_time || ""}
                                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recurrence">Recurrence</Label>
                            <Select
                                value={formData.recurrence}
                                onValueChange={(value: RecurrenceType) => setFormData({ ...formData, recurrence: value })}
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
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_lunar"
                                checked={formData.is_lunar_based}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_lunar_based: checked })}
                            />
                            <Label htmlFor="is_lunar" className="text-sm">
                                Based on Lunar Calendar (date varies each year)
                            </Label>
                        </div>
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
                                    value={formData.analysis_window_before || 7}
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
                                    value={formData.analysis_window_after || 7}
                                    onChange={(e) => setFormData({ ...formData, analysis_window_after: parseInt(e.target.value) || 7 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="data_source">Data Source</Label>
                            <Input
                                id="data_source"
                                placeholder="e.g., NSE Calendar, FOMC Schedule"
                                value={formData.data_source || ""}
                                onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source_url">Source URL</Label>
                            <Input
                                id="source_url"
                                type="url"
                                placeholder="https://..."
                                value={formData.source_url || ""}
                                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name?.trim()}
                        className="bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
