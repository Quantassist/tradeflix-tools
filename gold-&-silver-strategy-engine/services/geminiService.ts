import { GoogleGenAI } from "@google/genai";
import { Strategy } from "../types";

const initAI = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePythonCode = async (strategy: Strategy): Promise<string> => {
  const ai = initAI();
  if (!ai) return "# Error: API_KEY not configured.";

  const prompt = `
  You are an expert quantitative developer specializing in Precious Metals (Gold/Silver).
  Convert the following JSON trading strategy into a robust Python script.
  
  Strategy Configuration:
  ${JSON.stringify(strategy, null, 2)}
  
  CRITICAL: The logic is defined in 'entryLogic' and 'exitLogic' objects. 
  These are Recursive Trees of groups.
  - type="GROUP", operator="AND" -> All children must be true.
  - type="GROUP", operator="OR" -> Any child must be true.
  - type="CONDITION" -> A specific indicator comparison.
  
  Requirements:
  1. Use 'backtesting' (backtesting.py) or 'backtrader' library.
  2. Implement a recursive function or flattened logic to handle the AND/OR tree for signals.
  3. The strategy is for ${strategy.asset} (XAUUSD or XAGUSD).
  4. If USDINR is used in conditions, assume a secondary data feed is available or mock it.
  5. Include a standard Yahoo Finance data feed (yfinance) download for 'GC=F' (Gold) or 'SI=F' (Silver).
  6. Return ONLY the python code.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "# No code generated";
  } catch (e) {
    console.error(e);
    return `# Error generating code: ${e}`;
  }
};

export const analyzeStrategy = async (strategy: Strategy): Promise<string> => {
    const ai = initAI();
    if (!ai) return "API Key missing.";

    const prompt = `
    Analyze this trading strategy for ${strategy.asset} (Precious Metals):
    ${JSON.stringify(strategy, null, 2)}
    
    The strategy uses nested Logic Groups (AND/OR). Ensure you analyze the complexity of the conditions.

    Please provide a brief bullet-point analysis covering:
    1. Logic Soundness (e.g., is Breakout logic valid for Gold?).
    2. Risk Profile (Gold is volatile, is the Stop Loss appropriate?).
    3. Constructive feedback on the specific indicators used.
    Keep it concise and professional.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Analysis failed.";
    } catch (e) {
        return "Analysis failed due to API error.";
    }
};