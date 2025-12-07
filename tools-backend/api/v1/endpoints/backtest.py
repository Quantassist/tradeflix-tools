from fastapi import APIRouter, HTTPException, Depends, Query, Header
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
import pandas as pd
import math
import logging
from datetime import date, timedelta
from backtesting import Backtest, Strategy
from sqlalchemy.orm import Session

from services.data_providers import YahooFinanceProvider, ProviderError
from database import get_db
from models.metals import MetalsPriceSpot
from models.strategy import Strategy as StrategyModel, Backtest as BacktestModel
from schemas.visual_backtest import (
    VisualBacktestRequest,
    VisualBacktestResponse,
    VisualBacktestTrade,
    VisualBacktestMetrics,
    EquityCurvePoint,
    CandleData,
    StrategySaveRequest,
    StrategyUpdateRequest,
    StrategyResponse,
    StrategyListResponse,
    BacktestSaveRequest,
    BacktestResponse,
    BacktestListResponse,
)
from services.strategy_engine import run_visual_backtest
from services.backtest_engine import run_backtest_with_lib

logger = logging.getLogger(__name__)

# Engine selection: "legacy" uses custom engine, "backtesting" uses backtesting.py
DEFAULT_ENGINE = "legacy"  # Change to "backtesting" to use backtesting.py by default

router = APIRouter()

# Symbol mappings for Yahoo Finance
YAHOO_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "CRUDE": "CL=F",
    "COPPER": "HG=F",
    "PLATINUM": "PL=F",
    "PALLADIUM": "PA=F",
    "NATURALGAS": "NG=F",
}


def safe_float(value, default=0.0):
    """Convert value to float, handling NaN and infinity"""
    try:
        if pd.isna(value) or math.isnan(float(value)) or math.isinf(float(value)):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


# Request/Response Models
class EntryCondition(BaseModel):
    indicator: str
    operator: str
    value: float
    timeframe: Optional[str] = None


class ExitCondition(BaseModel):
    type: str
    value: float
    indicator: Optional[str] = None
    operator: Optional[str] = None


class PositionSizing(BaseModel):
    type: str
    value: float


class BacktestStrategy(BaseModel):
    name: str
    description: Optional[str] = None
    symbol: str
    timeframe: str
    entry_conditions: List[EntryCondition]
    exit_conditions: List[ExitCondition]
    position_sizing: PositionSizing
    initial_capital: float
    commission_percent: float
    slippage_percent: float


class BacktestRequest(BaseModel):
    strategy: BacktestStrategy
    start_date: str
    end_date: str


class Trade(BaseModel):
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    quantity: float
    pnl: float
    pnl_percent: float
    duration_hours: float
    trade_type: str


class PerformanceMetrics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    total_pnl: float
    total_pnl_percent: float
    avg_win: float
    avg_loss: float
    max_win: float
    max_loss: float
    max_drawdown: float
    max_drawdown_percent: float
    sharpe_ratio: float
    sortino_ratio: float
    cagr: float
    recovery_factor: float
    avg_trade_duration_hours: float
    longest_winning_streak: int
    longest_losing_streak: int


class EquityPoint(BaseModel):
    date: str
    equity: float
    drawdown: float
    drawdown_percent: float


class MonthlyReturn(BaseModel):
    month: str
    return_percent: float
    trades: int


class LegacyBacktestResponse(BaseModel):
    """Legacy backtest response model (for old endpoints)"""

    strategy_name: str
    symbol: str
    timeframe: str
    start_date: str
    end_date: str
    initial_capital: float
    final_capital: float
    metrics: PerformanceMetrics
    trades: List[Trade]
    equity_curve: List[EquityPoint]
    monthly_returns: List[MonthlyReturn]


# Helper functions for indicators
def SMA(values, n):
    """Simple Moving Average"""
    return pd.Series(values).rolling(n).mean()


def EMA(values, n):
    """Exponential Moving Average"""
    return pd.Series(values).ewm(span=n, adjust=False).mean()


def RSI(values, n=14):
    """Relative Strength Index"""
    delta = pd.Series(values).diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=n).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=n).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


