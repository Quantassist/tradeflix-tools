const fs = require('fs');
const path = require('path');

// Paths to translation files
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

// Read existing translations
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// ============================================
// FIX: Add missing tool features keys
// These were showing as "landing.tools.X.features.Y" but should be "tools.X.features.Y"
// ============================================

// Update English tools with proper features object structure
enJson.tools = {
    ...enJson.tools,
    backtest: {
        ...enJson.tools?.backtest,
        name: "Backtest Engine",
        description: "Strategy Validation",
        details: "Test your Gold & Silver strategies against 10+ years of data. Know your edge before risking real capital.",
        features: {
            simulation: "Historical Simulation",
            metrics: "Performance Metrics",
            drawdown: "Drawdown Analysis"
        }
    },
    pivot: {
        ...enJson.tools?.pivot,
        name: "Pivot Calculator",
        description: "Intraday S/R Levels",
        details: "Generate CPR, Floor, and Fibonacci pivots instantly. Know exactly where price is likely to reverse or break.",
        features: {
            cpr: "Central Pivot Range",
            fibonacci: "Fibonacci Levels",
            multiTimeframe: "Multi-timeframe"
        }
    },
    arbitrage: {
        ...enJson.tools?.arbitrage,
        name: "Arbitrage Heatmap",
        description: "COMEX vs MCX",
        details: "Spot when MCX is overpriced or underpriced vs COMEX. Capture pricing inefficiencies before they disappear.",
        features: {
            fairValue: "Fair Value Calculator",
            alerts: "Premium Alerts",
            historical: "Historical Spreads"
        }
    },
    correlation: {
        ...enJson.tools?.correlation,
        name: "Correlation Matrix",
        description: "Multi-Asset Analysis",
        details: "Understand how Gold moves with USDINR, DXY, and Crude. Find divergence trades and hedge positions.",
        features: {
            realtime: "Cross-Asset Correlations",
            beta: "Beta Sensitivity",
            divergence: "Divergence Alerts"
        }
    },
    seasonal: {
        ...enJson.tools?.seasonal,
        name: "Seasonal Trends",
        description: "Calendar Patterns",
        details: "Know how Gold behaves around Diwali, Akshaya Tritiya, Fed meetings. Trade with historical probabilities on your side.",
        features: {
            festival: "Festival Analysis",
            economic: "Event Tracking",
            winRate: "Win Rate Stats"
        }
    },
    cot: {
        ...enJson.tools?.cot,
        name: "COT Report",
        description: "Smart Money Positioning",
        details: "See what hedge funds and commercials are doing. Identify extreme positioning that precedes major moves.",
        features: {
            position: "Position Visualization",
            percentile: "Percentile Rankings",
            contrarian: "Contrarian Signals"
        }
    }
};

