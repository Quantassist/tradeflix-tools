"""
API endpoints for metals spot prices and seasonal analysis
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import logging

from database import get_db
from services.metals_price_service_optimized import (
    MetalsPriceServiceOptimized as MetalsPriceService,
)
from services.seasonal_cache_service import get_cache
from models.seasonal import SeasonalEvent

logger = logging.getLogger(__name__)

router = APIRouter()

# Get cache instance
cache = get_cache()


@router.get("/stats")
async def get_data_stats(db: Session = Depends(get_db)):
    """
    Get statistics about available metals price data

    Returns date range and record count.
    """
    stats = MetalsPriceService.get_date_range_stats(db)
    return stats


@router.get("/prices")
async def get_prices(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    db: Session = Depends(get_db),
):
    """
    Get historical prices for a date range

    - **start_date**: Start date
    - **end_date**: End date
    - **metal**: Metal symbol (GOLD, SILVER, PLATINUM, PALLADIUM)
    - **currency**: Currency (USD or INR)
    """
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    if (end_date - start_date).days > 365:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 365 days")

    prices = MetalsPriceService.get_price_range(
        db, start_date, end_date, metal, currency
    )

    return {
        "metal": metal,
        "currency": currency,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "prices": prices,
        "count": len(prices),
    }


@router.get("/event-impact")
async def get_event_impact(
    event_date: date = Query(..., description="Event date (YYYY-MM-DD)"),
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    days_before: int = Query(default=7, ge=1, le=30, description="Days before event"),
    days_after: int = Query(default=7, ge=1, le=30, description="Days after event"),
    db: Session = Depends(get_db),
):
    """
    Calculate price impact around a specific event date

    - **event_date**: The date of the event
    - **metal**: Metal symbol
    - **currency**: Currency
    - **days_before**: Analysis window before event
    - **days_after**: Analysis window after event
    """
    impact = MetalsPriceService.calculate_event_impact(
        db, event_date, metal, currency, days_before, days_after
    )

    return {
        "event_date": event_date.isoformat(),
        "metal": metal,
        "currency": currency,
        "analysis_window": {"days_before": days_before, "days_after": days_after},
        "impact": impact,
    }


@router.get("/historical-performance")
async def get_historical_event_performance(
    event_month: int = Query(..., ge=1, le=12, description="Event month (1-12)"),
    event_day: int = Query(..., ge=1, le=31, description="Event day (1-31)"),
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    days_before: int = Query(default=7, ge=1, le=30, description="Days before event"),
    days_after: int = Query(default=7, ge=1, le=30, description="Days after event"),
    db: Session = Depends(get_db),
):
    """
    Calculate historical performance for a recurring event across multiple years

    - **event_month**: Month of the event (1-12)
    - **event_day**: Day of the event (1-31)
    - **metal**: Metal symbol
    - **currency**: Currency
    - **years_back**: Number of years to analyze
    - **days_before**: Analysis window before event
    - **days_after**: Analysis window after event

    Returns aggregate metrics and yearly breakdown.
    """
    performance = MetalsPriceService.calculate_historical_event_performance(
        db, event_month, event_day, metal, currency, years_back, days_before, days_after
    )

    return {
        "event_month": event_month,
        "event_day": event_day,
        "metal": metal,
        "currency": currency,
        "years_analyzed": years_back,
        "performance": performance,
    }


@router.get("/monthly-seasonality")
async def get_monthly_seasonality(
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    db: Session = Depends(get_db),
):
    """
    Get monthly seasonality analysis

    - **metal**: Metal symbol
    - **currency**: Currency
    - **years_back**: Number of years to analyze

    Returns average monthly returns and statistics.
    """
    # Check cache first
    cached = cache.get_monthly_seasonality(metal, currency, years_back)
    if cached:
        logger.debug(f"Cache hit for monthly seasonality {metal}/{currency}")
        return {
            "metal": metal,
            "currency": currency,
            "years_analyzed": years_back,
            "monthly_data": cached,
            "cached": True,
        }

    # Compute and cache
    seasonality = MetalsPriceService.get_monthly_seasonality(
        db, metal, currency, years_back
    )
    cache.set_monthly_seasonality(metal, currency, years_back, seasonality)

    return {
        "metal": metal,
        "currency": currency,
        "years_analyzed": years_back,
        "monthly_data": seasonality,
        "cached": False,
    }


@router.get("/seasonal-events-analysis")
async def get_seasonal_events_analysis(
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    days_before: int = Query(
        default=7, ge=1, le=30, description="Days before event to analyze"
    ),
    days_after: int = Query(
        default=7, ge=1, le=30, description="Days after event to analyze"
    ),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive seasonal analysis for all events stored in the database

    Returns analysis for Indian festivals, economic events, and global events.
    Includes volatility analysis for each event.

    Handles both:
    - Fixed-date events (Christmas, Republic Day, etc.) - uses same date each year
    - Lunar-based events (Diwali, Dhanteras, Akshaya Tritiya) - uses actual dates from DB

    - **days_before**: Analysis window before event (default: 7)
    - **days_after**: Analysis window after event (default: 7)
    """
    from datetime import date as date_type
    from collections import defaultdict

    # Fetch events from database
    db_events = (
        db.query(SeasonalEvent)
        .filter(
            SeasonalEvent.is_active == True  # noqa: E712
        )
        .all()
    )

    # Group events by name to handle lunar-based events with multiple dates
    events_by_name = defaultdict(list)
    event_metadata = {}

    for db_event in db_events:
        if db_event.start_date:
            events_by_name[db_event.name].append(db_event)
            # Store metadata from first occurrence
            if db_event.name not in event_metadata:
                event_metadata[db_event.name] = {
                    "type": db_event.event_type.value
                    if db_event.event_type
                    else "custom",
                    "is_lunar_based": db_event.is_lunar_based,
                }

    events_analysis = []

    # Process each unique event
    for event_name, event_occurrences in events_by_name.items():
        try:
            meta = event_metadata[event_name]
            is_lunar = meta["is_lunar_based"]

            if is_lunar:
                # For lunar-based events, use actual dates from database
                event_dates = [e.start_date for e in event_occurrences if e.start_date]
                # Filter to only include dates within years_back range
                current_year = date_type.today().year
                min_year = current_year - years_back
                event_dates = [d for d in event_dates if d.year >= min_year]

                if not event_dates:
                    continue

                performance = MetalsPriceService.calculate_lunar_event_performance(
                    db,
                    event_dates,
                    metal,
                    currency,
                    days_before,
                    days_after,
                )

                # For display, use the most recent occurrence's month/day
                latest_event = max(event_occurrences, key=lambda e: e.start_date)
                display_month = latest_event.start_date.month
                display_day = latest_event.start_date.day
            else:
                # For fixed-date events, use the standard calculation
                first_event = event_occurrences[0]
                display_month = first_event.start_date.month
                display_day = first_event.start_date.day

                performance = MetalsPriceService.calculate_historical_event_performance(
                    db,
                    display_month,
                    display_day,
                    metal,
                    currency,
                    years_back,
                    days_before,
                    days_after,
                )

            # Get volatility analysis (uses first occurrence for reference)
            first_event = event_occurrences[0]
            volatility = MetalsPriceService.get_volatility_analysis(
                db,
                first_event.start_date.month,
                first_event.start_date.day,
                metal,
                currency,
                years_back,
            )

            if performance.get("has_data"):
                events_analysis.append(
                    {
                        "name": event_name,
                        "event_type": meta["type"],
                        "month": display_month,
                        "day": display_day,
                        "is_lunar_based": is_lunar,
                        "avg_price_change": performance.get("avg_change_7d", 0),
                        "win_rate": performance.get("win_rate", 0),
                        "occurrences": performance.get("occurrences", 0),
                        "best_return": performance.get("best_return", 0),
                        "worst_return": performance.get("worst_return", 0),
                        "avg_volatility": performance.get("avg_volatility", 0),
                        # Volatility analysis fields
                        "volatility_increase_pct": volatility.get(
                            "event_week_volatility_increase_pct", 0
                        )
                        if volatility.get("has_data")
                        else 0,
                        "normal_volatility": volatility.get("avg_normal_volatility", 0)
                        if volatility.get("has_data")
                        else 0,
                        "event_volatility": volatility.get(
                            "avg_event_week_volatility", 0
                        )
                        if volatility.get("has_data")
                        else 0,
                        "yearly_data": performance.get("yearly_data", []),
                    }
                )
        except Exception as e:
            logger.warning(f"Error analyzing event {event_name}: {e}")
            continue

    # If no events in DB, use fallback defaults (fixed-date events only)
    if not events_analysis:
        fallback_events = [
            {"name": "Union Budget", "month": 2, "day": 1, "type": "budget_india"},
            {
                "name": "Republic Day",
                "month": 1,
                "day": 26,
                "type": "holiday_trading_india",
            },
            {
                "name": "Independence Day",
                "month": 8,
                "day": 15,
                "type": "holiday_trading_india",
            },
            {
                "name": "Christmas",
                "month": 12,
                "day": 25,
                "type": "holiday_trading_global",
            },
            {
                "name": "New Year",
                "month": 1,
                "day": 1,
                "type": "holiday_trading_global",
            },
        ]

        for event in fallback_events:
            try:
                performance = MetalsPriceService.calculate_historical_event_performance(
                    db,
                    event["month"],
                    event["day"],
                    metal,
                    currency,
                    years_back,
                    days_before,
                    days_after,
                )
                if performance.get("has_data"):
                    events_analysis.append(
                        {
                            "name": event["name"],
                            "event_type": event["type"],
                            "month": event["month"],
                            "day": event["day"],
                            "is_lunar_based": False,
                            "avg_price_change": performance.get("avg_change_7d", 0),
                            "win_rate": performance.get("win_rate", 0),
                            "occurrences": performance.get("occurrences", 0),
                            "best_return": performance.get("best_return", 0),
                            "worst_return": performance.get("worst_return", 0),
                            "avg_volatility": performance.get("avg_volatility", 0),
                            "volatility_increase_pct": 0,
                            "normal_volatility": 0,
                            "event_volatility": 0,
                            "yearly_data": performance.get("yearly_data", []),
                        }
                    )
            except Exception as e:
                logger.warning(f"Error analyzing fallback event {event['name']}: {e}")
                continue

    # Sort by absolute average price change
    events_analysis.sort(key=lambda x: abs(x.get("avg_price_change", 0)), reverse=True)

    return {
        "metal": metal,
        "currency": currency,
        "years_analyzed": years_back,
        "days_before": days_before,
        "days_after": days_after,
        "events": events_analysis,
        "total_events": len(events_analysis),
    }


