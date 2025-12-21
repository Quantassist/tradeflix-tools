const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Missing translations for SeasonalStrategyPicker
const missingTranslations = {
    en: {
        // SeasonalStrategyPicker
        prebuiltStrategies: "Pre-built seasonal trading strategies with historical performance",
        strategyBacktesterGuide: "Strategy Backtester Guide",
        testStrategies: "Test seasonal trading strategies with historical data",
        whatIsBacktesting: "What is Strategy Backtesting?",
        backtestingDesc: "Backtesting allows you to test trading strategies against historical data to see how they would have performed in the past.",
        prebuiltStrategiesTitle: "Pre-built Strategies",
        festivalStrategies: "Festival Strategies",
        festivalStrategiesDesc: "Trade around Diwali, Akshaya Tritiya, etc.",
        monthlyStrategies: "Monthly Strategies",
        monthlyStrategiesDesc: "Exploit monthly seasonal patterns",
        economicStrategies: "Economic Strategies",
        economicStrategiesDesc: "Trade around budget, FOMC meetings",
        openFullBacktester: "Open Full Backtester",
        runBacktest: "Run Backtest",

        // seasonal-analysis-charts
        tradingInsights: "Trading Insights",
        keyObservations: "Key observations based on {years} of historical data",
        tradingInsightsGuide: "Trading Insights Guide",
        understandingInsights: "Understanding AI-generated trading insights",
        whatAreTradingInsights: "What are Trading Insights?",
        tradingInsightsDesc: "These are automatically generated observations based on historical seasonal patterns, highlighting the most significant bullish and bearish trends.",
        insightTypes: "Insight Types",
        bullishGreen: "Bullish (Green)",
        bullishDesc: "Historically positive patterns",
        bearishRed: "Bearish (Red)",
        bearishDesc: "Historically negative patterns",
        neutralGray: "Neutral (Gray)",
        neutralDesc: "Informational observations",
        bestMonth: "Best Month",
        worstMonth: "Worst Month",
        avgAnnualReturn: "Avg Annual Return",
        sumOfMonthlyAvgs: "Sum of monthly avgs",
        monthlySeasonality: "Monthly Seasonality",
        monthlySeasonalityLoading: "Monthly Seasonality - {metal} (Loading...)",
        avgMonthlyReturns: "Average monthly returns based on {years} of historical data",
        monthlySeasonalityGuide: "Monthly Seasonality Guide",
        understandingSeasonalPatterns: "Understanding seasonal patterns in precious metals",
        whatIsMonthlySeasonality: "What is Monthly Seasonality?",
        monthlySeasonalityDesc: "Monthly seasonality shows the average price change for each month based on historical data. Positive months (green) historically show gains, while negative months (red) show losses.",
        howToUseData: "How to Use This Data",
        greenBarsIndicate: "Green bars indicate historically bullish months",
        redBarsIndicate: "Red bars indicate historically bearish months",
        winRateShows: "Win rate % shows how often the month was positive",
        useToTimeEntries: "Use this to time entries and exits around seasonal patterns",
        loadingSeasonalityData: "Loading seasonality data...",
        positiveReturn: "Positive Return",
        negativeReturn: "Negative Return",
        majorEventsImpact: "Major Events Impact Analysis",
        historicalPriceImpact: "Historical price impact around major events (±{days} days) • {count} events selected",
        eventImpactGuide: "Event Impact Analysis Guide",
        understandingEventImpact: "Understanding how events affect precious metal prices",
        whatIsEventImpact: "What is Event Impact Analysis?",
        eventImpactDesc: "This analysis shows how precious metal prices historically react around major events like festivals, economic announcements, and holidays within a specified window.",
        keyMetricsExplained: "Key Metrics Explained",
        avgChangeMetric: "Avg Change: Average price movement around the event",
        winRateMetric: "Win Rate: Percentage of times price moved positively",
        bestWorstMetric: "Best/Worst: Maximum gain and loss recorded",
        yearsMetric: "Years: Number of historical occurrences analyzed",
        loadingEventsData: "Loading events data...",
        noEventsSelected: "No events selected",
        useDropdownToAdd: "Use the dropdown above to add events to analyze",
        avgEventReturn: "Avg Event Return",
        dayWindow: "±{days} day window",
        avgWinRate: "Avg Win Rate",
        positiveReturns: "Positive returns",
        bestEvent: "Best Event",
        weakestEvent: "Weakest Event",

        // seasonal-advanced-charts
        selectEventToView: "Select an event to view its trajectory",
        tradingInsightsAdvanced: "Trading Insights",
        bestWorstAnalysis: "Best and worst performing events analysis",
        tradingInsightsGuideAdvanced: "Trading Insights Guide",
        quickReference: "Quick reference for event-based trading decisions",
        whatAreTradingInsightsAdvanced: "What are Trading Insights?",
        tradingInsightsDescAdvanced: "A quick summary of the best and worst performing events, most reliable events by win rate, and most volatile events to help inform your trading decisions.",
        bestPerformingEvents: "Best Performing Events",
        weakestPerformingEvents: "Weakest Performing Events",
        mostReliableEvents: "Most Reliable Events (Win Rate)",
        mostVolatileEvents: "Most Volatile Events",
        readingTheChart: "Reading the Chart",
        blueLineDesc: "Blue Line: Average cumulative return across all years",
        shadedAreaDesc: "Shaded Area: Upper and lower confidence bands",
        day0Desc: "Day 0: The event date (vertical reference line)",
        avgChange: "Avg Change",
        bestReturn: "Best Return",
        worstReturn: "Worst Return"
    },
    hi: {
        // SeasonalStrategyPicker
        prebuiltStrategies: "ऐतिहासिक प्रदर्शन के साथ पूर्व-निर्मित मौसमी ट्रेडिंग रणनीतियाँ",
        strategyBacktesterGuide: "रणनीति बैकटेस्टर गाइड",
        testStrategies: "ऐतिहासिक डेटा के साथ मौसमी ट्रेडिंग रणनीतियों का परीक्षण करें",
        whatIsBacktesting: "रणनीति बैकटेस्टिंग क्या है?",
        backtestingDesc: "बैकटेस्टिंग आपको ऐतिहासिक डेटा के खिलाफ ट्रेडिंग रणनीतियों का परीक्षण करने की अनुमति देती है ताकि यह देखा जा सके कि वे अतीत में कैसा प्रदर्शन करती।",
        prebuiltStrategiesTitle: "पूर्व-निर्मित रणनीतियाँ",
        festivalStrategies: "त्योहार रणनीतियाँ",
        festivalStrategiesDesc: "दिवाली, अक्षय तृतीया आदि के आसपास ट्रेड करें",
        monthlyStrategies: "मासिक रणनीतियाँ",
        monthlyStrategiesDesc: "मासिक मौसमी पैटर्न का लाभ उठाएं",
        economicStrategies: "आर्थिक रणनीतियाँ",
        economicStrategiesDesc: "बजट, FOMC बैठकों के आसपास ट्रेड करें",
        openFullBacktester: "पूर्ण बैकटेस्टर खोलें",
        runBacktest: "बैकटेस्ट चलाएं",

        // seasonal-analysis-charts
        tradingInsights: "ट्रेडिंग इनसाइट्स",
        keyObservations: "{years} ऐतिहासिक डेटा पर आधारित प्रमुख अवलोकन",
        tradingInsightsGuide: "ट्रेडिंग इनसाइट्स गाइड",
        understandingInsights: "AI-जनित ट्रेडिंग इनसाइट्स को समझना",
        whatAreTradingInsights: "ट्रेडिंग इनसाइट्स क्या हैं?",
        tradingInsightsDesc: "ये ऐतिहासिक मौसमी पैटर्न के आधार पर स्वचालित रूप से उत्पन्न अवलोकन हैं, जो सबसे महत्वपूर्ण तेजी और मंदी के रुझानों को उजागर करते हैं।",
        insightTypes: "इनसाइट प्रकार",
        bullishGreen: "तेजी (हरा)",
        bullishDesc: "ऐतिहासिक रूप से सकारात्मक पैटर्न",
        bearishRed: "मंदी (लाल)",
        bearishDesc: "ऐतिहासिक रूप से नकारात्मक पैटर्न",
        neutralGray: "तटस्थ (ग्रे)",
        neutralDesc: "सूचनात्मक अवलोकन",
        bestMonth: "सर्वश्रेष्ठ महीना",
        worstMonth: "सबसे खराब महीना",
        avgAnnualReturn: "औसत वार्षिक रिटर्न",
        sumOfMonthlyAvgs: "मासिक औसत का योग",
        monthlySeasonality: "मासिक मौसमी",
        monthlySeasonalityLoading: "मासिक मौसमी - {metal} (लोड हो रहा है...)",
        avgMonthlyReturns: "{years} ऐतिहासिक डेटा पर आधारित औसत मासिक रिटर्न",
        monthlySeasonalityGuide: "मासिक मौसमी गाइड",
        understandingSeasonalPatterns: "कीमती धातुओं में मौसमी पैटर्न को समझना",
        whatIsMonthlySeasonality: "मासिक मौसमी क्या है?",
        monthlySeasonalityDesc: "मासिक मौसमी ऐतिहासिक डेटा के आधार पर प्रत्येक महीने के लिए औसत मूल्य परिवर्तन दिखाती है। सकारात्मक महीने (हरे) ऐतिहासिक रूप से लाभ दिखाते हैं, जबकि नकारात्मक महीने (लाल) हानि दिखाते हैं।",
        howToUseData: "इस डेटा का उपयोग कैसे करें",
        greenBarsIndicate: "हरी पट्टियाँ ऐतिहासिक रूप से तेजी वाले महीनों को इंगित करती हैं",
        redBarsIndicate: "लाल पट्टियाँ ऐतिहासिक रूप से मंदी वाले महीनों को इंगित करती हैं",
        winRateShows: "जीत दर % दिखाती है कि महीना कितनी बार सकारात्मक था",
        useToTimeEntries: "मौसमी पैटर्न के आसपास प्रवेश और निकास का समय निर्धारित करने के लिए इसका उपयोग करें",
        loadingSeasonalityData: "मौसमी डेटा लोड हो रहा है...",
        positiveReturn: "सकारात्मक रिटर्न",
        negativeReturn: "नकारात्मक रिटर्न",
        majorEventsImpact: "प्रमुख घटनाओं का प्रभाव विश्लेषण",
        historicalPriceImpact: "प्रमुख घटनाओं के आसपास ऐतिहासिक मूल्य प्रभाव (±{days} दिन) • {count} घटनाएं चयनित",
        eventImpactGuide: "घटना प्रभाव विश्लेषण गाइड",
        understandingEventImpact: "समझें कि घटनाएं कीमती धातु की कीमतों को कैसे प्रभावित करती हैं",
        whatIsEventImpact: "घटना प्रभाव विश्लेषण क्या है?",
        eventImpactDesc: "यह विश्लेषण दिखाता है कि कीमती धातु की कीमतें ऐतिहासिक रूप से त्योहारों, आर्थिक घोषणाओं और छुट्टियों जैसी प्रमुख घटनाओं के आसपास कैसे प्रतिक्रिया करती हैं।",
        keyMetricsExplained: "प्रमुख मेट्रिक्स की व्याख्या",
        avgChangeMetric: "औसत परिवर्तन: घटना के आसपास औसत मूल्य गति",
        winRateMetric: "जीत दर: कीमत कितनी बार सकारात्मक रूप से बढ़ी",
        bestWorstMetric: "सर्वश्रेष्ठ/सबसे खराब: अधिकतम लाभ और हानि दर्ज",
        yearsMetric: "वर्ष: विश्लेषित ऐतिहासिक घटनाओं की संख्या",
        loadingEventsData: "घटनाओं का डेटा लोड हो रहा है...",
        noEventsSelected: "कोई घटना चयनित नहीं",
        useDropdownToAdd: "विश्लेषण के लिए घटनाएं जोड़ने के लिए ऊपर ड्रॉपडाउन का उपयोग करें",
        avgEventReturn: "औसत घटना रिटर्न",
        dayWindow: "±{days} दिन विंडो",
        avgWinRate: "औसत जीत दर",
        positiveReturns: "सकारात्मक रिटर्न",
        bestEvent: "सर्वश्रेष्ठ घटना",
        weakestEvent: "सबसे कमजोर घटना",

        // seasonal-advanced-charts
        selectEventToView: "इसकी ट्रैजेक्टरी देखने के लिए एक घटना चुनें",
        tradingInsightsAdvanced: "ट्रेडिंग इनसाइट्स",
        bestWorstAnalysis: "सर्वश्रेष्ठ और सबसे खराब प्रदर्शन करने वाली घटनाओं का विश्लेषण",
        tradingInsightsGuideAdvanced: "ट्रेडिंग इनसाइट्स गाइड",
        quickReference: "घटना-आधारित ट्रेडिंग निर्णयों के लिए त्वरित संदर्भ",
        whatAreTradingInsightsAdvanced: "ट्रेडिंग इनसाइट्स क्या हैं?",
        tradingInsightsDescAdvanced: "सर्वश्रेष्ठ और सबसे खराब प्रदर्शन करने वाली घटनाओं, जीत दर के अनुसार सबसे विश्वसनीय घटनाओं और सबसे अस्थिर घटनाओं का त्वरित सारांश।",
        bestPerformingEvents: "सर्वश्रेष्ठ प्रदर्शन करने वाली घटनाएं",
        weakestPerformingEvents: "सबसे कमजोर प्रदर्शन करने वाली घटनाएं",
        mostReliableEvents: "सबसे विश्वसनीय घटनाएं (जीत दर)",
        mostVolatileEvents: "सबसे अस्थिर घटनाएं",
        readingTheChart: "चार्ट पढ़ना",
        blueLineDesc: "नीली रेखा: सभी वर्षों में औसत संचयी रिटर्न",
        shadedAreaDesc: "छायांकित क्षेत्र: ऊपरी और निचले विश्वास बैंड",
        day0Desc: "दिन 0: घटना तिथि (ऊर्ध्वाधर संदर्भ रेखा)",
        avgChange: "औसत परिवर्तन",
        bestReturn: "सर्वश्रेष्ठ रिटर्न",
        worstReturn: "सबसे खराब रिटर्न"
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

// Ensure seasonal namespace exists
if (!enData.seasonal) enData.seasonal = {};
if (!hiData.seasonal) hiData.seasonal = {};

// Merge translations
deepMerge(enData.seasonal, missingTranslations.en);
deepMerge(hiData.seasonal, missingTranslations.hi);

// Write back
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2), 'utf8');

console.log('✅ Missing seasonal translations added successfully!');
