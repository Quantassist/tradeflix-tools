"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Search, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EventItem {
    name: string
    value: number
    type: string
}

interface AdvancedEventDropdownProps {
    events: EventItem[]
    selectedEvents: string[]
    onSelectionChange: (events: string[]) => void
    placeholder?: string
    className?: string
    singleSelect?: boolean  // For single-select mode (like Year-wise and Event-Relative sections)
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    festival_india: "Indian Festivals",
    holiday_trading_india: "Indian Holidays",
    holiday_trading_global: "Global Holidays",
    fomc_meeting: "FOMC Meetings",
    budget_india: "Budget Events",
    policy_event: "Policy Events",
    macro_release: "Macro Releases",
    recession_crisis: "Recession & Crisis",
    custom: "Custom Events",
}

const EVENT_TYPE_ICONS: Record<string, string> = {
    festival_india: "🪔",
    holiday_trading_india: "🇮🇳",
    holiday_trading_global: "🌍",
    fomc_meeting: "🏛️",
    budget_india: "📊",
    policy_event: "📜",
    macro_release: "📈",
    recession_crisis: "📉",
    custom: "⭐",
}

export function AdvancedEventDropdown({
    events,
    selectedEvents,
    onSelectionChange,
    placeholder = "Add event...",
    className,
    singleSelect = false,
}: AdvancedEventDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Group events by type
    const groupedEvents = useMemo(() => {
        const groups: Record<string, EventItem[]> = {}
        events.forEach(event => {
            const type = event.type || "custom"
            if (!groups[type]) groups[type] = []
            groups[type].push(event)
        })
        // Sort events within each group by value (descending)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => b.value - a.value)
        })
        return groups
    }, [events])

    // Filter events based on search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groupedEvents

        const query = searchQuery.toLowerCase()
        const filtered: Record<string, EventItem[]> = {}

        Object.entries(groupedEvents).forEach(([type, typeEvents]) => {
            const matchingEvents = typeEvents.filter(e =>
                e.name.toLowerCase().includes(query)
            )
            if (matchingEvents.length > 0) {
                filtered[type] = matchingEvents
            }
        })

        return filtered
    }, [groupedEvents, searchQuery])

    const toggleGroup = (type: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(type)) {
                next.delete(type)
            } else {
                next.add(type)
            }
            return next
        })
    }

    const toggleEvent = (eventName: string) => {
        if (singleSelect) {
            // In single-select mode, just select the new event and close dropdown
            onSelectionChange([eventName])
            setIsOpen(false)
        } else {
            if (selectedEvents.includes(eventName)) {
                onSelectionChange(selectedEvents.filter(e => e !== eventName))
            } else {
                onSelectionChange([...selectedEvents, eventName])
            }
        }
    }

    const addAllInGroup = (type: string) => {
        const groupEvents = filteredGroups[type] || []
        const newEvents = groupEvents.map(e => e.name).filter(name => !selectedEvents.includes(name))
        onSelectionChange([...selectedEvents, ...newEvents])
    }

    const clearAll = () => {
        onSelectionChange([])
    }

    const collapseAll = () => {
        setCollapsedGroups(new Set(Object.keys(filteredGroups)))
    }

    const expandAll = () => {
        setCollapsedGroups(new Set())
    }

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 px-3 justify-between min-w-[140px] max-w-[250px]"
            >
                <span className="text-sm truncate">
                    {selectedEvents.length === 0
                        ? placeholder
                        : singleSelect
                            ? selectedEvents[0]
                            : `${selectedEvents.length} selected`}
                </span>
                <ChevronDown className={cn("h-4 w-4 ml-2 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-80 bg-white border rounded-lg shadow-lg overflow-hidden">
                    {/* Search and controls */}
                    <div className="p-2 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                ref={inputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events..."
                                className="pl-8 h-8 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                            <div className="flex gap-2">
                                <button onClick={expandAll} className="text-blue-600 hover:underline">Expand all</button>
                                <button onClick={collapseAll} className="text-blue-600 hover:underline">Collapse all</button>
                            </div>
                            <button onClick={clearAll} className="text-red-600 hover:underline">Clear all</button>
                        </div>
                    </div>

                    {/* Events list */}
                    <div className="max-h-72 overflow-y-auto">
                        {Object.entries(filteredGroups).length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No events found
                            </div>
                        ) : (
                            Object.entries(filteredGroups).map(([type, typeEvents]) => {
                                const isCollapsed = collapsedGroups.has(type)
                                const selectedInGroup = typeEvents.filter(e => selectedEvents.includes(e.name)).length

                                return (
                                    <div key={type} className="border-b last:border-b-0">
                                        {/* Group header */}
                                        <div
                                            className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleGroup(type)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCollapsed ? (
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                )}
                                                <span className="text-sm">{EVENT_TYPE_ICONS[type] || "📌"}</span>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {EVENT_TYPE_LABELS[type] || type}
                                                </span>
                                                {selectedInGroup > 0 && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                        {selectedInGroup}
                                                    </Badge>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    addAllInGroup(type)
                                                }}
                                                className="text-xs text-purple-600 hover:underline"
                                            >
                                                Add all
                                            </button>
                                        </div>

                                        {/* Group events */}
                                        {!isCollapsed && (
                                            <div className="py-1">
                                                {typeEvents.map(event => {
                                                    const isSelected = selectedEvents.includes(event.name)
                                                    return (
                                                        <div
                                                            key={event.name}
                                                            onClick={() => toggleEvent(event.name)}
                                                            className={cn(
                                                                "flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-gray-50",
                                                                isSelected && "bg-purple-50"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded border flex items-center justify-center",
                                                                    isSelected ? "bg-purple-600 border-purple-600" : "border-gray-300"
                                                                )}>
                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <span className="text-sm text-gray-700 truncate max-w-[180px]" title={event.name}>
                                                                    {event.name}
                                                                </span>
                                                            </div>
                                                            <span className={cn(
                                                                "text-xs font-medium",
                                                                event.value >= 0 ? "text-emerald-600" : "text-red-600"
                                                            )}>
                                                                {event.value >= 0 ? "+" : ""}{event.value.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
