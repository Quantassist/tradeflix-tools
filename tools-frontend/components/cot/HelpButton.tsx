"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"
import { helpContent } from "./help-content"

export function HelpButton({ helpKey }: { helpKey: keyof typeof helpContent }) {
    const content = helpContent[helpKey]
    if (!content) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{content.title}</DialogTitle>
                    <DialogDescription>{content.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                    {content.items.map((item, i) => (
                        <div key={i} className="border-l-2 border-orange-200 pl-3">
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-sm text-muted-foreground">{item.explanation}</div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
