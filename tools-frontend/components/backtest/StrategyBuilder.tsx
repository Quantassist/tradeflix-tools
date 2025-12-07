"use client"

import React from "react"
import { Trash2, Plus, FolderTree } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type {
    VisualStrategy,
    StrategyCondition,
    LogicGroup,
    StrategyNode,
    IndicatorConfig,
} from "@/types"
import { StrategyIndicatorType, StrategyComparator } from "@/types"

interface StrategyBuilderProps {
    strategy: VisualStrategy
    setStrategy: React.Dispatch<React.SetStateAction<VisualStrategy>>
}

// Helper to deep update the tree
const updateNode = (
    root: LogicGroup,
    targetId: string,
    transform: (node: StrategyNode) => StrategyNode | null
): LogicGroup => {
    if (root.id === targetId) {
        const res = transform(root)
        return res as LogicGroup
    }

    const newChildren = root.children
        .map((child) => {
            if (child.id === targetId) {
                return transform(child)
            }
            if (child.type === "GROUP") {
                return updateNode(child as LogicGroup, targetId, transform)
            }
            return child
        })
        .filter(Boolean) as StrategyNode[]

    return { ...root, children: newChildren }
}

type UpdateTreeFn = (
    root: "ENTRY" | "EXIT",
    targetId: string,
    transform: (n: StrategyNode) => StrategyNode | null
) => void
type AddFn = (root: "ENTRY" | "EXIT", groupId: string) => void

interface LogicNodeProps {
    node: StrategyNode
    rootType: "ENTRY" | "EXIT"
    depth: number
    updateTree: UpdateTreeFn
    addCondition: AddFn
    addGroup: AddFn
}

// Indicator categories for organized dropdown
const INDICATOR_CATEGORIES = {
    "Moving Averages": [
        StrategyIndicatorType.SMA,
        StrategyIndicatorType.EMA,
    ],
    "Momentum": [
        StrategyIndicatorType.RSI,
        StrategyIndicatorType.MACD,
        StrategyIndicatorType.MACD_SIGNAL,
        StrategyIndicatorType.MACD_HIST,
        StrategyIndicatorType.STOCH_K,
        StrategyIndicatorType.STOCH_D,
    ],
    "Volatility": [
        StrategyIndicatorType.ATR,
        StrategyIndicatorType.BB_UPPER,
        StrategyIndicatorType.BB_MIDDLE,
        StrategyIndicatorType.BB_LOWER,
    ],
    "Price": [
        StrategyIndicatorType.PRICE,
        StrategyIndicatorType.OPEN,
        StrategyIndicatorType.HIGH,
        StrategyIndicatorType.LOW,
        StrategyIndicatorType.VOLUME,
        StrategyIndicatorType.PREV_HIGH,
        StrategyIndicatorType.PREV_LOW,
    ],
    "Pivot Points": [
        StrategyIndicatorType.CPR_PIVOT,
        StrategyIndicatorType.CPR_TC,
        StrategyIndicatorType.CPR_BC,
    ],
    "External": [
        StrategyIndicatorType.USDINR,
    ],
}

// Check if indicator type requires a period parameter
const hasPeriod = (type: StrategyIndicatorType): boolean => {
    const STATIC_TYPES = [
        // Price data - no period needed
        StrategyIndicatorType.PRICE,
        StrategyIndicatorType.OPEN,
        StrategyIndicatorType.HIGH,
        StrategyIndicatorType.LOW,
        StrategyIndicatorType.VOLUME,
        StrategyIndicatorType.PREV_HIGH,
        StrategyIndicatorType.PREV_LOW,
        // External data
        StrategyIndicatorType.USDINR,
        // Pivot points - calculated from weekly data
        StrategyIndicatorType.CPR_PIVOT,
        StrategyIndicatorType.CPR_TC,
        StrategyIndicatorType.CPR_BC,
    ]
    return !STATIC_TYPES.includes(type)
}

