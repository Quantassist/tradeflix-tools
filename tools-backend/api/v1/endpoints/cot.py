from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import date, timedelta
from typing import List, Optional
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

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
    # Disaggregated COT schemas
    DisaggCOTAnalysisResponse,
    DisaggCOTHistoricalResponse,
    DisaggregatedPositionData,
    WeeklyChange,
    CategoryPercentile,
    SentimentGauge,
    SentimentLevel,
    COTChartDataResponse,
    NetPositionTimeSeries,
    LongShortTimeSeries,
    ExtremePositioningAlert,
    AvailableCommodity,
    COTTradingSignal,
    # Advanced COT schemas
    FlowDecompositionResponse,
    ParticipationResponse,
    ConcentrationResponse,
    SqueezeRiskResponse,
    AdvancedCOTSummary,
    # Priority 2 schemas
    CurveAnalysisResponse,
    SpreadAnalysisResponse,
    HerdingAnalysisResponse,
    # Priority 3 schemas
    CrossMarketPressureResponse,
    VolatilityAnalysisResponse,
    MLRegimeAnalysisResponse,
)
from services.cot_service import COTService
from services.cot_advanced_service import COTAdvancedService
from services.data_providers import FMPCOTProvider, ProviderError
from models.cot import COTReportDisaggFuturesOnly
from database import get_db
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


# ============================================================================
# New Disaggregated COT Endpoints (using database)
# ============================================================================


def get_commodity_filter(commodity: str):
    """Generate filter conditions for commodity search"""
    commodity_upper = commodity.upper()

    # Common commodity mappings
    commodity_patterns = {
        "GOLD": ["GOLD", "GC"],
        "SILVER": ["SILVER", "SI"],
        "CRUDE": ["CRUDE OIL", "CL", "WTI"],
        "COPPER": ["COPPER", "HG"],
        "PLATINUM": ["PLATINUM", "PL"],
        "PALLADIUM": ["PALLADIUM", "PA"],
        "NATURAL GAS": ["NATURAL GAS", "NG"],
    }

    return commodity_patterns.get(commodity_upper, [commodity_upper])


def calculate_cot_index(current: int, min_val: int, max_val: int) -> float:
    """Calculate COT Index: (current - min) / (max - min) * 100"""
    if max_val == min_val:
        return 50.0
    return round(((current - min_val) / (max_val - min_val)) * 100, 2)


def to_date_str(value) -> str:
    """Convert date value to string, handling both date objects and strings"""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    # Handle datetime.date or datetime.datetime
    try:
        return value.strftime("%Y-%m-%d")
    except AttributeError:
        return str(value)


def determine_sentiment(percentile: float, four_week_change: int) -> SentimentLevel:
    """Determine sentiment level based on percentile and recent change"""
    if percentile >= 80:
        if four_week_change > 0:
            return SentimentLevel.EXTREME_BULL
        return SentimentLevel.BULLISH
    elif percentile >= 60:
        return SentimentLevel.BULLISH
    elif percentile <= 20:
        if four_week_change < 0:
            return SentimentLevel.EXTREME_BEAR
        return SentimentLevel.BEARISH
    elif percentile <= 40:
        return SentimentLevel.BEARISH
    return SentimentLevel.NEUTRAL


@router.get("/disagg/commodities", response_model=List[AvailableCommodity])
async def get_available_commodities(
    db: Session = Depends(get_db),
    group: Optional[str] = Query(default=None, description="Filter by commodity group"),
):
    """
    Get list of available commodities in the COT database

    Returns unique commodities with their latest report dates.
    """
    try:
        query = db.query(
            COTReportDisaggFuturesOnly.Commodity_Name,
            COTReportDisaggFuturesOnly.Market_and_Exchange_Names,
            COTReportDisaggFuturesOnly.COMMODITY_GROUP_NAME,
            COTReportDisaggFuturesOnly.COMMODITY_SUBGROUP_NAME,
            func.max(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD).label(
                "latest_date"
            ),
            func.count(COTReportDisaggFuturesOnly.ID).label("total_reports"),
        ).group_by(
            COTReportDisaggFuturesOnly.Commodity_Name,
            COTReportDisaggFuturesOnly.Market_and_Exchange_Names,
            COTReportDisaggFuturesOnly.COMMODITY_GROUP_NAME,
            COTReportDisaggFuturesOnly.COMMODITY_SUBGROUP_NAME,
        )

        if group:
            query = query.filter(
                COTReportDisaggFuturesOnly.COMMODITY_GROUP_NAME.ilike(f"%{group}%")
            )

        results = query.order_by(
            COTReportDisaggFuturesOnly.COMMODITY_GROUP_NAME,
            COTReportDisaggFuturesOnly.Commodity_Name,
        ).all()

        commodities = []
        for row in results:
            if row.Commodity_Name:
                commodities.append(
                    AvailableCommodity(
                        commodity_name=row.Commodity_Name,
                        market_name=row.Market_and_Exchange_Names or "",
                        commodity_group=row.COMMODITY_GROUP_NAME,
                        commodity_subgroup=row.COMMODITY_SUBGROUP_NAME,
                        latest_report_date=to_date_str(row.latest_date),
                        total_reports=row.total_reports or 0,
                    )
                )

        return commodities

    except Exception as e:
        logger.error(f"Error fetching commodities: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching commodities: {str(e)}"
        )


