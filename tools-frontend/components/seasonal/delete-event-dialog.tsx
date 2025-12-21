"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { seasonalEventsApi, SeasonalEvent } from "@/lib/api/seasonal-events"

interface DeleteEventDialogProps {
    event: SeasonalEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEventDeleted?: () => void
}

export function DeleteEventDialog({ event, open, onOpenChange, onEventDeleted }: DeleteEventDialogProps) {
    const t = useTranslations('seasonal')
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!event) return

        setLoading(true)
        try {
            await seasonalEventsApi.deleteEvent(event.id)
            toast.success(t('eventDeletedSuccess'))
            onOpenChange(false)
            onEventDeleted?.()
        } catch (error: unknown) {
            console.error("Failed to delete event:", error)
            let errorMessage = "Failed to delete event"
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { detail?: string } } }
                errorMessage = axiosError.response?.data?.detail || errorMessage
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
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteSeasonalEvent')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('deleteConfirmation', { name: event.name })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('deleting')}
                            </>
                        ) : (
                            t('delete')
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
