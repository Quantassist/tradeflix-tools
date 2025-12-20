const fs = require('fs');
const path = require('path');

// Paths to translation files
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

// Read existing translations
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Add missing arbitrage page translations
const arbitragePageTranslations = {
    en: {
        fetchingPrices: "Fetching Live Prices from COMEX & MCX...",
        autoFetch: "Auto-Fetch COMEX, MCX & USD/INR",
        priceData: "Price Data",
        comexLabel: "COMEX ($/oz)",
        mcxLabel: "MCX (₹/10g)",
        usdinrLabel: "USD/INR Rate",
        parameters: "Parameters",
        importDutyLabel: "Import Duty (%)",
        quoteUnitLabel: "Quote Unit (g)",
        liveMarketAnalysis: "Live market opportunity analysis",
        recommendation: "Recommendation",
        risk: "Risk",
        mcxPrice: "MCX Price",
        fairValue: "Fair Value",
        premium: "Premium",
        fairValueCalculation: "Fair Value Calculation",
        comexPrice: "COMEX Price",
        usdinrRate: "USD/INR Rate",
        pricePerGram: "Price per Gram",
        importDuty: "Import Duty",
        profitAnalysis: "Profit Analysis",
        grossProfit: "Gross Profit",
        totalCosts: "Total Costs",
        netProfit: "Net Profit",
        netProfitPercent: "Net Profit %",
        enterValues: "Enter values and calculate",
        toSeeAnalysis: "to see arbitrage analysis"
    },
    hi: {
        fetchingPrices: "COMEX और MCX से लाइव कीमतें प्राप्त कर रहे हैं...",
        autoFetch: "COMEX, MCX और USD/INR स्वचालित प्राप्त करें",
        priceData: "मूल्य डेटा",
        comexLabel: "COMEX ($/oz)",
        mcxLabel: "MCX (₹/10g)",
        usdinrLabel: "USD/INR दर",
        parameters: "पैरामीटर",
        importDutyLabel: "आयात शुल्क (%)",
        quoteUnitLabel: "कोट यूनिट (g)",
        liveMarketAnalysis: "लाइव बाजार अवसर विश्लेषण",
        recommendation: "सिफारिश",
        risk: "जोखिम",
        mcxPrice: "MCX मूल्य",
        fairValue: "उचित मूल्य",
        premium: "प्रीमियम",
        fairValueCalculation: "उचित मूल्य गणना",
        comexPrice: "COMEX मूल्य",
        usdinrRate: "USD/INR दर",
        pricePerGram: "प्रति ग्राम मूल्य",
        importDuty: "आयात शुल्क",
        profitAnalysis: "लाभ विश्लेषण",
        grossProfit: "सकल लाभ",
        totalCosts: "कुल लागत",
        netProfit: "शुद्ध लाभ",
        netProfitPercent: "शुद्ध लाभ %",
        enterValues: "मान दर्ज करें और गणना करें",
        toSeeAnalysis: "आर्बिट्राज विश्लेषण देखने के लिए"
    }
};

