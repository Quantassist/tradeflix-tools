const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../messages/en.json');
const hiPath = path.join(__dirname, '../messages/hi.json');

// Read existing files
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Pivot Levels Chart translations
const pivotLevelsChartEn = {
    "title": "Pivot Levels Visualization",
    "description": "Support and resistance levels with current price",
    "readingChart": "Reading the Chart",
    "chartReadingGuide": "Chart Reading Guide",
    "howToInterpret": "How to interpret the pivot levels chart",
    "resistanceLevels": "Resistance Levels (R1-R3)",
    "resistanceDesc": "Price barriers above current price. Expect selling pressure at these levels.",
    "cprZone": "CPR Zone (TC, Pivot, BC)",
    "cprZoneDesc": "Central Pivot Range - the day's equilibrium zone. Price tends to gravitate here.",
    "supportLevels": "Support Levels (S1-S3)",
    "supportDesc": "Price floors below current price. Expect buying pressure at these levels.",
    "currentPriceNote": "Orange dashed line shows current price position relative to all levels.",
    "resistance": "Resistance",
    "cpr": "CPR",
    "support": "Support",
    "currentPrice": "Current Price",
    "current": "Current"
};

const pivotLevelsChartHi = {
    "title": "पिवट लेवल विज़ुअलाइज़ेशन",
    "description": "वर्तमान मूल्य के साथ सपोर्ट और रेजिस्टेंस लेवल",
    "readingChart": "चार्ट पढ़ना",
    "chartReadingGuide": "चार्ट रीडिंग गाइड",
    "howToInterpret": "पिवट लेवल चार्ट की व्याख्या कैसे करें",
    "resistanceLevels": "रेजिस्टेंस लेवल (R1-R3)",
    "resistanceDesc": "वर्तमान मूल्य से ऊपर प्राइस बैरियर। इन लेवल पर सेलिंग प्रेशर की उम्मीद करें।",
    "cprZone": "CPR जोन (TC, Pivot, BC)",
    "cprZoneDesc": "सेंट्रल पिवट रेंज - दिन का संतुलन जोन। मूल्य यहां आकर्षित होता है।",
    "supportLevels": "सपोर्ट लेवल (S1-S3)",
    "supportDesc": "वर्तमान मूल्य से नीचे प्राइस फ्लोर। इन लेवल पर बाइंग प्रेशर की उम्मीद करें।",
    "currentPriceNote": "नारंगी डैश्ड लाइन सभी लेवल के सापेक्ष वर्तमान मूल्य की स्थिति दिखाती है।",
    "resistance": "रेजिस्टेंस",
    "cpr": "CPR",
    "support": "सपोर्ट",
    "currentPrice": "वर्तमान मूल्य",
    "current": "वर्तमान"
};

// Arbitrage page translations
const arbitrageEn = {
    "understandingArbitrage": "Understanding COMEX-MCX Arbitrage",
    "guide": "Guide",
    "guideSubtitle": "Learn how to identify and trade pricing inefficiencies between exchanges",
    "hideGuide": "Hide Guide",
    "showGuide": "Show Guide",
    "whatIsArbitrage": "What is Arbitrage?",
    "whatIsArbitrageDesc": "Arbitrage exploits price differences between COMEX (US) and MCX (India) for the same commodity.",
    "fairValueCalc": "Fair Value Calculation",
    "fairValueCalcDesc": "COMEX price × USDINR × conversion factor + import duty + costs = Fair Value",
    "premiumDiscount": "Premium/Discount",
    "premiumDiscountDesc": "When MCX > Fair Value = Premium (sell signal). When MCX < Fair Value = Discount (buy signal).",
    "riskFactors": "Risk Factors",
    "riskFactorsDesc": "Currency fluctuations, timing gaps, and transaction costs can affect profitability.",
    "opportunity": "Opportunity"
};