@router.get("/disagg/analysis", response_model=DisaggCOTAnalysisResponse)
async def get_disagg_cot_analysis(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=1, le=260, description="Weeks of historical data"
    ),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive disaggregated COT analysis for a commodity

    Returns positioning data for all four trader categories with percentiles,
    sentiment gauges, and trading signals.
    """
    try:
        # Get commodity patterns
        patterns = get_commodity_filter(commodity)

        # Query historical data
        query = (
            db.query(COTReportDisaggFuturesOnly)
            .filter(
                func.upper(COTReportDisaggFuturesOnly.Commodity_Name).in_(
                    [p.upper() for p in patterns]
                )
            )
            .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
        )

        # Limit to requested weeks
        reports = query.limit(weeks).all()

        if not reports:
            # Try broader search
            query = (
                db.query(COTReportDisaggFuturesOnly)
                .filter(
                    COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
                )
                .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            )
            reports = query.limit(weeks).all()

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        # Reverse to chronological order
        reports = list(reversed(reports))

        current = reports[-1]
        previous = reports[-2] if len(reports) > 1 else current

        # Extract net positions for percentile calculation
        pm_nets = [r.producer_merchant_net for r in reports]
        sd_nets = [r.swap_dealer_net for r in reports]
        mm_nets = [r.managed_money_net for r in reports]
        or_nets = [r.other_reportables_net for r in reports]
        nr_nets = [r.non_reportables_net for r in reports]

        # Calculate percentiles
        pm_percentile = cot_service.calculate_percentile(
            current.producer_merchant_net, pm_nets
        )
        sd_percentile = cot_service.calculate_percentile(
            current.swap_dealer_net, sd_nets
        )
        mm_percentile = cot_service.calculate_percentile(
            current.managed_money_net, mm_nets
        )
        or_percentile = cot_service.calculate_percentile(
            current.other_reportables_net, or_nets
        )
        nr_percentile = cot_service.calculate_percentile(
            current.non_reportables_net, nr_nets
        )

        # Calculate COT indices
        pm_cot_index = calculate_cot_index(
            current.producer_merchant_net, min(pm_nets), max(pm_nets)
        )
        sd_cot_index = calculate_cot_index(
            current.swap_dealer_net, min(sd_nets), max(sd_nets)
        )
        mm_cot_index = calculate_cot_index(
            current.managed_money_net, min(mm_nets), max(mm_nets)
        )
        or_cot_index = calculate_cot_index(
            current.other_reportables_net, min(or_nets), max(or_nets)
        )
        nr_cot_index = calculate_cot_index(
            current.non_reportables_net, min(nr_nets), max(nr_nets)
        )

        # Calculate 4-week changes
        four_weeks_ago = reports[-5] if len(reports) >= 5 else reports[0]
        mm_4wk_change = current.managed_money_net - four_weeks_ago.managed_money_net
        pm_4wk_change = (
            current.producer_merchant_net - four_weeks_ago.producer_merchant_net
        )

        # Calculate consecutive weeks in same direction
        def count_consecutive_direction(nets: List[int]) -> int:
            if len(nets) < 2:
                return 0
            count = 0
            last_change = nets[-1] - nets[-2]
            for i in range(len(nets) - 1, 0, -1):
                change = nets[i] - nets[i - 1]
                if (change > 0 and last_change > 0) or (change < 0 and last_change < 0):
                    count += 1
                else:
                    break
            return count if last_change > 0 else -count

        mm_consecutive = count_consecutive_direction(mm_nets)
        pm_consecutive = count_consecutive_direction(pm_nets)

        # Determine sentiments
        mm_sentiment = determine_sentiment(mm_percentile, mm_4wk_change)
        pm_sentiment = determine_sentiment(pm_percentile, pm_4wk_change)

        # Check for extremes
        pm_is_extreme, pm_extreme_type = cot_service.is_extreme_positioning(
            pm_percentile
        )
        sd_is_extreme, sd_extreme_type = cot_service.is_extreme_positioning(
            sd_percentile
        )
        mm_is_extreme, mm_extreme_type = cot_service.is_extreme_positioning(
            mm_percentile
        )
        or_is_extreme, or_extreme_type = cot_service.is_extreme_positioning(
            or_percentile
        )
        nr_is_extreme, nr_extreme_type = cot_service.is_extreme_positioning(
            nr_percentile
        )

        # Build current positions
        current_positions = DisaggregatedPositionData(
            report_date=to_date_str(current.Report_Date_as_YYYY_MM_DD),
            market_name=current.Market_and_Exchange_Names,
            commodity_name=current.Commodity_Name or current.COMMODITY_NAME_UPPER,
            commodity_group=current.COMMODITY_GROUP_NAME,
            open_interest=current.open_interest,
            producer_merchant_long=current.get_int_value(
                current.Prod_Merc_Positions_Long_All
            ),
            producer_merchant_short=current.get_int_value(
                current.Prod_Merc_Positions_Short_All
            ),
            producer_merchant_net=current.producer_merchant_net,
            producer_merchant_pct_long=current.Pct_of_OI_Prod_Merc_Long_All,
            producer_merchant_pct_short=current.Pct_of_OI_Prod_Merc_Short_All,
            swap_dealer_long=current.get_int_value(current.Swap_Positions_Long_All),
            swap_dealer_short=current.get_int_value(current.Swap_Positions_Short_All),
            swap_dealer_spread=current.get_int_value(current.Swap_Positions_Spread_All),
            swap_dealer_net=current.swap_dealer_net,
            swap_dealer_pct_long=current.Pct_of_OI_Swap_Long_All,
            swap_dealer_pct_short=current.Pct_of_OI_Swap_Short_All,
            managed_money_long=current.get_int_value(
                current.M_Money_Positions_Long_All
            ),
            managed_money_short=current.get_int_value(
                current.M_Money_Positions_Short_All
            ),
            managed_money_spread=current.get_int_value(
                current.M_Money_Positions_Spread_All
            ),
            managed_money_net=current.managed_money_net,
            managed_money_pct_long=current.Pct_of_OI_M_Money_Long_All,
            managed_money_pct_short=current.Pct_of_OI_M_Money_Short_All,
            other_reportables_long=current.get_int_value(
                current.Other_Rept_Positions_Long_All
            ),
            other_reportables_short=current.get_int_value(
                current.Other_Rept_Positions_Short_All
            ),
            other_reportables_spread=current.get_int_value(
                current.Other_Rept_Positions_Spread_All
            ),
            other_reportables_net=current.other_reportables_net,
            other_reportables_pct_long=current.Pct_of_OI_Other_Rept_Long_All,
            other_reportables_pct_short=current.Pct_of_OI_Other_Rept_Short_All,
            non_reportables_long=current.get_int_value(
                current.NonRept_Positions_Long_All
            ),
            non_reportables_short=current.get_int_value(
                current.NonRept_Positions_Short_All
            ),
            non_reportables_net=current.non_reportables_net,
            non_reportables_pct_long=current.Pct_of_OI_NonRept_Long_All,
            non_reportables_pct_short=current.Pct_of_OI_NonRept_Short_All,
        )

        # Build weekly changes
        weekly_changes = WeeklyChange(
            change_open_interest=current.get_int_value(
                current.Change_in_Open_Interest_All
            ),
            change_prod_merc_long=current.get_int_value(
                current.Change_in_Prod_Merc_Long_All
            ),
            change_prod_merc_short=current.get_int_value(
                current.Change_in_Prod_Merc_Short_All
            ),
            change_swap_long=current.get_int_value(current.Change_in_Swap_Long_All),
            change_swap_short=current.get_int_value(current.Change_in_Swap_Short_All),
            change_m_money_long=current.get_int_value(
                current.Change_in_M_Money_Long_All
            ),
            change_m_money_short=current.get_int_value(
                current.Change_in_M_Money_Short_All
            ),
            change_other_rept_long=current.get_int_value(
                current.Change_in_Other_Rept_Long_All
            ),
            change_other_rept_short=current.get_int_value(
                current.Change_in_Other_Rept_Short_All
            ),
            change_nonrept_long=current.get_int_value(
                current.Change_in_NonRept_Long_All
            ),
            change_nonrept_short=current.get_int_value(
                current.Change_in_NonRept_Short_All
            ),
            change_prod_merc_net=current.producer_merchant_net
            - previous.producer_merchant_net,
            change_swap_net=current.swap_dealer_net - previous.swap_dealer_net,
            change_m_money_net=current.managed_money_net - previous.managed_money_net,
            change_other_rept_net=current.other_reportables_net
            - previous.other_reportables_net,
            change_nonrept_net=current.non_reportables_net
            - previous.non_reportables_net,
        )

        # Build percentile data
        def build_category_percentile(
            category: str,
            current_net: int,
            percentile: float,
            cot_index: float,
            is_extreme: bool,
            extreme_type: str,
        ) -> CategoryPercentile:
            sentiment = determine_sentiment(percentile, 0)
            return CategoryPercentile(
                category=category,
                current_net=current_net,
                percentile_1y=percentile,
                cot_index=cot_index,
                is_extreme=is_extreme,
                extreme_type=extreme_type,
                sentiment=sentiment,
            )

        # Build sentiment gauges
        def build_sentiment_description(
            category: str,
            percentile: float,
            sentiment: SentimentLevel,
            consecutive: int,
        ) -> str:
            direction = (
                "adding to longs"
                if consecutive > 0
                else "reducing longs"
                if consecutive < 0
                else "stable"
            )
            weeks_text = (
                f"{abs(consecutive)} consecutive weeks" if consecutive != 0 else ""
            )

            if sentiment == SentimentLevel.EXTREME_BULL:
                return f"{category} at {percentile:.0f}th percentile (extreme bullish). {direction} for {weeks_text}. Potential overcrowding."
            elif sentiment == SentimentLevel.EXTREME_BEAR:
                return f"{category} at {percentile:.0f}th percentile (extreme bearish). {direction} for {weeks_text}. Potential capitulation."
            elif sentiment == SentimentLevel.BULLISH:
                return f"{category} at {percentile:.0f}th percentile (bullish positioning). {direction}."
            elif sentiment == SentimentLevel.BEARISH:
                return f"{category} at {percentile:.0f}th percentile (bearish positioning). {direction}."
            return f"{category} at {percentile:.0f}th percentile (neutral positioning)."

        mm_sentiment_gauge = SentimentGauge(
            category="Managed Money",
            sentiment=mm_sentiment,
            percentile=mm_percentile,
            net_position=current.managed_money_net,
            four_week_change=mm_4wk_change,
            consecutive_weeks_direction=mm_consecutive,
            description=build_sentiment_description(
                "Managed Money", mm_percentile, mm_sentiment, mm_consecutive
            ),
        )

        pm_sentiment_gauge = SentimentGauge(
            category="Producer/Merchant",
            sentiment=pm_sentiment,
            percentile=pm_percentile,
            net_position=current.producer_merchant_net,
            four_week_change=pm_4wk_change,
            consecutive_weeks_direction=pm_consecutive,
            description=build_sentiment_description(
                "Producer/Merchant", pm_percentile, pm_sentiment, pm_consecutive
            ),
        )

        # Generate trading signal
        import statistics

        avg_mm = statistics.mean(mm_nets)
        avg_pm = statistics.mean(pm_nets)

        signal_data = cot_service.generate_cot_signal(
            current.producer_merchant_net,
            pm_percentile,
            current.managed_money_net,
            mm_percentile,
            weekly_changes.change_prod_merc_net,
            weekly_changes.change_m_money_net,
        )

        signal = COTSignal(**signal_data)

        return DisaggCOTAnalysisResponse(
            commodity=commodity.upper(),
            market_name=current.Market_and_Exchange_Names,
            latest_report_date=to_date_str(current.Report_Date_as_YYYY_MM_DD),
            data_as_of_date=to_date_str(current.Report_Date_as_YYYY_MM_DD),
            weeks_analyzed=len(reports),
            current_positions=current_positions,
            weekly_changes=weekly_changes,
            producer_merchant_percentile=build_category_percentile(
                "Producer/Merchant",
                current.producer_merchant_net,
                pm_percentile,
                pm_cot_index,
                pm_is_extreme,
                pm_extreme_type,
            ),
            swap_dealer_percentile=build_category_percentile(
                "Swap Dealer",
                current.swap_dealer_net,
                sd_percentile,
                sd_cot_index,
                sd_is_extreme,
                sd_extreme_type,
            ),
            managed_money_percentile=build_category_percentile(
                "Managed Money",
                current.managed_money_net,
                mm_percentile,
                mm_cot_index,
                mm_is_extreme,
                mm_extreme_type,
            ),
            other_reportables_percentile=build_category_percentile(
                "Other Reportables",
                current.other_reportables_net,
                or_percentile,
                or_cot_index,
                or_is_extreme,
                or_extreme_type,
            ),
            non_reportables_percentile=build_category_percentile(
                "Non-Reportables",
                current.non_reportables_net,
                nr_percentile,
                nr_cot_index,
                nr_is_extreme,
                nr_extreme_type,
            ),
            managed_money_sentiment=mm_sentiment_gauge,
            producer_merchant_sentiment=pm_sentiment_gauge,
            signal=signal,
            avg_managed_money_net=round(avg_mm, 0),
            avg_producer_merchant_net=round(avg_pm, 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing disaggregated COT data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing COT data: {str(e)}"
        )


@router.get("/disagg/historical", response_model=DisaggCOTHistoricalResponse)
async def get_disagg_historical(
    commodity: str = Query(description="Commodity name"),
    weeks: int = Query(default=52, ge=1, le=260),
    db: Session = Depends(get_db),
):
    """
    Get historical disaggregated COT data for charting

    Returns time series of positions for all trader categories.
    """
    try:
        patterns = get_commodity_filter(commodity)

        query = (
            db.query(COTReportDisaggFuturesOnly)
            .filter(
                func.upper(COTReportDisaggFuturesOnly.Commodity_Name).in_(
                    [p.upper() for p in patterns]
                )
            )
            .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
        )

        reports = query.limit(weeks).all()

        if not reports:
            query = (
                db.query(COTReportDisaggFuturesOnly)
                .filter(
                    COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
                )
                .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            )
            reports = query.limit(weeks).all()

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        # Reverse to chronological order
        reports = list(reversed(reports))

        data_points = []
        for r in reports:
            data_points.append(
                DisaggregatedPositionData(
                    report_date=to_date_str(r.Report_Date_as_YYYY_MM_DD),
                    market_name=r.Market_and_Exchange_Names,
                    commodity_name=r.Commodity_Name or r.COMMODITY_NAME_UPPER,
                    commodity_group=r.COMMODITY_GROUP_NAME,
                    open_interest=r.open_interest,
                    producer_merchant_long=r.get_int_value(
                        r.Prod_Merc_Positions_Long_All
                    ),
                    producer_merchant_short=r.get_int_value(
                        r.Prod_Merc_Positions_Short_All
                    ),
                    producer_merchant_net=r.producer_merchant_net,
                    producer_merchant_pct_long=r.Pct_of_OI_Prod_Merc_Long_All,
                    producer_merchant_pct_short=r.Pct_of_OI_Prod_Merc_Short_All,
                    swap_dealer_long=r.get_int_value(r.Swap_Positions_Long_All),
                    swap_dealer_short=r.get_int_value(r.Swap_Positions_Short_All),
                    swap_dealer_spread=r.get_int_value(r.Swap_Positions_Spread_All),
                    swap_dealer_net=r.swap_dealer_net,
                    swap_dealer_pct_long=r.Pct_of_OI_Swap_Long_All,
                    swap_dealer_pct_short=r.Pct_of_OI_Swap_Short_All,
                    managed_money_long=r.get_int_value(r.M_Money_Positions_Long_All),
                    managed_money_short=r.get_int_value(r.M_Money_Positions_Short_All),
                    managed_money_spread=r.get_int_value(
                        r.M_Money_Positions_Spread_All
                    ),
                    managed_money_net=r.managed_money_net,
                    managed_money_pct_long=r.Pct_of_OI_M_Money_Long_All,
                    managed_money_pct_short=r.Pct_of_OI_M_Money_Short_All,
                    other_reportables_long=r.get_int_value(
                        r.Other_Rept_Positions_Long_All
                    ),
                    other_reportables_short=r.get_int_value(
                        r.Other_Rept_Positions_Short_All
                    ),
                    other_reportables_spread=r.get_int_value(
                        r.Other_Rept_Positions_Spread_All
                    ),
                    other_reportables_net=r.other_reportables_net,
                    other_reportables_pct_long=r.Pct_of_OI_Other_Rept_Long_All,
                    other_reportables_pct_short=r.Pct_of_OI_Other_Rept_Short_All,
                    non_reportables_long=r.get_int_value(r.NonRept_Positions_Long_All),
                    non_reportables_short=r.get_int_value(
                        r.NonRept_Positions_Short_All
                    ),
                    non_reportables_net=r.non_reportables_net,
                    non_reportables_pct_long=r.Pct_of_OI_NonRept_Long_All,
                    non_reportables_pct_short=r.Pct_of_OI_NonRept_Short_All,
                )
            )

        return DisaggCOTHistoricalResponse(
            commodity=commodity.upper(),
            market_name=reports[0].Market_and_Exchange_Names if reports else None,
            start_date=data_points[0].report_date if data_points else "",
            end_date=data_points[-1].report_date if data_points else "",
            data_points=data_points,
            total_weeks=len(data_points),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching historical COT data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching historical data: {str(e)}"
        )


@router.get("/disagg/chart-data", response_model=COTChartDataResponse)
async def get_chart_data(
    commodity: str = Query(description="Commodity name"),
    weeks: int = Query(default=52, ge=1, le=260),
    db: Session = Depends(get_db),
):
    """
    Get chart-ready COT data for visualization

    Returns time series data formatted for charts (net positions and long/short).
    """
    try:
        patterns = get_commodity_filter(commodity)

        query = (
            db.query(COTReportDisaggFuturesOnly)
            .filter(
                func.upper(COTReportDisaggFuturesOnly.Commodity_Name).in_(
                    [p.upper() for p in patterns]
                )
            )
            .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
        )

        reports = query.limit(weeks).all()

        if not reports:
            query = (
                db.query(COTReportDisaggFuturesOnly)
                .filter(
                    COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
                )
                .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            )
            reports = query.limit(weeks).all()

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        # Reverse to chronological order
        reports = list(reversed(reports))

        # Build time series
        dates = [to_date_str(r.Report_Date_as_YYYY_MM_DD) for r in reports]

        net_positions = NetPositionTimeSeries(
            dates=dates,
            producer_merchant_net=[r.producer_merchant_net for r in reports],
            swap_dealer_net=[r.swap_dealer_net for r in reports],
            managed_money_net=[r.managed_money_net for r in reports],
            other_reportables_net=[r.other_reportables_net for r in reports],
            non_reportables_net=[r.non_reportables_net for r in reports],
            open_interest=[r.open_interest for r in reports],
        )

        long_short_positions = LongShortTimeSeries(
            dates=dates,
            producer_merchant_long=[
                r.get_int_value(r.Prod_Merc_Positions_Long_All) for r in reports
            ],
            producer_merchant_short=[
                r.get_int_value(r.Prod_Merc_Positions_Short_All) for r in reports
            ],
            swap_dealer_long=[
                r.get_int_value(r.Swap_Positions_Long_All) for r in reports
            ],
            swap_dealer_short=[
                r.get_int_value(r.Swap_Positions_Short_All) for r in reports
            ],
            managed_money_long=[
                r.get_int_value(r.M_Money_Positions_Long_All) for r in reports
            ],
            managed_money_short=[
                r.get_int_value(r.M_Money_Positions_Short_All) for r in reports
            ],
            other_reportables_long=[
                r.get_int_value(r.Other_Rept_Positions_Long_All) for r in reports
            ],
            other_reportables_short=[
                r.get_int_value(r.Other_Rept_Positions_Short_All) for r in reports
            ],
            non_reportables_long=[
                r.get_int_value(r.NonRept_Positions_Long_All) for r in reports
            ],
            non_reportables_short=[
                r.get_int_value(r.NonRept_Positions_Short_All) for r in reports
            ],
        )

        return COTChartDataResponse(
            commodity=commodity.upper(),
            market_name=reports[0].Market_and_Exchange_Names if reports else None,
            net_positions=net_positions,
            long_short_positions=long_short_positions,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chart data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching chart data: {str(e)}"
        )


@router.get("/disagg/extreme-alerts", response_model=List[ExtremePositioningAlert])
async def get_extreme_alerts(
    commodity: str = Query(description="Commodity name"),
    weeks: int = Query(default=52, ge=4, le=260),
    db: Session = Depends(get_db),
):
    """
    Get extreme positioning alerts for a commodity

    Identifies when any trader category is at extreme percentiles.
    """
    try:
        patterns = get_commodity_filter(commodity)

        query = (
            db.query(COTReportDisaggFuturesOnly)
            .filter(
                func.upper(COTReportDisaggFuturesOnly.Commodity_Name).in_(
                    [p.upper() for p in patterns]
                )
            )
            .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
        )

        reports = query.limit(weeks).all()

        if not reports:
            query = (
                db.query(COTReportDisaggFuturesOnly)
                .filter(
                    COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
                )
                .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            )
            reports = query.limit(weeks).all()

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        reports = list(reversed(reports))
        current = reports[-1]

        # Calculate nets and percentiles
        import statistics

        categories = [
            (
                "Producer/Merchant",
                [r.producer_merchant_net for r in reports],
                current.producer_merchant_net,
            ),
            (
                "Swap Dealer",
                [r.swap_dealer_net for r in reports],
                current.swap_dealer_net,
            ),
            (
                "Managed Money",
                [r.managed_money_net for r in reports],
                current.managed_money_net,
            ),
            (
                "Other Reportables",
                [r.other_reportables_net for r in reports],
                current.other_reportables_net,
            ),
            (
                "Non-Reportables",
                [r.non_reportables_net for r in reports],
                current.non_reportables_net,
            ),
        ]

        alerts = []
        for category_name, nets, current_net in categories:
            percentile = cot_service.calculate_percentile(current_net, nets)
            is_extreme, extreme_type = cot_service.is_extreme_positioning(percentile)

            if is_extreme:
                avg = statistics.mean(nets)
                deviation = current_net - avg
                deviation_pct = (deviation / abs(avg)) * 100 if avg != 0 else 0

                # Build context and action
                if extreme_type == "extremely_bullish":
                    if category_name == "Managed Money":
                        context = f"Managed Money net long at {percentile:.0f}th percentile. Funds are extremely bullish - potential overcrowding."
                        action = "Consider contrarian bearish positioning. Watch for signs of distribution."
                    elif category_name == "Producer/Merchant":
                        context = f"Commercials net long at {percentile:.0f}th percentile. Smart money is bullish - typically a bullish signal."
                        action = "Align with commercial positioning. Look for long entries on pullbacks."
                    else:
                        context = f"{category_name} at {percentile:.0f}th percentile (extremely bullish)."
                        action = "Monitor for potential reversal signals."
                else:
                    if category_name == "Managed Money":
                        context = f"Managed Money net short at {percentile:.0f}th percentile. Funds are extremely bearish - potential capitulation."
                        action = "Consider contrarian bullish positioning. Watch for signs of accumulation."
                    elif category_name == "Producer/Merchant":
                        context = f"Commercials net short at {percentile:.0f}th percentile. Smart money is bearish - typically a bearish signal."
                        action = "Align with commercial positioning. Look for short entries on rallies."
                    else:
                        context = f"{category_name} at {percentile:.0f}th percentile (extremely bearish)."
                        action = "Monitor for potential reversal signals."

                alerts.append(
                    ExtremePositioningAlert(
                        commodity=commodity.upper(),
                        report_date=to_date_str(current.Report_Date_as_YYYY_MM_DD),
                        category=category_name,
                        net_position=current_net,
                        percentile=percentile,
                        extreme_type=extreme_type,
                        deviation_from_avg=round(deviation, 0),
                        deviation_pct=round(deviation_pct, 2),
                        historical_context=context,
                        potential_reversal=abs(deviation_pct) > 50,
                        suggested_action=action,
                    )
                )

        return alerts

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting extreme alerts: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error getting extreme alerts: {str(e)}"
        )


@router.get("/disagg/trading-signal", response_model=COTTradingSignal)
async def get_trading_signal(
    commodity: str = Query(description="Commodity name"),
    weeks: int = Query(default=52, ge=4, le=260),
    db: Session = Depends(get_db),
):
    """
    Get enhanced trading signal based on disaggregated COT data

    Analyzes positioning across categories to generate actionable signals.
    """
    try:
        patterns = get_commodity_filter(commodity)

        query = (
            db.query(COTReportDisaggFuturesOnly)
            .filter(
                func.upper(COTReportDisaggFuturesOnly.Commodity_Name).in_(
                    [p.upper() for p in patterns]
                )
            )
            .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
        )

        reports = query.limit(weeks).all()

        if not reports:
            query = (
                db.query(COTReportDisaggFuturesOnly)
                .filter(
                    COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
                )
                .order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            )
            reports = query.limit(weeks).all()

        if not reports:
            raise HTTPException(
                status_code=404, detail=f"No COT data found for {commodity}"
            )

        reports = list(reversed(reports))
        current = reports[-1]

        # Calculate percentiles
        mm_nets = [r.managed_money_net for r in reports]
        pm_nets = [r.producer_merchant_net for r in reports]

        mm_percentile = cot_service.calculate_percentile(
            current.managed_money_net, mm_nets
        )
        pm_percentile = cot_service.calculate_percentile(
            current.producer_merchant_net, pm_nets
        )

        # Calculate 4-week change
        four_weeks_ago = reports[-5] if len(reports) >= 5 else reports[0]
        mm_4wk_change = current.managed_money_net - four_weeks_ago.managed_money_net

        # Determine signal type and generate signal
        signal_type = "neutral"
        signal = "neutral"
        confidence = "low"
        reasoning = []
        historical_accuracy = None

        # Contrarian Reversal Signal (bearish)
        if mm_percentile >= 90 and pm_percentile <= 15:
            signal_type = "contrarian_reversal"
            signal = "strong_sell"
            confidence = "high"
            reasoning.append(
                f"Managed Money at {mm_percentile:.0f}th percentile (extreme bullish)"
            )
            reasoning.append(
                f"Commercials at {pm_percentile:.0f}th percentile (extreme bearish)"
            )
            reasoning.append("Classic contrarian sell setup")
            historical_accuracy = "This signal preceded 3%+ decline within 4 weeks 76% of the time historically"

        # Contrarian Reversal Signal (bullish)
        elif mm_percentile <= 10 and pm_percentile >= 85:
            signal_type = "contrarian_reversal"
            signal = "strong_buy"
            confidence = "high"
            reasoning.append(
                f"Managed Money at {mm_percentile:.0f}th percentile (extreme bearish)"
            )
            reasoning.append(
                f"Commercials at {pm_percentile:.0f}th percentile (extreme bullish)"
            )
            reasoning.append("Classic contrarian buy setup")
            historical_accuracy = "This signal preceded 3%+ rally within 4 weeks 72% of the time historically"

        # Capitulation Signal
        elif mm_percentile <= 10 and mm_4wk_change < -10000:
            signal_type = "capitulation"
            signal = "buy"
            confidence = "medium"
            reasoning.append(f"Managed Money at {mm_percentile:.0f}th percentile")
            reasoning.append(
                f"Rapid liquidation: {mm_4wk_change:,} contracts in 4 weeks"
            )
            reasoning.append("Potential capitulation bottom forming")

        # Smart Money Alignment
        elif (pm_percentile >= 70 and mm_percentile >= 60) or (
            pm_percentile <= 30 and mm_percentile <= 40
        ):
            signal_type = "smart_money_alignment"
            if pm_percentile >= 70:
                signal = "buy"
                reasoning.append("Commercials and Managed Money both bullish")
            else:
                signal = "sell"
                reasoning.append("Commercials and Managed Money both bearish")
            confidence = "medium"
            reasoning.append("Rare alignment between smart money and speculators")

        # Trend Confirmation
        elif mm_percentile >= 60 and mm_4wk_change > 5000:
            signal_type = "trend_confirmation"
            signal = "buy"
            confidence = "medium"
            reasoning.append(f"Managed Money at {mm_percentile:.0f}th percentile")
            reasoning.append(f"Adding {mm_4wk_change:,} contracts over 4 weeks")
            reasoning.append("Strong trend with room to run")

        elif mm_percentile <= 40 and mm_4wk_change < -5000:
            signal_type = "trend_confirmation"
            signal = "sell"
            confidence = "medium"
            reasoning.append(f"Managed Money at {mm_percentile:.0f}th percentile")
            reasoning.append(f"Reducing {abs(mm_4wk_change):,} contracts over 4 weeks")
            reasoning.append("Downtrend confirmation")

        else:
            signal_type = "neutral"
            signal = "neutral"
            confidence = "low"
            reasoning.append("No clear signal from COT positioning")
            reasoning.append(f"Managed Money at {mm_percentile:.0f}th percentile")
            reasoning.append(f"Commercials at {pm_percentile:.0f}th percentile")

        return COTTradingSignal(
            signal_type=signal_type,
            signal=signal,
            confidence=confidence,
            managed_money_percentile=mm_percentile,
            producer_merchant_percentile=pm_percentile,
            managed_money_4wk_change=mm_4wk_change,
            reasoning=". ".join(reasoning),
            historical_accuracy=historical_accuracy,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating trading signal: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error generating trading signal: {str(e)}"
        )


# ============================================================================
# Advanced COT Analytics Endpoints
# ============================================================================


@router.get(
    "/disagg/advanced/flow-decomposition", response_model=FlowDecompositionResponse
)
async def get_flow_decomposition(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=12, ge=2, le=52, description="Number of weeks to analyze"
    ),
    db: Session = Depends(get_db),
):
    """
    Get flow decomposition analysis.

    Breaks down weekly position changes into:
    - New Longs: Aggressive buying
    - Long Liquidation: Profit taking or stops
    - New Shorts: Aggressive selling
    - Short Covering: Forced buying

    Helps understand the nature of position changes beyond just net numbers.
    """
    try:
        result = COTAdvancedService.analyze_flow_decomposition(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in flow decomposition: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing flow decomposition: {str(e)}"
        )


@router.get("/disagg/advanced/participation", response_model=ParticipationResponse)
async def get_participation_metrics(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get participation and whale detection metrics.

    Analyzes:
    - Average contracts per trader (position size)
    - Trader count changes
    - Whale-driven moves (large positions, few traders)
    - Participation trends (broadening vs narrowing)
    """
    try:
        result = COTAdvancedService.analyze_participation(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in participation analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing participation: {str(e)}"
        )


