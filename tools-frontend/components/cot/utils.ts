import type { SentimentLevel } from "@/types"

// Sentiment color mapping
export const getSentimentColor = (sentiment: SentimentLevel) => {
  switch (sentiment) {
    case "extreme_bull": return "bg-red-100 text-red-700 border-red-300"
    case "bullish": return "bg-orange-100 text-orange-700 border-orange-300"
    case "neutral": return "bg-gray-100 text-gray-700 border-gray-300"
    case "bearish": return "bg-blue-100 text-blue-700 border-blue-300"
    case "extreme_bear": return "bg-green-100 text-green-700 border-green-300"
    default: return "bg-gray-100 text-gray-700 border-gray-300"
  }
}

export const getSentimentLabel = (sentiment: SentimentLevel) => {
  switch (sentiment) {
    case "extreme_bull": return "Extreme Bull"
    case "bullish": return "Bullish"
    case "neutral": return "Neutral"
    case "bearish": return "Bearish"
    case "extreme_bear": return "Extreme Bear"
    default: return sentiment
  }
}

export const getSignalColor = (signal: string) => {
  if (signal === "strong_buy" || signal === "buy") return "text-green-600 bg-green-50 border-green-200"
  if (signal === "strong_sell" || signal === "sell") return "text-red-600 bg-red-50 border-red-200"
  return "text-gray-600 bg-gray-50 border-gray-200"
}

// Calculate COT Index
export const calculateCOTIndex = (current: number, data: number[]) => {
  if (data.length === 0) return 50
  const min = Math.min(...data)
  const max = Math.max(...data)
  if (max === min) return 50
  return ((current - min) / (max - min)) * 100
}

// Get next COT report release date (Friday 3:30 PM ET)
export const getNextCOTRelease = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysUntilFriday)
  nextFriday.setHours(15, 30, 0, 0) // 3:30 PM ET
  return nextFriday
}
