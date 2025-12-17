"""
Seasonal trends analysis service for gold and silver
"""

from typing import List, Dict, Optional, Tuple
from datetime import date, timedelta
import statistics
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Seasonal Event Date Calculator (Database-backed)
# ============================================================================


class SeasonalEventCalculator:
    """
    Calculate dates for seasonal events across multiple years.
    Fetches event dates from the database (tradeflix_tools.seasonal_events table).
    Falls back to basic fixed-date events if database is unavailable.
    """

    # Cache for event dates fetched from DB
    _event_cache: Dict[str, Dict[int, date]] = {}
    _cache_loaded: bool = False

    # Event name mappings (normalize different formats)
    EVENT_NAME_MAP = {
        "DIWALI": "Diwali",
        "DHANTERAS": "Dhanteras",
        "AKSHAYA_TRITIYA": "Akshaya Tritiya",
        "UNION_BUDGET": "Union Budget",
        "CHRISTMAS": "Christmas",
        "NEW_YEAR": "New Year",
        "CHINESE_NEW_YEAR": "Chinese New Year",
        "REPUBLIC_DAY": "Republic Day",
        "INDEPENDENCE_DAY": "Independence Day",
    }

    # Reverse mapping
    EVENT_NAME_REVERSE_MAP = {v: k for k, v in EVENT_NAME_MAP.items()}

    @classmethod
    def _normalize_event_name(cls, event_name: str) -> str:
        """Normalize event name to database format."""
        event_upper = event_name.upper().replace(" ", "_")
        return cls.EVENT_NAME_MAP.get(event_upper, event_name)

    @classmethod
    def _to_internal_name(cls, db_name: str) -> str:
        """Convert database event name to internal format."""
        return cls.EVENT_NAME_REVERSE_MAP.get(
            db_name, db_name.upper().replace(" ", "_")
        )

    @classmethod
    def load_events_from_db(cls, db_session) -> None:
        """
        Load all event dates from the database into cache.

        Args:
            db_session: SQLAlchemy database session
        """
        try:
            from models.seasonal import SeasonalEvent

            events = (
                db_session.query(SeasonalEvent)
                .filter(SeasonalEvent.is_active.is_(True))
                .all()
            )

            cls._event_cache.clear()

            for event in events:
                internal_name = cls._to_internal_name(event.name)
                if internal_name not in cls._event_cache:
                    cls._event_cache[internal_name] = {}

                year = event.start_date.year
                cls._event_cache[internal_name][year] = event.start_date

            cls._cache_loaded = True
            logger.info(f"Loaded {len(events)} seasonal events from database")

        except Exception as e:
            logger.warning(f"Failed to load events from database: {e}. Using fallback.")
            cls._cache_loaded = False

    @classmethod
    def get_event_date(
        cls, event_name: str, year: int, db_session=None
    ) -> Optional[date]:
        """
        Get the date of a specific event for a given year.

        Args:
            event_name: Name of the event (e.g., "DIWALI", "UNION_BUDGET")
            year: Year to get the date for
            db_session: Optional database session for loading events

        Returns:
            Date of the event or None if not found
        """
        event_upper = event_name.upper().replace(" ", "_")

        # Load from DB if not cached and session provided
        if not cls._cache_loaded and db_session:
            cls.load_events_from_db(db_session)

        # Check cache first
        if event_upper in cls._event_cache:
            return cls._event_cache[event_upper].get(year)

        # Fallback for fixed-date events not in DB
        FIXED_EVENTS = {
            "NEW_YEAR": (1, 1),
            "REPUBLIC_DAY": (1, 26),
            "INDEPENDENCE_DAY": (8, 15),
            "CHRISTMAS": (12, 25),
            "UNION_BUDGET": (2, 1),
        }

        if event_upper in FIXED_EVENTS:
            month, day = FIXED_EVENTS[event_upper]
            return date(year, month, day)

        return None

    @classmethod
    def get_all_event_dates_for_year(
        cls, year: int, db_session=None
    ) -> Dict[str, date]:
        """
        Get all event dates for a specific year.

        Args:
            year: Year to get dates for
            db_session: Optional database session

        Returns:
            Dictionary mapping event names to dates
        """
        if not cls._cache_loaded and db_session:
            cls.load_events_from_db(db_session)

        events = {}

        for event_name, year_dates in cls._event_cache.items():
            if year in year_dates:
                events[event_name] = year_dates[year]

        return events

    @classmethod
    def get_days_to_event(
        cls, event_name: str, from_date: date, db_session=None
    ) -> Optional[int]:
        """
        Calculate days until the next occurrence of an event.

        Args:
            event_name: Name of the event
            from_date: Date to calculate from
            db_session: Optional database session

        Returns:
            Number of days until event (negative if past)
        """
        # Try current year first
        event_date = cls.get_event_date(event_name, from_date.year, db_session)

        if event_date is None:
            return None

        # If event has passed this year, get next year's date
        if event_date < from_date:
            event_date = cls.get_event_date(event_name, from_date.year + 1, db_session)
            if event_date is None:
                return None

        return (event_date - from_date).days

    @classmethod
    def get_days_from_event(
        cls, event_name: str, from_date: date, db_session=None
    ) -> Optional[int]:
        """
        Calculate days since the last occurrence of an event.

        Args:
            event_name: Name of the event
            from_date: Date to calculate from
            db_session: Optional database session

        Returns:
            Number of days since event (negative if future)
        """
        # Try current year first
        event_date = cls.get_event_date(event_name, from_date.year, db_session)

        if event_date is None:
            return None

        # If event is in the future, get last year's date
        if event_date > from_date:
            event_date = cls.get_event_date(event_name, from_date.year - 1, db_session)
            if event_date is None:
                return None

        return (from_date - event_date).days

    @classmethod
    def is_in_event_window(
        cls,
        event_name: str,
        check_date: date,
        days_before: int = 7,
        days_after: int = 3,
        db_session=None,
    ) -> bool:
        """
        Check if a date falls within the trading window of an event.

        Args:
            event_name: Name of the event
            check_date: Date to check
            days_before: Days before event to include
            days_after: Days after event to include
            db_session: Optional database session

        Returns:
            True if date is within the event window
        """
        event_date = cls.get_event_date(event_name, check_date.year, db_session)

        if event_date is None:
            return False

        window_start = event_date - timedelta(days=days_before)
        window_end = event_date + timedelta(days=days_after)

        return window_start <= check_date <= window_end

    @classmethod
    def get_upcoming_events(
        cls, from_date: date, days_ahead: int = 60, db_session=None
    ) -> List[Dict]:
        """
        Get all upcoming events within a specified number of days.

        Args:
            from_date: Date to start from
            days_ahead: Number of days to look ahead
            db_session: Optional database session

        Returns:
            List of upcoming events with dates and days until
        """
        upcoming = []
        end_date = from_date + timedelta(days=days_ahead)

        # Check current and next year
        for year in [from_date.year, from_date.year + 1]:
            events = cls.get_all_event_dates_for_year(year, db_session)

            for event_name, event_date in events.items():
                if from_date <= event_date <= end_date:
                    upcoming.append(
                        {
                            "event_name": event_name,
                            "event_date": event_date.isoformat(),
                            "days_until": (event_date - from_date).days,
                        }
                    )

        # Sort by days until
        upcoming.sort(key=lambda x: x["days_until"])

        return upcoming


