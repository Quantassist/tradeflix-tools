"use client";

import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Calculator,
  BarChart3,
  Calendar,
  Network,
  Zap,
  Shield,
  Target,
  LineChart,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tools = [
    {
      name: "Backtest Engine",
      description: "Strategy Testing & Optimization",
      details:
        "Test your trading strategies against historical data. Build, optimize, and validate strategies before risking real capital.",
      features: [
        "Visual Strategy Builder",
        "Performance Metrics",
        "Risk Analysis",
      ],
      icon: Activity,
      href: "/backtest",
      gradient: "from-emerald-500 to-teal-600",
      hoverBorder: "hover:border-emerald-400",
      bulletColor: "bg-emerald-500",
    },
    {
      name: "Pivot Levels Calculator",
      description: "CPR, Fibonacci & Floor Pivots",
      details:
        "Calculate intraday support and resistance levels using proven methodologies. Get instant pivot points for precise entry and exit planning.",
      features: [
        "Central Pivot Range (CPR)",
        "Fibonacci Retracements",
        "Multi-timeframe Analysis",
      ],
      icon: Calculator,
      href: "/pivot",
      gradient: "from-blue-500 to-blue-600",
      hoverBorder: "hover:border-blue-400",
      bulletColor: "bg-blue-500",
    },
    {
      name: "Arbitrage Analyzer",
      description: "COMEX vs MCX Price Comparison",
      details:
        "Identify arbitrage opportunities between international and domestic exchanges. Calculate fair value and spot pricing inefficiencies.",
      features: [
        "Real-time Fair Value",
        "Premium/Discount Analysis",
        "Profit Opportunity Scanner",
      ],
      icon: TrendingUp,
      href: "/arbitrage",
      gradient: "from-purple-500 to-purple-600",
      hoverBorder: "hover:border-purple-400",
      bulletColor: "bg-purple-500",
    },
    {
      name: "Correlation Matrix",
      description: "Multi-Asset Relationship Analysis",
      details:
        "Understand how different assets move together. Build diversified portfolios and identify hedging opportunities.",
      features: [
        "Cross-Asset Correlations",
        "Rolling Correlation Windows",
        "Portfolio Diversification",
      ],
      icon: Network,
      href: "/correlation",
      gradient: "from-orange-500 to-orange-600",
      hoverBorder: "hover:border-orange-400",
      bulletColor: "bg-orange-500",
    },
    {
      name: "Seasonal Trends",
      description: "Historical Pattern Analysis",
      details:
        "Discover recurring seasonal patterns in commodity markets. Time your trades based on historical tendencies.",
      features: ["Monthly Patterns", "Event-Based Analysis", "Win Rate Statistics"],
      icon: Calendar,
      href: "/seasonal",
      gradient: "from-pink-500 to-pink-600",
      hoverBorder: "hover:border-pink-400",
      bulletColor: "bg-pink-500",
    },
    {
      name: "COT Report",
      description: "CFTC Positioning Data",
      details:
        "Track institutional positioning with CFTC Commitment of Traders data. Understand market sentiment and positioning extremes.",
      features: [
        "Commercial Positioning",
        "Speculator Sentiment",
        "Net Position Changes",
      ],
      icon: BarChart3,
      href: "/cot",
      gradient: "from-red-500 to-red-600",
      hoverBorder: "hover:border-red-400",
      bulletColor: "bg-red-500",
    },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-purple-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Bullion Brain
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#tools"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tools
              </Link>
              <Link
                href="#why-us"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Why Us
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {session?.user ? (
                <Link href="/dashboard">
                  <Button className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="text-gray-600">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-in?tab=sign-up">
                    <Button className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                <Link
                  href="#features"
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#tools"
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tools
                </Link>
                <Link
                  href="#why-us"
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Why Us
                </Link>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {session?.user ? (
                    <Link href="/dashboard">
                      <Button className="w-full bg-linear-to-r from-blue-600 to-purple-600">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/sign-in">
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/sign-in?tab=sign-up">
                        <Button className="w-full bg-linear-to-r from-blue-600 to-purple-600">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-8 border border-blue-100">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">
                Professional Trading Analytics Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight">
              Trade Smarter with
              <span className="block bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Data-Driven Insights
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional-grade calculators, real-time analysis, and powerful
              tools to help you make confident trading decisions in Gold,
              Silver, and Commodities markets.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
                <Button
                  size="lg"
                  className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl shadow-lg shadow-blue-500/25"
                >
                  {session?.user ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#tools">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-xl border-2"
                >
                  Explore Tools
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">
                  6+
                </div>
                <div className="text-sm text-gray-500 mt-1">Pro Tools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">
                  Real-Time
                </div>
                <div className="text-sm text-gray-500 mt-1">Market Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">
                  Free
                </div>
                <div className="text-sm text-gray-500 mt-1">To Use</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Professional Trading Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to analyze markets, calculate risks, and make
              data-driven trading decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card
                key={tool.name}
                className={`group hover:shadow-xl transition-all duration-300 border-2 ${tool.hoverBorder} hover:-translate-y-1 bg-white`}
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-12 h-12 bg-linear-to-br ${tool.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{tool.details}</p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    {tool.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 ${tool.bulletColor} rounded-full`}
                        ></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={tool.href}>
                    <Button
                      className={`w-full bg-linear-to-r ${tool.gradient}`}
                    >
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Why Choose Bullion Brain?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built by traders, for traders. Our tools are designed to give you
              an edge in the markets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-Time Data
              </h3>
              <p className="text-gray-600 text-sm">
                Live market data and instant calculations for timely decisions
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 text-sm">
                Enterprise-grade security with 99.9% uptime guarantee
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Precision Tools
              </h3>
              <p className="text-gray-600 text-sm">
                Accurate calculations based on proven methodologies
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LineChart className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 text-sm">
                Deep insights powered by sophisticated algorithms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to Trade Smarter?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join traders who use Bullion Brain to make better trading decisions
            every day.
          </p>
          <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-6 rounded-xl shadow-xl"
            >
              {session?.user ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Bullion Brain</span>
              </div>
              <p className="text-sm leading-relaxed">
                Professional trading tools for Gold, Silver, and Commodities markets. Make data-driven decisions with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tools</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/backtest" className="hover:text-white transition-colors">
                    Backtest Engine
                  </Link>
                </li>
                <li>
                  <Link href="/pivot" className="hover:text-white transition-colors">
                    Pivot Calculator
                  </Link>
                </li>
                <li>
                  <Link href="/arbitrage" className="hover:text-white transition-colors">
                    Arbitrage Analyzer
                  </Link>
                </li>
                <li>
                  <Link href="/correlation" className="hover:text-white transition-colors">
                    Correlation Matrix
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/seasonal" className="hover:text-white transition-colors">
                    Seasonal Trends
                  </Link>
                </li>
                <li>
                  <Link href="/cot" className="hover:text-white transition-colors">
                    COT Report
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Bullion Brain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
