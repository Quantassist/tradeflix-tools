from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import List
import logging

from schemas.cot import (
    COTRequest,
    COTAnalysisResponse,
    COTPositionData,
    COTPercentileData,
    COTSignal,
    COTHistoricalResponse,
    COTChangeAnalysis,
    COTExtremePositioning,
    COTComparisonRequest,
    COTComparisonResponse,
    COTComparisonItem,
)
from services.cot_service import COTService
from services.data_providers import FMPCOTProvider, ProviderError
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
cot_service = COTService()

# COT symbol mappings
COT_SYMBOLS = {
    "GOLD": "GC",
    "SILVER": "SI",
    "CRUDE": "CL",
    "COPPER": "HG",
    "PLATINUM": "PL",
    "PALLADIUM": "PA",
    "NATURALGAS": "NG",
}


async def get_fmp_provider() -> FMPCOTProvider:
    """Get FMP COT provider instance"""
    if not settings.fmp_api_key:
        raise HTTPException(
            status_code=503, detail="FMP COT provider not configured. Set FMP_API_KEY."
        )
    return FMPCOTProvider(settings.fmp_api_key)


async def fetch_cot_data(commodity: str, weeks: int) -> List[COTPositionData]:
    """Fetch real COT data from FMP"""
    provider = await get_fmp_provider()
    cot_symbol = COT_SYMBOLS.get(commodity.upper(), commodity.upper())

    end_date = date.today()
    start_date = end_date - timedelta(weeks=weeks)

    try:
        reports = await provider.get_cot_report(
            cot_symbol, from_date=start_date, to_date=end_date
        )

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        # Convert FMP reports to our schema
        data = []
        for report in reports:
            data.append(
                COTPositionData(
                    report_date=report.report_date,
                    commercial_long=report.commercial_long,
                    commercial_short=report.commercial_short,
                    commercial_net=report.commercial_long - report.commercial_short,
                    non_commercial_long=report.non_commercial_long,
                    non_commercial_short=report.non_commercial_short,
                    non_commercial_net=report.non_commercial_long
                    - report.non_commercial_short,
                    non_reportable_long=report.non_reportable_long,
                    non_reportable_short=report.non_reportable_short,
                    non_reportable_net=report.non_reportable_long
                    - report.non_reportable_short,
                    open_interest=report.open_interest,
                )
            )

        # Sort by date
        data.sort(key=lambda x: x.report_date)
        return data

    except ProviderError as e:
        logger.error(f"FMP COT provider error: {e}")
        raise HTTPException(
            status_code=503, detail=f"COT data provider error: {str(e)}"
        )


@router.post("/analysis", response_model=COTAnalysisResponse)
async def get_cot_analysis(request: COTRequest):
    """
    Get comprehensive COT analysis for a commodity

    - **commodity**: GOLD, SILVER, CRUDE, etc.
    - **weeks**: Number of weeks of historical data (1-260)

    Returns complete COT analysis with positioning, percentiles, and trading signals.
    """
    try:
        # Fetch real COT data from FMP
        historical_data = await fetch_cot_data(request.commodity, request.weeks)

        if not historical_data:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {request.commodity}"
            )

        # Current and previous week data
        current = historical_data[-1]
        previous = historical_data[-2] if len(historical_data) > 1 else current

        # Extract historical net positions for percentile calculation
        commercial_nets = [d.commercial_net for d in historical_data]
        non_commercial_nets = [d.non_commercial_net for d in historical_data]

        # Calculate percentiles
        commercial_percentile_1y = cot_service.calculate_percentile(
            current.commercial_net,
            commercial_nets[-52:] if len(commercial_nets) >= 52 else commercial_nets,
        )

        non_commercial_percentile_1y = cot_service.calculate_percentile(
            current.non_commercial_net,
            non_commercial_nets[-52:]
            if len(non_commercial_nets) >= 52
            else non_commercial_nets,
        )

        # Check for extreme positioning
        comm_is_extreme, comm_extreme_type = cot_service.is_extreme_positioning(
            commercial_percentile_1y
        )
        spec_is_extreme, spec_extreme_type = cot_service.is_extreme_positioning(
            non_commercial_percentile_1y
        )

        commercial_percentile = COTPercentileData(
            current_net_position=current.commercial_net,
            percentile_1y=commercial_percentile_1y,
            percentile_3y=commercial_percentile_1y,  # Mock - same for demo
            percentile_5y=commercial_percentile_1y,  # Mock - same for demo
            is_extreme=comm_is_extreme,
            extreme_level=comm_extreme_type,
        )

        non_commercial_percentile = COTPercentileData(
            current_net_position=current.non_commercial_net,
            percentile_1y=non_commercial_percentile_1y,
            percentile_3y=non_commercial_percentile_1y,
            percentile_5y=non_commercial_percentile_1y,
            is_extreme=spec_is_extreme,
            extreme_level=spec_extreme_type,
        )

        # Calculate changes
        commercial_net_change = current.commercial_net - previous.commercial_net
        non_commercial_net_change = (
            current.non_commercial_net - previous.non_commercial_net
        )
        open_interest_change = current.open_interest - previous.open_interest

        # Generate trading signal
        signal_data = cot_service.generate_cot_signal(
            current.commercial_net,
            commercial_percentile_1y,
            current.non_commercial_net,
            non_commercial_percentile_1y,
            commercial_net_change,
            non_commercial_net_change,
        )

        signal = COTSignal(**signal_data)

        # Calculate averages
        import statistics

        avg_commercial_net = statistics.mean(commercial_nets)
        avg_non_commercial_net = statistics.mean(non_commercial_nets)

        return COTAnalysisResponse(
            commodity=request.commodity.upper(),
            latest_report_date=current.report_date,
            weeks_analyzed=request.weeks,
            current_positions=current,
            commercial_percentile=commercial_percentile,
            non_commercial_percentile=non_commercial_percentile,
            commercial_net_change=commercial_net_change,
            non_commercial_net_change=non_commercial_net_change,
            open_interest_change=open_interest_change,
            signal=signal,
            avg_commercial_net=round(avg_commercial_net, 0),
            avg_non_commercial_net=round(avg_non_commercial_net, 0),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error analyzing COT data: {str(e)}"
        )


