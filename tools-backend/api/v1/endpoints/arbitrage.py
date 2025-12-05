from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
import logging

from schemas.arbitrage import (
    ArbitrageCalculationRequest,
    ArbitrageCalculationResponse,
    FairValueResult,
    ArbitrageMetrics,
    ProfitAnalysis,
)
from services.arbitrage_service import ArbitrageService
from services.data_providers import YahooFinanceProvider, DhanHQProvider
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
arbitrage_service = ArbitrageService()

# COMEX Gold Futures symbol (Gold Dec 25 - GC=F)
COMEX_GOLD_SYMBOL = "GC=F"
COMEX_SILVER_SYMBOL = "SI=F"


@router.post("/calculate", response_model=ArbitrageCalculationResponse)
async def calculate_arbitrage(request: ArbitrageCalculationRequest):
    """
    Calculate arbitrage opportunity between COMEX and MCX

    - **comex_price_usd**: COMEX price in USD per troy ounce
    - **mcx_price_inr**: MCX price in INR per 10 grams (standard MCX quote)
    - **usdinr_rate**: USD/INR exchange rate
    - **import_duty_percent**: Import duty percentage (default 2.5%)
    - **contract_size_grams**: Contract size in grams (default 10g for MCX Gold)

    Formula:
    1. Convert COMEX USD/oz to INR/gram: (COMEX_USD / 31.1035) × USDINR
    2. Add import duty: price × (1 + duty%)
    3. Scale to contract size: price_per_gram × contract_size_grams

    Returns complete arbitrage analysis with fair value, premium, and profit potential.
    """
    try:
        # MCX Gold is quoted per 10 grams, so use 10 as the comparison unit
        # The contract_size_grams parameter should match the MCX quote unit (10g)
        comparison_size = request.contract_size_grams  # Should be 10 for MCX Gold

        # Calculate fair value for the same unit as MCX price
        fair_value = arbitrage_service.calculate_fair_value(
            comex_price_usd_per_oz=request.comex_price_usd,
            usdinr_rate=request.usdinr_rate,
            import_duty_percent=request.import_duty_percent,
            contract_size_grams=comparison_size,
        )

        # Calculate price per gram for reference (without duty for transparency)
        price_per_gram_inr = (
            request.comex_price_usd / ArbitrageService.GRAMS_PER_TROY_OUNCE
        ) * request.usdinr_rate
        price_per_gram_with_duty = price_per_gram_inr * (
            1 + request.import_duty_percent / 100
        )

        fair_value_result = FairValueResult(
            comex_price_usd=request.comex_price_usd,
            usdinr_rate=request.usdinr_rate,
            price_per_gram_inr=round(price_per_gram_with_duty, 2),
            import_duty_percent=request.import_duty_percent,
            fair_value_inr=fair_value,
            contract_size_grams=comparison_size,
        )

        # Calculate arbitrage metrics
        # MCX price is already per 10g, fair_value is now also per 10g
        arbitrage_metrics_data = arbitrage_service.calculate_arbitrage_metrics(
            mcx_price=request.mcx_price_inr,
            fair_value=fair_value,
            historical_premiums=None,  # TODO: Fetch from database
        )

        arbitrage_metrics = ArbitrageMetrics(
            mcx_price=request.mcx_price_inr,
            fair_value=fair_value,
            **arbitrage_metrics_data,
        )

        # Calculate profit potential
        profit_data = arbitrage_service.calculate_profit_potential(
            premium=arbitrage_metrics_data["premium"],
            contract_size=request.contract_size_grams,
        )

        profit_analysis = ProfitAnalysis(**profit_data)

        # Generate recommendation
        signal = arbitrage_metrics_data["signal"]
        if signal in ["strong_long", "long"]:
            recommendation = f"BUY MCX: MCX is trading at {abs(arbitrage_metrics_data['premium_percent']):.2f}% discount to fair value"
            risk_level = "low" if signal == "strong_long" else "medium"
        elif signal in ["strong_short", "short"]:
            recommendation = f"SELL MCX: MCX is trading at {arbitrage_metrics_data['premium_percent']:.2f}% premium to fair value"
            risk_level = "low" if signal == "strong_short" else "medium"
        else:
            recommendation = "NEUTRAL: MCX is fairly priced relative to COMEX"
            risk_level = "low"

        response = ArbitrageCalculationResponse(
            timestamp=datetime.now(),
            symbol="GOLD",  # TODO: Make dynamic
            fair_value=fair_value_result,
            arbitrage=arbitrage_metrics,
            profit_analysis=profit_analysis,
            recommendation=recommendation,
            risk_level=risk_level,
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating arbitrage: {str(e)}"
        )