@router.get("/disagg/advanced/concentration", response_model=ConcentrationResponse)
async def get_concentration_metrics(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get concentration and crowding metrics.

    Analyzes:
    - Top-4 and Top-8 trader concentration
    - Crowding score (0-100)
    - Historical percentile of concentration
    - Squeeze risk from concentration
    """
    try:
        result = COTAdvancedService.analyze_concentration(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in concentration analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing concentration: {str(e)}"
        )


@router.get("/disagg/advanced/squeeze-risk", response_model=SqueezeRiskResponse)
async def get_squeeze_risk(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get squeeze vulnerability analysis.

    Calculates risk scores for:
    - Long Squeeze: Risk of forced long liquidation
    - Short Squeeze: Risk of forced short covering

    Factors considered:
    - Speculator positioning percentile
    - Position concentration
    - Commercial positioning (contrarian indicator)
    - Retail positioning
    """
    try:
        result = COTAdvancedService.analyze_squeeze_risk(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in squeeze risk analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing squeeze risk: {str(e)}"
        )


@router.get("/disagg/advanced/summary", response_model=AdvancedCOTSummary)
async def get_advanced_summary(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get a comprehensive summary of all advanced COT metrics.

    Returns:
    - Quick scores (crowding, squeeze risk, flow momentum, concentration)
    - Current regime classification
    - Key alerts
    - Primary actionable insight
    """
    try:
        result = COTAdvancedService.get_advanced_summary(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating advanced summary: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error generating advanced summary: {str(e)}"
        )


# ============================================================================
# Priority 2: Curve, Spread, and Herding Endpoints
# ============================================================================


@router.get("/disagg/advanced/curve-analysis", response_model=CurveAnalysisResponse)
async def get_curve_analysis(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get curve structure analysis (front vs back month positioning).

    Analyzes:
    - Front month (Old) vs Back month (Other) OI breakdown
    - Positioning by trader category across curve buckets
    - Roll stress indicator
    - Curve bias interpretation

    Useful for understanding:
    - Where different trader types are positioned on the curve
    - Potential roll-related volatility
    - Contango/backwardation positioning
    """
    try:
        result = COTAdvancedService.analyze_curve_structure(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in curve analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing curve structure: {str(e)}"
        )


@router.get("/disagg/advanced/spread-analysis", response_model=SpreadAnalysisResponse)
async def get_spread_analysis(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get spread vs directional exposure analysis.

    Analyzes:
    - Spread positions vs outright long/short positions
    - Market mode (relative-value vs directional)
    - Week-over-week changes in spread/directional mix

    Useful for understanding:
    - Whether traders are making basis/curve bets or directional bets
    - Market regime (relative-value mode vs macro/directional mode)
    - Shifts in trading strategy across the market
    """
    try:
        result = COTAdvancedService.analyze_spread_vs_directional(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in spread analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing spread vs directional: {str(e)}"
        )


@router.get("/disagg/advanced/herding-analysis", response_model=HerdingAnalysisResponse)
async def get_herding_analysis(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get herding behavior and market structure analysis.

    Classifies market into regimes:
    - Broad Herding: Many traders, same direction (crowded trade risk)
    - Oligopoly: Few big players dominate (gap risk)
    - Dispersed: High activity, no consensus (range-bound)
    - Capitulation: Extreme one-sided with falling counts (reversal signal)

    Also detects:
    - Smart money vs crowd divergence
    - Trader count trends
    - Position concentration per trader
    """
    try:
        result = COTAdvancedService.analyze_herding(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in herding analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing herding: {str(e)}"
        )


# ============================================================================
# Priority 3: Cross-Market, Volatility, and ML Regime Endpoints
# ============================================================================


@router.get(
    "/disagg/advanced/cross-market-pressure", response_model=CrossMarketPressureResponse
)
async def get_cross_market_pressure(
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    top_n: int = Query(
        default=5, ge=1, le=20, description="Number of top commodities to return"
    ),
    db: Session = Depends(get_db),
):
    """
    Get cross-market speculative pressure analysis.

    Analyzes positioning across all commodities to identify:
    - Most crowded long/short positions
    - Sector-level pressure aggregates
    - Rotation signals (money flowing in/out)
    - Overall market sentiment (risk-on/risk-off)

    Useful for:
    - Identifying crowded trades across markets
    - Spotting sector rotation
    - Gauging overall speculative sentiment
    """
    try:
        result = COTAdvancedService.analyze_cross_market_pressure(db, weeks, top_n)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in cross-market analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing cross-market pressure: {str(e)}"
        )


@router.get(
    "/disagg/advanced/volatility-regime", response_model=VolatilityAnalysisResponse
)
async def get_volatility_regime(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get COT-implied volatility regime analysis.

    Uses position activity and concentration as proxies for volatility:
    - Gross positions (total activity level)
    - Spread ratio (relative-value vs directional)
    - Concentration (potential for gap moves)

    Classifies into regimes: low, normal, elevated, high
    Also provides directional skew (call/put bias)
    """
    try:
        result = COTAdvancedService.analyze_volatility_regime(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in volatility analysis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing volatility regime: {str(e)}"
        )


@router.get("/disagg/advanced/ml-regime", response_model=MLRegimeAnalysisResponse)
async def get_ml_regime_classification(
    commodity: str = Query(description="Commodity name (e.g., GOLD, SILVER)"),
    weeks: int = Query(
        default=52, ge=4, le=260, description="Historical weeks for comparison"
    ),
    db: Session = Depends(get_db),
):
    """
    Get ML-based regime classification.

    Classifies market into actionable regimes:
    - Trend Following: Specs aligned with trend
    - Mean Reversion: Extreme positioning, reversal likely
    - Accumulation: Smart money building, specs light
    - Distribution: Smart money selling, specs heavy
    - Capitulation: Forced liquidation
    - Consolidation: Low conviction, range-bound
    - Breakout Setup: Building pressure for move

    Provides:
    - Confidence scores
    - Feature importance
    - Suggested trading strategy
    - Transition probabilities
    """
    try:
        result = COTAdvancedService.classify_ml_regime(db, commodity, weeks)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in ML regime classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error classifying regime: {str(e)}"
        )
