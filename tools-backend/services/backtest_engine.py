"""
Backtesting Engine using backtesting.py

High-performance backtesting engine that leverages the backtesting.py library
for strategy execution, with TA-Lib for indicator calculations.

This module provides:
1. DynamicStrategy - A configurable strategy class that evaluates visual strategy trees
2. run_backtest - Main function to execute backtests with the visual strategy format
"""

from typing import List, Dict, Any, Set
import math
import pandas as pd
import numpy as np
from backtesting import Backtest, Strategy

from services.calc_service import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bbands,
    calculate_atr,
    calculate_weekly_cpr,
)


def safe_float(value, default: float = 0.0) -> float:
    """Convert value to float, handling NaN and infinity."""
    try:
        if value is None:
            return default
        if pd.isna(value) or math.isnan(float(value)) or math.isinf(float(value)):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


# Static indicator types that don't require period-based calculation
STATIC_TYPES = {
    "PRICE",
    "OPEN",
    "HIGH",
    "LOW",
    "VOLUME",
    "PREV_HIGH",
    "PREV_LOW",
    "USDINR",
    "CPR_PIVOT",
    "CPR_TC",
    "CPR_BC",
}


def prepare_data_for_backtest(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Prepare candle data for backtesting.py format.

    backtesting.py requires DataFrame with columns: Open, High, Low, Close, Volume
    (capitalized) and a DatetimeIndex.

    Args:
        data: List of candle dictionaries

    Returns:
        DataFrame formatted for backtesting.py
    """
    df = pd.DataFrame(data)

    # Ensure proper column names (capitalized for backtesting.py)
    column_mapping = {
        "open": "Open",
        "high": "High",
        "low": "Low",
        "close": "Close",
        "volume": "Volume",
        "date": "Date",
    }

    # Rename columns that exist
    for old, new in column_mapping.items():
        if old in df.columns:
            df = df.rename(columns={old: new})

    # Set date as index
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.set_index("Date")

    # Ensure Volume exists
    if "Volume" not in df.columns:
        df["Volume"] = 0

    # Add derived columns (lowercase for our indicator access)
    df["PREV_HIGH"] = df["High"].shift(1).fillna(df["High"])
    df["PREV_LOW"] = df["Low"].shift(1).fillna(df["Low"])
    df["PREV_CLOSE"] = df["Close"].shift(1).fillna(df["Close"])

    # Add USDINR if present
    if "usdinr" in df.columns:
        df["USDINR"] = df["usdinr"]
    elif "USDINR" not in df.columns:
        df["USDINR"] = 0

    # Calculate CPR
    cpr_input = pd.DataFrame(
        {"high": df["High"], "low": df["Low"], "close": df["Close"]}, index=df.index
    )
    cpr_df = calculate_weekly_cpr(cpr_input)
    df["CPR_PIVOT"] = cpr_df["CPR_PIVOT"].values
    df["CPR_TC"] = cpr_df["CPR_TC"].values
    df["CPR_BC"] = cpr_df["CPR_BC"].values

    return df


def add_indicators_to_data(df: pd.DataFrame, configs: List[Dict]) -> pd.DataFrame:
    """
    Add calculated indicators to the DataFrame.

    Args:
        df: DataFrame with OHLCV data
        configs: List of indicator configurations

    Returns:
        DataFrame with indicator columns added
    """
    close = df["Close"].values.astype(np.float64)
    high = df["High"].values.astype(np.float64)
    low = df["Low"].values.astype(np.float64)

    for config in configs:
        ind_type = config.get("type")
        period = config.get("period", 14)

        if ind_type in STATIC_TYPES:
            continue

        key = f"{ind_type}_{period}"

        if ind_type == "SMA":
            df[key] = calculate_sma(close, period)
        elif ind_type == "EMA":
            df[key] = calculate_ema(close, period)
        elif ind_type == "RSI":
            df[key] = calculate_rsi(close, period)
        elif ind_type in ["MACD", "MACD_SIGNAL", "MACD_HIST"]:
            # Calculate all MACD components together
            macd_key = f"MACD_{period}"
            if macd_key not in df.columns:
                macd, signal, hist = calculate_macd(close)
                df[f"MACD_{period}"] = macd
                df[f"MACD_SIGNAL_{period}"] = signal
                df[f"MACD_HIST_{period}"] = hist
        elif ind_type in ["STOCH_K", "STOCH_D"]:
            # Calculate both Stochastic components together
            stoch_key = f"STOCH_K_{period}"
            if stoch_key not in df.columns:
                from services.calc_service import calculate_stoch

                slowk, slowd = calculate_stoch(high, low, close, period)
                df[f"STOCH_K_{period}"] = slowk
                df[f"STOCH_D_{period}"] = slowd
        elif ind_type == "ATR":
            df[key] = calculate_atr(high, low, close, period)
        elif ind_type in ["BB_UPPER", "BB_MIDDLE", "BB_LOWER", "BBANDS"]:
            # Calculate all Bollinger Bands components together
            bb_key = f"BB_UPPER_{period}"
            if bb_key not in df.columns:
                upper, middle, lower = calculate_bbands(close, period)
                df[f"BB_UPPER_{period}"] = upper
                df[f"BB_MIDDLE_{period}"] = middle
                df[f"BB_LOWER_{period}"] = lower

    return df.fillna(0)


def extract_configs_from_strategy(strategy: Dict[str, Any]) -> List[Dict]:
    """
    Extract indicator configurations from strategy tree.

    Args:
        strategy: Visual strategy dictionary

    Returns:
        List of unique indicator configurations
    """
    configs: Set[str] = set()
    config_list: List[Dict] = []

    def extract_from_node(node: Dict[str, Any]):
        if node.get("type") == "CONDITION":
            left = node.get("left", {})
            if left.get("type") not in STATIC_TYPES:
                key = f"{left.get('type')}_{left.get('period', 0)}"
                if key not in configs:
                    configs.add(key)
                    config_list.append(left)

            if node.get("value") is None:
                right = node.get("right", {})
                if right.get("type") not in STATIC_TYPES:
                    key = f"{right.get('type')}_{right.get('period', 0)}"
                    if key not in configs:
                        configs.add(key)
                        config_list.append(right)

        elif node.get("type") == "GROUP":
            for child in node.get("children", []):
                extract_from_node(child)

    extract_from_node(strategy.get("entryLogic", {}))
    extract_from_node(strategy.get("exitLogic", {}))

    return config_list


def get_indicator_value(data: pd.DataFrame, config: Dict, idx: int) -> float:
    """
    Get indicator value at a specific index.

    Args:
        data: DataFrame with indicator columns
        config: Indicator configuration
        idx: Row index

    Returns:
        Indicator value
    """
    ind_type = config.get("type")
    period = config.get("period", 0)

    if ind_type == "PRICE":
        return data["Close"].iloc[idx]
    elif ind_type == "OPEN":
        return data["Open"].iloc[idx]
    elif ind_type == "HIGH":
        return data["High"].iloc[idx]
    elif ind_type == "LOW":
        return data["Low"].iloc[idx]
    elif ind_type == "VOLUME":
        return data["Volume"].iloc[idx]
    elif ind_type in [
        "PREV_HIGH",
        "PREV_LOW",
        "USDINR",
        "CPR_PIVOT",
        "CPR_TC",
        "CPR_BC",
    ]:
        return data[ind_type].iloc[idx]
    else:
        key = f"{ind_type}_{period}"
        return data[key].iloc[idx] if key in data.columns else 0


def evaluate_condition(data: pd.DataFrame, condition: Dict[str, Any], idx: int) -> bool:
    """
    Evaluate a single condition at a specific index.

    Args:
        data: DataFrame with indicator columns
        condition: Condition dictionary
        idx: Current row index

    Returns:
        True if condition is met
    """
    left_config = condition.get("left", {})
    comparator = condition.get("comparator")
    static_value = condition.get("value")

    val_a = get_indicator_value(data, left_config, idx)

    if static_value is not None:
        val_b = static_value
    else:
        right_config = condition.get("right", {})
        val_b = get_indicator_value(data, right_config, idx)

    # Get previous values for crossover detection
    if idx > 0:
        prev_val_a = get_indicator_value(data, left_config, idx - 1)
        if static_value is not None:
            prev_val_b = static_value
        else:
            prev_val_b = get_indicator_value(data, condition.get("right", {}), idx - 1)
    else:
        prev_val_a = val_a
        prev_val_b = val_b

    # Skip invalid data
    if val_a == 0 or (static_value is None and val_b == 0):
        return False

    # Evaluate comparator
    if comparator in [">", "GREATER_THAN"]:
        return val_a > val_b
    elif comparator in ["<", "LESS_THAN"]:
        return val_a < val_b
    elif comparator in ["==", "EQUALS"]:
        return abs(val_a - val_b) < 0.01
    elif comparator in ["CROSS_ABOVE", "CROSSES_ABOVE"]:
        return prev_val_a <= prev_val_b and val_a > val_b
    elif comparator in ["CROSS_BELOW", "CROSSES_BELOW"]:
        return prev_val_a >= prev_val_b and val_a < val_b

    return False


def evaluate_node(data: pd.DataFrame, node: Dict[str, Any], idx: int) -> bool:
    """
    Recursively evaluate a strategy node.

    Args:
        data: DataFrame with indicator columns
        node: Strategy node (condition or group)
        idx: Current row index

    Returns:
        True if node evaluates to true
    """
    node_type = node.get("type")

    if node_type == "CONDITION":
        return evaluate_condition(data, node, idx)

    elif node_type == "GROUP":
        children = node.get("children", [])
        if not children:
            return False

        operator = node.get("operator")

        if operator == "AND":
            return all(evaluate_node(data, child, idx) for child in children)
        else:  # OR
            return any(evaluate_node(data, child, idx) for child in children)

    return False


class DynamicStrategy(Strategy):
    """
    Dynamic strategy that evaluates visual strategy trees.

    This strategy class is configured at runtime with entry/exit logic
    from the visual strategy builder.
    """

    # Strategy parameters (set before running)
    entry_logic = {}
    exit_logic = {}
    stop_loss_pct = 2.0
    take_profit_pct = 5.0

    def init(self):
        """Initialize strategy - indicators are pre-calculated in data."""
        pass

    def next(self):
        """Execute on each new bar."""
        idx = len(self.data) - 1

        # Convert backtesting.py data to DataFrame for our evaluation
        # Note: self.data is a special backtesting.py object
        df = self.data.df

        if not self.position:
            # Check entry conditions
            entry_children = self.entry_logic.get("children", [])
            if entry_children and evaluate_node(df, self.entry_logic, idx):
                # Calculate stop loss and take profit prices
                current_price = self.data.Close[-1]
                sl_price = current_price * (1 - self.stop_loss_pct / 100)
                tp_price = current_price * (1 + self.take_profit_pct / 100)

                self.buy(sl=sl_price, tp=tp_price)
        else:
            # Check exit conditions (SL/TP handled by backtesting.py)
            exit_children = self.exit_logic.get("children", [])
            if exit_children and evaluate_node(df, self.exit_logic, idx):
                self.position.close()


def run_backtest_with_lib(
    strategy: Dict[str, Any], data: List[Dict[str, Any]], initial_equity: float = 10000
) -> Dict[str, Any]:
    """
    Run backtest using backtesting.py library.

    Args:
        strategy: Visual strategy dictionary
        data: List of candle dictionaries
        initial_equity: Starting capital

    Returns:
        Backtest result dictionary in the expected format
    """
    # Extract indicator configurations
    configs = extract_configs_from_strategy(strategy)

    # Prepare data
    df = prepare_data_for_backtest(data)
    df = add_indicators_to_data(df, configs)

    # Configure strategy
    DynamicStrategy.entry_logic = strategy.get("entryLogic", {})
    DynamicStrategy.exit_logic = strategy.get("exitLogic", {})
    DynamicStrategy.stop_loss_pct = strategy.get("stopLossPct", 2.0)
    DynamicStrategy.take_profit_pct = strategy.get("takeProfitPct", 5.0)

    # Determine appropriate initial equity
    # If prices are much larger than initial equity, scale up
    max_price = df["Close"].max()
    min_equity_needed = max_price * 1.1  # Need at least 110% of max price

    effective_equity = initial_equity
    equity_scale_factor = 1.0

    if initial_equity < min_equity_needed:
        # Scale up equity to allow trading, we'll scale results back down
        equity_scale_factor = min_equity_needed / initial_equity
        effective_equity = min_equity_needed

    # Run backtest
    bt = Backtest(
        df,
        DynamicStrategy,
        cash=effective_equity,
        commission=0.001,  # 0.1% commission
        exclusive_orders=True,
        trade_on_close=True,  # Execute trades at close price
    )

    stats = bt.run()

    # Convert results to expected format
    trades = []
    if (
        hasattr(stats, "_trades")
        and stats._trades is not None
        and not stats._trades.empty
    ):
        for _, trade in stats._trades.iterrows():
            trades.append(
                {
                    "entryDate": str(trade["EntryTime"]),
                    "entryPrice": safe_float(trade["EntryPrice"]),
                    "exitDate": str(trade["ExitTime"]),
                    "exitPrice": safe_float(trade["ExitPrice"]),
                    "profit": safe_float(trade["PnL"]),
                    "profitPct": safe_float(trade["ReturnPct"]) / 100,
                    "type": "LONG" if safe_float(trade["Size"]) > 0 else "SHORT",
                    "status": "CLOSED",
                }
            )

    # Build equity curve
    equity_curve = []
    if hasattr(stats, "_equity_curve") and stats._equity_curve is not None:
        for date, row in stats._equity_curve.iterrows():
            equity_curve.append(
                {"date": str(date), "equity": safe_float(row["Equity"])}
            )

    # Calculate metrics with safe_float to handle NaN
    raw_final_equity = safe_float(stats["Equity Final [$]"], effective_equity)

    if equity_scale_factor > 1.0:
        # Scale the final equity back to the original scale
        profit_pct = (raw_final_equity - effective_equity) / effective_equity
        final_equity = initial_equity * (1 + profit_pct)
    else:
        final_equity = raw_final_equity

    total_return = (
        (final_equity - initial_equity) / initial_equity if initial_equity > 0 else 0
    )

    return {
        "trades": trades,
        "finalEquity": final_equity,
        "initialEquity": initial_equity,
        "metrics": {
            "totalReturn": safe_float(total_return),
            "winRate": safe_float(stats["Win Rate [%]"]) / 100,
            "maxDrawdown": safe_float(stats["Max. Drawdown [%]"]) / 100,
            "sharpeRatio": safe_float(stats["Sharpe Ratio"]),
            "tradesCount": int(safe_float(stats["# Trades"])),
        },
        "equityCurve": equity_curve,
        "priceData": [
            {
                "date": str(idx),
                "open": safe_float(row["Open"]),
                "high": safe_float(row["High"]),
                "low": safe_float(row["Low"]),
                "close": safe_float(row["Close"]),
                "volume": safe_float(row.get("Volume", 0)),
                "usdinr": safe_float(row.get("USDINR", 0)) if "USDINR" in row else None,
            }
            for idx, row in df.iterrows()
        ],
    }
