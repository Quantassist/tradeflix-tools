const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../messages/en.json');
const hiPath = path.join(__dirname, '../messages/hi.json');

// Read existing files
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Pivot page translations
const pivotTranslationsEn = {
    "exportTitle": "Export Pivot Levels",
    "exportDescription": "Download or share pivot levels for morning prep",
    "calculateFirstExport": "Calculate pivot levels first to enable export",
    "understandingPivotPoints": "Understanding Pivot Points",
    "guide": "Guide",
    "guideSubtitle": "Learn about CPR, Floor Pivots, and Fibonacci levels for intraday trading",
    "hideGuide": "Hide Guide",
    "showGuide": "Show Guide",
    "cprTitle": "CPR (Central Pivot)",
    "cprDescription": "TC, Pivot, BC - Key zone for intraday trend direction and reversals.",
    "floorPivotsTitle": "Floor Pivots",
    "floorPivotsDescription": "R1-R3 resistance, S1-S3 support - Classic support/resistance levels.",
    "fibonacciTitle": "Fibonacci Levels",
    "fibonacciDescription": "38.2%, 50%, 61.8% - Golden ratio retracement for precision entries.",
    "tradingStrategyTitle": "Trading Strategy",
    "tradingStrategyDescription": "Buy near support, sell near resistance with proper stop losses.",
    "howToUse": "How to Use"
};

const pivotTranslationsHi = {
    "exportTitle": "पिवट लेवल एक्सपोर्ट करें",
    "exportDescription": "सुबह की तैयारी के लिए पिवट लेवल डाउनलोड या शेयर करें",
    "calculateFirstExport": "एक्सपोर्ट सक्षम करने के लिए पहले पिवट लेवल कैलकुलेट करें",
    "understandingPivotPoints": "पिवट पॉइंट्स को समझना",
    "guide": "गाइड",
    "guideSubtitle": "इंट्राडे ट्रेडिंग के लिए CPR, फ्लोर पिवट्स और फिबोनाची लेवल के बारे में जानें",
    "hideGuide": "गाइड छुपाएं",
    "showGuide": "गाइड दिखाएं",
    "cprTitle": "CPR (सेंट्रल पिवट)",
    "cprDescription": "TC, Pivot, BC - इंट्राडे ट्रेंड दिशा और रिवर्सल के लिए मुख्य जोन।",
    "floorPivotsTitle": "फ्लोर पिवट्स",
    "floorPivotsDescription": "R1-R3 रेजिस्टेंस, S1-S3 सपोर्ट - क्लासिक सपोर्ट/रेजिस्टेंस लेवल।",
    "fibonacciTitle": "फिबोनाची लेवल",
    "fibonacciDescription": "38.2%, 50%, 61.8% - सटीक एंट्री के लिए गोल्डन रेशियो रिट्रेसमेंट।",
    "tradingStrategyTitle": "ट्रेडिंग स्ट्रेटेजी",
    "tradingStrategyDescription": "सपोर्ट के पास खरीदें, रेजिस्टेंस के पास बेचें उचित स्टॉप लॉस के साथ।",
    "howToUse": "उपयोग कैसे करें"
};

// MultiTimeframePivots translations
const multiTimeframePivotsEn = {
    "title": "Multi-Timeframe Pivots",
    "description": "Compare pivot levels across daily, weekly, and monthly timeframes",
    "guide": "Guide",
    "guideTitle": "Multi-Timeframe Pivot Guide",
    "guideDescription": "Understanding how to use multiple timeframe analysis",
    "dailyPivots": "Daily Pivots",
    "dailyPivotsDesc": "Best for intraday trading. Levels reset each day based on previous session.",
    "weeklyPivots": "Weekly Pivots",
    "weeklyPivotsDesc": "Medium-term levels. Great for swing trades and identifying major zones.",
    "monthlyPivots": "Monthly Pivots",
    "monthlyPivotsDesc": "Long-term levels. Used for position trading and major support/resistance.",
    "confluenceZones": "Confluence Zones",
    "confluenceZonesDesc": "When levels from multiple timeframes align, they become stronger.",
    "selectSymbol": "Select Symbol",
    "fetchAllTimeframes": "Fetch All Timeframes",
    "currentPrice": "Current Price",
    "bias": "Bias",
    "confluenceZonesDetected": "Confluence Zones Detected",
    "highProbabilityLevels": "High-probability levels where multiple timeframes align",
    "confluence": "Confluence",
    "nearestConfluence": "Nearest Confluence",
    "away": "away",
    "selectSymbolPrompt": "Select a symbol and click \"Fetch All Timeframes\" to view multi-timeframe pivot analysis"
};

