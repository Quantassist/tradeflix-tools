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
import { BookOpen, Lightbulb } from "lucide-react"
import { tabInterpretationGuides } from "./interpretation-guides"

const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
}

const textColorMap: Record<string, string> = {
    blue: 'text-blue-700',
    orange: 'text-orange-700',
    purple: 'text-purple-700',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
}

export function InterpretationGuideButton({ tabKey }: { tabKey: keyof typeof tabInterpretationGuides }) {
    const guide = tabInterpretationGuides[tabKey]
    if (!guide) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 font-medium"
                >
                    <BookOpen className="h-4 w-4" />
                    Interpretation Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            {guide.title}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-base mt-2">
                            {guide.subtitle}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-6 py-5">
                    {/* Sections */}
                    <div className="space-y-6">
                        {guide.sections.map((section, idx) => (
                            <div key={idx} className={`rounded-xl border p-4 ${bgColorMap[section.color] || 'bg-gray-50 border-gray-200'}`}>
                                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${textColorMap[section.color] || 'text-gray-700'}`}>
                                    <span className="text-xl">{section.icon}</span>
                                    {section.title}
                                </h3>
                                <div className="space-y-2">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="bg-white/80 rounded-lg p-3 border border-white/50">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                                <span className="font-medium text-gray-900 min-w-[140px]">{item.term}</span>
                                                <span className="text-gray-600 flex-1">{item.meaning}</span>
                                                {item.signal && (
                                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${item.signal.includes('BUY') || item.signal.includes('Bullish') ? 'bg-green-100 text-green-700' :
                                                        item.signal.includes('SELL') || item.signal.includes('Bearish') ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {item.signal}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Quick Reference Table */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-lg font-semibold mb-3 text-slate-700">⚡ Quick Reference</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-2 px-3 font-medium text-slate-600">Condition</th>
                                            <th className="text-left py-2 px-3 font-medium text-slate-600">Interpretation</th>
                                            <th className="text-left py-2 px-3 font-medium text-slate-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {guide.quickReference.map((ref, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                <td className="py-2 px-3 font-mono text-xs bg-white">{ref.condition}</td>
                                                <td className="py-2 px-3">{ref.interpretation}</td>
                                                <td className="py-2 px-3 font-medium text-indigo-600">{ref.action}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pro Tips */}
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <h3 className="text-lg font-semibold mb-3 text-amber-700 flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Pro Tips
                            </h3>
                            <ul className="space-y-2">
                                {guide.proTips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                                        <span className="text-amber-500 mt-1">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t text-center">
                    <p className="text-xs text-slate-500">
                        COT data is released weekly (Friday 3:30 PM ET). Best used for swing trading and medium-term positioning.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
