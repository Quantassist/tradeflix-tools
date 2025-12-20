const fs = require('fs');

// Read existing en.json
const enPath = 'messages/en.json';
const hiPath = 'messages/hi.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Add new landing page translations
enData.landing = {
    ...enData.landing,
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
        "startYourFreeTrial": "Start Your Free Trial",
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
        "actuallyCosting": "What This Is Actually Costing You",
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
        "startTradingSmarter": "Start Trading Smarter",
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
        "freePlan": "Start with our Free plan — no credit card required",
        "freePlanText": "Start with our free plan — no credit card required"
    },
    "tools": {
        "backtest": {
            "name": "Backtest Engine",
            "description": "Strategy Validation",
            "details": "Test your Gold & Silver strategies against 10+ years of data. Know your edge before risking real capital.",
            "features": ["Historical Simulation", "Performance Metrics", "Drawdown Analysis"]
        },
        "pivot": {
            "name": "Pivot Calculator",
            "description": "Intraday S/R Levels",
            "details": "Generate CPR, Floor, and Fibonacci pivots instantly. Know exactly where price is likely to reverse or break.",
            "features": ["Central Pivot Range", "Fibonacci Levels", "Multi-timeframe"]
        },
        "arbitrage": {
            "name": "Arbitrage Heatmap",
            "description": "COMEX vs MCX",
            "details": "Spot when MCX is overpriced or underpriced vs COMEX. Capture pricing inefficiencies before they disappear.",
            "features": ["Fair Value Calculator", "Premium Alerts", "Historical Spreads"]
        },
        "correlation": {
            "name": "Correlation Matrix",
            "description": "Multi-Asset Analysis",
            "details": "Understand how Gold moves with USDINR, DXY, and Crude. Find divergence trades and hedge positions.",
            "features": ["Cross-Asset Correlations", "Beta Sensitivity", "Divergence Alerts"]
        },
        "seasonal": {
            "name": "Seasonal Trends",
            "description": "Calendar Patterns",
            "details": "Know how Gold behaves around Diwali, Akshaya Tritiya, Fed meetings. Trade with historical probabilities on your side.",
            "features": ["Festival Analysis", "Event Tracking", "Win Rate Stats"]
        },
        "cot": {
            "name": "COT Report",
            "description": "Smart Money Positioning",
            "details": "See what hedge funds and commercials are doing. Identify extreme positioning that precedes major moves.",
            "features": ["Position Visualization", "Percentile Rankings", "Contrarian Signals"]
        }
    },
    "whyUs": {
        "title": "Built for Serious Traders",
        "description": "Not another generic trading app. Bullion Brain is specifically designed for Gold, Silver & Commodities traders.",
        "saveTime": {
            "title": "Save 2+ Hours Daily",
            "description": "Automate your pre-market analysis. Get all levels and signals in seconds."
        },
        "reduceRisk": {
            "title": "Reduce Risk",
            "description": "Backtest strategies before risking capital. Know your edge statistically."
        },
        "spotOpportunities": {
            "title": "Spot Opportunities",
            "description": "Catch arbitrage windows and seasonal patterns before they disappear."
        },
        "tradeWithConfidence": {
            "title": "Trade with Confidence",
            "description": "Know what smart money is doing. Make decisions backed by data, not gut feel."
        }
    },
    "pricing": {
        "badge": "Simple, Transparent Pricing",
        "title": "Start Free,",
        "titleHighlight": "Upgrade When Ready",
        "description": "Get started with powerful free tools. Unlock advanced features when you need them.",
        "free": {
            "name": "Free",
            "tagline": "Perfect for getting started",
            "price": "₹0",
            "period": "/forever",
            "cta": "Get Started Free",
            "features": [
                "Pivot Calculator (Basic)",
                "Arbitrage Alerts (Delayed)",
                "COT Reports (Weekly Summary)",
                "Seasonal Patterns (Limited)",
                "Community Support"
            ]
        },
        "pro": {
            "name": "Pro",
            "badge": "MOST POPULAR",
            "tagline": "For serious traders",
            "price": "₹999",
            "period": "/month",
            "cta": "Start 7-Day Free Trial",
            "features": [
                "Everything in Free, plus:",
                "Real-time Arbitrage Alerts",
                "Full COT Analysis & Charts",
                "Advanced Pivot Strategies",
                "Correlation Matrix (All Pairs)",
                "Backtest Engine (Unlimited)",
                "Priority Email Support"
            ]
        },
        "enterprise": {
            "name": "Enterprise",
            "tagline": "For trading firms & teams",
            "price": "Custom",
            "cta": "Contact Sales",
            "features": [
                "Everything in Pro, plus:",
                "API Access",
                "Custom Integrations",
                "Multi-user Dashboard",
                "White-label Options",
                "Dedicated Account Manager",
                "24/7 Phone Support"
            ]
        },
        "guarantee": "30-day money-back guarantee • Cancel anytime • No questions asked"
    },
    "fomo": {
        "title": "Every Day You Trade Without Data,",
        "titleHighlight": "You're Leaving Money on the Table",
        "description": "Professional traders don't guess. They use tools like COT reports, seasonal analysis, and correlation data to stack the odds in their favor.",
        "question": "how long will you trade at a disadvantage?"
    },
    "finalCta": {
        "badge": "7-Day Free Trial",
        "title": "Ready to Trade",
        "titleHighlight": "Like a Pro?",
        "description": "Join traders who've stopped guessing and started using data. Start with our free plan or unlock all features with Pro.",
        "signupTime": "Takes 30 seconds to sign up. Start analyzing in under a minute."
    },
    "footer": {
        "brandDescription": "Professional trading tools for Gold, Silver, and Commodities markets. Make data-driven decisions with confidence.",
        "analyticsTools": "Analytics Tools",
        "researchTools": "Research Tools",
        "company": "Company",
        "dashboard": "Dashboard",
        "aboutUs": "About Us",
        "privacyPolicy": "Privacy Policy",
        "termsOfService": "Terms of Service",
        "copyright": "© 2024 Bullion Brain. All rights reserved.",
        "tagline": "Built for serious traders"
    }
};

