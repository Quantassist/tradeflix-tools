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
  Menu,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Sparkles,
  TrendingDown,
  FlaskConical,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

// Animation variants - using type assertion for framer-motion compatibility
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

export default function Home() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);

  const painPoints = [
    {
      icon: Clock,
      title: "Hours Wasted on Manual Analysis",
      description: "Calculating pivot levels, checking COT reports, comparing COMEX vs MCX prices... every single day. Time that could be spent actually trading.",
    },
    {
      icon: AlertTriangle,
      title: "Missing Profitable Opportunities",
      description: "By the time you finish your analysis, the arbitrage window has closed. The seasonal pattern has already played out. The smart money has already moved.",
    },
    {
      icon: TrendingDown,
      title: "Trading on Gut Feel",
      description: "Without proper data, you're essentially gambling. No statistical edge, no backtested strategies, just hope and intuition.",
    },
  ];

  const opportunityCosts = [
    { metric: "2-3 hours", label: "Daily analysis time you could save" },
    { metric: "₹5,000-15,000", label: "Potential arbitrage profits missed per month" },
    { metric: "15-20%", label: "Better win rate with seasonal timing" },
  ];

  const tools = [
    {
      name: "Backtest Engine",
      description: "Strategy Validation",
      details: "Test your Gold & Silver strategies against 10+ years of data. Know your edge before risking real capital.",
      features: ["Historical Simulation", "Performance Metrics", "Drawdown Analysis"],
      icon: FlaskConical,
      href: "/backtest",
      gradient: "from-cyan-500 to-blue-600",
      hoverBorder: "hover:border-cyan-400",
      bulletColor: "bg-cyan-500",
      isFree: true,
    },
    {
      name: "Pivot Calculator",
      description: "Intraday S/R Levels",
      details: "Generate CPR, Floor, and Fibonacci pivots instantly. Know exactly where price is likely to reverse or break.",
      features: ["Central Pivot Range", "Fibonacci Levels", "Multi-timeframe"],
      icon: Calculator,
      href: "/pivot",
      gradient: "from-blue-500 to-indigo-600",
      hoverBorder: "hover:border-blue-400",
      bulletColor: "bg-blue-500",
      isFree: true,
    },
    {
      name: "Arbitrage Heatmap",
      description: "COMEX vs MCX",
      details: "Spot when MCX is overpriced or underpriced vs COMEX. Capture pricing inefficiencies before they disappear.",
      features: ["Fair Value Calculator", "Premium Alerts", "Historical Spreads"],
      icon: DollarSign,
      href: "/arbitrage",
      gradient: "from-emerald-500 to-teal-600",
      hoverBorder: "hover:border-emerald-400",
      bulletColor: "bg-emerald-500",
      isFree: false,
    },
    {
      name: "Correlation Matrix",
      description: "Multi-Asset Analysis",
      details: "Understand how Gold moves with USDINR, DXY, and Crude. Find divergence trades and hedge positions.",
      features: ["Cross-Asset Correlations", "Beta Sensitivity", "Divergence Alerts"],
      icon: Network,
      href: "/correlation",
      gradient: "from-orange-500 to-amber-600",
      hoverBorder: "hover:border-orange-400",
      bulletColor: "bg-orange-500",
      isFree: false,
    },
    {
      name: "Seasonal Trends",
      description: "Calendar Patterns",
      details: "Know how Gold behaves around Diwali, Akshaya Tritiya, Fed meetings. Trade with historical probabilities on your side.",
      features: ["Festival Analysis", "Event Tracking", "Win Rate Stats"],
      icon: Calendar,
      href: "/seasonal",
      gradient: "from-violet-500 to-purple-600",
      hoverBorder: "hover:border-violet-400",
      bulletColor: "bg-violet-500",
      isFree: true,
    },
    {
      name: "COT Report",
      description: "Smart Money Positioning",
      details: "See what hedge funds and commercials are doing. Identify extreme positioning that precedes major moves.",
      features: ["Position Visualization", "Percentile Rankings", "Contrarian Signals"],
      icon: BarChart3,
      href: "/cot",
      gradient: "from-rose-500 to-pink-600",
      hoverBorder: "hover:border-rose-400",
      bulletColor: "bg-rose-500",
      isFree: true,
    },
  ];

  const withoutVsWith = [
    {
      without: "Manually calculate pivot levels every morning",
      with: "Get all pivot levels in 2 seconds",
    },
    {
      without: "Miss arbitrage opportunities while doing math",
      with: "Instant fair value with premium/discount alerts",
    },
    {
      without: "Trade blindly without knowing institutional positioning",
      with: "See exactly where smart money is positioned",
    },
    {
      without: "Guess if it's a good time to buy Gold",
      with: "Know historical win rates for current period",
    },
    {
      without: "Risk real money on untested strategies",
      with: "Backtest against 10+ years of data first",
    },
  ];

  return (
    <div className="bg-white">
      {/* Modern Header - Dark Glassmorphism (Box.com style) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="flex h-14 sm:h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-white">
                    Bullion Brain
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href="#problem"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    Why You Need This
                  </Link>
                  <Link
                    href="#tools"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    Tools
                  </Link>
                  <Link
                    href="#pricing"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#why-us"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    Benefits
                  </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-2 sm:gap-3">
                  {session?.user ? (
                    <Link href="/dashboard">
                      <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all">
                        Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/sign-in">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium px-4 py-2 rounded-xl">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/sign-in?tab=sign-up">
                        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all">
                          Get Started Free
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden py-4 border-t border-slate-700/50">
                  <nav className="flex flex-col gap-1">
                    <Link
                      href="#problem"
                      className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Why You Need This
                    </Link>
                    <Link
                      href="#tools"
                      className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Tools
                    </Link>
                    <Link
                      href="#pricing"
                      className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="#why-us"
                      className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Benefits
                    </Link>
                    <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-700/50">
                      {session?.user ? (
                        <Link href="/dashboard">
                          <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl">
                            Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link href="/sign-in">
                            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 rounded-xl">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/sign-in?tab=sign-up">
                            <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl">
                              Get Started Free
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Light Theme with Gradient (Box.com style) */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Light gradient background - purple/blue to white */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-purple-50/50 to-white" />

        {/* Subtle decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-40 right-1/4 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            {/* Animated Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full mb-6 sm:mb-8 shadow-lg"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base font-semibold tracking-wide">
                Stop Guessing. Start Trading with Data.
              </span>
            </motion.div>

            {/* Main Heading - Original taglines with light theme */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 sm:mb-8 text-gray-900 leading-[1.15] tracking-tight"
            >
              Still Doing Manual Analysis
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="block mt-2 sm:mt-3"
              >
                <span className="bg-linear-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                  While Opportunities Slip Away?
                </span>
              </motion.span>
            </motion.h1>

            {/* Subheading - Original copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
            >
              Every hour you spend calculating pivot levels, checking COT reports, or comparing COMEX vs MCX prices
              is an hour you&apos;re <span className="text-blue-600 font-bold">not trading</span>. And by the time you&apos;re done,
              the opportunity has already moved.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4"
            >
              <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full shadow-xl shadow-blue-600/25 font-bold"
                  >
                    {session?.user ? "Go to Dashboard" : "Start Free Trial"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#problem">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 font-semibold"
                  >
                    Learn more
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats - No parallax fade */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto px-4"
            >
              {[
                { value: "6", label: "Pro Analytics Tools", suffix: "" },
                { value: "10", label: "Years of Historical Data", suffix: "+" },
                { value: "Free", label: "Plan Available", suffix: "" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                  className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-sm"
                >
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-1 sm:mb-2">
                    {stat.value}<span className="text-blue-600">{stat.suffix}</span>
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - Light Theme with Smooth Gradient */}
      <section id="problem" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background - white to light blue */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-blue-50/50" />

        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-8 sm:mb-10"
          >
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
              The Hidden Cost of
              <span className="block text-red-600">Manual Trading Analysis</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              If you&apos;re trading Gold, Silver, or Commodities without proper tools, you&apos;re likely facing these problems every single day:
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16"
          >
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className="relative bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <point.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{point.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{point.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Opportunity Cost - Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6 sm:mb-10 text-center">
                What This Is <span className="text-red-400">Actually Costing</span> You
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-8">
                {opportunityCosts.map((cost, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-amber-400 mb-1 sm:mb-2">
                      {cost.metric}
                    </div>
                    <div className="text-slate-300 text-sm sm:text-base">{cost.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section - Light Theme with Smooth Gradient */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background - blue to light purple */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-purple-50/30" />

        <div className="container mx-auto max-w-5xl relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-8 sm:mb-10"
          >
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
              There&apos;s a <span className="text-emerald-600">Better Way</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              What if you could do all your pre-market analysis in under 5 minutes?
            </motion.p>
          </motion.div>

          {/* Comparison Table Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6"
          >
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border border-red-200">
              <span className="text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Without Bullion Brain</span>
            </div>
            <div className="text-center p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-200">
              <span className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider">With Bullion Brain</span>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-2 sm:space-y-3"
          >
            {withoutVsWith.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="grid grid-cols-2 gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5 bg-red-50 rounded-xl sm:rounded-2xl border border-red-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <span className="text-xs sm:text-sm lg:text-base text-gray-700">{item.without}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <span className="text-xs sm:text-sm lg:text-base text-gray-900 font-semibold">{item.with}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8 sm:mt-10"
          >
            <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 rounded-full shadow-xl shadow-blue-600/20 font-bold"
                >
                  {session?.user ? "Go to Dashboard" : "Start Trading Smarter"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tools Section - Light Theme with Gradient */}
      <section id="tools" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background - purple to light */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 via-white to-slate-50" />

        <div className="container mx-auto max-w-7xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-4 sm:mb-6 shadow-lg">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base font-semibold">Your Complete Analytics Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
              6 Powerful Tools.
              <span className="block text-blue-600">One Platform. Zero Guesswork.</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Stop wasting hours on manual analysis. Get institutional-grade insights in seconds.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                  {/* Top accent line */}
                  <div className={`h-1 bg-gradient-to-r ${tool.gradient}`} />

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {/* Icon and badge row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${tool.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <tool.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      {tool.isFree ? (
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          Free
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                          Pro
                        </span>
                      )}
                    </div>

                    {/* Title and subtitle */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-3">{tool.description}</p>

                    {/* Value proposition */}
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{tool.details}</p>

                    {/* Features with checkmarks */}
                    <ul className="space-y-2 mb-5 flex-1">
                      {tool.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${tool.bulletColor.replace('bg-', 'text-')}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button - always at bottom */}
                    <Link href={tool.href} className="block mt-auto">
                      <Button className={`w-full bg-gradient-to-r ${tool.gradient} hover:opacity-90 text-white font-semibold py-5 sm:py-6 rounded-xl shadow-lg transition-all group-hover:shadow-xl`}>
                        <span>Try {tool.name.split(' ')[0]}</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8 sm:mt-10"
          >
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Start with our <span className="text-blue-600 font-semibold">free plan</span> — no credit card required
            </p>
            <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-full shadow-xl shadow-blue-600/20">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section - Light Theme with Gradient */}
      <section id="why-us" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-blue-50/30" />

        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
              Built for <span className="text-blue-600">Serious Traders</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Not another generic trading app. Bullion Brain is specifically designed for Gold, Silver & Commodities traders.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[
              { icon: Clock, title: "Save 2+ Hours Daily", desc: "Automate your pre-market analysis. Get all levels and signals in seconds.", gradient: "from-blue-500 to-blue-600" },
              { icon: Shield, title: "Reduce Risk", desc: "Backtest strategies before risking capital. Know your edge statistically.", gradient: "from-emerald-500 to-emerald-600" },
              { icon: Target, title: "Spot Opportunities", desc: "Catch arbitrage windows and seasonal patterns before they disappear.", gradient: "from-purple-500 to-purple-600" },
              { icon: LineChart, title: "Trade with Confidence", desc: "Know what smart money is doing. Make decisions backed by data, not gut feel.", gradient: "from-orange-500 to-orange-600" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-gray-200 hover:shadow-xl transition-all duration-500 bg-white h-full">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${item.gradient} rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-5 shadow-lg`}>
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Freemium Model */}
      <section id="pricing" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-white to-purple-50/20" />

        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-4 sm:mb-6 border border-purple-200">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base font-semibold">Simple, Transparent Pricing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
              Start Free, <span className="text-blue-600">Upgrade When Ready</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Get started with powerful free tools. Unlock advanced features when you need them.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="relative"
            >
              <div className="h-full bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-500 text-sm">Perfect for getting started</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">₹0</span>
                  <span className="text-gray-500 ml-2">/forever</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Pivot Calculator (Basic)",
                    "Arbitrage Alerts (Delayed)",
                    "COT Reports (Weekly Summary)",
                    "Seasonal Patterns (Limited)",
                    "Community Support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-in?tab=sign-up">
                  <Button variant="outline" className="w-full py-6 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Pro Plan - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <div className="h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-600/20 ring-2 ring-blue-600/50">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-blue-200 text-sm">For serious traders</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">₹999</span>
                  <span className="text-blue-200 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Free, plus:",
                    "Real-time Arbitrage Alerts",
                    "Full COT Analysis & Charts",
                    "Advanced Pivot Strategies",
                    "Correlation Matrix (All Pairs)",
                    "Backtest Engine (Unlimited)",
                    "Priority Email Support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white">
                      <CheckCircle2 className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-in?tab=sign-up">
                  <Button className="w-full py-6 rounded-xl bg-white hover:bg-gray-100 text-blue-700 font-bold shadow-lg">
                    Start 7-Day Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="h-full bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <p className="text-gray-500 text-sm">For trading firms & teams</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Pro, plus:",
                    "API Access",
                    "Custom Integrations",
                    "Multi-user Dashboard",
                    "White-label Options",
                    "Dedicated Account Manager",
                    "24/7 Phone Support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="mailto:contact@bullionbrain.com">
                  <Button variant="outline" className="w-full py-6 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Money-back guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8 sm:mt-10"
          >
            <div className="inline-flex items-center gap-2 text-gray-600">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-sm sm:text-base">30-day money-back guarantee • Cancel anytime • No questions asked</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOMO / Urgency Section - Light Theme with Blue Accent Card */}
      <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/20 via-white to-slate-100" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto max-w-4xl text-center relative"
        >
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-3 sm:mb-4 leading-tight px-4">
              Every Day You Trade Without Data,
              <span className="block text-blue-200">You&apos;re Leaving Money on the Table</span>
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Professional traders don&apos;t guess. They use tools like COT reports, seasonal analysis, and correlation data to stack the odds in their favor.
              The question is: <span className="font-bold text-white">how long will you trade at a disadvantage?</span>
            </p>
            <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-700 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full shadow-xl font-bold"
                >
                  {session?.user ? "Go to Dashboard" : "Start Your Free Trial"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section - Light Theme */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-gray-50" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto max-w-4xl text-center relative"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 border border-emerald-200"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base font-semibold">7-Day Free Trial</span>
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-tight">
            Ready to Trade
            <span className="block text-blue-600">Like a Pro?</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Join traders who&apos;ve stopped guessing and started using data.
            Start with our <span className="text-blue-600 font-bold">free plan</span> or unlock all features with Pro.
          </p>
          <Link href={session?.user ? "/dashboard" : "/sign-in?tab=sign-up"}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg lg:text-xl px-8 sm:px-12 py-6 sm:py-8 rounded-full shadow-2xl shadow-blue-600/25 font-bold"
              >
                {session?.user ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </motion.div>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500 mt-6"
          >
            Takes 30 seconds to sign up. Start analyzing in under a minute.
          </motion.p>
        </motion.div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-stone-900 text-stone-400 relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4 sm:mb-6 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
                  <TrendingUp className="h-5 w-5 text-slate-900" />
                </div>
                <span className="text-xl font-bold text-white">Bullion Brain</span>
              </Link>
              <p className="text-sm leading-relaxed text-stone-400 mb-6 max-w-xs">
                Professional trading tools for Gold, Silver, and Commodities markets. Make data-driven decisions with confidence.
              </p>
            </div>

            {/* Analytics Tools Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 sm:mb-5 text-sm uppercase tracking-wider">Analytics Tools</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/backtest" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:bg-amber-400 transition-colors" />
                    Backtest Engine
                  </Link>
                </li>
                <li>
                  <Link href="/pivot" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:bg-amber-400 transition-colors" />
                    Pivot Calculator
                  </Link>
                </li>
                <li>
                  <Link href="/arbitrage" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-amber-400 transition-colors" />
                    Arbitrage Heatmap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Research Tools Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 sm:mb-5 text-sm uppercase tracking-wider">Research Tools</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/correlation" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover:bg-amber-400 transition-colors" />
                    Correlation Matrix
                  </Link>
                </li>
                <li>
                  <Link href="/seasonal" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 group-hover:bg-amber-400 transition-colors" />
                    Seasonal Trends
                  </Link>
                </li>
                <li>
                  <Link href="/cot" className="text-sm text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:bg-amber-400 transition-colors" />
                    COT Report
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 sm:mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-stone-800 mt-10 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-stone-500">
                &copy; {new Date().getFullYear()} Bullion Brain. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <span className="text-xs text-stone-600">Built for serious traders</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
