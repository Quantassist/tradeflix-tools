"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Plus, Trash2, TrendingUp, Target, DollarSign, Activity, Award, BarChart3 } from "lucide-react"
import { BacktestResultsChart } from "@/components/charts/backtest-results-chart"
import { runBacktest } from "@/lib/api/backtest"
import { useToast } from "@/hooks/use-toast"
import type { BacktestStrategy, BacktestResponse, EntryCondition, ExitCondition } from "@/types"

export default function BacktestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BacktestResponse | null>(null)

  // Strategy state
  const [strategyName, setStrategyName] = useState("My Strategy")
  const [symbol, setSymbol] = useState("GOLD")
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h")
  const [initialCapital, setInitialCapital] = useState(100000)
  const [commission, setCommission] = useState(0.05)
  const [slippage, setSlippage] = useState(0.02)
  const [positionType, setPositionType] = useState<"FIXED" | "PERCENTAGE" | "RISK_BASED">("PERCENTAGE")
  const [positionValue, setPositionValue] = useState(10)

  // Date range
  const [startDate, setStartDate] = useState("2023-01-01")
  const [endDate, setEndDate] = useState("2024-01-01")

  // Entry/Exit conditions
  const [entryConditions, setEntryConditions] = useState<EntryCondition[]>([
    { indicator: "RSI", operator: "<", value: 30 }
  ])
  const [exitConditions, setExitConditions] = useState<ExitCondition[]>([
    { type: "TAKE_PROFIT", value: 2.0 },
    { type: "STOP_LOSS", value: 1.0 }
  ])

  const addEntryCondition = () => {
    setEntryConditions([...entryConditions, { indicator: "RSI", operator: ">", value: 50 }])
  }

  const removeEntryCondition = (index: number) => {
    setEntryConditions(entryConditions.filter((_, i) => i !== index))
  }

  const updateEntryCondition = (index: number, field: keyof EntryCondition, value: any) => {
    const updated = [...entryConditions]
    updated[index] = { ...updated[index], [field]: value }
    setEntryConditions(updated)
  }

  const addExitCondition = () => {
    setExitConditions([...exitConditions, { type: "STOP_LOSS", value: 1.0 }])
  }

  const removeExitCondition = (index: number) => {
    setExitConditions(exitConditions.filter((_, i) => i !== index))
  }

  const updateExitCondition = (index: number, field: keyof ExitCondition, value: any) => {
    const updated = [...exitConditions]
    updated[index] = { ...updated[index], [field]: value }
    setExitConditions(updated)
  }

  const handleRunBacktest = async () => {
    setLoading(true)
    try {
      const strategy: BacktestStrategy = {
        name: strategyName,
        symbol,
        timeframe,
        entry_conditions: entryConditions,
        exit_conditions: exitConditions,
        position_sizing: {
          type: positionType,
          value: positionValue
        },
        initial_capital: initialCapital,
        commission_percent: commission,
        slippage_percent: slippage
      }

      const response = await runBacktest({
        strategy,
        start_date: startDate,
        end_date: endDate
      })

      setResults(response)
      toast({
        title: "Backtest Complete!",
        description: `Analyzed ${response.metrics.total_trades} trades with ${response.metrics.win_rate.toFixed(1)}% win rate`,
      })
    } catch (error) {
      toast({
        title: "Backtest Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Strategy Backtester
          </h1>
          <p className="text-muted-foreground mt-2">
            Test your trading strategies against historical data
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleRunBacktest}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <Activity className="mr-2 h-5 w-5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run Backtest
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="strategy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="space-y-6">
          {/* Basic Settings */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Settings
              </CardTitle>
              <CardDescription>Configure your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategyName">Strategy Name</Label>
                  <Input
                    id="strategyName"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="My Strategy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="CRUDE">Crude Oil</SelectItem>
                      <SelectItem value="COPPER">Copper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capital & Risk Management */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Capital & Risk Management
              </CardTitle>
              <CardDescription>Set your capital and risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialCapital">Initial Capital (₹)</Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slippage">Slippage (%)</Label>
                  <Input
                    id="slippage"
                    type="number"
                    step="0.01"
                    value={slippage}
                    onChange={(e) => setSlippage(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="positionType">Position Sizing</Label>
                  <Select value={positionType} onValueChange={(val: any) => setPositionType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Quantity</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage of Capital</SelectItem>
                      <SelectItem value="RISK_BASED">Risk-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionValue">
                    {positionType === "FIXED" ? "Quantity" : "Percentage (%)"}
                  </Label>
                  <Input
                    id="positionValue"
                    type="number"
                    step={positionType === "FIXED" ? "1" : "0.1"}
                    value={positionValue}
                    onChange={(e) => setPositionValue(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entry Conditions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Entry Conditions
                  </CardTitle>
                  <CardDescription>Define when to enter a trade</CardDescription>
                </div>
                <Button onClick={addEntryCondition} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {entryConditions.map((condition, index) => (
                <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Indicator</Label>
                    <Select
                      value={condition.indicator}
                      onValueChange={(val) => updateEntryCondition(index, 'indicator', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RSI">RSI</SelectItem>
                        <SelectItem value="MACD">MACD</SelectItem>
                        <SelectItem value="SMA">SMA</SelectItem>
                        <SelectItem value="EMA">EMA</SelectItem>
                        <SelectItem value="BOLLINGER">Bollinger Bands</SelectItem>
                        <SelectItem value="ATR">ATR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(val) => updateEntryCondition(index, 'operator', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater Than</SelectItem>
                        <SelectItem value="<">Less Than</SelectItem>
                        <SelectItem value=">=">Greater or Equal</SelectItem>
                        <SelectItem value="<=">Less or Equal</SelectItem>
                        <SelectItem value="CROSSES_ABOVE">Crosses Above</SelectItem>
                        <SelectItem value="CROSSES_BELOW">Crosses Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateEntryCondition(index, 'value', Number(e.target.value))}
                    />
                  </div>
                  <Button
                    onClick={() => removeEntryCondition(index)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Exit Conditions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-linear-to-r from-red-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Exit Conditions
                  </CardTitle>
                  <CardDescription>Define when to exit a trade</CardDescription>
                </div>
                <Button onClick={addExitCondition} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {exitConditions.map((condition, index) => (
                <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(val) => updateExitCondition(index, 'type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOP_LOSS">Stop Loss</SelectItem>
                        <SelectItem value="TAKE_PROFIT">Take Profit</SelectItem>
                        <SelectItem value="TRAILING_STOP">Trailing Stop</SelectItem>
                        <SelectItem value="TIME_BASED">Time Based</SelectItem>
                        <SelectItem value="INDICATOR">Indicator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Value (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={condition.value}
                      onChange={(e) => updateExitCondition(index, 'value', Number(e.target.value))}
                    />
                  </div>
                  <Button
                    onClick={() => removeExitCondition(index)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${results.metrics.total_pnl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.metrics.total_pnl_percent >= 0 ? '+' : ''}{results.metrics.total_pnl_percent.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{results.metrics.total_pnl.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {results.metrics.win_rate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {results.metrics.winning_trades}/{results.metrics.total_trades} trades
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {results.metrics.profit_factor.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg Win: ₹{results.metrics.avg_win.toFixed(0)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {results.metrics.max_drawdown_percent.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{results.metrics.max_drawdown.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Advanced Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="text-2xl font-bold">{results.metrics.sharpe_ratio.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sortino Ratio</div>
                      <div className="text-2xl font-bold">{results.metrics.sortino_ratio.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">CAGR</div>
                      <div className="text-2xl font-bold">{results.metrics.cagr.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Recovery Factor</div>
                      <div className="text-2xl font-bold">{results.metrics.recovery_factor.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Trade Duration</div>
                      <div className="text-2xl font-bold">{results.metrics.avg_trade_duration_hours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Longest Win Streak</div>
                      <div className="text-2xl font-bold text-green-600">{results.metrics.longest_winning_streak}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Longest Loss Streak</div>
                      <div className="text-2xl font-bold text-red-600">{results.metrics.longest_losing_streak}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Win</div>
                      <div className="text-2xl font-bold text-green-600">₹{results.metrics.max_win.toFixed(0)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <BacktestResultsChart
                equityCurve={results.equity_curve}
                monthlyReturns={results.monthly_returns}
                initialCapital={results.initial_capital}
                finalCapital={results.final_capital}
              />

              {/* Trade Log */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Trade Log
                  </CardTitle>
                  <CardDescription>Detailed list of all trades (showing first 20)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Entry Date</th>
                          <th className="text-left p-2">Exit Date</th>
                          <th className="text-right p-2">Entry Price</th>
                          <th className="text-right p-2">Exit Price</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">P&L</th>
                          <th className="text-right p-2">P&L %</th>
                          <th className="text-right p-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.trades.slice(0, 20).map((trade, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">{new Date(trade.entry_date).toLocaleDateString()}</td>
                            <td className="p-2">{new Date(trade.exit_date).toLocaleDateString()}</td>
                            <td className="text-right p-2">₹{trade.entry_price.toLocaleString()}</td>
                            <td className="text-right p-2">₹{trade.exit_price.toLocaleString()}</td>
                            <td className="text-right p-2">{trade.quantity}</td>
                            <td className={`text-right p-2 font-semibold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{trade.pnl.toLocaleString()}
                            </td>
                            <td className={`text-right p-2 font-semibold ${trade.pnl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                            </td>
                            <td className="text-right p-2">{trade.duration_hours.toFixed(1)}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {results.trades.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Showing 20 of {results.trades.length} trades
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