// Correlation page translations
const correlationTranslations = {
    en: {
        pageTitle: "Correlation Matrix",
        pageSubtitle: "Multi-Asset Correlation Analysis",
        headerDescription: "Analyze correlation between multiple assets to build a well-diversified portfolio",
        understandingCorrelation: "Understanding Correlation Analysis",
        guide: "Guide",
        learnCorrelation: "Learn how correlation values help build diversified portfolios",
        showGuide: "Show Guide",
        hideGuide: "Hide Guide",
        positiveCorrelation: "+1 Correlation",
        positiveCorrelationDesc: "Perfect positive - assets move together in the same direction.",
        zeroCorrelation: "0 Correlation",
        zeroCorrelationDesc: "No relationship - assets move independently of each other.",
        negativeCorrelation: "-1 Correlation",
        negativeCorrelationDesc: "Perfect negative - assets move in opposite directions.",
        diversification: "Diversification",
        diversificationDesc: "Low correlation between assets provides better risk reduction.",
        inputParameters: "Input Parameters",
        inputDescription: "Enter assets and time period",
        assets: "Assets",
        assetsLabel: "Assets (comma-separated)",
        assetsHint: "Enter 2-5 asset symbols separated by commas",
        parametersLabel: "Parameters",
        periodLabel: "Period (days)",
        analyzingCorrelations: "Analyzing Correlations...",
        calculateCorrelation: "Calculate Correlation",
        correlationMatrix: "Correlation Matrix",
        assetsAnalyzed: "assets analyzed",
        resultsDescription: "Results will appear here after calculation",
        period: "Period",
        strongPositive: "Strong Positive (>0.7)",
        moderate: "Moderate (0.3-0.7)",
        weak: "Weak (-0.3 to 0.3)",
        moderateNegative: "Moderate Negative (-0.7 to -0.3)",
        strongNegative: "Strong Negative (<-0.7)",
        enterAssetsCalculate: "Enter assets and calculate",
        toSeeMatrix: "to see correlation matrix",
        rolling: "Rolling",
        beta: "Beta",
        multiPeriod: "Multi-Period",
        diversificationTab: "Diversification",
        signals: "Signals",

        // Rolling correlation section
        rollingCorrelationAnalysis: "Rolling Correlation Analysis",
        rollingDescription: "Track how correlation changes over time between two assets",
        asset1: "Asset 1",
        asset2: "Asset 2",
        windowDays: "Window (days)",
        periodDays: "Period (days)",
        calculate: "Calculate",

        // Heatmap
        heatmap: {
            title: "Correlation Heatmap",
            description: "Visual representation of asset correlations",
            avgCorrelation: "Avg Correlation",
            strongLinks: "Strong Links",
            correlationStrengthGuide: "Correlation Strength Guide:",
            strongPositive: "Strong +",
            moderatePositive: "Moderate +",
            weak: "Weak",
            moderateNegative: "Moderate -",
            strongNegative: "Strong -",
            keyInsights: "Key Insights:",
            positiveCorrelation: "Positive correlation:",
            positiveCorrelationDesc: "Assets move in the same direction",
            negativeCorrelation: "Negative correlation:",
            negativeCorrelationDesc: "Assets move in opposite directions",
            strongCorrelations: "Strong correlations (>0.7):",
            strongCorrelationsDesc: "Highlighted with yellow border",
            diversificationTip: "Diversification tip:",
            diversificationTipDesc: "Choose assets with low or negative correlation",
            veryStrong: "Very Strong",
            strong: "Strong",
            moderateLabel: "Moderate",
            weakLabel: "Weak"
        },

        // Rolling correlation chart
        rollingChart: {
            title: "Rolling Correlation",
            description: "day rolling window over",
            days: "days",
            current: "Current",
            average: "Average",
            max: "Max",
            min: "Min",
            range: "Range",
            currentRegime: "Current Regime",
            strongPositive: "Strong Positive",
            moderatePositive: "Moderate Positive",
            weakNeutral: "Weak/Neutral",
            moderateNegative: "Moderate Negative",
            strongNegative: "Strong Negative",
            strongPositiveThreshold: "Strong Positive (≥0.7)",
            neutral: "Neutral (0)",
            strongNegativeThreshold: "Strong Negative (≤-0.7)",
            timePeriod: "Time Period",
            regimeChangesDetected: "Regime Changes Detected",
            highCorrelationVolatility: "High Correlation Volatility",
            volatilityWarning: "The correlation between these assets has varied significantly (range:",
            volatilityWarningEnd: "). This relationship may be unstable and less reliable for trading decisions.",
            interpretation: "Interpretation",
            currentVsAverage: "Current vs Average:",
            above: "Above",
            below: "Below",
            historicalAverageBy: "historical average by",
            stability: "Stability:",
            unstableRelationship: "Unstable relationship - use with caution",
            stableRelationship: "Relatively stable relationship",
            regime: "Regime:",
            currentlyIn: "Currently in",
            correlationRegime: "correlation regime"
        },

        // Beta calculator
        betaCalculator: {
            title: "Beta (Sensitivity) Calculator",
            description: "Calculate how much an asset moves relative to a benchmark",
            asset: "Asset",
            benchmark: "Benchmark",
            period: "Period",
            days30: "30 days",
            days60: "60 days",
            days90: "90 days",
            days180: "180 days",
            year1: "1 year",
            calculate: "Calculate",
            betaValue: "Beta Value",
            sensitivity: "Sensitivity",
            veryHigh: "Very High",
            high: "High",
            similar: "Similar",
            lower: "Lower",
            low: "Low",
            rSquared: "R² (Explained)",
            varianceExplained: "Variance explained by benchmark",
            correlation: "Correlation",
            linearRelationship: "Linear relationship strength",
            volRatio: "Vol Ratio",
            relativeVolatility: "Relative volatility",
            analysis: "Analysis",
            scenarioCalculator: "Scenario Calculator",
            ifMoves: "If",
            moves: "moves",
            enterPercent: "Enter %",
            calculateBeta: "Calculate Beta",
            selectAssetsAnalyze: "Select assets and click Calculate to analyze"
        },

        // Multi-period comparison
        multiPeriodComparison: {
            title: "Multi-Period Correlation Analysis",
            description: "Compare correlation across different time periods (30d, 90d, 6m, 1y)",
            asset1: "Asset 1",
            asset2: "Asset 2",
            compare: "Compare",
            days30: "30 Days",
            days90: "90 Days",
            months6: "6 Months",
            year1: "1 Year",
            trendAnalysis: "Trend Analysis",
            strengthening: "Strengthening",
            weakening: "Weakening",
            stable: "Stable",
            period: "Period",
            correlation: "Correlation",
            strength: "Strength",
            dateRange: "Date Range",
            keyInsights: "Key Insights",
            shortTerm: "Short-term (30d):",
            longTerm: "Long-term (1y):",
            strongerThanNorm: "Relationship stronger than historical norm - may revert to mean",
            weakerThanNorm: "Relationship weaker than historical norm - watch for regime change",
            compareTimePeriods: "Compare Time Periods",
            selectAssetsCompare: "Select two assets and click Compare to analyze"
        },

        // Diversification analysis
        diversificationAnalysis: {
            title: "Portfolio Diversification Analysis",
            description: "Analyze how well your portfolio assets are diversified",
            selectedAssets: "Selected Assets:",
            addAsset: "+ Add Asset",
            days30: "30 days",
            days60: "60 days",
            days90: "90 days",
            days180: "180 days",
            year1: "1 year",
            analyze: "Analyze",
            outOf100: "out of 100",
            avgCorrelation: "Avg Correlation",
            highLessDiverse: "High - Less diverse",
            lowWellDiverse: "Low - Well diverse",
            maxCorrelation: "Max Correlation",
            highestPairCorrelation: "Highest pair correlation",
            minCorrelation: "Min Correlation",
            lowestPairCorrelation: "Lowest pair correlation",
            recommendations: "Recommendations",
            portfolioSummary: "Portfolio Summary",
            assets: "Assets:",
            score: "Score:",
            riskLevel: "Risk Level:",
            high: "High",
            moderate: "Moderate",
            low: "Low",
            analyzeDiversification: "Analyze Diversification",
            addAssetsAnalyze: "Add assets and click Analyze to check portfolio health"
        },

        // Trading signals
        tradingSignals: {
            title: "Correlation-Based Trading Signals",
            description: "Generate trading signals based on divergence, lead-lag, and correlation analysis",
            asset1: "Asset 1",
            asset2: "Asset 2",
            historyDays: "History (days)",
            lookbackDays: "Lookback (days)",
            generate: "Generate",
            confidence: "confidence",
            signalsDetected: "signal(s) detected",
            correlation: "Correlation",
            beta: "Beta",
            zScore: "Z-Score",
            divergence: "Divergence",
            yes: "Yes",
            no: "No",
            divergenceAnalysis: "Divergence Analysis",
            expectedMove: "Expected Move:",
            actualMove: "Actual Move:",
            difference: "Difference:",
            leadLagAnalysis: "Lead-Lag Analysis",
            leadingAsset: "Leading Asset:",
            lagPeriod: "Lag Period:",
            days: "day(s)",
            activeSignals: "Active Signals",
            generateTradingSignals: "Generate Trading Signals",
            selectAssetsGenerate: "Select assets and click Generate to analyze"
        }
    },
    hi: {
        pageTitle: "सहसंबंध मैट्रिक्स",
        pageSubtitle: "बहु-परिसंपत्ति सहसंबंध विश्लेषण",
        headerDescription: "विविध पोर्टफोलियो बनाने के लिए कई परिसंपत्तियों के बीच सहसंबंध का विश्लेषण करें",
        understandingCorrelation: "सहसंबंध विश्लेषण को समझना",
        guide: "गाइड",
        learnCorrelation: "जानें कि सहसंबंध मूल्य विविध पोर्टफोलियो बनाने में कैसे मदद करते हैं",
        showGuide: "गाइड दिखाएं",
        hideGuide: "गाइड छुपाएं",
        positiveCorrelation: "+1 सहसंबंध",
        positiveCorrelationDesc: "पूर्ण सकारात्मक - परिसंपत्तियां एक ही दिशा में चलती हैं।",
        zeroCorrelation: "0 सहसंबंध",
        zeroCorrelationDesc: "कोई संबंध नहीं - परिसंपत्तियां स्वतंत्र रूप से चलती हैं।",
        negativeCorrelation: "-1 सहसंबंध",
        negativeCorrelationDesc: "पूर्ण नकारात्मक - परिसंपत्तियां विपरीत दिशाओं में चलती हैं।",
        diversification: "विविधीकरण",
        diversificationDesc: "परिसंपत्तियों के बीच कम सहसंबंध बेहतर जोखिम कमी प्रदान करता है।",
        inputParameters: "इनपुट पैरामीटर",
        inputDescription: "परिसंपत्तियां और समय अवधि दर्ज करें",
        assets: "परिसंपत्तियां",
        assetsLabel: "परिसंपत्तियां (अल्पविराम से अलग)",
        assetsHint: "अल्पविराम से अलग 2-5 परिसंपत्ति प्रतीक दर्ज करें",
        parametersLabel: "पैरामीटर",
        periodLabel: "अवधि (दिन)",
        analyzingCorrelations: "सहसंबंध विश्लेषण कर रहे हैं...",
        calculateCorrelation: "सहसंबंध गणना करें",
        correlationMatrix: "सहसंबंध मैट्रिक्स",
        assetsAnalyzed: "परिसंपत्तियों का विश्लेषण किया गया",
        resultsDescription: "गणना के बाद परिणाम यहां दिखाई देंगे",
        period: "अवधि",
        strongPositive: "मजबूत सकारात्मक (>0.7)",
        moderate: "मध्यम (0.3-0.7)",
        weak: "कमजोर (-0.3 से 0.3)",
        moderateNegative: "मध्यम नकारात्मक (-0.7 से -0.3)",
        strongNegative: "मजबूत नकारात्मक (<-0.7)",
        enterAssetsCalculate: "परिसंपत्तियां दर्ज करें और गणना करें",
        toSeeMatrix: "सहसंबंध मैट्रिक्स देखने के लिए",
        rolling: "रोलिंग",
        beta: "बीटा",
        multiPeriod: "बहु-अवधि",
        diversificationTab: "विविधीकरण",
        signals: "सिग्नल",

        // Rolling correlation section
        rollingCorrelationAnalysis: "रोलिंग सहसंबंध विश्लेषण",
        rollingDescription: "दो परिसंपत्तियों के बीच समय के साथ सहसंबंध कैसे बदलता है ट्रैक करें",
        asset1: "परिसंपत्ति 1",
        asset2: "परिसंपत्ति 2",
        windowDays: "विंडो (दिन)",
        periodDays: "अवधि (दिन)",
        calculate: "गणना करें",

        // Heatmap
        heatmap: {
            title: "सहसंबंध हीटमैप",
            description: "परिसंपत्ति सहसंबंधों का दृश्य प्रतिनिधित्व",
            avgCorrelation: "औसत सहसंबंध",
            strongLinks: "मजबूत लिंक",
            correlationStrengthGuide: "सहसंबंध शक्ति गाइड:",
            strongPositive: "मजबूत +",
            moderatePositive: "मध्यम +",
            weak: "कमजोर",
            moderateNegative: "मध्यम -",
            strongNegative: "मजबूत -",
            keyInsights: "मुख्य अंतर्दृष्टि:",
            positiveCorrelation: "सकारात्मक सहसंबंध:",
            positiveCorrelationDesc: "परिसंपत्तियां एक ही दिशा में चलती हैं",
            negativeCorrelation: "नकारात्मक सहसंबंध:",
            negativeCorrelationDesc: "परिसंपत्तियां विपरीत दिशाओं में चलती हैं",
            strongCorrelations: "मजबूत सहसंबंध (>0.7):",
            strongCorrelationsDesc: "पीले बॉर्डर से हाइलाइट",
            diversificationTip: "विविधीकरण टिप:",
            diversificationTipDesc: "कम या नकारात्मक सहसंबंध वाली परिसंपत्तियां चुनें",
            veryStrong: "बहुत मजबूत",
            strong: "मजबूत",
            moderateLabel: "मध्यम",
            weakLabel: "कमजोर"
        },

        // Rolling correlation chart
        rollingChart: {
            title: "रोलिंग सहसंबंध",
            description: "दिन की रोलिंग विंडो",
            days: "दिनों में",
            current: "वर्तमान",
            average: "औसत",
            max: "अधिकतम",
            min: "न्यूनतम",
            range: "रेंज",
            currentRegime: "वर्तमान व्यवस्था",
            strongPositive: "मजबूत सकारात्मक",
            moderatePositive: "मध्यम सकारात्मक",
            weakNeutral: "कमजोर/तटस्थ",
            moderateNegative: "मध्यम नकारात्मक",
            strongNegative: "मजबूत नकारात्मक",
            strongPositiveThreshold: "मजबूत सकारात्मक (≥0.7)",
            neutral: "तटस्थ (0)",
            strongNegativeThreshold: "मजबूत नकारात्मक (≤-0.7)",
            timePeriod: "समय अवधि",
            regimeChangesDetected: "व्यवस्था परिवर्तन पाए गए",
            highCorrelationVolatility: "उच्च सहसंबंध अस्थिरता",
            volatilityWarning: "इन परिसंपत्तियों के बीच सहसंबंध में काफी भिन्नता है (रेंज:",
            volatilityWarningEnd: ")। यह संबंध अस्थिर हो सकता है।",
            interpretation: "व्याख्या",
            currentVsAverage: "वर्तमान बनाम औसत:",
            above: "ऊपर",
            below: "नीचे",
            historicalAverageBy: "ऐतिहासिक औसत से",
            stability: "स्थिरता:",
            unstableRelationship: "अस्थिर संबंध - सावधानी से उपयोग करें",
            stableRelationship: "अपेक्षाकृत स्थिर संबंध",
            regime: "व्यवस्था:",
            currentlyIn: "वर्तमान में",
            correlationRegime: "सहसंबंध व्यवस्था में"
        },

        // Beta calculator
        betaCalculator: {
            title: "बीटा (संवेदनशीलता) कैलकुलेटर",
            description: "गणना करें कि एक परिसंपत्ति बेंचमार्क के सापेक्ष कितना चलती है",
            asset: "परिसंपत्ति",
            benchmark: "बेंचमार्क",
            period: "अवधि",
            days30: "30 दिन",
            days60: "60 दिन",
            days90: "90 दिन",
            days180: "180 दिन",
            year1: "1 वर्ष",
            calculate: "गणना करें",
            betaValue: "बीटा मूल्य",
            sensitivity: "संवेदनशीलता",
            veryHigh: "बहुत उच्च",
            high: "उच्च",
            similar: "समान",
            lower: "कम",
            low: "निम्न",
            rSquared: "R² (व्याख्यात्मक)",
            varianceExplained: "बेंचमार्क द्वारा व्याख्यात्मक विचरण",
            correlation: "सहसंबंध",
            linearRelationship: "रैखिक संबंध शक्ति",
            volRatio: "वॉल अनुपात",
            relativeVolatility: "सापेक्ष अस्थिरता",
            analysis: "विश्लेषण",
            scenarioCalculator: "परिदृश्य कैलकुलेटर",
            ifMoves: "अगर",
            moves: "चलता है",
            enterPercent: "% दर्ज करें",
            calculateBeta: "बीटा गणना करें",
            selectAssetsAnalyze: "परिसंपत्तियां चुनें और विश्लेषण के लिए गणना करें पर क्लिक करें"
        },

        // Multi-period comparison
        multiPeriodComparison: {
            title: "बहु-अवधि सहसंबंध विश्लेषण",
            description: "विभिन्न समय अवधियों में सहसंबंध की तुलना करें (30d, 90d, 6m, 1y)",
            asset1: "परिसंपत्ति 1",
            asset2: "परिसंपत्ति 2",
            compare: "तुलना करें",
            days30: "30 दिन",
            days90: "90 दिन",
            months6: "6 महीने",
            year1: "1 वर्ष",
            trendAnalysis: "ट्रेंड विश्लेषण",
            strengthening: "मजबूत हो रहा है",
            weakening: "कमजोर हो रहा है",
            stable: "स्थिर",
            period: "अवधि",
            correlation: "सहसंबंध",
            strength: "शक्ति",
            dateRange: "तारीख सीमा",
            keyInsights: "मुख्य अंतर्दृष्टि",
            shortTerm: "अल्पकालिक (30d):",
            longTerm: "दीर्घकालिक (1y):",
            strongerThanNorm: "ऐतिहासिक मानदंड से मजबूत संबंध - माध्य पर वापस आ सकता है",
            weakerThanNorm: "ऐतिहासिक मानदंड से कमजोर संबंध - व्यवस्था परिवर्तन के लिए देखें",
            compareTimePeriods: "समय अवधियों की तुलना करें",
            selectAssetsCompare: "दो परिसंपत्तियां चुनें और विश्लेषण के लिए तुलना करें पर क्लिक करें"
        },

        // Diversification analysis
        diversificationAnalysis: {
            title: "पोर्टफोलियो विविधीकरण विश्लेषण",
            description: "विश्लेषण करें कि आपकी पोर्टफोलियो परिसंपत्तियां कितनी विविध हैं",
            selectedAssets: "चयनित परिसंपत्तियां:",
            addAsset: "+ परिसंपत्ति जोड़ें",
            days30: "30 दिन",
            days60: "60 दिन",
            days90: "90 दिन",
            days180: "180 दिन",
            year1: "1 वर्ष",
            analyze: "विश्लेषण करें",
            outOf100: "100 में से",
            avgCorrelation: "औसत सहसंबंध",
            highLessDiverse: "उच्च - कम विविध",
            lowWellDiverse: "निम्न - अच्छी तरह विविध",
            maxCorrelation: "अधिकतम सहसंबंध",
            highestPairCorrelation: "उच्चतम जोड़ी सहसंबंध",
            minCorrelation: "न्यूनतम सहसंबंध",
            lowestPairCorrelation: "न्यूनतम जोड़ी सहसंबंध",
            recommendations: "सिफारिशें",
            portfolioSummary: "पोर्टफोलियो सारांश",
            assets: "परिसंपत्तियां:",
            score: "स्कोर:",
            riskLevel: "जोखिम स्तर:",
            high: "उच्च",
            moderate: "मध्यम",
            low: "निम्न",
            analyzeDiversification: "विविधीकरण विश्लेषण करें",
            addAssetsAnalyze: "परिसंपत्तियां जोड़ें और पोर्टफोलियो स्वास्थ्य जांचने के लिए विश्लेषण करें पर क्लिक करें"
        },

        // Trading signals
        tradingSignals: {
            title: "सहसंबंध-आधारित ट्रेडिंग सिग्नल",
            description: "विचलन, लीड-लैग और सहसंबंध विश्लेषण के आधार पर ट्रेडिंग सिग्नल उत्पन्न करें",
            asset1: "परिसंपत्ति 1",
            asset2: "परिसंपत्ति 2",
            historyDays: "इतिहास (दिन)",
            lookbackDays: "लुकबैक (दिन)",
            generate: "उत्पन्न करें",
            confidence: "विश्वास",
            signalsDetected: "सिग्नल पाए गए",
            correlation: "सहसंबंध",
            beta: "बीटा",
            zScore: "Z-स्कोर",
            divergence: "विचलन",
            yes: "हां",
            no: "नहीं",
            divergenceAnalysis: "विचलन विश्लेषण",
            expectedMove: "अपेक्षित चाल:",
            actualMove: "वास्तविक चाल:",
            difference: "अंतर:",
            leadLagAnalysis: "लीड-लैग विश्लेषण",
            leadingAsset: "अग्रणी परिसंपत्ति:",
            lagPeriod: "लैग अवधि:",
            days: "दिन",
            activeSignals: "सक्रिय सिग्नल",
            generateTradingSignals: "ट्रेडिंग सिग्नल उत्पन्न करें",
            selectAssetsGenerate: "परिसंपत्तियां चुनें और विश्लेषण के लिए उत्पन्न करें पर क्लिक करें"
        }
    }
};

// Merge arbitrage page translations
if (!enData.arbitrage) enData.arbitrage = {};
if (!hiData.arbitrage) hiData.arbitrage = {};

Object.assign(enData.arbitrage, arbitragePageTranslations.en);
Object.assign(hiData.arbitrage, arbitragePageTranslations.hi);

// Merge correlation translations
if (!enData.correlation) enData.correlation = {};
if (!hiData.correlation) hiData.correlation = {};

// Deep merge for correlation
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

deepMerge(enData.correlation, correlationTranslations.en);
deepMerge(hiData.correlation, correlationTranslations.hi);

// Write updated translations
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2), 'utf8');

console.log('✅ Correlation and arbitrage page translations added successfully!');
console.log('   - Added arbitrage page form/result translations');
console.log('   - Added correlation page translations');
console.log('   - Added correlation heatmap translations');
console.log('   - Added rolling correlation chart translations');
console.log('   - Added beta calculator translations');
console.log('   - Added multi-period comparison translations');
console.log('   - Added diversification analysis translations');
console.log('   - Added trading signals translations');