@router.get("/realtime")
async def get_realtime_arbitrage(
    symbol: str = Query(default="GOLD", description="Symbol (GOLD or SILVER)"),
    contract_size: int = Query(
        default=10, description="Quote unit in grams (10 for MCX Gold)"
    ),
):
    """
    Get real-time arbitrage data using live market prices

    - **symbol**: GOLD or SILVER
    - **contract_size**: Quote unit in grams (10 for MCX Gold, matches MCX quote)

    Returns current arbitrage opportunity with live market data.

    Data Sources:
    - COMEX prices: Yahoo Finance (GC=F for Gold Dec 25 futures, SI=F for Silver)
    - MCX prices: DhanHQ API (price per 10 grams)
    - USD/INR rate: Yahoo Finance
    """
    symbol_upper = symbol.upper()

    if symbol_upper not in ["GOLD", "SILVER"]:
        raise HTTPException(
            status_code=400,
            detail=f"Symbol {symbol} not supported. Use GOLD or SILVER.",
        )

    try:
        # Initialize providers
        yahoo_provider = YahooFinanceProvider()

        # Get COMEX price from Yahoo Finance
        # GC=F = Gold Dec 25 Futures (COMEX - Delayed Quote)
        # SI=F = Silver Futures
        comex_symbol = (
            COMEX_GOLD_SYMBOL if symbol_upper == "GOLD" else COMEX_SILVER_SYMBOL
        )
        comex_price_data = await yahoo_provider.get_price(comex_symbol, "USD")
        comex_price_usd = float(comex_price_data.price)

        # Get USD/INR rate from Yahoo Finance
        usdinr_rate = float(await yahoo_provider.get_forex_rate("USD", "INR"))

        # Try to get MCX price from DhanHQ
        mcx_price_inr = None
        mcx_source = "mock"

        if settings.dhan_client_id and settings.dhan_access_token:
            try:
                dhan_provider = DhanHQProvider(
                    client_id=settings.dhan_client_id,
                    access_token=settings.dhan_access_token,
                )
                mcx_price_data = await dhan_provider.get_price(symbol_upper, "INR")
                mcx_price_inr = float(mcx_price_data.price)
                mcx_source = "DhanHQ"
            except Exception as e:
                logger.warning(f"Could not fetch MCX price from DhanHQ: {e}")

        # Fallback to estimated MCX price if DhanHQ not available
        if mcx_price_inr is None:
            # Estimate MCX price based on COMEX + typical premium
            fair_value = arbitrage_service.calculate_fair_value(
                comex_price_usd_per_oz=comex_price_usd,
                usdinr_rate=usdinr_rate,
                import_duty_percent=2.5,
                contract_size_grams=contract_size,
            )
            # Add typical 0.5% premium for estimation
            mcx_price_inr = fair_value * 1.005
            mcx_source = "estimated"

        # Calculate using live data
        request = ArbitrageCalculationRequest(
            comex_price_usd=comex_price_usd,
            mcx_price_inr=mcx_price_inr,
            usdinr_rate=usdinr_rate,
            contract_size_grams=contract_size,
        )

        result = await calculate_arbitrage(request)

        # Add data source information
        return {
            **result.model_dump(),
            "data_sources": {
                "comex": f"Yahoo Finance ({comex_symbol})",
                "mcx": mcx_source,
                "usdinr": "Yahoo Finance",
            },
        }

    except Exception as e:
        logger.error(f"Error fetching realtime arbitrage data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching realtime data: {str(e)}"
        )


@router.post("/sensitivity")
async def usdinr_sensitivity_analysis(
    comex_price_usd: float = Query(gt=0, description="COMEX price in USD"),
    current_usdinr: float = Query(gt=0, description="Current USDINR rate"),
    usdinr_change: float = Query(
        description="USDINR change to analyze (e.g., 0.50 for 50 paisa)"
    ),
    contract_size: int = Query(default=100, description="Contract size in grams"),
):
    """
    Analyze how MCX fair value changes with USDINR movement

    - **comex_price_usd**: COMEX price in USD per troy ounce
    - **current_usdinr**: Current USD/INR rate
    - **usdinr_change**: Change in USDINR to analyze
    - **contract_size**: Contract size in grams

    Returns sensitivity analysis showing impact of USDINR movement on fair value.
    """
    try:
        sensitivity = arbitrage_service.calculate_usdinr_sensitivity(
            comex_price_usd_per_oz=comex_price_usd,
            current_usdinr=current_usdinr,
            usdinr_change=usdinr_change,
            contract_size_grams=contract_size,
        )

        return {
            "analysis": sensitivity,
            "interpretation": {
                "impact_per_rupee": round(
                    sensitivity["fair_value_change"] / abs(usdinr_change), 2
                )
                if usdinr_change != 0
                else 0,
                "direction": "increases" if usdinr_change > 0 else "decreases",
                "magnitude": "significant"
                if abs(sensitivity["fair_value_change_percent"]) > 1
                else "moderate",
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error in sensitivity analysis: {str(e)}"
        )


@router.get("/history")
async def get_arbitrage_history(
    symbol: str = Query(default="GOLD", description="Symbol"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days"),
):
    """
    Get historical arbitrage data and statistics

    - **symbol**: GOLD or SILVER
    - **days**: Number of days of history

    Returns historical premium/discount data with statistics.
    """
    # TODO: Implement database query for historical data
    return {
        "message": "Historical arbitrage data - to be implemented with database",
        "symbol": symbol.upper(),
        "days": days,
        "note": "This will return historical premium/discount percentages, z-scores, and accuracy of signals",
    }


@router.get("/now")
async def get_arbitrage_now():
    return {"message": "Get arbitrage data - to be implemented"}
