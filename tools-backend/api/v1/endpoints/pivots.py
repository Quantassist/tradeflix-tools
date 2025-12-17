from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import Optional
import logging

from schemas.pivot import (
    PivotCalculationRequest,
    PivotCalculationResponse,
    CPRLevels,
    FloorPivotLevels,
    FibonacciLevels,
)
from services.pivot_service import PivotService
from services.data_providers import (
    YahooFinanceProvider,
    DhanHQProvider,
    ProviderError,
    DataNotAvailableError,
)
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
pivot_service = PivotService()

# Symbol mappings
YAHOO_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "CRUDE": "CL=F",
    "COPPER": "HG=F",
    "NATURALGAS": "NG=F",
}


async def fetch_previous_ohlc(symbol: str, timeframe: str, exchange: str = "COMEX"):
    """Fetch previous period OHLC data for pivot calculation"""
    if exchange.upper() == "COMEX":
        yahoo = YahooFinanceProvider()
        yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), f"{symbol}=F")

        # Determine date range based on timeframe
        today = date.today()
        if timeframe == "daily":
            # Get recent data (include today in case market is open)
            start_date = today - timedelta(days=10)  # Buffer for weekends/holidays
            end_date = today
        elif timeframe == "weekly":
            # Get last 2 weeks of data
            start_date = today - timedelta(days=20)
            end_date = today
        else:  # monthly
            start_date = today - timedelta(days=60)
            end_date = today

        try:
            logger.info(
                f"Fetching OHLC for {yahoo_symbol} from {start_date} to {end_date}"
            )
            history = await yahoo.get_historical_data(
                yahoo_symbol, start_date, end_date, "1d", "USD"
            )

            if not history.data_points:
                logger.error(f"No data points returned for {yahoo_symbol}")
                raise ValueError(f"No data available for {symbol}")

            if timeframe == "daily":
                # Use last trading day
                dp = history.data_points[-1]
                return {
                    "high": float(dp.high),
                    "low": float(dp.low),
                    "close": float(dp.close),
                    "date": dp.date,
                }
            elif timeframe == "weekly":
                # Aggregate last 5 trading days
                recent = history.data_points[-5:]
                return {
                    "high": max(float(dp.high) for dp in recent),
                    "low": min(float(dp.low) for dp in recent),
                    "close": float(recent[-1].close),
                    "date": recent[-1].date,
                }
            else:  # monthly
                # Aggregate last ~22 trading days
                recent = history.data_points[-22:]
                return {
                    "high": max(float(dp.high) for dp in recent),
                    "low": min(float(dp.low) for dp in recent),
                    "close": float(recent[-1].close),
                    "date": recent[-1].date,
                }

        except DataNotAvailableError as e:
            logger.error(f"DataNotAvailableError for {symbol}: {e}")
            raise ValueError(f"No data available for {symbol}: {e}")
        except ProviderError as e:
            logger.error(f"ProviderError fetching data for {symbol}: {e}")
            raise ValueError(f"Could not fetch data for {symbol}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching data for {symbol}: {e}")
            raise ValueError(f"Could not fetch data for {symbol}: {e}")

    elif exchange.upper() == "MCX":
        if not settings.dhan_client_id or not settings.dhan_access_token:
            raise ValueError("MCX data provider not configured")

        dhan = DhanHQProvider(settings.dhan_client_id, settings.dhan_access_token)

        try:
            ohlc = await dhan.get_ohlc(
                symbol.upper(), date.today() - timedelta(days=1), "INR"
            )
            return {
                "high": float(ohlc.high),
                "low": float(ohlc.low),
                "close": float(ohlc.close),
                "date": ohlc.date,
            }
        except ProviderError as e:
            raise ValueError(f"Could not fetch MCX data for {symbol}: {e}")

    raise ValueError(f"Unknown exchange: {exchange}")