// Add new backtest translations
enData.backtest = {
    ...enData.backtest,
    "pageTitle": "Strategy Backtester",
    "pageSubtitle": "Strategy Validation",
    "period": "Period",
    "capital": "Capital",
    "runBacktest": "Run Backtest",
    "running": "Running...",
    "guide": {
        "title": "Understanding Strategy Backtesting",
        "badge": "Guide",
        "description": "Learn how to build, test, and evaluate trading strategies",
        "showGuide": "Show Guide",
        "hideGuide": "Hide Guide"
    },
    "concepts": {
        "entryExitRules": {
            "title": "Entry & Exit Rules",
            "description": "Define conditions using indicators like RSI, EMA, MACD for automated signals."
        },
        "winRateReturns": {
            "title": "Win Rate & Returns",
            "description": "Track total return, win rate, and Sharpe ratio to measure performance."
        },
        "riskManagement": {
            "title": "Risk Management",
            "description": "Set stop-loss and take-profit levels to protect capital and lock gains."
        },
        "maxDrawdown": {
            "title": "Max Drawdown",
            "description": "Monitor the largest peak-to-trough decline to assess strategy risk."
        }
    },
    "tabs": {
        "strategy": "Strategy",
        "results": "Results"
    },
    "strategyBuilder": {
        "title": "Build Your Strategy",
        "description": "Define entry and exit conditions using technical indicators",
        "entry": "ENTRY",
        "exit": "EXIT",
        "and": "AND",
        "or": "OR",
        "addCondition": "Condition",
        "addGroup": "Group"
    },
    "strategyLibrary": {
        "title": "Strategy Library",
        "description": "Select a prebuilt strategy or load one of your saved strategies.",
        "prebuiltStrategies": "Prebuilt Strategies",
        "mySaved": "My Saved",
        "save": "Save",
        "load": "Load"
    },
    "results": {
        "priceAction": "Price Action",
        "equityCurve": "Equity Curve",
        "entry": "Entry",
        "exit": "Exit",
        "tradeHistory": {
            "title": "Trade History",
            "completedTrades": "completed trades",
            "entryDate": "Entry Date",
            "entryPrice": "Entry Price",
            "exitDate": "Exit Date",
            "exitPrice": "Exit Price",
            "pnl": "P&L"
        }
    },
    "totalReturn": "Total Return",
    "winRate": "Win Rate",
    "totalTrades": "Total Trades",
    "maxDrawdown": "Max Drawdown",
    "sharpeRatio": "Sharpe Ratio",
    "profitFactor": "Profit Factor"
};