const multiTimeframePivotsHi = {
    "title": "मल्टी-टाइमफ्रेम पिवट्स",
    "description": "दैनिक, साप्ताहिक और मासिक टाइमफ्रेम में पिवट लेवल की तुलना करें",
    "guide": "गाइड",
    "guideTitle": "मल्टी-टाइमफ्रेम पिवट गाइड",
    "guideDescription": "मल्टीपल टाइमफ्रेम एनालिसिस का उपयोग कैसे करें",
    "dailyPivots": "दैनिक पिवट्स",
    "dailyPivotsDesc": "इंट्राडे ट्रेडिंग के लिए सर्वश्रेष्ठ। पिछले सेशन के आधार पर हर दिन लेवल रीसेट होते हैं।",
    "weeklyPivots": "साप्ताहिक पिवट्स",
    "weeklyPivotsDesc": "मध्यम अवधि के लेवल। स्विंग ट्रेड और प्रमुख जोन की पहचान के लिए बढ़िया।",
    "monthlyPivots": "मासिक पिवट्स",
    "monthlyPivotsDesc": "दीर्घकालिक लेवल। पोजीशन ट्रेडिंग और प्रमुख सपोर्ट/रेजिस्टेंस के लिए उपयोग।",
    "confluenceZones": "कन्फ्लुएंस जोन",
    "confluenceZonesDesc": "जब कई टाइमफ्रेम के लेवल एक साथ आते हैं, वे मजबूत हो जाते हैं।",
    "selectSymbol": "सिंबल चुनें",
    "fetchAllTimeframes": "सभी टाइमफ्रेम फेच करें",
    "currentPrice": "वर्तमान मूल्य",
    "bias": "बायस",
    "confluenceZonesDetected": "कन्फ्लुएंस जोन पाए गए",
    "highProbabilityLevels": "उच्च-संभावना वाले लेवल जहां कई टाइमफ्रेम मिलते हैं",
    "confluence": "कन्फ्लुएंस",
    "nearestConfluence": "निकटतम कन्फ्लुएंस",
    "away": "दूर",
    "selectSymbolPrompt": "मल्टी-टाइमफ्रेम पिवट एनालिसिस देखने के लिए सिंबल चुनें और \"सभी टाइमफ्रेम फेच करें\" पर क्लिक करें"
};

// DistanceCalculator translations
const distanceCalculatorEn = {
    "title": "Distance Calculator",
    "description": "Distance to key levels",
    "guide": "Guide",
    "guideTitle": "Distance Calculator Guide",
    "guideDescription": "Understanding price distances to pivot levels",
    "nextResistance": "Next Resistance",
    "nextResistanceDesc": "The nearest level above current price. Consider taking profits or placing stop-loss here.",
    "nextSupport": "Next Support",
    "nextSupportDesc": "The nearest level below current price. Consider buying or placing stop-loss here.",
    "nearestLevel": "Nearest Level",
    "nearestLevelDesc": "The closest pivot level to current price. Watch for reactions here.",
    "price": "Price",
    "update": "Update",
    "noResistance": "No resistance above",
    "noSupport": "No support below",
    "distance": "away"
};