@router.post("/calculate", response_model=PivotCalculationResponse)
async def calculate_pivots(request: PivotCalculationRequest):
    """
    Calculate pivot levels (CPR, Floor Pivots, Fibonacci)

    - **symbol**: Trading symbol (GOLD, SILVER, CRUDE, etc.)
    - **timeframe**: daily, weekly, or monthly
    - **ohlc**: High, Low, Close values from previous period
    - **auto_fetch**: If true, fetch previous period data automatically (not implemented yet)

    Returns all pivot levels with classification and analysis.
    """
    try:
        ohlc = request.ohlc

        # Validate OHLC data
        if ohlc.high <= ohlc.low:
            raise HTTPException(status_code=400, detail="High must be greater than Low")

        if not (ohlc.low <= ohlc.close <= ohlc.high):
            raise HTTPException(
                status_code=400, detail="Close must be between High and Low"
            )

        # Calculate CPR (Central Pivot Range)
        cpr_data = pivot_service.calculate_cpr(ohlc.high, ohlc.low, ohlc.close)
        cpr = CPRLevels(**cpr_data)

        # Calculate Floor Pivots (Classic Pivot Points)
        floor_data = pivot_service.calculate_floor_pivots(
            ohlc.high, ohlc.low, ohlc.close
        )
        floor_pivots = FloorPivotLevels(**floor_data)

        # Calculate Fibonacci Retracement Levels
        # Using high/low as swing points for retracement
        fib_data = pivot_service.calculate_fibonacci(
            ohlc.high, ohlc.low, direction="up"
        )
        fibonacci = FibonacciLevels(**fib_data)

        # Prepare response
        response = PivotCalculationResponse(
            symbol=request.symbol.upper(),
            timeframe=request.timeframe.lower(),
            date=ohlc.date or date.today(),
            ohlc=ohlc,
            cpr=cpr,
            floor_pivots=floor_pivots,
            fibonacci=fibonacci,
            current_price=None,  # Will be populated when live price data is available
            nearest_level=None,  # Will be calculated when current_price is available
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating pivots: {str(e)}"
        )


@router.get("/auto")
async def get_auto_pivots(
    symbol: str = Query(description="Symbol (GOLD, SILVER, CRUDE, etc.)"),
    timeframe: str = Query(default="daily", description="daily, weekly, or monthly"),
    exchange: str = Query(default="COMEX", description="COMEX or MCX"),
):
    """
    Automatically fetch previous period OHLC and calculate pivot levels.

    - **symbol**: Trading symbol
    - **timeframe**: daily, weekly, or monthly
    - **exchange**: COMEX or MCX

    Returns pivot levels calculated from real market data.
    """
    try:
        # Fetch previous period OHLC
        ohlc_data = await fetch_previous_ohlc(symbol, timeframe.lower(), exchange)

        high = ohlc_data["high"]
        low = ohlc_data["low"]
        close = ohlc_data["close"]

        # Calculate CPR
        cpr_data = pivot_service.calculate_cpr(high, low, close)
        cpr = CPRLevels(**cpr_data)

        # Calculate Floor Pivots
        floor_data = pivot_service.calculate_floor_pivots(high, low, close)
        floor_pivots = FloorPivotLevels(**floor_data)

        # Calculate Fibonacci
        fib_data = pivot_service.calculate_fibonacci(high, low, direction="up")
        fibonacci = FibonacciLevels(**fib_data)

        # Get current price for context
        yahoo = YahooFinanceProvider()
        yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), f"{symbol}=F")
        current_price_data = await yahoo.get_price(yahoo_symbol, "USD")
        current_price = float(current_price_data.price)

        # Find nearest level
        all_levels = {
            "CPR_TC": cpr_data["tc"],
            "CPR_Pivot": cpr_data["pivot"],
            "CPR_BC": cpr_data["bc"],
            "R3": floor_data["r3"],
            "R2": floor_data["r2"],
            "R1": floor_data["r1"],
            "S1": floor_data["s1"],
            "S2": floor_data["s2"],
            "S3": floor_data["s3"],
        }
        nearest_name, nearest_value, distance = pivot_service.find_nearest_level(
            current_price, all_levels
        )

        return {
            "symbol": symbol.upper(),
            "exchange": exchange.upper(),
            "timeframe": timeframe.lower(),
            "ohlc_date": ohlc_data["date"].isoformat(),
            "ohlc": {"high": high, "low": low, "close": close},
            "cpr": cpr.model_dump(),
            "floor_pivots": floor_pivots.model_dump(),
            "fibonacci": fibonacci.model_dump(),
            "current_price": current_price,
            "nearest_level": {
                "name": nearest_name,
                "value": nearest_value,
                "distance": round(distance, 2),
                "distance_percent": round((distance / current_price) * 100, 3),
            },
            "market_bias": pivot_service.get_level_bias(current_price, cpr_data),
            "data_source": "YahooFinance" if exchange.upper() == "COMEX" else "DhanHQ",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating auto pivots: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error calculating pivots: {str(e)}"
        )