async def fetch_backtest_data(
    symbol: str, start_date: str, end_date: str, timeframe: str
):
    """Fetch real OHLC data for backtesting from Yahoo Finance"""
    yahoo = YahooFinanceProvider()
    yahoo_symbol = YAHOO_SYMBOLS.get(symbol.upper(), f"{symbol}=F")

    start = pd.to_datetime(start_date).date()
    end = pd.to_datetime(end_date).date()

    try:
        # Fetch historical data
        history = await yahoo.get_historical_data(yahoo_symbol, start, end, "1d", "USD")

        if not history.data_points or len(history.data_points) < 10:
            raise ValueError(f"Insufficient data for {symbol}")

        # Convert to pandas DataFrame
        data = pd.DataFrame(
            [
                {
                    "Open": float(dp.open),
                    "High": float(dp.high),
                    "Low": float(dp.low),
                    "Close": float(dp.close),
                    "Volume": dp.volume or 0,
                }
                for dp in history.data_points
            ],
            index=pd.to_datetime([dp.date for dp in history.data_points]),
        )

        # Drop any rows with NaN
        data = data.dropna()

        logger.info(f"Fetched {len(data)} data points for {symbol} backtest")
        return data

    except ProviderError as e:
        logger.error(f"Failed to fetch backtest data: {e}")
        raise ValueError(f"Could not fetch data for {symbol}: {e}")


def create_dynamic_strategy(
    entry_conditions: List[EntryCondition],
    exit_conditions: List[ExitCondition],
    position_sizing: PositionSizing,
):
    """Create a dynamic strategy class based on user-defined conditions"""

    class DynamicStrategy(Strategy):
        def init(self):
            # Initialize indicators based on entry conditions
            close = self.data.Close

            # Store indicators for access in next()
            self.indicators = {}

            for i, cond in enumerate(entry_conditions):
                if cond.indicator == "RSI":
                    self.indicators[f"rsi_{i}"] = self.I(
                        RSI,
                        close,
                        int(cond.value)
                        if cond.operator in [">", "<", ">=", "<="]
                        else 14,
                    )
                elif cond.indicator == "SMA":
                    self.indicators[f"sma_{i}"] = self.I(SMA, close, int(cond.value))
                elif cond.indicator == "EMA":
                    self.indicators[f"ema_{i}"] = self.I(EMA, close, int(cond.value))

            # Store exit conditions
            self.exit_conditions = exit_conditions
            self.entry_conditions = entry_conditions
            self.position_sizing_config = position_sizing

        def next(self):
            # Check entry conditions
            should_enter = True

            for i, cond in enumerate(self.entry_conditions):
                if cond.indicator == "RSI":
                    ind_value = self.indicators[f"rsi_{i}"][-1]
                    if cond.operator == "<" and not (ind_value < cond.value):
                        should_enter = False
                    elif cond.operator == ">" and not (ind_value > cond.value):
                        should_enter = False
                    elif cond.operator == "<=" and not (ind_value <= cond.value):
                        should_enter = False
                    elif cond.operator == ">=" and not (ind_value >= cond.value):
                        should_enter = False
                elif cond.indicator in ["SMA", "EMA"]:
                    ind_value = self.indicators[f"{cond.indicator.lower()}_{i}"][-1]
                    price = self.data.Close[-1]
                    if (
                        cond.operator == "CROSSES_ABOVE"
                        and len(self.indicators[f"{cond.indicator.lower()}_{i}"]) > 1
                    ):
                        if not (
                            price > ind_value
                            and self.data.Close[-2]
                            <= self.indicators[f"{cond.indicator.lower()}_{i}"][-2]
                        ):
                            should_enter = False
                    elif (
                        cond.operator == "CROSSES_BELOW"
                        and len(self.indicators[f"{cond.indicator.lower()}_{i}"]) > 1
                    ):
                        if not (
                            price < ind_value
                            and self.data.Close[-2]
                            >= self.indicators[f"{cond.indicator.lower()}_{i}"][-2]
                        ):
                            should_enter = False

            # Enter trade if conditions met and no position
            if should_enter and not self.position:
                # Calculate position size (fractional shares allowed)
                if self.position_sizing_config.type == "PERCENTAGE":
                    # Use percentage of equity
                    size = max(
                        0.01,
                        (self.equity * self.position_sizing_config.value / 100)
                        / self.data.Close[-1],
                    )
                elif self.position_sizing_config.type == "FIXED":
                    # Fixed quantity
                    size = max(0.01, self.position_sizing_config.value)
                else:  # RISK_BASED
                    # Risk-based sizing
                    size = max(
                        0.01,
                        (self.equity * self.position_sizing_config.value / 100)
                        / self.data.Close[-1],
                    )

                # Ensure we can afford at least a fractional share
                if size * self.data.Close[-1] <= self.equity:
                    self.buy(size=size)

            # Check exit conditions
            if self.position:
                for exit_cond in self.exit_conditions:
                    if exit_cond.type == "STOP_LOSS":
                        # Set stop loss
                        sl_price = self.position.entry_price * (
                            1 - exit_cond.value / 100
                        )
                        if self.data.Close[-1] <= sl_price:
                            self.position.close()
                            break
                    elif exit_cond.type == "TAKE_PROFIT":
                        # Set take profit
                        tp_price = self.position.entry_price * (
                            1 + exit_cond.value / 100
                        )
                        if self.data.Close[-1] >= tp_price:
                            self.position.close()
                            break

    return DynamicStrategy