// Update Hindi tools with proper features object structure
hiJson.tools = {
    ...hiJson.tools,
    backtest: {
        ...hiJson.tools?.backtest,
        name: "बैकटेस्ट इंजन",
        description: "स्ट्रैटेजी वैलिडेशन",
        details: "अपनी गोल्ड और सिल्वर ट्रेडिंग स्ट्रैटेजी को 10+ वर्षों के ऐतिहासिक डेटा के खिलाफ टेस्ट करें।",
        features: {
            simulation: "ऐतिहासिक सिमुलेशन",
            metrics: "परफॉर्मेंस मेट्रिक्स",
            drawdown: "ड्रॉडाउन एनालिसिस"
        }
    },
    pivot: {
        ...hiJson.tools?.pivot,
        name: "पिवट कैलकुलेटर",
        description: "इंट्राडे S/R लेवल्स",
        details: "CPR, फ्लोर और फिबोनाची पिवट लेवल तुरंत जनरेट करें।",
        features: {
            cpr: "सेंट्रल पिवट रेंज",
            fibonacci: "फिबोनाची लेवल्स",
            multiTimeframe: "मल्टी-टाइमफ्रेम"
        }
    },
    arbitrage: {
        ...hiJson.tools?.arbitrage,
        name: "आर्बिट्राज हीटमैप",
        description: "COMEX बनाम MCX",
        details: "जानें कब MCX COMEX की तुलना में महंगा या सस्ता है।",
        features: {
            fairValue: "फेयर वैल्यू कैलकुलेटर",
            alerts: "प्रीमियम अलर्ट्स",
            historical: "ऐतिहासिक स्प्रेड्स"
        }
    },
    correlation: {
        ...hiJson.tools?.correlation,
        name: "कोरिलेशन मैट्रिक्स",
        description: "मल्टी-एसेट एनालिसिस",
        details: "समझें कि गोल्ड USDINR, DXY और क्रूड के साथ कैसे मूव करता है।",
        features: {
            realtime: "क्रॉस-एसेट कोरिलेशन",
            beta: "बीटा सेंसिटिविटी",
            divergence: "डाइवर्जेंस अलर्ट्स"
        }
    },
    seasonal: {
        ...hiJson.tools?.seasonal,
        name: "सीजनल ट्रेंड्स",
        description: "कैलेंडर पैटर्न",
        details: "जानें दिवाली, अक्षय तृतीया, फेड मीटिंग के आसपास गोल्ड कैसे व्यवहार करता है।",
        features: {
            festival: "त्योहार विश्लेषण",
            economic: "इवेंट ट्रैकिंग",
            winRate: "विन रेट स्टैट्स"
        }
    },
    cot: {
        ...hiJson.tools?.cot,
        name: "COT रिपोर्ट",
        description: "स्मार्ट मनी पोजिशनिंग",
        details: "देखें कि हेज फंड और कमर्शियल्स क्या कर रहे हैं।",
        features: {
            position: "पोजीशन विजुअलाइजेशन",
            percentile: "पर्सेंटाइल रैंकिंग",
            contrarian: "कॉन्ट्रेरियन सिग्नल्स"
        }
    }
};

// ============================================
// ADD: Pivot page translations
// ============================================