const arbitrageHi = {
    "understandingArbitrage": "COMEX-MCX आर्बिट्राज को समझना",
    "guide": "गाइड",
    "guideSubtitle": "एक्सचेंजों के बीच प्राइसिंग अक्षमताओं की पहचान और ट्रेड करना सीखें",
    "hideGuide": "गाइड छुपाएं",
    "showGuide": "गाइड दिखाएं",
    "whatIsArbitrage": "आर्बिट्राज क्या है?",
    "whatIsArbitrageDesc": "आर्बिट्राज एक ही कमोडिटी के लिए COMEX (US) और MCX (भारत) के बीच मूल्य अंतर का फायदा उठाता है।",
    "fairValueCalc": "फेयर वैल्यू कैलकुलेशन",
    "fairValueCalcDesc": "COMEX मूल्य × USDINR × कन्वर्जन फैक्टर + इम्पोर्ट ड्यूटी + कॉस्ट = फेयर वैल्यू",
    "premiumDiscount": "प्रीमियम/डिस्काउंट",
    "premiumDiscountDesc": "जब MCX > फेयर वैल्यू = प्रीमियम (सेल सिग्नल)। जब MCX < फेयर वैल्यू = डिस्काउंट (बाय सिग्नल)।",
    "riskFactors": "जोखिम कारक",
    "riskFactorsDesc": "करेंसी उतार-चढ़ाव, टाइमिंग गैप और ट्रांजैक्शन कॉस्ट लाभप्रदता को प्रभावित कर सकते हैं।",
    "opportunity": "अवसर"
};

// USDINR Sensitivity translations
const usdinrSensitivityEn = {
    "title": "USD/INR Sensitivity Analysis",
    "description": "Analyze how currency movements impact MCX fair value",
    "comexPrice": "COMEX Price ($/oz)",
    "currentUsdinr": "Current USD/INR",
    "usdinrChange": "USD/INR Change",
    "inrStrengthens": "INR strengthens",
    "inrWeakens": "INR weakens",
    "quickScenarios": "Quick Scenarios",
    "calculating": "Calculating...",
    "calculateImpact": "Calculate Impact",
    "fairValueImpact": "Fair Value Impact",
    "currentFairValue": "Current Fair Value",
    "newFairValue": "New Fair Value",
    "changePercent": "Change %",
    "impactPerRupee": "Impact per ₹1",
    "magnitude": "Magnitude",
    "interpretation": "Interpretation",
    "breakEvenAnalysis": "Break-even Analysis",
    "breakEvenDesc": "Every ₹1 change in USD/INR moves MCX Gold fair value by approximately",
    "perContract": "per contract"
};

const usdinrSensitivityHi = {
    "title": "USD/INR सेंसिटिविटी एनालिसिस",
    "description": "करेंसी मूवमेंट MCX फेयर वैल्यू को कैसे प्रभावित करती है इसका विश्लेषण करें",
    "comexPrice": "COMEX मूल्य ($/oz)",
    "currentUsdinr": "वर्तमान USD/INR",
    "usdinrChange": "USD/INR परिवर्तन",
    "inrStrengthens": "INR मजबूत होता है",
    "inrWeakens": "INR कमजोर होता है",
    "quickScenarios": "त्वरित परिदृश्य",
    "calculating": "कैलकुलेट हो रहा है...",
    "calculateImpact": "प्रभाव कैलकुलेट करें",
    "fairValueImpact": "फेयर वैल्यू प्रभाव",
    "currentFairValue": "वर्तमान फेयर वैल्यू",
    "newFairValue": "नई फेयर वैल्यू",
    "changePercent": "परिवर्तन %",
    "impactPerRupee": "प्रति ₹1 प्रभाव",
    "magnitude": "परिमाण",
    "interpretation": "व्याख्या",
    "breakEvenAnalysis": "ब्रेक-ईवन एनालिसिस",
    "breakEvenDesc": "USD/INR में हर ₹1 परिवर्तन MCX गोल्ड फेयर वैल्यू को लगभग इतना मूव करता है",
    "perContract": "प्रति कॉन्ट्रैक्ट"
};

