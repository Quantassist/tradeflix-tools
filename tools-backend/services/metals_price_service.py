"""
Metals price service for fetching historical spot prices and calculating seasonal trends
"""

from typing import List, Dict, Tuple
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import statistics
import logging

from models.metals import MetalsPriceSpot

logger = logging.getLogger(__name__)


class MetalsPriceService:
    """Service for fetching metals prices and calculating seasonal analysis"""

    # Metal column mappings
    METAL_COLUMNS = {
        "GOLD": ("gold_usd", "gold_inr"),
        "SILVER": ("silver_usd", "silver_inr"),
        "PLATINUM": ("platinum_usd", "platinum_inr"),
        "PALLADIUM": ("palladium_usd", "palladium_inr"),
    }

    @staticmethod
    def get_price_range(
        db: Session,
        start_date: date,
        end_date: date,
        metal: str = "GOLD",
        currency: str = "INR",
    ) -> List[Dict]:
        """
        Get prices for a date range

        Args:
            db: Database session
            start_date: Start date
            end_date: End date
            metal: GOLD, SILVER, PLATINUM, PALLADIUM
            currency: USD or INR

        Returns:
            List of price dictionaries with date and price
        """
        metal_cols = MetalsPriceService.METAL_COLUMNS.get(metal.upper())
        if not metal_cols:
            return []

        col_name = metal_cols[1] if currency.upper() == "INR" else metal_cols[0]

        prices = (
            db.query(MetalsPriceSpot)
            .filter(
                and_(
                    MetalsPriceSpot.date >= start_date, MetalsPriceSpot.date <= end_date
                )
            )
            .order_by(MetalsPriceSpot.date)
            .all()
        )

        result = []
        for p in prices:
            price_val = getattr(p, col_name, None)
            if price_val is not None:
                result.append(
                    {
                        "date": p.date.isoformat(),
                        "price": float(price_val),
                        "usd_inr_rate": float(p.usd_inr_rate)
                        if p.usd_inr_rate
                        else None,
                    }
                )

        return result

    @staticmethod
    def get_prices_around_date(
        db: Session,
        event_date: date,
        days_before: int = 7,
        days_after: int = 7,
        metal: str = "GOLD",
        currency: str = "INR",
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        Get prices before, during, and after an event date

        Returns:
            Tuple of (prices_before, prices_during, prices_after)
        """
        start_date = event_date - timedelta(days=days_before)
        end_date = event_date + timedelta(days=days_after)

        prices = MetalsPriceService.get_price_range(
            db, start_date, end_date, metal, currency
        )

        if not prices:
            return [], [], []

        prices_before = []
        prices_during = []
        prices_after = []

        for p in prices:
            p_date = date.fromisoformat(p["date"])
            if p_date < event_date:
                prices_before.append(p["price"])
            elif p_date == event_date:
                prices_during.append(p["price"])
            else:
                prices_after.append(p["price"])

        # If no price on exact event date, use surrounding prices
        if not prices_during and prices_before and prices_after:
            prices_during = [prices_before[-1], prices_after[0]]
        elif not prices_during and prices_before:
            prices_during = [prices_before[-1]]
        elif not prices_during and prices_after:
            prices_during = [prices_after[0]]

        return prices_before, prices_during, prices_after

    @staticmethod
    def calculate_event_impact(
        db: Session,
        event_date: date,
        metal: str = "GOLD",
        currency: str = "INR",
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """
        Calculate price impact around an event

        Returns:
            Dictionary with impact metrics
        """
        prices_before, prices_during, prices_after = (
            MetalsPriceService.get_prices_around_date(
                db, event_date, days_before, days_after, metal, currency
            )
        )

        if not prices_before or not prices_after:
            return {
                "has_data": False,
                "error": "Insufficient price data around event date",
            }

        avg_before = statistics.mean(prices_before)
        avg_during = statistics.mean(prices_during) if prices_during else avg_before
        avg_after = statistics.mean(prices_after)

        # Calculate changes
        change_before_to_during = ((avg_during - avg_before) / avg_before) * 100
        change_during_to_after = (
            ((avg_after - avg_during) / avg_during) * 100 if avg_during else 0
        )
        change_before_to_after = ((avg_after - avg_before) / avg_before) * 100

        # Calculate volatility
        all_prices = prices_before + prices_during + prices_after
        volatility = statistics.stdev(all_prices) if len(all_prices) > 1 else 0
        volatility_before = (
            statistics.stdev(prices_before) if len(prices_before) > 1 else 0
        )
        volatility_after = (
            statistics.stdev(prices_after) if len(prices_after) > 1 else 0
        )

        # Max gain/loss
        max_price = max(all_prices)
        min_price = min(all_prices)
        first_price = prices_before[0] if prices_before else avg_before

        max_gain = ((max_price - first_price) / first_price) * 100
        max_loss = ((min_price - first_price) / first_price) * 100

        return {
            "has_data": True,
            "avg_price_before": round(avg_before, 2),
            "avg_price_during": round(avg_during, 2),
            "avg_price_after": round(avg_after, 2),
            "change_before_to_during": round(change_before_to_during, 3),
            "change_during_to_after": round(change_during_to_after, 3),
            "change_7d": round(change_before_to_after, 3),
            "max_gain": round(max_gain, 3),
            "max_loss": round(max_loss, 3),
            "volatility": round(volatility, 2),
            "volatility_before": round(volatility_before, 2),
            "volatility_after": round(volatility_after, 2),
            "data_points": len(all_prices),
        }

    @staticmethod
    def calculate_historical_event_performance(
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """
        Calculate historical performance for an event across multiple years

        Args:
            db: Database session
            event_month: Month of event (1-12)
            event_day: Day of event (1-31)
            metal: Metal symbol
            currency: USD or INR
            years_back: Number of years to analyze
            days_before: Days before event to analyze
            days_after: Days after event to analyze

        Returns:
            Dictionary with aggregate performance metrics
        """
        current_year = date.today().year
        yearly_data = []

        for i in range(years_back):
            year = current_year - i - 1
            try:
                event_date = date(year, event_month, event_day)
            except ValueError:
                # Handle invalid dates (e.g., Feb 29 on non-leap year)
                try:
                    event_date = date(year, event_month, 28)
                except ValueError:
                    continue

            impact = MetalsPriceService.calculate_event_impact(
                db, event_date, metal, currency, days_before, days_after
            )

            if impact.get("has_data"):
                yearly_data.append(
                    {
                        "year": year,
                        "event_date": event_date.isoformat(),
                        "change_7d": impact["change_7d"],
                        "max_gain": impact["max_gain"],
                        "max_loss": impact["max_loss"],
                        "volatility": impact["volatility"],
                        "avg_price_before": impact["avg_price_before"],
                        "avg_price_after": impact["avg_price_after"],
                    }
                )

        if not yearly_data:
            return {"has_data": False, "error": "No historical data available"}

        # Calculate aggregate metrics
        changes = [d["change_7d"] for d in yearly_data]
        max_gains = [d["max_gain"] for d in yearly_data]
        max_losses = [d["max_loss"] for d in yearly_data]
        volatilities = [d["volatility"] for d in yearly_data]

        positive_years = sum(1 for c in changes if c > 0)
        win_rate = (positive_years / len(changes)) * 100

        return {
            "has_data": True,
            "occurrences": len(yearly_data),
            "avg_change_7d": round(statistics.mean(changes), 3),
            "median_change_7d": round(statistics.median(changes), 3),
            "std_dev": round(statistics.stdev(changes), 3) if len(changes) > 1 else 0,
            "avg_max_gain": round(statistics.mean(max_gains), 3),
            "avg_max_loss": round(statistics.mean(max_losses), 3),
            "avg_volatility": round(statistics.mean(volatilities), 2),
            "win_rate": round(win_rate, 2),
            "best_return": round(max(changes), 3),
            "worst_return": round(min(changes), 3),
            "best_year": yearly_data[changes.index(max(changes))]["year"],
            "worst_year": yearly_data[changes.index(min(changes))]["year"],
            "yearly_data": yearly_data,
        }

    @staticmethod
    def get_monthly_seasonality(
        db: Session, metal: str = "GOLD", currency: str = "INR", years_back: int = 10
    ) -> List[Dict]:
        """
        Calculate average monthly returns for seasonality analysis

        Returns:
            List of monthly statistics
        """
        current_year = date.today().year
        monthly_returns = {i: [] for i in range(1, 13)}

        for year in range(current_year - years_back, current_year):
            for month in range(1, 13):
                # Get first and last day of month
                first_day = date(year, month, 1)
                if month == 12:
                    last_day = date(year + 1, 1, 1) - timedelta(days=1)
                else:
                    last_day = date(year, month + 1, 1) - timedelta(days=1)

                prices = MetalsPriceService.get_price_range(
                    db, first_day, last_day, metal, currency
                )

                if len(prices) >= 2:
                    first_price = prices[0]["price"]
                    last_price = prices[-1]["price"]
                    monthly_return = ((last_price - first_price) / first_price) * 100
                    monthly_returns[month].append(monthly_return)

        month_names = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]

        result = []
        for month in range(1, 13):
            returns = monthly_returns[month]
            if returns:
                positive_count = sum(1 for r in returns if r > 0)
                result.append(
                    {
                        "month": month,
                        "month_name": month_names[month - 1],
                        "avg_return": round(statistics.mean(returns), 3),
                        "median_return": round(statistics.median(returns), 3),
                        "std_dev": round(statistics.stdev(returns), 3)
                        if len(returns) > 1
                        else 0,
                        "win_rate": round((positive_count / len(returns)) * 100, 2),
                        "best_return": round(max(returns), 3),
                        "worst_return": round(min(returns), 3),
                        "occurrences": len(returns),
                    }
                )
            else:
                result.append(
                    {
                        "month": month,
                        "month_name": month_names[month - 1],
                        "avg_return": 0,
                        "median_return": 0,
                        "std_dev": 0,
                        "win_rate": 0,
                        "best_return": 0,
                        "worst_return": 0,
                        "occurrences": 0,
                    }
                )

        return result

    @staticmethod
    def get_date_range_stats(db: Session) -> Dict:
        """Get the date range of available data"""
        min_date = db.query(func.min(MetalsPriceSpot.date)).scalar()
        max_date = db.query(func.max(MetalsPriceSpot.date)).scalar()
        count = db.query(func.count(MetalsPriceSpot.date)).scalar()

        return {
            "min_date": min_date.isoformat() if min_date else None,
            "max_date": max_date.isoformat() if max_date else None,
            "total_records": count or 0,
        }

    @staticmethod
    def get_daily_calendar_heatmap(
        db: Session, metal: str = "GOLD", currency: str = "INR", years_back: int = 10
    ) -> List[Dict]:
        """
        Calculate average daily returns for calendar heatmap (365 days)

        Returns:
            List of daily statistics with month, day, avg_return, win_rate
        """
        current_year = date.today().year
        daily_returns = {}  # Key: (month, day), Value: list of returns

        for year in range(current_year - years_back, current_year):
            for month in range(1, 13):
                # Determine days in month
                if month == 12:
                    days_in_month = 31
                else:
                    next_month = date(year, month + 1, 1)
                    days_in_month = (next_month - timedelta(days=1)).day

                for day in range(1, days_in_month + 1):
                    try:
                        current_date = date(year, month, day)
                        prev_date = current_date - timedelta(days=1)

                        prices = MetalsPriceService.get_price_range(
                            db, prev_date, current_date, metal, currency
                        )

                        if len(prices) == 2:
                            daily_return = (
                                (prices[1]["price"] - prices[0]["price"])
                                / prices[0]["price"]
                            ) * 100
                            key = (month, day)
                            if key not in daily_returns:
                                daily_returns[key] = []
                            daily_returns[key].append(daily_return)
                    except ValueError:
                        continue

        result = []
        for (month, day), returns in sorted(daily_returns.items()):
            if returns:
                positive_count = sum(1 for r in returns if r > 0)
                result.append(
                    {
                        "month": month,
                        "day": day,
                        "avg_return": round(statistics.mean(returns), 3),
                        "win_rate": round((positive_count / len(returns)) * 100, 1),
                        "occurrences": len(returns),
                        "best_return": round(max(returns), 3),
                        "worst_return": round(min(returns), 3),
                    }
                )

        return result

    @staticmethod
    def get_event_trajectory(
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        days_before: int = 10,
        days_after: int = 10,
    ) -> Dict:
        """
        Calculate cumulative return trajectory around an event

        Returns:
            Dictionary with daily cumulative returns from -days_before to +days_after
        """
        current_year = date.today().year
        trajectories = []  # List of trajectories for each year

        for i in range(years_back):
            year = current_year - i - 1
            try:
                event_date = date(year, event_month, event_day)
            except ValueError:
                try:
                    event_date = date(year, event_month, 28)
                except ValueError:
                    continue

            start_date = event_date - timedelta(days=days_before)
            end_date = event_date + timedelta(days=days_after)

            prices = MetalsPriceService.get_price_range(
                db, start_date, end_date, metal, currency
            )

            if len(prices) < 5:
                continue

            # Calculate cumulative returns from first price
            base_price = prices[0]["price"]
            trajectory = {}

            for p in prices:
                p_date = date.fromisoformat(p["date"])
                day_offset = (p_date - event_date).days
                if -days_before <= day_offset <= days_after:
                    cum_return = ((p["price"] - base_price) / base_price) * 100
                    trajectory[day_offset] = cum_return

            if trajectory:
                trajectories.append({"year": year, "data": trajectory})

        if not trajectories:
            return {"has_data": False, "error": "No historical data available"}

        # Calculate average trajectory
        avg_trajectory = []
        for day_offset in range(-days_before, days_after + 1):
            returns_at_day = [
                t["data"].get(day_offset)
                for t in trajectories
                if day_offset in t["data"]
            ]
            if returns_at_day:
                avg_return = statistics.mean(returns_at_day)
                std_dev = (
                    statistics.stdev(returns_at_day) if len(returns_at_day) > 1 else 0
                )
                avg_trajectory.append(
                    {
                        "day": day_offset,
                        "avg_return": round(avg_return, 3),
                        "std_dev": round(std_dev, 3),
                        "upper_band": round(avg_return + std_dev, 3),
                        "lower_band": round(avg_return - std_dev, 3),
                        "occurrences": len(returns_at_day),
                    }
                )

        return {
            "has_data": True,
            "trajectory": avg_trajectory,
            "years_analyzed": len(trajectories),
            "yearly_trajectories": trajectories,
        }

    @staticmethod
    def get_upcoming_events_alerts(
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        alert_days: int = 30,
    ) -> List[Dict]:
        """
        Generate alerts for upcoming events within alert_days

        Args:
            events: List of events with name, month, day
            alert_days: Number of days ahead to look for events

        Returns:
            List of upcoming event alerts with historical context
        """
        today = date.today()
        current_year = today.year
        alerts = []

        for event in events:
            # Check this year and next year
            for year_offset in [0, 1]:
                try:
                    event_date = date(
                        current_year + year_offset, event["month"], event["day"]
                    )
                except ValueError:
                    continue

                days_until = (event_date - today).days

                if 0 < days_until <= alert_days:
                    # Get historical performance
                    performance = (
                        MetalsPriceService.calculate_historical_event_performance(
                            db,
                            event["month"],
                            event["day"],
                            metal,
                            currency,
                            years_back,
                            10,
                            10,
                        )
                    )

                    if performance.get("has_data"):
                        alert_type = (
                            "opportunity"
                            if performance["avg_change_7d"] > 0
                            else "caution"
                        )

                        # Generate alert message
                        if performance["avg_change_7d"] > 0:
                            message = f"{event['name']} in {days_until} days. Historical data suggests accumulation phase. Avg gain: +{performance['avg_change_7d']:.1f}%"
                        else:
                            message = f"{event['name']} in {days_until} days. Historical data shows weakness. Avg change: {performance['avg_change_7d']:.1f}%"

                        alerts.append(
                            {
                                "event_name": event["name"],
                                "event_type": event.get("type", "custom"),
                                "event_date": event_date.isoformat(),
                                "days_until": days_until,
                                "alert_type": alert_type,
                                "message": message,
                                "avg_change": performance["avg_change_7d"],
                                "win_rate": performance["win_rate"],
                                "best_return": performance["best_return"],
                                "worst_return": performance["worst_return"],
                                "occurrences": performance["occurrences"],
                            }
                        )
                    break  # Only add once per event

        # Sort by days until event
        alerts.sort(key=lambda x: x["days_until"])
        return alerts

    @staticmethod
    def get_volatility_analysis(
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> Dict:
        """
        Analyze volatility changes around an event

        Returns:
            Dictionary with volatility metrics before, during, and after event
        """
        current_year = date.today().year
        volatility_data = []

        for i in range(years_back):
            year = current_year - i - 1
            try:
                event_date = date(year, event_month, event_day)
            except ValueError:
                continue

            # Get prices for different periods
            # Normal period: 30 days before the pre-event period
            normal_start = event_date - timedelta(days=40)
            normal_end = event_date - timedelta(days=11)

            # Pre-event: 10 days before
            pre_start = event_date - timedelta(days=10)
            pre_end = event_date - timedelta(days=1)

            # Event week: event day +/- 3 days
            event_start = event_date - timedelta(days=3)
            event_end = event_date + timedelta(days=3)

            # Post-event: 10 days after
            post_start = event_date + timedelta(days=1)
            post_end = event_date + timedelta(days=10)

            normal_prices = MetalsPriceService.get_price_range(
                db, normal_start, normal_end, metal, currency
            )
            pre_prices = MetalsPriceService.get_price_range(
                db, pre_start, pre_end, metal, currency
            )
            event_prices = MetalsPriceService.get_price_range(
                db, event_start, event_end, metal, currency
            )
            post_prices = MetalsPriceService.get_price_range(
                db, post_start, post_end, metal, currency
            )

            # Calculate daily returns for volatility
            def calc_volatility(prices):
                if len(prices) < 2:
                    return None
                returns = []
                for i in range(1, len(prices)):
                    ret = (
                        (prices[i]["price"] - prices[i - 1]["price"])
                        / prices[i - 1]["price"]
                    ) * 100
                    returns.append(ret)
                return statistics.stdev(returns) if len(returns) > 1 else 0

            normal_vol = calc_volatility(normal_prices)
            pre_vol = calc_volatility(pre_prices)
            event_vol = calc_volatility(event_prices)
            post_vol = calc_volatility(post_prices)

            if all(v is not None for v in [normal_vol, pre_vol, event_vol, post_vol]):
                volatility_data.append(
                    {
                        "year": year,
                        "normal_volatility": normal_vol,
                        "pre_event_volatility": pre_vol,
                        "event_week_volatility": event_vol,
                        "post_event_volatility": post_vol,
                    }
                )

        if not volatility_data:
            return {"has_data": False, "error": "Insufficient data"}

        # Calculate averages
        avg_normal = statistics.mean([d["normal_volatility"] for d in volatility_data])
        avg_pre = statistics.mean([d["pre_event_volatility"] for d in volatility_data])
        avg_event = statistics.mean(
            [d["event_week_volatility"] for d in volatility_data]
        )
        avg_post = statistics.mean(
            [d["post_event_volatility"] for d in volatility_data]
        )

        # Calculate volatility increase percentages
        pre_increase = (
            ((avg_pre - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0
        )
        event_increase = (
            ((avg_event - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0
        )
        post_increase = (
            ((avg_post - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0
        )

        return {
            "has_data": True,
            "avg_normal_volatility": round(avg_normal, 3),
            "avg_pre_event_volatility": round(avg_pre, 3),
            "avg_event_week_volatility": round(avg_event, 3),
            "avg_post_event_volatility": round(avg_post, 3),
            "pre_event_volatility_increase_pct": round(pre_increase, 1),
            "event_week_volatility_increase_pct": round(event_increase, 1),
            "post_event_volatility_increase_pct": round(post_increase, 1),
            "years_analyzed": len(volatility_data),
        }

    @staticmethod
    def compare_events(
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> List[Dict]:
        """
        Compare multiple events side-by-side

        Args:
            events: List of events with name, month, day

        Returns:
            List of event comparisons with all metrics
        """
        comparisons = []

        for event in events:
            performance = MetalsPriceService.calculate_historical_event_performance(
                db, event["month"], event["day"], metal, currency, years_back, 10, 10
            )

            volatility = MetalsPriceService.get_volatility_analysis(
                db, event["month"], event["day"], metal, currency, years_back
            )

            if performance.get("has_data"):
                comparisons.append(
                    {
                        "name": event["name"],
                        "event_type": event.get("type", "custom"),
                        "month": event["month"],
                        "day": event["day"],
                        "avg_return_10d": performance["avg_change_7d"],
                        "win_rate": performance["win_rate"],
                        "best_return": performance["best_return"],
                        "worst_return": performance["worst_return"],
                        "avg_volatility": performance["avg_volatility"],
                        "volatility_increase_pct": volatility.get(
                            "event_week_volatility_increase_pct", 0
                        )
                        if volatility.get("has_data")
                        else 0,
                        "occurrences": performance["occurrences"],
                    }
                )

        # Sort by average return descending
        comparisons.sort(key=lambda x: x["avg_return_10d"], reverse=True)
        return comparisons

    @staticmethod
    def get_multi_metal_seasonality(
        db: Session, currency: str = "INR", years_back: int = 10
    ) -> Dict[str, List[Dict]]:
        """
        Get monthly seasonality for all metals for comparison

        Returns:
            Dictionary with metal name as key and monthly data as value
        """
        metals = ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"]
        result = {}

        for metal in metals:
            result[metal] = MetalsPriceService.get_monthly_seasonality(
                db, metal, currency, years_back
            )

        return result