async def run_backtest_with_library(request: BacktestRequest) -> BacktestResponse:
    """Run backtest using backtesting.py library with real market data"""
    strategy_config = request.strategy

    # Fetch real market data from Yahoo Finance
    data = await fetch_backtest_data(
        strategy_config.symbol,
        request.start_date,
        request.end_date,
        strategy_config.timeframe,
    )

    # Create dynamic strategy
    StrategyClass = create_dynamic_strategy(
        strategy_config.entry_conditions,
        strategy_config.exit_conditions,
        strategy_config.position_sizing,
    )

    # Initialize backtest
    bt = Backtest(
        data,
        StrategyClass,
        cash=strategy_config.initial_capital,
        commission=strategy_config.commission_percent / 100,
        exclusive_orders=True,
    )

    # Run backtest
    stats = bt.run()

    # Extract trades
    trades_df = stats["_trades"]
    trades = []

    if not trades_df.empty:
        for _, trade_row in trades_df.iterrows():
            entry_time = trade_row["EntryTime"]
            exit_time = trade_row["ExitTime"]
            duration = (exit_time - entry_time).total_seconds() / 3600  # hours

            trades.append(
                Trade(
                    entry_date=entry_time.isoformat(),
                    exit_date=exit_time.isoformat(),
                    entry_price=round(float(trade_row["EntryPrice"]), 2),
                    exit_price=round(float(trade_row["ExitPrice"]), 2),
                    quantity=round(float(trade_row["Size"]), 4),
                    pnl=round(float(trade_row["PnL"]), 2),
                    pnl_percent=round(float(trade_row["ReturnPct"]) * 100, 2),
                    duration_hours=round(duration, 2),
                    trade_type="LONG" if trade_row["Size"] > 0 else "SHORT",
                )
            )

    # Extract equity curve
    equity_df = stats["_equity_curve"]
    equity_curve = []

    for idx, row in equity_df.iterrows():
        equity_curve.append(
            EquityPoint(
                date=idx.isoformat(),
                equity=round(float(row["Equity"]), 2),
                drawdown=round(
                    float(row["Equity"]) * float(row["DrawdownPct"]) / 100, 2
                ),
                drawdown_percent=round(float(row["DrawdownPct"]), 2),
            )
        )

    # Calculate monthly returns
    monthly_returns = []
    if not trades_df.empty:
        trades_df["Month"] = pd.to_datetime(trades_df["EntryTime"]).dt.to_period("M")
        monthly_groups = trades_df.groupby("Month")

        for month, group in monthly_groups:
            month_pnl = group["PnL"].sum()
            month_return_pct = (month_pnl / strategy_config.initial_capital) * 100

            monthly_returns.append(
                MonthlyReturn(
                    month=str(month),
                    return_percent=round(month_return_pct, 2),
                    trades=len(group),
                )
            )

    # Calculate metrics
    total_trades = int(stats["# Trades"])
    winning_trades = len(trades_df[trades_df["PnL"] > 0]) if not trades_df.empty else 0
    losing_trades = len(trades_df[trades_df["PnL"] <= 0]) if not trades_df.empty else 0

    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

    wins = (
        trades_df[trades_df["PnL"] > 0]["PnL"].tolist() if not trades_df.empty else []
    )
    losses = (
        trades_df[trades_df["PnL"] <= 0]["PnL"].abs().tolist()
        if not trades_df.empty
        else []
    )

    avg_win = sum(wins) / len(wins) if wins else 0
    avg_loss = sum(losses) / len(losses) if losses else 0
    profit_factor = sum(wins) / sum(losses) if losses and sum(losses) > 0 else 0

    final_equity = safe_float(stats.get("Equity Final [$]", 0))
    total_pnl = final_equity - strategy_config.initial_capital
    total_pnl_percent = safe_float(stats.get("Return [%]", 0))

    max_dd_pct = abs(safe_float(stats.get("Max. Drawdown [%]", 0)))
    max_dd = strategy_config.initial_capital * max_dd_pct / 100

    # Calculate streaks
    longest_win_streak = 0
    longest_loss_streak = 0
    current_streak = 0

    if not trades_df.empty:
        for pnl in trades_df["PnL"]:
            if pnl > 0:
                current_streak = max(0, current_streak) + 1
                longest_win_streak = max(longest_win_streak, current_streak)
            else:
                current_streak = min(0, current_streak) - 1
                longest_loss_streak = max(longest_loss_streak, abs(current_streak))

    # Average trade duration
    avg_duration = safe_float(
        trades_df["Duration"].mean().total_seconds() / 3600
        if not trades_df.empty
        else 0
    )

    metrics = PerformanceMetrics(
        total_trades=total_trades,
        winning_trades=winning_trades,
        losing_trades=losing_trades,
        win_rate=round(safe_float(win_rate), 2),
        profit_factor=round(safe_float(profit_factor), 2),
        total_pnl=round(safe_float(total_pnl), 2),
        total_pnl_percent=round(safe_float(total_pnl_percent), 2),
        avg_win=round(safe_float(avg_win), 2),
        avg_loss=round(safe_float(avg_loss), 2),
        max_win=round(safe_float(max(wins) if wins else 0), 2),
        max_loss=round(safe_float(max(losses) if losses else 0), 2),
        max_drawdown=round(safe_float(max_dd), 2),
        max_drawdown_percent=round(safe_float(max_dd_pct), 2),
        sharpe_ratio=round(safe_float(stats.get("Sharpe Ratio", 0)), 2),
        sortino_ratio=round(safe_float(stats.get("Sortino Ratio", 0)), 2),
        cagr=round(safe_float(total_pnl_percent), 2),  # Simplified CAGR
        recovery_factor=round(
            safe_float(abs(total_pnl / max_dd) if max_dd > 0 else 0), 2
        ),
        avg_trade_duration_hours=round(safe_float(avg_duration), 2),
        longest_winning_streak=longest_win_streak,
        longest_losing_streak=longest_loss_streak,
    )

    return BacktestResponse(
        strategy_name=strategy_config.name,
        symbol=strategy_config.symbol,
        timeframe=strategy_config.timeframe,
        start_date=request.start_date,
        end_date=request.end_date,
        initial_capital=strategy_config.initial_capital,
        final_capital=round(final_equity, 2),
        metrics=metrics,
        trades=trades,
        equity_curve=equity_curve,
        monthly_returns=monthly_returns,
    )


