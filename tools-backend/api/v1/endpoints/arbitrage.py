from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import logging
import statistics
import math

from schemas.arbitrage import (
    ArbitrageCalculationRequest,
    ArbitrageCalculationResponse,
    FairValueResult,
    ArbitrageMetrics,
    ProfitAnalysis,
)
from services.arbitrage_service import ArbitrageService
from services.data_providers import YahooFinanceProvider, DhanHQProvider
from models.arbitrage import ArbitrageHistory
from database import get_db
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
arbitrage_service = ArbitrageService()

# COMEX Gold Futures symbol (Gold Dec 25 - GC=F)
COMEX_GOLD_SYMBOL = "GC=F"
COMEX_SILVER_SYMBOL = "SI=F"


def _downsample_lttb(data: List, target_points: int) -> List:
    """
    Downsample data using Largest Triangle Three Buckets (LTTB) algorithm.
    This preserves visual accuracy while reducing data points.

    Args:
        data: List of ArbitrageHistory objects (sorted by date descending)
        target_points: Target number of points to return

    Returns:
        Downsampled list preserving chart shape
    """
    if len(data) <= target_points:
        return data

    # Reverse to chronological order for LTTB
    data = list(reversed(data))

    # Always keep first and last points
    sampled = [data[0]]

    # Calculate bucket size
    bucket_size = (len(data) - 2) / (target_points - 2)

    a = 0  # Index of previous selected point

    for i in range(target_points - 2):
        # Calculate bucket range
        bucket_start = int(math.floor((i + 1) * bucket_size)) + 1
        bucket_end = int(math.floor((i + 2) * bucket_size)) + 1
        bucket_end = min(bucket_end, len(data) - 1)

        # Calculate average point in next bucket for reference
        avg_x = 0
        avg_y = 0
        next_bucket_start = int(math.floor((i + 2) * bucket_size)) + 1
        next_bucket_end = int(math.floor((i + 3) * bucket_size)) + 1
        next_bucket_end = min(next_bucket_end, len(data))

        count = next_bucket_end - next_bucket_start
        if count > 0:
            for j in range(next_bucket_start, next_bucket_end):
                avg_x += j
                avg_y += float(data[j].premium_percent)
            avg_x /= count
            avg_y /= count

        # Find point in current bucket with largest triangle area
        max_area = -1
        max_idx = bucket_start

        point_a_x = a
        point_a_y = float(data[a].premium_percent)

        for j in range(bucket_start, bucket_end):
            # Calculate triangle area
            area = (
                abs(
                    (point_a_x - avg_x) * (float(data[j].premium_percent) - point_a_y)
                    - (point_a_x - j) * (avg_y - point_a_y)
                )
                * 0.5
            )

            if area > max_area:
                max_area = area
                max_idx = j

        sampled.append(data[max_idx])
        a = max_idx

    # Add last point
    sampled.append(data[-1])

    # Reverse back to descending order (newest first)
    return list(reversed(sampled))


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
    days: int = Query(
        default=30, ge=0, le=10000, description="Number of days (0 = all data)"
    ),
    max_points: int = Query(
        default=500, ge=50, le=5000, description="Maximum data points to return"
    ),
    exclude_estimated: bool = Query(
        default=True, description="Exclude estimated MCX prices (holidays)"
    ),
    db: Session = Depends(get_db),
):
    """
    Get historical arbitrage data and statistics

    - **symbol**: GOLD or SILVER
    - **days**: Number of days of history (0 = all available data)
    - **max_points**: Maximum number of data points to return (for performance)
    - **exclude_estimated**: If true, excludes records where MCX price was estimated (holidays)

    Returns historical premium/discount data with statistics.
    Data is downsampled using LTTB algorithm when exceeding max_points.
    """
    try:
        symbol_upper = symbol.upper()

        # Build query
        query = db.query(ArbitrageHistory).filter(
            ArbitrageHistory.symbol == symbol_upper
        )

        # Apply date filter only if days > 0
        if days > 0:
            cutoff_date = datetime.now() - timedelta(days=days)
            query = query.filter(ArbitrageHistory.recorded_at >= cutoff_date)

        # Exclude estimated MCX prices (holidays) if requested
        if exclude_estimated:
            query = query.filter(ArbitrageHistory.mcx_source != "estimated")

        # Query historical data
        history = query.order_by(desc(ArbitrageHistory.recorded_at)).all()

        if not history:
            return {
                "symbol": symbol_upper,
                "days": days,
                "data": [],
                "statistics": None,
                "message": "No historical data available. Data collection starts when arbitrage calculations are performed.",
            }

        # Calculate statistics on full dataset
        premiums = [float(h.premium_percent) for h in history]
        avg_premium = statistics.mean(premiums)
        std_premium = statistics.stdev(premiums) if len(premiums) > 1 else 0
        min_premium = min(premiums)
        max_premium = max(premiums)

        # Count signals
        signal_counts = {}
        for h in history:
            signal_counts[h.signal] = signal_counts.get(h.signal, 0) + 1

        # Downsample data if needed using LTTB-like algorithm
        total_points = len(history)
        if total_points > max_points:
            history = _downsample_lttb(history, max_points)

        # Format data points
        data_points = [
            {
                "recorded_at": h.recorded_at.isoformat(),
                "comex_price_usd": float(h.comex_price_usd),
                "mcx_price_inr": float(h.mcx_price_inr),
                "usdinr_rate": float(h.usdinr_rate),
                "fair_value_inr": float(h.fair_value_inr),
                "premium": float(h.premium),
                "premium_percent": float(h.premium_percent),
                "signal": h.signal,
                "z_score": float(h.z_score) if h.z_score else None,
                "percentile": float(h.percentile) if h.percentile else None,
            }
            for h in history
        ]

        return {
            "symbol": symbol_upper,
            "days": days,
            "data_count": len(data_points),
            "total_points": total_points,
            "downsampled": total_points > max_points,
            "data": data_points,
            "statistics": {
                "average_premium_percent": round(avg_premium, 4),
                "std_deviation": round(std_premium, 4),
                "min_premium_percent": round(min_premium, 4),
                "max_premium_percent": round(max_premium, 4),
                "signal_distribution": signal_counts,
            },
        }

    except Exception as e:
        logger.error(f"Error fetching arbitrage history: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")


