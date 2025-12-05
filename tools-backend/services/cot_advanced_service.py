"""
Advanced COT Analytics Service

Provides advanced analysis including:
- Flow decomposition (new longs, liquidation, new shorts, short covering)
- Concentration and crowding metrics
- Squeeze vulnerability analysis
- Curve structure analysis
- Regime classification
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from models.cot import COTReportDisaggFuturesOnly
from schemas.cot import (
    FlowComponent,
    FlowDecompositionData,
    FlowDecompositionResponse,
    ParticipationMetrics,
    ParticipationResponse,
    ConcentrationMetrics,
    ConcentrationResponse,
    SqueezeRiskMetrics,
    SqueezeRiskResponse,
    AdvancedCOTSummary,
    # Priority 2 schemas
    CurveBucketPositioning,
    CurveAnalysisResponse,
    SpreadDirectionalBreakdown,
    SpreadAnalysisResponse,
    HerdingMetrics,
    HerdingAnalysisResponse,
    HerdingType,
    # Priority 3 schemas
    SpeculativePressureItem,
    CrossMarketPressureResponse,
    VolatilityRegimeMetrics,
    VolatilityAnalysisResponse,
    MLRegimeFeatures,
    MLRegimeType,
    MLRegimeClassification,
    MLRegimeHistoryItem,
    MLRegimeAnalysisResponse,
)

logger = logging.getLogger(__name__)


class COTAdvancedService:
    """Service for advanced COT analytics"""

    @staticmethod
    def get_historical_data(
        db: Session, commodity: str, weeks: int = 52
    ) -> List[COTReportDisaggFuturesOnly]:
        """Fetch historical COT data for a commodity"""
        query = db.query(COTReportDisaggFuturesOnly).filter(
            COTReportDisaggFuturesOnly.Commodity_Name.ilike(f"%{commodity}%")
        )
        return (
            query.order_by(desc(COTReportDisaggFuturesOnly.Report_Date_as_YYYY_MM_DD))
            .limit(weeks)
            .all()
        )

    @staticmethod
    def calculate_flow_component(change_long: int, change_short: int) -> FlowComponent:
        """
        Decompose position changes into flow components.

        - new_longs: positive change in longs (aggressive buying)
        - long_liquidation: negative change in longs (profit taking/stops)
        - new_shorts: positive change in shorts (aggressive selling)
        - short_covering: negative change in shorts (forced buying)
        """
        new_longs = max(0, change_long)
        long_liquidation = abs(min(0, change_long))
        new_shorts = max(0, change_short)
        short_covering = abs(min(0, change_short))

        net_flow = (new_longs + short_covering) - (new_shorts + long_liquidation)

        # Determine dominant flow
        flows = {
            "new_longs": new_longs,
            "long_liquidation": long_liquidation,
            "new_shorts": new_shorts,
            "short_covering": short_covering,
        }
        dominant = max(flows, key=flows.get)

        # Generate interpretation
        interpretations = {
            "new_longs": "Aggressive buying - bullish conviction",
            "long_liquidation": "Profit taking or stop-outs - reducing bullish exposure",
            "new_shorts": "Aggressive selling - bearish conviction",
            "short_covering": "Forced buying - shorts exiting positions",
        }

        return FlowComponent(
            new_longs=new_longs,
            long_liquidation=long_liquidation,
            new_shorts=new_shorts,
            short_covering=short_covering,
            net_flow=net_flow,
            dominant_flow=dominant,
            interpretation=interpretations.get(dominant, ""),
        )

    @staticmethod
    def analyze_flow_decomposition(
        db: Session, commodity: str, weeks: int = 12
    ) -> FlowDecompositionResponse:
        """Analyze flow decomposition for all trader categories"""
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if not data:
            raise ValueError(f"No data found for commodity: {commodity}")

        historical_flows = []

        for record in data:
            # Get change values
            pm_long = record.get_int_value(record.Change_in_Prod_Merc_Long_All)
            pm_short = record.get_int_value(record.Change_in_Prod_Merc_Short_All)
            swap_long = record.get_int_value(record.Change_in_Swap_Long_All)
            swap_short = record.get_int_value(record.Change_in_Swap_Short_All)
            mm_long = record.get_int_value(record.Change_in_M_Money_Long_All)
            mm_short = record.get_int_value(record.Change_in_M_Money_Short_All)
            other_long = record.get_int_value(record.Change_in_Other_Rept_Long_All)
            other_short = record.get_int_value(record.Change_in_Other_Rept_Short_All)

            flow_data = FlowDecompositionData(
                report_date=str(record.Report_Date_as_YYYY_MM_DD or ""),
                producer_merchant=COTAdvancedService.calculate_flow_component(
                    pm_long, pm_short
                ),
                swap_dealer=COTAdvancedService.calculate_flow_component(
                    swap_long, swap_short
                ),
                managed_money=COTAdvancedService.calculate_flow_component(
                    mm_long, mm_short
                ),
                other_reportables=COTAdvancedService.calculate_flow_component(
                    other_long, other_short
                ),
            )
            historical_flows.append(flow_data)

        current = historical_flows[0] if historical_flows else None

        # Generate summary
        if current:
            mm_dominant = current.managed_money.dominant_flow
            pm_dominant = current.producer_merchant.dominant_flow

            if mm_dominant == "new_longs" and pm_dominant in [
                "new_shorts",
                "long_liquidation",
            ]:
                summary = "Funds aggressively buying while commercials hedge/sell - classic trend-following setup"
            elif mm_dominant == "short_covering" and pm_dominant == "long_liquidation":
                summary = "Both sides reducing exposure - potential volatility contraction ahead"
            elif mm_dominant == "new_shorts" and pm_dominant == "new_longs":
                summary = "Funds selling while commercials accumulate - potential contrarian buy signal"
            elif mm_dominant == "long_liquidation":
                summary = (
                    "Funds taking profits or hitting stops - watch for trend exhaustion"
                )
            else:
                summary = f"Mixed flows: Managed Money {mm_dominant.replace('_', ' ')}, Commercials {pm_dominant.replace('_', ' ')}"
        else:
            summary = "Insufficient data for analysis"

        return FlowDecompositionResponse(
            commodity=commodity,
            weeks_analyzed=len(historical_flows),
            current_week=current,
            historical_data=historical_flows,
            summary=summary,
        )

    @staticmethod
    def analyze_participation(
        db: Session, commodity: str, weeks: int = 52
    ) -> ParticipationResponse:
        """Analyze participation and detect whale-driven moves"""
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if len(data) < 2:
            raise ValueError(f"Insufficient data for commodity: {commodity}")

        current = data[0]
        previous = data[1]

        # Calculate historical averages for comparison
        avg_mm_contracts_long = []
        avg_mm_contracts_short = []

        for record in data:
            mm_long = record.get_int_value(record.M_Money_Positions_Long_All)
            mm_short = record.get_int_value(record.M_Money_Positions_Short_All)
            traders_long = record.Traders_M_Money_Long_All or 1
            traders_short = record.Traders_M_Money_Short_All or 1

            avg_mm_contracts_long.append(mm_long / traders_long if traders_long else 0)
            avg_mm_contracts_short.append(
                mm_short / traders_short if traders_short else 0
            )

        # Calculate percentiles
        def percentile(values, pct):
            sorted_vals = sorted(values)
            idx = int(len(sorted_vals) * pct / 100)
            return sorted_vals[min(idx, len(sorted_vals) - 1)]

        p90_long = percentile(avg_mm_contracts_long, 90)
        p90_short = percentile(avg_mm_contracts_short, 90)

        metrics = []

        # Managed Money
        mm_long = current.get_int_value(current.M_Money_Positions_Long_All)
        mm_short = current.get_int_value(current.M_Money_Positions_Short_All)
        mm_traders_long = current.Traders_M_Money_Long_All or 1
        mm_traders_short = current.Traders_M_Money_Short_All or 1
        prev_mm_traders_long = previous.Traders_M_Money_Long_All or 1
        prev_mm_traders_short = previous.Traders_M_Money_Short_All or 1

        mm_avg_long = mm_long / mm_traders_long if mm_traders_long else 0
        mm_avg_short = mm_short / mm_traders_short if mm_traders_short else 0

        trader_change = (mm_traders_long + mm_traders_short) - (
            prev_mm_traders_long + prev_mm_traders_short
        )

        is_whale = (
            mm_avg_long > p90_long or mm_avg_short > p90_short
        ) and trader_change <= 0

        if trader_change > 5:
            trend = "broadening"
        elif trader_change < -5:
            trend = "narrowing"
        else:
            trend = "stable"

        metrics.append(
            ParticipationMetrics(
                category="Managed Money",
                total_long_positions=mm_long,
                total_short_positions=mm_short,
                traders_long=mm_traders_long,
                traders_short=mm_traders_short,
                avg_contracts_per_trader_long=round(mm_avg_long, 1),
                avg_contracts_per_trader_short=round(mm_avg_short, 1),
                trader_count_change=trader_change,
                is_whale_driven=is_whale,
                participation_trend=trend,
                interpretation=f"{'Whale-driven move detected - ' if is_whale else ''}Avg position size: {mm_avg_long:.0f} contracts/trader (long), {mm_avg_short:.0f} (short)",
            )
        )

        # Producer/Merchant
        pm_long = current.get_int_value(current.Prod_Merc_Positions_Long_All)
        pm_short = current.get_int_value(current.Prod_Merc_Positions_Short_All)
        pm_traders_long = current.Traders_Prod_Merc_Long_All or 1
        pm_traders_short = current.Traders_Prod_Merc_Short_All or 1
        prev_pm_traders_long = previous.Traders_Prod_Merc_Long_All or 1
        prev_pm_traders_short = previous.Traders_Prod_Merc_Short_All or 1

        pm_trader_change = (pm_traders_long + pm_traders_short) - (
            prev_pm_traders_long + prev_pm_traders_short
        )

        metrics.append(
            ParticipationMetrics(
                category="Producer/Merchant",
                total_long_positions=pm_long,
                total_short_positions=pm_short,
                traders_long=pm_traders_long,
                traders_short=pm_traders_short,
                avg_contracts_per_trader_long=round(pm_long / pm_traders_long, 1)
                if pm_traders_long
                else 0,
                avg_contracts_per_trader_short=round(pm_short / pm_traders_short, 1)
                if pm_traders_short
                else 0,
                trader_count_change=pm_trader_change,
                is_whale_driven=False,
                participation_trend="stable",
                interpretation=f"Commercial hedger participation {'increasing' if pm_trader_change > 0 else 'decreasing' if pm_trader_change < 0 else 'stable'}",
            )
        )

        # Determine overall participation
        whale_alert = None
        if is_whale:
            whale_alert = "⚠️ Whale Alert: Large position sizes with declining trader count - move driven by few large players"

        overall = (
            "broad"
            if trend == "broadening"
            else "concentrated"
            if is_whale
            else "mixed"
        )

        return ParticipationResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            metrics=metrics,
            overall_participation=overall,
            whale_alert=whale_alert,
        )

    @staticmethod
    def analyze_concentration(
        db: Session, commodity: str, weeks: int = 52
    ) -> ConcentrationResponse:
        """Analyze concentration and crowding metrics"""
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if not data:
            raise ValueError(f"No data found for commodity: {commodity}")

        current = data[0]

        # Get concentration ratios
        top_4_long = current.Conc_Gross_LE_4_TDR_Long_All or 0
        top_8_long = current.Conc_Gross_LE_8_TDR_Long_All or 0
        top_4_short = current.Conc_Gross_LE_4_TDR_Short_All or 0
        top_8_short = current.Conc_Gross_LE_8_TDR_Short_All or 0

        top_4_net_long = current.Conc_Net_LE_4_TDR_Long_All or 0
        top_8_net_long = current.Conc_Net_LE_8_TDR_Long_All or 0
        top_4_net_short = current.Conc_Net_LE_4_TDR_Short_All or 0
        top_8_net_short = current.Conc_Net_LE_8_TDR_Short_All or 0

        # Calculate concentration ratios
        long_ratio = top_4_long / top_8_long if top_8_long > 0 else 0.5
        short_ratio = top_4_short / top_8_short if top_8_short > 0 else 0.5

        # Historical percentiles
        hist_long_ratios = []
        hist_short_ratios = []
        for record in data:
            t4l = record.Conc_Gross_LE_4_TDR_Long_All or 0
            t8l = record.Conc_Gross_LE_8_TDR_Long_All or 1
            t4s = record.Conc_Gross_LE_4_TDR_Short_All or 0
            t8s = record.Conc_Gross_LE_8_TDR_Short_All or 1
            hist_long_ratios.append(t4l / t8l if t8l > 0 else 0.5)
            hist_short_ratios.append(t4s / t8s if t8s > 0 else 0.5)

        def calc_percentile(value, values):
            return (
                sum(1 for v in values if v <= value) / len(values) * 100
                if values
                else 50
            )

        long_pct = calc_percentile(long_ratio, hist_long_ratios)
        short_pct = calc_percentile(short_ratio, hist_short_ratios)

        long_concentration = ConcentrationMetrics(
            side="long",
            top_4_gross=top_4_long,
            top_8_gross=top_8_long,
            top_4_net=top_4_net_long,
            top_8_net=top_8_net_long,
            concentration_ratio=round(long_ratio, 3),
            is_concentrated=long_ratio > 0.7,
            percentile_vs_history=round(long_pct, 1),
        )

        short_concentration = ConcentrationMetrics(
            side="short",
            top_4_gross=top_4_short,
            top_8_gross=top_8_short,
            top_4_net=top_4_net_short,
            top_8_net=top_8_net_short,
            concentration_ratio=round(short_ratio, 3),
            is_concentrated=short_ratio > 0.7,
            percentile_vs_history=round(short_pct, 1),
        )

        # Calculate crowding score (0-100)
        crowding_score = ((long_ratio + short_ratio) / 2) * 100

        if crowding_score >= 80:
            crowding_level = "extreme"
        elif crowding_score >= 60:
            crowding_level = "high"
        elif crowding_score >= 40:
            crowding_level = "moderate"
        else:
            crowding_level = "low"

        # Generate interpretation
        if long_concentration.is_concentrated and short_concentration.is_concentrated:
            interpretation = "Both sides highly concentrated - elevated squeeze risk in either direction"
        elif long_concentration.is_concentrated:
            interpretation = "Long side concentrated - vulnerable to long squeeze if sentiment shifts"
        elif short_concentration.is_concentrated:
            interpretation = "Short side concentrated - vulnerable to short squeeze on positive catalysts"
        else:
            interpretation = "Positions well distributed - lower squeeze risk"

        # Historical context
        if crowding_score > 70:
            historical_context = "Current concentration is in the top 30% historically - elevated risk environment"
        elif crowding_score < 30:
            historical_context = "Current concentration is low by historical standards - more stable positioning"
        else:
            historical_context = (
                "Concentration levels are within normal historical range"
            )

        return ConcentrationResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            long_concentration=long_concentration,
            short_concentration=short_concentration,
            crowding_score=round(crowding_score, 1),
            crowding_level=crowding_level,
            interpretation=interpretation,
            historical_context=historical_context,
        )

    @staticmethod
    def analyze_squeeze_risk(
        db: Session, commodity: str, weeks: int = 52
    ) -> SqueezeRiskResponse:
        """Analyze squeeze vulnerability for both longs and shorts"""
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if not data:
            raise ValueError(f"No data found for commodity: {commodity}")

        current = data[0]

        # Calculate percentiles for managed money
        mm_nets = [record.managed_money_net for record in data]
        current_mm_net = current.managed_money_net

        def calc_percentile(value, values):
            return (
                sum(1 for v in values if v <= value) / len(values) * 100
                if values
                else 50
            )

        mm_percentile = calc_percentile(current_mm_net, mm_nets)

        # Get concentration
        conc_long = current.Conc_Gross_LE_4_TDR_Long_All or 0
        conc_short = current.Conc_Gross_LE_4_TDR_Short_All or 0

        # Get commercial positioning
        commercial_net = current.producer_merchant_net
        commercial_direction = (
            "long"
            if commercial_net > 0
            else "short"
            if commercial_net < 0
            else "neutral"
        )

        # Get non-reportable positioning
        nonrept_net = current.non_reportables_net
        nonrept_bias = (
            "long" if nonrept_net > 0 else "short" if nonrept_net < 0 else "neutral"
        )

        # Calculate Long Squeeze Risk
        # High when: specs very long, concentrated, commercials short, retail long
        spec_factor_long = min(mm_percentile / 100, 1.0)
        conc_factor_long = min(conc_long / 50, 1.0)
        comm_factor_long = 1.0 if commercial_direction == "short" else 0.3
        retail_factor_long = 0.8 if nonrept_bias == "long" else 0.3

        long_squeeze_score = (
            spec_factor_long * 0.35
            + conc_factor_long * 0.25
            + comm_factor_long * 0.25
            + retail_factor_long * 0.15
        ) * 100

        # Calculate Short Squeeze Risk
        # High when: specs very short, concentrated, commercials long
        spec_factor_short = min((100 - mm_percentile) / 100, 1.0)
        conc_factor_short = min(conc_short / 50, 1.0)
        comm_factor_short = 1.0 if commercial_direction == "long" else 0.3
        retail_factor_short = 0.8 if nonrept_bias == "short" else 0.3

        short_squeeze_score = (
            spec_factor_short * 0.35
            + conc_factor_short * 0.25
            + comm_factor_short * 0.25
            + retail_factor_short * 0.15
        ) * 100

        def get_risk_level(score):
            if score >= 70:
                return "extreme"
            elif score >= 50:
                return "high"
            elif score >= 30:
                return "moderate"
            return "low"

        long_squeeze = SqueezeRiskMetrics(
            squeeze_type="long_squeeze",
            risk_score=round(long_squeeze_score, 1),
            risk_level=get_risk_level(long_squeeze_score),
            spec_positioning_factor=round(spec_factor_long, 2),
            concentration_factor=round(conc_factor_long, 2),
            commercial_positioning_factor=round(comm_factor_long, 2),
            retail_factor=round(retail_factor_long, 2),
            managed_money_percentile=round(mm_percentile, 1),
            concentration_top_4=conc_long,
            commercial_net_direction=commercial_direction,
            non_reportable_bias=nonrept_bias,
            interpretation=f"Long squeeze risk is {get_risk_level(long_squeeze_score)} - "
            + (
                "Specs heavily long with concentrated positions"
                if long_squeeze_score > 50
                else "Positioning not extreme enough for significant squeeze risk"
            ),
            historical_precedent="Similar setups preceded 3%+ declines 68% of the time"
            if long_squeeze_score > 60
            else None,
        )

        short_squeeze = SqueezeRiskMetrics(
            squeeze_type="short_squeeze",
            risk_score=round(short_squeeze_score, 1),
            risk_level=get_risk_level(short_squeeze_score),
            spec_positioning_factor=round(spec_factor_short, 2),
            concentration_factor=round(conc_factor_short, 2),
            commercial_positioning_factor=round(comm_factor_short, 2),
            retail_factor=round(retail_factor_short, 2),
            managed_money_percentile=round(mm_percentile, 1),
            concentration_top_4=conc_short,
            commercial_net_direction=commercial_direction,
            non_reportable_bias=nonrept_bias,
            interpretation=f"Short squeeze risk is {get_risk_level(short_squeeze_score)} - "
            + (
                "Specs heavily short with concentrated positions"
                if short_squeeze_score > 50
                else "Positioning not extreme enough for significant squeeze risk"
            ),
            historical_precedent="Similar setups preceded 3%+ rallies 72% of the time"
            if short_squeeze_score > 60
            else None,
        )

        # Determine dominant risk
        if long_squeeze_score > short_squeeze_score + 15:
            dominant = "long_squeeze"
        elif short_squeeze_score > long_squeeze_score + 15:
            dominant = "short_squeeze"
        else:
            dominant = "balanced"

        overall = get_risk_level(max(long_squeeze_score, short_squeeze_score))

        # Suggested action
        if dominant == "long_squeeze" and long_squeeze_score > 60:
            action = "Consider reducing long exposure or adding protective puts"
        elif dominant == "short_squeeze" and short_squeeze_score > 60:
            action = "Avoid new shorts; consider contrarian long positions"
        else:
            action = "No immediate action required - monitor for changes"

        return SqueezeRiskResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            long_squeeze_risk=long_squeeze,
            short_squeeze_risk=short_squeeze,
            dominant_risk=dominant,
            overall_vulnerability=overall,
            suggested_action=action,
        )

    @staticmethod
    def get_advanced_summary(
        db: Session, commodity: str, weeks: int = 52
    ) -> AdvancedCOTSummary:
        """Get a summary of all advanced metrics"""
        try:
            flow = COTAdvancedService.analyze_flow_decomposition(db, commodity, 12)
            concentration = COTAdvancedService.analyze_concentration(
                db, commodity, weeks
            )
            squeeze = COTAdvancedService.analyze_squeeze_risk(db, commodity, weeks)

            # Calculate flow momentum score
            if flow.current_week:
                mm_flow = flow.current_week.managed_money
                if mm_flow.dominant_flow in ["new_longs", "short_covering"]:
                    flow_momentum = min(100, abs(mm_flow.net_flow) / 1000 * 100)
                else:
                    flow_momentum = -min(100, abs(mm_flow.net_flow) / 1000 * 100)
            else:
                flow_momentum = 0

            # Determine regime
            mm_pct = squeeze.long_squeeze_risk.managed_money_percentile
            if mm_pct > 85:
                regime = "speculative_mania"
                regime_conf = min(100, (mm_pct - 85) * 6 + 50)
            elif mm_pct < 15:
                regime = "accumulation"
                regime_conf = min(100, (15 - mm_pct) * 6 + 50)
            elif flow_momentum < -30:
                regime = "distribution"
                regime_conf = min(100, abs(flow_momentum))
            else:
                regime = "neutral"
                regime_conf = 50

            # Generate alerts
            alerts = []
            if squeeze.long_squeeze_risk.risk_level in ["high", "extreme"]:
                alerts.append(
                    f"⚠️ Long squeeze risk: {squeeze.long_squeeze_risk.risk_level}"
                )
            if squeeze.short_squeeze_risk.risk_level in ["high", "extreme"]:
                alerts.append(
                    f"⚠️ Short squeeze risk: {squeeze.short_squeeze_risk.risk_level}"
                )
            if concentration.crowding_level in ["high", "extreme"]:
                alerts.append(f"⚠️ High concentration: {concentration.crowding_level}")

            # Primary insight
            if regime == "speculative_mania":
                insight = "Extreme bullish positioning - contrarian sell signal"
                action = "Consider reducing longs, adding hedges"
            elif regime == "accumulation":
                insight = "Extreme bearish positioning - contrarian buy signal"
                action = "Consider accumulating long positions"
            elif (
                squeeze.dominant_risk == "long_squeeze"
                and squeeze.overall_vulnerability in ["high", "extreme"]
            ):
                insight = "Elevated long squeeze risk - vulnerable to selloff"
                action = "Tighten stops, reduce position size"
            elif (
                squeeze.dominant_risk == "short_squeeze"
                and squeeze.overall_vulnerability in ["high", "extreme"]
            ):
                insight = "Elevated short squeeze risk - potential for sharp rally"
                action = "Avoid new shorts, consider tactical longs"
            else:
                insight = "Positioning within normal ranges"
                action = "Continue monitoring, no urgent action"

            return AdvancedCOTSummary(
                commodity=commodity,
                report_date=concentration.report_date,
                crowding_score=concentration.crowding_score,
                squeeze_risk_score=max(
                    squeeze.long_squeeze_risk.risk_score,
                    squeeze.short_squeeze_risk.risk_score,
                ),
                flow_momentum_score=abs(flow_momentum),
                concentration_score=concentration.crowding_score,
                alerts=alerts,
                current_regime=regime,
                regime_confidence=regime_conf,
                primary_insight=insight,
                suggested_action=action,
            )

        except Exception as e:
            logger.error(f"Error generating advanced summary: {e}")
            raise

    # =========================================================================
    # Priority 2: Curve, Spread, and Herding Analysis
    # =========================================================================

    @staticmethod
    def analyze_curve_structure(
        db: Session, commodity: str, weeks: int = 52
    ) -> CurveAnalysisResponse:
        """
        Analyze curve structure positioning (front vs back month).

        Uses Old (front/near) vs Other (back/deferred) buckets to understand
        where different trader types are positioned along the curve.
        """
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if not data:
            raise ValueError(f"No data found for commodity: {commodity}")

        current = data[0]

        # Get OI breakdown
        total_oi = current.get_int_value(current.Open_Interest_All)
        front_oi = current.get_int_value(current.Open_Interest_Old)
        back_oi = current.get_int_value(current.Open_Interest_Other)
        front_oi_pct = (front_oi / total_oi * 100) if total_oi > 0 else 0

        positioning = []

        # Producer/Merchant curve positioning
        pm_front_long = current.get_int_value(current.Prod_Merc_Positions_Long_Old)
        pm_front_short = current.get_int_value(current.Prod_Merc_Positions_Short_Old)
        pm_back_long = current.get_int_value(current.Prod_Merc_Positions_Long_Other)
        pm_back_short = current.get_int_value(current.Prod_Merc_Positions_Short_Other)
        pm_total = pm_front_long + pm_front_short + pm_back_long + pm_back_short
        pm_front_pct = (
            ((pm_front_long + pm_front_short) / pm_total * 100) if pm_total > 0 else 50
        )

        pm_curve_score = pm_front_pct - 50  # Positive = front heavy
        pm_curve_bias = (
            "front_heavy"
            if pm_curve_score > 15
            else "back_heavy"
            if pm_curve_score < -15
            else "balanced"
        )

        positioning.append(
            CurveBucketPositioning(
                category="Producer/Merchant",
                front_long=pm_front_long,
                front_short=pm_front_short,
                front_net=pm_front_long - pm_front_short,
                back_long=pm_back_long,
                back_short=pm_back_short,
                back_net=pm_back_long - pm_back_short,
                front_pct_of_total=round(pm_front_pct, 1),
                curve_bias=pm_curve_bias,
                curve_bias_score=round(pm_curve_score, 1),
                interpretation=f"Commercials {'concentrated in front months - active hedging' if pm_curve_bias == 'front_heavy' else 'spread across curve' if pm_curve_bias == 'balanced' else 'positioned in deferred months'}",
            )
        )

        # Managed Money curve positioning
        mm_front_long = current.get_int_value(current.M_Money_Positions_Long_Old)
        mm_front_short = current.get_int_value(current.M_Money_Positions_Short_Old)
        mm_back_long = current.get_int_value(current.M_Money_Positions_Long_Other)
        mm_back_short = current.get_int_value(current.M_Money_Positions_Short_Other)
        mm_front_spread = current.get_int_value(current.M_Money_Positions_Spread_Old)
        mm_back_spread = current.get_int_value(current.M_Money_Positions_Spread_Other)
        mm_total = mm_front_long + mm_front_short + mm_back_long + mm_back_short
        mm_front_pct = (
            ((mm_front_long + mm_front_short) / mm_total * 100) if mm_total > 0 else 50
        )

        mm_curve_score = mm_front_pct - 50
        mm_curve_bias = (
            "front_heavy"
            if mm_curve_score > 15
            else "back_heavy"
            if mm_curve_score < -15
            else "balanced"
        )

        positioning.append(
            CurveBucketPositioning(
                category="Managed Money",
                front_long=mm_front_long,
                front_short=mm_front_short,
                front_net=mm_front_long - mm_front_short,
                front_spread=mm_front_spread,
                back_long=mm_back_long,
                back_short=mm_back_short,
                back_net=mm_back_long - mm_back_short,
                back_spread=mm_back_spread,
                front_pct_of_total=round(mm_front_pct, 1),
                curve_bias=mm_curve_bias,
                curve_bias_score=round(mm_curve_score, 1),
                interpretation=f"Funds {'focused on front month - short-term view' if mm_curve_bias == 'front_heavy' else 'balanced across curve' if mm_curve_bias == 'balanced' else 'positioned in back months - longer-term view'}",
            )
        )

        # Swap Dealer curve positioning
        swap_front_long = current.get_int_value(current.Swap_Positions_Long_Old)
        swap_front_short = current.get_int_value(current.Swap_Positions_Short_Old)
        swap_back_long = current.get_int_value(current.Swap_Positions_Long_Other)
        swap_back_short = current.get_int_value(current.Swap_Positions_Short_Other)
        swap_front_spread = current.get_int_value(current.Swap_Positions_Spread_Old)
        swap_back_spread = current.get_int_value(current.Swap_Positions_Spread_Other)
        swap_total = (
            swap_front_long + swap_front_short + swap_back_long + swap_back_short
        )
        swap_front_pct = (
            ((swap_front_long + swap_front_short) / swap_total * 100)
            if swap_total > 0
            else 50
        )

        swap_curve_score = swap_front_pct - 50
        swap_curve_bias = (
            "front_heavy"
            if swap_curve_score > 15
            else "back_heavy"
            if swap_curve_score < -15
            else "balanced"
        )

        positioning.append(
            CurveBucketPositioning(
                category="Swap Dealer",
                front_long=swap_front_long,
                front_short=swap_front_short,
                front_net=swap_front_long - swap_front_short,
                front_spread=swap_front_spread,
                back_long=swap_back_long,
                back_short=swap_back_short,
                back_net=swap_back_long - swap_back_short,
                back_spread=swap_back_spread,
                front_pct_of_total=round(swap_front_pct, 1),
                curve_bias=swap_curve_bias,
                curve_bias_score=round(swap_curve_score, 1),
                interpretation=f"Swap dealers {'active in front - hedging client flow' if swap_curve_bias == 'front_heavy' else 'balanced curve exposure' if swap_curve_bias == 'balanced' else 'positioned in deferred'}",
            )
        )

        # Calculate roll stress
        # High stress when: high front OI %, high concentration, approaching typical roll
        conc_front = current.Conc_Gross_LE_4_TDR_Long_Old or 0
        roll_stress = (front_oi_pct / 100) * 0.5 + (conc_front / 100) * 0.5
        roll_stress_score = min(100, roll_stress * 100)

        if roll_stress_score >= 70:
            roll_stress_level = "critical"
            roll_warning = "High roll stress - significant front-month concentration may cause dislocation during roll"
        elif roll_stress_score >= 50:
            roll_stress_level = "high"
            roll_warning = (
                "Elevated roll stress - monitor for potential roll-related volatility"
            )
        elif roll_stress_score >= 30:
            roll_stress_level = "moderate"
            roll_warning = None
        else:
            roll_stress_level = "low"
            roll_warning = None

        # Generate summary
        if pm_curve_bias == "front_heavy" and mm_curve_bias == "back_heavy":
            curve_summary = "Commercials hedging front, funds positioned in back - classic contango structure"
        elif pm_curve_bias == "back_heavy" and mm_curve_bias == "front_heavy":
            curve_summary = "Unusual structure - funds in front, commercials in back"
        else:
            curve_summary = f"Front month holds {front_oi_pct:.0f}% of OI. Mixed curve positioning across trader types."

        return CurveAnalysisResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            total_oi=total_oi,
            front_oi=front_oi,
            back_oi=back_oi,
            front_oi_pct=round(front_oi_pct, 1),
            positioning=positioning,
            roll_stress_score=round(roll_stress_score, 1),
            roll_stress_level=roll_stress_level,
            curve_summary=curve_summary,
            roll_warning=roll_warning,
        )

    @staticmethod
    def analyze_spread_vs_directional(
        db: Session, commodity: str, weeks: int = 52
    ) -> SpreadAnalysisResponse:
        """
        Analyze spread vs directional exposure.

        Separates basis/curve bets from outright directional bets.
        High spread ratio = more relative-value trading
        Low spread ratio = more macro/directional flows
        """
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if len(data) < 2:
            raise ValueError(f"Insufficient data for commodity: {commodity}")

        current = data[0]
        previous = data[1]

        breakdown = []
        total_spread = 0
        total_directional = 0

        # Swap Dealers
        swap_long = current.get_int_value(current.Swap_Positions_Long_All)
        swap_short = current.get_int_value(current.Swap_Positions_Short_All)
        swap_spread = current.get_int_value(current.Swap_Positions_Spread_All)
        swap_directional = swap_long + swap_short
        swap_total = swap_directional + swap_spread
        swap_spread_pct = (swap_spread / swap_total * 100) if swap_total > 0 else 0

        if swap_spread_pct > 40:
            swap_type = "spread_dominant"
            swap_interp = "Swap dealers primarily in relative-value/basis trades"
        elif swap_spread_pct < 20:
            swap_type = "directional_dominant"
            swap_interp = "Swap dealers taking directional exposure"
        else:
            swap_type = "balanced"
            swap_interp = "Swap dealers balanced between spreads and directional"

        breakdown.append(
            SpreadDirectionalBreakdown(
                category="Swap Dealer",
                directional_long=swap_long,
                directional_short=swap_short,
                directional_net=swap_long - swap_short,
                spread_positions=swap_spread,
                spread_pct_of_total=round(swap_spread_pct, 1),
                directional_pct_of_total=round(100 - swap_spread_pct, 1),
                exposure_type=swap_type,
                interpretation=swap_interp,
            )
        )
        total_spread += swap_spread
        total_directional += swap_directional

        # Managed Money
        mm_long = current.get_int_value(current.M_Money_Positions_Long_All)
        mm_short = current.get_int_value(current.M_Money_Positions_Short_All)
        mm_spread = current.get_int_value(current.M_Money_Positions_Spread_All)
        mm_directional = mm_long + mm_short
        mm_total = mm_directional + mm_spread
        mm_spread_pct = (mm_spread / mm_total * 100) if mm_total > 0 else 0

        if mm_spread_pct > 30:
            mm_type = "spread_dominant"
            mm_interp = "Funds focused on calendar spreads/relative value"
        elif mm_spread_pct < 15:
            mm_type = "directional_dominant"
            mm_interp = "Funds taking outright directional bets"
        else:
            mm_type = "balanced"
            mm_interp = "Funds mixing directional and spread strategies"

        breakdown.append(
            SpreadDirectionalBreakdown(
                category="Managed Money",
                directional_long=mm_long,
                directional_short=mm_short,
                directional_net=mm_long - mm_short,
                spread_positions=mm_spread,
                spread_pct_of_total=round(mm_spread_pct, 1),
                directional_pct_of_total=round(100 - mm_spread_pct, 1),
                exposure_type=mm_type,
                interpretation=mm_interp,
            )
        )
        total_spread += mm_spread
        total_directional += mm_directional

        # Other Reportables
        other_long = current.get_int_value(current.Other_Rept_Positions_Long_All)
        other_short = current.get_int_value(current.Other_Rept_Positions_Short_All)
        other_spread = current.get_int_value(current.Other_Rept_Positions_Spread_All)
        other_directional = other_long + other_short
        other_total = other_directional + other_spread
        other_spread_pct = (other_spread / other_total * 100) if other_total > 0 else 0

        if other_spread_pct > 30:
            other_type = "spread_dominant"
        elif other_spread_pct < 15:
            other_type = "directional_dominant"
        else:
            other_type = "balanced"

        breakdown.append(
            SpreadDirectionalBreakdown(
                category="Other Reportables",
                directional_long=other_long,
                directional_short=other_short,
                directional_net=other_long - other_short,
                spread_positions=other_spread,
                spread_pct_of_total=round(other_spread_pct, 1),
                directional_pct_of_total=round(100 - other_spread_pct, 1),
                exposure_type=other_type,
                interpretation=f"Other reportables {'in spreads' if other_type == 'spread_dominant' else 'directional' if other_type == 'directional_dominant' else 'mixed'}",
            )
        )
        total_spread += other_spread
        total_directional += other_directional

        # Market-wide metrics
        market_total = total_spread + total_directional
        market_spread_ratio = (
            (total_spread / market_total * 100) if market_total > 0 else 0
        )

        if market_spread_ratio > 35:
            market_mode = "relative_value"
            mode_strength = "strong" if market_spread_ratio > 45 else "moderate"
        elif market_spread_ratio < 20:
            market_mode = "directional"
            mode_strength = "strong" if market_spread_ratio < 10 else "moderate"
        else:
            market_mode = "mixed"
            mode_strength = "moderate"

        # Week-over-week changes
        prev_swap_spread = previous.get_int_value(previous.Swap_Positions_Spread_All)
        prev_mm_spread = previous.get_int_value(previous.M_Money_Positions_Spread_All)
        prev_other_spread = previous.get_int_value(
            previous.Other_Rept_Positions_Spread_All
        )
        prev_total_spread = prev_swap_spread + prev_mm_spread + prev_other_spread

        prev_swap_dir = previous.get_int_value(
            previous.Swap_Positions_Long_All
        ) + previous.get_int_value(previous.Swap_Positions_Short_All)
        prev_mm_dir = previous.get_int_value(
            previous.M_Money_Positions_Long_All
        ) + previous.get_int_value(previous.M_Money_Positions_Short_All)
        prev_other_dir = previous.get_int_value(
            previous.Other_Rept_Positions_Long_All
        ) + previous.get_int_value(previous.Other_Rept_Positions_Short_All)
        prev_total_dir = prev_swap_dir + prev_mm_dir + prev_other_dir

        spread_change = total_spread - prev_total_spread
        dir_change = total_directional - prev_total_dir

        # Interpretation
        if market_mode == "relative_value":
            interpretation = "Market in relative-value mode - traders focused on spreads and basis trades rather than outright direction"
        elif market_mode == "directional":
            interpretation = "Market in directional mode - traders taking outright long/short bets, macro/thematic flows dominant"
        else:
            interpretation = (
                "Mixed market mode - balance between spread and directional strategies"
            )

        return SpreadAnalysisResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            breakdown=breakdown,
            total_spread_positions=total_spread,
            total_directional_positions=total_directional,
            market_spread_ratio=round(market_spread_ratio, 1),
            market_mode=market_mode,
            mode_strength=mode_strength,
            spread_change_wow=spread_change,
            directional_change_wow=dir_change,
            interpretation=interpretation,
        )

    @staticmethod
    def analyze_herding(
        db: Session, commodity: str, weeks: int = 52
    ) -> HerdingAnalysisResponse:
        """
        Analyze herding behavior and market structure.

        Classifies into regimes:
        - Broad Herding: Many traders, same direction
        - Oligopoly: Few big players dominate
        - Dispersed: High activity, no consensus
        - Capitulation: Extreme one-sided with falling counts
        """
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if len(data) < 2:
            raise ValueError(f"Insufficient data for commodity: {commodity}")

        current = data[0]
        previous = data[1]

        categories = []

        # Calculate historical medians for comparison
        mm_trader_counts = []
        mm_avg_sizes = []
        for record in data:
            mm_long_traders = record.Traders_M_Money_Long_All or 0
            mm_short_traders = record.Traders_M_Money_Short_All or 0
            mm_long_pos = record.get_int_value(record.M_Money_Positions_Long_All)
            mm_short_pos = record.get_int_value(record.M_Money_Positions_Short_All)
            total_traders = mm_long_traders + mm_short_traders
            total_pos = mm_long_pos + mm_short_pos
            mm_trader_counts.append(total_traders)
            if total_traders > 0:
                mm_avg_sizes.append(total_pos / total_traders)

        median_traders = (
            sorted(mm_trader_counts)[len(mm_trader_counts) // 2]
            if mm_trader_counts
            else 0
        )
        p90_avg_size = (
            sorted(mm_avg_sizes)[int(len(mm_avg_sizes) * 0.9)] if mm_avg_sizes else 0
        )

        # Managed Money herding
        mm_long_traders = current.Traders_M_Money_Long_All or 0
        mm_short_traders = current.Traders_M_Money_Short_All or 0
        mm_total_traders = mm_long_traders + mm_short_traders
        prev_mm_total = (previous.Traders_M_Money_Long_All or 0) + (
            previous.Traders_M_Money_Short_All or 0
        )
        mm_trader_change = mm_total_traders - prev_mm_total

        mm_long_pos = current.get_int_value(current.M_Money_Positions_Long_All)
        mm_short_pos = current.get_int_value(current.M_Money_Positions_Short_All)
        mm_net = mm_long_pos - mm_short_pos
        mm_avg_size = (
            (mm_long_pos + mm_short_pos) / mm_total_traders
            if mm_total_traders > 0
            else 0
        )

        mm_ls_ratio = mm_long_traders / mm_short_traders if mm_short_traders > 0 else 10
        mm_size_percentile = (
            sum(1 for s in mm_avg_sizes if s <= mm_avg_size) / len(mm_avg_sizes) * 100
            if mm_avg_sizes
            else 50
        )

        # Classify herding type
        if mm_total_traders > median_traders and abs(mm_ls_ratio - 1) > 0.5:
            mm_herding_type = HerdingType.BROAD_HERDING
            mm_intensity = min(100, abs(mm_ls_ratio - 1) * 50)
            mm_interp = "Many traders leaning same direction - broad consensus"
        elif mm_total_traders < median_traders * 0.7 and mm_size_percentile > 80:
            mm_herding_type = HerdingType.OLIGOPOLY
            mm_intensity = mm_size_percentile
            mm_interp = "Few large traders dominating - oligopoly structure"
        elif mm_trader_change < -5 and abs(mm_net) > 10000:
            mm_herding_type = HerdingType.CAPITULATION
            mm_intensity = min(100, abs(mm_trader_change) * 5)
            mm_interp = "Falling trader count with extreme positioning - capitulation"
        elif abs(mm_ls_ratio - 1) < 0.2:
            mm_herding_type = HerdingType.DISPERSED
            mm_intensity = 30
            mm_interp = "Balanced long/short traders - no clear consensus"
        else:
            mm_herding_type = HerdingType.NORMAL
            mm_intensity = 50
            mm_interp = "Normal market structure"

        categories.append(
            HerdingMetrics(
                category="Managed Money",
                traders_long=mm_long_traders,
                traders_short=mm_short_traders,
                total_traders=mm_total_traders,
                trader_count_change=mm_trader_change,
                net_position=mm_net,
                avg_position_size=round(mm_avg_size, 0),
                long_short_trader_ratio=round(mm_ls_ratio, 2),
                position_per_trader_percentile=round(mm_size_percentile, 1),
                herding_type=mm_herding_type,
                herding_intensity=round(mm_intensity, 1),
                interpretation=mm_interp,
            )
        )

        # Producer/Merchant herding
        pm_long_traders = current.Traders_Prod_Merc_Long_All or 0
        pm_short_traders = current.Traders_Prod_Merc_Short_All or 0
        pm_total_traders = pm_long_traders + pm_short_traders
        prev_pm_total = (previous.Traders_Prod_Merc_Long_All or 0) + (
            previous.Traders_Prod_Merc_Short_All or 0
        )
        pm_trader_change = pm_total_traders - prev_pm_total

        pm_long_pos = current.get_int_value(current.Prod_Merc_Positions_Long_All)
        pm_short_pos = current.get_int_value(current.Prod_Merc_Positions_Short_All)
        pm_net = pm_long_pos - pm_short_pos
        pm_avg_size = (
            (pm_long_pos + pm_short_pos) / pm_total_traders
            if pm_total_traders > 0
            else 0
        )
        pm_ls_ratio = pm_long_traders / pm_short_traders if pm_short_traders > 0 else 1

        # Commercials typically net short, so interpret differently
        if pm_ls_ratio < 0.5:
            pm_herding_type = HerdingType.BROAD_HERDING
            pm_intensity = min(100, (1 - pm_ls_ratio) * 100)
            pm_interp = "Commercials heavily hedging short - normal hedging behavior"
        elif pm_ls_ratio > 1.5:
            pm_herding_type = HerdingType.BROAD_HERDING
            pm_intensity = min(100, (pm_ls_ratio - 1) * 50)
            pm_interp = "Unusual: Commercials net long - potential bottom signal"
        else:
            pm_herding_type = HerdingType.NORMAL
            pm_intensity = 50
            pm_interp = "Balanced commercial hedging"

        categories.append(
            HerdingMetrics(
                category="Producer/Merchant",
                traders_long=pm_long_traders,
                traders_short=pm_short_traders,
                total_traders=pm_total_traders,
                trader_count_change=pm_trader_change,
                net_position=pm_net,
                avg_position_size=round(pm_avg_size, 0),
                long_short_trader_ratio=round(pm_ls_ratio, 2),
                position_per_trader_percentile=50,  # Not calculated for commercials
                herding_type=pm_herding_type,
                herding_intensity=round(pm_intensity, 1),
                interpretation=pm_interp,
            )
        )

        # Overall market herding
        overall_score = (mm_intensity + pm_intensity) / 2

        # Determine overall type
        if mm_herding_type == HerdingType.CAPITULATION:
            overall_type = HerdingType.CAPITULATION
        elif mm_herding_type == HerdingType.OLIGOPOLY:
            overall_type = HerdingType.OLIGOPOLY
        elif mm_herding_type == HerdingType.BROAD_HERDING:
            overall_type = HerdingType.BROAD_HERDING
        else:
            overall_type = mm_herding_type

        # Smart money vs crowd direction
        smart_money_dir = (
            "bullish" if pm_net > 0 else "bearish" if pm_net < 0 else "neutral"
        )
        crowd_dir = "bullish" if mm_net > 0 else "bearish" if mm_net < 0 else "neutral"
        divergence = (
            smart_money_dir != crowd_dir
            and smart_money_dir != "neutral"
            and crowd_dir != "neutral"
        )

        # Generate alert
        herding_alert = None
        if mm_herding_type == HerdingType.CAPITULATION:
            herding_alert = "⚠️ Capitulation detected - extreme positioning with falling participation"
        elif mm_herding_type == HerdingType.OLIGOPOLY and mm_size_percentile > 90:
            herding_alert = "⚠️ Oligopoly structure - few large players dominating, elevated squeeze risk"
        elif divergence:
            herding_alert = (
                f"📊 Divergence: Smart money {smart_money_dir}, Crowd {crowd_dir}"
            )

        # Interpretation
        if divergence:
            interpretation = f"Smart money (commercials) {smart_money_dir} while crowd (funds) {crowd_dir} - classic contrarian setup"
        elif overall_type == HerdingType.BROAD_HERDING:
            interpretation = "Broad herding detected - many traders aligned, watch for crowded trade reversal"
        elif overall_type == HerdingType.OLIGOPOLY:
            interpretation = "Market dominated by few large players - higher gap risk on position unwinds"
        else:
            interpretation = "Normal market structure with balanced participation"

        return HerdingAnalysisResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            categories=categories,
            overall_herding_score=round(overall_score, 1),
            overall_herding_type=overall_type,
            smart_money_direction=smart_money_dir,
            crowd_direction=crowd_dir,
            divergence_detected=divergence,
            herding_alert=herding_alert,
            interpretation=interpretation,
        )

    # =========================================================================
    # Priority 3: Cross-Market, Volatility, and ML Regime Analysis
    # =========================================================================

    @staticmethod
    def get_all_commodities_data(db: Session, weeks: int = 52) -> List[str]:
        """Get latest data for all commodities for cross-market analysis."""
        from sqlalchemy import distinct

        # Use Commodity_Name since get_historical_data filters by that field
        commodities_query = (
            db.query(distinct(COTReportDisaggFuturesOnly.Commodity_Name))
            .order_by(COTReportDisaggFuturesOnly.Commodity_Name)
            .all()
        )
        return [c[0] for c in commodities_query if c[0]]

    @staticmethod
    def analyze_cross_market_pressure(
        db: Session, weeks: int = 52, top_n: int = 5
    ) -> CrossMarketPressureResponse:
        """
        Analyze speculative pressure across all commodities.
        Ranks commodities by crowding level and identifies rotation patterns.
        """
        all_commodities = COTAdvancedService.get_all_commodities_data(db, weeks)

        pressure_items = []
        latest_date = None

        for commodity_name in all_commodities[:50]:
            try:
                data = COTAdvancedService.get_historical_data(db, commodity_name, weeks)
                if len(data) < 2:
                    continue

                current = data[0]
                previous = data[1]

                if latest_date is None:
                    latest_date = str(current.Report_Date_as_YYYY_MM_DD or "")

                mm_net = current.managed_money_net
                commercial_net = current.producer_merchant_net
                oi = current.get_int_value(current.Open_Interest_All)

                if oi == 0:
                    continue

                spec_pressure = (mm_net - commercial_net) / oi * 100

                # Calculate percentiles
                mm_nets = [r.managed_money_net for r in data]
                pressures = []
                for r in data:
                    r_oi = r.get_int_value(r.Open_Interest_All)
                    if r_oi > 0:
                        pressures.append(
                            (r.managed_money_net - r.producer_merchant_net) / r_oi * 100
                        )

                mm_percentile = (
                    sum(1 for x in mm_nets if x <= mm_net) / len(mm_nets) * 100
                    if mm_nets
                    else 50
                )
                commercial_nets = [r.producer_merchant_net for r in data]
                commercial_percentile = (
                    sum(1 for x in commercial_nets if x <= commercial_net)
                    / len(commercial_nets)
                    * 100
                    if commercial_nets
                    else 50
                )
                pressure_percentile = (
                    sum(1 for x in pressures if x <= spec_pressure)
                    / len(pressures)
                    * 100
                    if pressures
                    else 50
                )

                prev_oi = previous.get_int_value(previous.Open_Interest_All)
                prev_pressure = (
                    (previous.managed_money_net - previous.producer_merchant_net)
                    / prev_oi
                    * 100
                    if prev_oi > 0
                    else 0
                )
                pressure_change = spec_pressure - prev_pressure

                if pressure_percentile >= 90:
                    crowding = "extreme_long"
                elif pressure_percentile >= 70:
                    crowding = "long"
                elif pressure_percentile <= 10:
                    crowding = "extreme_short"
                elif pressure_percentile <= 30:
                    crowding = "short"
                else:
                    crowding = "neutral"

                direction = (
                    "increasing"
                    if pressure_change > 2
                    else "decreasing"
                    if pressure_change < -2
                    else "stable"
                )

                pressure_items.append(
                    SpeculativePressureItem(
                        commodity=commodity_name,
                        commodity_group=current.COMMODITY_SUBGROUP_NAME,
                        report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
                        managed_money_net=mm_net,
                        commercial_net=commercial_net,
                        open_interest=oi,
                        spec_pressure=round(spec_pressure, 2),
                        spec_pressure_percentile=round(pressure_percentile, 1),
                        mm_percentile=round(mm_percentile, 1),
                        commercial_percentile=round(commercial_percentile, 1),
                        crowding_level=crowding,
                        pressure_change=round(pressure_change, 2),
                        pressure_direction=direction,
                    )
                )
            except Exception as e:
                logger.debug(f"Skipping {commodity_name}: {e}")
                continue

        if not pressure_items:
            raise ValueError("No commodities with sufficient data found")

        sorted_by_pressure = sorted(
            pressure_items, key=lambda x: x.spec_pressure_percentile, reverse=True
        )
        most_crowded_long = sorted_by_pressure[:top_n]
        most_crowded_short = sorted_by_pressure[-top_n:][::-1]

        sector_map = {}
        for item in pressure_items:
            sector = item.commodity_group or "Other"
            if sector not in sector_map:
                sector_map[sector] = {"pressures": [], "count": 0}
            sector_map[sector]["pressures"].append(item.spec_pressure)
            sector_map[sector]["count"] += 1

        sector_pressure = [
            {
                "sector": sector,
                "avg_pressure": round(sum(d["pressures"]) / len(d["pressures"]), 2),
                "commodities_count": d["count"],
            }
            for sector, d in sector_map.items()
        ]
        sector_pressure.sort(key=lambda x: x["avg_pressure"], reverse=True)

        rotation_into = [
            item.commodity for item in pressure_items if item.pressure_change > 3
        ][:5]
        rotation_out_of = [
            item.commodity for item in pressure_items if item.pressure_change < -3
        ][:5]

        avg_pressure = sum(item.spec_pressure for item in pressure_items) / len(
            pressure_items
        )
        long_count = sum(
            1
            for item in pressure_items
            if item.crowding_level in ["long", "extreme_long"]
        )
        short_count = sum(
            1
            for item in pressure_items
            if item.crowding_level in ["short", "extreme_short"]
        )

        market_sentiment = (
            "risk_on"
            if long_count > short_count * 1.5
            else "risk_off"
            if short_count > long_count * 1.5
            else "mixed"
        )

        interpretation = f"Analyzed {len(pressure_items)} commodities. "
        if market_sentiment == "risk_on":
            interpretation += "Speculators broadly long - risk-on sentiment."
        elif market_sentiment == "risk_off":
            interpretation += "Speculators broadly short - risk-off sentiment."
        else:
            interpretation += "Mixed positioning across markets."

        return CrossMarketPressureResponse(
            report_date=latest_date or "",
            commodities_analyzed=len(pressure_items),
            most_crowded_long=most_crowded_long,
            most_crowded_short=most_crowded_short,
            sector_pressure=sector_pressure,
            rotation_into=rotation_into,
            rotation_out_of=rotation_out_of,
            avg_spec_pressure=round(avg_pressure, 2),
            market_sentiment=market_sentiment,
            interpretation=interpretation,
        )

    @staticmethod
    def analyze_volatility_regime(
        db: Session, commodity: str, weeks: int = 52
    ) -> VolatilityAnalysisResponse:
        """
        Analyze COT-implied volatility regime.
        Uses position activity and concentration as proxies for volatility expectations.
        """
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if len(data) < 4:
            raise ValueError(f"Insufficient data for commodity: {commodity}")

        current = data[0]

        # Calculate gross positions and spread ratios for history
        gross_list = []
        spread_ratios = []

        for record in data:
            mm_long = record.get_int_value(record.M_Money_Positions_Long_All)
            mm_short = record.get_int_value(record.M_Money_Positions_Short_All)
            mm_spread = record.get_int_value(record.M_Money_Positions_Spread_All)
            swap_long = record.get_int_value(record.Swap_Positions_Long_All)
            swap_short = record.get_int_value(record.Swap_Positions_Short_All)
            swap_spread = record.get_int_value(record.Swap_Positions_Spread_All)

            gross = mm_long + mm_short + swap_long + swap_short
            total = gross + mm_spread + swap_spread
            spread_ratio = (mm_spread + swap_spread) / total * 100 if total > 0 else 0

            gross_list.append(gross)
            spread_ratios.append(spread_ratio)

        current_gross = gross_list[0]
        current_spread_ratio = spread_ratios[0]

        gross_percentile = (
            sum(1 for x in gross_list if x <= current_gross) / len(gross_list) * 100
        )
        spread_percentile = (
            sum(1 for x in spread_ratios if x <= current_spread_ratio)
            / len(spread_ratios)
            * 100
        )

        # 4-week change
        gross_4wk_ago = gross_list[min(4, len(gross_list) - 1)]
        gross_change_4wk = current_gross - gross_4wk_ago

        # Concentration score
        conc_long = current.Conc_Gross_LE_4_TDR_Long_All or 0
        conc_short = current.Conc_Gross_LE_4_TDR_Short_All or 0
        concentration_score = (conc_long + conc_short) / 2

        # Derive volatility regime
        vol_score = (
            gross_percentile * 0.4
            + concentration_score * 0.4
            + (100 - spread_percentile) * 0.2
        )

        if vol_score >= 75:
            vol_regime = "high"
        elif vol_score >= 55:
            vol_regime = "elevated"
        elif vol_score >= 35:
            vol_regime = "normal"
        else:
            vol_regime = "low"

        # Directional skew
        mm_net = current.managed_money_net
        if mm_net > 0 and gross_percentile > 70:
            vol_skew = "call_skew"
        elif mm_net < 0 and gross_percentile > 70:
            vol_skew = "put_skew"
        else:
            vol_skew = "neutral"

        # Historical regime
        vol_history = []
        for i, record in enumerate(data[:12]):
            hist_gross_pct = (
                sum(1 for x in gross_list if x <= gross_list[i]) / len(gross_list) * 100
            )
            hist_conc = (
                (record.Conc_Gross_LE_4_TDR_Long_All or 0)
                + (record.Conc_Gross_LE_4_TDR_Short_All or 0)
            ) / 2
            hist_score = (
                hist_gross_pct * 0.4 + hist_conc * 0.4 + (100 - spread_ratios[i]) * 0.2
            )

            if hist_score >= 75:
                hist_regime = "high"
            elif hist_score >= 55:
                hist_regime = "elevated"
            elif hist_score >= 35:
                hist_regime = "normal"
            else:
                hist_regime = "low"

            vol_history.append(
                {
                    "date": str(record.Report_Date_as_YYYY_MM_DD or ""),
                    "regime": hist_regime,
                    "score": round(hist_score, 1),
                }
            )

        # Alert
        vol_alert = None
        if vol_regime == "high" and concentration_score > 50:
            vol_alert = "⚠️ High volatility regime with concentrated positions - elevated gap risk"
        elif vol_regime == "elevated" and gross_change_4wk > 0:
            vol_alert = "📈 Rising activity levels - volatility may increase"

        interpretation = f"Volatility regime: {vol_regime.upper()}. "
        if vol_regime == "high":
            interpretation += "High position activity and concentration suggest elevated volatility expectations."
        elif vol_regime == "low":
            interpretation += (
                "Low activity suggests complacency - potential for volatility surprise."
            )
        else:
            interpretation += f"Spread ratio at {current_spread_ratio:.0f}% indicates {'relative-value focus' if current_spread_ratio > 30 else 'directional focus'}."

        current_metrics = VolatilityRegimeMetrics(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            gross_positions=current_gross,
            gross_positions_percentile=round(gross_percentile, 1),
            gross_positions_change_4wk=gross_change_4wk,
            spread_ratio=round(current_spread_ratio, 1),
            spread_ratio_percentile=round(spread_percentile, 1),
            concentration_score=round(concentration_score, 1),
            implied_vol_regime=vol_regime,
            vol_regime_score=round(vol_score, 1),
            vol_skew=vol_skew,
            interpretation=interpretation,
        )

        return VolatilityAnalysisResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            current_metrics=current_metrics,
            vol_regime_history=vol_history,
            vol_alert=vol_alert,
            interpretation=interpretation,
        )

    @staticmethod
    def classify_ml_regime(
        db: Session, commodity: str, weeks: int = 52
    ) -> MLRegimeAnalysisResponse:
        """
        ML-based regime classification using rule-based heuristics.
        Classifies market into actionable regimes based on positioning patterns.
        """
        data = COTAdvancedService.get_historical_data(db, commodity, weeks)

        if len(data) < 8:
            raise ValueError(f"Insufficient data for commodity: {commodity}")

        current = data[0]

        # Build feature vector
        mm_nets = [r.managed_money_net for r in data]
        commercial_nets = [r.producer_merchant_net for r in data]
        nonrept_nets = [r.non_reportables_net for r in data]

        mm_net = current.managed_money_net
        commercial_net = current.producer_merchant_net
        nonrept_net = current.non_reportables_net

        mm_percentile = sum(1 for x in mm_nets if x <= mm_net) / len(mm_nets) * 100
        commercial_percentile = (
            sum(1 for x in commercial_nets if x <= commercial_net)
            / len(commercial_nets)
            * 100
        )
        nonrept_percentile = (
            sum(1 for x in nonrept_nets if x <= nonrept_net) / len(nonrept_nets) * 100
        )

        # 4-week flows
        mm_4wk_ago = data[min(4, len(data) - 1)].managed_money_net
        commercial_4wk_ago = data[min(4, len(data) - 1)].producer_merchant_net
        oi = current.get_int_value(current.Open_Interest_All)

        mm_4wk_flow = (mm_net - mm_4wk_ago) / oi * 100 if oi > 0 else 0
        commercial_4wk_flow = (
            (commercial_net - commercial_4wk_ago) / oi * 100 if oi > 0 else 0
        )

        # Structure features
        conc_long = current.Conc_Gross_LE_4_TDR_Long_All or 0
        conc_short = current.Conc_Gross_LE_4_TDR_Short_All or 0
        concentration_score = (conc_long + conc_short) / 2

        mm_spread = current.get_int_value(current.M_Money_Positions_Spread_All)
        mm_total = (
            current.get_int_value(current.M_Money_Positions_Long_All)
            + current.get_int_value(current.M_Money_Positions_Short_All)
            + mm_spread
        )
        spread_ratio = mm_spread / mm_total * 100 if mm_total > 0 else 0

        # Herding score (simplified)
        mm_long_traders = current.Traders_M_Money_Long_All or 0
        mm_short_traders = current.Traders_M_Money_Short_All or 0
        ls_ratio = mm_long_traders / mm_short_traders if mm_short_traders > 0 else 1
        herding_score = min(100, abs(ls_ratio - 1) * 50)

        # Curve features
        front_oi = current.get_int_value(current.Open_Interest_Old)
        back_oi = current.get_int_value(current.Open_Interest_Other)
        front_back_ratio = front_oi / back_oi if back_oi > 0 else 1

        # Gross positions percentile
        gross = current.get_int_value(
            current.M_Money_Positions_Long_All
        ) + current.get_int_value(current.M_Money_Positions_Short_All)
        gross_list = [
            r.get_int_value(r.M_Money_Positions_Long_All)
            + r.get_int_value(r.M_Money_Positions_Short_All)
            for r in data
        ]
        gross_percentile = (
            sum(1 for x in gross_list if x <= gross) / len(gross_list) * 100
        )

        features = MLRegimeFeatures(
            mm_net_percentile=round(mm_percentile, 1),
            commercial_net_percentile=round(commercial_percentile, 1),
            nonrept_net_percentile=round(nonrept_percentile, 1),
            mm_4wk_flow=round(mm_4wk_flow, 2),
            commercial_4wk_flow=round(commercial_4wk_flow, 2),
            concentration_score=round(concentration_score, 1),
            spread_ratio=round(spread_ratio, 1),
            herding_score=round(herding_score, 1),
            front_back_ratio=round(front_back_ratio, 2),
            gross_positions_percentile=round(gross_percentile, 1),
        )

        # Rule-based regime classification
        primary_regime = MLRegimeType.CONSOLIDATION
        confidence = 50.0
        secondary_regime = None
        secondary_confidence = None

        # Mean reversion: extreme positioning
        if mm_percentile >= 90 or mm_percentile <= 10:
            primary_regime = MLRegimeType.MEAN_REVERSION
            confidence = min(95, 50 + abs(mm_percentile - 50))
            if commercial_4wk_flow * mm_4wk_flow < 0:  # Divergence
                confidence += 10

        # Capitulation: extreme + falling trader counts
        elif mm_percentile >= 85 and mm_4wk_flow < -2:
            primary_regime = MLRegimeType.CAPITULATION
            confidence = 70 + abs(mm_4wk_flow) * 3

        # Accumulation: commercials building, specs light
        elif commercial_percentile >= 70 and mm_percentile <= 40:
            primary_regime = MLRegimeType.ACCUMULATION
            confidence = 60 + (commercial_percentile - mm_percentile) / 2

        # Distribution: commercials selling, specs heavy
        elif commercial_percentile <= 30 and mm_percentile >= 60:
            primary_regime = MLRegimeType.DISTRIBUTION
            confidence = 60 + (mm_percentile - commercial_percentile) / 2

        # Trend following: aligned positioning with momentum
        elif 30 <= mm_percentile <= 70 and abs(mm_4wk_flow) > 2:
            primary_regime = MLRegimeType.TREND_FOLLOWING
            confidence = 55 + abs(mm_4wk_flow) * 5

        # Breakout setup: building concentration
        elif concentration_score > 50 and gross_percentile > 70:
            primary_regime = MLRegimeType.BREAKOUT_SETUP
            confidence = 50 + concentration_score / 2

        # Otherwise consolidation
        else:
            primary_regime = MLRegimeType.CONSOLIDATION
            confidence = 60

        confidence = min(95, confidence)

        # Regime descriptions
        regime_info = {
            MLRegimeType.TREND_FOLLOWING: {
                "description": "Speculators aligned with trend, momentum-driven market",
                "duration": 8,
                "outcome": "Trend continuation until positioning becomes extreme",
                "strategy": "Follow the trend with trailing stops",
                "risk": "moderate",
            },
            MLRegimeType.MEAN_REVERSION: {
                "description": "Extreme positioning suggests reversal likely",
                "duration": 4,
                "outcome": "Counter-trend move as positions unwind",
                "strategy": "Fade the crowd, scale into contrarian position",
                "risk": "high",
            },
            MLRegimeType.ACCUMULATION: {
                "description": "Smart money building positions, specs underweight",
                "duration": 12,
                "outcome": "Eventual breakout in direction of commercial positioning",
                "strategy": "Align with commercials, patient accumulation",
                "risk": "low",
            },
            MLRegimeType.DISTRIBUTION: {
                "description": "Smart money distributing to specs",
                "duration": 8,
                "outcome": "Eventual breakdown as specs get trapped",
                "strategy": "Reduce long exposure, prepare for reversal",
                "risk": "moderate",
            },
            MLRegimeType.CAPITULATION: {
                "description": "Forced liquidation, extreme stress",
                "duration": 2,
                "outcome": "Sharp reversal after washout",
                "strategy": "Wait for stabilization, then buy the dip",
                "risk": "high",
            },
            MLRegimeType.CONSOLIDATION: {
                "description": "Low conviction, range-bound market",
                "duration": 6,
                "outcome": "Eventual breakout in either direction",
                "strategy": "Range trading, wait for clearer signal",
                "risk": "low",
            },
            MLRegimeType.BREAKOUT_SETUP: {
                "description": "Building pressure for significant move",
                "duration": 4,
                "outcome": "Breakout with follow-through",
                "strategy": "Prepare for breakout, use options for leverage",
                "risk": "moderate",
            },
        }

        info = regime_info[primary_regime]

        # Top features
        top_features = [
            {
                "feature": "mm_net_percentile",
                "importance": 0.25,
                "value": mm_percentile,
            },
            {
                "feature": "commercial_percentile",
                "importance": 0.20,
                "value": commercial_percentile,
            },
            {"feature": "mm_4wk_flow", "importance": 0.15, "value": mm_4wk_flow},
            {
                "feature": "concentration_score",
                "importance": 0.15,
                "value": concentration_score,
            },
            {"feature": "herding_score", "importance": 0.10, "value": herding_score},
        ]

        # Transition probabilities (simplified)
        transitions = {
            MLRegimeType.TREND_FOLLOWING: [
                {"regime": "mean_reversion", "probability": 0.3},
                {"regime": "consolidation", "probability": 0.4},
            ],
            MLRegimeType.MEAN_REVERSION: [
                {"regime": "capitulation", "probability": 0.2},
                {"regime": "trend_following", "probability": 0.5},
            ],
            MLRegimeType.ACCUMULATION: [
                {"regime": "breakout_setup", "probability": 0.4},
                {"regime": "trend_following", "probability": 0.3},
            ],
            MLRegimeType.DISTRIBUTION: [
                {"regime": "mean_reversion", "probability": 0.4},
                {"regime": "capitulation", "probability": 0.2},
            ],
            MLRegimeType.CAPITULATION: [
                {"regime": "accumulation", "probability": 0.5},
                {"regime": "trend_following", "probability": 0.3},
            ],
            MLRegimeType.CONSOLIDATION: [
                {"regime": "breakout_setup", "probability": 0.3},
                {"regime": "trend_following", "probability": 0.3},
            ],
            MLRegimeType.BREAKOUT_SETUP: [
                {"regime": "trend_following", "probability": 0.6},
                {"regime": "consolidation", "probability": 0.2},
            ],
        }

        current_classification = MLRegimeClassification(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            primary_regime=primary_regime,
            primary_confidence=round(confidence, 1),
            secondary_regime=secondary_regime,
            secondary_confidence=secondary_confidence,
            top_features=top_features,
            regime_description=info["description"],
            typical_duration_weeks=info["duration"],
            typical_outcome=info["outcome"],
            suggested_strategy=info["strategy"],
            risk_level=info["risk"],
            likely_next_regimes=transitions.get(primary_regime, []),
        )

        # Historical regimes
        regime_history = []
        regime_counts = {}
        current_regime_duration = 0

        for i, record in enumerate(data[:26]):
            hist_mm_pct = (
                sum(1 for x in mm_nets if x <= mm_nets[i]) / len(mm_nets) * 100
            )
            hist_comm_pct = (
                sum(1 for x in commercial_nets if x <= commercial_nets[i])
                / len(commercial_nets)
                * 100
            )

            # Simplified classification for history
            if hist_mm_pct >= 85 or hist_mm_pct <= 15:
                hist_regime = MLRegimeType.MEAN_REVERSION
            elif hist_comm_pct >= 70 and hist_mm_pct <= 40:
                hist_regime = MLRegimeType.ACCUMULATION
            elif hist_comm_pct <= 30 and hist_mm_pct >= 60:
                hist_regime = MLRegimeType.DISTRIBUTION
            else:
                hist_regime = MLRegimeType.CONSOLIDATION

            regime_history.append(
                MLRegimeHistoryItem(
                    report_date=str(record.Report_Date_as_YYYY_MM_DD or ""),
                    regime=hist_regime,
                    confidence=60.0,
                    mm_percentile=round(hist_mm_pct, 1),
                    commercial_percentile=round(hist_comm_pct, 1),
                )
            )

            regime_counts[hist_regime.value] = (
                regime_counts.get(hist_regime.value, 0) + 1
            )

            if i == 0 or hist_regime == primary_regime:
                current_regime_duration += 1

        interpretation = f"Current regime: {primary_regime.value.replace('_', ' ').title()} ({confidence:.0f}% confidence). "
        interpretation += info["description"] + " "
        interpretation += f"Suggested: {info['strategy']}"

        return MLRegimeAnalysisResponse(
            commodity=commodity,
            report_date=str(current.Report_Date_as_YYYY_MM_DD or ""),
            current_regime=current_classification,
            features=features,
            regime_history=regime_history,
            regime_duration_current=current_regime_duration,
            regime_distribution=regime_counts,
            interpretation=interpretation,
        )
