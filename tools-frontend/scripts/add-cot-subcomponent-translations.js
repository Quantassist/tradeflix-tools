const fs = require('fs');
const path = require('path');

// Paths to translation files
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

// Read existing translations
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Additional COT sub-component translations
const cotTranslations = {
    en: {
        // PositionsTab
        keyMetrics: "Key Metrics",
        keyMarketParticipants: "Key Market Participants",
        hedgeFundsSpeculators: "Hedge funds & large speculators",
        keyIndicator: "Key Indicator",
        producersMerchantsHedgers: "Producers, merchants & hedgers",
        propTradersFamilyOffices: "Prop traders & family offices",
        nonReportables: "Non-Reportables",
        smallRetailTraders: "Small & retail traders",
        weeklyDelta: "Weekly Δ",
        proTip: "Pro Tip:",
        proTipDivergence: "Watch for divergence between Speculators (Managed Money) and Commercials. When speculators are extremely bullish while commercials are bearish, it often signals a potential market reversal.",

        // SentimentTab
        hedgeFundsSpeculatorsShort: "Hedge funds & speculators",
        allCategories: "All Categories",
        percentileRankingsVs: "Percentile rankings vs {weeks}-week history",
        smartMoneyNote: "Commercials are contrarian. Heavy shorts = price tops, heavy longs = bottoms.",

        // ChartsTab
        runAnalysisCharts: "Run analysis to see charts",
        weeksOfPositioningData: "{weeks} weeks of positioning data",
        mmLong: "MM Long",
        mmShort: "MM Short",
        commLong: "Comm Long",
        commShort: "Comm Short",

        // AnalysisTab
        trendConfirmationSignals: "Trend confirmation signals",
        currentOI: "Current OI",
        thisWeek: "this week",
        trendSignal: "Trend Signal",
        howToReadOIPrice: "How to Read OI + Price",
        oiUpPriceUp: "↑ OI + ↑ Price",
        oiUpPriceDown: "↑ OI + ↓ Price",
        oiDownPriceUp: "↓ OI + ↑ Price",
        oiDownPriceDown: "↓ OI + ↓ Price",
        newLongsBullish: "New longs (bullish)",
        newShortsBearish: "New shorts (bearish)",
        reportCalendar: "Report Calendar",
        weeklyReleaseSchedule: "Weekly release schedule",
        nextRelease: "Next Release",
        inDays: "In {days} days",
        dataAsOf: "Data As Of",
        dataLag: "Data Lag",
        threeDays: "3 days",
        analysisPeriod: "Analysis Period",
        weeks: "weeks",
        historicalCaseStudies: "Historical Case Studies",
        learnFromPast: "Learn from past extreme positioning events",
        classicTop: "Classic Top",
        classicTopDesc: "MM 94th %ile long + Comm 91st %ile short → Gold peaked, fell 5% in 4 weeks",
        extremeDivergence: "Extreme Divergence",
        classicBottom: "Classic Bottom",
        classicBottomDesc: "MM 12th %ile + rapid liquidation → Gold rallied 8% in 6 weeks",
        capitulationSignal: "Capitulation Signal",
        smartMoneyAlign: "Smart Money Align",
        smartMoneyAlignDesc: "Comm covering + MM adding longs = High conviction bullish (2-3x/year)",
        rareSignal: "Rare Signal",
        overcrowding: "Overcrowding",
        overcrowdingDesc: "MM >85th + Small Traders >80th = Everyone bullish → 76% accuracy sell",
        contrarianSetup: "Contrarian Setup",
        proTipDivergenceTrading: "Pro Tip: Divergence Trading",
        proTipDivergenceTradingDesc: "The most powerful COT signals occur when Managed Money and Commercials show opposite extremes (one >80%, other <20%). This divergence historically precedes significant price reversals within 2-4 weeks.",

        // AdvancedTab
        longSqueezeRisk: "Long Squeeze Risk",
        forcedLongLiquidation: "Forced long liquidation risk",
        shortSqueezeRiskTitle: "Short Squeeze Risk",
        forcedShortCovering: "Forced short covering risk",
        specFactor: "Spec Factor",
        concentration: "Concentration",
        flowDecomposition: "Flow Decomposition",
        newLongs: "New Longs",
        longLiquidationLabel: "Long Liquidation",
        newShorts: "New Shorts",
        shortCoveringLabel: "Short Covering",
        concentrationAnalysis: "Concentration Analysis",
        longSideConcentration: "Long Side Concentration",
        shortSideConcentration: "Short Side Concentration",
        top4Traders: "Top 4 Traders",
        top8Traders: "Top 8 Traders",
        concentrationRatio: "Concentration Ratio",
        highlyConcentrated: "Highly Concentrated",
        curveStructureAnalysis: "Curve Structure Analysis",
        frontMonthOI: "Front Month OI",
        backMonthOI: "Back Month OI",
        ofTotal: "of total",
        rollStress: "Roll Stress",
        frontNet: "Front Net",
        backNet: "Back Net",
        spreadVsDirectional: "Spread vs Directional Exposure",
        marketMode: "Market Mode",
        spreadRatio: "Spread Ratio",
        ofTotalPositions: "of total positions",
        wowChange: "WoW Change",
        spread: "Spread",
        directional: "Dir",
        herdingMarketStructure: "Herding & Market Structure",
        herdingScore: "Herding Score",
        marketStructure: "Market Structure",
        smartMoneyVsCrowd: "Smart Money vs Crowd",
        smart: "Smart",
        crowd: "Crowd",
        crossMarketPressure: "Cross-Market Pressure",
        pressureScore: "Pressure Score",
        direction: "Direction",
        volatilityAnalysis: "Volatility Analysis",
        impliedVol: "Implied Vol",
        historicalVol: "Historical Vol",
        volRegime: "Vol Regime",
        mlRegimeAnalysis: "ML Regime Analysis",
        currentRegime: "Current Regime",
        regimeConfidence: "Regime Confidence",
        regimeDuration: "Regime Duration",

        // AlertsTab
        suggestedActionLabel: "Suggested Action"
    },
    hi: {
        // PositionsTab
        keyMetrics: "मुख्य मेट्रिक्स",
        keyMarketParticipants: "मुख्य बाजार प्रतिभागी",
        hedgeFundsSpeculators: "हेज फंड्स और बड़े स्पेक्युलेटर्स",
        keyIndicator: "मुख्य संकेतक",
        producersMerchantsHedgers: "प्रोड्यूसर्स, मर्चेंट्स और हेजर्स",
        propTradersFamilyOffices: "प्रोप ट्रेडर्स और फैमिली ऑफिस",
        nonReportables: "नॉन-रिपोर्टेबल्स",
        smallRetailTraders: "छोटे और रिटेल ट्रेडर्स",
        weeklyDelta: "साप्ताहिक Δ",
        proTip: "प्रो टिप:",
        proTipDivergence: "स्पेक्युलेटर्स (मैनेज्ड मनी) और कमर्शियल्स के बीच डाइवर्जेंस देखें। जब स्पेक्युलेटर्स अत्यधिक बुलिश हों जबकि कमर्शियल्स बेयरिश हों, तो यह अक्सर संभावित मार्केट रिवर्सल का संकेत देता है।",

        // SentimentTab
        hedgeFundsSpeculatorsShort: "हेज फंड्स और स्पेक्युलेटर्स",
        allCategories: "सभी श्रेणियां",
        percentileRankingsVs: "{weeks}-सप्ताह इतिहास के मुकाबले पर्सेंटाइल रैंकिंग",
        smartMoneyNote: "कमर्शियल्स कॉन्ट्रेरियन हैं। भारी शॉर्ट्स = प्राइस टॉप्स, भारी लॉन्ग्स = बॉटम्स।",

        // ChartsTab
        runAnalysisCharts: "चार्ट्स देखने के लिए विश्लेषण चलाएं",
        weeksOfPositioningData: "{weeks} सप्ताह का पोजिशनिंग डेटा",
        mmLong: "MM लॉन्ग",
        mmShort: "MM शॉर्ट",
        commLong: "कमर्शियल लॉन्ग",
        commShort: "कमर्शियल शॉर्ट",

        // AnalysisTab
        trendConfirmationSignals: "ट्रेंड कन्फर्मेशन सिग्नल",
        currentOI: "वर्तमान OI",
        thisWeek: "इस सप्ताह",
        trendSignal: "ट्रेंड सिग्नल",
        howToReadOIPrice: "OI + प्राइस कैसे पढ़ें",
        oiUpPriceUp: "↑ OI + ↑ प्राइस",
        oiUpPriceDown: "↑ OI + ↓ प्राइस",
        oiDownPriceUp: "↓ OI + ↑ प्राइस",
        oiDownPriceDown: "↓ OI + ↓ प्राइस",
        newLongsBullish: "नए लॉन्ग्स (बुलिश)",
        newShortsBearish: "नए शॉर्ट्स (बेयरिश)",
        reportCalendar: "रिपोर्ट कैलेंडर",
        weeklyReleaseSchedule: "साप्ताहिक रिलीज शेड्यूल",
        nextRelease: "अगली रिलीज",
        inDays: "{days} दिनों में",
        dataAsOf: "डेटा तारीख",
        dataLag: "डेटा लैग",
        threeDays: "3 दिन",
        analysisPeriod: "विश्लेषण अवधि",
        weeks: "सप्ताह",
        historicalCaseStudies: "ऐतिहासिक केस स्टडीज",
        learnFromPast: "पिछली एक्सट्रीम पोजिशनिंग घटनाओं से सीखें",
        classicTop: "क्लासिक टॉप",
        classicTopDesc: "MM 94वां %ile लॉन्ग + Comm 91वां %ile शॉर्ट → गोल्ड पीक हुआ, 4 सप्ताह में 5% गिरा",
        extremeDivergence: "एक्सट्रीम डाइवर्जेंस",
        classicBottom: "क्लासिक बॉटम",
        classicBottomDesc: "MM 12वां %ile + तेज लिक्विडेशन → गोल्ड 6 सप्ताह में 8% बढ़ा",
        capitulationSignal: "कैपिट्युलेशन सिग्नल",
        smartMoneyAlign: "स्मार्ट मनी एलाइन",
        smartMoneyAlignDesc: "Comm कवरिंग + MM लॉन्ग्स जोड़ रहे = उच्च विश्वास बुलिश (2-3x/वर्ष)",
        rareSignal: "दुर्लभ सिग्नल",
        overcrowding: "ओवरक्राउडिंग",
        overcrowdingDesc: "MM >85वां + स्मॉल ट्रेडर्स >80वां = सभी बुलिश → 76% सटीकता सेल",
        contrarianSetup: "कॉन्ट्रेरियन सेटअप",
        proTipDivergenceTrading: "प्रो टिप: डाइवर्जेंस ट्रेडिंग",
        proTipDivergenceTradingDesc: "सबसे शक्तिशाली COT सिग्नल तब होते हैं जब मैनेज्ड मनी और कमर्शियल्स विपरीत एक्सट्रीम दिखाते हैं (एक >80%, दूसरा <20%)। यह डाइवर्जेंस ऐतिहासिक रूप से 2-4 सप्ताह के भीतर महत्वपूर्ण प्राइस रिवर्सल से पहले होता है।",

        // AdvancedTab
        longSqueezeRisk: "लॉन्ग स्क्वीज रिस्क",
        forcedLongLiquidation: "फोर्स्ड लॉन्ग लिक्विडेशन रिस्क",
        shortSqueezeRiskTitle: "शॉर्ट स्क्वीज रिस्क",
        forcedShortCovering: "फोर्स्ड शॉर्ट कवरिंग रिस्क",
        specFactor: "स्पेक फैक्टर",
        concentration: "कंसंट्रेशन",
        flowDecomposition: "फ्लो डीकंपोजिशन",
        newLongs: "नए लॉन्ग्स",
        longLiquidationLabel: "लॉन्ग लिक्विडेशन",
        newShorts: "नए शॉर्ट्स",
        shortCoveringLabel: "शॉर्ट कवरिंग",
        concentrationAnalysis: "कंसंट्रेशन विश्लेषण",
        longSideConcentration: "लॉन्ग साइड कंसंट्रेशन",
        shortSideConcentration: "शॉर्ट साइड कंसंट्रेशन",
        top4Traders: "टॉप 4 ट्रेडर्स",
        top8Traders: "टॉप 8 ट्रेडर्स",
        concentrationRatio: "कंसंट्रेशन रेशियो",
        highlyConcentrated: "अत्यधिक केंद्रित",
        curveStructureAnalysis: "कर्व स्ट्रक्चर विश्लेषण",
        frontMonthOI: "फ्रंट मंथ OI",
        backMonthOI: "बैक मंथ OI",
        ofTotal: "कुल का",
        rollStress: "रोल स्ट्रेस",
        frontNet: "फ्रंट नेट",
        backNet: "बैक नेट",
        spreadVsDirectional: "स्प्रेड बनाम डायरेक्शनल एक्सपोजर",
        marketMode: "मार्केट मोड",
        spreadRatio: "स्प्रेड रेशियो",
        ofTotalPositions: "कुल पोजीशन का",
        wowChange: "WoW बदलाव",
        spread: "स्प्रेड",
        directional: "डायरेक्शनल",
        herdingMarketStructure: "हर्डिंग और मार्केट स्ट्रक्चर",
        herdingScore: "हर्डिंग स्कोर",
        marketStructure: "मार्केट स्ट्रक्चर",
        smartMoneyVsCrowd: "स्मार्ट मनी बनाम क्राउड",
        smart: "स्मार्ट",
        crowd: "क्राउड",
        crossMarketPressure: "क्रॉस-मार्केट प्रेशर",
        pressureScore: "प्रेशर स्कोर",
        direction: "दिशा",
        volatilityAnalysis: "वोलैटिलिटी विश्लेषण",
        impliedVol: "इम्प्लाइड वोल",
        historicalVol: "हिस्टोरिकल वोल",
        volRegime: "वोल रेजीम",
        mlRegimeAnalysis: "ML रेजीम विश्लेषण",
        currentRegime: "वर्तमान रेजीम",
        regimeConfidence: "रेजीम विश्वास",
        regimeDuration: "रेजीम अवधि",

        // AlertsTab
        suggestedActionLabel: "सुझाई गई कार्रवाई"
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

console.log('✅ COT sub-component translations added successfully!');
console.log('   - Added PositionsTab translations');
console.log('   - Added SentimentTab translations');
console.log('   - Added ChartsTab translations');
console.log('   - Added AnalysisTab translations');
console.log('   - Added AdvancedTab translations');
console.log('   - Added AlertsTab translations');
