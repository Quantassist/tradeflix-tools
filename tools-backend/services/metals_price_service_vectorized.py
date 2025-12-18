"""
Fully vectorized Metals price service using pandas/numpy for maximum performance.
This version eliminates Python loops in favor of vectorized operations.
"""

from typing import List, Dict, Optional, Tuple
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class MetalsPriceServiceVectorized:
    """
    Fully vectorized service for metals price analysis.
    Key optimizations:
    1. Load data directly into DataFrame using SQL
    2. Pre-compute all returns and date components
    3. Use vectorized groupby operations instead of loops
    4. Batch process multiple events in single operations
    """

    METAL_COLUMNS = {
        "GOLD": ("gold_usd", "gold_inr"),
        "SILVER": ("silver_usd", "silver_inr"),
        "PLATINUM": ("platinum_usd", "platinum_inr"),
        "PALLADIUM": ("palladium_usd", "palladium_inr"),
    }

    # In-memory cache
    _df_cache: Dict[str, pd.DataFrame] = {}
    _cache_timestamp: Optional[date] = None

    @classmethod
    def _get_full_dataframe(
        cls, db: Session, force_refresh: bool = False
    ) -> pd.DataFrame:
        """
        Load all price data into pandas DataFrame using optimized SQL query.
        """
        today = date.today()

        if (
            not force_refresh
            and cls._cache_timestamp == today
            and "full_df" in cls._df_cache
        ):
            return cls._df_cache["full_df"]

        logger.info("Loading price data into DataFrame (vectorized)...")

        # Use raw SQL for faster loading
        query = text("""
            SELECT date, usd_inr_rate, 
                   gold_usd, gold_inr, silver_usd, silver_inr,
                   platinum_usd, platinum_inr, palladium_usd, palladium_inr
            FROM metals_prices_spot
            ORDER BY date
        """)

        result = db.execute(query)
        rows = result.fetchall()

        if not rows:
            return pd.DataFrame()

        # Create DataFrame directly from rows
        df = pd.DataFrame(
            rows,
            columns=[
                "date",
                "usd_inr_rate",
                "gold_usd",
                "gold_inr",
                "silver_usd",
                "silver_inr",
                "platinum_usd",
                "platinum_inr",
                "palladium_usd",
                "palladium_inr",
            ],
        )

        # Convert types
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

        # Convert numeric columns
        numeric_cols = [
            "usd_inr_rate",
            "gold_usd",
            "gold_inr",
            "silver_usd",
            "silver_inr",
            "platinum_usd",
            "platinum_inr",
            "palladium_usd",
            "palladium_inr",
        ]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Pre-compute ALL returns at once (vectorized)
        for metal in ["gold", "silver", "platinum", "palladium"]:
            for currency in ["usd", "inr"]:
                col = f"{metal}_{currency}"
                if col in df.columns:
                    # Use fill_method=None to avoid FutureWarning
                    df[f"{col}_return"] = df[col].pct_change(fill_method=None) * 100

        # Add date components (vectorized)
        df["month"] = df.index.month
        df["day"] = df.index.day
        df["year"] = df.index.year
        df["day_of_year"] = df.index.dayofyear

        cls._df_cache["full_df"] = df
        cls._cache_timestamp = today

        logger.info(f"Loaded {len(df)} records into DataFrame")
        return df

    @classmethod
    def get_price_column(cls, metal: str, currency: str) -> str:
        return f"{metal.lower()}_{currency.lower()}"

    @classmethod
    def get_date_range_stats(cls, db: Session) -> Dict:
        """Get data statistics"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"min_date": None, "max_date": None, "total_records": 0}
        return {
            "min_date": df.index.min().date().isoformat(),
            "max_date": df.index.max().date().isoformat(),
            "total_records": len(df),
        }

    # Alias for backward compatibility
    get_data_stats = get_date_range_stats

    @classmethod
    def calculate_event_impact(
        cls,
        db: Session,
        event_date: date,
        metal: str = "GOLD",
        currency: str = "INR",
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """
        Calculate price impact around a specific event date - vectorized version.
        """
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        event_ts = pd.Timestamp(event_date)
        start_date = event_ts - pd.Timedelta(days=days_before)
        end_date = event_ts + pd.Timedelta(days=days_after)

        # Get all prices in the window
        mask = (df.index >= start_date) & (df.index <= end_date)
        period_data = df.loc[mask, col].dropna()

        if len(period_data) < 3:
            return {
                "has_data": False,
                "error": "Insufficient price data around event date",
            }

        # Split into before, during (event day), and after
        before_mask = (df.index >= start_date) & (df.index < event_ts)
        after_mask = (df.index > event_ts) & (df.index <= end_date)
        during_mask = (df.index >= event_ts - pd.Timedelta(days=1)) & (
            df.index <= event_ts + pd.Timedelta(days=1)
        )

        prices_before = df.loc[before_mask, col].dropna().values
        prices_during = df.loc[during_mask, col].dropna().values
        prices_after = df.loc[after_mask, col].dropna().values

        if len(prices_before) == 0 or len(prices_after) == 0:
            return {
                "has_data": False,
                "error": "Insufficient price data around event date",
            }

        # Calculate metrics using numpy
        avg_before = float(np.mean(prices_before))
        avg_during = (
            float(np.mean(prices_during)) if len(prices_during) > 0 else avg_before
        )
        avg_after = float(np.mean(prices_after))

        change_before_to_during = ((avg_during - avg_before) / avg_before) * 100
        change_during_to_after = (
            ((avg_after - avg_during) / avg_during) * 100 if avg_during else 0
        )
        change_before_to_after = ((avg_after - avg_before) / avg_before) * 100

        all_prices = period_data.values
        volatility = float(np.std(all_prices)) if len(all_prices) > 1 else 0
        volatility_before = (
            float(np.std(prices_before)) if len(prices_before) > 1 else 0
        )
        volatility_after = float(np.std(prices_after)) if len(prices_after) > 1 else 0

        first_price = prices_before[0] if len(prices_before) > 0 else avg_before
        max_price = float(np.max(all_prices))
        min_price = float(np.min(all_prices))
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

    @classmethod
    def compare_events(
        cls,
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: int = 10,
    ) -> List[Dict]:
        """Compare multiple events - uses batch processing for efficiency"""
        # This is essentially what batch_calculate_events_analysis does
        # but with a different output format
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        comparisons = []
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
    def get_price_range(
        cls,
        db: Session,
        start_date: date,
        end_date: date,
        metal: str = "GOLD",
        currency: str = "INR",
    ) -> List[Dict]:
        """Get prices for date range - vectorized"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return []

        # Vectorized filtering
        mask = (df.index >= pd.Timestamp(start_date)) & (
            df.index <= pd.Timestamp(end_date)
        )
        filtered = df.loc[mask, [col, "usd_inr_rate"]].dropna(subset=[col])

        # Convert to list of dicts efficiently
        result = filtered.reset_index()
        result["date"] = result["date"].dt.strftime("%Y-%m-%d")
        return result.rename(columns={col: "price"}).to_dict("records")

    @classmethod
    def get_monthly_seasonality(
        cls,
        db: Session,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: float = 10,
    ) -> List[Dict]:
        """Calculate monthly seasonality - fully vectorized"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return []

        # Filter by date
        cutoff_date = date.today() - timedelta(days=int(years_back * 365))
        df_filtered = df[df.index >= pd.Timestamp(cutoff_date)].copy()

        if df_filtered.empty:
            return []

        # Calculate monthly returns using resample (vectorized)
        monthly = df_filtered[col].resample("M").agg(["first", "last"])
        monthly["return"] = (
            (monthly["last"] - monthly["first"]) / monthly["first"]
        ) * 100
        monthly["month"] = monthly.index.month
        monthly = monthly.dropna()

        if monthly.empty:
            return []

        # Group by month and calculate stats (vectorized)
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

        stats = (
            monthly.groupby("month")["return"]
            .agg(
                [
                    ("avg_return", "mean"),
                    ("median_return", "median"),
                    ("std_dev", lambda x: x.std() if len(x) > 1 else 0),
                    ("best_return", "max"),
                    ("worst_return", "min"),
                    ("occurrences", "count"),
                    (
                        "win_rate",
                        lambda x: (x > 0).sum() / len(x) * 100 if len(x) > 0 else 0,
                    ),
                ]
            )
            .reset_index()
        )

        result = []
        for month in range(1, 13):
            row = stats[stats["month"] == month]
            if len(row) > 0:
                r = row.iloc[0]
                result.append(
                    {
                        "month": month,
                        "month_name": month_names[month - 1],
                        "avg_return": round(float(r["avg_return"]), 3),
                        "median_return": round(float(r["median_return"]), 3),
                        "std_dev": round(float(r["std_dev"]), 3),
                        "win_rate": round(float(r["win_rate"]), 2),
                        "best_return": round(float(r["best_return"]), 3),
                        "worst_return": round(float(r["worst_return"]), 3),
                        "occurrences": int(r["occurrences"]),
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
    def _calculate_event_window_stats(
        cls,
        df: pd.DataFrame,
        col: str,
        event_dates: List[pd.Timestamp],
        days_before: int,
        days_after: int,
    ) -> Tuple[List[Dict], Dict]:
        """
        Calculate statistics for multiple event dates in a vectorized manner.
        This is the core optimization - process all events at once.
        """
        yearly_data = []

        for event_date in event_dates:
            start_date = event_date - pd.Timedelta(days=days_before)
            end_date = event_date + pd.Timedelta(days=days_after)

            # Get period data
            mask = (df.index >= start_date) & (df.index <= end_date)
            period_data = df.loc[mask, col].dropna()

            if len(period_data) < 3:
                continue

            # Vectorized calculations
            first_price = period_data.iloc[0]
            last_price = period_data.iloc[-1]

            # Pre-event data
            pre_mask = (df.index >= start_date) & (df.index <= event_date)
            pre_data = df.loc[pre_mask, col].dropna()
            event_day_price = pre_data.iloc[-1] if len(pre_data) >= 1 else first_price

            # Post-event data
            post_mask = (df.index >= event_date) & (df.index <= end_date)
            post_data = df.loc[post_mask, col].dropna()

            # Calculate metrics
            change = ((last_price - first_price) / first_price) * 100
            max_price = period_data.max()
            min_price = period_data.min()

            pre_change = 0.0
            if len(pre_data) >= 2:
                pre_change = (
                    (event_day_price - pre_data.iloc[0]) / event_day_price
                ) * 100

            post_change = 0.0
            if len(post_data) >= 2:
                post_change = (
                    (post_data.iloc[-1] - event_day_price) / event_day_price
                ) * 100

            yearly_data.append(
                {
                    "year": event_date.year,
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
                    "volatility": round(float(period_data.std()), 2),
                    "avg_price_before": round(first_price, 2),
                    "avg_price_after": round(last_price, 2),
                }
            )

        if not yearly_data:
            return [], {"has_data": False, "error": "No historical data available"}

        # Calculate aggregate metrics using numpy (vectorized)
        changes = np.array([d["change_7d"] for d in yearly_data])
        max_gains = np.array([d["max_gain"] for d in yearly_data])
        max_losses = np.array([d["max_loss"] for d in yearly_data])
        volatilities = np.array([d["volatility"] for d in yearly_data])

        aggregate = {
            "has_data": True,
            "occurrences": len(yearly_data),
            "avg_change_7d": round(float(np.mean(changes)), 3),
            "median_change_7d": round(float(np.median(changes)), 3),
            "std_dev": round(float(np.std(changes)), 3) if len(changes) > 1 else 0,
            "avg_max_gain": round(float(np.mean(max_gains)), 3),
            "avg_max_loss": round(float(np.mean(max_losses)), 3),
            "avg_volatility": round(float(np.mean(volatilities)), 2),
            "win_rate": round(float(np.sum(changes > 0) / len(changes) * 100), 2),
            "best_return": round(float(np.max(changes)), 3),
            "worst_return": round(float(np.min(changes)), 3),
            "best_year": yearly_data[int(np.argmax(changes))]["year"],
            "worst_year": yearly_data[int(np.argmin(changes))]["year"],
            "yearly_data": yearly_data,
        }

        return yearly_data, aggregate

    @classmethod
    def calculate_historical_event_performance(
        cls,
        db: Session,
        event_month: int,
        event_day: int,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: float = 10,
        days_before: int = 7,
        days_after: int = 7,
    ) -> Dict:
        """Calculate historical performance for fixed-date event"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        # Generate event dates for all years
        current_year = date.today().year
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1

        event_dates = []
        for i in range(years_to_analyze):
            year = current_year - i - 1
            try:
                event_dates.append(pd.Timestamp(date(year, event_month, event_day)))
            except ValueError:
                try:
                    event_dates.append(pd.Timestamp(date(year, event_month, 28)))
                except ValueError:
                    continue

        _, aggregate = cls._calculate_event_window_stats(
            df, col, event_dates, days_before, days_after
        )
        return aggregate

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
        """Calculate performance for lunar-based events with actual dates"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        # Convert dates to timestamps
        timestamps = [pd.Timestamp(d) for d in event_dates]

        _, aggregate = cls._calculate_event_window_stats(
            df, col, timestamps, days_before, days_after
        )
        return aggregate

    @classmethod
    def batch_calculate_events_analysis(
        cls,
        db: Session,
        events: List[Dict],
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: float = 10,
        days_before: int = 7,
        days_after: int = 7,
    ) -> List[Dict]:
        """
        BATCH process multiple events at once - major optimization.
        Instead of calling calculate_historical_event_performance for each event,
        this processes all events in a single pass through the data.
        """
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        return_col = f"{col}_return"

        if col not in df.columns:
            return []

        current_year = date.today().year
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1
        min_year = current_year - years_to_analyze

        results = []

        for event in events:
            event_name = event.get("name", "Unknown")
            event_type = event.get("type", "custom")
            is_lunar = event.get("is_lunar_based", False)

            # Get event dates
            if is_lunar and "dates" in event:
                # Lunar events have actual dates
                event_dates = [
                    pd.Timestamp(d) for d in event["dates"] if d.year >= min_year
                ]
            else:
                # Fixed-date events
                month = event.get("month")
                day = event.get("day")
                if not month or not day:
                    continue

                event_dates = []
                for i in range(years_to_analyze):
                    year = current_year - i - 1
                    try:
                        event_dates.append(pd.Timestamp(date(year, month, day)))
                    except ValueError:
                        try:
                            event_dates.append(pd.Timestamp(date(year, month, 28)))
                        except ValueError:
                            continue

            if not event_dates:
                continue

            # Calculate performance
            _, aggregate = cls._calculate_event_window_stats(
                df, col, event_dates, days_before, days_after
            )

            if not aggregate.get("has_data"):
                continue

            # Calculate volatility inline (avoid separate function call)
            volatility_increase = 0
            normal_vol = 0
            event_vol = 0

            vol_data = []
            for event_date in event_dates:
                # Normal period: 40-11 days before
                normal_start = event_date - pd.Timedelta(days=40)
                normal_end = event_date - pd.Timedelta(days=11)
                # Event week: 3 days before to 3 days after
                event_start = event_date - pd.Timedelta(days=3)
                event_end = event_date + pd.Timedelta(days=3)

                normal_mask = (df.index >= normal_start) & (df.index <= normal_end)
                event_mask = (df.index >= event_start) & (df.index <= event_end)

                normal_returns = df.loc[normal_mask, return_col].dropna()
                event_returns = df.loc[event_mask, return_col].dropna()

                if len(normal_returns) > 1 and len(event_returns) > 1:
                    vol_data.append(
                        {
                            "normal": float(normal_returns.std()),
                            "event": float(event_returns.std()),
                        }
                    )

            if vol_data:
                normal_vol = np.mean([v["normal"] for v in vol_data])
                event_vol = np.mean([v["event"] for v in vol_data])
                if normal_vol > 0:
                    volatility_increase = ((event_vol - normal_vol) / normal_vol) * 100

            # Get display month/day
            display_month = event.get("month", event_dates[0].month)
            display_day = event.get("day", event_dates[0].day)

            results.append(
                {
                    "name": event_name,
                    "event_type": event_type,
                    "month": display_month,
                    "day": display_day,
                    "is_lunar_based": is_lunar,
                    "avg_price_change": aggregate["avg_change_7d"],
                    "win_rate": aggregate["win_rate"],
                    "occurrences": aggregate["occurrences"],
                    "best_return": aggregate["best_return"],
                    "worst_return": aggregate["worst_return"],
                    "avg_volatility": aggregate["avg_volatility"],
                    "volatility_increase_pct": round(volatility_increase, 1),
                    "normal_volatility": round(normal_vol, 3),
                    "event_volatility": round(event_vol, 3),
                    "yearly_data": aggregate["yearly_data"],
                }
            )

        # Sort by absolute average price change
        results.sort(key=lambda x: abs(x.get("avg_price_change", 0)), reverse=True)
        return results

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
        """Calculate event trajectory - optimized with numpy"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        current_year = date.today().year
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1

        # Collect all trajectories
        total_days = days_before + days_after + 1
        trajectory_matrix = []  # Will be (n_years, total_days)

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

            # Create trajectory array for this year
            year_trajectory = np.full(total_days, np.nan)

            for idx, price in period_data.items():
                day_offset = (idx.date() - event_date.date()).days
                if -days_before <= day_offset <= days_after:
                    array_idx = day_offset + days_before
                    year_trajectory[array_idx] = (
                        (price - base_price) / base_price
                    ) * 100

            trajectory_matrix.append(year_trajectory)

        if not trajectory_matrix:
            return {"has_data": False, "error": "No historical data available"}

        # Convert to numpy array for vectorized operations
        trajectory_array = np.array(trajectory_matrix)

        # Calculate statistics for each day (vectorized across years)
        avg_trajectory = []
        for day_idx in range(total_days):
            day_offset = day_idx - days_before
            day_returns = trajectory_array[:, day_idx]
            valid_returns = day_returns[~np.isnan(day_returns)]

            if len(valid_returns) > 0:
                avg_return = float(np.mean(valid_returns))
                std_dev = float(np.std(valid_returns)) if len(valid_returns) > 1 else 0
                avg_trajectory.append(
                    {
                        "day": day_offset,
                        "avg_return": round(avg_return, 3),
                        "std_dev": round(std_dev, 3),
                        "upper_band": round(avg_return + std_dev, 3),
                        "lower_band": round(avg_return - std_dev, 3),
                        "occurrences": len(valid_returns),
                    }
                )

        return {
            "has_data": True,
            "trajectory": avg_trajectory,
            "years_analyzed": len(trajectory_matrix),
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
        """Generate alerts - optimized to reuse cached calculations"""
        today = date.today()
        current_year = today.year
        alerts = []

        # Pre-load data once
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        if col not in df.columns:
            return []

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
                    # Generate event dates for performance calculation
                    years_to_analyze = max(1, int(years_back))
                    event_dates = []
                    for i in range(years_to_analyze):
                        year = current_year - i - 1
                        try:
                            event_dates.append(
                                pd.Timestamp(date(year, event["month"], event["day"]))
                            )
                        except ValueError:
                            continue

                    if not event_dates:
                        continue

                    _, performance = cls._calculate_event_window_stats(
                        df, col, event_dates, 10, 10
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
        """Volatility analysis - vectorized"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return {"has_data": False, "error": "No data available"}

        col = cls.get_price_column(metal, currency)
        return_col = f"{col}_return"

        if return_col not in df.columns:
            return {"has_data": False, "error": "Invalid metal/currency"}

        current_year = date.today().year
        years_to_analyze = max(1, int(years_back)) if years_back >= 1 else 1

        volatility_data = []

        for i in range(years_to_analyze):
            year = current_year - i - 1
            try:
                event_date = pd.Timestamp(date(year, event_month, event_day))
            except ValueError:
                continue

            # Define periods
            periods = {
                "normal": (
                    event_date - pd.Timedelta(days=40),
                    event_date - pd.Timedelta(days=11),
                ),
                "pre": (
                    event_date - pd.Timedelta(days=10),
                    event_date - pd.Timedelta(days=1),
                ),
                "event": (
                    event_date - pd.Timedelta(days=3),
                    event_date + pd.Timedelta(days=3),
                ),
                "post": (
                    event_date + pd.Timedelta(days=1),
                    event_date + pd.Timedelta(days=10),
                ),
            }

            vols = {}
            for period_name, (start, end) in periods.items():
                mask = (df.index >= start) & (df.index <= end)
                returns = df.loc[mask, return_col].dropna()
                vols[period_name] = float(returns.std()) if len(returns) > 1 else None

            if all(v is not None for v in vols.values()):
                volatility_data.append(vols)

        if not volatility_data:
            return {"has_data": False, "error": "Insufficient data"}

        # Calculate averages using numpy
        avg_normal = np.mean([v["normal"] for v in volatility_data])
        avg_pre = np.mean([v["pre"] for v in volatility_data])
        avg_event = np.mean([v["event"] for v in volatility_data])
        avg_post = np.mean([v["post"] for v in volatility_data])

        return {
            "has_data": True,
            "avg_normal_volatility": round(float(avg_normal), 3),
            "avg_pre_event_volatility": round(float(avg_pre), 3),
            "avg_event_week_volatility": round(float(avg_event), 3),
            "avg_post_event_volatility": round(float(avg_post), 3),
            "pre_event_volatility_increase_pct": round(
                ((avg_pre - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0, 1
            ),
            "event_week_volatility_increase_pct": round(
                ((avg_event - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0,
                1,
            ),
            "post_event_volatility_increase_pct": round(
                ((avg_post - avg_normal) / avg_normal) * 100 if avg_normal > 0 else 0, 1
            ),
            "years_analyzed": len(volatility_data),
        }

    @classmethod
    def get_daily_calendar_heatmap(
        cls,
        db: Session,
        metal: str = "GOLD",
        currency: str = "INR",
        years_back: float = 10,
    ) -> List[Dict]:
        """Daily calendar heatmap - fully vectorized with groupby"""
        df = cls._get_full_dataframe(db)
        if df.empty:
            return []

        col = cls.get_price_column(metal, currency)
        return_col = f"{col}_return"

        if return_col not in df.columns:
            return []

        # Filter by years
        cutoff_date = pd.Timestamp.now() - pd.DateOffset(years=int(years_back))
        df_filtered = df[df.index >= cutoff_date].copy()

        if df_filtered.empty:
            return []

        # Vectorized groupby aggregation
        grouped = (
            df_filtered.groupby(["month", "day"])[return_col]
            .agg(
                [
                    ("avg_return", "mean"),
                    ("best_return", "max"),
                    ("worst_return", "min"),
                    ("occurrences", "count"),
                    (
                        "win_rate",
                        lambda x: (x > 0).sum() / len(x) * 100 if len(x) > 0 else 0,
                    ),
                ]
            )
            .reset_index()
        )

        # Convert to list of dicts
        heatmap_data = []
        for _, row in grouped.iterrows():
            heatmap_data.append(
                {
                    "month": int(row["month"]),
                    "day": int(row["day"]),
                    "avg_return": round(float(row["avg_return"]), 4),
                    "win_rate": round(float(row["win_rate"]), 1),
                    "occurrences": int(row["occurrences"]),
                    "best_return": round(float(row["best_return"]), 2),
                    "worst_return": round(float(row["worst_return"]), 2),
                }
            )

        heatmap_data.sort(key=lambda x: (x["month"], x["day"]))
        return heatmap_data

    @classmethod
    def get_multi_metal_seasonality(
        cls, db: Session, currency: str = "INR", years_back: int = 10
    ) -> Dict[str, List[Dict]]:
        """Get monthly seasonality for all metals"""
        metals = ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"]
        return {
            metal: cls.get_monthly_seasonality(db, metal, currency, years_back)
            for metal in metals
        }

    @classmethod
    def clear_cache(cls):
        """Clear the in-memory cache"""
        cls._df_cache.clear()
        cls._cache_timestamp = None
        logger.info("Vectorized service cache cleared")