@router.get("/event-trajectory")
async def get_event_trajectory(
    event_month: int = Query(..., ge=1, le=12, description="Month of event"),
    event_day: int = Query(..., ge=1, le=31, description="Day of event"),
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    days_before: int = Query(default=10, ge=1, le=30, description="Days before event"),
    days_after: int = Query(default=10, ge=1, le=30, description="Days after event"),
    db: Session = Depends(get_db),
):
    """
    Get cumulative return trajectory around an event

    Returns daily cumulative returns from -days_before to +days_after with confidence bands.
    """
    trajectory = MetalsPriceService.get_event_trajectory(
        db, event_month, event_day, metal, currency, years_back, days_before, days_after
    )

    if not trajectory.get("has_data"):
        raise HTTPException(
            status_code=404, detail=trajectory.get("error", "No data available")
        )

    return {
        "metal": metal,
        "currency": currency,
        "event_month": event_month,
        "event_day": event_day,
        **trajectory,
    }


@router.get("/upcoming-alerts")
async def get_upcoming_alerts(
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years for historical analysis (supports fractions like 0.5 for 6 months)",
    ),
    alert_days: int = Query(
        default=30, ge=1, le=90, description="Days ahead to look for events"
    ),
    db: Session = Depends(get_db),
):
    """
    Get upcoming event alerts with historical context

    Returns alerts for events happening within alert_days, with historical performance data.
    """
    # Fetch events from database
    db_events = (
        db.query(SeasonalEvent)
        .filter(
            SeasonalEvent.is_active == True  # noqa: E712
        )
        .all()
    )

    # Deduplicate events by name to avoid duplicate alerts
    seen_names = set()
    events = []
    for db_event in db_events:
        if db_event.start_date and db_event.name not in seen_names:
            seen_names.add(db_event.name)
            events.append(
                {
                    "name": db_event.name,
                    "month": db_event.start_date.month,
                    "day": db_event.start_date.day,
                    "type": db_event.event_type.value
                    if db_event.event_type
                    else "custom",
                }
            )

    alerts = MetalsPriceService.get_upcoming_events_alerts(
        db, events, metal, currency, years_back, alert_days
    )

    return {
        "metal": metal,
        "currency": currency,
        "alert_days": alert_days,
        "alerts": alerts,
        "total_alerts": len(alerts),
    }


