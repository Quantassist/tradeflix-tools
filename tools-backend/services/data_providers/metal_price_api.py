"""
MetalPriceAPI Provider Implementation.

This provider fetches global/international metal prices and forex rates
from MetalPriceAPI (https://metalpriceapi.com).

Supported features:
- Live metal prices (Gold, Silver, Platinum, Palladium)
- Historical rates
- OHLC data
- Currency conversion
- Timeframe queries (up to 365 days)

API Documentation: https://metalpriceapi.com/documentation
"""

import httpx
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
import logging

from .base import (
    BasePriceProvider,
    BaseHistoricalDataProvider,
    PriceData,
    OHLCData,
    HistoricalData,
    HistoricalDataPoint,
    Exchange,
    ProviderError,
    RateLimitError,
    AuthenticationError,
    SymbolNotFoundError,
    DataNotAvailableError,
)

logger = logging.getLogger(__name__)


class MetalPriceAPIProvider(BasePriceProvider, BaseHistoricalDataProvider):
    """
    MetalPriceAPI provider for global metal prices and forex rates.

    Usage:
        provider = MetalPriceAPIProvider(api_key="your_api_key")
        price = await provider.get_price("XAU", "USD")

    Symbol mapping:
        - XAU: Gold
        - XAG: Silver
        - XPT: Platinum
        - XPD: Palladium
        - XCU: Copper
    """

    BASE_URL = "https://api.metalpriceapi.com/v1"

    # Standard metal symbols used by MetalPriceAPI
    METAL_SYMBOLS = {
        "GOLD": "XAU",
        "SILVER": "XAG",
        "PLATINUM": "XPT",
        "PALLADIUM": "XPD",
        "COPPER": "XCU",
        # Direct mappings
        "XAU": "XAU",
        "XAG": "XAG",
        "XPT": "XPT",
        "XPD": "XPD",
        "XCU": "XCU",
    }

    def __init__(self, api_key: str, timeout: float = 30.0):
        """
        Initialize MetalPriceAPI provider.

        Args:
            api_key: Your MetalPriceAPI API key
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_name(self) -> str:
        return "MetalPriceAPI"

    @property
    def supported_exchanges(self) -> List[Exchange]:
        return [Exchange.GLOBAL, Exchange.COMEX, Exchange.FOREX]

    @property
    def supported_intervals(self) -> List[str]:
        return ["1d"]  # MetalPriceAPI only supports daily data

    @property
    def max_history_days(self) -> int:
        return 365  # Maximum timeframe query is 365 days

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self):
        """Close the HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _normalize_symbol(self, symbol: str) -> str:
        """Convert common symbol names to MetalPriceAPI format"""
        return self.METAL_SYMBOLS.get(symbol.upper(), symbol.upper())

    async def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make authenticated request to MetalPriceAPI.

        Args:
            endpoint: API endpoint (e.g., "/latest", "/2024-01-01")
            params: Query parameters

        Returns:
            JSON response as dictionary

        Raises:
            ProviderError: On API errors
        """
        client = await self._get_client()

        # Add API key to params
        if params is None:
            params = {}
        params["api_key"] = self.api_key

        url = f"{self.BASE_URL}{endpoint}"

        try:
            response = await client.get(url, params=params)
            data = response.json()

            if not data.get("success", False):
                error_code = data.get("error", {}).get("code", 0)
                error_msg = data.get("error", {}).get("message", "Unknown error")

                # Map error codes to specific exceptions
                if error_code in [101, 102, 103]:
                    raise AuthenticationError(self.provider_name, error_msg)
                elif error_code in [104, 105]:
                    raise RateLimitError(self.provider_name, error_msg)
                elif error_code == 300:
                    raise DataNotAvailableError(self.provider_name, error_msg)
                else:
                    raise ProviderError(
                        self.provider_name, f"Error {error_code}: {error_msg}"
                    )

            return data

        except httpx.HTTPError as e:
            raise ProviderError(self.provider_name, f"HTTP error: {str(e)}", e)

    async def get_price(
        self, symbol: str, currency: str = "USD", exchange: Optional[Exchange] = None
    ) -> PriceData:
        """
        Get current price for a metal.

        Args:
            symbol: Metal symbol (e.g., "XAU", "GOLD", "XAG", "SILVER")
            currency: Target currency (default: USD)
            exchange: Ignored for this provider (always global)

        Returns:
            PriceData with current price
        """
        normalized_symbol = self._normalize_symbol(symbol)

        data = await self._make_request(
            "/latest", {"base": currency.upper(), "currencies": normalized_symbol}
        )

        rates = data.get("rates", {})

        # MetalPriceAPI returns rates as currency/metal (e.g., USD/XAU)
        # So the rate is how many USD per 1 troy oz of gold
        rate_key = f"{currency.upper()}{normalized_symbol}"
        inverse_key = normalized_symbol

        if rate_key in rates:
            price = Decimal(str(rates[rate_key]))
        elif inverse_key in rates:
            # If we get XAU rate (gold per USD), invert it
            price = Decimal(1) / Decimal(str(rates[inverse_key]))
        else:
            raise SymbolNotFoundError(
                self.provider_name, f"Symbol {symbol} not found in response"
            )

        return PriceData(
            symbol=normalized_symbol,
            price=price,
            currency=currency.upper(),
            timestamp=datetime.fromtimestamp(data.get("timestamp", 0)),
            exchange=Exchange.GLOBAL,
            unit="troy_oz",
            provider=self.provider_name,
            raw_data=data,
        )

    async def get_multiple_prices(
        self, symbols: List[str], currency: str = "USD"
    ) -> List[PriceData]:
        """
        Get current prices for multiple metals.

        Args:
            symbols: List of metal symbols
            currency: Target currency

        Returns:
            List of PriceData objects
        """
        normalized_symbols = [self._normalize_symbol(s) for s in symbols]

        data = await self._make_request(
            "/latest",
            {"base": currency.upper(), "currencies": ",".join(normalized_symbols)},
        )

        rates = data.get("rates", {})
        timestamp = datetime.fromtimestamp(data.get("timestamp", 0))

        results = []
        for symbol in normalized_symbols:
            rate_key = f"{currency.upper()}{symbol}"
            if rate_key in rates:
                price = Decimal(str(rates[rate_key]))
            elif symbol in rates:
                price = Decimal(1) / Decimal(str(rates[symbol]))
            else:
                continue

            results.append(
                PriceData(
                    symbol=symbol,
                    price=price,
                    currency=currency.upper(),
                    timestamp=timestamp,
                    exchange=Exchange.GLOBAL,
                    unit="troy_oz",
                    provider=self.provider_name,
                    raw_data={"rate": str(price)},
                )
            )

        return results

    async def get_ohlc(
        self, symbol: str, date: date, currency: str = "USD"
    ) -> OHLCData:
        """
        Get OHLC data for a specific date.

        Args:
            symbol: Metal symbol
            date: Date for OHLC data
            currency: Target currency

        Returns:
            OHLCData object
        """
        normalized_symbol = self._normalize_symbol(symbol)

        data = await self._make_request(
            "/ohlc",
            {
                "base": normalized_symbol,
                "currency": currency.upper(),
                "date": date.strftime("%Y-%m-%d"),
            },
        )

        rate = data.get("rate", {})

        return OHLCData(
            symbol=normalized_symbol,
            open=Decimal(str(rate.get("open", 0))),
            high=Decimal(str(rate.get("high", 0))),
            low=Decimal(str(rate.get("low", 0))),
            close=Decimal(str(rate.get("close", 0))),
            timestamp=datetime.fromtimestamp(data.get("timestamp", 0)),
            currency=currency.upper(),
            exchange=Exchange.GLOBAL,
            provider=self.provider_name,
        )

    async def get_historical_data(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "1d",
        currency: str = "USD",
    ) -> HistoricalData:
        """
        Get historical price data using timeframe endpoint.

        Args:
            symbol: Metal symbol
            start_date: Start date
            end_date: End date (max 365 days from start)
            interval: Only "1d" is supported
            currency: Target currency

        Returns:
            HistoricalData with daily data points
        """
        if interval != "1d":
            raise ProviderError(
                self.provider_name,
                f"Interval {interval} not supported. Only '1d' is available.",
            )

        normalized_symbol = self._normalize_symbol(symbol)

        data = await self._make_request(
            "/timeframe",
            {
                "base": currency.upper(),
                "currencies": normalized_symbol,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
            },
        )

        rates = data.get("rates", {})
        data_points = []

        for date_str, day_rates in sorted(rates.items()):
            rate_key = f"{currency.upper()}{normalized_symbol}"
            if rate_key in day_rates:
                price = Decimal(str(day_rates[rate_key]))
            elif normalized_symbol in day_rates:
                price = Decimal(1) / Decimal(str(day_rates[normalized_symbol]))
            else:
                continue

            # Timeframe endpoint only gives close prices, not full OHLC
            data_points.append(
                HistoricalDataPoint(
                    date=datetime.strptime(date_str, "%Y-%m-%d").date(),
                    open=price,
                    high=price,
                    low=price,
                    close=price,
                )
            )

        return HistoricalData(
            symbol=normalized_symbol,
            currency=currency.upper(),
            exchange=Exchange.GLOBAL,
            data_points=data_points,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
            provider=self.provider_name,
        )

    async def get_intraday_data(
        self, symbol: str, date: date, interval: str = "1m"
    ) -> HistoricalData:
        """
        MetalPriceAPI does not support intraday data.
        """
        raise ProviderError(
            self.provider_name, "Intraday data is not supported by MetalPriceAPI"
        )

    async def convert_currency(
        self, amount: Decimal, from_currency: str, to_currency: str
    ) -> Decimal:
        """
        Convert amount between currencies.

        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency

        Returns:
            Converted amount
        """
        data = await self._make_request(
            "/convert",
            {
                "from": from_currency.upper(),
                "to": to_currency.upper(),
                "amount": str(amount),
            },
        )

        return Decimal(str(data.get("result", 0)))

    async def get_forex_rate(self, from_currency: str, to_currency: str) -> Decimal:
        """
        Get forex exchange rate.

        Args:
            from_currency: Base currency (e.g., "USD")
            to_currency: Quote currency (e.g., "INR")

        Returns:
            Exchange rate
        """
        data = await self._make_request(
            "/latest",
            {"base": from_currency.upper(), "currencies": to_currency.upper()},
        )

        rates = data.get("rates", {})
        return Decimal(str(rates.get(to_currency.upper(), 0)))

    async def get_carat_prices(
        self, currency: str = "USD", date: Optional[date] = None
    ) -> Dict[str, Decimal]:
        """
        Get gold prices by carat.

        Args:
            currency: Target currency
            date: Optional date for historical carat prices

        Returns:
            Dictionary with carat as key and price as value
        """
        params = {"base": currency.upper(), "currency": "XAU"}
        if date:
            params["date"] = date.strftime("%Y-%m-%d")

        data = await self._make_request("/carat", params)

        carat_data = data.get("data", {})
        return {k: Decimal(str(v)) for k, v in carat_data.items()}