// Write updated files
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
console.log('en.json updated successfully!');

// Update hi.json with matching structure
hiData.landing = {
    ...hiData.landing,
    "tools": {
        "backtest": {
            "name": "बैकटेस्ट इंजन",
            "description": "स्ट्रैटेजी वैलिडेशन",
            "details": "10+ वर्षों के डेटा के खिलाफ अपनी गोल्ड और सिल्वर स्ट्रैटेजी का परीक्षण करें। वास्तविक पूंजी को जोखिम में डालने से पहले अपना एज जानें।",
            "features": ["ऐतिहासिक सिमुलेशन", "परफॉर्मेंस मेट्रिक्स", "ड्रॉडाउन एनालिसिस"]
        },
        "pivot": {
            "name": "पिवट कैलकुलेटर",
            "description": "इंट्राडे S/R लेवल",
            "details": "CPR, फ्लोर और फिबोनाची पिवट तुरंत जनरेट करें। जानें कि कीमत कहां रिवर्स या ब्रेक होने की संभावना है।",
            "features": ["सेंट्रल पिवट रेंज", "फिबोनाची लेवल", "मल्टी-टाइमफ्रेम"]
        },
        "arbitrage": {
            "name": "आर्बिट्राज हीटमैप",
            "description": "COMEX बनाम MCX",
            "details": "जानें कि MCX कब COMEX के मुकाबले महंगा या सस्ता है। गायब होने से पहले प्राइसिंग अक्षमताओं को पकड़ें।",
            "features": ["फेयर वैल्यू कैलकुलेटर", "प्रीमियम अलर्ट", "ऐतिहासिक स्प्रेड"]
        },
        "correlation": {
            "name": "कोरिलेशन मैट्रिक्स",
            "description": "मल्टी-एसेट एनालिसिस",
            "details": "समझें कि गोल्ड USDINR, DXY और क्रूड के साथ कैसे मूव करता है। डाइवर्जेंस ट्रेड और हेज पोजीशन खोजें।",
            "features": ["क्रॉस-एसेट कोरिलेशन", "बीटा सेंसिटिविटी", "डाइवर्जेंस अलर्ट"]
        },
        "seasonal": {
            "name": "सीजनल ट्रेंड्स",
            "description": "कैलेंडर पैटर्न",
            "details": "जानें कि दिवाली, अक्षय तृतीया, फेड मीटिंग के आसपास गोल्ड कैसे व्यवहार करता है। ऐतिहासिक संभावनाओं के साथ ट्रेड करें।",
            "features": ["त्योहार विश्लेषण", "इवेंट ट्रैकिंग", "विन रेट स्टैट्स"]
        },
        "cot": {
            "name": "COT रिपोर्ट",
            "description": "स्मार्ट मनी पोजिशनिंग",
            "details": "देखें कि हेज फंड और कमर्शियल्स क्या कर रहे हैं। बड़े मूव से पहले एक्सट्रीम पोजिशनिंग की पहचान करें।",
            "features": ["पोजीशन विजुअलाइजेशन", "पर्सेंटाइल रैंकिंग", "कॉन्ट्रेरियन सिग्नल"]
        }
    },
    "whyUs": {
        "title": "गंभीर ट्रेडर्स के लिए बनाया गया",
        "description": "एक और जेनेरिक ट्रेडिंग ऐप नहीं। बुलियन ब्रेन विशेष रूप से गोल्ड, सिल्वर और कमोडिटी ट्रेडर्स के लिए डिज़ाइन किया गया है।",
        "saveTime": {
            "title": "रोज़ाना 2+ घंटे बचाएं",
            "description": "अपने प्री-मार्केट एनालिसिस को ऑटोमेट करें। सेकंडों में सभी लेवल और सिग्नल प्राप्त करें।"
        },
        "reduceRisk": {
            "title": "जोखिम कम करें",
            "description": "पूंजी को जोखिम में डालने से पहले स्ट्रैटेजी का बैकटेस्ट करें। सांख्यिकीय रूप से अपना एज जानें।"
        },
        "spotOpportunities": {
            "title": "अवसर पहचानें",
            "description": "गायब होने से पहले आर्बिट्राज विंडो और सीजनल पैटर्न पकड़ें।"
        },
        "tradeWithConfidence": {
            "title": "आत्मविश्वास से ट्रेड करें",
            "description": "जानें कि स्मार्ट मनी क्या कर रही है। अंतर्ज्ञान नहीं, डेटा पर आधारित निर्णय लें।"
        }
    },
    "pricing": {
        "badge": "सरल, पारदर्शी मूल्य निर्धारण",
        "title": "मुफ्त शुरू करें,",
        "titleHighlight": "जब तैयार हों तब अपग्रेड करें",
        "description": "शक्तिशाली मुफ्त टूल्स के साथ शुरू करें। जब जरूरत हो तब उन्नत सुविधाएं अनलॉक करें।",
        "free": {
            "name": "मुफ्त",
            "tagline": "शुरू करने के लिए बिल्कुल सही",
            "price": "₹0",
            "period": "/हमेशा के लिए",
            "cta": "मुफ्त शुरू करें"
        },
        "pro": {
            "name": "प्रो",
            "badge": "सबसे लोकप्रिय",
            "tagline": "गंभीर ट्रेडर्स के लिए",
            "price": "₹999",
            "period": "/महीना",
            "cta": "7-दिन का फ्री ट्रायल शुरू करें"
        },
        "enterprise": {
            "name": "एंटरप्राइज",
            "tagline": "ट्रेडिंग फर्म और टीमों के लिए",
            "price": "कस्टम",
            "cta": "सेल्स से संपर्क करें"
        },
        "guarantee": "30-दिन की मनी-बैक गारंटी • कभी भी रद्द करें • कोई सवाल नहीं"
    },
    "fomo": {
        "title": "हर दिन जब आप डेटा के बिना ट्रेड करते हैं,",
        "titleHighlight": "आप पैसा टेबल पर छोड़ रहे हैं",
        "description": "प्रोफेशनल ट्रेडर्स अनुमान नहीं लगाते। वे COT रिपोर्ट, सीजनल एनालिसिस और कोरिलेशन डेटा का उपयोग करते हैं।",
        "question": "आप कब तक नुकसान में ट्रेड करेंगे?"
    },
    "finalCta": {
        "badge": "7-दिन का फ्री ट्रायल",
        "title": "प्रो की तरह ट्रेड करने के लिए",
        "titleHighlight": "तैयार हैं?",
        "description": "उन ट्रेडर्स से जुड़ें जिन्होंने अनुमान लगाना बंद कर दिया और डेटा का उपयोग शुरू किया।",
        "signupTime": "साइन अप में 30 सेकंड लगते हैं। एक मिनट से कम में एनालिसिस शुरू करें।"
    },
    "footer": {
        "brandDescription": "गोल्ड, सिल्वर और कमोडिटी मार्केट के लिए प्रोफेशनल ट्रेडिंग टूल्स। आत्मविश्वास के साथ डेटा-संचालित निर्णय लें।",
        "analyticsTools": "एनालिटिक्स टूल्स",
        "researchTools": "रिसर्च टूल्स",
        "company": "कंपनी",
        "dashboard": "डैशबोर्ड",
        "aboutUs": "हमारे बारे में",
        "privacyPolicy": "प्राइवेसी पॉलिसी",
        "termsOfService": "सेवा की शर्तें",
        "copyright": "© 2024 बुलियन ब्रेन। सर्वाधिकार सुरक्षित।",
        "tagline": "गंभीर ट्रेडर्स के लिए बनाया गया"
    }
};