// Multi Commodity Tracker translations
const multiCommodityTrackerEn = {
    "title": "Multi-Commodity Tracker",
    "description": "Real-time arbitrage across multiple commodities",
    "updated": "Updated",
    "refreshAll": "Refresh All",
    "commodity": "Commodity",
    "comex": "COMEX",
    "mcx": "MCX",
    "fairValue": "Fair Value",
    "premium": "Premium",
    "heatmap": "Heatmap",
    "signal": "Signal",
    "strongBuy": "Strong Buy",
    "buy": "Buy",
    "strongSell": "Strong Sell",
    "sell": "Sell",
    "neutral": "Neutral",
    "error": "Error",
    "estimated": "Est.",
    "crossCommodityAnalysis": "Cross-Commodity Analysis",
    "insufficientData": "Insufficient data for analysis",
    "goldPremiumHigher": "Gold premium is higher than Silver - Gold may correct relative to Silver",
    "silverPremiumHigher": "Silver premium is higher than Gold - Silver may correct relative to Gold",
    "premiumsAligned": "Gold and Silver premiums are aligned - No divergence detected"
};

const multiCommodityTrackerHi = {
    "title": "मल्टी-कमोडिटी ट्रैकर",
    "description": "कई कमोडिटीज में रीयल-टाइम आर्बिट्राज",
    "updated": "अपडेटेड",
    "refreshAll": "सभी रिफ्रेश करें",
    "commodity": "कमोडिटी",
    "comex": "COMEX",
    "mcx": "MCX",
    "fairValue": "फेयर वैल्यू",
    "premium": "प्रीमियम",
    "heatmap": "हीटमैप",
    "signal": "सिग्नल",
    "strongBuy": "स्ट्रॉन्ग बाय",
    "buy": "बाय",
    "strongSell": "स्ट्रॉन्ग सेल",
    "sell": "सेल",
    "neutral": "न्यूट्रल",
    "error": "एरर",
    "estimated": "अनुमानित",
    "crossCommodityAnalysis": "क्रॉस-कमोडिटी एनालिसिस",
    "insufficientData": "एनालिसिस के लिए अपर्याप्त डेटा",
    "goldPremiumHigher": "गोल्ड प्रीमियम सिल्वर से अधिक है - गोल्ड सिल्वर के सापेक्ष करेक्ट हो सकता है",
    "silverPremiumHigher": "सिल्वर प्रीमियम गोल्ड से अधिक है - सिल्वर गोल्ड के सापेक्ष करेक्ट हो सकता है",
    "premiumsAligned": "गोल्ड और सिल्वर प्रीमियम संरेखित हैं - कोई डाइवर्जेंस नहीं"
};

// Arbitrage History Chart translations
const arbitrageHistoryEn = {
    "title": "Historical Arbitrage Data",
    "description": "Premium/discount trends over time",
    "gold": "Gold",
    "silver": "Silver",
    "days7": "7 Days",
    "days30": "30 Days",
    "days90": "90 Days",
    "months6": "6 Months",
    "year1": "1 Year",
    "years2": "2 Years",
    "years5": "5 Years",
    "max": "Max",
    "refresh": "Refresh",
    "recordNow": "Record Now",
    "noHistoricalData": "No Historical Data",
    "noDataMessage": "Start collecting arbitrage data by clicking 'Record Now'. Data will be stored for historical analysis.",
    "recordFirstDataPoint": "Record First Data Point",
    "premiumZone": "Premium Zone",
    "discountZone": "Discount Zone",
    "fairValueZone": "Fair Value Zone",
    "avgPremium": "Avg Premium",
    "stdDeviation": "Std Deviation",
    "minBestBuy": "Min (Best Buy)",
    "maxBestSell": "Max (Best Sell)",
    "signalDistribution": "Signal Distribution",
    "showingDataPoints": "Showing {count} data points",
    "downsampledFrom": "downsampled from {total} for performance",
    "allAvailableData": "all available data",
    "overDays": "over {days} days"
};

