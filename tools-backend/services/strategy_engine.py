"""
Strategy Engine for Visual Backtest

Implements the recursive evaluation engine for the visual strategy builder.
Evaluates entry/exit logic trees against historical price data.
"""

from typing import List, Dict, Any, Optional, Set
import math

from schemas.visual_backtest import StrategyComparator
from services.calc_service import extract_indicator_configs, calculate_indicators


def get_value(candle: Dict[str, Any], config: Dict[str, Any]) -> float:
    """
    Get indicator value from augmented candle data

    Args:
        candle: Candle dictionary with indicator values
        config: Indicator configuration

    Returns:
        Indicator value for this candle
    """
    ind_type = config.get("type")

    # Direct price values
    if ind_type == "PRICE":
        return candle.get("close", 0)
    if ind_type == "OPEN":
        return candle.get("open", 0)
    if ind_type == "HIGH":
        return candle.get("high", 0)
    if ind_type == "LOW":
        return candle.get("low", 0)
    if ind_type == "VOLUME":
        return candle.get("volume", 0)

    # Derived values
    if ind_type == "PREV_HIGH":
        return candle.get("PREV_HIGH", 0)
    if ind_type == "PREV_LOW":
        return candle.get("PREV_LOW", 0)
    if ind_type == "USDINR":
        return candle.get("usdinr", 0) or candle.get("USDINR", 0)

    # CPR values
    if ind_type == "CPR_PIVOT":
        return candle.get("CPR_PIVOT", 0)
    if ind_type == "CPR_TC":
        return candle.get("CPR_TC", 0)
    if ind_type == "CPR_BC":
        return candle.get("CPR_BC", 0)

    # Calculated indicators (SMA, EMA, RSI)
    period = config.get("period", 0)
    key = f"{ind_type}_{period}"
    return candle.get(key, 0)


def evaluate_condition(
    condition: Dict[str, Any], candle: Dict[str, Any], prev_candle: Dict[str, Any]
) -> bool:
    """
    Evaluate a single condition against candle data

    Args:
        condition: Condition dictionary
        candle: Current candle data
        prev_candle: Previous candle data (for crossover detection)

    Returns:
        True if condition is met
    """
    left_config = condition.get("left", {})
    comparator = condition.get("comparator")
    static_value = condition.get("value")

    val_a = get_value(candle, left_config)

    # Use static value or right indicator
    if static_value is not None:
        val_b = static_value
    else:
        right_config = condition.get("right", {})
        val_b = get_value(candle, right_config)

    # Get previous values for crossover detection
    prev_val_a = get_value(prev_candle, left_config)
    if static_value is not None:
        prev_val_b = static_value
    else:
        prev_val_b = get_value(prev_candle, condition.get("right", {}))

    # Filter out invalid data
    if val_a == 0 or (static_value is None and val_b == 0):
        return False

    # Evaluate comparator
    if comparator == ">" or comparator == StrategyComparator.GREATER_THAN.value:
        return val_a > val_b
    elif comparator == "<" or comparator == StrategyComparator.LESS_THAN.value:
        return val_a < val_b
    elif comparator == "==" or comparator == StrategyComparator.EQUALS.value:
        return abs(val_a - val_b) < 0.01
    elif (
        comparator == "CROSS_ABOVE"
        or comparator == StrategyComparator.CROSSES_ABOVE.value
    ):
        return prev_val_a <= prev_val_b and val_a > val_b
    elif (
        comparator == "CROSS_BELOW"
        or comparator == StrategyComparator.CROSSES_BELOW.value
    ):
        return prev_val_a >= prev_val_b and val_a < val_b

    return False


def evaluate_node(
    node: Dict[str, Any], candle: Dict[str, Any], prev_candle: Dict[str, Any]
) -> bool:
    """
    Recursively evaluate a strategy node (condition or group)

    Args:
        node: Strategy node (condition or group)
        candle: Current candle data
        prev_candle: Previous candle data

    Returns:
        True if node evaluates to true
    """
    node_type = node.get("type")

    if node_type == "CONDITION":
        return evaluate_condition(node, candle, prev_candle)

    elif node_type == "GROUP":
        children = node.get("children", [])

        if not children:
            return False  # Empty group returns false (safe default)

        operator = node.get("operator")

        if operator == "AND":
            return all(evaluate_node(child, candle, prev_candle) for child in children)
        else:  # OR
            return any(evaluate_node(child, candle, prev_candle) for child in children)

    return False


