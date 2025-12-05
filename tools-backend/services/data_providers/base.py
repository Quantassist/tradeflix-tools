"""
Base classes and interfaces for data providers.

This module defines abstract base classes that all data providers must implement.
This ensures a consistent interface across different data sources, making it easy
to switch providers without changing the consuming code.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any


class Exchange(Enum):
    """Supported exchanges"""

    MCX = "MCX"  # Multi Commodity Exchange (India)
    COMEX = "COMEX"  # Commodity Exchange (US)
    NSE = "NSE"  # National Stock Exchange (India)
    BSE = "BSE"  # Bombay Stock Exchange (India)
    FOREX = "FOREX"  # Foreign Exchange
    GLOBAL = "GLOBAL"  # Global/International


class AssetType(Enum):
    """Types of assets"""

    COMMODITY = "COMMODITY"
    EQUITY = "EQUITY"
    CURRENCY = "CURRENCY"
    INDEX = "INDEX"
    FUTURES = "FUTURES"
    OPTIONS = "OPTIONS"


class Metal(Enum):
    """Supported metals with their standard codes"""

    GOLD = "XAU"
    SILVER = "XAG"
    PLATINUM = "XPT"
    PALLADIUM = "XPD"
    COPPER = "XCU"


class Currency(Enum):
    """Supported currencies"""

    USD = "USD"
    INR = "INR"
    EUR = "EUR"
    GBP = "GBP"


@dataclass
class PriceData:
    """
    Standard price data structure returned by all providers.

    Attributes:
        symbol: The asset symbol (e.g., "XAU", "GOLD")
        price: Current price
        currency: Price currency (e.g., "USD", "INR")
        timestamp: When the price was recorded
        exchange: Source exchange
        unit: Unit of measurement (e.g., "troy_oz", "gram", "10g")
        bid: Bid price (optional)
        ask: Ask price (optional)
        change: Price change from previous close (optional)
        change_percent: Percentage change (optional)
        provider: Name of the data provider
        raw_data: Original response from provider for debugging
    """

    symbol: str
    price: Decimal
    currency: str
    timestamp: datetime
    exchange: Exchange
    unit: str = "troy_oz"
    bid: Optional[Decimal] = None
    ask: Optional[Decimal] = None
    change: Optional[Decimal] = None
    change_percent: Optional[float] = None
    provider: str = ""
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OHLCData:
    """
    OHLC (Open, High, Low, Close) data structure.

    Attributes:
        symbol: The asset symbol
        open: Opening price
        high: Highest price
        low: Lowest price
        close: Closing price
        volume: Trading volume (optional)
        timestamp: Date/time of the data
        currency: Price currency
        exchange: Source exchange
        provider: Name of the data provider
    """

    symbol: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    timestamp: datetime
    currency: str
    exchange: Exchange
    volume: Optional[int] = None
    provider: str = ""


@dataclass
class HistoricalDataPoint:
    """
    Single point in historical data series.
    """

    date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Optional[int] = None
    adjusted_close: Optional[Decimal] = None


@dataclass
class HistoricalData:
    """
    Historical data series for an asset.
    """

    symbol: str
    currency: str
    exchange: Exchange
    data_points: List[HistoricalDataPoint]
    start_date: date
    end_date: date
    interval: str  # "1d", "1h", "15m", etc.
    provider: str = ""


class BasePriceProvider(ABC):
    """
    Abstract base class for real-time price data providers.

    All price providers must implement these methods to ensure
    a consistent interface for fetching current prices.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of this provider"""
        pass

    @property
    @abstractmethod
    def supported_exchanges(self) -> List[Exchange]:
        """Return list of exchanges this provider supports"""
        pass

    @abstractmethod
    async def get_price(
        self, symbol: str, currency: str = "USD", exchange: Optional[Exchange] = None
    ) -> PriceData:
        """
        Get current price for a symbol.

        Args:
            symbol: Asset symbol (e.g., "XAU", "GOLD", "GOLDM")
            currency: Target currency for the price
            exchange: Specific exchange (optional)

        Returns:
            PriceData object with current price information

        Raises:
            ProviderError: If the request fails
        """
        pass

    @abstractmethod
    async def get_multiple_prices(
        self, symbols: List[str], currency: str = "USD"
    ) -> List[PriceData]:
        """
        Get current prices for multiple symbols.

        Args:
            symbols: List of asset symbols
            currency: Target currency for prices

        Returns:
            List of PriceData objects
        """
        pass

    @abstractmethod
    async def get_ohlc(
        self, symbol: str, date: date, currency: str = "USD"
    ) -> OHLCData:
        """
        Get OHLC data for a specific date.

        Args:
            symbol: Asset symbol
            date: Date for OHLC data
            currency: Target currency

        Returns:
            OHLCData object
        """
        pass

    async def convert_currency(
        self, amount: Decimal, from_currency: str, to_currency: str
    ) -> Decimal:
        """
        Convert amount between currencies.
        Default implementation - override if provider supports conversion.
        """
        raise NotImplementedError(
            f"{self.provider_name} does not support currency conversion"
        )

    async def health_check(self) -> bool:
        """Check if the provider is available and responding"""
        try:
            # Try to get a common price as health check
            await self.get_price("XAU", "USD")
            return True
        except Exception:
            return False


class BaseHistoricalDataProvider(ABC):
    """
    Abstract base class for historical data providers.

    Providers that offer historical/time-series data should implement
    this interface in addition to or instead of BasePriceProvider.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of this provider"""
        pass

    @property
    @abstractmethod
    def supported_intervals(self) -> List[str]:
        """Return list of supported time intervals (e.g., '1d', '1h', '15m')"""
        pass

    @property
    @abstractmethod
    def max_history_days(self) -> int:
        """Maximum number of days of historical data available"""
        pass

    @abstractmethod
    async def get_historical_data(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "1d",
        currency: str = "USD",
    ) -> HistoricalData:
        """
        Get historical price data for a symbol.

        Args:
            symbol: Asset symbol
            start_date: Start date for historical data
            end_date: End date for historical data
            interval: Time interval ('1d', '1h', '15m', etc.)
            currency: Target currency

        Returns:
            HistoricalData object with list of data points
        """
        pass

    @abstractmethod
    async def get_intraday_data(
        self, symbol: str, date: date, interval: str = "1m"
    ) -> HistoricalData:
        """
        Get intraday price data for a specific date.

        Args:
            symbol: Asset symbol
            date: Date for intraday data
            interval: Time interval ('1m', '5m', '15m', etc.)

        Returns:
            HistoricalData object with intraday data points
        """
        pass


class ProviderError(Exception):
    """Base exception for provider errors"""

    def __init__(
        self, provider: str, message: str, original_error: Optional[Exception] = None
    ):
        self.provider = provider
        self.message = message
        self.original_error = original_error
        super().__init__(f"[{provider}] {message}")


class RateLimitError(ProviderError):
    """Raised when API rate limit is exceeded"""

    pass


class AuthenticationError(ProviderError):
    """Raised when API authentication fails"""

    pass


class SymbolNotFoundError(ProviderError):
    """Raised when requested symbol is not found"""

    pass


class DataNotAvailableError(ProviderError):
    """Raised when requested data is not available"""

    pass
