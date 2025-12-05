from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import List
import logging

from schemas.correlation import (
    CorrelationRequest,
    CorrelationMatrixResponse,
    CorrelationPair,
    RollingCorrelationRequest,
    RollingCorrelationResponse,
    RollingCorrelationPoint,
    BetaCalculationRequest,
    BetaCalculationResponse,
    DiversificationAnalysisRequest,
    DiversificationScore,
    CorrelationBreakdownResponse,
    AssetPair,
)
from services.correlation_service import CorrelationService
from services.data_providers import YahooFinanceProvider, ProviderError

logger = logging.getLogger(__name__)

router = APIRouter()
correlation_service = CorrelationService()

# Symbol mappings for Yahoo Finance
YAHOO_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "CRUDE": "CL=F",
    "COPPER": "HG=F",
    "PLATINUM": "PL=F",
    "PALLADIUM": "PA=F",
    "NATURALGAS": "NG=F",
    "SPY": "SPY",
    "DXY": "DX-Y.NYB",
    "USDINR": "USDINR=X",
}


async def fetch_returns(symbol: str, days: int) -> List[float]:
    """Fetch real returns data from Yahoo Finance"""
    yahoo = YahooFinanceProvider()
    yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), symbol)

    end_date = date.today()
    start_date = end_date - timedelta(days=days + 10)  # Extra days for buffer

    try:
        history = await yahoo.get_historical_data(
            yahoo_symbol, start_date, end_date, "1d", "USD"
        )

        if not history.data_points or len(history.data_points) < 2:
            raise ValueError(f"Insufficient data for {symbol}")

        # Calculate daily returns
        closes = [float(dp.close) for dp in history.data_points]
        returns = []
        for i in range(1, len(closes)):
            if closes[i - 1] > 0:
                ret = (closes[i] - closes[i - 1]) / closes[i - 1]
                returns.append(ret)

        # Trim to requested days
        return returns[-days:] if len(returns) > days else returns

    except ProviderError as e:
        logger.warning(f"Could not fetch data for {symbol}: {e}")
        raise ValueError(f"Could not fetch data for {symbol}: {e}")


@router.post("/matrix", response_model=CorrelationMatrixResponse)
async def calculate_correlation_matrix(request: CorrelationRequest):
    """
    Calculate correlation matrix for multiple assets

    - **assets**: List of asset symbols (2-10 assets)
    - **period_days**: Analysis period in days (7-365)
    - **timeframe**: Data timeframe (daily, weekly)

    Returns correlation matrix with all pairwise correlations.
    """
    try:
        if len(request.assets) < 2:
            raise HTTPException(status_code=400, detail="At least 2 assets required")

        if len(request.assets) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 assets allowed")

        # Fetch real price data from Yahoo Finance
        asset_returns = {}
        for asset in request.assets:
            try:
                asset_returns[asset] = await fetch_returns(asset, request.period_days)
            except ValueError as e:
                raise HTTPException(status_code=404, detail=str(e))

        # Align returns to same length (use minimum length)
        min_length = min(len(returns) for returns in asset_returns.values())
        aligned_returns = {
            asset: returns[-min_length:] for asset, returns in asset_returns.items()
        }

        logger.info(
            f"Aligned returns to {min_length} data points for correlation calculation"
        )

        # Calculate all pairwise correlations
        correlations = []
        matrix = {asset: {} for asset in request.assets}

        for i, asset1 in enumerate(request.assets):
            for j, asset2 in enumerate(request.assets):
                if i < j:  # Only calculate upper triangle
                    corr = correlation_service.calculate_correlation(
                        aligned_returns[asset1], aligned_returns[asset2]
                    )

                    strength = correlation_service.classify_correlation_strength(corr)
                    direction = "positive" if corr >= 0 else "negative"

                    p_value = correlation_service.calculate_p_value(
                        corr, request.period_days
                    )

                    correlations.append(
                        CorrelationPair(
                            asset1=asset1,
                            asset2=asset2,
                            correlation=round(corr, 3),
                            strength=strength,
                            direction=direction,
                            p_value=round(p_value, 3),
                            sample_size=request.period_days,
                        )
                    )

                    # Fill matrix (symmetric)
                    matrix[asset1][asset2] = round(corr, 3)
                    matrix[asset2][asset1] = round(corr, 3)
                elif i == j:
                    matrix[asset1][asset2] = 1.0

        end_date = date.today()
        start_date = end_date - timedelta(days=request.period_days)

        return CorrelationMatrixResponse(
            assets=request.assets,
            period_days=request.period_days,
            start_date=start_date,
            end_date=end_date,
            correlations=correlations,
            matrix=matrix,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating correlation matrix: {str(e)}"
        )