@router.get("/volatility-analysis")
async def get_volatility_analysis(
    event_month: int = Query(..., ge=1, le=12, description="Month of event"),
    event_day: int = Query(..., ge=1, le=31, description="Day of event"),
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    db: Session = Depends(get_db),
):
    """
    Get volatility analysis around an event

    Returns volatility metrics for normal period, pre-event, event week, and post-event.
    """
    analysis = MetalsPriceService.get_volatility_analysis(
        db, event_month, event_day, metal, currency, years_back
    )

    if not analysis.get("has_data"):
        raise HTTPException(
            status_code=404, detail=analysis.get("error", "No data available")
        )

    return {
        "metal": metal,
        "currency": currency,
        "event_month": event_month,
        "event_day": event_day,
        **analysis,
    }


@router.get("/multi-metal-seasonality")
async def get_multi_metal_seasonality(
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    db: Session = Depends(get_db),
):
    """
    Get monthly seasonality for all metals for comparison

    Returns monthly data for GOLD, SILVER, PLATINUM, PALLADIUM.
    """
    seasonality = MetalsPriceService.get_multi_metal_seasonality(
        db, currency, years_back
    )

    return {
        "currency": currency,
        "years_analyzed": years_back,
        "metals": seasonality,
    }


@router.get("/calendar-heatmap")
async def get_calendar_heatmap(
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    years_back: float = Query(
        default=10,
        ge=0.08,
        le=20,
        description="Years to analyze (supports fractions like 0.5 for 6 months)",
    ),
    db: Session = Depends(get_db),
):
    """
    Get daily calendar heatmap data

    Returns average daily returns for each day of the year (365 days).
    Note: This endpoint may be slow due to the large amount of data processing.
    """
    heatmap = MetalsPriceService.get_daily_calendar_heatmap(
        db, metal, currency, years_back
    )

    return {
        "metal": metal,
        "currency": currency,
        "years_analyzed": years_back,
        "daily_data": heatmap,
        "total_days": len(heatmap),
    }


