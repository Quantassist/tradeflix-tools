"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

/**
 * StyledCard - A reusable card component with consistent styling
 * Features:
 * - Top gradient bar
 * - Icon in header with gradient background
 * - Title and description
 * - Optional action button
 * - Consistent border and shadow styling
 */

type GradientVariant =
    | "purple"
    | "blue"
    | "green"
    | "orange"
    | "teal"
    | "pink"
    | "amber"
    | "indigo"
    | "slate"

const gradientConfig: Record<GradientVariant, { bar: string; icon: string; iconBg: string }> = {
    purple: {
        bar: "from-purple-500 via-pink-500 to-orange-500",
        icon: "from-purple-500 to-pink-600",
        iconBg: "bg-gradient-to-br",
    },
    blue: {
        bar: "from-blue-500 via-cyan-500 to-teal-500",
        icon: "from-blue-500 to-cyan-600",
        iconBg: "bg-gradient-to-br",
    },
    green: {
        bar: "from-teal-500 via-emerald-500 to-green-500",
        icon: "from-teal-500 to-emerald-600",
        iconBg: "bg-gradient-to-br",
    },
    orange: {
        bar: "from-orange-500 via-amber-500 to-yellow-500",
        icon: "from-orange-500 to-amber-600",
        iconBg: "bg-gradient-to-br",
    },
    teal: {
        bar: "from-teal-500 via-cyan-500 to-blue-500",
        icon: "from-teal-500 to-cyan-600",
        iconBg: "bg-gradient-to-br",
    },
    pink: {
        bar: "from-pink-500 via-rose-500 to-red-500",
        icon: "from-pink-500 to-rose-600",
        iconBg: "bg-gradient-to-br",
    },
    amber: {
        bar: "from-amber-500 via-orange-500 to-red-500",
        icon: "from-amber-500 to-orange-600",
        iconBg: "bg-gradient-to-br",
    },
    indigo: {
        bar: "from-indigo-500 via-purple-500 to-pink-500",
        icon: "from-indigo-500 to-purple-600",
        iconBg: "bg-gradient-to-br",
    },
    slate: {
        bar: "from-slate-500 via-gray-500 to-zinc-500",
        icon: "from-slate-500 to-gray-600",
        iconBg: "bg-gradient-to-br",
    },
}

interface StyledCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: GradientVariant
    showGradientBar?: boolean
}

function StyledCard({
    className,
    variant = "purple",
    showGradientBar = true,
    children,
    ...props
}: StyledCardProps) {
    const config = gradientConfig[variant]

    return (
        <div
            className={cn(
                "rounded-2xl border bg-white shadow-sm overflow-hidden",
                className
            )}
            {...props}
        >
            {showGradientBar && (
                <div className={cn("h-1.5 bg-gradient-to-r", config.bar)} />
            )}
            {children}
        </div>
    )
}

interface StyledCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon
    title: string
    description?: string
    variant?: GradientVariant
    action?: React.ReactNode
}

function StyledCardHeader({
    className,
    icon: Icon,
    title,
    description,
    variant = "purple",
    action,
    ...props
}: StyledCardHeaderProps) {
    const config = gradientConfig[variant]

    return (
        <div
            className={cn("p-6", className)}
            {...props}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn("p-3 rounded-xl text-white shadow-lg", config.iconBg, config.icon)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        {description && (
                            <p className="text-slate-500 text-sm">{description}</p>
                        )}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
    )
}

interface StyledCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean
    withBorder?: boolean
}

function StyledCardContent({
    className,
    noPadding = false,
    withBorder = true,
    children,
    ...props
}: StyledCardContentProps) {
    return (
        <div
            className={cn(
                withBorder && "border-t",
                !noPadding && "p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

type StyledCardFooterProps = React.HTMLAttributes<HTMLDivElement>

function StyledCardFooter({ className, ...props }: StyledCardFooterProps) {
    return (
        <div
            className={cn("p-6 pt-0", className)}
            {...props}
        />
    )
}

export {
    StyledCard,
    StyledCardHeader,
    StyledCardContent,
    StyledCardFooter,
    type GradientVariant,
}