// Get default period for indicator type
const getDefaultPeriod = (type: StrategyIndicatorType): number => {
    switch (type) {
        case StrategyIndicatorType.RSI:
            return 14
        case StrategyIndicatorType.SMA:
        case StrategyIndicatorType.EMA:
            return 20
        case StrategyIndicatorType.MACD:
        case StrategyIndicatorType.MACD_SIGNAL:
        case StrategyIndicatorType.MACD_HIST:
            return 12  // Fast period
        case StrategyIndicatorType.STOCH_K:
        case StrategyIndicatorType.STOCH_D:
            return 14
        case StrategyIndicatorType.ATR:
            return 14
        case StrategyIndicatorType.BB_UPPER:
        case StrategyIndicatorType.BB_MIDDLE:
        case StrategyIndicatorType.BB_LOWER:
            return 20
        default:
            return 14
    }
}

// Get indicator display name
const getIndicatorLabel = (type: StrategyIndicatorType): string => {
    const labels: Record<string, string> = {
        SMA: "SMA",
        EMA: "EMA",
        RSI: "RSI",
        MACD: "MACD",
        MACD_SIGNAL: "MACD Signal",
        MACD_HIST: "MACD Hist",
        STOCH_K: "Stoch %K",
        STOCH_D: "Stoch %D",
        ATR: "ATR",
        BB_UPPER: "BB Upper",
        BB_MIDDLE: "BB Middle",
        BB_LOWER: "BB Lower",
        PRICE: "Close",
        OPEN: "Open",
        HIGH: "High",
        LOW: "Low",
        VOLUME: "Volume",
        PREV_HIGH: "Prev High",
        PREV_LOW: "Prev Low",
        USDINR: "USD/INR",
        CPR_PIVOT: "CPR Pivot",
        CPR_TC: "CPR TC",
        CPR_BC: "CPR BC",
    }
    return labels[type] || type
}

