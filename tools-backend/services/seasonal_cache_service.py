"""
Seasonal Analysis Cache Service

This service provides precomputation and caching of seasonal analysis data.
Options for caching:
1. Redis (recommended for production)
2. In-memory cache (for development)
3. Database table (persistent, no external dependencies)

The service precomputes heavy calculations and stores them for fast retrieval.
"""

from typing import Dict, Optional, List, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
import json
import logging
import hashlib
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class CacheBackend(ABC):
    """Abstract base class for cache backends"""

    @abstractmethod
    def get(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    def set(self, key: str, value: str, ttl_seconds: int = 86400) -> bool:
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        pass


class InMemoryCache(CacheBackend):
    """Simple in-memory cache for development"""

    _cache: Dict[str, Dict] = {}

    def get(self, key: str) -> Optional[str]:
        if key in self._cache:
            entry = self._cache[key]
            if entry["expires_at"] > datetime.now():
                return entry["value"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: str, ttl_seconds: int = 86400) -> bool:
        self._cache[key] = {
            "value": value,
            "expires_at": datetime.now() + timedelta(seconds=ttl_seconds),
        }
        return True

    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def exists(self, key: str) -> bool:
        if key in self._cache:
            if self._cache[key]["expires_at"] > datetime.now():
                return True
            del self._cache[key]
        return False

    def clear(self):
        self._cache.clear()


class RedisCache(CacheBackend):
    """Redis cache backend for production"""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        try:
            import redis

            self._redis = redis.from_url(redis_url)
            self._available = True
            logger.info("Redis cache initialized")
        except ImportError:
            logger.warning(
                "Redis package not installed, falling back to in-memory cache"
            )
            self._available = False
            self._fallback = InMemoryCache()
        except Exception as e:
            logger.warning(
                f"Redis connection failed: {e}, falling back to in-memory cache"
            )
            self._available = False
            self._fallback = InMemoryCache()

    def get(self, key: str) -> Optional[str]:
        if not self._available:
            return self._fallback.get(key)
        value = self._redis.get(key)
        return value.decode() if value else None

    def set(self, key: str, value: str, ttl_seconds: int = 86400) -> bool:
        if not self._available:
            return self._fallback.set(key, value, ttl_seconds)
        return self._redis.setex(key, ttl_seconds, value)

    def delete(self, key: str) -> bool:
        if not self._available:
            return self._fallback.delete(key)
        return self._redis.delete(key) > 0

    def exists(self, key: str) -> bool:
        if not self._available:
            return self._fallback.exists(key)
        return self._redis.exists(key) > 0


class SeasonalCacheService:
    """
    Service for caching precomputed seasonal analysis data.

    Usage:
        cache = SeasonalCacheService()

        # Check cache first
        data = cache.get_monthly_seasonality("GOLD", "INR", 10)
        if data is None:
            # Compute and cache
            data = MetalsPriceService.get_monthly_seasonality(db, "GOLD", "INR", 10)
            cache.set_monthly_seasonality("GOLD", "INR", 10, data)
    """

    # Cache key prefixes
    PREFIX_MONTHLY = "seasonal:monthly"
    PREFIX_EVENT_PERF = "seasonal:event_perf"
    PREFIX_EVENT_TRAJ = "seasonal:event_traj"
    PREFIX_VOLATILITY = "seasonal:volatility"
    PREFIX_COMPARISON = "seasonal:comparison"
    PREFIX_ALERTS = "seasonal:alerts"

    # Default TTL (24 hours for historical data, 1 hour for alerts)
    TTL_HISTORICAL = 86400  # 24 hours
    TTL_ALERTS = 3600  # 1 hour

    def __init__(
        self, backend: Optional[CacheBackend] = None, redis_url: Optional[str] = None
    ):
        if backend:
            self._cache = backend
        elif redis_url:
            self._cache = RedisCache(redis_url)
        else:
            # Default to in-memory cache
            self._cache = InMemoryCache()

    def _make_key(self, prefix: str, **kwargs) -> str:
        """Generate a cache key from prefix and parameters"""
        params = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return f"{prefix}:{params}"

    def _serialize(self, data: Any) -> str:
        """Serialize data to JSON string"""
        return json.dumps(data, default=str)

    def _deserialize(self, data: str) -> Any:
        """Deserialize JSON string to data"""
        return json.loads(data)

    # Monthly Seasonality
    def get_monthly_seasonality(
        self, metal: str, currency: str, years_back: int
    ) -> Optional[List[Dict]]:
        key = self._make_key(
            self.PREFIX_MONTHLY, metal=metal, currency=currency, years=years_back
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_monthly_seasonality(
        self, metal: str, currency: str, years_back: int, data: List[Dict]
    ) -> bool:
        key = self._make_key(
            self.PREFIX_MONTHLY, metal=metal, currency=currency, years=years_back
        )
        return self._cache.set(key, self._serialize(data), self.TTL_HISTORICAL)

    # Event Performance
    def get_event_performance(
        self, metal: str, currency: str, month: int, day: int, years_back: int
    ) -> Optional[Dict]:
        key = self._make_key(
            self.PREFIX_EVENT_PERF,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_event_performance(
        self,
        metal: str,
        currency: str,
        month: int,
        day: int,
        years_back: int,
        data: Dict,
    ) -> bool:
        key = self._make_key(
            self.PREFIX_EVENT_PERF,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        return self._cache.set(key, self._serialize(data), self.TTL_HISTORICAL)

    # Event Trajectory
    def get_event_trajectory(
        self, metal: str, currency: str, month: int, day: int, years_back: int
    ) -> Optional[Dict]:
        key = self._make_key(
            self.PREFIX_EVENT_TRAJ,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_event_trajectory(
        self,
        metal: str,
        currency: str,
        month: int,
        day: int,
        years_back: int,
        data: Dict,
    ) -> bool:
        key = self._make_key(
            self.PREFIX_EVENT_TRAJ,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        return self._cache.set(key, self._serialize(data), self.TTL_HISTORICAL)

    # Volatility Analysis
    def get_volatility_analysis(
        self, metal: str, currency: str, month: int, day: int, years_back: int
    ) -> Optional[Dict]:
        key = self._make_key(
            self.PREFIX_VOLATILITY,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_volatility_analysis(
        self,
        metal: str,
        currency: str,
        month: int,
        day: int,
        years_back: int,
        data: Dict,
    ) -> bool:
        key = self._make_key(
            self.PREFIX_VOLATILITY,
            metal=metal,
            currency=currency,
            month=month,
            day=day,
            years=years_back,
        )
        return self._cache.set(key, self._serialize(data), self.TTL_HISTORICAL)

    # Events Comparison
    def get_events_comparison(
        self, metal: str, currency: str, years_back: int, events_hash: str
    ) -> Optional[List[Dict]]:
        key = self._make_key(
            self.PREFIX_COMPARISON,
            metal=metal,
            currency=currency,
            years=years_back,
            events=events_hash,
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_events_comparison(
        self,
        metal: str,
        currency: str,
        years_back: int,
        events_hash: str,
        data: List[Dict],
    ) -> bool:
        key = self._make_key(
            self.PREFIX_COMPARISON,
            metal=metal,
            currency=currency,
            years=years_back,
            events=events_hash,
        )
        return self._cache.set(key, self._serialize(data), self.TTL_HISTORICAL)

    # Upcoming Alerts (shorter TTL)
    def get_upcoming_alerts(
        self, metal: str, currency: str, alert_days: int
    ) -> Optional[List[Dict]]:
        key = self._make_key(
            self.PREFIX_ALERTS,
            metal=metal,
            currency=currency,
            days=alert_days,
            date=date.today().isoformat(),
        )
        data = self._cache.get(key)
        return self._deserialize(data) if data else None

    def set_upcoming_alerts(
        self, metal: str, currency: str, alert_days: int, data: List[Dict]
    ) -> bool:
        key = self._make_key(
            self.PREFIX_ALERTS,
            metal=metal,
            currency=currency,
            days=alert_days,
            date=date.today().isoformat(),
        )
        return self._cache.set(key, self._serialize(data), self.TTL_ALERTS)

    @staticmethod
    def hash_events(events: List[Dict]) -> str:
        """Create a hash of events list for cache key"""
        events_str = json.dumps(sorted([e.get("name", "") for e in events]))
        return hashlib.md5(events_str.encode()).hexdigest()[:8]


# Precomputation job for background tasks
class SeasonalPrecomputeJob:
    """
    Background job to precompute seasonal analysis data.

    Can be run:
    1. As a scheduled task (e.g., daily via cron/celery)
    2. On application startup
    3. After new price data is ingested
    """

    def __init__(self, db: Session, cache: SeasonalCacheService):
        self.db = db
        self.cache = cache

    def precompute_all(
        self,
        events: List[Dict],
        metals: List[str] = None,
        currencies: List[str] = None,
        years_options: List[int] = None,
    ):
        """
        Precompute all seasonal analysis data for given parameters.

        Args:
            events: List of events with name, month, day
            metals: List of metals to compute (default: all)
            currencies: List of currencies (default: INR, USD)
            years_options: List of years_back options (default: 5, 10)
        """
        from services.metals_price_service_optimized import (
            MetalsPriceServiceOptimized as Service,
        )

        metals = metals or ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"]
        currencies = currencies or ["INR", "USD"]
        years_options = years_options or [5, 10]

        logger.info(
            f"Starting precomputation for {len(metals)} metals, {len(currencies)} currencies, {len(events)} events"
        )

        total_computed = 0

        for metal in metals:
            for currency in currencies:
                for years_back in years_options:
                    # Monthly seasonality
                    try:
                        data = Service.get_monthly_seasonality(
                            self.db, metal, currency, years_back
                        )
                        self.cache.set_monthly_seasonality(
                            metal, currency, years_back, data
                        )
                        total_computed += 1
                    except Exception as e:
                        logger.error(
                            f"Error computing monthly seasonality for {metal}/{currency}: {e}"
                        )

                    # Event performance and trajectory for each event
                    for event in events:
                        try:
                            # Event performance
                            perf = Service.calculate_historical_event_performance(
                                self.db,
                                event["month"],
                                event["day"],
                                metal,
                                currency,
                                years_back,
                                10,
                                10,
                            )
                            self.cache.set_event_performance(
                                metal,
                                currency,
                                event["month"],
                                event["day"],
                                years_back,
                                perf,
                            )
                            total_computed += 1

                            # Event trajectory
                            traj = Service.get_event_trajectory(
                                self.db,
                                event["month"],
                                event["day"],
                                metal,
                                currency,
                                years_back,
                                10,
                                10,
                            )
                            self.cache.set_event_trajectory(
                                metal,
                                currency,
                                event["month"],
                                event["day"],
                                years_back,
                                traj,
                            )
                            total_computed += 1

                            # Volatility analysis
                            vol = Service.get_volatility_analysis(
                                self.db,
                                event["month"],
                                event["day"],
                                metal,
                                currency,
                                years_back,
                            )
                            self.cache.set_volatility_analysis(
                                metal,
                                currency,
                                event["month"],
                                event["day"],
                                years_back,
                                vol,
                            )
                            total_computed += 1

                        except Exception as e:
                            logger.error(
                                f"Error computing event data for {event['name']}: {e}"
                            )

                    # Events comparison
                    try:
                        comparisons = Service.compare_events(
                            self.db, events, metal, currency, years_back
                        )
                        events_hash = self.cache.hash_events(events)
                        self.cache.set_events_comparison(
                            metal, currency, years_back, events_hash, comparisons
                        )
                        total_computed += 1
                    except Exception as e:
                        logger.error(f"Error computing events comparison: {e}")

        logger.info(
            f"Precomputation complete. Computed {total_computed} cache entries."
        )
        return total_computed


# Global cache instance (can be configured via environment)
_cache_instance: Optional[SeasonalCacheService] = None


def get_cache() -> SeasonalCacheService:
    """Get the global cache instance"""
    global _cache_instance
    if _cache_instance is None:
        import os

        redis_url = os.environ.get("REDIS_URL")
        _cache_instance = SeasonalCacheService(redis_url=redis_url)
    return _cache_instance