const arbitrageHistoryHi = {
    "title": "ऐतिहासिक आर्बिट्राज डेटा",
    "description": "समय के साथ प्रीमियम/डिस्काउंट ट्रेंड",
    "gold": "गोल्ड",
    "silver": "सिल्वर",
    "days7": "7 दिन",
    "days30": "30 दिन",
    "days90": "90 दिन",
    "months6": "6 महीने",
    "year1": "1 साल",
    "years2": "2 साल",
    "years5": "5 साल",
    "max": "अधिकतम",
    "refresh": "रिफ्रेश",
    "recordNow": "अभी रिकॉर्ड करें",
    "noHistoricalData": "कोई ऐतिहासिक डेटा नहीं",
    "noDataMessage": "'अभी रिकॉर्ड करें' पर क्लिक करके आर्बिट्राज डेटा एकत्र करना शुरू करें। डेटा ऐतिहासिक विश्लेषण के लिए संग्रहीत किया जाएगा।",
    "recordFirstDataPoint": "पहला डेटा पॉइंट रिकॉर्ड करें",
    "premiumZone": "प्रीमियम जोन",
    "discountZone": "डिस्काउंट जोन",
    "fairValueZone": "फेयर वैल्यू जोन",
    "avgPremium": "औसत प्रीमियम",
    "stdDeviation": "मानक विचलन",
    "minBestBuy": "न्यूनतम (बेस्ट बाय)",
    "maxBestSell": "अधिकतम (बेस्ट सेल)",
    "signalDistribution": "सिग्नल वितरण",
    "showingDataPoints": "{count} डेटा पॉइंट दिखा रहे हैं",
    "downsampledFrom": "परफॉर्मेंस के लिए {total} से डाउनसैंपल किया गया",
    "allAvailableData": "सभी उपलब्ध डेटा",
    "overDays": "{days} दिनों में"
};

// Arbitrage Heatmap translations
const arbitrageHeatmapEn = {
    "title": "Arbitrage Heatmap",
    "description": "Real-time premium/discount visualization",
    "strongDiscount": "Strong Discount",
    "strongDiscountDesc": "MCX significantly underpriced - Strong long opportunity",
    "discount": "Discount",
    "discountDesc": "MCX underpriced - Potential long opportunity",
    "fairValue": "Fair Value",
    "fairValueDesc": "MCX fairly priced - No significant arbitrage",
    "premium": "Premium",
    "premiumDesc": "MCX overpriced - Watch for reversal",
    "strongPremium": "Strong Premium",
    "strongPremiumDesc": "MCX significantly overpriced - Strong short opportunity",
    "buyMcx": "BUY MCX",
    "considerBuy": "Consider BUY",
    "neutral": "NEUTRAL",
    "considerSell": "Consider SELL",
    "sellMcx": "SELL MCX",
    "premiumPercent": "Premium %",
    "premiumRupees": "Premium ₹",
    "arbitrageScale": "Arbitrage Scale",
    "currentSignal": "Current Signal"
};

const arbitrageHeatmapHi = {
    "title": "आर्बिट्राज हीटमैप",
    "description": "रीयल-टाइम प्रीमियम/डिस्काउंट विज़ुअलाइज़ेशन",
    "strongDiscount": "स्ट्रॉन्ग डिस्काउंट",
    "strongDiscountDesc": "MCX काफी कम मूल्य पर - मजबूत लॉन्ग अवसर",
    "discount": "डिस्काउंट",
    "discountDesc": "MCX कम मूल्य पर - संभावित लॉन्ग अवसर",
    "fairValue": "फेयर वैल्यू",
    "fairValueDesc": "MCX उचित मूल्य पर - कोई महत्वपूर्ण आर्बिट्राज नहीं",
    "premium": "प्रीमियम",
    "premiumDesc": "MCX अधिक मूल्य पर - रिवर्सल देखें",
    "strongPremium": "स्ट्रॉन्ग प्रीमियम",
    "strongPremiumDesc": "MCX काफी अधिक मूल्य पर - मजबूत शॉर्ट अवसर",
    "buyMcx": "MCX खरीदें",
    "considerBuy": "खरीदने पर विचार करें",
    "neutral": "न्यूट्रल",
    "considerSell": "बेचने पर विचार करें",
    "sellMcx": "MCX बेचें",
    "premiumPercent": "प्रीमियम %",
    "premiumRupees": "प्रीमियम ₹",
    "arbitrageScale": "आर्बिट्राज स्केल",
    "currentSignal": "वर्तमान सिग्नल"
};