class SeasonalService:
    """Service for analyzing seasonal patterns and events"""

    # Major Indian festivals and events affecting gold/silver
    MAJOR_EVENTS = [
        {
            "name": "Akshaya Tritiya",
            "type": "festival",
            "month": 4,  # April-May (varies)
            "is_lunar": True,
            "description": "Considered highly auspicious for buying gold",
            "typical_impact": "high",
        },
        {
            "name": "Diwali",
            "type": "festival",
            "month": 10,  # October-November (varies)
            "is_lunar": True,
            "description": "Festival of lights, major gold buying season",
            "typical_impact": "very_high",
        },
        {
            "name": "Dhanteras",
            "type": "festival",
            "month": 10,  # 2 days before Diwali
            "is_lunar": True,
            "description": "Day dedicated to wealth, peak gold buying",
            "typical_impact": "very_high",
        },
        {
            "name": "Wedding Season",
            "type": "seasonal",
            "month": 11,  # November-February
            "duration_days": 120,
            "description": "Peak wedding season in India",
            "typical_impact": "high",
        },
        {
            "name": "RBI Policy",
            "type": "economic",
            "month": None,  # Multiple times per year
            "description": "Reserve Bank of India monetary policy",
            "typical_impact": "medium",
        },
    ]

    @staticmethod
    def calculate_event_impact(
        prices_before: List[float],
        prices_during: List[float],
        prices_after: List[float],
    ) -> Dict[str, float]:
        """
        Calculate impact metrics for a seasonal event

        Args:
            prices_before: Prices 7 days before event
            prices_during: Prices during event
            prices_after: Prices 7 days after event

        Returns:
            Dictionary with impact metrics
        """
        if not prices_before or not prices_during or not prices_after:
            return {}

        avg_before = statistics.mean(prices_before)
        avg_during = statistics.mean(prices_during)
        avg_after = statistics.mean(prices_after)

        # Calculate changes
        change_before_to_during = ((avg_during - avg_before) / avg_before) * 100
        change_during_to_after = ((avg_after - avg_during) / avg_during) * 100
        change_before_to_after = ((avg_after - avg_before) / avg_before) * 100

        # Calculate volatility
        volatility_before = (
            statistics.stdev(prices_before) if len(prices_before) > 1 else 0
        )
        volatility_during = (
            statistics.stdev(prices_during) if len(prices_during) > 1 else 0
        )
        volatility_after = (
            statistics.stdev(prices_after) if len(prices_after) > 1 else 0
        )

        return {
            "avg_price_before": round(avg_before, 2),
            "avg_price_during": round(avg_during, 2),
            "avg_price_after": round(avg_after, 2),
            "change_before_to_during": round(change_before_to_during, 3),
            "change_during_to_after": round(change_during_to_after, 3),
            "change_before_to_after": round(change_before_to_after, 3),
            "volatility_before": round(volatility_before, 2),
            "volatility_during": round(volatility_during, 2),
            "volatility_after": round(volatility_after, 2),
            "volatility_increase": round(
                ((volatility_during - volatility_before) / volatility_before * 100)
                if volatility_before > 0
                else 0,
                2,
            ),
        }

    @staticmethod
    def calculate_historical_performance(
        yearly_data: List[Dict[str, float]],
    ) -> Dict[str, float]:
        """
        Calculate aggregate historical performance across years

        Args:
            yearly_data: List of yearly performance dictionaries

        Returns:
            Aggregate performance metrics
        """
        if not yearly_data:
            return {}

        changes = [d.get("change_7d", 0) for d in yearly_data if "change_7d" in d]
        max_gains = [d.get("max_gain", 0) for d in yearly_data if "max_gain" in d]
        max_losses = [d.get("max_loss", 0) for d in yearly_data if "max_loss" in d]

        positive_years = sum(1 for c in changes if c > 0)
        win_rate = (positive_years / len(changes) * 100) if changes else 0

        return {
            "avg_change_7d": round(statistics.mean(changes), 3) if changes else 0,
            "median_change_7d": round(statistics.median(changes), 3) if changes else 0,
            "avg_max_gain": round(statistics.mean(max_gains), 3) if max_gains else 0,
            "avg_max_loss": round(statistics.mean(max_losses), 3) if max_losses else 0,
            "win_rate": round(win_rate, 2),
            "best_return": round(max(changes), 3) if changes else 0,
            "worst_return": round(min(changes), 3) if changes else 0,
            "occurrences": len(yearly_data),
        }

    @staticmethod
    def generate_recommendation(
        avg_change: float, win_rate: float, volatility_increase: float
    ) -> Tuple[str, str]:
        """
        Generate trading recommendation based on historical data

        Args:
            avg_change: Average price change percentage
            win_rate: Win rate percentage
            volatility_increase: Volatility increase percentage

        Returns:
            Tuple of (recommendation, confidence)
        """
        # Determine confidence
        if win_rate >= 75 and abs(avg_change) > 2:
            confidence = "high"
        elif win_rate >= 60 and abs(avg_change) > 1:
            confidence = "medium"
        else:
            confidence = "low"

        # Generate recommendation
        if avg_change > 2 and win_rate > 70:
            recommendation = f"STRONG BUY: Historical data shows {avg_change:.2f}% average gain with {win_rate:.0f}% win rate"
        elif avg_change > 1 and win_rate > 60:
            recommendation = (
                f"BUY: Moderate positive trend with {avg_change:.2f}% average gain"
            )
        elif avg_change < -2 and win_rate < 30:
            recommendation = (
                f"AVOID: Historical data shows {avg_change:.2f}% average loss"
            )
        elif volatility_increase > 50:
            recommendation = f"CAUTION: High volatility expected (increase of {volatility_increase:.0f}%)"
        else:
            recommendation = "NEUTRAL: No strong historical pattern"

        return recommendation, confidence

    @staticmethod
    def calculate_days_until_event(event_date: date) -> int:
        """Calculate days until event"""
        today = date.today()
        delta = event_date - today
        return delta.days

    @staticmethod
    def get_optimal_entry_timing(
        historical_data: List[Dict], event_date: date
    ) -> Dict[str, any]:
        """
        Determine optimal entry timing based on historical patterns

        Args:
            historical_data: Historical performance data
            event_date: Upcoming event date

        Returns:
            Dictionary with entry timing recommendation
        """
        # Analyze when prices typically start rising
        pre_event_changes = []
        for data in historical_data:
            if "change_before_7d" in data:
                pre_event_changes.append(data["change_before_7d"])

        if not pre_event_changes:
            return {
                "recommended_entry": "7 days before",
                "reasoning": "Insufficient historical data",
            }

        avg_pre_change = statistics.mean(pre_event_changes)

        if avg_pre_change > 1.5:
            entry_days = 10
            reasoning = "Prices typically start rising 7-10 days before event"
        elif avg_pre_change > 0.5:
            entry_days = 7
            reasoning = "Moderate price increase observed in week before event"
        else:
            entry_days = 3
            reasoning = "Price movement typically occurs closer to event"

        entry_date = event_date - timedelta(days=entry_days)

        return {
            "recommended_entry_date": entry_date.isoformat(),
            "days_before_event": entry_days,
            "reasoning": reasoning,
            "avg_pre_event_change": round(avg_pre_change, 2),
        }

    @staticmethod
    def calculate_risk_metrics(yearly_data: List[Dict[str, float]]) -> Dict[str, float]:
        """
        Calculate risk metrics for event trading

        Args:
            yearly_data: Historical yearly performance

        Returns:
            Risk metrics dictionary
        """
        if not yearly_data:
            return {}

        changes = [d.get("change_7d", 0) for d in yearly_data if "change_7d" in d]

        if not changes:
            return {}

        # Calculate standard deviation (risk)
        std_dev = statistics.stdev(changes) if len(changes) > 1 else 0
        mean_return = statistics.mean(changes)

        # Sharpe-like ratio (simplified)
        sharpe = (mean_return / std_dev) if std_dev > 0 else 0

        # Maximum drawdown
        max_dd = min(changes) if changes else 0

        # Downside deviation (only negative returns)
        negative_returns = [c for c in changes if c < 0]
        downside_dev = (
            statistics.stdev(negative_returns) if len(negative_returns) > 1 else 0
        )

        return {
            "standard_deviation": round(std_dev, 3),
            "sharpe_ratio": round(sharpe, 3),
            "max_drawdown": round(max_dd, 3),
            "downside_deviation": round(downside_dev, 3),
            "risk_level": "high"
            if std_dev > 3
            else "medium"
            if std_dev > 1.5
            else "low",
        }
