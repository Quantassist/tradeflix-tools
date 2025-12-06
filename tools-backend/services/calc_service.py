"""
Calculation Service for Technical Indicators

Optimized implementation using TA-Lib and pandas for high-performance
indicator calculations. Supports SMA, EMA, RSI, MACD, Bollinger Bands,
ATR, and many more indicators.
"""

from typing import List, Dict, Any, Set
import pandas as pd
import numpy as np

# Try to import TA-Lib, fall back to pandas-ta if not available
try:
    import talib

    HAS_TALIB = True
except ImportError:
    import pandas_ta as ta

    HAS_TALIB = False


def candles_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert list of candle dictionaries to pandas DataFrame.

    Args:
        data: List of candle dictionaries

    Returns:
        DataFrame with OHLCV columns
    """
    df = pd.DataFrame(data)
    # Ensure proper column names for TA-Lib
    df.columns = df.columns.str.lower()
    return df


def calculate_sma(close: np.ndarray, period: int) -> np.ndarray:
    """Calculate Simple Moving Average using TA-Lib or pandas."""
    if HAS_TALIB:
        return talib.SMA(close, timeperiod=period)
    else:
        return pd.Series(close).rolling(period).mean().values


def calculate_ema(close: np.ndarray, period: int) -> np.ndarray:
    """Calculate Exponential Moving Average using TA-Lib or pandas."""
    if HAS_TALIB:
        return talib.EMA(close, timeperiod=period)
    else:
        return pd.Series(close).ewm(span=period, adjust=False).mean().values


def calculate_rsi(close: np.ndarray, period: int = 14) -> np.ndarray:
    """Calculate Relative Strength Index using TA-Lib."""
    if HAS_TALIB:
        return talib.RSI(close, timeperiod=period)
    else:
        delta = pd.Series(close).diff()
        gain = delta.where(delta > 0, 0).rolling(period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
        rs = gain / loss
        return (100 - (100 / (1 + rs))).values


def calculate_macd(
    close: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple:
    """Calculate MACD using TA-Lib."""
    if HAS_TALIB:
        macd, macd_signal, macd_hist = talib.MACD(
            close, fastperiod=fast, slowperiod=slow, signalperiod=signal
        )
        return macd, macd_signal, macd_hist
    else:
        exp1 = pd.Series(close).ewm(span=fast, adjust=False).mean()
        exp2 = pd.Series(close).ewm(span=slow, adjust=False).mean()
        macd = exp1 - exp2
        macd_signal = macd.ewm(span=signal, adjust=False).mean()
        macd_hist = macd - macd_signal
        return macd.values, macd_signal.values, macd_hist.values


def calculate_bbands(
    close: np.ndarray, period: int = 20, std_dev: float = 2.0
) -> tuple:
    """Calculate Bollinger Bands using TA-Lib."""
    if HAS_TALIB:
        upper, middle, lower = talib.BBANDS(
            close, timeperiod=period, nbdevup=std_dev, nbdevdn=std_dev
        )
        return upper, middle, lower
    else:
        sma = pd.Series(close).rolling(period).mean()
        std = pd.Series(close).rolling(period).std()
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        return upper.values, sma.values, lower.values


def calculate_atr(
    high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14
) -> np.ndarray:
    """Calculate Average True Range using TA-Lib."""
    if HAS_TALIB:
        return talib.ATR(high, low, close, timeperiod=period)
    else:
        high_s = pd.Series(high)
        low_s = pd.Series(low)
        close_s = pd.Series(close)
        tr1 = high_s - low_s
        tr2 = abs(high_s - close_s.shift())
        tr3 = abs(low_s - close_s.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        return tr.rolling(period).mean().values


def calculate_stoch(
    high: np.ndarray,
    low: np.ndarray,
    close: np.ndarray,
    fastk_period: int = 14,
    slowk_period: int = 3,
    slowd_period: int = 3,
) -> tuple:
    """Calculate Stochastic Oscillator using TA-Lib."""
    if HAS_TALIB:
        slowk, slowd = talib.STOCH(
            high,
            low,
            close,
            fastk_period=fastk_period,
            slowk_period=slowk_period,
            slowd_period=slowd_period,
        )
        return slowk, slowd
    else:
        high_s = pd.Series(high)
        low_s = pd.Series(low)
        close_s = pd.Series(close)
        lowest_low = low_s.rolling(fastk_period).min()
        highest_high = high_s.rolling(fastk_period).max()
        fastk = 100 * (close_s - lowest_low) / (highest_high - lowest_low)
        slowk = fastk.rolling(slowk_period).mean()
        slowd = slowk.rolling(slowd_period).mean()
        return slowk.values, slowd.values


def calculate_weekly_cpr(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate Weekly Central Pivot Range (CPR) using pandas.

    Uses 5-day blocks to simulate weekly data on daily candles.

    Args:
        df: DataFrame with 'high', 'low', 'close' columns

    Returns:
        DataFrame with 'CPR_PIVOT', 'CPR_TC', 'CPR_BC' columns
    """
    n = len(df)
    DAYS_IN_WEEK = 5

    # Create week block indices
    week_blocks = np.arange(n) // DAYS_IN_WEEK

    # Calculate weekly high, low, close for each block
    weekly_stats = (
        df.groupby(week_blocks)
        .agg({"high": "max", "low": "min", "close": "last"})
        .shift(1)
    )  # Shift to get previous week's values

    # Map back to daily data
    prev_high = weekly_stats["high"].reindex(week_blocks).values
    prev_low = weekly_stats["low"].reindex(week_blocks).values
    prev_close = weekly_stats["close"].reindex(week_blocks).values

    # Calculate CPR levels
    pivot = (prev_high + prev_low + prev_close) / 3
    bc = (prev_high + prev_low) / 2
    tc = (pivot - bc) + pivot

    # Fill NaN with close price for first week
    pivot = np.where(np.isnan(pivot), df["close"].values, pivot)
    bc = np.where(np.isnan(bc), df["close"].values, bc)
    tc = np.where(np.isnan(tc), df["close"].values, tc)

    result = pd.DataFrame(
        {"CPR_PIVOT": pivot, "CPR_TC": tc, "CPR_BC": bc}, index=df.index
    )

    return result