@router.get("/multi-timeframe")
async def get_multi_timeframe_pivots(
    symbol: str = Query(description="Symbol (GOLD, SILVER, CRUDE, etc.)"),
    exchange: str = Query(default="COMEX", description="COMEX or MCX"),
):
    """
    Get pivot levels for all timeframes (daily, weekly, monthly) with confluence detection.

    Returns pivot levels for each timeframe and identifies confluence zones where
    multiple timeframe levels align.
    """
    try:
        results = {}
        all_levels = []

        # Fetch pivots for each timeframe
        for timeframe in ["daily", "weekly", "monthly"]:
            ohlc_data = await fetch_previous_ohlc(symbol, timeframe, exchange)

            high = ohlc_data["high"]
            low = ohlc_data["low"]
            close = ohlc_data["close"]

            cpr_data = pivot_service.calculate_cpr(high, low, close)
            floor_data = pivot_service.calculate_floor_pivots(high, low, close)
            fib_data = pivot_service.calculate_fibonacci(high, low, direction="up")

            results[timeframe] = {
                "ohlc": {"high": high, "low": low, "close": close},
                "ohlc_date": ohlc_data["date"].isoformat(),
                "cpr": cpr_data,
                "floor_pivots": floor_data,
                "fibonacci": fib_data,
            }

            # Collect all levels for confluence detection
            tf_prefix = timeframe[0].upper()  # D, W, M
            all_levels.extend(
                [
                    {
                        "name": f"{tf_prefix}_CPR_TC",
                        "value": cpr_data["tc"],
                        "timeframe": timeframe,
                        "type": "cpr",
                    },
                    {
                        "name": f"{tf_prefix}_CPR_Pivot",
                        "value": cpr_data["pivot"],
                        "timeframe": timeframe,
                        "type": "cpr",
                    },
                    {
                        "name": f"{tf_prefix}_CPR_BC",
                        "value": cpr_data["bc"],
                        "timeframe": timeframe,
                        "type": "cpr",
                    },
                    {
                        "name": f"{tf_prefix}_R3",
                        "value": floor_data["r3"],
                        "timeframe": timeframe,
                        "type": "resistance",
                    },
                    {
                        "name": f"{tf_prefix}_R2",
                        "value": floor_data["r2"],
                        "timeframe": timeframe,
                        "type": "resistance",
                    },
                    {
                        "name": f"{tf_prefix}_R1",
                        "value": floor_data["r1"],
                        "timeframe": timeframe,
                        "type": "resistance",
                    },
                    {
                        "name": f"{tf_prefix}_S1",
                        "value": floor_data["s1"],
                        "timeframe": timeframe,
                        "type": "support",
                    },
                    {
                        "name": f"{tf_prefix}_S2",
                        "value": floor_data["s2"],
                        "timeframe": timeframe,
                        "type": "support",
                    },
                    {
                        "name": f"{tf_prefix}_S3",
                        "value": floor_data["s3"],
                        "timeframe": timeframe,
                        "type": "support",
                    },
                    {
                        "name": f"{tf_prefix}_Fib_618",
                        "value": fib_data["level_618"],
                        "timeframe": timeframe,
                        "type": "fibonacci",
                    },
                ]
            )

        # Detect confluence zones (levels within 0.3% of each other from different timeframes)
        confluence_zones = []
        confluence_threshold = 0.003  # 0.3%

        for i, level1 in enumerate(all_levels):
            for level2 in all_levels[i + 1 :]:
                if level1["timeframe"] != level2["timeframe"]:
                    avg_value = (level1["value"] + level2["value"]) / 2
                    diff_pct = abs(level1["value"] - level2["value"]) / avg_value

                    if diff_pct <= confluence_threshold:
                        # Check if this confluence zone already exists
                        zone_exists = False
                        for zone in confluence_zones:
                            if (
                                abs(zone["value"] - avg_value) / avg_value
                                <= confluence_threshold
                            ):
                                # Add to existing zone
                                if level1["name"] not in [
                                    lvl["name"] for lvl in zone["levels"]
                                ]:
                                    zone["levels"].append(level1)
                                if level2["name"] not in [
                                    lvl["name"] for lvl in zone["levels"]
                                ]:
                                    zone["levels"].append(level2)
                                zone["value"] = sum(
                                    lvl["value"] for lvl in zone["levels"]
                                ) / len(zone["levels"])
                                zone["strength"] = len(zone["levels"])
                                zone_exists = True
                                break

                        if not zone_exists:
                            confluence_zones.append(
                                {
                                    "value": round(avg_value, 2),
                                    "levels": [level1, level2],
                                    "strength": 2,
                                    "description": f"{level1['name']} ≈ {level2['name']}",
                                }
                            )

        # Sort confluence zones by strength (number of aligned levels)
        confluence_zones.sort(key=lambda x: x["strength"], reverse=True)

        # Get current price
        yahoo = YahooFinanceProvider()
        yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), f"{symbol}=F")
        current_price_data = await yahoo.get_price(yahoo_symbol, "USD")
        current_price = float(current_price_data.price)

        # Find nearest confluence zone
        nearest_confluence = None
        if confluence_zones:
            nearest_confluence = min(
                confluence_zones, key=lambda z: abs(z["value"] - current_price)
            )
            nearest_confluence["distance"] = round(
                abs(nearest_confluence["value"] - current_price), 2
            )
            nearest_confluence["distance_percent"] = round(
                (abs(nearest_confluence["value"] - current_price) / current_price)
                * 100,
                3,
            )

        return {
            "symbol": symbol.upper(),
            "exchange": exchange.upper(),
            "current_price": current_price,
            "timeframes": results,
            "confluence_zones": [
                {
                    "value": round(z["value"], 2),
                    "strength": z["strength"],
                    "levels": [
                        {
                            "name": lvl["name"],
                            "value": lvl["value"],
                            "timeframe": lvl["timeframe"],
                        }
                        for lvl in z["levels"]
                    ],
                    "description": " + ".join([lvl["name"] for lvl in z["levels"]]),
                }
                for z in confluence_zones[:10]  # Top 10 confluence zones
            ],
            "nearest_confluence": nearest_confluence,
            "market_bias": pivot_service.get_level_bias(
                current_price, results["daily"]["cpr"]
            ),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating multi-timeframe pivots: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error calculating pivots: {str(e)}"
        )