const distanceCalculatorHi = {
    "title": "दूरी कैलकुलेटर",
    "description": "मुख्य लेवल से दूरी",
    "guide": "गाइड",
    "guideTitle": "दूरी कैलकुलेटर गाइड",
    "guideDescription": "पिवट लेवल से मूल्य दूरी को समझना",
    "nextResistance": "अगला रेजिस्टेंस",
    "nextResistanceDesc": "वर्तमान मूल्य से ऊपर निकटतम लेवल। यहां प्रॉफिट लेने या स्टॉप-लॉस रखने पर विचार करें।",
    "nextSupport": "अगला सपोर्ट",
    "nextSupportDesc": "वर्तमान मूल्य से नीचे निकटतम लेवल। यहां खरीदने या स्टॉप-लॉस रखने पर विचार करें।",
    "nearestLevel": "निकटतम लेवल",
    "nearestLevelDesc": "वर्तमान मूल्य के सबसे करीब पिवट लेवल। यहां प्रतिक्रियाओं पर नजर रखें।",
    "price": "मूल्य",
    "update": "अपडेट",
    "noResistance": "ऊपर कोई रेजिस्टेंस नहीं",
    "noSupport": "नीचे कोई सपोर्ट नहीं",
    "distance": "दूर"
};

// SignalDetection translations
const signalDetectionEn = {
    "title": "Signal Detection",
    "description": "Trading signals from pivot analysis",
    "guide": "Guide",
    "guideTitle": "Signal Detection Guide",
    "guideDescription": "Understanding trading signals",
    "bullishSignals": "Bullish Signals",
    "bullishSignalsDesc": "Price above CPR or approaching support levels. Consider long positions.",
    "bearishSignals": "Bearish Signals",
    "bearishSignalsDesc": "Price below CPR or approaching resistance levels. Consider short positions.",
    "warningSignals": "Warning Signals",
    "warningSignalsDesc": "Price near key levels or narrow CPR detected. Be cautious and watch for breakouts.",
    "overallBias": "Overall Bias",
    "bias": "BIAS",
    "bullish": "Bullish",
    "bearish": "Bearish",
    "warning": "Warning",
    "neutral": "Neutral",
    "noSignals": "No signals at current price"
};

const signalDetectionHi = {
    "title": "सिग्नल डिटेक्शन",
    "description": "पिवट एनालिसिस से ट्रेडिंग सिग्नल",
    "guide": "गाइड",
    "guideTitle": "सिग्नल डिटेक्शन गाइड",
    "guideDescription": "ट्रेडिंग सिग्नल को समझना",
    "bullishSignals": "बुलिश सिग्नल",
    "bullishSignalsDesc": "मूल्य CPR से ऊपर या सपोर्ट लेवल के पास। लॉन्ग पोजीशन पर विचार करें।",
    "bearishSignals": "बेयरिश सिग्नल",
    "bearishSignalsDesc": "मूल्य CPR से नीचे या रेजिस्टेंस लेवल के पास। शॉर्ट पोजीशन पर विचार करें।",
    "warningSignals": "चेतावनी सिग्नल",
    "warningSignalsDesc": "मूल्य मुख्य लेवल के पास या नैरो CPR पाया गया। सावधान रहें और ब्रेकआउट देखें।",
    "overallBias": "समग्र बायस",
    "bias": "बायस",
    "bullish": "बुलिश",
    "bearish": "बेयरिश",
    "warning": "चेतावनी",
    "neutral": "न्यूट्रल",
    "noSignals": "वर्तमान मूल्य पर कोई सिग्नल नहीं"
};