def extract_indicator_configs(
    node: Dict[str, Any], configs: Set[str], config_list: List[Dict]
) -> None:
    """
    Recursively extract unique indicator configurations from strategy tree

    Args:
        node: Strategy node (condition or group)
        configs: Set of already seen config keys
        config_list: List to append new configs to
    """
    # Static types that don't need calculation
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

    if node.get("type") == "CONDITION":
        # Process left indicator
        left = node.get("left", {})
        if left.get("type") not in STATIC_TYPES:
            key = f"{left.get('type')}_{left.get('period', 0)}"
            if key not in configs:
                configs.add(key)
                config_list.append(left)

        # Process right indicator (only if no static value)
        if node.get("value") is None:
            right = node.get("right", {})
            if right.get("type") not in STATIC_TYPES:
                key = f"{right.get('type')}_{right.get('period', 0)}"
                if key not in configs:
                    configs.add(key)
                    config_list.append(right)

    elif node.get("type") == "GROUP":
        for child in node.get("children", []):
            extract_indicator_configs(child, configs, config_list)


def calculate_indicators(
    data: List[Dict[str, Any]], configs: List[Dict]
) -> List[Dict[str, Any]]:
    """
    Augment candle data with calculated indicator values using TA-Lib.

    Optimized to use vectorized pandas/numpy operations for performance.

    Args:
        data: List of candle dictionaries
        configs: List of indicator configurations to calculate

    Returns:
        Enhanced data with indicator values added to each candle
    """
    # Convert to DataFrame for vectorized operations
    df = candles_to_dataframe(data)

    # Static types that don't need calculation
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

    # Extract numpy arrays for TA-Lib (requires float64)
    close = df["close"].values.astype(np.float64)
    high = df["high"].values.astype(np.float64)
    low = df["low"].values.astype(np.float64)

    # Pre-populate derived columns using vectorized operations
    df["PREV_HIGH"] = df["high"].shift(1).fillna(df["high"])
    df["PREV_LOW"] = df["low"].shift(1).fillna(df["low"])
    df["PREV_CLOSE"] = df["close"].shift(1).fillna(df["close"])

    # Expose USDINR as main key if present
    if "usdinr" in df.columns:
        df["USDINR"] = df["usdinr"]

    # Calculate CPR using optimized pandas function
    cpr_df = calculate_weekly_cpr(df)
    df["CPR_PIVOT"] = cpr_df["CPR_PIVOT"]
    df["CPR_TC"] = cpr_df["CPR_TC"]
    df["CPR_BC"] = cpr_df["CPR_BC"]

    # Calculate technical indicators using TA-Lib
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
        elif ind_type in ["STOCH_K", "STOCH_D", "STOCH"]:
            # Calculate both Stochastic components together
            stoch_key = f"STOCH_K_{period}"
            if stoch_key not in df.columns:
                slowk, slowd = calculate_stoch(high, low, close, period)
                df[f"STOCH_K_{period}"] = slowk
                df[f"STOCH_D_{period}"] = slowd

    # Fill NaN values with 0
    df = df.fillna(0)

    # Convert back to list of dictionaries
    return df.to_dict("records")
