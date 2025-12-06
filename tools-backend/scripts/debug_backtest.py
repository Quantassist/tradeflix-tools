"""
Debug script to explore backtest data and validate output.

This script:
1. Fetches sample data from the database
2. Runs the backtest logic step by step
3. Identifies where NaN values are introduced
4. Validates the output at each stage
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models.metals import MetalsPriceSpot
from services.calc_service import (
    candles_to_dataframe,
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bbands,
    calculate_atr,
    calculate_weekly_cpr,
    calculate_indicators,
    extract_indicator_configs,
)
from services.backtest_engine import (
    prepare_data_for_backtest,
    add_indicators_to_data,
    extract_configs_from_strategy,
    DynamicStrategy,
    evaluate_condition,
    evaluate_node,
    get_indicator_value,
)


def check_nan_in_dict(d: dict, path: str = "") -> list:
    """Recursively check for NaN values in a dictionary."""
    nan_paths = []
    for key, value in d.items():
        current_path = f"{path}.{key}" if path else key
        if isinstance(value, dict):
            nan_paths.extend(check_nan_in_dict(value, current_path))
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    nan_paths.extend(check_nan_in_dict(item, f"{current_path}[{i}]"))
                elif isinstance(item, float) and (
                    pd.isna(item) or np.isnan(item) or np.isinf(item)
                ):
                    nan_paths.append(f"{current_path}[{i}]")
        elif isinstance(value, float):
            if pd.isna(value) or np.isnan(value) or np.isinf(value):
                nan_paths.append(current_path)
    return nan_paths


def check_nan_in_dataframe(df: pd.DataFrame, name: str = "DataFrame"):
    """Check for NaN values in a DataFrame and report."""
    nan_counts = df.isna().sum()
    nan_cols = nan_counts[nan_counts > 0]

    if len(nan_cols) > 0:
        print(f"\n⚠️  NaN values found in {name}:")
        for col, count in nan_cols.items():
            print(f"   - {col}: {count} NaN values ({count / len(df) * 100:.1f}%)")
        return True
    else:
        print(f"\n✅ No NaN values in {name}")
        return False


def fetch_sample_data(asset: str = "GOLD", days: int = 365):
    """Fetch sample data from database."""
    print(f"\n{'=' * 60}")
    print(f"FETCHING DATA: {asset} (last {days} days)")
    print("=" * 60)

    # Create database connection
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # Asset column mapping
        ASSET_COLUMN_MAP = {
            "GOLD": ("gold_inr", "gold_usd"),
            "SILVER": ("silver_inr", "silver_usd"),
        }

        inr_col, usd_col = ASSET_COLUMN_MAP.get(asset, ("gold_inr", "gold_usd"))

        results = (
            db.query(MetalsPriceSpot)
            .filter(MetalsPriceSpot.date >= start_date)
            .filter(MetalsPriceSpot.date <= end_date)
            .order_by(MetalsPriceSpot.date)
            .all()
        )

        print(f"Found {len(results)} records")

        # Convert to candle format
        candles = []
        for row in results:
            price_inr = getattr(row, inr_col)
            if price_inr is None:
                continue

            candles.append(
                {
                    "date": row.date.isoformat(),
                    "open": float(price_inr),
                    "high": float(price_inr) * 1.002,
                    "low": float(price_inr) * 0.998,
                    "close": float(price_inr),
                    "volume": 0,
                    "usdinr": float(row.usd_inr_rate) if row.usd_inr_rate else 0,
                }
            )

        print(f"Converted to {len(candles)} candles")

        # Check raw data for NaN
        df_raw = pd.DataFrame(candles)
        check_nan_in_dataframe(df_raw, "Raw Candle Data")

        print(f"\nSample data (first 5 rows):")
        print(df_raw.head())

        print(f"\nData types:")
        print(df_raw.dtypes)

        print(f"\nData statistics:")
        print(df_raw.describe())

        return candles

    finally:
        db.close()


def test_indicator_calculations(candles: list):
    """Test indicator calculations step by step."""
    print(f"\n{'=' * 60}")
    print("TESTING INDICATOR CALCULATIONS")
    print("=" * 60)

    df = candles_to_dataframe(candles)
    print(f"\nDataFrame shape: {df.shape}")
    check_nan_in_dataframe(df, "After candles_to_dataframe")

    # Extract close prices
    close = df["close"].values.astype(np.float64)
    high = df["high"].values.astype(np.float64)
    low = df["low"].values.astype(np.float64)

    print(
        f"\nClose prices - min: {close.min()}, max: {close.max()}, mean: {close.mean():.2f}"
    )
    print(f"Any NaN in close: {np.any(np.isnan(close))}")
    print(f"Any Inf in close: {np.any(np.isinf(close))}")

    # Test each indicator
    print("\n--- Testing SMA(20) ---")
    sma = calculate_sma(close, 20)
    print(f"SMA result type: {type(sma)}")
    print(f"SMA NaN count: {np.sum(np.isnan(sma))} (expected: 19 for period 20)")
    print(f"SMA first 25 values: {sma[:25]}")

    print("\n--- Testing EMA(20) ---")
    ema = calculate_ema(close, 20)
    print(f"EMA NaN count: {np.sum(np.isnan(ema))} (expected: 19 for period 20)")

    print("\n--- Testing RSI(14) ---")
    rsi = calculate_rsi(close, 14)
    print(f"RSI NaN count: {np.sum(np.isnan(rsi))} (expected: 14 for period 14)")
    print(f"RSI range: {np.nanmin(rsi):.2f} to {np.nanmax(rsi):.2f}")

    print("\n--- Testing MACD ---")
    macd, signal, hist = calculate_macd(close)
    print(f"MACD NaN count: {np.sum(np.isnan(macd))}")
    print(f"Signal NaN count: {np.sum(np.isnan(signal))}")
    print(f"Hist NaN count: {np.sum(np.isnan(hist))}")

    print("\n--- Testing Bollinger Bands(20) ---")
    bb_upper, bb_middle, bb_lower = calculate_bbands(close, 20)
    print(f"BB Upper NaN count: {np.sum(np.isnan(bb_upper))}")
    print(f"BB Middle NaN count: {np.sum(np.isnan(bb_middle))}")
    print(f"BB Lower NaN count: {np.sum(np.isnan(bb_lower))}")

    print("\n--- Testing ATR(14) ---")
    atr = calculate_atr(high, low, close, 14)
    print(f"ATR NaN count: {np.sum(np.isnan(atr))}")

    print("\n--- Testing Weekly CPR ---")
    cpr_df = calculate_weekly_cpr(df)
    check_nan_in_dataframe(cpr_df, "CPR DataFrame")

    return df


def test_backtest_data_preparation(candles: list):
    """Test the backtest data preparation."""
    print(f"\n{'=' * 60}")
    print("TESTING BACKTEST DATA PREPARATION")
    print("=" * 60)

    df = prepare_data_for_backtest(candles)
    print(f"\nPrepared DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    check_nan_in_dataframe(df, "After prepare_data_for_backtest")

    # Sample strategy config
    sample_configs = [
        {"type": "RSI", "period": 14},
        {"type": "SMA", "period": 20},
        {"type": "EMA", "period": 20},
    ]

    df = add_indicators_to_data(df, sample_configs)
    print(f"\nAfter adding indicators - columns: {list(df.columns)}")
    check_nan_in_dataframe(df, "After add_indicators_to_data")

    return df


def test_full_backtest(candles: list):
    """Test a full backtest run."""
    print(f"\n{'=' * 60}")
    print("TESTING FULL BACKTEST")
    print("=" * 60)

    # Sample strategy - using RSI < 50 since data doesn't have RSI < 30
    strategy = {
        "id": "test-strategy",
        "name": "Test RSI Strategy",
        "asset": "GOLD",
        "entryLogic": {
            "id": "entry-group",
            "type": "GROUP",
            "operator": "AND",
            "children": [
                {
                    "id": "entry-cond-1",
                    "type": "CONDITION",
                    "left": {"type": "RSI", "period": 14},
                    "comparator": "<",
                    "right": {"type": "PRICE", "period": 0},
                    "value": 50,  # RSI < 50 (more realistic for this data)
                }
            ],
        },
        "exitLogic": {
            "id": "exit-group",
            "type": "GROUP",
            "operator": "OR",
            "children": [
                {
                    "id": "exit-cond-1",
                    "type": "CONDITION",
                    "left": {"type": "RSI", "period": 14},
                    "comparator": ">",
                    "right": {"type": "PRICE", "period": 0},
                    "value": 60,  # RSI > 60
                }
            ],
        },
        "stopLossPct": 2.0,
        "takeProfitPct": 5.0,
    }

    print(f"\nStrategy: {strategy['name']}")
    print("Entry: RSI(14) < 50")
    print("Exit: RSI(14) > 60 or SL/TP")

    # Extract configs
    configs = extract_configs_from_strategy(strategy)
    print(f"\nExtracted indicator configs: {configs}")

    # Prepare data
    df = prepare_data_for_backtest(candles)
    df = add_indicators_to_data(df, configs)

    print(f"\nData prepared with {len(df)} rows")
    check_nan_in_dataframe(df, "Prepared backtest data")

    # Check RSI values
    rsi_col = "RSI_14"
    if rsi_col in df.columns:
        rsi_values = df[rsi_col]
        print(f"\nRSI(14) statistics:")
        print(f"  Min: {rsi_values.min():.2f}")
        print(f"  Max: {rsi_values.max():.2f}")
        print(f"  Mean: {rsi_values.mean():.2f}")
        print(f"  NaN count: {rsi_values.isna().sum()}")

        # Count entry signals
        entry_signals = (rsi_values < 30).sum()
        exit_signals = (rsi_values > 70).sum()
        print(f"\n  Entry signals (RSI < 30): {entry_signals}")
        print(f"  Exit signals (RSI > 70): {exit_signals}")

    # Test condition evaluation manually
    print("\n--- Testing condition evaluation manually ---")
    from services.backtest_engine import (
        evaluate_node,
        evaluate_condition,
        get_indicator_value,
    )

    # Debug: Check RSI values where RSI < 30
    print("\nRSI values where RSI < 30:")
    rsi_below_30 = df[df["RSI_14"] < 30]
    print(f"Found {len(rsi_below_30)} rows with RSI < 30")
    if len(rsi_below_30) > 0:
        print(rsi_below_30[["Close", "RSI_14"]].head(10))

    # Debug: Check first few RSI values
    print("\nFirst 20 RSI values:")
    print(df["RSI_14"].head(20).tolist())

    # Test get_indicator_value
    print("\n--- Testing get_indicator_value ---")
    test_config = {"type": "RSI", "period": 14}
    for i in [0, 10, 20, 50, 100]:
        if i < len(df):
            val = get_indicator_value(df, test_config, i)
            print(f"  Index {i}: RSI={val:.2f}")

    entry_logic = strategy["entryLogic"]
    entry_signals_manual = []

    # Debug: Test a specific condition
    print("\n--- Testing single condition ---")
    test_cond = entry_logic["children"][0]
    print(f"Condition: {test_cond}")

    for i in [0, 10, 20, 50, 100, 150]:
        if i < len(df):
            rsi_val = df["RSI_14"].iloc[i]
            result = evaluate_condition(df, test_cond, i)
            print(f"  Index {i}: RSI={rsi_val:.2f}, result={result}")

    for i in range(len(df)):
        result = evaluate_node(df, entry_logic, i)
        if result:
            entry_signals_manual.append(i)

    print(f"\nManual entry signals found: {len(entry_signals_manual)}")
    if entry_signals_manual[:5]:
        print(f"First 5 signal indices: {entry_signals_manual[:5]}")
        for idx in entry_signals_manual[:3]:
            rsi_val = df["RSI_14"].iloc[idx]
            print(
                f"  Index {idx}: RSI={rsi_val:.2f}, Close={df['Close'].iloc[idx]:.2f}"
            )

    # Run backtest with backtesting.py
    print("\n--- Running backtesting.py ---")
    from backtesting import Backtest

    # Configure strategy
    DynamicStrategy.entry_logic = strategy["entryLogic"]
    DynamicStrategy.exit_logic = strategy["exitLogic"]
    DynamicStrategy.stop_loss_pct = strategy["stopLossPct"]
    DynamicStrategy.take_profit_pct = strategy["takeProfitPct"]

    # Scale equity to handle high-priced assets
    initial_equity = 10000
    max_price = df["Close"].max()
    min_equity_needed = max_price * 1.1

    effective_equity = initial_equity
    if initial_equity < min_equity_needed:
        effective_equity = min_equity_needed
        print(
            f"⚠️  Scaling equity from {initial_equity:,.0f} to {effective_equity:,.0f} (max price: {max_price:,.0f})"
        )

    bt = Backtest(
        df,
        DynamicStrategy,
        cash=effective_equity,
        commission=0.001,
        exclusive_orders=True,
        trade_on_close=True,
    )

    stats = bt.run()

    print(f"\n--- Backtest Results ---")
    print(f"Equity Final: {stats['Equity Final [$]']}")
    print(f"Return: {stats['Return [%]']}%")
    print(f"# Trades: {stats['# Trades']}")
    print(f"Win Rate: {stats['Win Rate [%]']}%")
    print(f"Max Drawdown: {stats['Max. Drawdown [%]']}%")
    print(f"Sharpe Ratio: {stats['Sharpe Ratio']}")

    # Check for NaN in stats
    print(f"\n--- Checking stats for NaN ---")
    nan_stats = []
    for key, value in stats.items():
        if isinstance(value, (int, float)) and (
            pd.isna(value)
            or (isinstance(value, float) and (np.isnan(value) or np.isinf(value)))
        ):
            nan_stats.append(f"{key}: {value}")

    if nan_stats:
        print(f"⚠️  NaN/Inf values found in stats:")
        for s in nan_stats:
            print(f"   - {s}")
    else:
        print("✅ No NaN/Inf values in stats")

    # Check trades
    if hasattr(stats, "_trades") and stats._trades is not None:
        trades_df = stats._trades
        print(f"\n--- Trades DataFrame ---")
        print(f"Shape: {trades_df.shape}")
        if not trades_df.empty:
            print(trades_df.head())
            check_nan_in_dataframe(trades_df, "Trades")
        else:
            print("No trades executed")

    # Check equity curve
    if hasattr(stats, "_equity_curve") and stats._equity_curve is not None:
        equity_df = stats._equity_curve
        print(f"\n--- Equity Curve ---")
        print(f"Shape: {equity_df.shape}")
        check_nan_in_dataframe(equity_df, "Equity Curve")

    return stats


def main():
    print("=" * 60)
    print("BACKTEST DEBUG SCRIPT")
    print("=" * 60)

    try:
        # Step 1: Fetch data
        candles = fetch_sample_data("GOLD", 365)

        if not candles:
            print("❌ No data fetched!")
            return

        # Step 2: Test indicator calculations
        test_indicator_calculations(candles)

        # Step 3: Test data preparation
        test_backtest_data_preparation(candles)

        # Step 4: Test full backtest
        test_full_backtest(candles)

        print("\n" + "=" * 60)
        print("DEBUG COMPLETE")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