// HistoricalAccuracy translations
const historicalAccuracyEn = {
    "title": "Historical Accuracy",
    "description": "Track how often pivot levels are respected over time",
    "understandingAccuracy": "Understanding Accuracy",
    "guideTitle": "Historical Accuracy Guide",
    "guideDescription": "Learn how to interpret pivot level performance",
    "whatRespectedMean": "What Does \"Respected\" Mean?",
    "respectedExplanation": "A level is respected when price approaches it and reverses direction within a tolerance (0.3%). This indicates the level acted as support or resistance.",
    "respectedLabel": "Respected = Price reversed",
    "notRespectedLabel": "Not respected = Price broke through",
    "excellent": "Excellent",
    "good": "Good",
    "fair": "Fair",
    "highReliability": "High reliability level",
    "moderateReliability": "Moderate reliability",
    "useWithCaution": "Use with caution",
    "cprWidthCategories": "CPR Width Categories",
    "narrow": "Narrow (<0.3%)",
    "normal": "Normal (0.3-0.7%)",
    "wide": "Wide (>0.7%)",
    "expectTrendingDay": "Expect trending day",
    "balancedDay": "Balanced day",
    "rangeBoundDay": "Range-bound day",
    "exchange": "Exchange",
    "symbol": "Symbol",
    "timeframe": "Timeframe",
    "period": "Period",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "days30": "30 Days",
    "days60": "60 Days",
    "days90": "90 Days",
    "analyze": "Analyze",
    "bestPerformingLevels": "Best Performing Levels",
    "level": "Level",
    "tested": "Tested",
    "respected": "Respected",
    "accuracy": "Accuracy",
    "rating": "Rating",
    "narrowCprDays": "Narrow CPR Days",
    "normalCprDays": "Normal CPR Days",
    "wideCprDays": "Wide CPR Days",
    "trendingAccuracy": "trending accuracy",
    "rangeAccuracy": "range accuracy",
    "selectParametersPrompt": "Select parameters and click \"Analyze\" to view historical accuracy"
};

const historicalAccuracyHi = {
    "title": "ऐतिहासिक सटीकता",
    "description": "समय के साथ पिवट लेवल कितनी बार सम्मानित होते हैं ट्रैक करें",
    "understandingAccuracy": "सटीकता को समझना",
    "guideTitle": "ऐतिहासिक सटीकता गाइड",
    "guideDescription": "पिवट लेवल प्रदर्शन की व्याख्या करना सीखें",
    "whatRespectedMean": "\"सम्मानित\" का क्या मतलब है?",
    "respectedExplanation": "एक लेवल सम्मानित होता है जब मूल्य उसके पास आता है और टॉलरेंस (0.3%) के भीतर दिशा बदलता है। यह इंगित करता है कि लेवल ने सपोर्ट या रेजिस्टेंस के रूप में काम किया।",
    "respectedLabel": "सम्मानित = मूल्य पलटा",
    "notRespectedLabel": "सम्मानित नहीं = मूल्य टूट गया",
    "excellent": "उत्कृष्ट",
    "good": "अच्छा",
    "fair": "ठीक",
    "highReliability": "उच्च विश्वसनीयता स्तर",
    "moderateReliability": "मध्यम विश्वसनीयता",
    "useWithCaution": "सावधानी से उपयोग करें",
    "cprWidthCategories": "CPR चौड़ाई श्रेणियां",
    "narrow": "नैरो (<0.3%)",
    "normal": "नॉर्मल (0.3-0.7%)",
    "wide": "वाइड (>0.7%)",
    "expectTrendingDay": "ट्रेंडिंग दिन की उम्मीद",
    "balancedDay": "संतुलित दिन",
    "rangeBoundDay": "रेंज-बाउंड दिन",
    "exchange": "एक्सचेंज",
    "symbol": "सिंबल",
    "timeframe": "टाइमफ्रेम",
    "period": "अवधि",
    "daily": "दैनिक",
    "weekly": "साप्ताहिक",
    "monthly": "मासिक",
    "days30": "30 दिन",
    "days60": "60 दिन",
    "days90": "90 दिन",
    "analyze": "विश्लेषण",
    "bestPerformingLevels": "सर्वश्रेष्ठ प्रदर्शन करने वाले लेवल",
    "level": "लेवल",
    "tested": "टेस्ट किया",
    "respected": "सम्मानित",
    "accuracy": "सटीकता",
    "rating": "रेटिंग",
    "narrowCprDays": "नैरो CPR दिन",
    "normalCprDays": "नॉर्मल CPR दिन",
    "wideCprDays": "वाइड CPR दिन",
    "trendingAccuracy": "ट्रेंडिंग सटीकता",
    "rangeAccuracy": "रेंज सटीकता",
    "selectParametersPrompt": "ऐतिहासिक सटीकता देखने के लिए पैरामीटर चुनें और \"विश्लेषण\" पर क्लिक करें"
};

