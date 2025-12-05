from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import List, Optional
import logging

from schemas.seasonal import EventImpactMetrics
from services.seasonal_service import SeasonalService
from services.data_providers import YahooFinanceProvider, ProviderError

logger = logging.getLogger(__name__)

router = APIRouter()
seasonal_service = SeasonalService()

# Symbol mappings
YAHOO_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
}


async def calculate_event_impact_from_data(
    symbol: str, event_date: date, years: int = 5
):
    """Calculate actual historical impact around an event date using real data"""
    yahoo = YahooFinanceProvider()
    yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), f"{symbol}=F")

    yearly_performance = []
    current_year = date.today().year

    for i in range(years):
        year = current_year - i - 1  # Look at past years
        try:
            # Calculate event date for this year
            try:
                event_date_year = date(year, event_date.month, event_date.day)
            except ValueError:
                # Handle Feb 29 on non-leap years
                event_date_year = date(year, event_date.month, 28)

            # Fetch data around the event (7 days before to 7 days after)
            start_date = event_date_year - timedelta(days=10)
            end_date = event_date_year + timedelta(days=10)

            history = await yahoo.get_historical_data(
                yahoo_symbol, start_date, end_date, "1d", "USD"
            )

            if not history.data_points or len(history.data_points) < 5:
                continue

            # Find prices around event
            closes = [float(dp.close) for dp in history.data_points]
            highs = [float(dp.high) for dp in history.data_points]
            lows = [float(dp.low) for dp in history.data_points]

            # Calculate metrics
            price_before = closes[0] if closes else 0
            price_after = closes[-1] if closes else 0

            if price_before > 0:
                change_7d = ((price_after - price_before) / price_before) * 100
                max_gain = ((max(highs) - price_before) / price_before) * 100
                max_loss = ((min(lows) - price_before) / price_before) * 100

                yearly_performance.append(
                    {
                        "year": year,
                        "change_7d": round(change_7d, 2),
                        "max_gain": round(max_gain, 2),
                        "max_loss": round(max_loss, 2),
                    }
                )

        except ProviderError as e:
            logger.warning(f"Could not fetch data for {year}: {e}")
            continue
        except Exception as e:
            logger.warning(f"Error processing {year}: {e}")
            continue

    return yearly_performance


@router.get("/events", response_model=List[dict])
async def get_seasonal_events(
    month: Optional[int] = Query(
        default=None, ge=1, le=12, description="Filter by month"
    ),
    event_type: Optional[str] = Query(
        default=None, description="festival, economic, or seasonal"
    ),
):
    """
    Get list of seasonal events that impact gold/silver prices

    - **month**: Filter by specific month (1-12)
    - **event_type**: Filter by event type

    Returns list of major events with their typical impact.
    """
    events = seasonal_service.MAJOR_EVENTS

    # Apply filters
    if month:
        events = [e for e in events if e.get("month") == month]

    if event_type:
        events = [e for e in events if e.get("type") == event_type]

    return events


@router.get("/calendar/{year}")
async def get_seasonal_calendar(
    year: int, symbol: str = Query(default="GOLD", description="GOLD or SILVER")
):
    """
    Get seasonal calendar for a specific year

    - **year**: Year for calendar (2020-2030)
    - **symbol**: Trading symbol

    Returns calendar of events with historical impact analysis.
    """
    # Mock data for demonstration
    # TODO: Fetch from database and calculate actual historical performance

    upcoming_events = []

    for event in seasonal_service.MAJOR_EVENTS[:3]:  # Top 3 events
        # Calculate approximate event date
        if event.get("month"):
            event_date = date(year, event["month"], 15)  # Mid-month approximation
            days_until = seasonal_service.calculate_days_until_event(event_date)

            # Mock historical impact
            impact = EventImpactMetrics(
                event_name=event["name"],
                event_type=event["type"],
                occurrences=5,
                avg_price_change_7d_before=1.2,
                avg_price_change_7d_after=2.5,
                avg_max_gain=3.8,
                avg_max_loss=-1.2,
                win_rate=75.0,
                best_year=year - 1,
                best_return=5.2,
                worst_year=year - 3,
                worst_return=-2.1,
            )

            recommendation, confidence = seasonal_service.generate_recommendation(
                avg_change=2.5, win_rate=75.0, volatility_increase=30.0
            )

            upcoming_events.append(
                {
                    "event": event,
                    "event_date": event_date.isoformat(),
                    "days_until": days_until,
                    "historical_impact": impact.dict(),
                    "recommendation": recommendation,
                    "confidence": confidence,
                }
            )

    return {
        "symbol": symbol,
        "year": year,
        "events": upcoming_events,
        "total_events": len(upcoming_events),
    }