def run_visual_backtest(
    strategy: Dict[str, Any], data: List[Dict[str, Any]], initial_equity: float = 10000
) -> Dict[str, Any]:
    """
    Run backtest with visual strategy against historical data

    Args:
        strategy: Visual strategy dictionary
        data: List of candle dictionaries
        initial_equity: Starting capital

    Returns:
        Backtest result dictionary
    """
    # Extract indicator configurations from strategy
    configs: Set[str] = set()
    config_list: List[Dict] = []

    entry_logic = strategy.get("entryLogic", {})
    exit_logic = strategy.get("exitLogic", {})

    extract_indicator_configs(entry_logic, configs, config_list)
    extract_indicator_configs(exit_logic, configs, config_list)

    # Calculate indicators and augment data
    enhanced_data = calculate_indicators(data, config_list)

    # Backtest loop
    equity = initial_equity
    trades: List[Dict] = []
    equity_curve: List[Dict] = []
    current_trade: Optional[Dict] = None

    stop_loss_pct = strategy.get("stopLossPct", 2.0)
    take_profit_pct = strategy.get("takeProfitPct", 5.0)

    for i in range(1, len(enhanced_data)):
        candle = enhanced_data[i]
        prev_candle = enhanced_data[i - 1]

        # Check Exit (if in trade)
        if current_trade is not None:
            exit_signal = False

            # Stop Loss check
            price_change_pct = (
                candle["low"] - current_trade["entryPrice"]
            ) / current_trade["entryPrice"]
            if price_change_pct < -stop_loss_pct / 100:
                exit_signal = True

            # Take Profit check
            profit_high_pct = (
                candle["high"] - current_trade["entryPrice"]
            ) / current_trade["entryPrice"]
            if profit_high_pct > take_profit_pct / 100:
                exit_signal = True

            # Logic Exit (only if exit logic has conditions)
            exit_children = exit_logic.get("children", [])
            if exit_children and evaluate_node(exit_logic, candle, prev_candle):
                exit_signal = True

            if exit_signal:
                current_trade["exitDate"] = candle["date"]
                current_trade["exitPrice"] = candle["close"]
                current_trade["status"] = "CLOSED"

                profit_pct = (
                    current_trade["exitPrice"] - current_trade["entryPrice"]
                ) / current_trade["entryPrice"]
                current_trade["profitPct"] = profit_pct

                equity = equity * (1 + profit_pct)
                current_trade["profit"] = equity - (equity / (1 + profit_pct))

                trades.append(current_trade)
                current_trade = None

        # Check Entry (if not in trade)
        if current_trade is None:
            entry_children = entry_logic.get("children", [])
            if entry_children and evaluate_node(entry_logic, candle, prev_candle):
                current_trade = {
                    "entryDate": candle["date"],
                    "entryPrice": candle["close"],
                    "type": "LONG",
                    "status": "OPEN",
                }

        equity_curve.append({"date": candle["date"], "equity": equity})

    # Calculate metrics
    closed_trades = [t for t in trades if t.get("status") == "CLOSED"]

    if closed_trades:
        winning_trades = [t for t in closed_trades if (t.get("profitPct") or 0) > 0]
        win_rate = len(winning_trades) / len(closed_trades)
    else:
        win_rate = 0

    total_return = (equity - initial_equity) / initial_equity

    # Calculate max drawdown
    peak = initial_equity
    max_drawdown = 0
    for point in equity_curve:
        if point["equity"] > peak:
            peak = point["equity"]
        dd = (peak - point["equity"]) / peak
        if dd > max_drawdown:
            max_drawdown = dd

    # Calculate Sharpe ratio
    if len(equity_curve) > 1:
        returns = []
        for i in range(1, len(equity_curve)):
            prev_eq = equity_curve[i - 1]["equity"]
            curr_eq = equity_curve[i]["equity"]
            if prev_eq > 0:
                returns.append((curr_eq - prev_eq) / prev_eq)

        if returns:
            avg_return = sum(returns) / len(returns)
            variance = sum((r - avg_return) ** 2 for r in returns) / len(returns)
            std_dev = math.sqrt(variance) if variance > 0 else 0
            sharpe_ratio = (avg_return / std_dev * math.sqrt(252)) if std_dev > 0 else 0
        else:
            sharpe_ratio = 0
    else:
        sharpe_ratio = 0

    # Build response
    return {
        "trades": closed_trades,
        "finalEquity": equity,
        "initialEquity": initial_equity,
        "metrics": {
            "totalReturn": total_return,
            "winRate": win_rate,
            "maxDrawdown": max_drawdown,
            "sharpeRatio": sharpe_ratio,
            "tradesCount": len(closed_trades),
        },
        "equityCurve": equity_curve,
        "priceData": [
            {
                "date": c["date"],
                "open": c["open"],
                "high": c["high"],
                "low": c["low"],
                "close": c["close"],
                "volume": c.get("volume", 0),
                "usdinr": c.get("usdinr"),
            }
            for c in enhanced_data
        ],
    }