@router.post("/run", response_model=LegacyBacktestResponse)
async def run_backtest(request: BacktestRequest):
    """
    Run a backtest with the given strategy using real market data.

    Data is fetched from Yahoo Finance for COMEX futures.
    """
    try:
        result = await run_backtest_with_library(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


@router.get("/templates")
async def get_strategy_templates():
    """Get pre-built strategy templates"""
    templates = [
        {
            "name": "RSI Oversold/Overbought",
            "description": "Buy when RSI < 30, Sell when RSI > 70",
            "entry_conditions": [{"indicator": "RSI", "operator": "<", "value": 30}],
            "exit_conditions": [
                {"type": "TAKE_PROFIT", "value": 2.0},
                {"type": "STOP_LOSS", "value": 1.0},
            ],
        },
        {
            "name": "Moving Average Crossover",
            "description": "Buy when price crosses above 50 SMA",
            "entry_conditions": [
                {"indicator": "SMA", "operator": "CROSSES_ABOVE", "value": 50}
            ],
            "exit_conditions": [{"type": "STOP_LOSS", "value": 2.0}],
        },
        {
            "name": "Trend Following",
            "description": "Buy on strong uptrend with RSI confirmation",
            "entry_conditions": [
                {"indicator": "SMA", "operator": "CROSSES_ABOVE", "value": 20},
                {"indicator": "RSI", "operator": ">", "value": 50},
            ],
            "exit_conditions": [
                {"type": "TAKE_PROFIT", "value": 3.0},
                {"type": "STOP_LOSS", "value": 1.5},
            ],
        },
    ]
    return templates


# ============================================================================
# Visual Strategy Builder Backtest Endpoints
# ============================================================================

# Asset column mappings for metals_prices_spot table
ASSET_COLUMN_MAP = {
    "GOLD": ("gold_inr", "gold_usd"),
    "SILVER": ("silver_inr", "silver_usd"),
    "PLATINUM": ("platinum_inr", "platinum_usd"),
    "PALLADIUM": ("palladium_inr", "palladium_usd"),
}


class DateRangeResponse(BaseModel):
    """Response model for available date range"""

    minDate: str
    maxDate: str
    asset: str


@router.get("/date-range/{asset}", response_model=DateRangeResponse)
async def get_available_date_range(
    asset: str,
    db: Session = Depends(get_db),
):
    """
    Get the available date range for backtesting data for a specific asset.

    Returns the minimum and maximum dates available in the database.
    """
    try:
        asset_upper = asset.upper()
        if asset_upper not in ASSET_COLUMN_MAP:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid asset: {asset}. Valid options: {list(ASSET_COLUMN_MAP.keys())}",
            )

        inr_col, _ = ASSET_COLUMN_MAP[asset_upper]
        price_column = getattr(MetalsPriceSpot, inr_col)

        # Get min and max dates where the asset has data
        from sqlalchemy import func

        result = (
            db.query(
                func.min(MetalsPriceSpot.date).label("min_date"),
                func.max(MetalsPriceSpot.date).label("max_date"),
            )
            .filter(price_column.isnot(None))
            .first()
        )

        if not result or not result.min_date or not result.max_date:
            raise HTTPException(
                status_code=404, detail=f"No data available for {asset}"
            )

        return DateRangeResponse(
            minDate=result.min_date.isoformat(),
            maxDate=result.max_date.isoformat(),
            asset=asset_upper,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get date range for {asset}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to get date range: {str(e)}"
        )


