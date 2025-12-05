"""
Correlation analysis service for multi-asset analysis
"""

from typing import List, Dict, Tuple
import statistics
import math


class CorrelationService:
    """Service for calculating correlations and related metrics"""

    @staticmethod
    def calculate_correlation(returns1: List[float], returns2: List[float]) -> float:
        """
        Calculate Pearson correlation coefficient

        Args:
            returns1: Returns for asset 1
            returns2: Returns for asset 2

        Returns:
            Correlation coefficient (-1 to 1)
        """
        if len(returns1) != len(returns2) or len(returns1) < 2:
            return 0.0

        n = len(returns1)
        mean1 = statistics.mean(returns1)
        mean2 = statistics.mean(returns2)

        # Calculate standard deviations (sample)
        std1 = statistics.stdev(returns1)
        std2 = statistics.stdev(returns2)

        if std1 == 0 or std2 == 0:
            return 0.0

        # Calculate covariance using sample formula (n-1)
        covariance = sum(
            (returns1[i] - mean1) * (returns2[i] - mean2) for i in range(n)
        ) / (n - 1)

        # Pearson correlation = covariance / (std1 * std2)
        correlation = covariance / (std1 * std2)

        # Clamp to [-1, 1] to handle floating point errors
        return max(-1.0, min(1.0, correlation))

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
    def calculate_covariance(returns1: List[float], returns2: List[float]) -> float:
        """Calculate covariance between two return series"""
        if len(returns1) != len(returns2) or len(returns1) < 2:
            return 0.0

        n = len(returns1)
        mean1 = statistics.mean(returns1)
        mean2 = statistics.mean(returns2)

        covariance = (
            sum((returns1[i] - mean1) * (returns2[i] - mean2) for i in range(n)) / n
        )
        return covariance

    @staticmethod
    def calculate_beta(
        asset_returns: List[float], benchmark_returns: List[float]
    ) -> Tuple[float, float, float]:
        """
        Calculate beta, alpha, and R-squared

        Args:
            asset_returns: Returns for the asset
            benchmark_returns: Returns for the benchmark

        Returns:
            Tuple of (beta, alpha, r_squared)
        """
        if len(asset_returns) != len(benchmark_returns) or len(asset_returns) < 2:
            return 0.0, 0.0, 0.0

        # Calculate correlation
        correlation = CorrelationService.calculate_correlation(
            asset_returns, benchmark_returns
        )

        # Calculate standard deviations
        asset_std = statistics.stdev(asset_returns)
        benchmark_std = statistics.stdev(benchmark_returns)

        if benchmark_std == 0:
            return 0.0, 0.0, 0.0

        # Beta = correlation * (asset_std / benchmark_std)
        beta = correlation * (asset_std / benchmark_std)

        # Alpha = mean_asset_return - (beta * mean_benchmark_return)
        alpha = statistics.mean(asset_returns) - (
            beta * statistics.mean(benchmark_returns)
        )

        # R-squared = correlation^2
        r_squared = correlation**2

        return beta, alpha, r_squared

    @staticmethod
    def calculate_rolling_correlation(
        returns1: List[float], returns2: List[float], window: int
    ) -> List[float]:
        """
        Calculate rolling correlation

        Args:
            returns1: Returns for asset 1
            returns2: Returns for asset 2
            window: Rolling window size

        Returns:
            List of rolling correlations
        """
        if len(returns1) != len(returns2) or len(returns1) < window:
            return []

        rolling_corrs = []

        for i in range(window, len(returns1) + 1):
            window_returns1 = returns1[i - window : i]
            window_returns2 = returns2[i - window : i]

            corr = CorrelationService.calculate_correlation(
                window_returns1, window_returns2
            )
            rolling_corrs.append(corr)

        return rolling_corrs

    @staticmethod
    def calculate_diversification_score(correlations: List[float]) -> Tuple[float, str]:
        """
        Calculate diversification score based on correlations

        Args:
            correlations: List of correlation coefficients

        Returns:
            Tuple of (score, rating)
        """
        if not correlations:
            return 0.0, "poor"

        # Average absolute correlation
        avg_abs_corr = statistics.mean([abs(c) for c in correlations])

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
        df = sample_size - 2

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
