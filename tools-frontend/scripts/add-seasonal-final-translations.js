const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const hiPath = path.join(__dirname, '..', 'messages', 'hi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

// Missing translations for seasonal-analysis-charts
const missingTranslations = {
    en: {
        // Event Impact Analysis Guide (L662-L701)
        eventImpactGuide: "Event Impact Analysis Guide",
        understandingEventImpact: "Understanding how events affect precious metal prices",
        whatIsEventImpact: "What is Event Impact Analysis?",
        eventImpactDesc: "This analysis shows how precious metal prices historically react around major events like festivals, economic announcements, and holidays within a specified window.",
        keyMetricsExplained: "Key Metrics Explained",
        avgChangeMetric: "Avg Change: Average price movement around the event",
        winRateMetric: "Win Rate: Percentage of times price moved positively",
        bestWorstMetric: "Best/Worst: Maximum gain and loss recorded",
        yearsMetric: "Years: Number of historical occurrences analyzed",

        // Loading and empty states
        loadingEventsData: "Loading events data...",
        noEventsSelected: "No events selected",
        useDropdownToAdd: "Use the dropdown above to add events to analyze",

        // Summary stats
        avgEventReturn: "Avg Event Return",
        dayWindow: "±{days} day window",
        avgWinRate: "Avg Win Rate",
        positiveReturns: "Positive returns",
        bestEvent: "Best Event",
        weakestEvent: "Weakest Event",

        // Event details section
        eventDetails: "Event Details",
        winRateLabel: "Win Rate",
        yearsLabel: "years",
        analysisWindow: "Analysis window: ±{days} days around event",

        // Table headers
        eventHeader: "Event",
        dateHeader: "Date",
        avgChangeHeader: "Avg Change",
        winRateHeader: "Win Rate",
        bestHeader: "Best",
        worstHeader: "Worst",
        volatilityHeader: "Volatility ↑",
        yearsHeader: "Years",

        // Year-wise Performance (L949-L1125)
        yearWisePerformance: "Year-wise Performance Analysis",
        yearWiseDescription: "{metal}'s Performance ({currency}): ±{days} days Pre and Post Event",
        yearWiseGuide: "Year-wise Performance Guide",
        understandingYearWise: "Understanding historical event performance by year",
        whatIsYearWise: "What is Year-wise Performance?",
        yearWiseDesc: "This chart shows how prices moved before (Pre) and after (Post) a specific event for each historical year, helping identify consistent patterns.",
        readingTheChartYearWise: "Reading the Chart",
        preEventBlue: "Pre-Event (Blue): Price change in days leading up to the event",
        postEventPurple: "Post-Event (Purple): Price change in days after the event",
        consistentPatterns: "Consistent patterns across years suggest reliable trading opportunities",
        noYearlyData: "No yearly data available for this event",
        preEvent: "Pre-Event",
        postEvent: "Post-Event",
        preEventLegend: "Pre-Event ({days} days before)",
        postEventLegend: "Post-Event ({days} days after)"
    },
    hi: {
        // Event Impact Analysis Guide (L662-L701)
        eventImpactGuide: "घटना प्रभाव विश्लेषण गाइड",
        understandingEventImpact: "समझें कि घटनाएं कीमती धातु की कीमतों को कैसे प्रभावित करती हैं",
        whatIsEventImpact: "घटना प्रभाव विश्लेषण क्या है?",
        eventImpactDesc: "यह विश्लेषण दिखाता है कि कीमती धातु की कीमतें ऐतिहासिक रूप से त्योहारों, आर्थिक घोषणाओं और छुट्टियों जैसी प्रमुख घटनाओं के आसपास कैसे प्रतिक्रिया करती हैं।",
        keyMetricsExplained: "प्रमुख मेट्रिक्स की व्याख्या",
        avgChangeMetric: "औसत परिवर्तन: घटना के आसपास औसत मूल्य गति",
        winRateMetric: "जीत दर: कीमत कितनी बार सकारात्मक रूप से बढ़ी",
        bestWorstMetric: "सर्वश्रेष्ठ/सबसे खराब: अधिकतम लाभ और हानि दर्ज",
        yearsMetric: "वर्ष: विश्लेषित ऐतिहासिक घटनाओं की संख्या",

        // Loading and empty states
        loadingEventsData: "घटनाओं का डेटा लोड हो रहा है...",
        noEventsSelected: "कोई घटना चयनित नहीं",
        useDropdownToAdd: "विश्लेषण के लिए घटनाएं जोड़ने के लिए ऊपर ड्रॉपडाउन का उपयोग करें",

        // Summary stats
        avgEventReturn: "औसत घटना रिटर्न",
        dayWindow: "±{days} दिन विंडो",
        avgWinRate: "औसत जीत दर",
        positiveReturns: "सकारात्मक रिटर्न",
        bestEvent: "सर्वश्रेष्ठ घटना",
        weakestEvent: "सबसे कमजोर घटना",

        // Event details section
        eventDetails: "घटना विवरण",
        winRateLabel: "जीत दर",
        yearsLabel: "वर्ष",
        analysisWindow: "विश्लेषण विंडो: घटना के आसपास ±{days} दिन",

        // Table headers
        eventHeader: "घटना",
        dateHeader: "तारीख",
        avgChangeHeader: "औसत परिवर्तन",
        winRateHeader: "जीत दर",
        bestHeader: "सर्वश्रेष्ठ",
        worstHeader: "सबसे खराब",
        volatilityHeader: "अस्थिरता ↑",
        yearsHeader: "वर्ष",

        // Year-wise Performance (L949-L1125)
        yearWisePerformance: "वर्षवार प्रदर्शन विश्लेषण",
        yearWiseDescription: "{metal} का प्रदर्शन ({currency}): ±{days} दिन घटना से पहले और बाद",
        yearWiseGuide: "वर्षवार प्रदर्शन गाइड",
        understandingYearWise: "वर्ष के अनुसार ऐतिहासिक घटना प्रदर्शन को समझना",
        whatIsYearWise: "वर्षवार प्रदर्शन क्या है?",
        yearWiseDesc: "यह चार्ट दिखाता है कि प्रत्येक ऐतिहासिक वर्ष के लिए किसी विशिष्ट घटना से पहले (Pre) और बाद (Post) में कीमतें कैसे बढ़ीं, जिससे सुसंगत पैटर्न की पहचान करने में मदद मिलती है।",
        readingTheChartYearWise: "चार्ट पढ़ना",
        preEventBlue: "घटना से पहले (नीला): घटना तक के दिनों में मूल्य परिवर्तन",
        postEventPurple: "घटना के बाद (बैंगनी): घटना के बाद के दिनों में मूल्य परिवर्तन",
        consistentPatterns: "वर्षों में सुसंगत पैटर्न विश्वसनीय ट्रेडिंग अवसरों का सुझाव देते हैं",
        noYearlyData: "इस घटना के लिए कोई वार्षिक डेटा उपलब्ध नहीं",
        preEvent: "घटना से पहले",
        postEvent: "घटना के बाद",
        preEventLegend: "घटना से पहले ({days} दिन पहले)",
        postEventLegend: "घटना के बाद ({days} दिन बाद)"
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

console.log('✅ Final seasonal translations added successfully!');