// PivotAlerts translations
const alertsEn = {
    "title": "Pivot Alerts",
    "description": "Set alerts for price proximity, breakouts, and rejections",
    "active": "Active",
    "alertGuide": "Alert Guide",
    "guideTitle": "Pivot Alerts Guide",
    "guideDescription": "How to set up and use pivot alerts effectively",
    "priceApproaching": "Price Approaching",
    "priceApproachingDesc": "Get notified when price comes within a threshold of a pivot level. Great for preparing entries.",
    "breakoutAlert": "Breakout Alert",
    "breakoutAlertDesc": "Triggered when price breaks through a level with momentum. Useful for trend-following trades.",
    "rejectionAlert": "Rejection Alert",
    "rejectionAlertDesc": "Triggered when price tests a level and reverses. Perfect for counter-trend or bounce trades.",
    "proTips": "Pro Tips",
    "proTip1": "Set proximity alerts on R1/S1 for high-probability setups",
    "proTip2": "Use breakout alerts on R2/S2 for extended moves",
    "proTip3": "Rejection alerts work best at R3/S3 extremes",
    "calculateFirst": "Calculate pivot levels first to set up alerts",
    "triggered": "Triggered",
    "noAlerts": "No alerts configured",
    "level": "Level",
    "selectLevel": "Select level",
    "alertType": "Alert Type",
    "breakout": "Breakout",
    "rejection": "Rejection",
    "direction": "Direction",
    "both": "Both",
    "fromAbove": "From Above",
    "fromBelow": "From Below",
    "threshold": "Threshold (%)",
    "addAlert": "Add Alert",
    "cancel": "Cancel",
    "addNewAlert": "Add New Alert",
    "note": "Note",
    "alertsNote": "Alerts are stored locally in your browser. For real-time notifications, connect to a WebSocket service or enable browser notifications."
};

const alertsHi = {
    "title": "पिवट अलर्ट",
    "description": "मूल्य निकटता, ब्रेकआउट और रिजेक्शन के लिए अलर्ट सेट करें",
    "active": "सक्रिय",
    "alertGuide": "अलर्ट गाइड",
    "guideTitle": "पिवट अलर्ट गाइड",
    "guideDescription": "पिवट अलर्ट को प्रभावी ढंग से कैसे सेट करें और उपयोग करें",
    "priceApproaching": "मूल्य निकट आ रहा है",
    "priceApproachingDesc": "जब मूल्य पिवट लेवल की थ्रेशोल्ड के भीतर आता है तो सूचित हों। एंट्री तैयार करने के लिए बढ़िया।",
    "breakoutAlert": "ब्रेकआउट अलर्ट",
    "breakoutAlertDesc": "जब मूल्य मोमेंटम के साथ लेवल तोड़ता है तब ट्रिगर होता है। ट्रेंड-फॉलोइंग ट्रेड के लिए उपयोगी।",
    "rejectionAlert": "रिजेक्शन अलर्ट",
    "rejectionAlertDesc": "जब मूल्य लेवल टेस्ट करता है और पलटता है तब ट्रिगर होता है। काउंटर-ट्रेंड या बाउंस ट्रेड के लिए परफेक्ट।",
    "proTips": "प्रो टिप्स",
    "proTip1": "उच्च-संभावना सेटअप के लिए R1/S1 पर प्रॉक्सिमिटी अलर्ट सेट करें",
    "proTip2": "विस्तारित मूव के लिए R2/S2 पर ब्रेकआउट अलर्ट का उपयोग करें",
    "proTip3": "R3/S3 एक्सट्रीम पर रिजेक्शन अलर्ट सबसे अच्छा काम करते हैं",
    "calculateFirst": "अलर्ट सेट करने के लिए पहले पिवट लेवल कैलकुलेट करें",
    "triggered": "ट्रिगर हुआ",
    "noAlerts": "कोई अलर्ट कॉन्फ़िगर नहीं",
    "level": "लेवल",
    "selectLevel": "लेवल चुनें",
    "alertType": "अलर्ट प्रकार",
    "breakout": "ब्रेकआउट",
    "rejection": "रिजेक्शन",
    "direction": "दिशा",
    "both": "दोनों",
    "fromAbove": "ऊपर से",
    "fromBelow": "नीचे से",
    "threshold": "थ्रेशोल्ड (%)",
    "addAlert": "अलर्ट जोड़ें",
    "cancel": "रद्द करें",
    "addNewAlert": "नया अलर्ट जोड़ें",
    "note": "नोट",
    "alertsNote": "अलर्ट आपके ब्राउज़र में स्थानीय रूप से संग्रहीत हैं। रीयल-टाइम नोटिफिकेशन के लिए, WebSocket सेवा से कनेक्ट करें या ब्राउज़र नोटिफिकेशन सक्षम करें।"
};

