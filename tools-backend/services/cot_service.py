"""
COT (Commitment of Traders) analysis service
"""
from typing import List, Dict, Tuple
import statistics


class COTService:
    """Service for analyzing CFTC Commitment of Traders data"""
    
    @staticmethod
    def calculate_percentile(
        current_value: float,
        historical_values: List[float]
    ) -> float:
        """
        Calculate percentile rank of current value in historical data
        
        Args:
            current_value: Current value to rank
            historical_values: Historical values for comparison
            
        Returns:
            Percentile (0-100)
        """
        if not historical_values:
            return 50.0
        
        # Count values below current
        below = sum(1 for v in historical_values if v < current_value)
        
        # Percentile
        percentile = (below / len(historical_values)) * 100
        
        return round(percentile, 2)
    
    @staticmethod
    def is_extreme_positioning(percentile: float) -> Tuple[bool, str]:
        """
        Determine if positioning is extreme
        
        Args:
            percentile: Percentile value (0-100)
            
        Returns:
            Tuple of (is_extreme, extreme_type)
        """
        if percentile >= 90:
            return True, "extremely_bullish"
        elif percentile <= 10:
            return True, "extremely_bearish"
        else:
            return False, None
    
    @staticmethod
    def calculate_net_position(long: int, short: int) -> int:
        """Calculate net position (long - short)"""
        return long - short
    
    @staticmethod
    def generate_cot_signal(
        commercial_net: int,
        commercial_percentile: float,
        non_commercial_net: int,
        non_commercial_percentile: float,
        commercial_change: int,
        non_commercial_change: int
    ) -> Dict[str, str]:
        """
        Generate trading signal based on COT data
        
        Args:
            commercial_net: Commercial net position
            commercial_percentile: Commercial percentile
            non_commercial_net: Non-commercial net position
            non_commercial_percentile: Non-commercial percentile
            commercial_change: Week-over-week commercial change
            non_commercial_change: Week-over-week non-commercial change
            
        Returns:
            Dictionary with signal, confidence, and reasoning
        """
        # Commercial traders are typically contrarian indicators
        # When commercials are heavily long (high percentile), it's bullish
        # When speculators are heavily long (high percentile), it's often bearish (contrarian)
        
        signal_score = 0
        reasons = []
        
        # Commercial positioning (follow the smart money)
        if commercial_percentile >= 80:
            signal_score += 2
            reasons.append("Commercials heavily long (smart money bullish)")
        elif commercial_percentile >= 60:
            signal_score += 1
            reasons.append("Commercials moderately long")
        elif commercial_percentile <= 20:
            signal_score -= 2
            reasons.append("Commercials heavily short (smart money bearish)")
        elif commercial_percentile <= 40:
            signal_score -= 1
            reasons.append("Commercials moderately short")
        
        # Speculator positioning (contrarian indicator)
        if non_commercial_percentile >= 80:
            signal_score -= 1
            reasons.append("Speculators heavily long (potential reversal)")
        elif non_commercial_percentile <= 20:
            signal_score += 1
            reasons.append("Speculators heavily short (potential reversal)")
        
        # Recent changes
        if commercial_change > 0 and abs(commercial_change) > 5000:
            signal_score += 1
            reasons.append("Commercials increasing longs")
        elif commercial_change < 0 and abs(commercial_change) > 5000:
            signal_score -= 1
            reasons.append("Commercials increasing shorts")
        
        # Determine signal
        if signal_score >= 3:
            signal = "strong_buy"
            confidence = "high"
        elif signal_score >= 2:
            signal = "buy"
            confidence = "medium"
        elif signal_score <= -3:
            signal = "strong_sell"
            confidence = "high"
        elif signal_score <= -2:
            signal = "sell"
            confidence = "medium"
        else:
            signal = "neutral"
            confidence = "low"
        
        # Determine biases
        commercial_bias = "bullish" if commercial_net > 0 else "bearish" if commercial_net < 0 else "neutral"
        speculator_bias = "bullish" if non_commercial_net > 0 else "bearish" if non_commercial_net < 0 else "neutral"
        
        reasoning = ". ".join(reasons) if reasons else "No strong positioning signals"
        
        return {
            "signal": signal,
            "confidence": confidence,
            "reasoning": reasoning,
            "commercial_bias": commercial_bias,
            "speculator_bias": speculator_bias
        }
    
    @staticmethod
    def calculate_position_change(
        current: int,
        previous: int
    ) -> Tuple[int, float]:
        """
        Calculate position change and percentage
        
        Args:
            current: Current position
            previous: Previous position
            
        Returns:
            Tuple of (change, change_percent)
        """
        change = current - previous
        
        if previous == 0:
            change_percent = 0.0
        else:
            change_percent = (change / abs(previous)) * 100
        
        return change, round(change_percent, 2)
    
    @staticmethod
    def interpret_position_change(
        change: int,
        change_percent: float,
        position_type: str
    ) -> str:
        """
        Generate interpretation of position change
        
        Args:
            change: Absolute change
            change_percent: Percentage change
            position_type: "commercial" or "non_commercial"
            
        Returns:
            Interpretation string
        """
        if abs(change_percent) < 5:
            magnitude = "minimal"
        elif abs(change_percent) < 15:
            magnitude = "moderate"
        else:
            magnitude = "significant"
        
        direction = "increased" if change > 0 else "decreased"
        
        if position_type == "commercial":
            sentiment = "bullish" if change > 0 else "bearish"
            interpretation = f"Commercial traders {direction} net long positions by {abs(change):,} contracts ({abs(change_percent):.1f}%), showing {magnitude} {sentiment} sentiment."
        else:
            sentiment = "bullish" if change > 0 else "bearish"
            interpretation = f"Speculative traders {direction} net long positions by {abs(change):,} contracts ({abs(change_percent):.1f}%), indicating {magnitude} {sentiment} positioning."
        
        return interpretation
    
    @staticmethod
    def identify_extreme_positioning(
        net_position: int,
        percentile: float,
        historical_avg: float
    ) -> Dict[str, any]:
        """
        Identify and analyze extreme positioning
        
        Args:
            net_position: Current net position
            percentile: Percentile rank
            historical_avg: Historical average
            
        Returns:
            Dictionary with extreme positioning analysis
        """
        is_extreme, extreme_type = COTService.is_extreme_positioning(percentile)
        
        if not is_extreme:
            return {
                "is_extreme": False,
                "potential_reversal": False
            }
        
        # Calculate deviation from average
        deviation = net_position - historical_avg
        deviation_percent = (deviation / abs(historical_avg)) * 100 if historical_avg != 0 else 0
        
        # Extreme positioning often precedes reversals
        potential_reversal = abs(deviation_percent) > 50
        
        if extreme_type == "extremely_bullish":
            context = f"Net long position is at {percentile:.0f}th percentile, {abs(deviation):,.0f} contracts above historical average. "
            context += "This extreme bullish positioning may indicate an overbought condition."
        else:
            context = f"Net short position is at {percentile:.0f}th percentile, {abs(deviation):,.0f} contracts below historical average. "
            context += "This extreme bearish positioning may indicate an oversold condition."
        
        return {
            "is_extreme": True,
            "extreme_type": extreme_type,
            "historical_context": context,
            "potential_reversal": potential_reversal,
            "deviation_from_avg": round(deviation, 0),
            "deviation_percent": round(deviation_percent, 2)
        }
    
    @staticmethod
    def compare_commodities(
        commodity_data: Dict[str, Dict]
    ) -> Tuple[str, str]:
        """
        Compare COT data across commodities to find most bullish/bearish
        
        Args:
            commodity_data: Dictionary of commodity data
            
        Returns:
            Tuple of (most_bullish, most_bearish)
        """
        if not commodity_data:
            return None, None
        
        # Score each commodity based on commercial positioning
        scores = {}
        
        for commodity, data in commodity_data.items():
            # Higher commercial percentile = more bullish
            # Lower speculator percentile = more bullish (contrarian)
            score = data.get("commercial_percentile", 50) - (data.get("non_commercial_percentile", 50) * 0.5)
            scores[commodity] = score
        
        most_bullish = max(scores, key=scores.get)
        most_bearish = min(scores, key=scores.get)
        
        return most_bullish, most_bearish