@router.get("/upcoming")
async def get_upcoming_events(
    symbol: str = Query(default="GOLD"),
    days_ahead: int = Query(default=90, ge=1, le=365, description="Look ahead days"),
):
    """
    Get upcoming seasonal events in the next N days

    - **symbol**: GOLD or SILVER
    - **days_ahead**: Number of days to look ahead

    Returns events occurring in the specified timeframe with predictions.
    """
    today = date.today()
    end_date = today + timedelta(days=days_ahead)

    upcoming = []

    for event in seasonal_service.MAJOR_EVENTS:
        if event.get("month"):
            # Calculate this year's event date
            try:
                event_date = date(today.year, event["month"], 15)

                # If event has passed this year, check next year
                if event_date < today:
                    event_date = date(today.year + 1, event["month"], 15)

                if today <= event_date <= end_date:
                    days_until = (event_date - today).days

                    # Mock recommendation
                    recommendation, confidence = (
                        seasonal_service.generate_recommendation(
                            avg_change=2.0
                            if event.get("typical_impact") == "very_high"
                            else 1.0,
                            win_rate=75.0
                            if event.get("typical_impact") == "very_high"
                            else 60.0,
                            volatility_increase=40.0,
                        )
                    )

                    upcoming.append(
                        {
                            "event_name": event["name"],
                            "event_type": event["type"],
                            "event_date": event_date.isoformat(),
                            "days_until": days_until,
                            "typical_impact": event.get("typical_impact", "medium"),
                            "description": event.get("description", ""),
                            "recommendation": recommendation,
                            "confidence": confidence,
                        }
                    )
            except ValueError:
                continue

    # Sort by date
    upcoming.sort(key=lambda x: x["days_until"])

    return {
        "symbol": symbol,
        "period": f"Next {days_ahead} days",
        "upcoming_events": upcoming,
        "count": len(upcoming),
    }


@router.get("/impact/{event_name}")
async def get_event_impact(
    event_name: str,
    symbol: str = Query(default="GOLD"),
    years: int = Query(default=5, ge=1, le=10),
):
    """
    Get detailed historical impact analysis for a specific event

    - **event_name**: Name of the event (e.g., "Diwali", "Akshaya Tritiya")
    - **symbol**: GOLD or SILVER
    - **years**: Number of years to analyze

    Returns detailed performance metrics and yearly breakdown.
    """
    # Find event
    event = next(
        (
            e
            for e in seasonal_service.MAJOR_EVENTS
            if e["name"].lower() == event_name.lower()
        ),
        None,
    )

    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_name}' not found")

    # Calculate event date (use mid-month as approximation)
    event_month = event.get("month", 1)
    event_date_approx = date(date.today().year, event_month, 15)

    # Fetch real historical performance data
    try:
        yearly_performance = await calculate_event_impact_from_data(
            symbol, event_date_approx, years
        )
    except Exception as e:
        logger.warning(f"Could not fetch historical data: {e}")
        yearly_performance = []

    if not yearly_performance:
        # Fallback to estimated data if real data unavailable
        current_year = date.today().year
        for i in range(years):
            year = current_year - i - 1
            yearly_performance.append(
                {
                    "year": year,
                    "change_7d": 2.5 - (i * 0.3),
                    "max_gain": 4.0 - (i * 0.4),
                    "max_loss": -1.5 + (i * 0.2),
                    "estimated": True,
                }
            )

    # Calculate aggregate metrics
    aggregate = seasonal_service.calculate_historical_performance(yearly_performance)

    # Calculate risk metrics
    risk_metrics = seasonal_service.calculate_risk_metrics(yearly_performance)

    return {
        "event": event,
        "symbol": symbol,
        "years_analyzed": years,
        "yearly_performance": yearly_performance,
        "aggregate_metrics": aggregate,
        "risk_metrics": risk_metrics,
        "recommendation": seasonal_service.generate_recommendation(
            aggregate.get("avg_change_7d", 0), aggregate.get("win_rate", 0), 30.0
        )[0],
    }


@router.get("/best-opportunities")
async def get_best_opportunities(
    symbol: str = Query(default="GOLD"),
    min_win_rate: float = Query(default=70.0, ge=0, le=100),
    min_avg_return: float = Query(default=1.5, ge=0),
):
    """
    Get best seasonal trading opportunities based on historical performance

    - **symbol**: GOLD or SILVER
    - **min_win_rate**: Minimum win rate percentage
    - **min_avg_return**: Minimum average return percentage

    Returns ranked list of best opportunities.
    """
    opportunities = []

    for event in seasonal_service.MAJOR_EVENTS:
        # Mock performance data
        # TODO: Calculate from actual historical data
        if event.get("typical_impact") in ["high", "very_high"]:
            win_rate = 75.0 if event.get("typical_impact") == "very_high" else 65.0
            avg_return = 2.5 if event.get("typical_impact") == "very_high" else 1.8

            if win_rate >= min_win_rate and avg_return >= min_avg_return:
                opportunities.append(
                    {
                        "event_name": event["name"],
                        "event_type": event["type"],
                        "month": event.get("month"),
                        "win_rate": win_rate,
                        "avg_return": avg_return,
                        "risk_level": "low" if win_rate > 70 else "medium",
                        "description": event.get("description", ""),
                        "score": (
                            win_rate * 0.6 + avg_return * 10 * 0.4
                        ),  # Weighted score
                    }
                )

    # Sort by score
    opportunities.sort(key=lambda x: x["score"], reverse=True)

    return {
        "symbol": symbol,
        "criteria": {"min_win_rate": min_win_rate, "min_avg_return": min_avg_return},
        "opportunities": opportunities,
        "count": len(opportunities),
    }