// IntradayRecalculation translations
const intradayRecalculationEn = {
    "title": "Intraday Recalculation",
    "description": "Recalculate pivots using current session's high/low for dynamic levels",
    "howToUse": "How to Use",
    "guideTitle": "Intraday Recalculation Guide",
    "guideDescription": "Master dynamic pivot levels for real-time trading decisions",
    "whatIsIt": "What is Intraday Recalculation?",
    "whatIsItDesc": "Traditional pivots use yesterday's high/low/close. Intraday recalculation uses today's developing high/low to create dynamic levels that adapt as the session progresses.",
    "whenToUse": "When to Use This Feature",
    "midSession": "Mid-session adjustments",
    "midSessionDesc": "After a significant move breaks original pivots",
    "gapDays": "Gap days",
    "gapDaysDesc": "When market opens far from previous close",
    "highVolatility": "High volatility",
    "highVolatilityDesc": "When original pivots become irrelevant",
    "afternoonTrading": "Afternoon trading",
    "afternoonTradingDesc": "To get fresh levels for the second half",
    "realLifeExample": "Real-Life Trading Example",
    "bullishShift": "Bullish Shift",
    "bullishShiftDesc": "New pivot is higher than original. Market is showing strength - look for long entries at new supports.",
    "bearishShift": "Bearish Shift",
    "bearishShiftDesc": "New pivot is lower than original. Market is showing weakness - look for short entries at new resistances.",
    "calculateFirst": "Calculate original pivots first to enable intraday recalculation",
    "intradayHigh": "Intraday High",
    "intradayLow": "Intraday Low",
    "currentPriceOptional": "Current Price (optional)",
    "recalculate": "Recalculate",
    "reset": "Reset",
    "cprShift": "CPR Shift",
    "marketBiasHas": "Market bias has",
    "recalculatedCpr": "Recalculated CPR",
    "recalculatedFloorPivots": "Recalculated Floor Pivots",
    "note": "Note",
    "intradayNote": "Intraday recalculation uses current session data to provide dynamic pivot levels. These are useful for adjusting your trading plan as the session progresses."
};