// Arbitrage Spread Chart translations
const arbitrageSpreadChartEn = {
    "priceComparison": "Price Comparison",
    "priceComparisonDesc": "Fair value vs MCX price analysis",
    "opportunity": "Opportunity",
    "fairValue": "Fair Value",
    "fairValueDesc": "COMEX + Duty + Costs",
    "mcxPrice": "MCX Price",
    "mcxPriceDesc": "Current Market Price",
    "premium": "Premium",
    "discount": "Discount",
    "arbitrageOpportunity": "Arbitrage Opportunity",
    "noOpportunity": "No Opportunity",
    "profitBreakdown": "Profit Breakdown",
    "profitBreakdownDesc": "Detailed profit and cost analysis",
    "grossProfit": "Gross Profit",
    "beforeCosts": "Before costs",
    "brokerage": "Brokerage",
    "tradingFees": "Trading fees",
    "exchangeFees": "Exchange Fees",
    "exchangeCharges": "Exchange charges",
    "tax": "Tax",
    "gstDuties": "GST & duties",
    "netProfit": "Net Profit",
    "finalPnl": "Final P&L",
    "profit": "Profit",
    "costs": "Costs",
    "netResult": "Net Result"
};

const arbitrageSpreadChartHi = {
    "priceComparison": "मूल्य तुलना",
    "priceComparisonDesc": "फेयर वैल्यू बनाम MCX मूल्य विश्लेषण",
    "opportunity": "अवसर",
    "fairValue": "फेयर वैल्यू",
    "fairValueDesc": "COMEX + ड्यूटी + कॉस्ट",
    "mcxPrice": "MCX मूल्य",
    "mcxPriceDesc": "वर्तमान मार्केट मूल्य",
    "premium": "प्रीमियम",
    "discount": "डिस्काउंट",
    "arbitrageOpportunity": "आर्बिट्राज अवसर",
    "noOpportunity": "कोई अवसर नहीं",
    "profitBreakdown": "प्रॉफिट ब्रेकडाउन",
    "profitBreakdownDesc": "विस्तृत प्रॉफिट और कॉस्ट विश्लेषण",
    "grossProfit": "ग्रॉस प्रॉफिट",
    "beforeCosts": "कॉस्ट से पहले",
    "brokerage": "ब्रोकरेज",
    "tradingFees": "ट्रेडिंग फीस",
    "exchangeFees": "एक्सचेंज फीस",
    "exchangeCharges": "एक्सचेंज चार्जेस",
    "tax": "टैक्स",
    "gstDuties": "GST और ड्यूटी",
    "netProfit": "नेट प्रॉफिट",
    "finalPnl": "फाइनल P&L",
    "profit": "प्रॉफिट",
    "costs": "कॉस्ट",
    "netResult": "नेट रिजल्ट"
};

// Merge translations
if (!enJson.pivot) enJson.pivot = {};
if (!hiJson.pivot) hiJson.pivot = {};
if (!enJson.arbitrage) enJson.arbitrage = {};
if (!hiJson.arbitrage) hiJson.arbitrage = {};

// Add pivot levels chart translations
enJson.pivot.levelsChart = pivotLevelsChartEn;
hiJson.pivot.levelsChart = pivotLevelsChartHi;

// Add arbitrage page translations
Object.assign(enJson.arbitrage, arbitrageEn);
Object.assign(hiJson.arbitrage, arbitrageHi);

// Add component translations
enJson.arbitrage.usdinrSensitivity = usdinrSensitivityEn;
hiJson.arbitrage.usdinrSensitivity = usdinrSensitivityHi;

enJson.arbitrage.multiCommodityTracker = multiCommodityTrackerEn;
hiJson.arbitrage.multiCommodityTracker = multiCommodityTrackerHi;

enJson.arbitrage.history = arbitrageHistoryEn;
hiJson.arbitrage.history = arbitrageHistoryHi;

enJson.arbitrage.heatmap = arbitrageHeatmapEn;
hiJson.arbitrage.heatmap = arbitrageHeatmapHi;

enJson.arbitrage.spreadChart = arbitrageSpreadChartEn;
hiJson.arbitrage.spreadChart = arbitrageSpreadChartHi;

// Write files
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2), 'utf8');

console.log('✅ Arbitrage and Pivot Chart translations added successfully!');
console.log('Added translations for:');
console.log('  - Pivot Levels Chart');
console.log('  - Arbitrage page guide');
console.log('  - USDINR Sensitivity');
console.log('  - Multi-Commodity Tracker');
console.log('  - Arbitrage History Chart');
console.log('  - Arbitrage Heatmap');
console.log('  - Arbitrage Spread Chart');