@router.get("/historical", response_model=COTHistoricalResponse)
async def get_historical_cot(
    commodity: str = Query(description="Commodity symbol"),
    weeks: int = Query(default=52, ge=1, le=260),
):
    """
    Get historical COT data

    - **commodity**: GOLD, SILVER, CRUDE, etc.
    - **weeks**: Number of weeks of data

    Returns time series of COT positions.
    """
    try:
        # Fetch real COT data from FMP
        data = await fetch_cot_data(commodity, weeks)

        return COTHistoricalResponse(
            commodity=commodity.upper(),
            start_date=data[0].report_date,
            end_date=data[-1].report_date,
            data_points=data,
            total_weeks=len(data),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching historical COT data: {str(e)}"
        )


@router.get("/changes", response_model=COTChangeAnalysis)
async def get_cot_changes(commodity: str = Query(description="Commodity symbol")):
    """
    Get week-over-week changes in COT positions

    - **commodity**: Commodity symbol

    Returns detailed change analysis with interpretation.
    """
    try:
        # Fetch real COT data from FMP
        data = await fetch_cot_data(commodity, 4)  # Need at least 2 weeks
        current = data[-1]
        previous = data[-2] if len(data) > 1 else current

        # Calculate changes
        comm_change, comm_change_pct = cot_service.calculate_position_change(
            current.commercial_net, previous.commercial_net
        )

        spec_change, spec_change_pct = cot_service.calculate_position_change(
            current.non_commercial_net, previous.non_commercial_net
        )

        oi_change, oi_change_pct = cot_service.calculate_position_change(
            current.open_interest, previous.open_interest
        )

        # Generate interpretation
        comm_interp = cot_service.interpret_position_change(
            comm_change, comm_change_pct, "commercial"
        )
        spec_interp = cot_service.interpret_position_change(
            spec_change, spec_change_pct, "non_commercial"
        )

        interpretation = f"{comm_interp} {spec_interp}"

        return COTChangeAnalysis(
            report_date=current.report_date,
            previous_date=previous.report_date,
            commercial_net_change=comm_change,
            commercial_net_change_percent=comm_change_pct,
            non_commercial_net_change=spec_change,
            non_commercial_net_change_percent=spec_change_pct,
            open_interest_change=oi_change,
            open_interest_change_percent=oi_change_pct,
            interpretation=interpretation,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating COT changes: {str(e)}"
        )


