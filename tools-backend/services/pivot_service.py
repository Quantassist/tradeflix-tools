"""
Pivot calculation service for CPR, Floor Pivots, and Fibonacci levels
"""
from typing import Dict, Tuple


class PivotService:
    """Service for calculating various pivot levels"""
    
    @staticmethod
    def calculate_cpr(high: float, low: float, close: float) -> Dict[str, float]:
        """
        Calculate Central Pivot Range (CPR)
        
        Args:
            high: Previous period high
            low: Previous period low
            close: Previous period close
            
        Returns:
            Dictionary with pivot, bc, tc, width, and classification
        """
        pivot = (high + low + close) / 3
        bc = (high + low) / 2
        tc = (pivot - bc) + pivot
        
        width = tc - bc
        width_percent = (width / pivot) * 100
        
        # Classification: narrow if width < 0.5% of pivot, wide if > 1%
        if width_percent < 0.5:
            classification = "narrow"
        elif width_percent > 1.0:
            classification = "wide"
        else:
            classification = "normal"
        
        return {
            "pivot": round(pivot, 2),
            "bc": round(bc, 2),
            "tc": round(tc, 2),
            "width": round(width, 2),
            "width_percent": round(width_percent, 3),
            "classification": classification
        }
    
    @staticmethod
    def calculate_floor_pivots(high: float, low: float, close: float) -> Dict[str, float]:
        """
        Calculate Floor Pivot Points (Classic Pivot Points)
        
        Args:
            high: Previous period high
            low: Previous period low
            close: Previous period close
            
        Returns:
            Dictionary with pivot and support/resistance levels
        """
        pivot = (high + low + close) / 3
        
        # Resistance levels
        r1 = 2 * pivot - low
        r2 = pivot + (high - low)
        r3 = high + 2 * (pivot - low)
        
        # Support levels
        s1 = 2 * pivot - high
        s2 = pivot - (high - low)
        s3 = low - 2 * (high - pivot)
        
        return {
            "pivot": round(pivot, 2),
            "r1": round(r1, 2),
            "r2": round(r2, 2),
            "r3": round(r3, 2),
            "s1": round(s1, 2),
            "s2": round(s2, 2),
            "s3": round(s3, 2)
        }
    
    @staticmethod
    def calculate_fibonacci(swing_high: float, swing_low: float, direction: str = "up") -> Dict[str, float]:
        """
        Calculate Fibonacci retracement levels
        
        Args:
            swing_high: Swing high price
            swing_low: Swing low price
            direction: "up" for uptrend retracement, "down" for downtrend
            
        Returns:
            Dictionary with Fibonacci levels
        """
        diff = swing_high - swing_low
        
        if direction == "up":
            # Retracement from high to low
            levels = {
                "level_0": swing_high,
                "level_236": swing_high - (diff * 0.236),
                "level_382": swing_high - (diff * 0.382),
                "level_500": swing_high - (diff * 0.500),
                "level_618": swing_high - (diff * 0.618),
                "level_786": swing_high - (diff * 0.786),
                "level_100": swing_low
            }
        else:
            # Retracement from low to high
            levels = {
                "level_0": swing_low,
                "level_236": swing_low + (diff * 0.236),
                "level_382": swing_low + (diff * 0.382),
                "level_500": swing_low + (diff * 0.500),
                "level_618": swing_low + (diff * 0.618),
                "level_786": swing_low + (diff * 0.786),
                "level_100": swing_high
            }
        
        return {k: round(v, 2) for k, v in levels.items()}
    
    @staticmethod
    def find_nearest_level(current_price: float, levels: Dict[str, float]) -> Tuple[str, float, float]:
        """
        Find the nearest pivot level to current price
        
        Args:
            current_price: Current market price
            levels: Dictionary of level names and values
            
        Returns:
            Tuple of (level_name, level_value, distance)
        """
        nearest_level = None
        nearest_distance = float('inf')
        nearest_value = None
        
        for level_name, level_value in levels.items():
            distance = abs(current_price - level_value)
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_level = level_name
                nearest_value = level_value
        
        return nearest_level, nearest_value, round(nearest_distance, 2)
    
    @staticmethod
    def get_level_bias(current_price: float, cpr_levels: Dict[str, float]) -> str:
        """
        Determine market bias based on price position relative to CPR
        
        Args:
            current_price: Current market price
            cpr_levels: CPR levels dictionary
            
        Returns:
            String indicating bias: "bullish", "bearish", or "neutral"
        """
        tc = cpr_levels["tc"]
        bc = cpr_levels["bc"]
        
        if current_price > tc:
            return "bullish"
        elif current_price < bc:
            return "bearish"
        else:
            return "neutral"