async def fetch_metals_data(
    db: Session,
    asset: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[dict]:
    """
    Fetch historical metals price data from database

    Args:
        db: Database session
        asset: Asset name (GOLD, SILVER, PLATINUM, PALLADIUM)
        start_date: Start date for data (default: 10 years ago)
        end_date: End date for data (default: today)

    Returns:
        List of candle dictionaries
    """
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=3650)  # ~10 years

    # Get column names for asset
    inr_col, usd_col = ASSET_COLUMN_MAP.get(asset.upper(), ("gold_inr", "gold_usd"))

    # Query database
    query = (
        db.query(MetalsPriceSpot)
        .filter(MetalsPriceSpot.date >= start_date)
        .filter(MetalsPriceSpot.date <= end_date)
        .order_by(MetalsPriceSpot.date)
    )

    results = query.all()

    if not results:
        raise ValueError(f"No historical data found for {asset}")

    # Convert to candle format
    candles = []
    for row in results:
        price_inr = getattr(row, inr_col)
        if price_inr is None:
            continue

        # For spot prices, we use close price for all OHLC
        # In real implementation, you'd have actual OHLC data
        candles.append(
            {
                "date": row.date.isoformat(),
                "open": float(price_inr),
                "high": float(price_inr) * 1.002,  # Simulate slight variation
                "low": float(price_inr) * 0.998,
                "close": float(price_inr),
                "volume": 0,
                "usdinr": float(row.usd_inr_rate) if row.usd_inr_rate else None,
            }
        )

    if len(candles) < 30:
        raise ValueError(
            f"Insufficient data for {asset}: only {len(candles)} data points"
        )

    return candles