@router.get("/history")
async def get_pivot_history(
    symbol: str,
    timeframe: str = "daily",
    days: int = 30,
    exchange: str = Query("MCX", description="Exchange: MCX or COMEX"),
    tolerance: float = Query(0.3, description="Tolerance percentage for level testing"),
):
    """
    Get historical pivot levels and their accuracy statistics

    Fetches historical OHLC data and calculates real pivot accuracy statistics
    by analyzing how often each level was tested and respected.

    - **symbol**: Trading symbol (GOLD, SILVER, CRUDE, COPPER, etc.)
    - **timeframe**: daily, weekly, or monthly
    - **days**: Number of days of history to analyze (max 365)
    - **exchange**: MCX (India) or COMEX (International)
    - **tolerance**: Percentage tolerance for level testing (default 0.3%)

    Returns historical pivot data with real accuracy metrics.
    """
    symbol = symbol.upper()
    timeframe = timeframe.lower()
    days = min(days, 365)  # Cap at 1 year

    try:
        # Fetch historical data
        today = date.today()
        # Add buffer days for weekends/holidays
        start_date = today - timedelta(days=int(days * 1.5))
        end_date = today

        historical_data = []

        if exchange.upper() == "MCX":
            # Use DhanHQ for MCX data
            if not settings.dhan_client_id or not settings.dhan_access_token:
                raise HTTPException(
                    status_code=503,
                    detail="DhanHQ credentials not configured. Set DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN in .env file.",
                )

            dhan = DhanHQProvider(
                client_id=settings.dhan_client_id,
                access_token=settings.dhan_access_token,
            )

            result = await dhan.get_historical_data(
                symbol=symbol, start_date=start_date, end_date=end_date, interval="1d"
            )

            # Convert to list of dicts for accuracy calculation
            for dp in result.data_points:
                historical_data.append(
                    {
                        "date": dp.date,
                        "open": float(dp.open),
                        "high": float(dp.high),
                        "low": float(dp.low),
                        "close": float(dp.close),
                    }
                )
        else:
            # Use Yahoo Finance for COMEX data
            yahoo = YahooFinanceProvider()
            yahoo_symbol = YAHOO_SYMBOLS.get(symbol, f"{symbol}=F")

            result = await yahoo.get_historical_data(
                symbol=yahoo_symbol,
                start_date=start_date,
                end_date=end_date,
                interval="1d",
            )

            # Convert to list of dicts
            for dp in result.data_points:
                historical_data.append(
                    {
                        "date": dp.date,
                        "open": float(dp.open),
                        "high": float(dp.high),
                        "low": float(dp.low),
                        "close": float(dp.close),
                    }
                )

        # Ensure data is sorted by date ascending
        historical_data.sort(key=lambda x: x["date"])

        # Limit to requested number of days
        if len(historical_data) > days + 1:
            historical_data = historical_data[-(days + 1) :]

        if len(historical_data) < 2:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient historical data for {symbol}. Need at least 2 days.",
            )

        # Calculate real accuracy statistics
        accuracy_result = PivotService.calculate_pivot_accuracy(
            historical_data=historical_data, tolerance_percent=tolerance
        )

        if "error" in accuracy_result:
            raise HTTPException(status_code=400, detail=accuracy_result["error"])

        # Build response
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "exchange": exchange.upper(),
            "period_analyzed": f"Last {len(historical_data) - 1} trading days",
            "total_sessions": accuracy_result["total_sessions_analyzed"],
            "level_accuracy": accuracy_result["level_accuracy"],
            "cpr_statistics": accuracy_result["cpr_statistics"],
            "best_performing_levels": accuracy_result["best_performing_levels"],
            "notes": f"Accuracy calculated with {tolerance}% tolerance. A level is 'respected' if price reverses after testing it.",
            "data_source": "DhanHQ" if exchange.upper() == "MCX" else "Yahoo Finance",
        }

    except HTTPException:
        raise
    except ProviderError as e:
        logger.error(
            f"Provider error fetching historical data for {symbol} on {exchange}: {e}"
        )
        raise HTTPException(
            status_code=503,
            detail=f"Data provider error for {symbol}: {str(e)}. For MCX, ensure security IDs are updated in dhanhq_provider.py",
        )
    except Exception as e:
        logger.error(
            f"Error calculating pivot accuracy for {symbol}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"Error calculating pivot accuracy: {str(e)}"
        )