enJson.pivot = {
    ...enJson.pivot,
    // Page header
    title: "Pivot Calculator",
    subtitle: "Professional pivot point analysis for Gold, Silver & Commodities",

    // Guide section
    guide: {
        title: "Understanding Pivot Points",
        badge: "Guide",
        description: "Learn about CPR, Floor Pivots, and Fibonacci levels for intraday trading",
        showGuide: "Show Guide",
        hideGuide: "Hide Guide",
        cpr: {
            title: "CPR (Central Pivot)",
            description: "TC, Pivot, BC - Key zone for intraday trend direction and reversals."
        },
        floorPivots: {
            title: "Floor Pivots",
            description: "R1-R3 resistance, S1-S3 support - Classic support/resistance levels."
        },
        fibonacci: {
            title: "Fibonacci Levels",
            description: "38.2%, 50%, 61.8% - Golden ratio retracement for precision entries."
        },
        tradingStrategy: {
            title: "Trading Strategy",
            description: "Buy near support, sell near resistance with proper stop losses."
        }
    },

    // Input form
    inputForm: {
        title: "Calculate Pivots",
        description: "Enter OHLC data or fetch from API",
        symbol: "Symbol",
        exchange: "Exchange",
        high: "High",
        low: "Low",
        close: "Close",
        fetchData: "Fetch Data",
        calculate: "Calculate",
        calculating: "Calculating...",
        fetching: "Fetching..."
    },

    // Multi-timeframe pivots
    multiTimeframe: {
        title: "Multi-Timeframe Pivots",
        description: "Daily, Weekly & Monthly with Confluence Detection",
        learnHow: "Learn How It Works",
        guideTitle: "Multi-Timeframe Pivot Guide",
        guideDescription: "Master confluence trading with pivot levels",
        daily: "Daily",
        dailyDesc: "Intraday levels, recalculated each day",
        weekly: "Weekly",
        weeklyDesc: "Swing trading levels, updated weekly",
        monthly: "Monthly",
        monthlyDesc: "Major levels, highest significance",
        levelAbbreviations: "Level Abbreviations",
        dailySupport1: "Daily Support 1",
        dailyResistance2: "Daily Resistance 2",
        weeklyCprTc: "Weekly CPR Top Central",
        monthlyFib618: "Monthly Fib 61.8%",
        whatIsConfluence: "What is Confluence?",
        confluenceExplanation: "When pivot levels from different timeframes align within a small range, they create a confluence zone - a high-probability support/resistance area.",
        moderate: "Moderate",
        strong: "Strong",
        veryStrong: "Very Strong",
        fetchAllTimeframes: "Fetch All Timeframes",
        currentPrice: "Current Price",
        bias: "BIAS",
        confluenceZonesDetected: "Confluence Zones Detected",
        highProbabilityLevels: "High-probability levels where multiple timeframes align",
        confluence: "Confluence",
        nearestConfluence: "Nearest Confluence",
        away: "away",
        selectSymbolPrompt: "Select a symbol and click \"Fetch All Timeframes\" to view multi-timeframe pivot analysis"
    },

    // Distance calculator
    distanceCalculator: {
        title: "Distance Calculator",
        description: "Distance to key levels",
        guide: "Guide",
        guideTitle: "Distance Calculator Guide",
        guideDescription: "Understanding price distances to pivot levels",
        nextResistance: "Next Resistance",
        nextResistanceDesc: "The nearest level above current price. Consider taking profits or placing stop-loss here.",
        nextSupport: "Next Support",
        nextSupportDesc: "The nearest level below current price. Consider buying or placing stop-loss here.",
        nearestLevel: "Nearest Level",
        nearestLevelDesc: "The closest pivot level to current price. Watch for reactions here.",
        price: "Price",
        update: "Update",
        noResistance: "No resistance above",
        noSupport: "No support below",
        allLevels: "All Levels",
        distance: "Distance"
    },

    // Signal detection
    signalDetection: {
        title: "Signal Detection",
        description: "Real-time trading signals",
        guide: "Guide",
        guideTitle: "Signal Detection Guide",
        guideDescription: "Understanding pivot-based trading signals",
        bullishSignal: "Bullish Signal",
        bullishDesc: "Price is showing strength above key levels",
        bearishSignal: "Bearish Signal",
        bearishDesc: "Price is showing weakness below key levels",
        neutralSignal: "Neutral Signal",
        neutralDesc: "Price is consolidating between levels",
        noSignals: "No signals detected",
        currentBias: "Current Bias",
        signalStrength: "Signal Strength",
        pricePosition: "Price Position"
    },

    // Historical accuracy
    historicalAccuracy: {
        title: "Historical Accuracy",
        description: "Pivot level performance analysis",
        guide: "Guide",
        guideTitle: "Historical Accuracy Guide",
        guideDescription: "Understanding pivot accuracy metrics",
        fetchAccuracy: "Fetch Accuracy",
        timeframe: "Timeframe",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        touchRate: "Touch Rate",
        bounceRate: "Bounce Rate",
        breakRate: "Break Rate",
        avgDistance: "Avg Distance",
        noData: "No historical data available"
    },

    // Pivot alerts
    pivotAlerts: {
        title: "Pivot Alerts",
        description: "Set price alerts for key levels",
        guide: "Guide",
        guideTitle: "Pivot Alerts Guide",
        guideDescription: "Get notified when price approaches key levels",
        addAlert: "Add Alert",
        level: "Level",
        condition: "Condition",
        above: "Above",
        below: "Below",
        crosses: "Crosses",
        active: "Active",
        triggered: "Triggered",
        noAlerts: "No alerts set",
        deleteAlert: "Delete Alert",
        alertTriggered: "Alert Triggered"
    },

    // Intraday recalculation
    intradayRecalc: {
        title: "Intraday Recalculation",
        description: "Recalculate pivots with live data",
        guide: "Guide",
        guideTitle: "Intraday Recalculation Guide",
        guideDescription: "Update pivot levels as the day progresses",
        intradayHigh: "Intraday High",
        intradayLow: "Intraday Low",
        recalculate: "Recalculate",
        originalPivots: "Original Pivots",
        updatedPivots: "Updated Pivots",
        change: "Change"
    },

    // Pivot levels chart
    pivotChart: {
        title: "Pivot Levels Chart",
        description: "Visual representation of pivot levels",
        resistance: "Resistance",
        support: "Support",
        pivot: "Pivot",
        currentPrice: "Current Price"
    },

    // Common
    symbols: {
        gold: "Gold",
        silver: "Silver",
        crudeOil: "Crude Oil",
        copper: "Copper",
        naturalGas: "Natural Gas"
    },
    exchanges: {
        comex: "COMEX",
        mcx: "MCX"
    },

    // Toast messages
    toast: {
        fetchSuccess: "Fetched pivot data successfully",
        fetchError: "Failed to fetch pivot data",
        calculateSuccess: "Pivots calculated successfully",
        calculateError: "Failed to calculate pivots",
        alertAdded: "Alert added successfully",
        alertDeleted: "Alert deleted"
    }
};

