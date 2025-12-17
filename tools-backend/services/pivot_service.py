"""
Pivot calculation service for CPR, Floor Pivots, and Fibonacci levels
"""

from typing import Dict, Tuple, List, Any


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
            "classification": classification,
        }

    @staticmethod
    def calculate_floor_pivots(
        high: float, low: float, close: float
    ) -> Dict[str, float]:
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
            "s3": round(s3, 2),
        }

    @staticmethod
    def calculate_fibonacci(
        swing_high: float, swing_low: float, direction: str = "up"
    ) -> Dict[str, float]:
        """
        Calculate Fibonacci retracement and extension levels

        Args:
            swing_high: Swing high price
            swing_low: Swing low price
            direction: "up" for uptrend retracement, "down" for downtrend

        Returns:
            Dictionary with Fibonacci retracement and extension levels
        """
        diff = swing_high - swing_low

        if direction == "up":
            # Retracement from high to low
            levels = {
                # Retracement levels
                "level_0": swing_high,
                "level_236": swing_high - (diff * 0.236),
                "level_382": swing_high - (diff * 0.382),
                "level_500": swing_high - (diff * 0.500),
                "level_618": swing_high - (diff * 0.618),
                "level_786": swing_high - (diff * 0.786),
                "level_100": swing_low,
                # Extension levels (below swing low for downside targets)
                "ext_1272": swing_low - (diff * 0.272),
                "ext_1618": swing_low - (diff * 0.618),
                "ext_2000": swing_low - (diff * 1.000),
                "ext_2618": swing_low - (diff * 1.618),
            }
        else:
            # Retracement from low to high
            levels = {
                # Retracement levels
                "level_0": swing_low,
                "level_236": swing_low + (diff * 0.236),
                "level_382": swing_low + (diff * 0.382),
                "level_500": swing_low + (diff * 0.500),
                "level_618": swing_low + (diff * 0.618),
                "level_786": swing_low + (diff * 0.786),
                "level_100": swing_high,
                # Extension levels (above swing high for upside targets)
                "ext_1272": swing_high + (diff * 0.272),
                "ext_1618": swing_high + (diff * 0.618),
                "ext_2000": swing_high + (diff * 1.000),
                "ext_2618": swing_high + (diff * 1.618),
            }

        return {k: round(v, 2) for k, v in levels.items()}

    @staticmethod
    def find_nearest_level(
        current_price: float, levels: Dict[str, float]
    ) -> Tuple[str, float, float]:
        """
        Find the nearest pivot level to current price

        Args:
            current_price: Current market price
            levels: Dictionary of level names and values

        Returns:
            Tuple of (level_name, level_value, distance)
        """
        nearest_level = None
        nearest_distance = float("inf")
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

    @staticmethod
    def calculate_pivot_accuracy(
        historical_data: List[Dict[str, Any]], tolerance_percent: float = 0.3
    ) -> Dict[str, Any]:
        """
        Calculate pivot level accuracy from historical OHLC data.

        For each day, calculates pivots using that day's OHLC, then checks
        if the next day's price action tested and respected those levels.

        Args:
            historical_data: List of OHLC dicts with keys: date, open, high, low, close
                            Must be sorted by date ascending (oldest first)
            tolerance_percent: Percentage tolerance for level testing (default 0.3%)

        Returns:
            Dictionary with accuracy statistics for each level
        """
        if len(historical_data) < 2:
            return {"error": "Need at least 2 days of data for accuracy calculation"}

        # Initialize tracking for each level
        level_stats = {
            "R3": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "R2": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "R1": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "CPR_TC": {
                "times_tested": 0,
                "times_respected": 0,
                "rejection_distances": [],
            },
            "CPR_Pivot": {
                "times_tested": 0,
                "times_respected": 0,
                "rejection_distances": [],
            },
            "CPR_BC": {
                "times_tested": 0,
                "times_respected": 0,
                "rejection_distances": [],
            },
            "S1": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "S2": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "S3": {"times_tested": 0, "times_respected": 0, "rejection_distances": []},
            "Fib_618": {
                "times_tested": 0,
                "times_respected": 0,
                "rejection_distances": [],
            },
        }

        cpr_classifications = {"narrow": 0, "wide": 0, "normal": 0}
        narrow_trending_correct = 0
        narrow_trending_total = 0
        wide_range_correct = 0
        wide_range_total = 0

        # Iterate through data (except last day since we need next day's data)
        for i in range(len(historical_data) - 1):
            prev_day = historical_data[i]
            curr_day = historical_data[i + 1]

            prev_high = float(prev_day["high"])
            prev_low = float(prev_day["low"])
            prev_close = float(prev_day["close"])

            curr_high = float(curr_day["high"])
            curr_low = float(curr_day["low"])
            curr_close = float(curr_day["close"])

            # Calculate pivots for current day using previous day's OHLC
            cpr = PivotService.calculate_cpr(prev_high, prev_low, prev_close)
            floor = PivotService.calculate_floor_pivots(prev_high, prev_low, prev_close)
            fib = PivotService.calculate_fibonacci(prev_high, prev_low, "up")

            # Track CPR classification
            cpr_classifications[cpr["classification"]] += 1

            # Check if day was trending (range expansion) or range-bound
            day_range = curr_high - curr_low
            prev_range = prev_high - prev_low
            is_trending = day_range > prev_range * 1.2  # 20% more range = trending

            # Track narrow CPR trending accuracy
            if cpr["classification"] == "narrow":
                narrow_trending_total += 1
                if is_trending:
                    narrow_trending_correct += 1

            # Track wide CPR range-bound accuracy
            if cpr["classification"] == "wide":
                wide_range_total += 1
                if not is_trending:
                    wide_range_correct += 1

            # Build levels dict for testing
            levels_to_test = {
                "R3": floor["r3"],
                "R2": floor["r2"],
                "R1": floor["r1"],
                "CPR_TC": cpr["tc"],
                "CPR_Pivot": cpr["pivot"],
                "CPR_BC": cpr["bc"],
                "S1": floor["s1"],
                "S2": floor["s2"],
                "S3": floor["s3"],
                "Fib_618": fib["level_618"],
            }

            # Test each level
            for level_name, level_value in levels_to_test.items():
                tolerance = level_value * (tolerance_percent / 100)

                # Check if price tested this level (high or low came within tolerance)
                tested_from_below = (
                    curr_high >= (level_value - tolerance) and curr_low < level_value
                )
                tested_from_above = (
                    curr_low <= (level_value + tolerance) and curr_high > level_value
                )

                if tested_from_below or tested_from_above:
                    level_stats[level_name]["times_tested"] += 1

                    # Check if level was respected (price reversed after testing)
                    if tested_from_below:
                        # Resistance test - respected if close is below level
                        if curr_close < level_value:
                            level_stats[level_name]["times_respected"] += 1
                            rejection_dist = (
                                (level_value - curr_close) / level_value * 100
                            )
                            level_stats[level_name]["rejection_distances"].append(
                                rejection_dist
                            )
                    elif tested_from_above:
                        # Support test - respected if close is above level
                        if curr_close > level_value:
                            level_stats[level_name]["times_respected"] += 1
                            rejection_dist = (
                                (curr_close - level_value) / level_value * 100
                            )
                            level_stats[level_name]["rejection_distances"].append(
                                rejection_dist
                            )

        # Calculate final statistics
        result = {
            "level_accuracy": {},
            "cpr_statistics": {
                "narrow_cpr_days": cpr_classifications["narrow"],
                "wide_cpr_days": cpr_classifications["wide"],
                "normal_cpr_days": cpr_classifications["normal"],
                "narrow_cpr_trending_accuracy": round(
                    (narrow_trending_correct / narrow_trending_total * 100)
                    if narrow_trending_total > 0
                    else 0,
                    1,
                ),
                "wide_cpr_range_accuracy": round(
                    (wide_range_correct / wide_range_total * 100)
                    if wide_range_total > 0
                    else 0,
                    1,
                ),
            },
            "total_sessions_analyzed": len(historical_data) - 1,
        }

        # Calculate accuracy for each level
        for level_name, stats in level_stats.items():
            tested = stats["times_tested"]
            respected = stats["times_respected"]
            accuracy = (respected / tested * 100) if tested > 0 else 0
            avg_rejection = (
                sum(stats["rejection_distances"]) / len(stats["rejection_distances"])
                if stats["rejection_distances"]
                else 0
            )

            result["level_accuracy"][level_name] = {
                "times_tested": tested,
                "times_respected": respected,
                "accuracy_percent": round(accuracy, 1),
                "avg_rejection_distance": round(avg_rejection, 2),
            }

        # Determine best performing levels
        sorted_levels = sorted(
            result["level_accuracy"].items(),
            key=lambda x: (x[1]["accuracy_percent"], x[1]["times_tested"]),
            reverse=True,
        )
        result["best_performing_levels"] = [
            level[0] for level in sorted_levels[:3] if level[1]["times_tested"] > 0
        ]

        return result