@router.get("/extreme", response_model=List[COTExtremePositioning])
async def get_extreme_positioning(
    commodity: str = Query(description="Commodity symbol"),
    weeks: int = Query(default=52, ge=4, le=260),
):
    """
    Identify extreme positioning that may signal reversals

    - **commodity**: Commodity symbol
    - **weeks**: Historical period for percentile calculation

    Returns list of extreme positioning alerts.
    """
    try:
        # Fetch real COT data from FMP
        data = await fetch_cot_data(commodity, weeks)
        current = data[-1]

        commercial_nets = [d.commercial_net for d in data]
        non_commercial_nets = [d.non_commercial_net for d in data]

        import statistics

        comm_avg = statistics.mean(commercial_nets)
        spec_avg = statistics.mean(non_commercial_nets)

        # Calculate percentiles
        comm_percentile = cot_service.calculate_percentile(
            current.commercial_net, commercial_nets
        )
        spec_percentile = cot_service.calculate_percentile(
            current.non_commercial_net, non_commercial_nets
        )

        extremes = []

        # Check commercial positioning
        comm_extreme = cot_service.identify_extreme_positioning(
            current.commercial_net, comm_percentile, comm_avg
        )

        if comm_extreme.get("is_extreme"):
            extremes.append(
                COTExtremePositioning(
                    commodity=commodity.upper(),
                    report_date=current.report_date,
                    position_type="commercial",
                    net_position=current.commercial_net,
                    percentile=comm_percentile,
                    extreme_type=comm_extreme["extreme_type"],
                    historical_context=comm_extreme["historical_context"],
                    potential_reversal=comm_extreme["potential_reversal"],
                )
            )

        # Check speculator positioning
        spec_extreme = cot_service.identify_extreme_positioning(
            current.non_commercial_net, spec_percentile, spec_avg
        )

        if spec_extreme.get("is_extreme"):
            extremes.append(
                COTExtremePositioning(
                    commodity=commodity.upper(),
                    report_date=current.report_date,
                    position_type="non_commercial",
                    net_position=current.non_commercial_net,
                    percentile=spec_percentile,
                    extreme_type=spec_extreme["extreme_type"],
                    historical_context=spec_extreme["historical_context"],
                    potential_reversal=spec_extreme["potential_reversal"],
                )
            )

        return extremes

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error identifying extreme positioning: {str(e)}"
        )


@router.post("/compare", response_model=COTComparisonResponse)
async def compare_commodities(request: COTComparisonRequest):
    """
    Compare COT positioning across multiple commodities

    - **commodities**: List of commodity symbols (2-5)
    - **weeks**: Historical period for analysis

    Returns comparison with most bullish/bearish commodities.
    """
    try:
        if len(request.commodities) < 2:
            raise HTTPException(
                status_code=400, detail="At least 2 commodities required"
            )

        comparison_data = []
        commodity_scores = {}

        for commodity in request.commodities:
            # Fetch real COT data from FMP
            data = await fetch_cot_data(commodity, request.weeks)
            current = data[-1]

            commercial_nets = [d.commercial_net for d in data]
            non_commercial_nets = [d.non_commercial_net for d in data]

            comm_percentile = cot_service.calculate_percentile(
                current.commercial_net, commercial_nets
            )
            spec_percentile = cot_service.calculate_percentile(
                current.non_commercial_net, non_commercial_nets
            )

            # Generate signal
            signal_data = cot_service.generate_cot_signal(
                current.commercial_net,
                comm_percentile,
                current.non_commercial_net,
                spec_percentile,
                0,
                0,
            )

            # Determine sentiment
            if signal_data["signal"] in ["strong_buy", "buy"]:
                sentiment = "bullish"
            elif signal_data["signal"] in ["strong_sell", "sell"]:
                sentiment = "bearish"
            else:
                sentiment = "neutral"

            comparison_data.append(
                COTComparisonItem(
                    commodity=commodity.upper(),
                    commercial_net=current.commercial_net,
                    commercial_percentile=comm_percentile,
                    non_commercial_net=current.non_commercial_net,
                    non_commercial_percentile=spec_percentile,
                    signal=signal_data["signal"],
                    sentiment=sentiment,
                )
            )

            commodity_scores[commodity] = {
                "commercial_percentile": comm_percentile,
                "non_commercial_percentile": spec_percentile,
            }

        # Find most bullish/bearish
        most_bullish, most_bearish = cot_service.compare_commodities(commodity_scores)

        return COTComparisonResponse(
            commodities=[c.upper() for c in request.commodities],
            report_date=date.today(),
            weeks_analyzed=request.weeks,
            comparison_data=comparison_data,
            most_bullish=most_bullish.upper()
            if most_bullish
            else request.commodities[0].upper(),
            most_bearish=most_bearish.upper()
            if most_bearish
            else request.commodities[-1].upper(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error comparing commodities: {str(e)}"
        )