// Hindi pivot translations
hiJson.pivot = {
    ...hiJson.pivot,
    title: "पिवट कैलकुलेटर",
    subtitle: "गोल्ड, सिल्वर और कमोडिटीज के लिए प्रोफेशनल पिवट पॉइंट एनालिसिस",

    guide: {
        title: "पिवट पॉइंट्स को समझें",
        badge: "गाइड",
        description: "इंट्राडे ट्रेडिंग के लिए CPR, फ्लोर पिवट्स और फिबोनाची लेवल्स के बारे में जानें",
        showGuide: "गाइड दिखाएं",
        hideGuide: "गाइड छुपाएं",
        cpr: {
            title: "CPR (सेंट्रल पिवट)",
            description: "TC, पिवट, BC - इंट्राडे ट्रेंड दिशा और रिवर्सल के लिए मुख्य जोन।"
        },
        floorPivots: {
            title: "फ्लोर पिवट्स",
            description: "R1-R3 रेजिस्टेंस, S1-S3 सपोर्ट - क्लासिक सपोर्ट/रेजिस्टेंस लेवल्स।"
        },
        fibonacci: {
            title: "फिबोनाची लेवल्स",
            description: "38.2%, 50%, 61.8% - प्रिसीजन एंट्री के लिए गोल्डन रेशियो रिट्रेसमेंट।"
        },
        tradingStrategy: {
            title: "ट्रेडिंग स्ट्रैटेजी",
            description: "सपोर्ट के पास खरीदें, रेजिस्टेंस के पास बेचें, उचित स्टॉप लॉस के साथ।"
        }
    },

    inputForm: {
        title: "पिवट्स कैलकुलेट करें",
        description: "OHLC डेटा दर्ज करें या API से फेच करें",
        symbol: "सिंबल",
        exchange: "एक्सचेंज",
        high: "हाई",
        low: "लो",
        close: "क्लोज",
        fetchData: "डेटा फेच करें",
        calculate: "कैलकुलेट करें",
        calculating: "कैलकुलेट हो रहा है...",
        fetching: "फेच हो रहा है..."
    },

    multiTimeframe: {
        title: "मल्टी-टाइमफ्रेम पिवट्स",
        description: "डेली, वीकली और मंथली कॉन्फ्लुएंस डिटेक्शन के साथ",
        learnHow: "जानें कैसे काम करता है",
        guideTitle: "मल्टी-टाइमफ्रेम पिवट गाइड",
        guideDescription: "पिवट लेवल्स के साथ कॉन्फ्लुएंस ट्रेडिंग में महारत हासिल करें",
        daily: "डेली",
        dailyDesc: "इंट्राडे लेवल्स, हर दिन रीकैलकुलेट होते हैं",
        weekly: "वीकली",
        weeklyDesc: "स्विंग ट्रेडिंग लेवल्स, साप्ताहिक अपडेट",
        monthly: "मंथली",
        monthlyDesc: "मेजर लेवल्स, सबसे अधिक महत्व",
        levelAbbreviations: "लेवल संक्षिप्त नाम",
        dailySupport1: "डेली सपोर्ट 1",
        dailyResistance2: "डेली रेजिस्टेंस 2",
        weeklyCprTc: "वीकली CPR टॉप सेंट्रल",
        monthlyFib618: "मंथली फिब 61.8%",
        whatIsConfluence: "कॉन्फ्लुएंस क्या है?",
        confluenceExplanation: "जब विभिन्न टाइमफ्रेम के पिवट लेवल्स एक छोटी रेंज में संरेखित होते हैं, तो वे एक कॉन्फ्लुएंस जोन बनाते हैं - एक हाई-प्रोबेबिलिटी सपोर्ट/रेजिस्टेंस एरिया।",
        moderate: "मध्यम",
        strong: "मजबूत",
        veryStrong: "बहुत मजबूत",
        fetchAllTimeframes: "सभी टाइमफ्रेम फेच करें",
        currentPrice: "वर्तमान मूल्य",
        bias: "बायस",
        confluenceZonesDetected: "कॉन्फ्लुएंस जोन पाए गए",
        highProbabilityLevels: "हाई-प्रोबेबिलिटी लेवल्स जहां मल्टीपल टाइमफ्रेम संरेखित हैं",
        confluence: "कॉन्फ्लुएंस",
        nearestConfluence: "निकटतम कॉन्फ्लुएंस",
        away: "दूर",
        selectSymbolPrompt: "मल्टी-टाइमफ्रेम पिवट एनालिसिस देखने के लिए सिंबल चुनें और \"सभी टाइमफ्रेम फेच करें\" पर क्लिक करें"
    },

    distanceCalculator: {
        title: "दूरी कैलकुलेटर",
        description: "मुख्य लेवल्स से दूरी",
        guide: "गाइड",
        guideTitle: "दूरी कैलकुलेटर गाइड",
        guideDescription: "पिवट लेवल्स से प्राइस दूरी को समझें",
        nextResistance: "अगला रेजिस्टेंस",
        nextResistanceDesc: "वर्तमान मूल्य से ऊपर निकटतम लेवल। यहां प्रॉफिट लेने या स्टॉप-लॉस लगाने पर विचार करें।",
        nextSupport: "अगला सपोर्ट",
        nextSupportDesc: "वर्तमान मूल्य से नीचे निकटतम लेवल। यहां खरीदने या स्टॉप-लॉस लगाने पर विचार करें।",
        nearestLevel: "निकटतम लेवल",
        nearestLevelDesc: "वर्तमान मूल्य के सबसे करीब पिवट लेवल। यहां प्रतिक्रियाओं पर नजर रखें।",
        price: "मूल्य",
        update: "अपडेट",
        noResistance: "ऊपर कोई रेजिस्टेंस नहीं",
        noSupport: "नीचे कोई सपोर्ट नहीं",
        allLevels: "सभी लेवल्स",
        distance: "दूरी"
    },

    signalDetection: {
        title: "सिग्नल डिटेक्शन",
        description: "रियल-टाइम ट्रेडिंग सिग्नल्स",
        guide: "गाइड",
        guideTitle: "सिग्नल डिटेक्शन गाइड",
        guideDescription: "पिवट-आधारित ट्रेडिंग सिग्नल्स को समझें",
        bullishSignal: "बुलिश सिग्नल",
        bullishDesc: "प्राइस मुख्य लेवल्स के ऊपर मजबूती दिखा रहा है",
        bearishSignal: "बेयरिश सिग्नल",
        bearishDesc: "प्राइस मुख्य लेवल्स के नीचे कमजोरी दिखा रहा है",
        neutralSignal: "न्यूट्रल सिग्नल",
        neutralDesc: "प्राइस लेवल्स के बीच कंसोलिडेट हो रहा है",
        noSignals: "कोई सिग्नल नहीं मिला",
        currentBias: "वर्तमान बायस",
        signalStrength: "सिग्नल स्ट्रेंथ",
        pricePosition: "प्राइस पोजीशन"
    },

    historicalAccuracy: {
        title: "ऐतिहासिक सटीकता",
        description: "पिवट लेवल परफॉर्मेंस एनालिसिस",
        guide: "गाइड",
        guideTitle: "ऐतिहासिक सटीकता गाइड",
        guideDescription: "पिवट सटीकता मेट्रिक्स को समझें",
        fetchAccuracy: "सटीकता फेच करें",
        timeframe: "टाइमफ्रेम",
        daily: "डेली",
        weekly: "वीकली",
        monthly: "मंथली",
        touchRate: "टच रेट",
        bounceRate: "बाउंस रेट",
        breakRate: "ब्रेक रेट",
        avgDistance: "औसत दूरी",
        noData: "कोई ऐतिहासिक डेटा उपलब्ध नहीं"
    },

    pivotAlerts: {
        title: "पिवट अलर्ट्स",
        description: "मुख्य लेवल्स के लिए प्राइस अलर्ट सेट करें",
        guide: "गाइड",
        guideTitle: "पिवट अलर्ट्स गाइड",
        guideDescription: "जब प्राइस मुख्य लेवल्स के पास पहुंचे तो नोटिफिकेशन पाएं",
        addAlert: "अलर्ट जोड़ें",
        level: "लेवल",
        condition: "कंडीशन",
        above: "ऊपर",
        below: "नीचे",
        crosses: "क्रॉस करे",
        active: "एक्टिव",
        triggered: "ट्रिगर हुआ",
        noAlerts: "कोई अलर्ट सेट नहीं",
        deleteAlert: "अलर्ट डिलीट करें",
        alertTriggered: "अलर्ट ट्रिगर हुआ"
    },

    intradayRecalc: {
        title: "इंट्राडे रीकैलकुलेशन",
        description: "लाइव डेटा के साथ पिवट्स रीकैलकुलेट करें",
        guide: "गाइड",
        guideTitle: "इंट्राडे रीकैलकुलेशन गाइड",
        guideDescription: "दिन बढ़ने के साथ पिवट लेवल्स अपडेट करें",
        intradayHigh: "इंट्राडे हाई",
        intradayLow: "इंट्राडे लो",
        recalculate: "रीकैलकुलेट",
        originalPivots: "ओरिजिनल पिवट्स",
        updatedPivots: "अपडेटेड पिवट्स",
        change: "बदलाव"
    },

    pivotChart: {
        title: "पिवट लेवल्स चार्ट",
        description: "पिवट लेवल्स का विजुअल प्रतिनिधित्व",
        resistance: "रेजिस्टेंस",
        support: "सपोर्ट",
        pivot: "पिवट",
        currentPrice: "वर्तमान मूल्य"
    },

    symbols: {
        gold: "गोल्ड",
        silver: "सिल्वर",
        crudeOil: "क्रूड ऑयल",
        copper: "कॉपर",
        naturalGas: "नेचुरल गैस"
    },
    exchanges: {
        comex: "COMEX",
        mcx: "MCX"
    },

    toast: {
        fetchSuccess: "पिवट डेटा सफलतापूर्वक फेच हुआ",
        fetchError: "पिवट डेटा फेच करने में विफल",
        calculateSuccess: "पिवट्स सफलतापूर्वक कैलकुलेट हुए",
        calculateError: "पिवट्स कैलकुलेट करने में विफल",
        alertAdded: "अलर्ट सफलतापूर्वक जोड़ा गया",
        alertDeleted: "अलर्ट डिलीट हुआ"
    }
};

// ============================================
// FIX: toolsSection.freePlanText key
// ============================================
if (enJson.toolsSection) {
    enJson.toolsSection.freePlanText = enJson.toolsSection.freePlanText || "Start with our free plan — no credit card required";
}
if (hiJson.toolsSection) {
    hiJson.toolsSection.freePlanText = hiJson.toolsSection.freePlanText || "हमारे फ्री प्लान से शुरू करें — क्रेडिट कार्ड की आवश्यकता नहीं";
}

// Write updated translations
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 4), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 4), 'utf8');

console.log('✅ Translation files updated successfully!');
console.log('   - Added tools.*.features.* keys (object format)');
console.log('   - Added pivot.* keys for pivot page components');
console.log('   - Fixed toolsSection.freePlanText key');
