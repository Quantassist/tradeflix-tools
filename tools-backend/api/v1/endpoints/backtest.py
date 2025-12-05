from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import math
import logging
from backtesting import Backtest, Strategy

from services.data_providers import YahooFinanceProvider, ProviderError

logger = logging.getLogger(__name__)

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


class BacktestResponse(BaseModel):
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


@router.post("/run", response_model=BacktestResponse)
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
