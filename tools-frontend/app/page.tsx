import Link from "next/link"
import { ArrowRight, TrendingUp, Calculator, BarChart3, Calendar, Network, Zap, Shield, Target, LineChart, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/30">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-semibold">Production-Grade Trading Tools</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Trade Smarter with
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                Professional Analytics
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto">
              Powerful calculators, real-time analysis, and data-driven insights to help you make confident trading decisions in Gold, Silver, and Commodities markets.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-2xl">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 rounded-full">
                  Explore Features
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-yellow-300">5+</div>
                <div className="text-sm text-blue-100">Pro Tools</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-300">10+</div>
                <div className="text-sm text-blue-100">Calculators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-300">24/7</div>
                <div className="text-sm text-blue-100">Real-Time Data</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Professional Trading Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to analyze markets, calculate risks, and make data-driven trading decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Backtest Engine */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-emerald-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Backtest Engine</CardTitle>
                <CardDescription className="text-base">
                  Strategy Testing & Optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Test your trading strategies against historical data. Build, optimize, and validate strategies before risking real capital.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Visual Strategy Builder
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Performance Metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Risk Analysis
                  </li>
                </ul>
                <Link href="/backtest">
                  <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    Start Testing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pivot Calculator */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Pivot Levels Calculator</CardTitle>
                <CardDescription className="text-base">
                  CPR, Fibonacci & Floor Pivots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Calculate intraday support and resistance levels using proven methodologies. Get instant pivot points for precise entry and exit planning.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Central Pivot Range (CPR)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Fibonacci Retracements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Multi-timeframe Analysis
                  </li>
                </ul>
                <Link href="/pivot">
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    Try Calculator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Arbitrage Tool */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Arbitrage Analyzer</CardTitle>
                <CardDescription className="text-base">
                  COMEX vs MCX Price Comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Identify arbitrage opportunities between international and domestic exchanges. Calculate fair value and spot pricing inefficiencies.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Real-time Fair Value
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Premium/Discount Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Profit Opportunity Scanner
                  </li>
                </ul>
                <Link href="/arbitrage">
                  <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    Analyze Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Correlation Matrix */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-pink-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Network className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Correlation Matrix</CardTitle>
                <CardDescription className="text-base">
                  Asset Relationship Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Understand how different assets move together. Build diversified portfolios and identify hedging opportunities.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                    Multi-Asset Correlation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                    Interactive Heatmap
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                    Diversification Insights
                  </li>
                </ul>
                <Link href="/correlation">
                  <Button className="w-full mt-6 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                    View Matrix
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* COT Report */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">COT Report Analyzer</CardTitle>
                <CardDescription className="text-base">
                  Commitment of Traders Insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Track institutional positioning and sentiment. Understand what smart money is doing in the markets.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Commercial vs Speculator
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Position Trends
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Sentiment Gauges
                  </li>
                </ul>
                <Link href="/cot">
                  <Button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    View Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Seasonal Trends */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Seasonal Calendar</CardTitle>
                <CardDescription className="text-base">
                  Event-Based Trading Patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Exploit recurring seasonal patterns. Track festivals, harvest cycles, and economic events that impact prices.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Festival Impact Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Historical Patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Event Calendar
                  </li>
                </ul>
                <Link href="/seasonal">
                  <Button className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    View Calendar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Charts & Visualization */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-400 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LineChart className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Interactive Charts</CardTitle>
                <CardDescription className="text-base">
                  Professional Visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Beautiful, interactive charts with real-time data. Visualize complex data in an easy-to-understand format.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    Real-time Updates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    Multiple Chart Types
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    Export & Share
                  </li>
                </ul>
                <Link href="/dashboard">
                  <Button className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
                    Explore Charts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Traders Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by traders, for traders. Every feature designed to give you an edge in the markets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Production-Grade</h3>
              <p className="text-gray-600">
                Enterprise-level tools with institutional-grade accuracy and reliability
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Real-time calculations and instant results. No waiting, no delays
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Precision Accurate</h3>
              <p className="text-gray-600">
                Mathematically verified calculations you can trust for real money trades
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Data-Driven</h3>
              <p className="text-gray-600">
                Make informed decisions backed by real market data and analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-0 shadow-2xl">
            <CardContent className="p-12 text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Trade Smarter?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of traders using professional-grade tools to make better trading decisions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-xl">
                    Start Trading Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 rounded-full">
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">TradeFlix Tools</h3>
              <p className="text-sm">
                Professional trading tools for Gold, Silver, and Commodities markets.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pivot" className="hover:text-white transition-colors">Pivot Calculator</Link></li>
                <li><Link href="/arbitrage" className="hover:text-white transition-colors">Arbitrage Analyzer</Link></li>
                <li><Link href="/correlation" className="hover:text-white transition-colors">Correlation Matrix</Link></li>
                <li><Link href="/cot" className="hover:text-white transition-colors">COT Report</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/seasonal" className="hover:text-white transition-colors">Seasonal Calendar</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 TradeFlix Tools. All rights reserved. Trading involves risk.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