@router.post("/history/record")
async def record_arbitrage_data(
    symbol: str = Query(default="GOLD", description="Symbol"),
    db: Session = Depends(get_db),
):
    """
    Record current arbitrage data to history.
    This endpoint fetches live data and stores it in the database.
    """
    try:
        # Get realtime data
        realtime_data = await get_realtime_arbitrage(symbol=symbol)

        # Create history record
        history_record = ArbitrageHistory(
            symbol=symbol.upper(),
            recorded_at=datetime.now(),
            comex_price_usd=realtime_data["fair_value"]["comex_price_usd"],
            mcx_price_inr=realtime_data["arbitrage"]["mcx_price"],
            usdinr_rate=realtime_data["fair_value"]["usdinr_rate"],
            fair_value_inr=realtime_data["arbitrage"]["fair_value"],
            premium=realtime_data["arbitrage"]["premium"],
            premium_percent=realtime_data["arbitrage"]["premium_percent"],
            signal=realtime_data["arbitrage"]["signal"],
            z_score=realtime_data["arbitrage"].get("z_score"),
            percentile=realtime_data["arbitrage"].get("percentile"),
            comex_source=realtime_data["data_sources"]["comex"],
            mcx_source=realtime_data["data_sources"]["mcx"],
        )

        db.add(history_record)
        db.commit()
        db.refresh(history_record)

        return {
            "message": "Arbitrage data recorded successfully",
            "id": history_record.id,
            "symbol": history_record.symbol,
            "recorded_at": history_record.recorded_at.isoformat(),
            "premium_percent": float(history_record.premium_percent),
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error recording arbitrage data: {e}")
        raise HTTPException(status_code=500, detail=f"Error recording data: {str(e)}")


@router.get("/now")
async def get_arbitrage_now():
    """Alias for /realtime endpoint"""
    return await get_realtime_arbitrage()