hiData.backtest = {
    ...hiData.backtest,
    "pageTitle": "स्ट्रैटेजी बैकटेस्टर",
    "pageSubtitle": "स्ट्रैटेजी वैलिडेशन",
    "period": "अवधि",
    "capital": "पूंजी",
    "runBacktest": "बैकटेस्ट चलाएं",
    "running": "चल रहा है...",
    "guide": {
        "title": "स्ट्रैटेजी बैकटेस्टिंग को समझें",
        "badge": "गाइड",
        "description": "ट्रेडिंग स्ट्रैटेजी बनाना, टेस्ट करना और मूल्यांकन करना सीखें",
        "showGuide": "गाइड दिखाएं",
        "hideGuide": "गाइड छुपाएं"
    },
    "concepts": {
        "entryExitRules": {
            "title": "एंट्री और एग्जिट नियम",
            "description": "ऑटोमेटेड सिग्नल के लिए RSI, EMA, MACD जैसे इंडिकेटर्स का उपयोग करके कंडीशन परिभाषित करें।"
        },
        "winRateReturns": {
            "title": "विन रेट और रिटर्न",
            "description": "परफॉर्मेंस मापने के लिए टोटल रिटर्न, विन रेट और शार्प रेशियो ट्रैक करें।"
        },
        "riskManagement": {
            "title": "जोखिम प्रबंधन",
            "description": "पूंजी की रक्षा और लाभ लॉक करने के लिए स्टॉप-लॉस और टेक-प्रॉफिट लेवल सेट करें।"
        },
        "maxDrawdown": {
            "title": "अधिकतम ड्रॉडाउन",
            "description": "स्ट्रैटेजी जोखिम का आकलन करने के लिए सबसे बड़ी पीक-टू-ट्रफ गिरावट की निगरानी करें।"
        }
    },
    "tabs": {
        "strategy": "स्ट्रैटेजी",
        "results": "परिणाम"
    },
    "strategyBuilder": {
        "title": "अपनी स्ट्रैटेजी बनाएं",
        "description": "टेक्निकल इंडिकेटर्स का उपयोग करके एंट्री और एग्जिट कंडीशन परिभाषित करें",
        "entry": "एंट्री",
        "exit": "एग्जिट",
        "and": "और",
        "or": "या",
        "addCondition": "कंडीशन",
        "addGroup": "ग्रुप"
    },
    "strategyLibrary": {
        "title": "स्ट्रैटेजी लाइब्रेरी",
        "description": "प्रीबिल्ट स्ट्रैटेजी चुनें या अपनी सेव की गई स्ट्रैटेजी लोड करें।",
        "prebuiltStrategies": "प्रीबिल्ट स्ट्रैटेजी",
        "mySaved": "मेरी सेव की गई",
        "save": "सेव करें",
        "load": "लोड करें"
    },
    "results": {
        "priceAction": "प्राइस एक्शन",
        "equityCurve": "इक्विटी कर्व",
        "entry": "एंट्री",
        "exit": "एग्जिट",
        "tradeHistory": {
            "title": "ट्रेड हिस्ट्री",
            "completedTrades": "पूर्ण ट्रेड",
            "entryDate": "एंट्री डेट",
            "entryPrice": "एंट्री प्राइस",
            "exitDate": "एग्जिट डेट",
            "exitPrice": "एग्जिट प्राइस",
            "pnl": "P&L"
        }
    },
    "totalReturn": "कुल रिटर्न",
    "winRate": "विन रेट",
    "totalTrades": "कुल ट्रेड्स",
    "maxDrawdown": "अधिकतम ड्रॉडाउन",
    "sharpeRatio": "शार्प रेशियो",
    "profitFactor": "प्रॉफिट फैक्टर"
};

fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 4));
console.log('hi.json updated successfully!');