@router.get("/recession-indicators")
async def get_recession_indicators(
    metal: str = Query(default="GOLD", description="GOLD, SILVER, PLATINUM, PALLADIUM"),
    currency: str = Query(default="INR", description="USD or INR"),
    db: Session = Depends(get_db),
):
    """
    Get gold/silver performance during historical recession periods.

    Analyzes how metals performed during major economic downturns and crises.
    Recession periods are fetched from the database (event_type = 'recession_crisis').
    """
    # Fetch recession periods from database
    recession_events = (
        db.query(SeasonalEvent)
        .filter(
            SeasonalEvent.event_type == "recession_crisis",
            SeasonalEvent.is_active == True,  # noqa: E712
        )
        .order_by(SeasonalEvent.start_date)
        .all()
    )

    results = []

    for event in recession_events:
        start_date = event.start_date
        end_date = event.end_date or event.start_date

        try:
            # Get prices for the recession period
            prices = MetalsPriceService.get_price_range(
                db, start_date, end_date, metal, currency
            )

            if prices and len(prices) >= 2:
                start_price = prices[0]["price"]
                end_price = prices[-1]["price"]
                price_change = ((end_price - start_price) / start_price) * 100

                # Calculate max drawdown and max gain during period
                price_values = [p["price"] for p in prices]
                max_price = max(price_values)
                min_price = min(price_values)
                max_gain = ((max_price - start_price) / start_price) * 100
                max_drawdown = ((min_price - start_price) / start_price) * 100

                # Calculate volatility
                if len(price_values) > 1:
                    import statistics

                    returns = [
                        (price_values[i] - price_values[i - 1])
                        / price_values[i - 1]
                        * 100
                        for i in range(1, len(price_values))
                    ]
                    volatility = statistics.stdev(returns) if len(returns) > 1 else 0
                else:
                    volatility = 0

                results.append(
                    {
                        "name": event.name,
                        "type": event.region or "global",  # region stores crisis type
                        "start_date": str(start_date),
                        "end_date": str(end_date),
                        "duration_days": (end_date - start_date).days,
                        "price_change_pct": round(price_change, 2),
                        "max_gain_pct": round(max_gain, 2),
                        "max_drawdown_pct": round(max_drawdown, 2),
                        "volatility": round(volatility, 3),
                        "start_price": round(start_price, 2),
                        "end_price": round(end_price, 2),
                        "data_points": len(prices),
                        "has_data": True,
                    }
                )
            else:
                results.append(
                    {
                        "name": event.name,
                        "type": event.region or "global",
                        "start_date": str(start_date),
                        "end_date": str(end_date),
                        "has_data": False,
                        "error": "Insufficient price data for this period",
                    }
                )
        except Exception as e:
            logger.error(f"Error analyzing recession {event.name}: {e}")
            results.append(
                {
                    "name": event.name,
                    "type": event.region or "global",
                    "start_date": str(start_date),
                    "end_date": str(end_date),
                    "has_data": False,
                    "error": str(e),
                }
            )

    # Calculate summary statistics
    valid_results = [r for r in results if r.get("has_data")]
    if valid_results:
        avg_change = sum(r["price_change_pct"] for r in valid_results) / len(
            valid_results
        )
        positive_periods = sum(1 for r in valid_results if r["price_change_pct"] > 0)
        avg_volatility = sum(r["volatility"] for r in valid_results) / len(
            valid_results
        )
        best_period = max(valid_results, key=lambda x: x["price_change_pct"])
        worst_period = min(valid_results, key=lambda x: x["price_change_pct"])
    else:
        avg_change = 0
        positive_periods = 0
        avg_volatility = 0
        best_period = None
        worst_period = None

    return {
        "metal": metal,
        "currency": currency,
        "recession_periods": results,
        "summary": {
            "total_periods": len(results),
            "periods_with_data": len(valid_results),
            "avg_price_change": round(avg_change, 2),
            "positive_periods": positive_periods,
            "positive_rate": round(
                (positive_periods / len(valid_results) * 100) if valid_results else 0, 1
            ),
            "avg_volatility": round(avg_volatility, 3),
            "best_period": best_period["name"] if best_period else None,
            "best_return": best_period["price_change_pct"] if best_period else None,
            "worst_period": worst_period["name"] if worst_period else None,
            "worst_return": worst_period["price_change_pct"] if worst_period else None,
        },
    }


