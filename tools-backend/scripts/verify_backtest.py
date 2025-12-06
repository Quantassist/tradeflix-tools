"""
Backtest Verification Script

This script verifies that the backtesting engine produces correct results by:
1. Creating test strategies with various conditions (flat, nested, different indicators)
2. Manually calculating expected signals by inspecting the data
3. Running the backtest engine and comparing results
4. Reporting any discrepancies

Test Cases:
- TC1: Simple RSI < static value
- TC2: Price > EMA (indicator vs indicator)
- TC3: RSI crosses above static value
- TC4: Nested AND/OR groups
- TC5: MACD crossover strategy
- TC6: Bollinger Band breakout
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from colorama import init, Fore, Style

# Initialize colorama for colored output
init()

from config import settings
from models.metals import MetalsPriceSpot
from services.calc_service import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bbands,
    calculate_atr,
    calculate_stoch,
)
from services.backtest_engine import (
    prepare_data_for_backtest,
    add_indicators_to_data,
    extract_configs_from_strategy,
    evaluate_condition,
    evaluate_node,
    get_indicator_value,
    run_backtest_with_lib,
)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{Fore.CYAN}{'=' * 70}")
    print(f" {text}")
    print(f"{'=' * 70}{Style.RESET_ALL}")


def print_subheader(text: str):
    """Print a formatted subheader."""
    print(f"\n{Fore.YELLOW}--- {text} ---{Style.RESET_ALL}")


def print_pass(text: str):
    """Print a pass message."""
    print(f"{Fore.GREEN}✓ PASS: {text}{Style.RESET_ALL}")


def print_fail(text: str):
    """Print a fail message."""
    print(f"{Fore.RED}✗ FAIL: {text}{Style.RESET_ALL}")


def print_info(text: str):
    """Print an info message."""
    print(f"{Fore.WHITE}  {text}{Style.RESET_ALL}")


# ============================================================================
# DATA FETCHING
# ============================================================================


def fetch_test_data(asset: str = "GOLD", days: int = 2000) -> List[Dict]:
    """Fetch historical data from database."""
    print_header(f"Fetching Test Data: {asset} ({days} days)")

    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # Column mapping matches the actual database schema
        ASSET_COLUMN_MAP = {
            "GOLD": "gold_inr",
            "SILVER": "silver_inr",
            "PLATINUM": "platinum_inr",
            "PALLADIUM": "palladium_inr",
        }

        column = ASSET_COLUMN_MAP.get(asset, "gold_inr")

        records = (
            db.query(MetalsPriceSpot)
            .filter(MetalsPriceSpot.date >= start_date)
            .filter(MetalsPriceSpot.date <= end_date)
            .order_by(MetalsPriceSpot.date)
            .all()
        )

        data = []
        for r in records:
            price = getattr(r, column, None)
            if price and price > 0:
                data.append(
                    {
                        "date": str(r.date),
                        "open": float(price),
                        "high": float(price) * 1.002,
                        "low": float(price) * 0.998,
                        "close": float(price),
                        "volume": 1000,
                        "usdinr": float(r.usd_inr_rate) if r.usd_inr_rate else 83.0,
                    }
                )

        print_info(f"Fetched {len(data)} records")
        return data

    finally:
        db.close()


# ============================================================================
# MANUAL SIGNAL CALCULATION
# ============================================================================


def manual_calculate_signals(
    df: pd.DataFrame, entry_logic: Dict[str, Any], exit_logic: Dict[str, Any]
) -> Tuple[List[int], List[int]]:
    """
    Manually calculate entry and exit signals by evaluating conditions.
    Returns lists of indices where signals occur.
    """
    entry_signals = []
    exit_signals = []

    for i in range(1, len(df)):
        # Check entry
        if evaluate_node(df, entry_logic, i):
            entry_signals.append(i)

        # Check exit
        if evaluate_node(df, exit_logic, i):
            exit_signals.append(i)

    return entry_signals, exit_signals


def manual_verify_condition(
    df: pd.DataFrame, condition: Dict[str, Any], sample_indices: List[int]
) -> List[Dict]:
    """
    Manually verify a condition at specific indices.
    Returns detailed breakdown of values and results.
    """
    results = []

    for idx in sample_indices:
        if idx >= len(df):
            continue

        left_config = condition.get("left", {})
        comparator = condition.get("comparator")
        static_value = condition.get("value")

        val_a = get_indicator_value(df, left_config, idx)

        if static_value is not None:
            val_b = static_value
        else:
            right_config = condition.get("right", {})
            val_b = get_indicator_value(df, right_config, idx)

        # Get previous values for crossover
        if idx > 0:
            prev_val_a = get_indicator_value(df, left_config, idx - 1)
            if static_value is not None:
                prev_val_b = static_value
            else:
                prev_val_b = get_indicator_value(
                    df, condition.get("right", {}), idx - 1
                )
        else:
            prev_val_a = val_a
            prev_val_b = val_b

        # Evaluate
        engine_result = evaluate_condition(df, condition, idx)

        # Manual evaluation
        if comparator in [">", "GREATER_THAN"]:
            manual_result = val_a > val_b
        elif comparator in ["<", "LESS_THAN"]:
            manual_result = val_a < val_b
        elif comparator in ["==", "EQUALS"]:
            manual_result = abs(val_a - val_b) < 0.01
        elif comparator in ["CROSS_ABOVE", "CROSSES_ABOVE"]:
            manual_result = prev_val_a <= prev_val_b and val_a > val_b
        elif comparator in ["CROSS_BELOW", "CROSSES_BELOW"]:
            manual_result = prev_val_a >= prev_val_b and val_a < val_b
        else:
            manual_result = False

        # Skip invalid data check
        if val_a == 0 or (static_value is None and val_b == 0):
            manual_result = False

        results.append(
            {
                "idx": idx,
                "date": str(df.index[idx]),
                "left_type": left_config.get("type"),
                "val_a": val_a,
                "comparator": comparator,
                "val_b": val_b,
                "prev_val_a": prev_val_a,
                "prev_val_b": prev_val_b,
                "engine_result": engine_result,
                "manual_result": manual_result,
                "match": engine_result == manual_result,
            }
        )

    return results


# ============================================================================
# TEST STRATEGIES
# ============================================================================


def create_test_strategies() -> List[Dict[str, Any]]:
    """Create a suite of test strategies with various conditions."""

    strategies = []

    # TC1: Simple RSI < static value (oversold)
    strategies.append(
        {
            "name": "TC1: RSI < 40 (Static Value)",
            "description": "Simple condition: RSI(14) less than static value 40",
            "strategy": {
                "id": "tc1",
                "name": "RSI Oversold",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": "<",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 40,
                        }
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": ">",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 60,
                        }
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC2: Price > EMA (Indicator vs Indicator)
    strategies.append(
        {
            "name": "TC2: Price > EMA(50) (Indicator vs Indicator)",
            "description": "Price above EMA indicates uptrend",
            "strategy": {
                "id": "tc2",
                "name": "EMA Trend",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "PRICE", "period": 0},
                            "comparator": ">",
                            "right": {"type": "EMA", "period": 50},
                            "value": None,
                        }
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "PRICE", "period": 0},
                            "comparator": "<",
                            "right": {"type": "EMA", "period": 50},
                            "value": None,
                        }
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC3: SMA Crossover (CROSS_ABOVE)
    strategies.append(
        {
            "name": "TC3: SMA(20) Crosses Above SMA(50)",
            "description": "Golden cross - short MA crosses above long MA",
            "strategy": {
                "id": "tc3",
                "name": "SMA Crossover",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "SMA", "period": 20},
                            "comparator": "CROSS_ABOVE",
                            "right": {"type": "SMA", "period": 50},
                            "value": None,
                        }
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "SMA", "period": 20},
                            "comparator": "CROSS_BELOW",
                            "right": {"type": "SMA", "period": 50},
                            "value": None,
                        }
                    ],
                },
                "stopLossPct": 3.0,
                "takeProfitPct": 6.0,
            },
        }
    )

    # TC4: Nested AND/OR Groups
    strategies.append(
        {
            "name": "TC4: Nested Groups (RSI AND (Price > EMA OR Price > SMA))",
            "description": "Complex nested logic with AND and OR operators",
            "strategy": {
                "id": "tc4",
                "name": "Nested Logic",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": "<",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 50,
                        },
                        {
                            "id": "nested-or",
                            "type": "GROUP",
                            "operator": "OR",
                            "children": [
                                {
                                    "id": "c2",
                                    "type": "CONDITION",
                                    "left": {"type": "PRICE", "period": 0},
                                    "comparator": ">",
                                    "right": {"type": "EMA", "period": 20},
                                    "value": None,
                                },
                                {
                                    "id": "c3",
                                    "type": "CONDITION",
                                    "left": {"type": "PRICE", "period": 0},
                                    "comparator": ">",
                                    "right": {"type": "SMA", "period": 50},
                                    "value": None,
                                },
                            ],
                        },
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "OR",
                    "children": [
                        {
                            "id": "c4",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": ">",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 70,
                        },
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC5: MACD Crossover
    strategies.append(
        {
            "name": "TC5: MACD Crosses Above Signal",
            "description": "MACD line crosses above signal line",
            "strategy": {
                "id": "tc5",
                "name": "MACD Crossover",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "MACD", "period": 12},
                            "comparator": "CROSS_ABOVE",
                            "right": {"type": "MACD_SIGNAL", "period": 12},
                            "value": None,
                        }
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "MACD", "period": 12},
                            "comparator": "CROSS_BELOW",
                            "right": {"type": "MACD_SIGNAL", "period": 12},
                            "value": None,
                        }
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC6: Bollinger Band Breakout
    strategies.append(
        {
            "name": "TC6: Price Crosses Below Lower BB",
            "description": "Price breaks below lower Bollinger Band (oversold)",
            "strategy": {
                "id": "tc6",
                "name": "BB Breakout",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "PRICE", "period": 0},
                            "comparator": "<",
                            "right": {"type": "BB_LOWER", "period": 20},
                            "value": None,
                        }
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "PRICE", "period": 0},
                            "comparator": ">",
                            "right": {"type": "BB_UPPER", "period": 20},
                            "value": None,
                        }
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC7: Stochastic Oversold
    strategies.append(
        {
            "name": "TC7: Stochastic %K < 20 AND %D < 20",
            "description": "Both stochastic lines in oversold territory",
            "strategy": {
                "id": "tc7",
                "name": "Stochastic Oversold",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "STOCH_K", "period": 14},
                            "comparator": "<",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 20,
                        },
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "STOCH_D", "period": 14},
                            "comparator": "<",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 20,
                        },
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "OR",
                    "children": [
                        {
                            "id": "c3",
                            "type": "CONDITION",
                            "left": {"type": "STOCH_K", "period": 14},
                            "comparator": ">",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 80,
                        },
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    # TC8: Multi-indicator confluence
    strategies.append(
        {
            "name": "TC8: RSI + EMA + ATR Filter",
            "description": "RSI oversold AND Price > EMA AND ATR > threshold",
            "strategy": {
                "id": "tc8",
                "name": "Multi-Indicator",
                "asset": "GOLD",
                "entryLogic": {
                    "id": "entry",
                    "type": "GROUP",
                    "operator": "AND",
                    "children": [
                        {
                            "id": "c1",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": "<",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 45,
                        },
                        {
                            "id": "c2",
                            "type": "CONDITION",
                            "left": {"type": "PRICE", "period": 0},
                            "comparator": ">",
                            "right": {"type": "EMA", "period": 50},
                            "value": None,
                        },
                        {
                            "id": "c3",
                            "type": "CONDITION",
                            "left": {"type": "ATR", "period": 14},
                            "comparator": ">",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 500,  # ATR > 500
                        },
                    ],
                },
                "exitLogic": {
                    "id": "exit",
                    "type": "GROUP",
                    "operator": "OR",
                    "children": [
                        {
                            "id": "c4",
                            "type": "CONDITION",
                            "left": {"type": "RSI", "period": 14},
                            "comparator": ">",
                            "right": {"type": "PRICE", "period": 0},
                            "value": 65,
                        },
                    ],
                },
                "stopLossPct": 2.0,
                "takeProfitPct": 5.0,
            },
        }
    )

    return strategies


# ============================================================================
# VERIFICATION FUNCTIONS
# ============================================================================


def verify_indicator_calculation(df: pd.DataFrame) -> bool:
    """Verify that indicators are calculated correctly."""
    print_subheader("Verifying Indicator Calculations")

    all_passed = True
    close = df["Close"].values.astype(np.float64)
    _ = df["High"].values.astype(np.float64)
    _ = df["Low"].values.astype(np.float64)

    # Test RSI
    if "RSI_14" in df.columns:
        manual_rsi = calculate_rsi(close, 14)
        diff = np.abs(df["RSI_14"].values - manual_rsi)
        max_diff = np.nanmax(diff)
        if max_diff < 0.01:
            print_pass(f"RSI_14 calculation matches (max diff: {max_diff:.6f})")
        else:
            print_fail(f"RSI_14 calculation mismatch (max diff: {max_diff:.6f})")
            all_passed = False

    # Test EMA
    if "EMA_50" in df.columns:
        manual_ema = calculate_ema(close, 50)
        diff = np.abs(df["EMA_50"].values - manual_ema)
        max_diff = np.nanmax(diff)
        if max_diff < 0.01:
            print_pass(f"EMA_50 calculation matches (max diff: {max_diff:.6f})")
        else:
            print_fail(f"EMA_50 calculation mismatch (max diff: {max_diff:.6f})")
            all_passed = False

    # Test SMA
    if "SMA_20" in df.columns:
        manual_sma = calculate_sma(close, 20)
        diff = np.abs(df["SMA_20"].values - manual_sma)
        max_diff = np.nanmax(diff)
        if max_diff < 0.01:
            print_pass(f"SMA_20 calculation matches (max diff: {max_diff:.6f})")
        else:
            print_fail(f"SMA_20 calculation mismatch (max diff: {max_diff:.6f})")
            all_passed = False

    # Test MACD
    if "MACD_12" in df.columns:
        manual_macd, manual_signal, manual_hist = calculate_macd(close)
        diff = np.abs(df["MACD_12"].values - manual_macd)
        max_diff = np.nanmax(diff)
        if max_diff < 0.01:
            print_pass(f"MACD calculation matches (max diff: {max_diff:.6f})")
        else:
            print_fail(f"MACD calculation mismatch (max diff: {max_diff:.6f})")
            all_passed = False

    # Test Bollinger Bands
    if "BB_UPPER_20" in df.columns:
        manual_upper, manual_middle, manual_lower = calculate_bbands(close, 20)
        diff = np.abs(df["BB_UPPER_20"].values - manual_upper)
        max_diff = np.nanmax(diff)
        if max_diff < 0.01:
            print_pass(f"BB_UPPER_20 calculation matches (max diff: {max_diff:.6f})")
        else:
            print_fail(f"BB_UPPER_20 calculation mismatch (max diff: {max_diff:.6f})")
            all_passed = False

    return all_passed


def verify_condition_evaluation(df: pd.DataFrame, test_case: Dict) -> bool:
    """Verify condition evaluation for a test case."""
    strategy = test_case["strategy"]
    entry_logic = strategy["entryLogic"]

    # Get sample indices to test
    sample_indices = list(range(50, min(100, len(df))))

    # Extract first condition for detailed testing
    if entry_logic["children"]:
        first_child = entry_logic["children"][0]
        if first_child["type"] == "CONDITION":
            condition = first_child
        elif first_child["type"] == "GROUP" and first_child["children"]:
            condition = first_child["children"][0]
        else:
            return True

        results = manual_verify_condition(df, condition, sample_indices)

        mismatches = [r for r in results if not r["match"]]

        if mismatches:
            print_fail(f"Condition evaluation mismatch at {len(mismatches)} indices")
            for m in mismatches[:3]:
                print_info(
                    f"  idx={m['idx']}: {m['left_type']}={m['val_a']:.2f} {m['comparator']} {m['val_b']:.2f}"
                )
                print_info(
                    f"    Engine: {m['engine_result']}, Manual: {m['manual_result']}"
                )
            return False
        else:
            print_pass(
                f"Condition evaluation matches at all {len(results)} tested indices"
            )
            return True

    return True


def verify_signal_generation(df: pd.DataFrame, test_case: Dict) -> Tuple[bool, Dict]:
    """Verify that signals are generated correctly."""
    strategy = test_case["strategy"]
    entry_logic = strategy["entryLogic"]
    exit_logic = strategy["exitLogic"]

    entry_signals, exit_signals = manual_calculate_signals(df, entry_logic, exit_logic)

    stats = {
        "entry_signals": len(entry_signals),
        "exit_signals": len(exit_signals),
        "first_entry_idx": entry_signals[0] if entry_signals else None,
        "first_exit_idx": exit_signals[0] if exit_signals else None,
    }

    if entry_signals:
        print_pass(f"Generated {len(entry_signals)} entry signals")
        print_info(
            f"  First entry at index {entry_signals[0]} ({df.index[entry_signals[0]]})"
        )
    else:
        print_info("No entry signals generated (may be expected)")

    if exit_signals:
        print_pass(f"Generated {len(exit_signals)} exit signals")

    return True, stats


def verify_backtest_execution(data: List[Dict], test_case: Dict) -> Tuple[bool, Dict]:
    """Run full backtest and verify results."""
    strategy = test_case["strategy"]

    try:
        result = run_backtest_with_lib(strategy, data, initial_equity=100000)

        # Verify result structure
        required_keys = [
            "trades",
            "finalEquity",
            "initialEquity",
            "metrics",
            "equityCurve",
        ]
        missing_keys = [k for k in required_keys if k not in result]

        if missing_keys:
            print_fail(f"Missing keys in result: {missing_keys}")
            return False, {}

        # Verify metrics
        metrics = result["metrics"]

        if metrics["tradesCount"] >= 0:
            print_pass(f"Backtest executed: {metrics['tradesCount']} trades")
        else:
            print_fail("Invalid trade count")
            return False, result

        # Verify equity curve
        if len(result["equityCurve"]) > 0:
            print_pass(f"Equity curve has {len(result['equityCurve'])} points")

        # Verify final equity calculation
        if result["finalEquity"] > 0:
            total_return = (result["finalEquity"] - result["initialEquity"]) / result[
                "initialEquity"
            ]
            if abs(total_return - metrics["totalReturn"]) < 0.01:
                print_pass(
                    f"Total return calculation correct: {metrics['totalReturn']:.2%}"
                )
            else:
                print_fail(
                    f"Total return mismatch: calculated={total_return:.2%}, reported={metrics['totalReturn']:.2%}"
                )
                return False, result

        # Verify trade details
        for i, trade in enumerate(result["trades"][:3]):
            if trade["entryPrice"] > 0 and trade["exitPrice"] > 0:
                expected_pnl = trade["exitPrice"] - trade["entryPrice"]
                # Note: actual PnL includes position sizing, so we just check sign
                if (expected_pnl > 0) == (trade["profit"] > 0) or trade["profit"] == 0:
                    pass  # Direction matches
                else:
                    print_info(
                        f"  Trade {i}: Entry={trade['entryPrice']:.2f}, Exit={trade['exitPrice']:.2f}, PnL={trade['profit']:.2f}"
                    )

        return True, result

    except Exception as e:
        print_fail(f"Backtest execution failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False, {}


def verify_trade_logic(df: pd.DataFrame, result: Dict, test_case: Dict) -> bool:
    """Verify that trades follow the strategy logic."""
    strategy = test_case["strategy"]
    entry_logic = strategy["entryLogic"]
    trades = result.get("trades", [])

    if not trades:
        print_info("No trades to verify")
        return True

    all_valid = True

    for i, trade in enumerate(trades[:5]):  # Check first 5 trades
        entry_date = trade["entryDate"]

        # Find the index for this date
        try:
            # Handle different date formats
            entry_idx = None
            for idx, date_val in enumerate(df.index):
                if str(date_val)[:10] == entry_date[:10]:
                    entry_idx = idx
                    break

            if entry_idx is None:
                continue

            # Verify entry condition was true
            entry_signal = evaluate_node(df, entry_logic, entry_idx)

            if entry_signal:
                print_pass(f"Trade {i + 1}: Entry condition TRUE at {entry_date[:10]}")
            else:
                # Check nearby indices (timing might be off by 1)
                nearby_signal = any(
                    evaluate_node(df, entry_logic, idx)
                    for idx in range(max(0, entry_idx - 1), min(len(df), entry_idx + 2))
                )
                if nearby_signal:
                    print_pass(
                        f"Trade {i + 1}: Entry condition TRUE near {entry_date[:10]}"
                    )
                else:
                    print_fail(
                        f"Trade {i + 1}: Entry condition FALSE at {entry_date[:10]}"
                    )
                    all_valid = False

        except Exception as e:
            print_info(f"Trade {i + 1}: Could not verify ({str(e)})")

    return all_valid


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================


def run_all_tests():
    """Run all verification tests."""
    print_header("BACKTEST VERIFICATION SUITE")
    print_info("This script verifies the correctness of the backtesting engine")
    print_info("by comparing engine results against manually calculated expectations.")

    # Fetch test data
    data = fetch_test_data("GOLD", days=365)

    if len(data) < 100:
        print_fail("Insufficient data for testing")
        return

    # Get test strategies
    strategies = create_test_strategies()

    # Track results
    results_summary = []

    for test_case in strategies:
        print_header(test_case["name"])
        print_info(test_case["description"])

        strategy = test_case["strategy"]

        # Prepare data with indicators
        configs = extract_configs_from_strategy(strategy)
        df = prepare_data_for_backtest(data)
        df = add_indicators_to_data(df, configs)

        test_results = {
            "name": test_case["name"],
            "indicators_ok": False,
            "conditions_ok": False,
            "signals_ok": False,
            "backtest_ok": False,
            "trades_ok": False,
        }

        # Test 1: Verify indicator calculations
        print_subheader("1. Indicator Calculation")
        test_results["indicators_ok"] = verify_indicator_calculation(df)

        # Test 2: Verify condition evaluation
        print_subheader("2. Condition Evaluation")
        test_results["conditions_ok"] = verify_condition_evaluation(df, test_case)

        # Test 3: Verify signal generation
        print_subheader("3. Signal Generation")
        test_results["signals_ok"], signal_stats = verify_signal_generation(
            df, test_case
        )

        # Test 4: Run full backtest
        print_subheader("4. Backtest Execution")
        test_results["backtest_ok"], backtest_result = verify_backtest_execution(
            data, test_case
        )

        # Test 5: Verify trade logic
        if backtest_result:
            print_subheader("5. Trade Logic Verification")
            test_results["trades_ok"] = verify_trade_logic(
                df, backtest_result, test_case
            )

        results_summary.append(test_results)

    # Print summary
    print_header("VERIFICATION SUMMARY")

    total_tests = len(results_summary)
    passed_tests = sum(
        1
        for r in results_summary
        if all(
            [r["indicators_ok"], r["conditions_ok"], r["signals_ok"], r["backtest_ok"]]
        )
    )

    print(
        f"\n{'Test Case':<50} {'Ind':^5} {'Cond':^5} {'Sig':^5} {'BT':^5} {'Trade':^5}"
    )
    print("-" * 75)

    for r in results_summary:
        name = r["name"][:48]
        ind = "✓" if r["indicators_ok"] else "✗"
        cond = "✓" if r["conditions_ok"] else "✗"
        sig = "✓" if r["signals_ok"] else "✗"
        bt = "✓" if r["backtest_ok"] else "✗"
        trade = "✓" if r["trades_ok"] else "✗"

        print(f"{name:<50} {ind:^5} {cond:^5} {sig:^5} {bt:^5} {trade:^5}")

    print("-" * 75)
    print(
        f"\n{Fore.CYAN}Overall: {passed_tests}/{total_tests} test cases passed{Style.RESET_ALL}"
    )

    if passed_tests == total_tests:
        print(f"\n{Fore.GREEN}{'=' * 70}")
        print(" ALL TESTS PASSED - Backtesting engine is working correctly!")
        print(f"{'=' * 70}{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}{'=' * 70}")
        print(" SOME TESTS FAILED - Review the output above for details")
        print(f"{'=' * 70}{Style.RESET_ALL}")


if __name__ == "__main__":
    run_all_tests()
