"use client"

import { useState, useEffect, useRef, ReactNode, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LazySectionProps {
    children: ReactNode
    /** Minimum height for the placeholder before content loads */
    minHeight?: string
    /** Root margin for IntersectionObserver (e.g., "100px" to load 100px before visible) */
    rootMargin?: string
    /** Threshold for IntersectionObserver (0-1) */
    threshold?: number
    /** Custom loading component */
    loadingComponent?: ReactNode
    /** Custom placeholder component shown before intersection */
    placeholder?: ReactNode
    /** Class name for the wrapper */
    className?: string
    /** Whether to show loading state after intersection */
    showLoadingState?: boolean
    /** Delay before showing content after intersection (ms) - helps stagger requests */
    loadDelay?: number
}

export function LazySection({
    children,
    minHeight = "200px",
    rootMargin = "100px",
    threshold = 0.1,
    loadingComponent,
    placeholder,
    className,
    showLoadingState = true,
    loadDelay = 0,
}: LazySectionProps) {
    const [shouldRender, setShouldRender] = useState(false)
    const [isIntersected, setIsIntersected] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const handleIntersection = useCallback(() => {
        setIsIntersected(true)
        if (loadDelay > 0) {
            setTimeout(() => {
                setShouldRender(true)
            }, loadDelay)
        } else {
            setShouldRender(true)
        }
    }, [loadDelay])

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        handleIntersection()
                        observer.disconnect()
                    }
                })
            },
            {
                rootMargin,
                threshold,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [rootMargin, threshold, handleIntersection])

    const defaultLoading = (
        <div
            className="flex items-center justify-center bg-gray-50/50 rounded-lg border border-gray-100"
            style={{ minHeight }}
        >
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading section...</span>
            </div>
        </div>
    )

    const defaultPlaceholder = (
        <div
            className="flex items-center justify-center bg-gray-50/30 rounded-lg border border-dashed border-gray-200"
            style={{ minHeight }}
        >
            <span className="text-sm text-muted-foreground">Scroll to load</span>
        </div>
    )

    return (
        <div ref={ref} className={cn("w-full", className)}>
            {shouldRender ? (
                children
            ) : isIntersected && showLoadingState ? (
                loadingComponent || defaultLoading
            ) : (
                placeholder || defaultPlaceholder
            )}
        </div>
    )
}

/**
 * Hook for lazy loading data when component becomes visible
 */
export function useLazyLoad(options?: {
    rootMargin?: string
    threshold?: number
    loadDelay?: number
}) {
    const { rootMargin = "100px", threshold = 0.1, loadDelay = 0 } = options || {}
    const [isVisible, setIsVisible] = useState(false)
    const [shouldLoad, setShouldLoad] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const handleIntersection = useCallback(() => {
        setIsVisible(true)
        if (loadDelay > 0) {
            setTimeout(() => {
                setShouldLoad(true)
            }, loadDelay)
        } else {
            setShouldLoad(true)
        }
    }, [loadDelay])

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        handleIntersection()
                        observer.disconnect()
                    }
                })
            },
            {
                rootMargin,
                threshold,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [rootMargin, threshold, handleIntersection])

    return { ref, isVisible, shouldLoad }
}
