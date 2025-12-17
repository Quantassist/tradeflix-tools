"""
Optimized Metals price service using pandas for vectorized operations
"""

from typing import List, Dict, Optional
from datetime import date
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import logging

from models.metals import MetalsPriceSpot

logger = logging.getLogger(__name__)


class MetalsPriceServiceOptimized:
    """Optimized service for fetching metals prices and calculating seasonal analysis using pandas"""

    METAL_COLUMNS = {
        "GOLD": ("gold_usd", "gold_inr"),
        "SILVER": ("silver_usd", "silver_inr"),
        "PLATINUM": ("platinum_usd", "platinum_inr"),
        "PALLADIUM": ("palladium_usd", "palladium_inr"),
    }

    # In-memory cache for dataframes (cleared on restart)
    _df_cache: Dict[str, pd.DataFrame] = {}
    _cache_timestamp: Optional[date] = None

    @classmethod
    def _get_full_dataframe(
        cls, db: Session, force_refresh: bool = False
    ) -> pd.DataFrame:
        """
        Load all price data into a pandas DataFrame (cached in memory).
        This is the key optimization - load once, compute many times.
        """
        today = date.today()

        # Check if cache is valid (same day)
        if (
            not force_refresh
            and cls._cache_timestamp == today
            and "full_df" in cls._df_cache
        ):
            return cls._df_cache["full_df"]

        logger.info("Loading full price data into pandas DataFrame...")

        # Query all data at once
        prices = db.query(MetalsPriceSpot).order_by(MetalsPriceSpot.date).all()

        if not prices:
            return pd.DataFrame()

        # Convert to DataFrame
        data = []
        for p in prices:
            data.append(
                {
                    "date": p.date,
                    "usd_inr_rate": float(p.usd_inr_rate) if p.usd_inr_rate else None,
                    "gold_usd": float(p.gold_usd) if p.gold_usd else None,
                    "gold_inr": float(p.gold_inr) if p.gold_inr else None,
                    "silver_usd": float(p.silver_usd) if p.silver_usd else None,
                    "silver_inr": float(p.silver_inr) if p.silver_inr else None,
                    "platinum_usd": float(p.platinum_usd) if p.platinum_usd else None,
                    "platinum_inr": float(p.platinum_inr) if p.platinum_inr else None,
                    "palladium_usd": float(p.palladium_usd)
                    if p.palladium_usd
                    else None,
                    "palladium_inr": float(p.palladium_inr)
                    if p.palladium_inr
                    else None,
                }
            )

        df = pd.DataFrame(data)
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

        # Pre-compute daily returns for all metals
        for metal in ["gold", "silver", "platinum", "palladium"]:
            for currency in ["usd", "inr"]:
                col = f"{metal}_{currency}"
                if col in df.columns:
                    df[f"{col}_return"] = df[col].pct_change() * 100

        # Add month and day columns for easy filtering
        df["month"] = df.index.month
        df["day"] = df.index.day
        df["year"] = df.index.year

        # Cache the dataframe
        cls._df_cache["full_df"] = df
        cls._cache_timestamp = today

        logger.info(f"Loaded {len(df)} price records into DataFrame")
        return df

    @classmethod
    def get_price_column(cls, metal: str, currency: str) -> str:
        """Get the column name for a metal/currency combination"""
        return f"{metal.lower()}_{currency.lower()}"

    @classmethod
    def get_data_stats(cls, db: Session) -> Dict:
        """Get statistics about available data"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"min_date": None, "max_date": None, "total_records": 0}

        return {
            "min_date": df.index.min().date().isoformat(),
            "max_date": df.index.max().date().isoformat(),
            "total_records": len(df),
        }

    @classmethod
    def get_price_range(
        cls,
        db: Session,
        start_date: date,
        end_date: date,
        metal: str = "GOLD",
        currency: str = "INR",
    ) -> List[Dict]:
        """Get prices for a date range using pandas"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return []

        # Filter by date range
        mask = (df.index >= pd.Timestamp(start_date)) & (
            df.index <= pd.Timestamp(end_date)
        )
        filtered = df.loc[mask, [col, "usd_inr_rate"]].dropna(subset=[col])

        return [
            {
                "date": idx.date().isoformat(),
                "price": row[col],
                "usd_inr_rate": row["usd_inr_rate"],
            }
            for idx, row in filtered.iterrows()
        ]

    @classmethod
    def get_monthly_seasonality(
        cls,
        db: Session,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: float = 10,
    ) -> List[Dict]:
        """Calculate monthly seasonality using pandas groupby - much faster"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        return_col = f"{col}_return"

        if return_col not in df.columns:
            return []

        # Filter by date (supports fractional years like 0.5 for 6 months)
        from datetime import timedelta

        cutoff_date = date.today() - timedelta(days=int(years_back * 365))
        # Note: 'date' is the index, not a column
        df_filtered = df[df.index >= pd.Timestamp(cutoff_date)].copy()

        if df_filtered.empty:
            return []

        # Get unique year-month combinations in the filtered data
        df_filtered["year_month"] = df_filtered.index.to_period("M")
        unique_periods = df_filtered["year_month"].unique()

        # Calculate monthly returns (first to last price of each month)
        monthly_returns = []
        for period in unique_periods:
            month_data = df_filtered[df_filtered["year_month"] == period][col].dropna()
            if len(month_data) >= 2:
                first_price = month_data.iloc[0]
                last_price = month_data.iloc[-1]
                ret = ((last_price - first_price) / first_price) * 100
                monthly_returns.append(
                    {"month": period.month, "year": period.year, "return": ret}
                )

        if not monthly_returns:
            return []

        returns_df = pd.DataFrame(monthly_returns)

        # Group by month and calculate statistics
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
            month_data = returns_df[returns_df["month"] == month]["return"]
            if len(month_data) > 0:
                positive_count = (month_data > 0).sum()
                result.append(
                    {
                        "month": month,
                        "month_name": month_names[month - 1],
                        "avg_return": round(month_data.mean(), 3),
                        "median_return": round(month_data.median(), 3),
                        "std_dev": round(month_data.std(), 3)
                        if len(month_data) > 1
                        else 0,
                        "win_rate": round((positive_count / len(month_data)) * 100, 2),
                        "best_return": round(month_data.max(), 3),
                        "worst_return": round(month_data.min(), 3),
                        "occurrences": len(month_data),
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

    @classmethod
    def calculate_historical_event_performance(
        cls,
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """Calculate historical performance for an event using pandas - vectorized"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        current_year = date.today().year
        yearly_data = []

        # Convert float years_back to int for iteration (minimum 1 year for event analysis)
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1
        for i in range(years_to_analyze):
            year = current_year - i - 1
            try:
                event_date = pd.Timestamp(date(year, event_month, event_day))
            except ValueError:
                try:
                    event_date = pd.Timestamp(date(year, event_month, 28))
                except ValueError:
                    continue

            start_date = event_date - pd.Timedelta(days=days_before)
            end_date = event_date + pd.Timedelta(days=days_after)

            # Get data for full period
            mask = (df.index >= start_date) & (df.index <= end_date)
            period_data = df.loc[mask, col].dropna()

            if len(period_data) < 3:
                continue

            # Get pre-event data (start to event date)
            pre_mask = (df.index >= start_date) & (df.index <= event_date)
            pre_data = df.loc[pre_mask, col].dropna()

            # Get post-event data (event date to end)
            post_mask = (df.index >= event_date) & (df.index <= end_date)
            post_data = df.loc[post_mask, col].dropna()

            first_price = period_data.iloc[0]
            last_price = period_data.iloc[-1]
            change = ((last_price - first_price) / first_price) * 100
            max_price = period_data.max()
            min_price = period_data.min()

            # Get event day price (last price in pre_data)
            event_day_price = pre_data.iloc[-1] if len(pre_data) >= 1 else first_price

            # Calculate pre-event change: how much price changed leading up to event
            # Using event day price as base: (event_price - start_price) / event_price
            pre_change = 0.0
            if len(pre_data) >= 2:
                start_price = pre_data.iloc[0]
                pre_change = ((event_day_price - start_price) / event_day_price) * 100

            # Calculate post-event change: how much price changed after the event
            # Using event day price as base: (end_price - event_price) / event_price
            post_change = 0.0
            if len(post_data) >= 2:
                end_price = post_data.iloc[-1]
                post_change = ((end_price - event_day_price) / event_day_price) * 100

            yearly_data.append(
                {
                    "year": year,
                    "event_date": event_date.date().isoformat(),
                    "change_7d": round(change, 3),
                    "pre_event_change": round(pre_change, 3),
                    "post_event_change": round(post_change, 3),
                    "max_gain": round(
                        ((max_price - first_price) / first_price) * 100, 3
                    ),
                    "max_loss": round(
                        ((min_price - first_price) / first_price) * 100, 3
                    ),
                    "volatility": round(period_data.std(), 2),
                    "avg_price_before": round(first_price, 2),
                    "avg_price_after": round(last_price, 2),
                }
            )

        if not yearly_data:
            return {"has_data": False, "error": "No historical data available"}

        # Calculate aggregate metrics using numpy for speed
        changes = np.array([d["change_7d"] for d in yearly_data])
        max_gains = np.array([d["max_gain"] for d in yearly_data])
        max_losses = np.array([d["max_loss"] for d in yearly_data])
        volatilities = np.array([d["volatility"] for d in yearly_data])

        positive_years = np.sum(changes > 0)
        win_rate = (positive_years / len(changes)) * 100

        return {
            "has_data": True,
            "occurrences": len(yearly_data),
            "avg_change_7d": round(float(np.mean(changes)), 3),
            "median_change_7d": round(float(np.median(changes)), 3),
            "std_dev": round(float(np.std(changes)), 3) if len(changes) > 1 else 0,
            "avg_max_gain": round(float(np.mean(max_gains)), 3),
            "avg_max_loss": round(float(np.mean(max_losses)), 3),
            "avg_volatility": round(float(np.mean(volatilities)), 2),
            "win_rate": round(win_rate, 2),
            "best_return": round(float(np.max(changes)), 3),
            "worst_return": round(float(np.min(changes)), 3),
            "best_year": yearly_data[int(np.argmax(changes))]["year"],
            "worst_year": yearly_data[int(np.argmin(changes))]["year"],
            "yearly_data": yearly_data,
        }

    @classmethod
    def calculate_lunar_event_performance(
        cls,
        db: Session,
        event_dates: List[date],
        metal: str = "GOLD",
        currency: str = "INR",
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """
        Calculate historical performance for lunar-based events using actual dates.
        This method uses the actual event dates from the database instead of fixed month/day.
        """
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        yearly_data = []

        for event_date in event_dates:
            event_ts = pd.Timestamp(event_date)
            start_date = event_ts - pd.Timedelta(days=days_before)
            end_date = event_ts + pd.Timedelta(days=days_after)

            # Get data for full period
            mask = (df.index >= start_date) & (df.index <= end_date)
            period_data = df.loc[mask, col].dropna()

            if len(period_data) < 3:
                continue

            # Get pre-event data (start to event date)
            pre_mask = (df.index >= start_date) & (df.index <= event_ts)
            pre_data = df.loc[pre_mask, col].dropna()

            # Get post-event data (event date to end)
            post_mask = (df.index >= event_ts) & (df.index <= end_date)
            post_data = df.loc[post_mask, col].dropna()

            first_price = period_data.iloc[0]
            last_price = period_data.iloc[-1]
            change = ((last_price - first_price) / first_price) * 100
            max_price = period_data.max()
            min_price = period_data.min()

            # Get event day price (last price in pre_data)
            event_day_price = pre_data.iloc[-1] if len(pre_data) >= 1 else first_price

            # Calculate pre-event change: how much price changed leading up to event
            # Using event day price as base: (event_price - start_price) / event_price
            pre_change = 0.0
            if len(pre_data) >= 2:
                start_price = pre_data.iloc[0]
                pre_change = ((event_day_price - start_price) / event_day_price) * 100

            # Calculate post-event change: how much price changed after the event
            # Using event day price as base: (end_price - event_price) / event_price
            post_change = 0.0
            if len(post_data) >= 2:
                end_price = post_data.iloc[-1]
                post_change = ((end_price - event_day_price) / event_day_price) * 100

            yearly_data.append(
                {
                    "year": event_date.year,
                    "event_date": event_date.isoformat(),
                    "change_7d": round(change, 3),
                    "pre_event_change": round(pre_change, 3),
                    "post_event_change": round(post_change, 3),
                    "max_gain": round(
                        ((max_price - first_price) / first_price) * 100, 3
                    ),
                    "max_loss": round(
                        ((min_price - first_price) / first_price) * 100, 3
                    ),
                    "volatility": round(period_data.std(), 2),
                    "avg_price_before": round(first_price, 2),
                    "avg_price_after": round(last_price, 2),
                }
            )

        if not yearly_data:
            return {"has_data": False, "error": "No historical data available"}

        # Calculate aggregate metrics using numpy for speed
        changes = np.array([d["change_7d"] for d in yearly_data])
        max_gains = np.array([d["max_gain"] for d in yearly_data])
        max_losses = np.array([d["max_loss"] for d in yearly_data])
        volatilities = np.array([d["volatility"] for d in yearly_data])

        positive_years = np.sum(changes > 0)
        win_rate = (positive_years / len(changes)) * 100

        return {
            "has_data": True,
            "occurrences": len(yearly_data),
            "avg_change_7d": round(float(np.mean(changes)), 3),
            "median_change_7d": round(float(np.median(changes)), 3),
            "std_dev": round(float(np.std(changes)), 3) if len(changes) > 1 else 0,
            "avg_max_gain": round(float(np.mean(max_gains)), 3),
            "avg_max_loss": round(float(np.mean(max_losses)), 3),
            "avg_volatility": round(float(np.mean(volatilities)), 2),
            "win_rate": round(win_rate, 2),
            "best_return": round(float(np.max(changes)), 3),
            "worst_return": round(float(np.min(changes)), 3),
            "best_year": yearly_data[int(np.argmax(changes))]["year"],
            "worst_year": yearly_data[int(np.argmin(changes))]["year"],
            "yearly_data": yearly_data,
        }

    @classmethod
    def get_event_trajectory(
        cls,
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        days_before: int = 10,
        days_after: int = 10,
    ) -> Dict:
        """Calculate event trajectory using pandas - vectorized operations"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        current_year = date.today().year
        all_trajectories = []

        # Convert float years_back to int for iteration (minimum 1 year for trajectory analysis)
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1
        for i in range(years_to_analyze):
            year = current_year - i - 1
            try:
                event_date = pd.Timestamp(date(year, event_month, event_day))
            except ValueError:
                continue

            start_date = event_date - pd.Timedelta(days=days_before)
            end_date = event_date + pd.Timedelta(days=days_after)

            mask = (df.index >= start_date) & (df.index <= end_date)
            period_data = df.loc[mask, col].dropna()

            if len(period_data) < 5:
                continue

            base_price = period_data.iloc[0]
            trajectory = {}

            for idx, price in period_data.items():
                day_offset = (idx.date() - event_date.date()).days
                if -days_before <= day_offset <= days_after:
                    trajectory[day_offset] = ((price - base_price) / base_price) * 100

            if trajectory:
                all_trajectories.append({"year": year, "data": trajectory})

        if not all_trajectories:
            return {"has_data": False, "error": "No historical data available"}

        # Calculate average trajectory using numpy
        avg_trajectory = []
        for day_offset in range(-days_before, days_after + 1):
            returns_at_day = [
                t["data"].get(day_offset)
                for t in all_trajectories
                if day_offset in t["data"]
            ]
            if returns_at_day:
                returns_arr = np.array(returns_at_day)
                avg_return = float(np.mean(returns_arr))
                std_dev = float(np.std(returns_arr)) if len(returns_arr) > 1 else 0
                avg_trajectory.append(
                    {
                        "day": day_offset,
                        "avg_return": round(avg_return, 3),
                        "std_dev": round(std_dev, 3),
                        "upper_band": round(avg_return + std_dev, 3),
                        "lower_band": round(avg_return - std_dev, 3),
                        "occurrences": len(returns_arr),
                    }
                )

        return {
            "has_data": True,
            "trajectory": avg_trajectory,
            "years_analyzed": len(all_trajectories),
        }

    @classmethod
    def get_upcoming_events_alerts(
        cls,
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
        alert_days: int = 30,
    ) -> List[Dict]:
        """Generate alerts for upcoming events - uses cached performance data"""
        today = date.today()
        current_year = today.year
        alerts = []

        for event in events:
            for year_offset in [0, 1]:
                try:
                    event_date = date(
                        current_year + year_offset, event["month"], event["day"]
                    )
                except ValueError:
                    continue

                days_until = (event_date - today).days

                if 0 < days_until <= alert_days:
                    performance = cls.calculate_historical_event_performance(
                        db,
                        event["month"],
                        event["day"],
                        metal,
                        currency,
                        years_back,
                        10,
                        10,
                    )

                    if performance.get("has_data"):
                        alert_type = (
                            "opportunity"
                            if performance["avg_change_7d"] > 0
                            else "caution"
                        )

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
                    break

        alerts.sort(key=lambda x: x["days_until"])
        return alerts

    @classmethod
    def get_volatility_analysis(
        cls,
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> Dict:
        """Analyze volatility around an event using pandas"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        return_col = f"{col}_return"

        if return_col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        current_year = date.today().year
        volatility_data = []

        # Convert float years_back to int for iteration (minimum 1 year for volatility analysis)
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1
        for i in range(years_to_analyze):
            year = current_year - i - 1
            try:
                event_date = pd.Timestamp(date(year, event_month, event_day))
            except ValueError:
                continue

            # Define periods
            normal_start = event_date - pd.Timedelta(days=40)
            normal_end = event_date - pd.Timedelta(days=11)
            pre_start = event_date - pd.Timedelta(days=10)
            pre_end = event_date - pd.Timedelta(days=1)
            event_start = event_date - pd.Timedelta(days=3)
            event_end = event_date + pd.Timedelta(days=3)
            post_start = event_date + pd.Timedelta(days=1)
            post_end = event_date + pd.Timedelta(days=10)

            # Get returns for each period
            def get_volatility(start, end):
                mask = (df.index >= start) & (df.index <= end)
                returns = df.loc[mask, return_col].dropna()
                return returns.std() if len(returns) > 1 else None

            normal_vol = get_volatility(normal_start, normal_end)
            pre_vol = get_volatility(pre_start, pre_end)
            event_vol = get_volatility(event_start, event_end)
            post_vol = get_volatility(post_start, post_end)

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

        # Calculate averages using numpy
        vol_df = pd.DataFrame(volatility_data)
        avg_normal = vol_df["normal_volatility"].mean()
        avg_pre = vol_df["pre_event_volatility"].mean()
        avg_event = vol_df["event_week_volatility"].mean()
        avg_post = vol_df["post_event_volatility"].mean()

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

    @classmethod
    def compare_events(
        cls,
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> List[Dict]:
        """Compare multiple events - batch processing for efficiency"""
        comparisons = []

        # Pre-load data once
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        for event in events:
            performance = cls.calculate_historical_event_performance(
                db, event["month"], event["day"], metal, currency, years_back, 10, 10
            )

            volatility = cls.get_volatility_analysis(
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

        comparisons.sort(key=lambda x: x["avg_return_10d"], reverse=True)
        return comparisons

    @classmethod
    def get_multi_metal_seasonality(
        cls, db: Session, currency: str = "INR", years_back: int = 10
    ) -> Dict[str, List[Dict]]:
        """Get monthly seasonality for all metals"""
        metals = ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"]
        result = {}

        for metal in metals:
            result[metal] = cls.get_monthly_seasonality(db, metal, currency, years_back)

        return result

    @classmethod
    def get_daily_calendar_heatmap(
        cls,
        db: Session,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> List[Dict]:
        """
        Get daily calendar heatmap data - average returns for each day of the year.
        Returns 365/366 data points, one for each calendar day.
        """
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        # Get price column
        usd_col, inr_col = cls.METAL_COLUMNS.get(
            metal.upper(), ("gold_usd", "gold_inr")
        )
        price_col = inr_col if currency.upper() == "INR" else usd_col

        # Filter by years - note: date is the index, not a column
        cutoff_date = pd.Timestamp.now() - pd.DateOffset(years=years_back)
        df_filtered = df[df.index >= cutoff_date].copy()

        if df_filtered.empty:
            return []

        # Calculate daily returns - sort by index (date)
        df_filtered = df_filtered.sort_index()
        df_filtered["return"] = df_filtered[price_col].pct_change() * 100

        # month and day columns already exist from _get_full_dataframe

        # Group by month and day
        heatmap_data = []
        for (month, day), group in df_filtered.groupby(["month", "day"]):
            returns = group["return"].dropna()
            if len(returns) > 0:
                heatmap_data.append(
                    {
                        "month": int(month),
                        "day": int(day),
                        "avg_return": round(float(returns.mean()), 4),
                        "win_rate": round(
                            float((returns > 0).sum() / len(returns) * 100), 1
                        ),
                        "occurrences": len(returns),
                        "best_return": round(float(returns.max()), 2),
                        "worst_return": round(float(returns.min()), 2),
                    }
                )

        # Sort by month and day
        heatmap_data.sort(key=lambda x: (x["month"], x["day"]))
        return heatmap_data

    @classmethod
    def clear_cache(cls):
        """Clear the in-memory cache"""
        cls._df_cache.clear()
        cls._cache_timestamp = None
        logger.info("Cache cleared")
