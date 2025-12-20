const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../messages/en.json');

// Read existing file
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Fix landing.tools to use object structure for features (matching hi.json)
enJson.landing.tools = {
    "backtest": {
        "name": "Backtest Engine",
        "description": "Strategy Validation",
        "details": "Test your Gold & Silver strategies against 10+ years of data. Know your edge before risking real capital.",
        "features": {
            "simulation": "Historical Simulation",
            "metrics": "Performance Metrics",
            "drawdown": "Drawdown Analysis"
        }
    },
    "pivot": {
        "name": "Pivot Calculator",
        "description": "Intraday S/R Levels",
        "details": "Generate CPR, Floor, and Fibonacci pivots instantly. Know exactly where price is likely to reverse or break.",
        "features": {
            "cpr": "Central Pivot Range",
            "fibonacci": "Fibonacci Levels",
            "multiTimeframe": "Multi-timeframe"
        }
    },
    "arbitrage": {
        "name": "Arbitrage Heatmap",
        "description": "COMEX vs MCX",
        "details": "Spot when MCX is overpriced or underpriced vs COMEX. Capture pricing inefficiencies before they disappear.",
        "features": {
            "fairValue": "Fair Value Calculator",
            "alerts": "Premium Alerts",
            "historical": "Historical Spreads"
        }
    },
    "correlation": {
        "name": "Correlation Matrix",
        "description": "Multi-Asset Analysis",
        "details": "Understand how Gold moves with USDINR, DXY, and Crude. Find divergence trades and hedge positions.",
        "features": {
            "realtime": "Cross-Asset Correlations",
            "beta": "Beta Sensitivity",
            "divergence": "Divergence Alerts"
        }
    },
    "seasonal": {
        "name": "Seasonal Trends",
        "description": "Calendar Patterns",
        "details": "Know how Gold behaves around Diwali, Akshaya Tritiya, Fed meetings. Trade with historical probabilities on your side.",
        "features": {
            "festival": "Festival Analysis",
            "economic": "Event Tracking",
            "winRate": "Win Rate Stats"
        }
    },
    "cot": {
        "name": "COT Report",
        "description": "Smart Money Positioning",
        "details": "See what hedge funds and commercials are doing. Identify extreme positioning that precedes major moves.",
        "features": {
            "position": "Position Visualization",
            "percentile": "Percentile Rankings",
            "contrarian": "Contrarian Signals"
        }
    }
};

// Write file
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf8');

console.log('✅ Fixed landing.tools translations in en.json');
console.log('Changed features from arrays to objects to match hi.json structure');