const LogicNodeBuilder: React.FC<LogicNodeProps> = ({
    node,
    rootType,
    depth,
    updateTree,
    addCondition,
    addGroup,
}) => {
    // --- Render Condition ---
    if (node.type === "CONDITION") {
        const condition = node as StrategyCondition
        const isStaticValue = condition.value !== undefined

        const updateCond = (
            field: keyof StrategyCondition | "left" | "right",
            value: Partial<IndicatorConfig> | StrategyComparator | number
        ) => {
            updateTree(rootType, condition.id, (n) => {
                const c = n as StrategyCondition
                if (field === "left" || field === "right") {
                    return { ...c, [field]: { ...c[field], ...(value as Partial<IndicatorConfig>) } }
                }
                return { ...c, [field]: value }
            })
        }

        // Handler for Right Side Logic Source Switch (Static vs Indicator)
        const handleRightSourceChange = (newVal: string) => {
            if (newVal === "STATIC_VALUE") {
                updateTree(rootType, condition.id, (n) => {
                    const c = n as StrategyCondition
                    return { ...c, value: 0 }
                })
            } else {
                updateTree(rootType, condition.id, (n) => {
                    const c = n as StrategyCondition
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { value, ...rest } = c
                    return {
                        ...rest,
                        right: { type: newVal as StrategyIndicatorType, period: 14 },
                    }
                })
            }
        }

        return (
            <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-200 group hover:bg-indigo-50/50 hover:border-indigo-200 transition-all">
                {/* Left Indicator */}
                <div className="flex items-center gap-2">
                    <Select
                        value={condition.left.type}
                        onValueChange={(val) => updateCond("left", {
                            type: val as StrategyIndicatorType,
                            period: getDefaultPeriod(val as StrategyIndicatorType)
                        })}
                    >
                        <SelectTrigger className="h-8 text-xs font-medium bg-white border-slate-300 w-28 focus:ring-indigo-500">
                            <SelectValue>{getIndicatorLabel(condition.left.type)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            {Object.entries(INDICATOR_CATEGORIES).map(([category, indicators]) => (
                                <div key={category}>
                                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        {category}
                                    </div>
                                    {indicators.map((t) => (
                                        <SelectItem key={t} value={t} className="text-xs pl-4">
                                            {getIndicatorLabel(t)}
                                        </SelectItem>
                                    ))}
                                </div>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasPeriod(condition.left.type) && (
                        <Input
                            type="number"
                            value={condition.left.period ?? 14}
                            onChange={(e) => updateCond("left", { period: parseInt(e.target.value) || 14 })}
                            className="h-8 w-14 text-xs text-center bg-white border-slate-300 focus:ring-indigo-500"
                        />
                    )}
                </div>

                {/* Comparator */}
                <Select
                    value={condition.comparator}
                    onValueChange={(val) => updateCond("comparator", val as StrategyComparator)}
                >
                    <SelectTrigger className="h-8 w-16 text-xs font-medium bg-white border-slate-300 focus:ring-indigo-500">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(StrategyComparator).map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    <Select
                        value={isStaticValue ? "STATIC_VALUE" : condition.right.type}
                        onValueChange={handleRightSourceChange}
                    >
                        <SelectTrigger className="h-8 text-xs font-medium bg-white border-slate-300 w-28 focus:ring-indigo-500">
                            <SelectValue>
                                {isStaticValue ? "Value" : getIndicatorLabel(condition.right.type)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            <SelectItem value="STATIC_VALUE" className="text-xs font-medium text-indigo-600">
                                📊 Static Value
                            </SelectItem>
                            <div className="h-px bg-slate-200 my-1" />
                            {Object.entries(INDICATOR_CATEGORIES).map(([category, indicators]) => (
                                <div key={category}>
                                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        {category}
                                    </div>
                                    {indicators.map((t) => (
                                        <SelectItem key={t} value={t} className="text-xs pl-4">
                                            {getIndicatorLabel(t)}
                                        </SelectItem>
                                    ))}
                                </div>
                            ))}
                        </SelectContent>
                    </Select>

                    {isStaticValue ? (
                        <Input
                            type="number"
                            value={condition.value ?? 0}
                            onChange={(e) => updateCond("value", parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 text-xs bg-white border-slate-300 font-mono text-indigo-700 focus:ring-indigo-500"
                            placeholder="0"
                        />
                    ) : (
                        hasPeriod(condition.right.type) && (
                            <Input
                                type="number"
                                value={condition.right.period ?? 14}
                                onChange={(e) =>
                                    updateCond("right", { period: parseInt(e.target.value) || 14 })
                                }
                                className="h-8 w-14 text-xs text-center bg-white border-slate-300 focus:ring-indigo-500"
                            />
                        )
                    )}
                </div>

                <button
                    onClick={() => updateTree(rootType, condition.id, () => null)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )
    }

    // --- Render Group ---
    const group = node as LogicGroup
    const isRoot = depth === 0

    return (
        <div className={`rounded-xl border-2 ${isRoot
            ? "border-slate-200 bg-white shadow-sm"
            : "border-dashed border-slate-300 bg-slate-50/50 ml-4"}`}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${isRoot ? "border-b border-slate-100" : "border-b border-dashed border-slate-300"}`}>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${rootType === "ENTRY"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                        }`}>
                        {isRoot ? rootType : "GROUP"}
                    </span>

                    {/* Operator Toggle */}
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                        <button
                            onClick={() =>
                                updateTree(rootType, group.id, (n) => ({
                                    ...(n as LogicGroup),
                                    operator: "AND",
                                }))
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${group.operator === "AND"
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            AND
                        </button>
                        <button
                            onClick={() =>
                                updateTree(rootType, group.id, (n) => ({
                                    ...(n as LogicGroup),
                                    operator: "OR",
                                }))
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${group.operator === "OR"
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            OR
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addCondition(rootType, group.id)}
                        className="h-7 px-2.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                        <Plus size={12} className="mr-1" /> Condition
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addGroup(rootType, group.id)}
                        className="h-7 px-2.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                        <FolderTree size={12} className="mr-1" /> Group
                    </Button>
                    {!isRoot && (
                        <button
                            onClick={() => updateTree(rootType, group.id, () => null)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-3 space-y-2">
                {group.children.length === 0 && (
                    <div className={`text-center py-6 text-gray-400 text-xs ${!isRoot ? "border border-dashed border-slate-200 rounded-lg bg-white/50" : ""}`}>
                        No conditions in this group
                    </div>
                )}
                {group.children.map((child) => (
                    <LogicNodeBuilder
                        key={child.id}
                        node={child}
                        rootType={rootType}
                        depth={depth + 1}
                        updateTree={updateTree}
                        addCondition={addCondition}
                        addGroup={addGroup}
                    />
                ))}
            </div>
        </div>
    )
}

export function StrategyBuilder({ strategy, setStrategy }: StrategyBuilderProps) {
    const updateTree = (
        root: "ENTRY" | "EXIT",
        targetId: string,
        transform: (n: StrategyNode) => StrategyNode | null
    ) => {
        setStrategy((prev) => ({
            ...prev,
            [root === "ENTRY" ? "entryLogic" : "exitLogic"]: updateNode(
                prev[root === "ENTRY" ? "entryLogic" : "exitLogic"],
                targetId,
                transform
            ),
        }))
    }

    const addCondition = (root: "ENTRY" | "EXIT", groupId: string) => {
        const newCondition: StrategyCondition = {
            id: Math.random().toString(36).substr(2, 9),
            type: "CONDITION",
            left: { type: StrategyIndicatorType.RSI, period: 14 },
            comparator: StrategyComparator.LESS_THAN,
            right: { type: StrategyIndicatorType.PRICE, period: 0 },
            value: 30,
        }

        updateTree(root, groupId, (node) => {
            const group = node as LogicGroup
            return { ...group, children: [...group.children, newCondition] }
        })
    }

    const addGroup = (root: "ENTRY" | "EXIT", groupId: string) => {
        // Create a default condition to add to the new group
        const defaultCondition: StrategyCondition = {
            id: Math.random().toString(36).substr(2, 9),
            type: "CONDITION",
            left: { type: StrategyIndicatorType.RSI, period: 14 },
            comparator: StrategyComparator.LESS_THAN,
            right: { type: StrategyIndicatorType.PRICE, period: 0 },
            value: 30,
        }

        const newGroup: LogicGroup = {
            id: Math.random().toString(36).substr(2, 9),
            type: "GROUP",
            operator: "AND",
            children: [defaultCondition], // Add default condition instead of empty
        }

        updateTree(root, groupId, (node) => {
            const group = node as LogicGroup
            return { ...group, children: [...group.children, newGroup] }
        })
    }

    return (
        <div className="space-y-4">
            <LogicNodeBuilder
                node={strategy.entryLogic}
                rootType="ENTRY"
                depth={0}
                updateTree={updateTree}
                addCondition={addCondition}
                addGroup={addGroup}
            />
            <LogicNodeBuilder
                node={strategy.exitLogic}
                rootType="EXIT"
                depth={0}
                updateTree={updateTree}
                addCondition={addCondition}
                addGroup={addGroup}
            />

            {/* Risk Management */}
            <div className="grid grid-cols-2 gap-4 pt-3 mt-2 border-t border-slate-100">
                <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1.5">
                        Stop Loss
                    </label>
                    <div className="relative">
                        <Input
                            type="number"
                            value={strategy.stopLossPct}
                            onChange={(e) =>
                                setStrategy((s) => ({ ...s, stopLossPct: parseFloat(e.target.value) || 0 }))
                            }
                            className="h-9 pr-8 bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 text-xs font-medium">
                            %
                        </span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1.5">
                        Take Profit
                    </label>
                    <div className="relative">
                        <Input
                            type="number"
                            value={strategy.takeProfitPct}
                            onChange={(e) =>
                                setStrategy((s) => ({ ...s, takeProfitPct: parseFloat(e.target.value) || 0 }))
                            }
                            className="h-9 pr-8 bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-medium">
                            %
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StrategyBuilder
