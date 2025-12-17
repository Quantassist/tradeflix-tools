"""
Correlation analysis service for multi-asset analysis
Optimized with numpy and pandas for high-performance calculations
"""

from typing import List, Dict, Tuple, Union
import numpy as np
import pandas as pd
import math


class CorrelationService:
    """Service for calculating correlations and related metrics using numpy/pandas"""

    @staticmethod
    def _to_numpy(data: Union[List[float], np.ndarray]) -> np.ndarray:
        """Convert list to numpy array if needed"""
        if isinstance(data, np.ndarray):
            return data
        return np.array(data, dtype=np.float64)

    @staticmethod
    def calculate_correlation(
        returns1: Union[List[float], np.ndarray],
        returns2: Union[List[float], np.ndarray],
    ) -> float:
        """
        Calculate Pearson correlation coefficient using numpy (optimized)

        Args:
            returns1: Returns for asset 1
            returns2: Returns for asset 2

        Returns:
            Correlation coefficient (-1 to 1)
        """
        arr1 = CorrelationService._to_numpy(returns1)
        arr2 = CorrelationService._to_numpy(returns2)

        if len(arr1) != len(arr2) or len(arr1) < 2:
            return 0.0

        # Use numpy's corrcoef for optimized correlation calculation
        # corrcoef returns a 2x2 matrix, we need [0,1] or [1,0]
        corr_matrix = np.corrcoef(arr1, arr2)
        correlation = corr_matrix[0, 1]

        # Handle NaN (can occur if std is 0)
        if np.isnan(correlation):
            return 0.0

        # Clamp to [-1, 1] to handle floating point errors
        return float(np.clip(correlation, -1.0, 1.0))

    @staticmethod
    def classify_correlation_strength(correlation: float) -> str:
        """
        Classify correlation strength

        Args:
            correlation: Correlation coefficient

        Returns:
            Strength classification
        """
        abs_corr = abs(correlation)

        if abs_corr >= 0.8:
            return "very_strong"
        elif abs_corr >= 0.6:
            return "strong"
        elif abs_corr >= 0.4:
            return "moderate"
        elif abs_corr >= 0.2:
            return "weak"
        else:
            return "very_weak"

    @staticmethod
    def calculate_covariance(
        returns1: Union[List[float], np.ndarray],
        returns2: Union[List[float], np.ndarray],
    ) -> float:
        """Calculate covariance between two return series using numpy"""
        arr1 = CorrelationService._to_numpy(returns1)
        arr2 = CorrelationService._to_numpy(returns2)

        if len(arr1) != len(arr2) or len(arr1) < 2:
            return 0.0

        # Use numpy's cov function (returns covariance matrix)
        cov_matrix = np.cov(arr1, arr2, ddof=0)  # ddof=0 for population covariance
        return float(cov_matrix[0, 1])

    @staticmethod
    def calculate_beta(
        asset_returns: Union[List[float], np.ndarray],
        benchmark_returns: Union[List[float], np.ndarray],
    ) -> Tuple[float, float, float]:
        """
        Calculate beta, alpha, and R-squared using numpy (optimized)

        Args:
            asset_returns: Returns for the asset
            benchmark_returns: Returns for the benchmark

        Returns:
            Tuple of (beta, alpha, r_squared)
        """
        arr_asset = CorrelationService._to_numpy(asset_returns)
        arr_benchmark = CorrelationService._to_numpy(benchmark_returns)

        if len(arr_asset) != len(arr_benchmark) or len(arr_asset) < 2:
            return 0.0, 0.0, 0.0

        # Calculate correlation using numpy
        correlation = CorrelationService.calculate_correlation(arr_asset, arr_benchmark)

        # Calculate standard deviations using numpy (ddof=1 for sample std)
        asset_std = float(np.std(arr_asset, ddof=1))
        benchmark_std = float(np.std(arr_benchmark, ddof=1))

        if benchmark_std == 0:
            return 0.0, 0.0, 0.0

        # Beta = correlation * (asset_std / benchmark_std)
        beta = correlation * (asset_std / benchmark_std)

        # Alpha = mean_asset_return - (beta * mean_benchmark_return)
        alpha = float(np.mean(arr_asset)) - (beta * float(np.mean(arr_benchmark)))

        # R-squared = correlation^2
        r_squared = correlation**2

        return beta, alpha, r_squared

    @staticmethod
    def calculate_rolling_correlation(
        returns1: Union[List[float], np.ndarray],
        returns2: Union[List[float], np.ndarray],
        window: int,
    ) -> List[float]:
        """
        Calculate rolling correlation using pandas (optimized)

        Args:
            returns1: Returns for asset 1
            returns2: Returns for asset 2
            window: Rolling window size

        Returns:
            List of rolling correlations
        """
        arr1 = CorrelationService._to_numpy(returns1)
        arr2 = CorrelationService._to_numpy(returns2)

        if len(arr1) != len(arr2) or len(arr1) < window:
            return []

        # Use pandas rolling correlation for optimized calculation
        s1 = pd.Series(arr1)
        s2 = pd.Series(arr2)

        rolling_corr = s1.rolling(window=window).corr(s2)

        # Drop NaN values and convert to list
        return rolling_corr.dropna().tolist()

    @staticmethod
    def calculate_diversification_score(
        correlations: Union[List[float], np.ndarray],
    ) -> Tuple[float, str]:
        """
        Calculate diversification score based on correlations using numpy

        Args:
            correlations: List of correlation coefficients

        Returns:
            Tuple of (score, rating)
        """
        if not len(correlations):
            return 0.0, "poor"

        arr = CorrelationService._to_numpy(correlations)
        # Average absolute correlation using numpy
        avg_abs_corr = float(np.mean(np.abs(arr)))

        # Score: 100 = perfectly uncorrelated (0), 0 = perfectly correlated (1)
        score = (1 - avg_abs_corr) * 100

        # Rating
        if score >= 75:
            rating = "excellent"
        elif score >= 60:
            rating = "good"
        elif score >= 40:
            rating = "moderate"
        else:
            rating = "poor"

        return round(score, 2), rating

    @staticmethod
    def calculate_p_value(correlation: float, sample_size: int) -> float:
        """
        Calculate approximate p-value for correlation

        Args:
            correlation: Correlation coefficient
            sample_size: Number of observations

        Returns:
            P-value (approximate)
        """
        if sample_size < 3:
            return 1.0

        # t-statistic
        t = correlation * math.sqrt((sample_size - 2) / (1 - correlation**2))

        # Approximate p-value using t-distribution
        # This is a simplified approximation
        # degrees of freedom = sample_size - 2

        # Very rough approximation
        if abs(t) > 2.576:  # 99% confidence
            return 0.01
        elif abs(t) > 1.96:  # 95% confidence
            return 0.05
        elif abs(t) > 1.645:  # 90% confidence
            return 0.10
        else:
            return 0.20

    @staticmethod
    def calculate_confidence_interval(
        correlation: float, sample_size: int, confidence: float = 0.95
    ) -> Tuple[float, float]:
        """
        Calculate confidence interval for correlation using Fisher's Z transformation

        Args:
            correlation: Correlation coefficient
            sample_size: Number of observations
            confidence: Confidence level (default 0.95)

        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        if sample_size < 4:
            return correlation, correlation

        # Fisher's Z transformation
        z = 0.5 * math.log((1 + correlation) / (1 - correlation))

        # Standard error
        se = 1 / math.sqrt(sample_size - 3)

        # Z-score for confidence level
        z_score = 1.96 if confidence == 0.95 else 2.576 if confidence == 0.99 else 1.645

        # Confidence interval in Z space
        z_lower = z - z_score * se
        z_upper = z + z_score * se

        # Transform back to correlation space
        lower = (math.exp(2 * z_lower) - 1) / (math.exp(2 * z_lower) + 1)
        upper = (math.exp(2 * z_upper) - 1) / (math.exp(2 * z_upper) + 1)

        # Clamp to [-1, 1]
        lower = max(-1.0, min(1.0, lower))
        upper = max(-1.0, min(1.0, upper))

        return round(lower, 3), round(upper, 3)

    @staticmethod
    def generate_correlation_interpretation(
        correlation: float, strength: str, p_value: float
    ) -> str:
        """
        Generate human-readable interpretation

        Args:
            correlation: Correlation coefficient
            strength: Strength classification
            p_value: Statistical significance

        Returns:
            Interpretation string
        """
        direction = "positive" if correlation > 0 else "negative"
        significant = (
            "statistically significant"
            if p_value < 0.05
            else "not statistically significant"
        )

        interpretation = f"The assets show a {strength} {direction} correlation ({correlation:.3f}), which is {significant} (p={p_value:.3f}). "

        if strength in ["very_strong", "strong"]:
            interpretation += "These assets tend to move together and provide limited diversification benefits."
        elif strength == "moderate":
            interpretation += "These assets show some tendency to move together but still offer moderate diversification."
        else:
            interpretation += "These assets move relatively independently, providing good diversification benefits."

        return interpretation

    @staticmethod
    def generate_diversification_recommendations(
        avg_correlation: float, max_correlation: float, assets: List[str]
    ) -> List[str]:
        """
        Generate diversification recommendations

        Args:
            avg_correlation: Average correlation
            max_correlation: Maximum correlation
            assets: List of assets

        Returns:
            List of recommendations
        """
        recommendations = []

        if avg_correlation > 0.7:
            recommendations.append(
                "⚠️ High average correlation detected. Consider adding uncorrelated assets."
            )

        if max_correlation > 0.9:
            recommendations.append(
                "⚠️ Some assets are highly correlated. Consider reducing exposure to similar assets."
            )

        if avg_correlation < 0.3:
            recommendations.append(
                "✅ Good diversification. Assets show low correlation."
            )

        # Asset-specific recommendations
        if "GOLD" in assets and "SILVER" in assets:
            recommendations.append(
                "💡 Gold and Silver typically show high correlation. Consider other metals or asset classes."
            )

        if avg_correlation > 0.5:
            recommendations.append(
                "💡 Consider adding assets from different sectors (commodities, currencies, equities)."
            )

        if not recommendations:
            recommendations.append("✅ Portfolio shows reasonable diversification.")

        return recommendations

    @staticmethod
    def detect_divergence(
        returns1: List[float],
        returns2: List[float],
        beta: float,
        lookback_days: int = 30,
    ) -> Dict:
        """
        Detect divergence from expected correlation relationship

        Args:
            returns1: Returns for asset 1 (e.g., Gold)
            returns2: Returns for asset 2 (e.g., USDINR)
            beta: Historical beta between assets
            lookback_days: Days to analyze for divergence

        Returns:
            Divergence analysis dict
        """
        if len(returns1) < 2 or len(returns2) < 2:
            return {
                "has_divergence": False,
                "divergence_score": 0,
                "z_score": 0,
                "expected_move": 0,
                "actual_move": 0,
                "divergence_pct": 0,
                "signal": "neutral",
                "interpretation": "Insufficient data",
            }

        # Get recent returns
        recent_returns1 = (
            returns1[-lookback_days:] if len(returns1) >= lookback_days else returns1
        )
        recent_returns2 = (
            returns2[-lookback_days:] if len(returns2) >= lookback_days else returns2
        )

        # Calculate cumulative returns for the period
        cumulative_return1 = sum(recent_returns1)
        cumulative_return2 = sum(recent_returns2)

        # Expected move based on beta
        expected_move1 = beta * cumulative_return2

        # Actual divergence
        divergence = cumulative_return1 - expected_move1
        divergence_pct = divergence * 100

        # Calculate historical divergences for z-score using numpy
        arr1 = CorrelationService._to_numpy(returns1)
        arr2 = CorrelationService._to_numpy(returns2)
        min_len = min(len(arr1), len(arr2))

        historical_divergences = []
        for i in range(lookback_days, min_len):
            hist_ret1 = float(np.sum(arr1[i - lookback_days : i]))
            hist_ret2 = float(np.sum(arr2[i - lookback_days : i]))
            hist_expected = beta * hist_ret2
            hist_divergence = hist_ret1 - hist_expected
            historical_divergences.append(hist_divergence)

        # Calculate z-score using numpy
        if len(historical_divergences) >= 2:
            hist_arr = np.array(historical_divergences)
            mean_div = float(np.mean(hist_arr))
            std_div = float(np.std(hist_arr, ddof=1)) if len(hist_arr) > 1 else 1.0
            z_score = (divergence - mean_div) / std_div if std_div > 0 else 0
        else:
            z_score = 0

        # Determine signal
        has_divergence = abs(z_score) > 1.5

        if z_score > 2:
            signal = "strong_sell"  # Asset 1 overperformed, expect mean reversion down
            interpretation = f"Asset significantly outperformed expected move. Z-score: {z_score:.2f}. Mean reversion likely."
        elif z_score > 1.5:
            signal = "sell"
            interpretation = f"Asset moderately outperformed. Z-score: {z_score:.2f}. Watch for pullback."
        elif z_score < -2:
            signal = "strong_buy"  # Asset 1 underperformed, expect mean reversion up
            interpretation = f"Asset significantly underperformed expected move. Z-score: {z_score:.2f}. Mean reversion likely."
        elif z_score < -1.5:
            signal = "buy"
            interpretation = f"Asset moderately underperformed. Z-score: {z_score:.2f}. Watch for bounce."
        else:
            signal = "neutral"
            interpretation = f"Asset moving in line with expected correlation. Z-score: {z_score:.2f}."

        return {
            "has_divergence": has_divergence,
            "divergence_score": round(abs(z_score), 2),
            "z_score": round(z_score, 3),
            "expected_move": round(expected_move1 * 100, 3),
            "actual_move": round(cumulative_return1 * 100, 3),
            "divergence_pct": round(divergence_pct, 3),
            "signal": signal,
            "interpretation": interpretation,
        }

    @staticmethod
    def calculate_lead_lag(
        returns1: List[float],
        returns2: List[float],
        max_lag: int = 5,
    ) -> Dict:
        """
        Calculate lead-lag relationship between two assets

        Args:
            returns1: Returns for asset 1
            returns2: Returns for asset 2
            max_lag: Maximum lag to test (in periods)

        Returns:
            Lead-lag analysis dict
        """
        if len(returns1) < max_lag + 10 or len(returns2) < max_lag + 10:
            return {
                "leading_asset": None,
                "lag_periods": 0,
                "correlation_at_lag": 0,
                "interpretation": "Insufficient data for lead-lag analysis",
            }

        correlations = {}

        # Test different lags
        for lag in range(-max_lag, max_lag + 1):
            if lag < 0:
                # Asset 2 leads (shift asset 1 forward)
                r1 = returns1[-lag:]
                r2 = returns2[:lag]
            elif lag > 0:
                # Asset 1 leads (shift asset 2 forward)
                r1 = returns1[:-lag]
                r2 = returns2[lag:]
            else:
                r1 = returns1
                r2 = returns2

            min_len = min(len(r1), len(r2))
            if min_len >= 10:
                corr = CorrelationService.calculate_correlation(
                    r1[:min_len], r2[:min_len]
                )
                correlations[lag] = corr

        if not correlations:
            return {
                "leading_asset": None,
                "lag_periods": 0,
                "correlation_at_lag": 0,
                "interpretation": "Could not calculate lead-lag correlations",
            }

        # Find the lag with highest absolute correlation
        best_lag = max(correlations.keys(), key=lambda k: abs(correlations[k]))
        best_corr = correlations[best_lag]

        # Determine which asset leads
        if best_lag > 0:
            leading_asset = "asset1"
            interpretation = f"Asset 1 leads Asset 2 by {best_lag} period(s). Correlation at lag: {best_corr:.3f}"
        elif best_lag < 0:
            leading_asset = "asset2"
            interpretation = f"Asset 2 leads Asset 1 by {-best_lag} period(s). Correlation at lag: {best_corr:.3f}"
        else:
            leading_asset = "simultaneous"
            interpretation = f"Assets move simultaneously. Correlation: {best_corr:.3f}"

        return {
            "leading_asset": leading_asset,
            "lag_periods": abs(best_lag),
            "lag_direction": best_lag,
            "correlation_at_lag": round(best_corr, 3),
            "correlation_at_zero": round(correlations.get(0, 0), 3),
            "all_lag_correlations": {k: round(v, 3) for k, v in correlations.items()},
            "interpretation": interpretation,
        }

    @staticmethod
    def generate_trading_signals(
        correlation: float,
        beta: float,
        divergence: Dict,
        lead_lag: Dict,
    ) -> Dict:
        """
        Generate correlation-based trading signals

        Args:
            correlation: Current correlation coefficient
            beta: Beta between assets
            divergence: Divergence analysis result
            lead_lag: Lead-lag analysis result

        Returns:
            Trading signals dict
        """
        signals = []
        overall_signal = "neutral"
        confidence = "low"

        # Mean Reversion Signal
        if divergence.get("has_divergence", False):
            z_score = divergence.get("z_score", 0)
            if abs(z_score) > 2:
                signals.append(
                    {
                        "type": "mean_reversion",
                        "signal": divergence.get("signal", "neutral"),
                        "strength": "strong",
                        "reason": f"Z-score of {z_score:.2f} indicates significant divergence from expected relationship",
                    }
                )
                overall_signal = divergence.get("signal", "neutral")
                confidence = "high"
            elif abs(z_score) > 1.5:
                signals.append(
                    {
                        "type": "mean_reversion",
                        "signal": divergence.get("signal", "neutral"),
                        "strength": "moderate",
                        "reason": f"Z-score of {z_score:.2f} indicates moderate divergence",
                    }
                )
                if overall_signal == "neutral":
                    overall_signal = divergence.get("signal", "neutral")
                    confidence = "medium"

        # Trend Following Signal (based on correlation strength)
        if abs(correlation) > 0.7:
            signals.append(
                {
                    "type": "trend_following",
                    "signal": "follow_correlation",
                    "strength": "strong" if abs(correlation) > 0.85 else "moderate",
                    "reason": f"Strong correlation ({correlation:.3f}) suggests assets will continue moving together",
                }
            )

        # Lead-Lag Signal
        if lead_lag.get("leading_asset") and lead_lag.get("lag_periods", 0) > 0:
            lag_corr = lead_lag.get("correlation_at_lag", 0)
            if abs(lag_corr) > 0.5:
                signals.append(
                    {
                        "type": "lead_lag",
                        "signal": "anticipate_move",
                        "strength": "moderate" if abs(lag_corr) > 0.6 else "weak",
                        "reason": f"{lead_lag.get('leading_asset')} leads by {lead_lag.get('lag_periods')} period(s). Watch for lagged moves.",
                    }
                )

        # Breakout Confirmation Signal
        if abs(correlation) > 0.7 and not divergence.get("has_divergence", False):
            signals.append(
                {
                    "type": "breakout_confirmation",
                    "signal": "confirmed",
                    "strength": "strong",
                    "reason": "Both assets moving in expected correlation - breakout is confirmed",
                }
            )

        return {
            "overall_signal": overall_signal,
            "confidence": confidence,
            "signals": signals,
            "signal_count": len(signals),
            "summary": f"Generated {len(signals)} signal(s). Overall: {overall_signal} ({confidence} confidence)",
        }
