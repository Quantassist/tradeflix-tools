const fs = require('fs');

const data = {
    "common": {
        "loading": "Loading...",
        "save": "Save",
        "cancel": "Cancel",
        "submit": "Submit",
        "delete": "Delete",
        "edit": "Edit",
        "back": "Back",
        "next": "Next",
        "previous": "Previous",
        "search": "Search",
        "filter": "Filter",
        "reset": "Reset",
        "close": "Close",
        "yes": "Yes",
        "no": "No",
        "or": "or",
        "and": "and",
        "more": "more"
    },
    "auth": {
        "signIn": "Sign In",
        "signUp": "Sign Up",
        "signOut": "Sign Out",
        "forgotPassword": "Forgot Password",
        "resetPassword": "Reset Password",
        "email": "Email",
        "password": "Password",
        "confirmPassword": "Confirm Password",
        "name": "Name",
        "rememberMe": "Remember me",
        "dontHaveAccount": "Don't have an account?",
        "alreadyHaveAccount": "Already have an account?",
        "sendResetLink": "Send Reset Link",
        "backToSignIn": "Back to Sign In",
        "resetPasswordDescription": "Enter your email address and we'll send you a link to reset your password.",
        "newPassword": "New Password",
        "currentPassword": "Current Password",
        "passwordChanged": "Password changed successfully",
        "passwordMismatch": "Passwords do not match",
        "passwordTooShort": "Password must be at least 8 characters"
    },
    "dashboard": {
        "title": "Dashboard",
        "welcome": "Welcome",
        "brandName": "Bullion Brain",
        "subtitle": "Professional-grade analytics for gold, silver, and commodity trading. Make data-driven decisions with institutional-level tools.",
        "platformBadge": "Commodity Intelligence Platform",
        "analyticsSuite": "Analytics Suite",
        "analyticsSuiteDescription": "Powerful tools to enhance your trading edge",
        "stats": {
            "analyticsTools": "Analytics Tools",
            "yearsOfData": "Years of Data",
            "analysisTypes": "Analysis Types"
        },
        "whyUse": {
            "dataDecisions": {
                "title": "Data-Driven Decisions",
                "description": "Replace guesswork with quantified analysis. Every tool provides statistical backing for your trading decisions."
            },
            "riskManagement": {
                "title": "Risk Management",
                "description": "Identify extreme positioning, correlation breakdowns, and arbitrage opportunities before they become obvious."
            },
            "saveTime": {
                "title": "Save Time",
                "description": "Automate your pre-market preparation. Get pivot levels, sentiment readings, and arbitrage scans in seconds."
            }
        },
        "quickStartTip": {
            "title": "Quick Start Tip",
            "description": "New to Bullion Brain? Start with the COT Report to understand market sentiment, then use the Pivot Calculator for your daily trading levels."
        }
    },
    "tools": {
        "pivot": {
            "name": "Pivot Calculator",
            "shortDesc": "Intraday Support & Resistance",
            "description": "Generate CPR, Floor, and Fibonacci pivot levels instantly. Identify key price zones where reversals and breakouts typically occur.",
            "features": {
                "cpr": "Central Pivot Range (CPR)",
                "fibonacci": "Fibonacci Retracement",
                "floor": "Floor Pivot Points",
                "multiTimeframe": "Multi-Timeframe Analysis"
            },
            "badge": "Popular"
        },
        "arbitrage": {
            "name": "Arbitrage Heatmap",
            "shortDesc": "COMEX vs MCX Opportunities",
            "description": "Real-time price comparison that identifies when MCX is expensive or cheap relative to global COMEX prices and USDINR rates.",
            "features": {
                "fairValue": "Fair Value Calculator",
                "alerts": "Premium/Discount Alerts",
                "historical": "Historical Analysis",
                "multiCommodity": "Multi-Commodity Tracking"
            },
            "badge": "Pro"
        },
        "seasonal": {
            "name": "Seasonal Trends",
            "shortDesc": "Calendar-Based Patterns",
            "description": "Analyze how gold and silver prices have historically behaved around Diwali, Akshaya Tritiya, Fed meetings, and other key events.",
            "features": {
                "festival": "Festival Impact Analysis",
                "economic": "Economic Event Tracking",
                "monthly": "Monthly Seasonality",
                "winRate": "Win Rate Statistics"
            }
        },
        "correlation": {
            "name": "Correlation Matrix",
            "shortDesc": "Multi-Asset Relationships",
            "description": "Measure relationships between Gold, USDINR, DXY, Crude Oil, and more. Identify divergence opportunities and hedge positions.",
            "features": {
                "realtime": "Real-Time Correlation",
                "beta": "Beta Sensitivity",
                "divergence": "Divergence Alerts",
                "hedging": "Portfolio Hedging"
            }
        },
        "cot": {
            "name": "COT Report",
            "shortDesc": "Smart Money Positioning",
            "description": "Decode CFTC Commitment of Traders data. Track hedge fund positioning, commercial hedger activity, and identify market turning points.",
            "features": {
                "position": "Position Visualization",
                "percentile": "Percentile Ranking",
                "sentiment": "Sentiment Gauge",
                "contrarian": "Contrarian Signals"
            },
            "badge": "Updated"
        },
        "backtest": {
            "name": "Backtest Engine",
            "shortDesc": "Strategy Validation",
            "description": "Test your gold and silver trading strategies against 10+ years of historical data. Validate ideas before risking real capital.",
            "features": {
                "simulation": "Historical Simulation",
                "metrics": "Performance Metrics",
                "drawdown": "Drawdown Analysis",
                "riskAdjusted": "Risk-Adjusted Returns"
            },
            "badge": "New"
        }
    },
    "navigation": {
        "mainMenu": "Main Menu",
        "dashboard": "Dashboard",
        "pivot": "Pivot Calculator",
        "arbitrage": "Arbitrage Heatmap",
        "correlation": "Correlation Matrix",
        "seasonal": "Seasonal Trends",
        "cot": "COT Report",
        "backtest": "Backtest Engine",
        "profile": "Profile",
        "settings": "Settings",
        "signOut": "Sign Out"
    },
    "locale": {
        "switchLanguage": "Switch Language",
        "english": "English",
        "hindi": "Hindi"
    },
    "settings": {
        "title": "Settings",
        "subtitle": "Manage your account settings and preferences",
        "changePassword": "Change Password",
        "changePasswordDescription": "Update your password to keep your account secure",
        "currentPassword": "Current Password",
        "newPassword": "New Password",
        "confirmNewPassword": "Confirm New Password",
        "enterCurrentPassword": "Enter current password",
        "enterNewPassword": "Enter new password",
        "confirmNewPasswordPlaceholder": "Confirm new password",
        "activeSession": "Active Session",
        "activeSessionDescription": "Information about your current session",
        "sessionId": "Session ID",
        "expiresAt": "Expires At",
        "dangerZone": "Danger Zone",
        "dangerZoneDescription": "Irreversible and destructive actions",
        "deleteAccount": "Delete Account",
        "deleteAccountDescription": "Permanently delete your account and all associated data"
    },
    "profile": {
        "title": "Profile",
        "subtitle": "Manage your account information",
        "personalInfo": "Personal Information",
        "personalInfoDescription": "Update your profile details and photo",
        "fullName": "Full Name",
        "enterName": "Enter your name",
        "email": "Email",
        "emailCannotChange": "Email cannot be changed",
        "saveChanges": "Save Changes",
        "accountInfo": "Account Information",
        "accountInfoDescription": "Details about your account",
        "accountId": "Account ID",
        "role": "Role",
        "emailVerified": "Email Verified"
    },
    "pivot": {
        "pageTitle": "Pivot Calculator",
        "pageSubtitle": "Precision Trading Levels",
        "headerDescription": "Calculate CPR, Floor, and Fibonacci pivot points for precise intraday trading decisions",
        "exportButton": "Export Pivot Levels",
        "inputParameters": "Input Parameters",
        "inputDescription": "Enter the previous day's high, low, and close prices",
        "howToUse": "How to Use",
        "pivotLevels": "Pivot Levels",
        "resultsDescription": "Results will appear here after calculation",
        "understandingLevels": "Understanding Levels",
        "symbol": "Symbol",
        "timeframe": "Timeframe",
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly",
        "priceData": "Price Data",
        "high": "High",
        "low": "Low",
        "close": "Close",
        "calculatePivots": "Calculate Pivots",
        "calculatingLevels": "Calculating levels..."
    },
    "arbitrage": {
        "pageTitle": "Arbitrage Heatmap",
        "pageSubtitle": "Real-Time Opportunity Analysis",
        "headerDescription": "Identify profitable arbitrage opportunities between COMEX and MCX markets with advanced analytics",
        "inputParameters": "Input Parameters",
        "inputDescription": "Enter market prices and parameters for analysis",
        "calculateArbitrage": "Calculate Arbitrage",
        "analyzingMarkets": "Analyzing markets...",
        "arbitrageAnalysis": "Arbitrage Analysis",
        "resultsDescription": "Results will appear here after calculation"
    },
    "landing": {
        "nav": {
            "aboutUs": "About Us",
            "tools": "Tools",
            "pricing": "Pricing",
            "dashboard": "Dashboard",
            "getStarted": "Get Started"
        },
        "hero": {
            "badge": "Stop guessing. Start trading with data.",
            "title": "Still doing manual analysis",
            "titleHighlight": "while opportunities slip away?",
            "description": "Every hour you spend calculating pivot levels, checking COT reports, or comparing COMEX vs MCX prices is an hour you're not trading. And by the time you're done, the opportunity has already passed.",
            "notTrading": "not trading",
            "goToDashboard": "Go to Dashboard",
            "startFreeTrial": "Start Free Trial",
            "learnMore": "Learn More",
            "stats": {
                "tools": "Pro Analytics Tools",
                "data": "Years of Historical Data",
                "plan": "Plan Available"
            }
        },
        "painPoints": {
            "title": "The Hidden Cost",
            "titleHighlight": "of Manual Trading Analysis",
            "description": "If you're trading gold, silver, or commodities without proper tools, you're probably facing these problems every single day:",
            "hoursWasted": {
                "title": "Hours Wasted on Manual Analysis",
                "description": "Calculating pivot levels, checking COT reports, comparing COMEX vs MCX prices... every single day. Time that could be spent actually trading."
            },
            "missingOpportunities": {
                "title": "Missing Profitable Opportunities",
                "description": "By the time you finish your analysis, the arbitrage window has closed. The seasonal pattern has already played out. The smart money has already moved."
            },
            "gutFeel": {
                "title": "Trading on Gut Feel",
                "description": "Without proper data, you're essentially gambling. No statistical edge, no backtested strategies, just hope and intuition."
            },
            "costTitle": "What This Is Really Costing You",
            "costs": {
                "time": "Daily analysis time you could save",
                "profit": "Potential arbitrage profits missed per month",
                "winRate": "Better win rate with seasonal timing"
            }
        },
        "solution": {
            "title": "There's a Better Way",
            "description": "What if you could do all your pre-market analysis in under 5 minutes?",
            "without": "Without Bullion Brain",
            "with": "With Bullion Brain",
            "comparisons": {
                "pivot": {
                    "without": "Manually calculate pivot levels every morning",
                    "with": "Get all pivot levels in 2 seconds"
                },
                "arbitrage": {
                    "without": "Miss arbitrage opportunities while doing math",
                    "with": "Instant fair value with premium/discount alerts"
                },
                "cot": {
                    "without": "Trade blind without knowing institutional positioning",
                    "with": "See exactly where smart money is positioned"
                },
                "seasonal": {
                    "without": "Guess whether it's a good time to buy gold",
                    "with": "Know the historical win rate for current period"
                },
                "backtest": {
                    "without": "Risk real money on untested strategies",
                    "with": "Backtest against 10+ years of data first"
                }
            },
            "startSmarter": "Start Trading Smarter"
        },
        "toolsSection": {
            "badge": "Your Complete Analytics Suite",
            "title": "6 Powerful Tools.",
            "titleHighlight": "One Platform. Zero Guesswork.",
            "description": "Stop wasting hours on manual analysis. Get institutional-grade insights in seconds.",
            "free": "Free",
            "pro": "Pro",
            "try": "Try",
            "freePlan": "Start with our Free plan — no credit card required"
        },
        "footer": {
            "copyright": "© 2024 Bullion Brain. All rights reserved.",
            "tagline": "Professional-grade analytics for gold, silver, and commodity trading."
        }
    },
    "cot": {
        "pageTitle": "COT Report Visualizer",
        "pageSubtitle": "Disaggregated Futures Only Report",
        "headerDescription": "Decode CFTC Commitment of Traders data to track hedge fund positioning and identify market turning points",
        "selectCommodity": "Select Commodity",
        "dateRange": "Date Range",
        "fetchData": "Fetch Data",
        "loading": "Loading COT data...",
        "positions": "Positions",
        "netPositions": "Net Positions",
        "commercials": "Commercials",
        "nonCommercials": "Non-Commercials",
        "retailers": "Retailers",
        "longPositions": "Long Positions",
        "shortPositions": "Short Positions",
        "percentile": "Percentile",
        "sentiment": "Sentiment",
        "bullish": "Bullish",
        "bearish": "Bearish",
        "neutral": "Neutral"
    },
    "backtest": {
        "pageTitle": "Strategy Backtester",
        "pageSubtitle": "Strategy Validation",
        "headerDescription": "Test your gold and silver trading strategies against historical data before risking real capital",
        "strategySettings": "Strategy Settings",
        "strategyDescription": "Configure your trading strategy parameters",
        "symbol": "Symbol",
        "startDate": "Start Date",
        "endDate": "End Date",
        "initialCapital": "Initial Capital",
        "runBacktest": "Run Backtest",
        "running": "Running backtest...",
        "results": "Backtest Results",
        "resultsDescription": "Performance metrics will appear here after backtest",
        "totalReturn": "Total Return",
        "maxDrawdown": "Max Drawdown",
        "winRate": "Win Rate",
        "sharpeRatio": "Sharpe Ratio",
        "totalTrades": "Total Trades",
        "profitFactor": "Profit Factor"
    },
    "correlation": {
        "pageTitle": "Correlation Matrix",
        "pageSubtitle": "Portfolio Diversification Analysis",
        "headerDescription": "Measure relationships between Gold, USDINR, DXY, Crude Oil, and more to identify divergence opportunities",
        "selectAssets": "Select Assets",
        "timeframe": "Timeframe",
        "calculateCorrelation": "Calculate Correlation",
        "calculating": "Calculating...",
        "correlationMatrix": "Correlation Matrix",
        "resultsDescription": "Select assets and calculate to view correlation matrix",
        "strongPositive": "Strong Positive",
        "weakPositive": "Weak Positive",
        "neutral": "Neutral",
        "weakNegative": "Weak Negative",
        "strongNegative": "Strong Negative"
    },
    "seasonal": {
        "pageTitle": "Seasonal Trends Engine",
        "pageSubtitle": "Event-Based Trading Patterns",
        "headerDescription": "Analyze how gold and silver prices have historically behaved around key events and festivals",
        "selectEvent": "Select Event",
        "commodity": "Commodity",
        "analyzePattern": "Analyze Pattern",
        "analyzing": "Analyzing...",
        "seasonalAnalysis": "Seasonal Analysis",
        "resultsDescription": "Select an event to see historical patterns",
        "historicalWinRate": "Historical Win Rate",
        "averageReturn": "Average Return",
        "bestYear": "Best Year",
        "worstYear": "Worst Year",
        "events": {
            "diwali": "Diwali",
            "akshayaTritiya": "Akshaya Tritiya",
            "fedMeeting": "Fed Meeting",
            "nfp": "Non-Farm Payrolls",
            "cpi": "CPI Release"
        }
    }
};

fs.writeFileSync('messages/en.json', JSON.stringify(data, null, 4));
console.log('en.json created successfully!');
