"use client"

import { useState } from "react"
import { StyledCard, StyledCardHeader, StyledCardContent } from "@/components/ui/styled-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Calculator, TrendingUp, TrendingDown, ArrowRight, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"
import { arbitrageApi } from "@/lib/api/arbitrage"
import { toast } from "sonner"

type SensitivityResult = {
    analysis: {
        current_usdinr: number
        new_usdinr: number
        usdinr_change: number
        current_fair_value: number
        new_fair_value: number
        fair_value_change: number
        fair_value_change_percent: number
    }
    interpretation: {
        impact_per_rupee: number
        direction: string
        magnitude: string
    }
}

type USDINRSensitivityProps = {
    initialComexPrice?: number
    initialUsdinr?: number
}

export function USDINRSensitivity({ initialComexPrice = 2650, initialUsdinr = 84.5 }: USDINRSensitivityProps) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SensitivityResult | null>(null)
    const [formData, setFormData] = useState({
        comex_price_usd: initialComexPrice.toString(),
        current_usdinr: initialUsdinr.toString(),
        usdinr_change: "0.50",
        contract_size: "10",
    })
    const [sliderValue, setSliderValue] = useState([0.5])

    const handleSliderChange = (value: number[]) => {
        setSliderValue(value)
        setFormData({ ...formData, usdinr_change: value[0].toFixed(2) })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await arbitrageApi.getSensitivity(
                "GOLD",
                parseFloat(formData.comex_price_usd),
                parseFloat(formData.current_usdinr),
                parseFloat(formData.usdinr_change)
            ) as SensitivityResult
            setResult(response)
            toast.success("Sensitivity analysis complete!")
        } catch {
            toast.error("Failed to calculate sensitivity. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const scenarios = [
        { label: "-₹1.00", value: -1.0, color: "text-green-600" },
        { label: "-₹0.50", value: -0.5, color: "text-green-500" },
        { label: "+₹0.50", value: 0.5, color: "text-red-500" },
        { label: "+₹1.00", value: 1.0, color: "text-red-600" },
    ]

    return (
        <StyledCard variant="teal">
            <StyledCardHeader
                icon={IndianRupee}
                title="USD/INR Sensitivity Analysis"
                description="Analyze how currency movements impact MCX fair value"
                variant="teal"
            />
            <StyledCardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="comex_price">COMEX Price ($/oz)</Label>
                            <Input
                                id="comex_price"
                                type="number"
                                step="0.01"
                                value={formData.comex_price_usd}
                                onChange={(e) => setFormData({ ...formData, comex_price_usd: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current_usdinr">Current USD/INR</Label>
                            <Input
                                id="current_usdinr"
                                type="number"
                                step="0.01"
                                value={formData.current_usdinr}
                                onChange={(e) => setFormData({ ...formData, current_usdinr: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* USDINR Change Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>USD/INR Change</Label>
                            <span className={cn(
                                "font-mono font-bold text-lg",
                                sliderValue[0] > 0 ? "text-red-600" : sliderValue[0] < 0 ? "text-green-600" : "text-gray-600"
                            )}>
                                {sliderValue[0] > 0 ? "+" : ""}₹{sliderValue[0].toFixed(2)}
                            </span>
                        </div>
                        <Slider
                            value={sliderValue}
                            onValueChange={handleSliderChange}
                            min={-2}
                            max={2}
                            step={0.1}
                            className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>-₹2.00 (INR strengthens)</span>
                            <span>+₹2.00 (INR weakens)</span>
                        </div>
                    </div>

                    {/* Quick Scenario Buttons */}
                    <div className="space-y-2">
                        <Label>Quick Scenarios</Label>
                        <div className="flex gap-2">
                            {scenarios.map((scenario) => (
                                <Button
                                    key={scenario.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn("flex-1", scenario.color)}
                                    onClick={() => {
                                        setSliderValue([scenario.value])
                                        setFormData({ ...formData, usdinr_change: scenario.value.toString() })
                                    }}
                                >
                                    {scenario.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Calculating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Calculate Impact
                            </span>
                        )}
                    </Button>
                </form>

                {/* Results */}
                {result && (
                    <div className="mt-6 space-y-4 animate-in slide-in-from-bottom duration-300">
                        {/* Main Impact Display */}
                        <div className={cn(
                            "rounded-xl p-6 border-2",
                            result.analysis.fair_value_change > 0
                                ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
                                : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {result.analysis.fair_value_change > 0 ? (
                                        <TrendingUp className="h-6 w-6 text-red-600" />
                                    ) : (
                                        <TrendingDown className="h-6 w-6 text-green-600" />
                                    )}
                                    <span className="font-medium">Fair Value Impact</span>
                                </div>
                                <span className={cn(
                                    "text-2xl font-bold font-mono",
                                    result.analysis.fair_value_change > 0 ? "text-red-600" : "text-green-600"
                                )}>
                                    {result.analysis.fair_value_change > 0 ? "+" : ""}
                                    ₹{result.analysis.fair_value_change.toFixed(2)}
                                </span>
                            </div>

                            {/* Before/After Comparison */}
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex-1 p-3 bg-white/60 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Current Fair Value</p>
                                    <p className="font-mono font-semibold">₹{result.analysis.current_fair_value.toFixed(2)}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 p-3 bg-white/60 rounded-lg">
                                    <p className="text-muted-foreground text-xs">New Fair Value</p>
                                    <p className="font-mono font-semibold">₹{result.analysis.new_fair_value.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-gray-50 border text-center">
                                <p className="text-xs text-muted-foreground">Change %</p>
                                <p className={cn(
                                    "font-mono font-semibold",
                                    result.analysis.fair_value_change_percent > 0 ? "text-red-600" : "text-green-600"
                                )}>
                                    {result.analysis.fair_value_change_percent > 0 ? "+" : ""}
                                    {result.analysis.fair_value_change_percent.toFixed(3)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50 border text-center">
                                <p className="text-xs text-muted-foreground">Impact per ₹1</p>
                                <p className="font-mono font-semibold">
                                    ₹{Math.abs(result.interpretation.impact_per_rupee).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50 border text-center">
                                <p className="text-xs text-muted-foreground">Magnitude</p>
                                <p className="font-semibold capitalize">{result.interpretation.magnitude}</p>
                            </div>
                        </div>

                        {/* Interpretation */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-sm">
                                <strong>Interpretation:</strong> If USD/INR {result.interpretation.direction} by ₹{Math.abs(result.analysis.usdinr_change).toFixed(2)},
                                MCX Gold fair value will {result.analysis.fair_value_change > 0 ? "increase" : "decrease"} by ₹{Math.abs(result.analysis.fair_value_change).toFixed(2)} per 10g.
                                This is a <strong>{result.interpretation.magnitude}</strong> impact.
                            </p>
                        </div>

                        {/* Break-even Analysis */}
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <h4 className="font-medium text-sm mb-2">Break-even Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                                Every ₹1 change in USD/INR moves MCX Gold fair value by approximately <strong>₹{Math.abs(result.interpretation.impact_per_rupee).toFixed(2)}</strong> per 10g.
                                For a 100g contract, this translates to <strong>₹{(Math.abs(result.interpretation.impact_per_rupee) * 10).toFixed(2)}</strong> per contract.
                            </p>
                        </div>
                    </div>
                )}
            </StyledCardContent>
        </StyledCard>
    )
}