@router.post("/precompute")
async def trigger_precomputation(
    db: Session = Depends(get_db),
):
    """
    Trigger precomputation of seasonal analysis data.

    This endpoint precomputes and caches all seasonal analysis data for faster subsequent requests.
    Should be called after new price data is ingested or periodically (e.g., daily).
    """
    from services.seasonal_cache_service import SeasonalPrecomputeJob

    # Fetch events from database
    db_events = (
        db.query(SeasonalEvent)
        .filter(
            SeasonalEvent.is_active == True  # noqa: E712
        )
        .all()
    )

    events = []
    for db_event in db_events:
        if db_event.start_date:
            events.append(
                {
                    "name": db_event.name,
                    "month": db_event.start_date.month,
                    "day": db_event.start_date.day,
                    "type": db_event.event_type.value
                    if db_event.event_type
                    else "custom",
                }
            )

    if not events:
        return {"status": "error", "message": "No events found in database"}

    # Run precomputation
    job = SeasonalPrecomputeJob(db, cache)
    count = job.precompute_all(events)

    return {
        "status": "success",
        "message": f"Precomputed {count} cache entries",
        "events_processed": len(events),
    }


@router.post("/clear-cache")
async def clear_cache_endpoint():
    """
    Clear all cached seasonal analysis data.

    Use this when you need to force recomputation of all data.
    """
    # Clear in-memory DataFrame cache
    MetalsPriceService.clear_cache()

    # Clear seasonal cache
    if hasattr(cache._cache, "clear"):
        cache._cache.clear()

    return {"status": "success", "message": "Cache cleared"}
