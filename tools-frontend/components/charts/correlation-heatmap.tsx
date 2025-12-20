"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { Network, TrendingUp, TrendingDown } from "lucide-react"
import { useTranslations } from 'next-intl'

type CorrelationHeatmapProps = {
  matrix: Record<string, Record<string, number>>
  assets: string[]
}

export function CorrelationHeatmap({ matrix, assets }: CorrelationHeatmapProps) {
  const t = useTranslations('correlation.heatmap')
  const getColor = (value: number) => {
    // Return gradient background based on correlation value
    if (value === 1) return 'bg-linear-to-br from-blue-500 to-blue-600 text-white' // Perfect correlation (self)
    if (value > 0.7) return 'bg-linear-to-br from-green-500 to-green-600 text-white'
    if (value > 0.3) return 'bg-linear-to-br from-green-300 to-green-400 text-gray-900'
    if (value > -0.3) return 'bg-linear-to-br from-gray-200 to-gray-300 text-gray-800'
    if (value > -0.7) return 'bg-linear-to-br from-red-300 to-red-400 text-gray-900'
    return 'bg-linear-to-br from-red-500 to-red-600 text-white'
  }

  const getIntensity = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue > 0.8) return 'font-bold text-lg'
    if (absValue > 0.5) return 'font-semibold text-base'
    return 'font-medium text-sm'
  }

  const getBorderStyle = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue > 0.8) return 'border-2 border-yellow-400 shadow-lg'
    return 'border border-gray-200'
  }

  // Calculate statistics
  const correlations = assets.flatMap((a1, i) =>
    assets.slice(i + 1).map(a2 => ({
      pair: `${a1}-${a2}`,
      value: matrix[a1]?.[a2] ?? 0
    }))
  )
  const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.value), 0) / correlations.length
  const strongCorrelations = correlations.filter(c => Math.abs(c.value) > 0.7).length

  return (
    <Card className="shadow-xl border-2">
      <CardHeader className="bg-linear-to-r from-cyan-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Network className="h-6 w-6 text-blue-600" />
              {t('title')}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {t('description')}
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-200">
              <p className="text-xs text-muted-foreground">{t('avgCorrelation')}</p>
              <p className="text-xl font-bold text-blue-600">{avgCorrelation.toFixed(2)}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border-2 border-green-200">
              <p className="text-xs text-muted-foreground">{t('strongLinks')}</p>
              <p className="text-xl font-bold text-green-600">{strongCorrelations}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-2 bg-linear-to-br from-gray-100 to-gray-200 sticky left-0 z-10"></th>
                {assets.map((asset) => (
                  <th key={asset} className="p-3 border-2 bg-linear-to-br from-blue-100 to-blue-200 font-bold text-sm">
                    {asset}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset1) => (
                <tr key={asset1}>
                  <td className="p-3 border-2 bg-linear-to-br from-gray-100 to-gray-200 font-bold text-sm sticky left-0 z-10">
                    {asset1}
                  </td>
                  {assets.map((asset2) => {
                    const value = matrix[asset1]?.[asset2] ?? 0
                    return (
                      <td
                        key={asset2}
                        className={`p-4 border-2 text-center ${getColor(value)} ${getIntensity(value)} ${getBorderStyle(value)} transition-all duration-300 hover:scale-110 hover:z-20 hover:shadow-2xl cursor-pointer relative group`}
                        title={`${asset1} vs ${asset2}: ${formatNumber(value, 3)}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{formatNumber(value, 2)}</span>
                          {Math.abs(value) > 0.7 && value !== 1 && (
                            <span className="text-xs mt-1">
                              {value > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            </span>
                          )}
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-2 -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-30 shadow-xl">
                          <div className="font-semibold">{asset1} ↔ {asset2}</div>
                          <div>Correlation: {formatNumber(value, 3)}</div>
                          <div className="text-yellow-300">
                            {Math.abs(value) > 0.8 ? t('veryStrong') : Math.abs(value) > 0.5 ? t('strong') : Math.abs(value) > 0.3 ? t('moderateLabel') : t('weakLabel')}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-sm text-gray-700">{t('correlationStrengthGuide')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-green-200 bg-green-50">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md"></div>
              <div className="text-center">
                <div className="font-bold text-sm text-green-700">{t('strongPositive')}</div>
                <div className="text-xs text-gray-600">&gt; 0.7</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-green-100 bg-green-25">
              <div className="w-12 h-12 bg-linear-to-br from-green-300 to-green-400 rounded-lg shadow-md"></div>
              <div className="text-center">
                <div className="font-bold text-sm text-green-600">{t('moderatePositive')}</div>
                <div className="text-xs text-gray-600">0.3 to 0.7</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
              <div className="w-12 h-12 bg-linear-to-br from-gray-200 to-gray-300 rounded-lg shadow-md"></div>
              <div className="text-center">
                <div className="font-bold text-sm text-gray-700">{t('weak')}</div>
                <div className="text-xs text-gray-600">-0.3 to 0.3</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-red-100 bg-red-25">
              <div className="w-12 h-12 bg-linear-to-br from-red-300 to-red-400 rounded-lg shadow-md"></div>
              <div className="text-center">
                <div className="font-bold text-sm text-red-600">{t('moderateNegative')}</div>
                <div className="text-xs text-gray-600">-0.7 to -0.3</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-red-200 bg-red-50">
              <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md"></div>
              <div className="text-center">
                <div className="font-bold text-sm text-red-700">{t('strongNegative')}</div>
                <div className="text-xs text-gray-600">&lt; -0.7</div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h5 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('keyInsights')}
            </h5>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>{t('positiveCorrelation')}</strong> {t('positiveCorrelationDesc')}</li>
              <li>• <strong>{t('negativeCorrelation')}</strong> {t('negativeCorrelationDesc')}</li>
              <li>• <strong>{t('strongCorrelations')}</strong> {t('strongCorrelationsDesc')}</li>
              <li>• <strong>{t('diversificationTip')}</strong> {t('diversificationTipDesc')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
