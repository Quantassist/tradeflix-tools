here is the step-by-step process of how the application converts the Visual Strategy (UI) into a JSON object, and then executes it against historical data.
1. UI to JSON (Construction)
File: components/StrategyBuilder.tsx & App.tsx
The "Strategy" is essentially a React State object residing in App.tsx. The UI is simply a visual editor for this object.
Recursive Structure: Unlike a flat form, the strategy uses a Recursive Tree structure (defined in types.ts as LogicGroup).
User Action: When a user clicks "Add Group" or toggles "AND/OR":
The StrategyBuilder calls setStrategy.
It traverses the tree to find the specific Group ID.
It updates the operator ('AND'/'OR') or pushes a new child into the children array.
Static vs. Indicator: When the user selects "Static Value" in the dropdown:
The UI updates the JSON Condition object to include a specific value property (e.g., value: 30).
It removes the right indicator config, marking it as a comparison against a fixed number.
2. The JSON Blueprint (The Format)
File: types.ts
Once the user finishes editing, the strategy exists in memory as a JSON object like this:
code
JSON
{
  "asset": "GOLD",
  "entryLogic": {
    "type": "GROUP",
    "operator": "AND", // User selected "AND"
    "children": [
      {
        "type": "CONDITION",
        "left": { "type": "RSI", "period": 14 },
        "comparator": "<",
        "value": 30 // User selected Static Value
      },
      {
        "type": "GROUP", // Nested Logic
        "operator": "OR",
        "children": [
           // ... nested conditions
        ]
      }
    ]
  }
}
3. Data Augmentation (Preparation)
File: services/calcService.ts -> calculateIndicators
The raw historical data (generateMockData) only contains Open, High, Low, Close, Volume. The Backtest Engine cannot run yet because the data doesn't contain "RSI" or "SMA".
Scanning: When runBacktest is called, the engine first scans the entire Strategy JSON tree (entryLogic and exitLogic).
Extraction: It extracts every unique indicator required (e.g., "RSI_14", "EMA_200", "CPR_TC").
Calculation: It calls mathematical functions (like calculateRSI) to generate arrays of values for the entire 10-year history.
Merging: It injects these values into the Candle objects.
Before: { date: "...", close: 1200 }
After: { date: "...", close: 1200, "RSI_14": 45.2, "EMA_200": 1150, "CPR_TC": 1210 }
4. The Execution Loop (The Engine)
File: services/backtestService.ts
Now the engine runs the actual simulation using runBacktest:
The Loop: It iterates through the array of augmented Candles (Days 0 to 3650).
State Management: It tracks currentTrade (Entry Price, Date, PnL).
Recursive Evaluation (evaluateNode):
If the node is a GROUP:
If operator is AND: It runs .every() on children (all must be true).
If operator is OR: It runs .some() on children (at least one must be true).
Note: This calls itself recursively, allowing infinite nesting.
If the node is a CONDITION:
It calls getValue for the Left Side (e.g., gets candle['RSI_14']).
It calls getValue for the Right Side OR uses the static value.
It compares them using the comparator (>, <, CROSS_ABOVE, etc).
5. Trade Execution & Results
File: services/backtestService.ts
Entry: If currentTrade is null AND evaluateNode(entryLogic) returns true, a trade is opened.
Exit: If currentTrade exists:
Check Stop Loss (e.g., (Low - Entry) / Entry < -0.02).
Check Take Profit.
Check Exit Logic (run evaluateNode(exitLogic)).
Metrics: Once the loop finishes, the engine calculates:
Equity Curve: Array of portfolio value over time (visualized in Charts.tsx).
Sharpe Ratio, Max Drawdown, Win Rate (visualized in StatsPanel.tsx).