@router.post("/rolling", response_model=RollingCorrelationResponse)
async def calculate_rolling_correlation(request: RollingCorrelationRequest):
    """
    Calculate rolling correlation between two assets

    - **asset1**: First asset symbol
    - **asset2**: Second asset symbol
    - **window_days**: Rolling window size (7-90 days)
    - **period_days**: Total analysis period (30-730 days)

    Returns time series of rolling correlations.
    """
    try:
        # Fetch real price data
        try:
            returns1 = await fetch_returns(request.asset1, request.period_days)
            returns2 = await fetch_returns(request.asset2, request.period_days)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        # Calculate rolling correlations
        rolling_corrs = correlation_service.calculate_rolling_correlation(
            returns1, returns2, request.window_days
        )

        if not rolling_corrs:
            raise HTTPException(
                status_code=400, detail="Insufficient data for rolling correlation"
            )

        # Generate data points
        end_date = date.today()
        data_points = []

        for i, corr in enumerate(rolling_corrs):
            point_date = end_date - timedelta(days=len(rolling_corrs) - i - 1)
            strength = correlation_service.classify_correlation_strength(corr)

            data_points.append(
                RollingCorrelationPoint(
                    date=point_date, correlation=round(corr, 3), strength=strength
                )
            )

        # Calculate statistics
        current_corr = rolling_corrs[-1]
        avg_corr = sum(rolling_corrs) / len(rolling_corrs)
        max_corr = max(rolling_corrs)
        min_corr = min(rolling_corrs)

        return RollingCorrelationResponse(
            asset1=request.asset1,
            asset2=request.asset2,
            window_days=request.window_days,
            period_days=request.period_days,
            data_points=data_points,
            current_correlation=round(current_corr, 3),
            avg_correlation=round(avg_corr, 3),
            max_correlation=round(max_corr, 3),
            min_correlation=round(min_corr, 3),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating rolling correlation: {str(e)}"
        )


