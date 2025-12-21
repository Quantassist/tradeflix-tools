const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

const cotTranslations = {
    en: {
        // AdvancedTab - Loading & Header
        loadingAdvancedAnalytics: "Loading Advanced Analytics",
        analyzingSqueezeRisk: "Analyzing squeeze risk, flows & ML regimes...",
        advancedAnalytics: "Advanced Analytics",
        squeezeRiskFlowML: "Squeeze risk, flow decomposition, and ML regime analysis",

        // Summary Cards
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

        // Alerts
        activeAlerts: "Active Alerts",

        // Primary Insight
        primaryInsight: "Primary Insight",
        suggestedAction: "Suggested Action",

        // Squeeze Risk Cards
        longSqueezeRisk: "Long Squeeze Risk",
        forcedLongLiquidation: "Forced long liquidation risk",
        shortSqueezeRisk: "Short Squeeze Risk",
        forcedShortCovering: "Forced short covering risk",
        specFactor: "Spec Factor",
        concentration: "Concentration",

        // Flow Decomposition
        flowDecomposition: "Flow Decomposition",
        managedMoney: "Managed Money",
        commercials: "Commercials",
        newLongs: "New Longs",
        longLiquidationLabel: "Long Liquidation",
        newShorts: "New Shorts",
        shortCoveringLabel: "Short Covering",

        // Concentration Analysis
        concentrationAnalysis: "Concentration Analysis",
        longSideConcentration: "Long Side Concentration",
        shortSideConcentration: "Short Side Concentration",
        top4Traders: "Top 4 Traders",
        top8Traders: "Top 8 Traders",
        concentrationRatio: "Concentration Ratio",
        highlyConcentrated: "Highly Concentrated",

        // Curve Structure
        curveStructureAnalysis: "Curve Structure Analysis",
        frontMonthOI: "Front Month OI",
        backMonthOI: "Back Month OI",
        ofTotal: "of total",
        rollStress: "Roll Stress",
        frontNet: "Front Net",
        backNet: "Back Net",

        // Spread vs Directional
        spreadVsDirectional: "Spread vs Directional Exposure",
        marketMode: "Market Mode",
        spreadRatio: "Spread Ratio",
        ofTotalPositions: "of total positions",
        wowChange: "WoW Change",
        spread: "Spread",
        directional: "Dir",

        // Herding Analysis
        herdingMarketStructure: "Herding & Market Structure",
        herdingScore: "Herding Score",
        marketStructure: "Market Structure",
        smartMoneyVsCrowd: "Smart Money vs Crowd",
        smart: "Smart",
        crowd: "Crowd",

        // Cross-Market Pressure
        crossMarketPressure: "Cross-Market Pressure",
        pressureScore: "Pressure Score",
        direction: "Direction",

        // Volatility Analysis
        volatilityAnalysis: "Volatility Analysis",
        impliedVol: "Implied Vol",
        historicalVol: "Historical Vol",
        volRegime: "Vol Regime",

        // ML Regime Analysis
        mlRegimeAnalysis: "ML Regime Analysis",
        currentRegime: "Current Regime",
        regimeConfidence: "Regime Confidence",
        regimeDuration: "Regime Duration",
        regimeProbabilities: "Regime Probabilities",

        // AlertsTab additional
        positionAlerts: "Position Alerts",
        extremePositioningContrarian: "Extreme positioning and contrarian signals",
        percentile: "Percentile",
        deviation: "Deviation",
        noExtremeAlerts: "No extreme positioning alerts at this time",
        allCategoriesNormal: "All trader categories are within normal ranges",
        configuredAlertTypes: "Configured Alert Types",
        alertsWillTrigger: "These alerts will trigger when conditions are met",
        extremeLongPositioning: "Extreme Long Positioning",
        extremeLongDesc: "Triggers when any category exceeds 90th percentile net long",
        extremeShortPositioning: "Extreme Short Positioning",
        extremeShortDesc: "Triggers when any category falls below 10th percentile",
        squeezeRiskAlert: "Squeeze Risk Alert",
        squeezeRiskDesc: "Triggers when squeeze risk score exceeds 70",
        smartMoneyDivergence: "Smart Money Divergence",
        smartMoneyDivergenceDesc: "Triggers when Commercials and Managed Money show extreme divergence",
        overcrowdingWarning: "Overcrowding Warning",
        overcrowdingWarningDesc: "Triggers when Managed Money + Small Traders both at extremes",
        significantWeeklyChange: "Significant Weekly Change",
        significantWeeklyChangeDesc: "Triggers when weekly change exceeds 2 standard deviations",

        // Additional AnalysisTab keys
        deepAnalysis: "Deep Analysis",
        cotIndexOISignals: "COT Index, Open Interest signals, and historical patterns",
        mmCotIndex: "MM COT Index",
        commCotIndex: "Comm COT Index",
        extremeBullish: "Extreme Bullish",
        extremeBearish: "Extreme Bearish",
        neutralZone: "Neutral Zone",
        oiSignal: "OI Signal",
        nextReportLabel: "Next Report",
        today: "Today!",
        tomorrow: "Tomorrow",
        days: "days",
        fridayTime: "Friday 3:30 PM ET",
        cotIndex: "COT Index",
        normalizedPositioning: "Normalized positioning (0-100)",
        sellZone: "Sell Zone",
        buyZone: "Buy Zone",
        noClearSignal: "No clear signal",
        bullishTrend: "Bullish Trend",
        newLongsEntering: "New longs entering",
        bearishTrend: "Bearish Trend",
        newShortsEntering: "New shorts entering",
        rallyMayNotSustain: "Rally may not sustain",
        bearishButExhausting: "Bearish but exhausting",

        // ChartsTab additional
        historicalCharts: "Historical Charts",
        netPositionComparison: "Net Position Comparison",
        trackDivergence: "Track divergence between key market participants",
        divergence: "Divergence",
        divergenceDesc: "Opposite moves → Reversal signal",
        convergence: "Convergence",
        convergenceDesc: "All aligning → Trend confirmation",
        crossover: "Crossover",
        crossoverDesc: "MM crosses Comm → Trend change",
        longVsShortPositions: "Long vs Short Positions",
        positionBreakdown: "Position breakdown for key market participants",
        openInterestAnalysis: "Open Interest Analysis",
        oiVsManagedMoney: "OI vs Managed Money positioning",
        howToReadOI: "How to Read Open Interest",
        oiUpPriceUpBullish: "OI ↑ + Price ↑ = New longs (bullish)",
        oiDownPriceUpCovering: "OI ↓ + Price ↑ = Short covering",
        oiUpPriceDownBearish: "OI ↑ + Price ↓ = New shorts (bearish)",
        oiDownPriceDownLiquidation: "OI ↓ + Price ↓ = Long liquidation",

        // SentimentTab additional
        marketSentiment: "Market Sentiment",
        basedOnWeeks: "Based on {weeks} weeks of historical data",
        percentileRank: "Percentile Rank",
        bearish: "Bearish",
        bullish: "Bullish",
        fourWeekDelta: "4-Week Δ",
        streak: "Streak",
        contrarianAlert: "Contrarian Alert",
        extremePositioningAlert: "Extreme positioning often precedes reversals.",
        producersHedgersSmartMoney: "Producers & hedgers (Smart Money)",
        priceBullish: "Price Bullish",
        priceBearish: "Price Bearish",
        allCategories: "All Categories",
        percentileRankingsVs: "Percentile rankings vs {weeks}-week history"
    },
    hi: {
        // AdvancedTab - Loading & Header
        loadingAdvancedAnalytics: "उन्नत विश्लेषण लोड हो रहा है",
        analyzingSqueezeRisk: "स्क्वीज रिस्क, फ्लो और ML रेजीम का विश्लेषण...",
        advancedAnalytics: "उन्नत विश्लेषण",
        squeezeRiskFlowML: "स्क्वीज रिस्क, फ्लो डीकंपोजिशन, और ML रेजीम विश्लेषण",

        // Summary Cards
        crowding: "क्राउडिंग",
        highRisk: "उच्च जोखिम",
        moderate: "मध्यम",
        lowRisk: "कम जोखिम",
        squeezeRisk: "स्क्वीज रिस्क",
        vulnerable: "असुरक्षित",
        stable: "स्थिर",
        flowMomentum: "फ्लो मोमेंटम",
        strong: "मजबूत",
        weak: "कमजोर",
        regime: "रेजीम",
        confidence: "विश्वास",

        // Alerts
        activeAlerts: "सक्रिय अलर्ट",

        // Primary Insight
        primaryInsight: "प्राथमिक अंतर्दृष्टि",
        suggestedAction: "सुझाई गई कार्रवाई",

        // Squeeze Risk Cards
        longSqueezeRisk: "लॉन्ग स्क्वीज रिस्क",
        forcedLongLiquidation: "फोर्स्ड लॉन्ग लिक्विडेशन रिस्क",
        shortSqueezeRisk: "शॉर्ट स्क्वीज रिस्क",
        forcedShortCovering: "फोर्स्ड शॉर्ट कवरिंग रिस्क",
        specFactor: "स्पेक फैक्टर",
        concentration: "कंसंट्रेशन",

        // Flow Decomposition
        flowDecomposition: "फ्लो डीकंपोजिशन",
        managedMoney: "मैनेज्ड मनी",
        commercials: "कमर्शियल्स",
        newLongs: "नए लॉन्ग्स",
        longLiquidationLabel: "लॉन्ग लिक्विडेशन",
        newShorts: "नए शॉर्ट्स",
        shortCoveringLabel: "शॉर्ट कवरिंग",

        // Concentration Analysis
        concentrationAnalysis: "कंसंट्रेशन विश्लेषण",
        longSideConcentration: "लॉन्ग साइड कंसंट्रेशन",
        shortSideConcentration: "शॉर्ट साइड कंसंट्रेशन",
        top4Traders: "टॉप 4 ट्रेडर्स",
        top8Traders: "टॉप 8 ट्रेडर्स",
        concentrationRatio: "कंसंट्रेशन रेशियो",
        highlyConcentrated: "अत्यधिक केंद्रित",

        // Curve Structure
        curveStructureAnalysis: "कर्व स्ट्रक्चर विश्लेषण",
        frontMonthOI: "फ्रंट मंथ OI",
        backMonthOI: "बैक मंथ OI",
        ofTotal: "कुल का",
        rollStress: "रोल स्ट्रेस",
        frontNet: "फ्रंट नेट",
        backNet: "बैक नेट",

        // Spread vs Directional
        spreadVsDirectional: "स्प्रेड बनाम डायरेक्शनल एक्सपोजर",
        marketMode: "मार्केट मोड",
        spreadRatio: "स्प्रेड रेशियो",
        ofTotalPositions: "कुल पोजीशन का",
        wowChange: "WoW बदलाव",
        spread: "स्प्रेड",
        directional: "डायरेक्शनल",

        // Herding Analysis
        herdingMarketStructure: "हर्डिंग और मार्केट स्ट्रक्चर",
        herdingScore: "हर्डिंग स्कोर",
        marketStructure: "मार्केट स्ट्रक्चर",
        smartMoneyVsCrowd: "स्मार्ट मनी बनाम क्राउड",
        smart: "स्मार्ट",
        crowd: "क्राउड",

        // Cross-Market Pressure
        crossMarketPressure: "क्रॉस-मार्केट प्रेशर",
        pressureScore: "प्रेशर स्कोर",
        direction: "दिशा",

        // Volatility Analysis
        volatilityAnalysis: "वोलैटिलिटी विश्लेषण",
        impliedVol: "इम्प्लाइड वोल",
        historicalVol: "हिस्टोरिकल वोल",
        volRegime: "वोल रेजीम",

        // ML Regime Analysis
        mlRegimeAnalysis: "ML रेजीम विश्लेषण",
        currentRegime: "वर्तमान रेजीम",
        regimeConfidence: "रेजीम विश्वास",
        regimeDuration: "रेजीम अवधि",
        regimeProbabilities: "रेजीम संभावनाएं",

        // AlertsTab additional
        positionAlerts: "पोजीशन अलर्ट",
        extremePositioningContrarian: "एक्सट्रीम पोजिशनिंग और कॉन्ट्रेरियन सिग्नल",
        percentile: "पर्सेंटाइल",
        deviation: "विचलन",
        noExtremeAlerts: "इस समय कोई एक्सट्रीम पोजिशनिंग अलर्ट नहीं",
        allCategoriesNormal: "सभी ट्रेडर श्रेणियां सामान्य सीमा में हैं",
        configuredAlertTypes: "कॉन्फ़िगर किए गए अलर्ट प्रकार",
        alertsWillTrigger: "ये अलर्ट शर्तें पूरी होने पर ट्रिगर होंगे",
        extremeLongPositioning: "एक्सट्रीम लॉन्ग पोजिशनिंग",
        extremeLongDesc: "जब कोई श्रेणी 90वें पर्सेंटाइल नेट लॉन्ग से अधिक हो",
        extremeShortPositioning: "एक्सट्रीम शॉर्ट पोजिशनिंग",
        extremeShortDesc: "जब कोई श्रेणी 10वें पर्सेंटाइल से नीचे गिरे",
        squeezeRiskAlert: "स्क्वीज रिस्क अलर्ट",
        squeezeRiskDesc: "जब स्क्वीज रिस्क स्कोर 70 से अधिक हो",
        smartMoneyDivergence: "स्मार्ट मनी डाइवर्जेंस",
        smartMoneyDivergenceDesc: "जब कमर्शियल्स और मैनेज्ड मनी एक्सट्रीम डाइवर्जेंस दिखाएं",
        overcrowdingWarning: "ओवरक्राउडिंग चेतावनी",
        overcrowdingWarningDesc: "जब मैनेज्ड मनी + स्मॉल ट्रेडर्स दोनों एक्सट्रीम पर हों",
        significantWeeklyChange: "महत्वपूर्ण साप्ताहिक बदलाव",
        significantWeeklyChangeDesc: "जब साप्ताहिक बदलाव 2 स्टैंडर्ड डेविएशन से अधिक हो",

        // Additional AnalysisTab keys
        deepAnalysis: "गहन विश्लेषण",
        cotIndexOISignals: "COT इंडेक्स, ओपन इंटरेस्ट सिग्नल, और ऐतिहासिक पैटर्न",
        mmCotIndex: "MM COT इंडेक्स",
        commCotIndex: "कमर्शियल COT इंडेक्स",
        extremeBullish: "अत्यधिक बुलिश",
        extremeBearish: "अत्यधिक बेयरिश",
        neutralZone: "न्यूट्रल जोन",
        oiSignal: "OI सिग्नल",
        nextReportLabel: "अगली रिपोर्ट",
        today: "आज!",
        tomorrow: "कल",
        days: "दिन",
        fridayTime: "शुक्रवार 3:30 PM ET",
        cotIndex: "COT इंडेक्स",
        normalizedPositioning: "नॉर्मलाइज्ड पोजिशनिंग (0-100)",
        sellZone: "सेल जोन",
        buyZone: "बाय जोन",
        noClearSignal: "कोई स्पष्ट सिग्नल नहीं",
        bullishTrend: "बुलिश ट्रेंड",
        newLongsEntering: "नए लॉन्ग्स प्रवेश कर रहे हैं",
        bearishTrend: "बेयरिश ट्रेंड",
        newShortsEntering: "नए शॉर्ट्स प्रवेश कर रहे हैं",
        rallyMayNotSustain: "रैली टिक नहीं सकती",
        bearishButExhausting: "बेयरिश लेकिन थक रहा है",

        // ChartsTab additional
        historicalCharts: "ऐतिहासिक चार्ट्स",
        netPositionComparison: "नेट पोजीशन तुलना",
        trackDivergence: "मुख्य बाजार प्रतिभागियों के बीच डाइवर्जेंस ट्रैक करें",
        divergence: "डाइवर्जेंस",
        divergenceDesc: "विपरीत चाल → रिवर्सल सिग्नल",
        convergence: "कन्वर्जेंस",
        convergenceDesc: "सभी एलाइन हो रहे → ट्रेंड कन्फर्मेशन",
        crossover: "क्रॉसओवर",
        crossoverDesc: "MM कमर्शियल को क्रॉस करे → ट्रेंड चेंज",
        longVsShortPositions: "लॉन्ग बनाम शॉर्ट पोजीशन",
        positionBreakdown: "मुख्य बाजार प्रतिभागियों के लिए पोजीशन ब्रेकडाउन",
        openInterestAnalysis: "ओपन इंटरेस्ट विश्लेषण",
        oiVsManagedMoney: "OI बनाम मैनेज्ड मनी पोजिशनिंग",
        howToReadOI: "ओपन इंटरेस्ट कैसे पढ़ें",
        oiUpPriceUpBullish: "OI ↑ + प्राइस ↑ = नए लॉन्ग्स (बुलिश)",
        oiDownPriceUpCovering: "OI ↓ + प्राइस ↑ = शॉर्ट कवरिंग",
        oiUpPriceDownBearish: "OI ↑ + प्राइस ↓ = नए शॉर्ट्स (बेयरिश)",
        oiDownPriceDownLiquidation: "OI ↓ + प्राइस ↓ = लॉन्ग लिक्विडेशन",

        // SentimentTab additional
        marketSentiment: "बाजार भावना",
        basedOnWeeks: "{weeks} सप्ताह के ऐतिहासिक डेटा पर आधारित",
        percentileRank: "पर्सेंटाइल रैंक",
        bearish: "बेयरिश",
        bullish: "बुलिश",
        fourWeekDelta: "4-सप्ताह Δ",
        streak: "स्ट्रीक",
        contrarianAlert: "कॉन्ट्रेरियन अलर्ट",
        extremePositioningAlert: "एक्सट्रीम पोजिशनिंग अक्सर रिवर्सल से पहले होती है।",
        producersHedgersSmartMoney: "प्रोड्यूसर्स और हेजर्स (स्मार्ट मनी)",
        priceBullish: "प्राइस बुलिश",
        priceBearish: "प्राइस बेयरिश",
        allCategories: "सभी श्रेणियां",
        percentileRankingsVs: "{weeks}-सप्ताह इतिहास के मुकाबले पर्सेंटाइल रैंकिंग"
    }
};

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

if (!enData.cot) enData.cot = {};
if (!hiData.cot) hiData.cot = {};

deepMerge(enData.cot, cotTranslations.en);
deepMerge(hiData.cot, cotTranslations.hi);

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2), 'utf8');

console.log('✅ COT Advanced translations added successfully!');
