"""
Arbitrage calculation service for COMEX-MCX price comparison
"""
from typing import Dict, List, Optional
import statistics


class ArbitrageService:
    """Service for calculating arbitrage opportunities between COMEX and MCX"""
    
    # Constants
    GRAMS_PER_TROY_OUNCE = 31.1035
    DEFAULT_IMPORT_DUTY_PERCENT = 2.5
    
    @staticmethod
    def calculate_fair_value(
        comex_price_usd_per_oz: float,
        usdinr_rate: float,
        import_duty_percent: float = DEFAULT_IMPORT_DUTY_PERCENT,
        contract_size_grams: int = 100
    ) -> float:
        """
        Calculate fair value of MCX contract based on COMEX price
        
        Args:
            comex_price_usd_per_oz: COMEX price in USD per troy ounce
            usdinr_rate: USD/INR exchange rate
            import_duty_percent: Import duty percentage
            contract_size_grams: MCX contract size in grams (default 100g)
            
        Returns:
            Fair value in INR for MCX contract
        """
        # Convert USD/oz to USD/gram
        price_per_gram_usd = comex_price_usd_per_oz / ArbitrageService.GRAMS_PER_TROY_OUNCE
        
        # Convert to INR
        price_per_gram_inr = price_per_gram_usd * usdinr_rate
        
        # Add import duty
        price_with_duty = price_per_gram_inr * (1 + import_duty_percent / 100)
        
        # Scale to contract size
        fair_value = price_with_duty * contract_size_grams
        
        return round(fair_value, 2)
    
    @staticmethod
    def calculate_arbitrage_metrics(
        mcx_price: float,
        fair_value: float,
        historical_premiums: Optional[List[float]] = None
    ) -> Dict[str, float]:
        """
        Calculate arbitrage metrics including premium, z-score, and signal
        
        Args:
            mcx_price: Current MCX price
            fair_value: Calculated fair value
            historical_premiums: List of historical premium percentages
            
        Returns:
            Dictionary with arbitrage metrics
        """
        # Calculate premium
        premium = mcx_price - fair_value
        premium_percent = (premium / fair_value) * 100
        
        # Calculate z-score if historical data available
        z_score = None
        percentile = None
        if historical_premiums and len(historical_premiums) > 10:
            mean_premium = statistics.mean(historical_premiums)
            std_premium = statistics.stdev(historical_premiums)
            if std_premium > 0:
                z_score = (premium_percent - mean_premium) / std_premium
            
            # Calculate percentile
            sorted_premiums = sorted(historical_premiums)
            rank = sum(1 for p in sorted_premiums if p < premium_percent)
            percentile = (rank / len(sorted_premiums)) * 100
        
        # Generate signal
        signal = ArbitrageService._generate_signal(premium_percent, z_score)
        
        return {
            "premium": round(premium, 2),
            "premium_percent": round(premium_percent, 3),
            "z_score": round(z_score, 3) if z_score is not None else None,
            "percentile": round(percentile, 1) if percentile is not None else None,
            "signal": signal
        }
    
    @staticmethod
    def _generate_signal(premium_percent: float, z_score: Optional[float]) -> str:
        """
        Generate trading signal based on premium and z-score
        
        Args:
            premium_percent: Premium percentage
            z_score: Z-score of premium
            
        Returns:
            Signal string: "strong_long", "long", "neutral", "short", "strong_short"
        """
        # If MCX is at significant discount (underpriced)
        if premium_percent < -0.8:
            return "strong_long"
        elif premium_percent < -0.3:
            return "long"
        
        # If MCX is at significant premium (overpriced)
        elif premium_percent > 1.2:
            return "strong_short"
        elif premium_percent > 0.7:
            return "short"
        
        # Use z-score for additional confirmation if available
        if z_score is not None:
            if z_score > 2.0:
                return "strong_short"
            elif z_score > 1.5:
                return "short"
            elif z_score < -2.0:
                return "strong_long"
            elif z_score < -1.5:
                return "long"
        
        return "neutral"
    
    @staticmethod
    def calculate_profit_potential(
        premium: float,
        contract_size: int,
        brokerage_per_contract: float = 20,
        exchange_fees_percent: float = 0.002,
        tax_percent: float = 0.0125
    ) -> Dict[str, float]:
        """
        Calculate potential profit after costs
        
        Args:
            premium: Premium/discount in INR
            contract_size: Contract size in grams
            brokerage_per_contract: Brokerage fee per contract
            exchange_fees_percent: Exchange fees as percentage
            tax_percent: Tax percentage (STT + GST)
            
        Returns:
            Dictionary with profit calculations
        """
        gross_profit = abs(premium)
        
        # Calculate costs
        brokerage = brokerage_per_contract
        exchange_fees = gross_profit * exchange_fees_percent
        tax = gross_profit * tax_percent
        
        total_costs = brokerage + exchange_fees + tax
        net_profit = gross_profit - total_costs
        
        return {
            "gross_profit": round(gross_profit, 2),
            "brokerage": round(brokerage, 2),
            "exchange_fees": round(exchange_fees, 2),
            "tax": round(tax, 2),
            "total_costs": round(total_costs, 2),
            "net_profit": round(net_profit, 2),
            "net_profit_percent": round((net_profit / gross_profit) * 100, 2) if gross_profit > 0 else 0
        }
    
    @staticmethod
    def calculate_usdinr_sensitivity(
        comex_price_usd_per_oz: float,
        current_usdinr: float,
        usdinr_change: float,
        contract_size_grams: int = 100
    ) -> Dict[str, float]:
        """
        Calculate how MCX fair value changes with USDINR movement
        
        Args:
            comex_price_usd_per_oz: COMEX price in USD per troy ounce
            current_usdinr: Current USD/INR rate
            usdinr_change: Change in USDINR (e.g., 0.50 for 50 paisa increase)
            contract_size_grams: Contract size in grams
            
        Returns:
            Dictionary with sensitivity analysis
        """
        current_fair_value = ArbitrageService.calculate_fair_value(
            comex_price_usd_per_oz, current_usdinr, 0, contract_size_grams
        )
        
        new_usdinr = current_usdinr + usdinr_change
        new_fair_value = ArbitrageService.calculate_fair_value(
            comex_price_usd_per_oz, new_usdinr, 0, contract_size_grams
        )
        
        fair_value_change = new_fair_value - current_fair_value
        fair_value_change_percent = (fair_value_change / current_fair_value) * 100
        
        return {
            "current_usdinr": round(current_usdinr, 2),
            "new_usdinr": round(new_usdinr, 2),
            "usdinr_change": round(usdinr_change, 2),
            "current_fair_value": round(current_fair_value, 2),
            "new_fair_value": round(new_fair_value, 2),
            "fair_value_change": round(fair_value_change, 2),
            "fair_value_change_percent": round(fair_value_change_percent, 3)
        }