@router.post("/beta", response_model=BetaCalculationResponse)
async def calculate_beta(request: BetaCalculationRequest):
    """
    Calculate beta coefficient for an asset relative to a benchmark

    - **asset**: Asset symbol to calculate beta for
    - **benchmark**: Benchmark asset (default: GOLD)
    - **period_days**: Analysis period (30-365 days)

    Returns beta, alpha, R-squared, and interpretation.
    """
    try:
        # Fetch real price data
        try:
            asset_returns = await fetch_returns(request.asset, request.period_days)
            benchmark_returns = await fetch_returns(
                request.benchmark, request.period_days
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        # Calculate beta, alpha, R-squared
        beta, alpha, r_squared = correlation_service.calculate_beta(
            asset_returns, benchmark_returns
        )

        # Calculate correlation
        correlation = correlation_service.calculate_correlation(
            asset_returns, benchmark_returns
        )

        # Calculate volatility ratio
        import statistics

        asset_vol = statistics.stdev(asset_returns) if len(asset_returns) > 1 else 0
        benchmark_vol = (
            statistics.stdev(benchmark_returns) if len(benchmark_returns) > 1 else 0
        )
        volatility_ratio = asset_vol / benchmark_vol if benchmark_vol > 0 else 0

        # Generate interpretation
        if beta > 1.2:
            interpretation = f"{request.asset} is significantly more volatile than {request.benchmark} (beta={beta:.2f}). Expect amplified moves."
        elif beta > 1.0:
            interpretation = f"{request.asset} is moderately more volatile than {request.benchmark} (beta={beta:.2f})."
        elif beta > 0.8:
            interpretation = f"{request.asset} moves similarly to {request.benchmark} (beta={beta:.2f})."
        elif beta > 0.5:
            interpretation = f"{request.asset} is less volatile than {request.benchmark} (beta={beta:.2f})."
        else:
            interpretation = f"{request.asset} shows low correlation with {request.benchmark} (beta={beta:.2f})."

        return BetaCalculationResponse(
            asset=request.asset,
            benchmark=request.benchmark,
            period_days=request.period_days,
            beta=round(beta, 3),
            alpha=round(alpha, 4),
            r_squared=round(r_squared, 3),
            correlation=round(correlation, 3),
            interpretation=interpretation,
            volatility_ratio=round(volatility_ratio, 3),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating beta: {str(e)}")


@router.post("/diversification", response_model=DiversificationScore)
async def analyze_diversification(request: DiversificationAnalysisRequest):
    """
    Analyze portfolio diversification based on asset correlations

    - **assets**: List of assets in portfolio (2-10)
    - **period_days**: Analysis period (30-365 days)

    Returns diversification score and recommendations.
    """
    try:
        if len(request.assets) < 2:
            raise HTTPException(status_code=400, detail="At least 2 assets required")

        # Fetch real price data
        asset_returns = {}
        for asset in request.assets:
            try:
                asset_returns[asset] = await fetch_returns(asset, request.period_days)
            except ValueError as e:
                raise HTTPException(status_code=404, detail=str(e))

        # Calculate all pairwise correlations
        all_correlations = []

        for i, asset1 in enumerate(request.assets):
            for j, asset2 in enumerate(request.assets):
                if i < j:
                    corr = correlation_service.calculate_correlation(
                        asset_returns[asset1], asset_returns[asset2]
                    )
                    all_correlations.append(corr)

        if not all_correlations:
            raise HTTPException(
                status_code=400, detail="Unable to calculate correlations"
            )

        # Calculate diversification metrics
        avg_corr = sum(all_correlations) / len(all_correlations)
        max_corr = max(all_correlations)
        min_corr = min(all_correlations)

        score, rating = correlation_service.calculate_diversification_score(
            all_correlations
        )

        # Generate recommendations
        recommendations = correlation_service.generate_diversification_recommendations(
            avg_corr, max_corr, request.assets
        )

        return DiversificationScore(
            portfolio_assets=request.assets,
            avg_correlation=round(avg_corr, 3),
            max_correlation=round(max_corr, 3),
            min_correlation=round(min_corr, 3),
            diversification_score=score,
            rating=rating,
            recommendations=recommendations,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error analyzing diversification: {str(e)}"
        )


@router.get("/breakdown")
async def get_correlation_breakdown(
    asset1: str = Query(description="First asset symbol"),
    asset2: str = Query(description="Second asset symbol"),
    period_days: int = Query(default=90, ge=30, le=365),
):
    """
    Get detailed correlation breakdown for two assets

    - **asset1**: First asset symbol
    - **asset2**: Second asset symbol
    - **period_days**: Analysis period (30-365 days)

    Returns comprehensive correlation analysis with statistical metrics.
    """
    try:
        # Fetch real price data
        try:
            returns1 = await fetch_returns(asset1, period_days)
            returns2 = await fetch_returns(asset2, period_days)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        # Calculate correlation
        correlation = correlation_service.calculate_correlation(returns1, returns2)
        strength = correlation_service.classify_correlation_strength(correlation)
        direction = "positive" if correlation >= 0 else "negative"

        # Statistical metrics
        p_value = correlation_service.calculate_p_value(correlation, period_days)
        ci_lower, ci_upper = correlation_service.calculate_confidence_interval(
            correlation, period_days
        )

        # Volatility metrics
        import statistics

        vol1 = statistics.stdev(returns1) if len(returns1) > 1 else 0
        vol2 = statistics.stdev(returns2) if len(returns2) > 1 else 0

        # Return metrics
        ret1 = sum(returns1)
        ret2 = sum(returns2)

        # Covariance
        covariance = correlation_service.calculate_covariance(returns1, returns2)

        # Interpretation
        interpretation = correlation_service.generate_correlation_interpretation(
            correlation, strength, p_value
        )

        return CorrelationBreakdownResponse(
            asset_pair=AssetPair(asset1=asset1, asset2=asset2),
            period_days=period_days,
            correlation=round(correlation, 3),
            strength=strength,
            direction=direction,
            p_value=round(p_value, 3),
            confidence_interval_lower=ci_lower,
            confidence_interval_upper=ci_upper,
            asset1_volatility=round(vol1 * 100, 2),  # Convert to percentage
            asset2_volatility=round(vol2 * 100, 2),
            asset1_return=round(ret1 * 100, 2),
            asset2_return=round(ret2 * 100, 2),
            covariance=round(covariance, 6),
            sample_size=period_days,
            interpretation=interpretation,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating correlation breakdown: {str(e)}"
        )
