const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

const cotTranslations = {
    en: {
        // Missing keys for AdvancedTab
        runAnalysisAdvanced: "Run analysis to see advanced metrics",

        // Missing keys for ChartsTab
        runAnalysisCharts: "Run analysis to see charts",
        weeksOfPositioningData: "{weeks} weeks of positioning data",

        // Missing keys for AnalysisTab
        trendConfirmationSignals: "Trend confirmation signals",
        currentOI: "Current OI",
        thisWeek: "this week",
        trendSignal: "Trend Signal",
        howToReadOIPrice: "How to Read OI + Price",
        oiUpPriceUp: "↑ OI + ↑ Price",
        newLongsBullish: "New longs (bullish)",
        oiUpPriceDown: "↑ OI + ↓ Price",
        newShortsBearish: "New shorts (bearish)",
        oiDownPriceUp: "↓ OI + ↑ Price",
        oiDownPriceDown: "↓ OI + ↓ Price",
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

        // Missing keys for SentimentTab
        hedgeFundsSpeculatorsShort: "Hedge funds & speculators",
        smartMoneyNote: "Commercials are contrarian. Heavy shorts = price tops, heavy longs = bottoms.",

        // Additional missing keys
        suggestedActionLabel: "Suggested Action"
    },
    hi: {
        // Missing keys for AdvancedTab
        runAnalysisAdvanced: "उन्नत मेट्रिक्स देखने के लिए विश्लेषण चलाएं",

        // Missing keys for ChartsTab
        runAnalysisCharts: "चार्ट देखने के लिए विश्लेषण चलाएं",
        weeksOfPositioningData: "{weeks} सप्ताह का पोजिशनिंग डेटा",

        // Missing keys for AnalysisTab
        trendConfirmationSignals: "ट्रेंड कन्फर्मेशन सिग्नल",
        currentOI: "वर्तमान OI",
        thisWeek: "इस सप्ताह",
        trendSignal: "ट्रेंड सिग्नल",
        howToReadOIPrice: "OI + प्राइस कैसे पढ़ें",
        oiUpPriceUp: "↑ OI + ↑ प्राइस",
        newLongsBullish: "नए लॉन्ग्स (बुलिश)",
        oiUpPriceDown: "↑ OI + ↓ प्राइस",
        newShortsBearish: "नए शॉर्ट्स (बेयरिश)",
        oiDownPriceUp: "↓ OI + ↑ प्राइस",
        oiDownPriceDown: "↓ OI + ↓ प्राइस",
        reportCalendar: "रिपोर्ट कैलेंडर",
        weeklyReleaseSchedule: "साप्ताहिक रिलीज शेड्यूल",
        nextRelease: "अगली रिलीज",
        inDays: "{days} दिनों में",
        dataAsOf: "डेटा की तारीख",
        dataLag: "डेटा लैग",
        threeDays: "3 दिन",
        analysisPeriod: "विश्लेषण अवधि",
        weeks: "सप्ताह",
        historicalCaseStudies: "ऐतिहासिक केस स्टडीज",
        learnFromPast: "पिछले एक्सट्रीम पोजिशनिंग इवेंट्स से सीखें",
        classicTop: "क्लासिक टॉप",
        classicTopDesc: "MM 94वां %ile लॉन्ग + Comm 91वां %ile शॉर्ट → गोल्ड पीक हुआ, 4 सप्ताह में 5% गिरा",
        extremeDivergence: "एक्सट्रीम डाइवर्जेंस",
        classicBottom: "क्लासिक बॉटम",
        classicBottomDesc: "MM 12वां %ile + तेज लिक्विडेशन → गोल्ड 6 सप्ताह में 8% बढ़ा",
        capitulationSignal: "कैपिट्यूलेशन सिग्नल",
        smartMoneyAlign: "स्मार्ट मनी एलाइन",
        smartMoneyAlignDesc: "Comm कवरिंग + MM लॉन्ग्स जोड़ रहे = हाई कन्विक्शन बुलिश (2-3x/वर्ष)",
        rareSignal: "रेयर सिग्नल",
        overcrowding: "ओवरक्राउडिंग",
        overcrowdingDesc: "MM >85वां + स्मॉल ट्रेडर्स >80वां = सभी बुलिश → 76% एक्यूरेसी सेल",
        contrarianSetup: "कॉन्ट्रेरियन सेटअप",
        proTipDivergenceTrading: "प्रो टिप: डाइवर्जेंस ट्रेडिंग",
        proTipDivergenceTradingDesc: "सबसे शक्तिशाली COT सिग्नल तब होते हैं जब मैनेज्ड मनी और कमर्शियल्स विपरीत एक्सट्रीम दिखाते हैं (एक >80%, दूसरा <20%)। यह डाइवर्जेंस ऐतिहासिक रूप से 2-4 सप्ताह के भीतर महत्वपूर्ण प्राइस रिवर्सल से पहले होता है।",

        // Missing keys for SentimentTab
        hedgeFundsSpeculatorsShort: "हेज फंड्स और स्पेक्युलेटर्स",
        smartMoneyNote: "कमर्शियल्स कॉन्ट्रेरियन हैं। भारी शॉर्ट्स = प्राइस टॉप्स, भारी लॉन्ग्स = बॉटम्स।",

        // Additional missing keys
        suggestedActionLabel: "सुझाई गई कार्रवाई"
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

console.log('✅ COT final translations added successfully!');
