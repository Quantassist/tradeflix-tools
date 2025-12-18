"use client"

import { useState, useRef } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, BellRing, Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Target, BookOpen, Zap, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { PivotResponse } from "@/types"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"

type AlertType = "proximity" | "breakout" | "rejection"
type AlertDirection = "above" | "below" | "both"

type PivotAlert = {
    id: string
    level: string
    levelValue: number
    type: AlertType
    direction: AlertDirection
    threshold: number
    enabled: boolean
    triggered: boolean
}

type PivotAlertsProps = {
    pivotData: PivotResponse | null
}

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    proximity: "Price Approaching",
    breakout: "Breakout",
    rejection: "Rejection",
}

export function PivotAlerts({ pivotData }: PivotAlertsProps) {
    const [alerts, setAlerts] = useState<PivotAlert[]>([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [newAlert, setNewAlert] = useState({
        level: "",
        type: "proximity" as AlertType,
        direction: "both" as AlertDirection,
        threshold: 0.5,
    })
    const idCounter = useRef(0)

    const generateId = () => {
        idCounter.current += 1
        return `alert-${idCounter.current}`
    }

    const availableLevels = pivotData ? [
        { name: "R3", value: pivotData.floor_pivots.r3 },
        { name: "R2", value: pivotData.floor_pivots.r2 },
        { name: "R1", value: pivotData.floor_pivots.r1 },
        { name: "TC", value: pivotData.cpr.tc },
        { name: "Pivot", value: pivotData.cpr.pivot },
        { name: "BC", value: pivotData.cpr.bc },
        { name: "S1", value: pivotData.floor_pivots.s1 },
        { name: "S2", value: pivotData.floor_pivots.s2 },
        { name: "S3", value: pivotData.floor_pivots.s3 },
        { name: "Fib 61.8%", value: pivotData.fibonacci.level_618 },
        { name: "Fib 50%", value: pivotData.fibonacci.level_500 },
    ] : []

    const handleAddAlert = () => {
        if (!newAlert.level) {
            toast.error("Please select a level")
            return
        }

        const levelData = availableLevels.find(l => l.name === newAlert.level)
        if (!levelData) return

        const alert: PivotAlert = {
            id: generateId(),
            level: newAlert.level,
            levelValue: levelData.value,
            type: newAlert.type,
            direction: newAlert.direction,
            threshold: newAlert.threshold,
            enabled: true,
            triggered: false,
        }

        setAlerts([...alerts, alert])
        setShowAddForm(false)
        setNewAlert({ level: "", type: "proximity", direction: "both", threshold: 0.5 })
        toast.success(`Alert created for ${newAlert.level}`)
    }

    const handleDeleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id))
        toast.success("Alert deleted")
    }

    const handleToggleAlert = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        ))
    }

    const getAlertIcon = (type: AlertType) => {
        switch (type) {
            case "proximity": return <Target className="h-4 w-4" />
            case "breakout": return <TrendingUp className="h-4 w-4" />
            case "rejection": return <TrendingDown className="h-4 w-4" />
        }
    }

    const getAlertColor = (type: AlertType, enabled: boolean) => {
        if (!enabled) return "bg-gray-50 border-gray-200 text-gray-500"
        switch (type) {
            case "proximity": return "bg-blue-50 border-blue-200 text-blue-700"
            case "breakout": return "bg-green-50 border-green-200 text-green-700"
            case "rejection": return "bg-red-50 border-red-200 text-red-700"
        }
    }

    return (
        <StyledCard variant="pink">
            <StyledCardHeader
                icon={BellRing}
                title="Pivot Alerts"
                description="Set alerts for price proximity, breakouts, and rejections"
                variant="pink"
                action={
                    <div className="flex items-center gap-2">
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                            {alerts.filter(a => a.enabled).length} Active
                        </Badge>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Alert Guide
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <div className="p-2 bg-linear-to-br from-rose-500 to-pink-600 rounded-lg text-white">
                                            <BellRing className="h-4 w-4" />
                                        </div>
                                        Pivot Alerts Guide
                                    </DialogTitle>
                                    <DialogDescription>How to set up and use pivot alerts effectively</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 mt-3 text-sm">
                                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                        <div className="flex items-center gap-2 font-semibold text-blue-700 mb-1">
                                            <Eye className="h-4 w-4" />
                                            Price Approaching
                                        </div>
                                        <p className="text-blue-600 text-xs">Get notified when price comes within a threshold of a pivot level. Great for preparing entries.</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                        <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                                            <Zap className="h-4 w-4" />
                                            Breakout Alert
                                        </div>
                                        <p className="text-green-600 text-xs">Triggered when price breaks through a level with momentum. Useful for trend-following trades.</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                        <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                                            <TrendingDown className="h-4 w-4" />
                                            Rejection Alert
                                        </div>
                                        <p className="text-red-600 text-xs">Triggered when price tests a level and reverses. Perfect for counter-trend or bounce trades.</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                                        <h4 className="font-semibold text-amber-700 mb-1">Pro Tips</h4>
                                        <ul className="text-amber-600 text-xs space-y-1">
                                            <li>• Set proximity alerts on R1/S1 for high-probability setups</li>
                                            <li>• Use breakout alerts on R2/S2 for extended moves</li>
                                            <li>• Rejection alerts work best at R3/S3 extremes</li>
                                        </ul>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />
            <StyledCardContent>
                <div className="space-y-4">
                    {!pivotData ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Calculate pivot levels first to set up alerts</p>
                        </div>
                    ) : (
                        <>
                            {/* Alert List */}
                            {alerts.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${getAlertColor(alert.type, alert.enabled)}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {getAlertIcon(alert.type)}
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {ALERT_TYPE_LABELS[alert.type]}: {alert.level}
                                                    </div>
                                                    <div className="text-xs opacity-75">
                                                        ₹{formatNumber(alert.levelValue)} ± {alert.threshold}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {alert.triggered && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Triggered
                                                    </Badge>
                                                )}
                                                <Switch
                                                    checked={alert.enabled}
                                                    onCheckedChange={() => handleToggleAlert(alert.id)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteAlert(alert.id)}
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !showAddForm && (
                                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No alerts configured</p>
                                </div>
                            )}

                            {/* Add Alert Form */}
                            {showAddForm ? (
                                <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Level</Label>
                                            <Select value={newAlert.level} onValueChange={(v) => setNewAlert({ ...newAlert, level: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableLevels.map((level) => (
                                                        <SelectItem key={level.name} value={level.name}>
                                                            {level.name} (₹{formatNumber(level.value)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Alert Type</Label>
                                            <Select value={newAlert.type} onValueChange={(v) => setNewAlert({ ...newAlert, type: v as AlertType })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="proximity">Price Approaching</SelectItem>
                                                    <SelectItem value="breakout">Breakout</SelectItem>
                                                    <SelectItem value="rejection">Rejection</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Direction</Label>
                                            <Select value={newAlert.direction} onValueChange={(v) => setNewAlert({ ...newAlert, direction: v as AlertDirection })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="both">Both</SelectItem>
                                                    <SelectItem value="above">From Above</SelectItem>
                                                    <SelectItem value="below">From Below</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Threshold (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={newAlert.threshold}
                                                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0.5 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleAddAlert} className="flex-1">
                                            Add Alert
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-2 border-dashed"
                                    onClick={() => setShowAddForm(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Alert
                                </Button>
                            )}

                            {/* Info Note */}
                            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                                <strong>Note:</strong> Alerts are stored locally in your browser. For real-time notifications,
                                connect to a WebSocket service or enable browser notifications.
                            </div>
                        </>
                    )}
                </div>
            </StyledCardContent>
        </StyledCard>
    )
}

export default PivotAlerts