const intradayRecalculationHi = {
    "title": "इंट्राडे रीकैलकुलेशन",
    "description": "डायनामिक लेवल के लिए वर्तमान सेशन के हाई/लो का उपयोग करके पिवट्स रीकैलकुलेट करें",
    "howToUse": "उपयोग कैसे करें",
    "guideTitle": "इंट्राडे रीकैलकुलेशन गाइड",
    "guideDescription": "रीयल-टाइम ट्रेडिंग निर्णयों के लिए डायनामिक पिवट लेवल में महारत हासिल करें",
    "whatIsIt": "इंट्राडे रीकैलकुलेशन क्या है?",
    "whatIsItDesc": "पारंपरिक पिवट्स कल के हाई/लो/क्लोज का उपयोग करते हैं। इंट्राडे रीकैलकुलेशन आज के विकसित हो रहे हाई/लो का उपयोग करके डायनामिक लेवल बनाता है जो सेशन के साथ अनुकूलित होते हैं।",
    "whenToUse": "इस फीचर का उपयोग कब करें",
    "midSession": "मिड-सेशन एडजस्टमेंट",
    "midSessionDesc": "जब कोई महत्वपूर्ण मूव मूल पिवट्स को तोड़ता है",
    "gapDays": "गैप दिन",
    "gapDaysDesc": "जब मार्केट पिछले क्लोज से दूर खुलता है",
    "highVolatility": "उच्च वोलैटिलिटी",
    "highVolatilityDesc": "जब मूल पिवट्स अप्रासंगिक हो जाते हैं",
    "afternoonTrading": "दोपहर की ट्रेडिंग",
    "afternoonTradingDesc": "दूसरे हाफ के लिए ताजा लेवल पाने के लिए",
    "realLifeExample": "वास्तविक ट्रेडिंग उदाहरण",
    "bullishShift": "बुलिश शिफ्ट",
    "bullishShiftDesc": "नया पिवट मूल से ऊंचा है। मार्केट ताकत दिखा रहा है - नए सपोर्ट पर लॉन्ग एंट्री देखें।",
    "bearishShift": "बेयरिश शिफ्ट",
    "bearishShiftDesc": "नया पिवट मूल से नीचा है। मार्केट कमजोरी दिखा रहा है - नए रेजिस्टेंस पर शॉर्ट एंट्री देखें।",
    "calculateFirst": "इंट्राडे रीकैलकुलेशन सक्षम करने के लिए पहले मूल पिवट्स कैलकुलेट करें",
    "intradayHigh": "इंट्राडे हाई",
    "intradayLow": "इंट्राडे लो",
    "currentPriceOptional": "वर्तमान मूल्य (वैकल्पिक)",
    "recalculate": "रीकैलकुलेट",
    "reset": "रीसेट",
    "cprShift": "CPR शिफ्ट",
    "marketBiasHas": "मार्केट बायस",
    "recalculatedCpr": "रीकैलकुलेटेड CPR",
    "recalculatedFloorPivots": "रीकैलकुलेटेड फ्लोर पिवट्स",
    "note": "नोट",
    "intradayNote": "इंट्राडे रीकैलकुलेशन डायनामिक पिवट लेवल प्रदान करने के लिए वर्तमान सेशन डेटा का उपयोग करता है। ये सेशन के साथ आपकी ट्रेडिंग योजना को समायोजित करने के लिए उपयोगी हैं।"
};

// Symbols translations
const symbolsEn = {
    "gold": "Gold",
    "silver": "Silver",
    "crudeOil": "Crude Oil",
    "copper": "Copper",
    "naturalGas": "Natural Gas"
};

const symbolsHi = {
    "gold": "सोना",
    "silver": "चांदी",
    "crudeOil": "क्रूड ऑयल",
    "copper": "तांबा",
    "naturalGas": "नेचुरल गैस"
};

// Merge translations
if (!enJson.pivot) enJson.pivot = {};
if (!hiJson.pivot) hiJson.pivot = {};

// Add pivot page translations
Object.assign(enJson.pivot, pivotTranslationsEn);
Object.assign(hiJson.pivot, pivotTranslationsHi);

// Add component translations
enJson.pivot.multiTimeframePivots = multiTimeframePivotsEn;
hiJson.pivot.multiTimeframePivots = multiTimeframePivotsHi;

enJson.pivot.distanceCalculator = distanceCalculatorEn;
hiJson.pivot.distanceCalculator = distanceCalculatorHi;

enJson.pivot.signalDetection = signalDetectionEn;
hiJson.pivot.signalDetection = signalDetectionHi;

enJson.pivot.historicalAccuracy = historicalAccuracyEn;
hiJson.pivot.historicalAccuracy = historicalAccuracyHi;

enJson.pivot.alerts = alertsEn;
hiJson.pivot.alerts = alertsHi;

enJson.pivot.intradayRecalculation = intradayRecalculationEn;
hiJson.pivot.intradayRecalculation = intradayRecalculationHi;

enJson.pivot.symbols = symbolsEn;
hiJson.pivot.symbols = symbolsHi;

// Write files
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2), 'utf8');

console.log('✅ Pivot translations added successfully!');
console.log('Added translations for:');
console.log('  - Pivot page main');
console.log('  - MultiTimeframePivots');
console.log('  - DistanceCalculator');
console.log('  - SignalDetectionPanel');
console.log('  - HistoricalAccuracy');
console.log('  - PivotAlerts');
console.log('  - IntradayRecalculation');
console.log('  - Symbols');