@router.post("/run-visual", response_model=VisualBacktestResponse)
async def run_visual_backtest_endpoint(
    request: VisualBacktestRequest,
    db: Session = Depends(get_db),
    engine: str = DEFAULT_ENGINE,
):
    """
    Run a backtest with the visual strategy builder format.

    Uses historical data from the metals_prices_spot table.
    Supports recursive AND/OR logic groups for entry/exit conditions.

    Query Parameters:
        engine: "legacy" (default) or "backtesting" (uses backtesting.py library)
    """
    try:
        strategy = request.strategy

        # Parse dates
        start_date_obj = None
        end_date_obj = None
        if request.startDate:
            start_date_obj = date.fromisoformat(request.startDate)
        if request.endDate:
            end_date_obj = date.fromisoformat(request.endDate)

        # Fetch historical data from database
        candle_data = await fetch_metals_data(
            db, strategy.asset.value, start_date_obj, end_date_obj
        )

        # Convert strategy to dict for engine
        strategy_dict = {
            "id": strategy.id,
            "name": strategy.name,
            "asset": strategy.asset.value,
            "entryLogic": strategy.entryLogic.model_dump(),
            "exitLogic": strategy.exitLogic.model_dump(),
            "stopLossPct": strategy.stopLossPct,
            "takeProfitPct": strategy.takeProfitPct,
        }

        # Run backtest with selected engine
        if engine == "backtesting":
            # Use backtesting.py library (faster, more features)
            logger.info("Using backtesting.py engine")
            result = run_backtest_with_lib(
                strategy_dict, candle_data, request.initialCapital
            )
        else:
            # Use legacy custom engine
            logger.info("Using legacy backtest engine")
            result = run_visual_backtest(
                strategy_dict, candle_data, request.initialCapital
            )

        # Convert to response model
        trades = [
            VisualBacktestTrade(
                entryDate=t["entryDate"],
                entryPrice=t["entryPrice"],
                exitDate=t.get("exitDate"),
                exitPrice=t.get("exitPrice"),
                profit=t.get("profit"),
                profitPct=t.get("profitPct"),
                type=t.get("type", "LONG"),
                status=t.get("status", "CLOSED"),
            )
            for t in result["trades"]
        ]

        metrics = VisualBacktestMetrics(
            totalReturn=result["metrics"]["totalReturn"],
            winRate=result["metrics"]["winRate"],
            maxDrawdown=result["metrics"]["maxDrawdown"],
            sharpeRatio=result["metrics"]["sharpeRatio"],
            tradesCount=result["metrics"]["tradesCount"],
        )

        equity_curve = [
            EquityCurvePoint(date=p["date"], equity=p["equity"])
            for p in result["equityCurve"]
        ]

        price_data = [
            CandleData(
                date=c["date"],
                open=c["open"],
                high=c["high"],
                low=c["low"],
                close=c["close"],
                volume=c.get("volume", 0),
                usdinr=c.get("usdinr"),
            )
            for c in result["priceData"]
        ]

        return VisualBacktestResponse(
            trades=trades,
            finalEquity=result["finalEquity"],
            initialEquity=result["initialEquity"],
            metrics=metrics,
            equityCurve=equity_curve,
            priceData=price_data,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Visual backtest failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


# ============================================
# Strategy CRUD Endpoints
# ============================================


def get_user_id_from_header(x_user_id: str = Header(..., alias="X-User-Id")) -> UUID:
    """Extract and validate user ID from header."""
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


@router.post("/strategies", response_model=StrategyResponse, tags=["strategies"])
async def save_strategy(
    request: StrategySaveRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Save a new strategy.

    Requires X-User-Id header with the user's UUID.
    """
    try:
        strategy = StrategyModel(
            user_id=user_id,
            name=request.name,
            description=request.description,
            asset=request.asset.value,
            entry_logic=request.entryLogic.model_dump(),
            exit_logic=request.exitLogic.model_dump(),
            stop_loss_pct=request.stopLossPct,
            take_profit_pct=request.takeProfitPct,
            is_public=request.isPublic,
            is_favorite=request.isFavorite,
            tags=request.tags,
        )

        db.add(strategy)
        db.commit()
        db.refresh(strategy)

        return StrategyResponse(**strategy.to_dict())

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save strategy: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to save strategy: {str(e)}"
        )


@router.get("/strategies", response_model=StrategyListResponse, tags=["strategies"])
async def list_strategies(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
    asset: Optional[str] = Query(None, description="Filter by asset"),
    is_favorite: Optional[bool] = Query(None, description="Filter favorites only"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List user's strategies.

    Requires X-User-Id header with the user's UUID.
    """
    try:
        query = db.query(StrategyModel).filter(StrategyModel.user_id == user_id)

        if asset:
            query = query.filter(StrategyModel.asset == asset)
        if is_favorite is not None:
            query = query.filter(StrategyModel.is_favorite == is_favorite)

        total = query.count()
        strategies = (
            query.order_by(
                StrategyModel.updated_at.desc().nullsfirst(),
                StrategyModel.created_at.desc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        return StrategyListResponse(
            strategies=[StrategyResponse(**s.to_dict()) for s in strategies],
            total=total,
        )

    except Exception as e:
        logger.error(f"Failed to list strategies: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to list strategies: {str(e)}"
        )


@router.get(
    "/strategies/{strategy_id}", response_model=StrategyResponse, tags=["strategies"]
)
async def get_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Get a specific strategy by ID.

    Requires X-User-Id header with the user's UUID.
    """
    strategy = (
        db.query(StrategyModel)
        .filter(
            StrategyModel.id == strategy_id,
            StrategyModel.user_id == user_id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return StrategyResponse(**strategy.to_dict())


@router.put(
    "/strategies/{strategy_id}", response_model=StrategyResponse, tags=["strategies"]
)
async def update_strategy(
    strategy_id: int,
    request: StrategyUpdateRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Update an existing strategy.

    Requires X-User-Id header with the user's UUID.
    """
    strategy = (
        db.query(StrategyModel)
        .filter(
            StrategyModel.id == strategy_id,
            StrategyModel.user_id == user_id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    try:
        # Update only provided fields
        if request.name is not None:
            strategy.name = request.name
        if request.description is not None:
            strategy.description = request.description
        if request.asset is not None:
            strategy.asset = request.asset.value
        if request.entryLogic is not None:
            strategy.entry_logic = request.entryLogic.model_dump()
        if request.exitLogic is not None:
            strategy.exit_logic = request.exitLogic.model_dump()
        if request.stopLossPct is not None:
            strategy.stop_loss_pct = request.stopLossPct
        if request.takeProfitPct is not None:
            strategy.take_profit_pct = request.takeProfitPct
        if request.isPublic is not None:
            strategy.is_public = request.isPublic
        if request.isFavorite is not None:
            strategy.is_favorite = request.isFavorite
        if request.tags is not None:
            strategy.tags = request.tags

        db.commit()
        db.refresh(strategy)

        return StrategyResponse(**strategy.to_dict())

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update strategy: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update strategy: {str(e)}"
        )


@router.delete("/strategies/{strategy_id}", tags=["strategies"])
async def delete_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Delete a strategy.

    Requires X-User-Id header with the user's UUID.
    """
    strategy = (
        db.query(StrategyModel)
        .filter(
            StrategyModel.id == strategy_id,
            StrategyModel.user_id == user_id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    try:
        db.delete(strategy)
        db.commit()
        return {"message": "Strategy deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete strategy: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete strategy: {str(e)}"
        )


# ============================================
# Backtest Results CRUD Endpoints
# ============================================


@router.post("/backtests/save", response_model=BacktestResponse, tags=["backtests"])
async def save_backtest(
    request: BacktestSaveRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Save a backtest result.

    Requires X-User-Id header with the user's UUID.
    """
    try:
        backtest = BacktestModel(
            user_id=user_id,
            strategy_id=request.strategyId,
            asset=request.asset.value,
            initial_capital=request.initialCapital,
            final_equity=request.finalEquity,
            total_trades=request.totalTrades,
            win_rate=request.winRate,
            total_return=request.totalReturn,
            max_drawdown=request.maxDrawdown,
            sharpe_ratio=request.sharpeRatio,
            trades=request.trades,
            equity_curve=request.equityCurve,
            execution_time_ms=request.executionTimeMs,
            status="completed",
        )

        db.add(backtest)
        db.commit()
        db.refresh(backtest)

        return BacktestResponse(
            id=backtest.id,
            strategyId=backtest.strategy_id,
            userId=str(backtest.user_id),
            asset=backtest.asset,
            initialCapital=float(backtest.initial_capital),
            finalEquity=float(backtest.final_equity) if backtest.final_equity else 0,
            metrics=VisualBacktestMetrics(
                totalReturn=float(backtest.total_return)
                if backtest.total_return
                else 0,
                winRate=float(backtest.win_rate) if backtest.win_rate else 0,
                maxDrawdown=float(backtest.max_drawdown)
                if backtest.max_drawdown
                else 0,
                sharpeRatio=float(backtest.sharpe_ratio)
                if backtest.sharpe_ratio
                else 0,
                tradesCount=backtest.total_trades or 0,
            ),
            trades=backtest.trades or [],
            equityCurve=backtest.equity_curve or [],
            executionTimeMs=backtest.execution_time_ms,
            status=backtest.status,
            errorMessage=backtest.error_message,
            createdAt=backtest.created_at.isoformat() if backtest.created_at else None,
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save backtest: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to save backtest: {str(e)}"
        )


@router.get("/backtests", response_model=BacktestListResponse, tags=["backtests"])
async def list_backtests(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
    strategy_id: Optional[int] = Query(None, description="Filter by strategy ID"),
    asset: Optional[str] = Query(None, description="Filter by asset"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List user's backtest results.

    Requires X-User-Id header with the user's UUID.
    """
    try:
        query = db.query(BacktestModel).filter(BacktestModel.user_id == user_id)

        if strategy_id:
            query = query.filter(BacktestModel.strategy_id == strategy_id)
        if asset:
            query = query.filter(BacktestModel.asset == asset)

        total = query.count()
        backtests = (
            query.order_by(BacktestModel.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        results = []
        for bt in backtests:
            results.append(
                BacktestResponse(
                    id=bt.id,
                    strategyId=bt.strategy_id,
                    userId=str(bt.user_id),
                    asset=bt.asset,
                    initialCapital=float(bt.initial_capital),
                    finalEquity=float(bt.final_equity) if bt.final_equity else 0,
                    metrics=VisualBacktestMetrics(
                        totalReturn=float(bt.total_return) if bt.total_return else 0,
                        winRate=float(bt.win_rate) if bt.win_rate else 0,
                        maxDrawdown=float(bt.max_drawdown) if bt.max_drawdown else 0,
                        sharpeRatio=float(bt.sharpe_ratio) if bt.sharpe_ratio else 0,
                        tradesCount=bt.total_trades or 0,
                    ),
                    trades=bt.trades or [],
                    equityCurve=bt.equity_curve or [],
                    executionTimeMs=bt.execution_time_ms,
                    status=bt.status,
                    errorMessage=bt.error_message,
                    createdAt=bt.created_at.isoformat() if bt.created_at else None,
                )
            )

        return BacktestListResponse(backtests=results, total=total)

    except Exception as e:
        logger.error(f"Failed to list backtests: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to list backtests: {str(e)}"
        )


@router.get(
    "/backtests/{backtest_id}", response_model=BacktestResponse, tags=["backtests"]
)
async def get_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Get a specific backtest result by ID.

    Requires X-User-Id header with the user's UUID.
    """
    bt = (
        db.query(BacktestModel)
        .filter(
            BacktestModel.id == backtest_id,
            BacktestModel.user_id == user_id,
        )
        .first()
    )

    if not bt:
        raise HTTPException(status_code=404, detail="Backtest not found")

    return BacktestResponse(
        id=bt.id,
        strategyId=bt.strategy_id,
        userId=str(bt.user_id),
        asset=bt.asset,
        initialCapital=float(bt.initial_capital),
        finalEquity=float(bt.final_equity) if bt.final_equity else 0,
        metrics=VisualBacktestMetrics(
            totalReturn=float(bt.total_return) if bt.total_return else 0,
            winRate=float(bt.win_rate) if bt.win_rate else 0,
            maxDrawdown=float(bt.max_drawdown) if bt.max_drawdown else 0,
            sharpeRatio=float(bt.sharpe_ratio) if bt.sharpe_ratio else 0,
            tradesCount=bt.total_trades or 0,
        ),
        trades=bt.trades or [],
        equityCurve=bt.equity_curve or [],
        executionTimeMs=bt.execution_time_ms,
        status=bt.status,
        errorMessage=bt.error_message,
        createdAt=bt.created_at.isoformat() if bt.created_at else None,
    )


@router.delete("/backtests/{backtest_id}", tags=["backtests"])
async def delete_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_header),
):
    """
    Delete a backtest result.

    Requires X-User-Id header with the user's UUID.
    """
    backtest = (
        db.query(BacktestModel)
        .filter(
            BacktestModel.id == backtest_id,
            BacktestModel.user_id == user_id,
        )
        .first()
    )

    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")

    try:
        db.delete(backtest)
        db.commit()
        return {"message": "Backtest deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete backtest: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete backtest: {str(e)}"
        )