@router.post("/nearest-level")
async def find_nearest_level(
    symbol: str,
    current_price: float,
    timeframe: str = "daily",
    high: Optional[float] = None,
    low: Optional[float] = None,
    close: Optional[float] = None,
):
    """
    Find the nearest pivot level to current price

    - **symbol**: Trading symbol
    - **current_price**: Current market price
    - **timeframe**: daily, weekly, or monthly
    - **high, low, close**: Previous period OHLC (required for calculation)

    Returns the nearest level and distance from current price.
    """
    try:
        if not all([high, low, close]):
            raise HTTPException(
                status_code=400, detail="high, low, and close parameters are required"
            )

        # Calculate all pivot levels
        cpr_data = pivot_service.calculate_cpr(high, low, close)
        floor_data = pivot_service.calculate_floor_pivots(high, low, close)

        # Combine all levels
        all_levels = {
            "CPR_TC": cpr_data["tc"],
            "CPR_Pivot": cpr_data["pivot"],
            "CPR_BC": cpr_data["bc"],
            "R3": floor_data["r3"],
            "R2": floor_data["r2"],
            "R1": floor_data["r1"],
            "Floor_Pivot": floor_data["pivot"],
            "S1": floor_data["s1"],
            "S2": floor_data["s2"],
            "S3": floor_data["s3"],
        }

        # Find nearest level
        nearest_name, nearest_value, distance = pivot_service.find_nearest_level(
            current_price, all_levels
        )

        # Determine market bias
        bias = pivot_service.get_level_bias(current_price, cpr_data)

        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe.lower(),
            "current_price": current_price,
            "nearest_level": {
                "name": nearest_name,
                "value": nearest_value,
                "distance": distance,
                "distance_percent": round((distance / current_price) * 100, 3),
            },
            "market_bias": bias,
            "all_levels": all_levels,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error finding nearest level: {str(e)}"
        )
