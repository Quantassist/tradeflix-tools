const fs = require('fs');
const path = require('path');

// Paths to translation files
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

// Read existing translations
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// COT translations
const cotTranslations = {
    en: {
        // Page header
        pageTitle: "COT Report Analysis",
        pageSubtitle: "Disaggregated Commitment of Traders",
        headerDescription: "Analyze institutional positioning across Producer/Merchant, Swap Dealers, Managed Money, and Other Reportables",

        // Guide section
        understandingCOT: "Understanding Disaggregated COT Reports",
        guide: "Guide",
        learnCOT: "Learn about the four trader categories and how to interpret their positions",
        showGuide: "Show Guide",
        hideGuide: "Hide Guide",

        // Trader categories
        producerMerchant: "Producer/Merchant",
        producerMerchantDesc: "Commercial hedgers (miners, refiners). Contrarian indicator - extreme shorts often mark tops.",
        swapDealers: "Swap Dealers",
        swapDealersDesc: "Banks facilitating OTC derivatives. Often neutral, hedging client exposures.",
        managedMoney: "Managed Money",
        managedMoneyDesc: "Hedge funds and CTAs. Trend followers - extreme longs often signal overcrowding.",
        otherReportables: "Other Reportables",
        otherReportablesDesc: "Remaining large traders including proprietary traders and family offices.",

        // Input section
        analysisParameters: "Analysis Parameters",
        configureAnalysis: "Configure your COT analysis",
        commodity: "Commodity",
        selectCommodity: "Select commodity",
        lookbackPeriod: "Lookback Period",
        selectPeriod: "Select period",
        periodAffects: "Affects percentile rankings, sentiment analysis, and charts.",
        months3: "3 Months (13 weeks)",
        months6: "6 Months (26 weeks)",
        year1: "1 Year (52 weeks)",
        years2: "2 Years (104 weeks)",
        years3: "3 Years (156 weeks)",
        years5: "5 Years (260 weeks)",
        analyzing: "Analyzing...",
        analyzeCOT: "Analyze COT Data",

        // Trading signal
        tradingSignal: "Trading Signal",
        runAnalysisSignals: "Run analysis to see signals",
        selectParamsAnalyze: "Select parameters and analyze to see trading signals",
        chooseParams: "Choose a commodity and lookback period, then click Analyze",
        percentile: "Percentile",
        contracts: "Contracts",

        // Tabs
        positions: "Positions",
        sentiment: "Sentiment",
        charts: "Charts",
        analysis: "Analysis",
        advanced: "Advanced",
        alerts: "Alerts",

        // Positions tab
        reportDate: "Report date:",
        keyMetrics: "Key Metrics",
        speculators: "Speculators",
        commercials: "Commercials",
        openInterest: "Open Interest",
        totalContracts: "Total Contracts",
        weeklyChangeOI: "Weekly Δ OI",
        change: "Change",
        netPosition: "Net Position",
        keyMarketParticipants: "Key Market Participants",
        hedgeFundsSpeculators: "Hedge funds & large speculators",
        keyIndicator: "Key Indicator",
        long: "Long",
        short: "Short",
        net: "Net",
        weeklyChange: "Weekly Change",
        producersMerchantsHedgers: "Producers, merchants & hedgers",
        smartMoney: "Smart Money",
        otherMarketParticipants: "Other Market Participants",
        banksInstitutions: "Banks & institutions",

        // Sentiment tab
        marketSentiment: "Market Sentiment",
        basedOnWeeks: "Based on {weeks} weeks of historical data",
        percentileRank: "Percentile Rank",
        bearish: "Bearish",
        neutral: "Neutral",
        bullish: "Bullish",
        fourWeekChange: "4-Week Δ",
        streak: "Streak",
        contrarianAlert: "Contrarian Alert:",
        extremePositioning: "Extreme positioning often precedes reversals.",
        priceBullish: "Price Bullish",
        priceBearish: "Price Bearish",
        producersHedgers: "Producers & hedgers (Smart Money)",
        smartMoneyTip: "Smart Money Tip:",
        commercialsContrarian: "Commercials are contrarian - their extreme shorts can signal price tops.",

        // Charts tab
        historicalCharts: "Historical Charts",
        weeksOfData: "{weeks} weeks of positioning data",
        netPositionComparison: "Net Position Comparison",
        trackDivergence: "Track divergence between key market participants",
        divergence: "Divergence",
        divergenceDesc: "Opposite moves → Reversal signal",
        convergence: "Convergence",
        convergenceDesc: "All aligning → Trend confirmation",
        crossover: "Crossover",
        crossoverDesc: "MM crosses Comm → Trend change",
        longVsShort: "Long vs Short Positions",
        positionBreakdown: "Position breakdown for key market participants",
        openInterestAnalysis: "Open Interest Analysis",
        oiVsMM: "OI vs Managed Money positioning",
        howToReadOI: "How to Read Open Interest",
        oiBullish: "OI ↑ + Price ↑ = New longs (bullish)",
        oiShortCovering: "OI ↓ + Price ↑ = Short covering",
        oiBearish: "OI ↑ + Price ↓ = New shorts (bearish)",
        oiLongLiquidation: "OI ↓ + Price ↓ = Long liquidation",
        runAnalysisCharts: "Run analysis to see charts",

        // Analysis tab
        deepAnalysis: "Deep Analysis",
        cotIndexOISignals: "COT Index, Open Interest signals, and historical patterns",
        mmCOTIndex: "MM COT Index",
        commCOTIndex: "Comm COT Index",
        extremeBullish: "Extreme Bullish",
        extremeBearish: "Extreme Bearish",
        neutralZone: "Neutral Zone",
        oiSignal: "OI Signal",
        bullishTrend: "Bullish Trend",
        newLongsEntering: "New longs entering",
        bearishTrend: "Bearish Trend",
        newShortsEntering: "New shorts entering",
        shortCovering: "Short Covering",
        rallyMayNotSustain: "Rally may not sustain",
        longLiquidation: "Long Liquidation",
        bearishButExhausting: "Bearish but exhausting",
        nextReport: "Next Report",
        today: "Today!",
        tomorrow: "Tomorrow",
        days: "days",
        fridayET: "Friday 3:30 PM ET",
        cotIndex: "COT Index",
        normalizedPositioning: "Normalized positioning (0-100)",
        sellZone: "Sell Zone",
        buyZone: "Buy Zone",
        buyZoneRange: "← Buy Zone (0-20)",
        sellZoneRange: "Sell Zone (80-100) →",

        // Advanced tab
        advancedAnalytics: "Advanced Analytics",
        squeezeRiskFlows: "Squeeze risk, flow decomposition, and ML regime analysis",
        loadingAdvanced: "Loading Advanced Analytics",
        analyzingSqueezeRisk: "Analyzing squeeze risk, flows & ML regimes...",
        crowding: "Crowding",
        highRisk: "High Risk",
        moderate: "Moderate",
        lowRisk: "Low Risk",
        squeezeRisk: "Squeeze Risk",
        vulnerable: "Vulnerable",
        stable: "Stable",
        flowMomentum: "Flow Momentum",
        strong: "Strong",
        weak: "Weak",
        regime: "Regime",
        confidence: "Confidence",
        activeAlerts: "Active Alerts",
        primaryInsight: "Primary Insight",
        suggestedAction: "Suggested Action",

        // Alerts tab
        positionAlerts: "Position Alerts",
        extremePositioningSignals: "Extreme positioning and contrarian signals",
        category: "Category",
        historicalContext: "Historical Context",
        deviation: "Deviation",
        noAlertsTitle: "No extreme positioning alerts at this time",
        noAlertsDesc: "All trader categories are within normal ranges",
        configuredAlertTypes: "Configured Alert Types",
        alertsWillTrigger: "These alerts will trigger when conditions are met",
        extremeLongPositioning: "Extreme Long Positioning",
        extremeLongDesc: "Triggers when any category exceeds 90th percentile net long",
        extremeShortPositioning: "Extreme Short Positioning",
        extremeShortDesc: "Triggers when any category falls below 10th percentile",
        squeezeRiskAlert: "Squeeze Risk Alert",
        squeezeRiskAlertDesc: "Triggers when squeeze risk score exceeds 70",
        smartMoneyDivergence: "Smart Money Divergence",
        smartMoneyDivergenceDesc: "Triggers when Commercials and Managed Money show extreme divergence",
        overcrowdingWarning: "Overcrowding Warning",
        overcrowdingWarningDesc: "Triggers when Managed Money + Small Traders both at extremes",
        significantWeeklyChange: "Significant Weekly Change",
        significantWeeklyChangeDesc: "Triggers when weekly change exceeds 2 standard deviations"
    },
    hi: {
        // Page header
        pageTitle: "COT रिपोर्ट विश्लेषण",
        pageSubtitle: "विघटित ट्रेडर्स की प्रतिबद्धता",
        headerDescription: "प्रोड्यूसर/मर्चेंट, स्वैप डीलर्स, मैनेज्ड मनी और अन्य रिपोर्टेबल्स में संस्थागत पोजिशनिंग का विश्लेषण करें",

        // Guide section
        understandingCOT: "विघटित COT रिपोर्ट को समझना",
        guide: "गाइड",
        learnCOT: "चार ट्रेडर श्रेणियों और उनकी पोजीशन की व्याख्या करना सीखें",
        showGuide: "गाइड दिखाएं",
        hideGuide: "गाइड छुपाएं",

        // Trader categories
        producerMerchant: "प्रोड्यूसर/मर्चेंट",
        producerMerchantDesc: "कमर्शियल हेजर्स (माइनर्स, रिफाइनर्स)। कॉन्ट्रेरियन इंडिकेटर - एक्सट्रीम शॉर्ट्स अक्सर टॉप्स मार्क करते हैं।",
        swapDealers: "स्वैप डीलर्स",
        swapDealersDesc: "OTC डेरिवेटिव्स की सुविधा देने वाले बैंक। अक्सर न्यूट्रल, क्लाइंट एक्सपोजर हेज करते हैं।",
        managedMoney: "मैनेज्ड मनी",
        managedMoneyDesc: "हेज फंड्स और CTAs। ट्रेंड फॉलोअर्स - एक्सट्रीम लॉन्ग्स अक्सर ओवरक्राउडिंग सिग्नल करते हैं।",
        otherReportables: "अन्य रिपोर्टेबल्स",
        otherReportablesDesc: "प्रोप्राइटरी ट्रेडर्स और फैमिली ऑफिस सहित शेष बड़े ट्रेडर्स।",

        // Input section
        analysisParameters: "विश्लेषण पैरामीटर",
        configureAnalysis: "अपना COT विश्लेषण कॉन्फ़िगर करें",
        commodity: "कमोडिटी",
        selectCommodity: "कमोडिटी चुनें",
        lookbackPeriod: "लुकबैक अवधि",
        selectPeriod: "अवधि चुनें",
        periodAffects: "पर्सेंटाइल रैंकिंग, सेंटीमेंट विश्लेषण और चार्ट्स को प्रभावित करता है।",
        months3: "3 महीने (13 सप्ताह)",
        months6: "6 महीने (26 सप्ताह)",
        year1: "1 वर्ष (52 सप्ताह)",
        years2: "2 वर्ष (104 सप्ताह)",
        years3: "3 वर्ष (156 सप्ताह)",
        years5: "5 वर्ष (260 सप्ताह)",
        analyzing: "विश्लेषण कर रहे हैं...",
        analyzeCOT: "COT डेटा विश्लेषण करें",

        // Trading signal
        tradingSignal: "ट्रेडिंग सिग्नल",
        runAnalysisSignals: "सिग्नल देखने के लिए विश्लेषण चलाएं",
        selectParamsAnalyze: "ट्रेडिंग सिग्नल देखने के लिए पैरामीटर चुनें और विश्लेषण करें",
        chooseParams: "कमोडिटी और लुकबैक अवधि चुनें, फिर विश्लेषण पर क्लिक करें",
        percentile: "पर्सेंटाइल",
        contracts: "कॉन्ट्रैक्ट्स",

        // Tabs
        positions: "पोजीशन",
        sentiment: "सेंटीमेंट",
        charts: "चार्ट्स",
        analysis: "विश्लेषण",
        advanced: "एडवांस्ड",
        alerts: "अलर्ट्स",

        // Positions tab
        reportDate: "रिपोर्ट तारीख:",
        keyMetrics: "मुख्य मेट्रिक्स",
        speculators: "स्पेक्युलेटर्स",
        commercials: "कमर्शियल्स",
        openInterest: "ओपन इंटरेस्ट",
        totalContracts: "कुल कॉन्ट्रैक्ट्स",
        weeklyChangeOI: "साप्ताहिक Δ OI",
        change: "बदलाव",
        netPosition: "नेट पोजीशन",
        keyMarketParticipants: "मुख्य बाजार प्रतिभागी",
        hedgeFundsSpeculators: "हेज फंड्स और बड़े स्पेक्युलेटर्स",
        keyIndicator: "मुख्य संकेतक",
        long: "लॉन्ग",
        short: "शॉर्ट",
        net: "नेट",
        weeklyChange: "साप्ताहिक बदलाव",
        producersMerchantsHedgers: "प्रोड्यूसर्स, मर्चेंट्स और हेजर्स",
        smartMoney: "स्मार्ट मनी",
        otherMarketParticipants: "अन्य बाजार प्रतिभागी",
        banksInstitutions: "बैंक और संस्थान",

        // Sentiment tab
        marketSentiment: "बाजार सेंटीमेंट",
        basedOnWeeks: "{weeks} सप्ताह के ऐतिहासिक डेटा पर आधारित",
        percentileRank: "पर्सेंटाइल रैंक",
        bearish: "बेयरिश",
        neutral: "न्यूट्रल",
        bullish: "बुलिश",
        fourWeekChange: "4-सप्ताह Δ",
        streak: "स्ट्रीक",
        contrarianAlert: "कॉन्ट्रेरियन अलर्ट:",
        extremePositioning: "एक्सट्रीम पोजिशनिंग अक्सर रिवर्सल से पहले होती है।",
        priceBullish: "प्राइस बुलिश",
        priceBearish: "प्राइस बेयरिश",
        producersHedgers: "प्रोड्यूसर्स और हेजर्स (स्मार्ट मनी)",
        smartMoneyTip: "स्मार्ट मनी टिप:",
        commercialsContrarian: "कमर्शियल्स कॉन्ट्रेरियन हैं - उनके एक्सट्रीम शॉर्ट्स प्राइस टॉप्स सिग्नल कर सकते हैं।",

        // Charts tab
        historicalCharts: "ऐतिहासिक चार्ट्स",
        weeksOfData: "{weeks} सप्ताह का पोजिशनिंग डेटा",
        netPositionComparison: "नेट पोजीशन तुलना",
        trackDivergence: "मुख्य बाजार प्रतिभागियों के बीच डाइवर्जेंस ट्रैक करें",
        divergence: "डाइवर्जेंस",
        divergenceDesc: "विपरीत मूव्स → रिवर्सल सिग्नल",
        convergence: "कन्वर्जेंस",
        convergenceDesc: "सभी एलाइन हो रहे हैं → ट्रेंड कन्फर्मेशन",
        crossover: "क्रॉसओवर",
        crossoverDesc: "MM कमर्शियल्स को क्रॉस करता है → ट्रेंड चेंज",
        longVsShort: "लॉन्ग बनाम शॉर्ट पोजीशन",
        positionBreakdown: "मुख्य बाजार प्रतिभागियों के लिए पोजीशन ब्रेकडाउन",
        openInterestAnalysis: "ओपन इंटरेस्ट विश्लेषण",
        oiVsMM: "OI बनाम मैनेज्ड मनी पोजिशनिंग",
        howToReadOI: "ओपन इंटरेस्ट कैसे पढ़ें",
        oiBullish: "OI ↑ + प्राइस ↑ = नए लॉन्ग्स (बुलिश)",
        oiShortCovering: "OI ↓ + प्राइस ↑ = शॉर्ट कवरिंग",
        oiBearish: "OI ↑ + प्राइस ↓ = नए शॉर्ट्स (बेयरिश)",
        oiLongLiquidation: "OI ↓ + प्राइस ↓ = लॉन्ग लिक्विडेशन",
        runAnalysisCharts: "चार्ट्स देखने के लिए विश्लेषण चलाएं",

        // Analysis tab
        deepAnalysis: "गहन विश्लेषण",
        cotIndexOISignals: "COT इंडेक्स, ओपन इंटरेस्ट सिग्नल, और ऐतिहासिक पैटर्न",
        mmCOTIndex: "MM COT इंडेक्स",
        commCOTIndex: "कमर्शियल COT इंडेक्स",
        extremeBullish: "एक्सट्रीम बुलिश",
        extremeBearish: "एक्सट्रीम बेयरिश",
        neutralZone: "न्यूट्रल जोन",
        oiSignal: "OI सिग्नल",
        bullishTrend: "बुलिश ट्रेंड",
        newLongsEntering: "नए लॉन्ग्स एंटर कर रहे हैं",
        bearishTrend: "बेयरिश ट्रेंड",
        newShortsEntering: "नए शॉर्ट्स एंटर कर रहे हैं",
        shortCovering: "शॉर्ट कवरिंग",
        rallyMayNotSustain: "रैली टिक नहीं सकती",
        longLiquidation: "लॉन्ग लिक्विडेशन",
        bearishButExhausting: "बेयरिश लेकिन थक रहा है",
        nextReport: "अगली रिपोर्ट",
        today: "आज!",
        tomorrow: "कल",
        days: "दिन",
        fridayET: "शुक्रवार 3:30 PM ET",
        cotIndex: "COT इंडेक्स",
        normalizedPositioning: "नॉर्मलाइज्ड पोजिशनिंग (0-100)",
        sellZone: "सेल जोन",
        buyZone: "बाय जोन",
        buyZoneRange: "← बाय जोन (0-20)",
        sellZoneRange: "सेल जोन (80-100) →",

        // Advanced tab
        advancedAnalytics: "एडवांस्ड एनालिटिक्स",
        squeezeRiskFlows: "स्क्वीज रिस्क, फ्लो डीकंपोजिशन, और ML रेजीम विश्लेषण",
        loadingAdvanced: "एडवांस्ड एनालिटिक्स लोड हो रहा है",
        analyzingSqueezeRisk: "स्क्वीज रिस्क, फ्लोज और ML रेजीम का विश्लेषण...",
        crowding: "क्राउडिंग",
        highRisk: "उच्च जोखिम",
        moderate: "मध्यम",
        lowRisk: "कम जोखिम",
        squeezeRisk: "स्क्वीज रिस्क",
        vulnerable: "कमजोर",
        stable: "स्थिर",
        flowMomentum: "फ्लो मोमेंटम",
        strong: "मजबूत",
        weak: "कमजोर",
        regime: "रेजीम",
        confidence: "विश्वास",
        activeAlerts: "सक्रिय अलर्ट्स",
        primaryInsight: "प्राथमिक अंतर्दृष्टि",
        suggestedAction: "सुझाई गई कार्रवाई",

        // Alerts tab
        positionAlerts: "पोजीशन अलर्ट्स",
        extremePositioningSignals: "एक्सट्रीम पोजिशनिंग और कॉन्ट्रेरियन सिग्नल",
        category: "श्रेणी",
        historicalContext: "ऐतिहासिक संदर्भ",
        deviation: "विचलन",
        noAlertsTitle: "इस समय कोई एक्सट्रीम पोजिशनिंग अलर्ट नहीं",
        noAlertsDesc: "सभी ट्रेडर श्रेणियां सामान्य सीमा में हैं",
        configuredAlertTypes: "कॉन्फ़िगर किए गए अलर्ट प्रकार",
        alertsWillTrigger: "ये अलर्ट शर्तें पूरी होने पर ट्रिगर होंगे",
        extremeLongPositioning: "एक्सट्रीम लॉन्ग पोजिशनिंग",
        extremeLongDesc: "जब कोई श्रेणी 90वें पर्सेंटाइल नेट लॉन्ग से अधिक हो तो ट्रिगर होता है",
        extremeShortPositioning: "एक्सट्रीम शॉर्ट पोजिशनिंग",
        extremeShortDesc: "जब कोई श्रेणी 10वें पर्सेंटाइल से नीचे गिरे तो ट्रिगर होता है",
        squeezeRiskAlert: "स्क्वीज रिस्क अलर्ट",
        squeezeRiskAlertDesc: "जब स्क्वीज रिस्क स्कोर 70 से अधिक हो तो ट्रिगर होता है",
        smartMoneyDivergence: "स्मार्ट मनी डाइवर्जेंस",
        smartMoneyDivergenceDesc: "जब कमर्शियल्स और मैनेज्ड मनी एक्सट्रीम डाइवर्जेंस दिखाएं तो ट्रिगर होता है",
        overcrowdingWarning: "ओवरक्राउडिंग चेतावनी",
        overcrowdingWarningDesc: "जब मैनेज्ड मनी + स्मॉल ट्रेडर्स दोनों एक्सट्रीम पर हों तो ट्रिगर होता है",
        significantWeeklyChange: "महत्वपूर्ण साप्ताहिक बदलाव",
        significantWeeklyChangeDesc: "जब साप्ताहिक बदलाव 2 स्टैंडर्ड डेविएशन से अधिक हो तो ट्रिगर होता है"
    }
};

// Deep merge function
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Merge COT translations
if (!enData.cot) enData.cot = {};
if (!hiData.cot) hiData.cot = {};

deepMerge(enData.cot, cotTranslations.en);
deepMerge(hiData.cot, cotTranslations.hi);

// Write updated translations
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2), 'utf8');

console.log('✅ COT translations added successfully!');
console.log('   - Added COT page translations');
console.log('   - Added Positions tab translations');
console.log('   - Added Sentiment tab translations');
console.log('   - Added Charts tab translations');
console.log('   - Added Analysis tab translations');
console.log('   - Added Advanced tab translations');
console.log('   - Added Alerts tab translations');
