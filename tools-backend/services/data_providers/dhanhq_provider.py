"""
DhanHQ Provider Implementation.

This provider fetches MCX (Multi Commodity Exchange) prices for Indian markets
using the official DhanHQ Python SDK.

Supported features:
- Live MCX Gold/Silver prices
- Historical daily data
- Intraday minute data
- Market quotes (LTP, OHLC, Full)
- Option chain data

API Documentation: https://dhanhq.co/docs/v2/
GitHub: https://github.com/dhan-oss/DhanHQ-py
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
import logging
import asyncio
import time
from functools import partial

from .base import (
    BasePriceProvider,
    BaseHistoricalDataProvider,
    PriceData,
    OHLCData,
    HistoricalData,
    HistoricalDataPoint,
    Exchange,
    ProviderError,
    AuthenticationError,
    SymbolNotFoundError,
    DataNotAvailableError,
)

logger = logging.getLogger(__name__)


class DhanHQProvider(BasePriceProvider, BaseHistoricalDataProvider):
    """
    DhanHQ provider for MCX commodity prices (Gold, Silver, etc.).

    Usage:
        provider = DhanHQProvider(client_id="your_client_id", access_token="your_token")
        price = await provider.get_price("GOLDM", "INR", Exchange.MCX)

    Exchange Segments:
        - MCX_COMM: MCX Commodity segment
        - NSE_EQ: NSE Equity
        - NSE_FNO: NSE Futures & Options

    Note: Requires active Dhan trading account with API access enabled.
    """

    # MCX Exchange segment identifier
    MCX_SEGMENT = "MCX_COMM"

    # MCX commodity security IDs for FUTCOM (Futures Commodity)
    # These are contract-specific and change with expiry. Update as needed.
    # Format: {symbol: security_id} - security_id as INTEGER
    # To find security IDs: fetch_security_list() and filter by SEM_INSTRUMENT_NAME
    # Last updated: Dec 2025
    MCX_SECURITY_IDS = {
        # Gold contracts (FUTCOM) - GOLD-05Feb2026-FUT
        "GOLD": 449534,
        "GOLDFEB": 449534,
        "GOLDM": 449534,  # Gold Mini - alias to main contract
        "GOLDPETAL": 449534,  # Gold Petal - alias
        # Silver contracts (FUTCOM) - SILVER-05Mar2026-FUT
        "SILVER": 451666,
        "SILVERMAR": 451666,
        "SILVERM": 451666,  # Silver Mini - alias
        "SILVERMIC": 451666,  # Silver Micro - alias
        # Crude Oil (FUTCOM) - CRUDEOIL-18Dec2025-FUT
        "CRUDE": 462523,
        "CRUDEOIL": 462523,
        # Natural Gas (FUTCOM) - NATURALGAS-26Dec2025-FUT
        "NATURALGAS": 463007,
        # Copper (FUTCOM) - COPPER-31Dec2025-FUT
        "COPPER": 466015,
    }

    # Instrument types for MCX
    INSTRUMENT_TYPE = "FUTCOM"  # Futures Commodity

    # Rate limiting: 1 request per second
    RATE_LIMIT_SECONDS = 1.0

    def __init__(
        self, client_id: str, access_token: str, auto_fetch_instruments: bool = True
    ):
        """
        Initialize DhanHQ provider.

        Args:
            client_id: Your Dhan client ID
            access_token: Your Dhan access token (JWT)
            auto_fetch_instruments: Whether to fetch instrument list on init
        """
        self.client_id = client_id
        self.access_token = access_token
        self._dhan = None
        self._dhan_context = None
        self._instruments_loaded = False
        self._security_map: Dict[str, str] = {}
        self._last_request_time: float = 0.0

        # Initialize DhanHQ client
        self._init_client()

    def _init_client(self):
        """Initialize the DhanHQ client"""
        try:
            from dhanhq import dhanhq

            # Log client ID (masked) for debugging
            masked_id = (
                self.client_id[:4] + "****" if len(self.client_id) > 4 else "****"
            )
            logger.info(f"Initializing DhanHQ client with ID: {masked_id}")

            self._dhan = dhanhq(self.client_id, self.access_token)

        except ImportError:
            raise ProviderError(
                self.provider_name,
                "dhanhq package not installed. Install with: pip install dhanhq",
            )
        except Exception as e:
            raise AuthenticationError(
                self.provider_name, f"Failed to initialize DhanHQ client: {str(e)}"
            )

    async def _rate_limit(self):
        """
        Enforce rate limiting of 1 request per second.
        Waits if necessary before allowing the next API call.
        """
        current_time = time.time()
        elapsed = current_time - self._last_request_time
        if elapsed < self.RATE_LIMIT_SECONDS:
            wait_time = self.RATE_LIMIT_SECONDS - elapsed
            await asyncio.sleep(wait_time)
        self._last_request_time = time.time()

    @property
    def provider_name(self) -> str:
        return "DhanHQ"

    @property
    def supported_exchanges(self) -> List[Exchange]:
        return [Exchange.MCX, Exchange.NSE, Exchange.BSE]

    @property
    def supported_intervals(self) -> List[str]:
        return ["1m", "5m", "15m", "25m", "60m", "1d"]

    @property
    def max_history_days(self) -> int:
        return 365  # DhanHQ supports up to 1 year of historical data

    def _get_security_id(self, symbol: str) -> int:
        """
        Get security ID for a symbol.

        Args:
            symbol: Commodity symbol (e.g., "GOLD", "SILVER")

        Returns:
            Security ID as integer
        """
        symbol_upper = symbol.upper()

        # Check custom security map first (populated from instrument list)
        if symbol_upper in self._security_map:
            return int(self._security_map[symbol_upper])

        # Fall back to default mapping
        if symbol_upper in self.MCX_SECURITY_IDS:
            return int(self.MCX_SECURITY_IDS[symbol_upper])

        raise SymbolNotFoundError(
            self.provider_name, f"Security ID not found for symbol: {symbol}"
        )

    async def fetch_security_list(
        self, exchange_segment: str = "MCX_COMM"
    ) -> List[Dict]:
        """
        Fetch instrument list from DhanHQ.

        Args:
            exchange_segment: Exchange segment to fetch

        Returns:
            List of instrument dictionaries
        """
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            # Run synchronous DhanHQ call in executor
            result = await loop.run_in_executor(
                None, partial(self._dhan.fetch_security_list, "compact")
            )

            # Handle DataFrame response (newer dhanhq versions return DataFrame)
            instruments = []
            if hasattr(result, "to_dict"):
                # It's a DataFrame
                instruments = result.to_dict("records")
            elif isinstance(result, list):
                instruments = result
            else:
                # Try to convert to list
                instruments = list(result) if result else []

            # Note: We don't auto-populate _security_map from fetch_security_list
            # because there are multiple contracts per symbol (options, different expiries)
            # and the last one would overwrite the correct one.
            # Use MCX_SECURITY_IDS for known symbols, or manually add to _security_map.

            self._instruments_loaded = True
            return instruments

        except Exception as e:
            logger.error(f"Failed to fetch security list: {e}")
            raise ProviderError(
                self.provider_name, f"Failed to fetch security list: {e}"
            )

    async def get_price(
        self, symbol: str, currency: str = "INR", exchange: Optional[Exchange] = None
    ) -> PriceData:
        """
        Get current price for an MCX commodity.

        Args:
            symbol: Commodity symbol (e.g., "GOLDM", "SILVER")
            currency: Always INR for MCX
            exchange: Should be MCX for commodities

        Returns:
            PriceData with current price
        """
        security_id = self._get_security_id(symbol)
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            # Use quote_data for full market data
            securities = {self.MCX_SEGMENT: [security_id]}

            result = await loop.run_in_executor(
                None, partial(self._dhan.quote_data, securities=securities)
            )

            if not result or result.get("status") != "success":
                remarks = result.get("remarks", {})
                if isinstance(remarks, dict):
                    error_msg = remarks.get("error_message", "Unknown error")
                else:
                    error_msg = str(remarks) if remarks else "Unknown error"

                # Check for rate limiting in nested data
                nested_data = result.get("data", {}).get("data", {})
                if isinstance(nested_data, dict):
                    for key, val in nested_data.items():
                        if isinstance(val, str) and "too many requests" in val.lower():
                            from .base import RateLimitError

                            raise RateLimitError(self.provider_name, val)

                raise DataNotAvailableError(
                    self.provider_name, f"No data returned for {symbol}: {error_msg}"
                )

            # Response structure: data.data.MCX_COMM.{security_id}
            data = result.get("data", {}).get("data", {})
            # Security ID in response is a string key
            quote = data.get(self.MCX_SEGMENT, {}).get(str(security_id), {})

            if not quote:
                raise DataNotAvailableError(
                    self.provider_name, f"Quote not found for {symbol}"
                )

            ltp = Decimal(str(quote.get("last_price", 0)))

            return PriceData(
                symbol=symbol.upper(),
                price=ltp,
                currency="INR",
                timestamp=datetime.now(),
                exchange=Exchange.MCX,
                unit="10g" if "GOLD" in symbol.upper() else "kg",
                bid=Decimal(str(quote.get("best_bid_price", 0)))
                if quote.get("best_bid_price")
                else None,
                ask=Decimal(str(quote.get("best_ask_price", 0)))
                if quote.get("best_ask_price")
                else None,
                change=Decimal(str(quote.get("change", 0)))
                if quote.get("change")
                else None,
                change_percent=float(quote.get("change_percent", 0))
                if quote.get("change_percent")
                else None,
                provider=self.provider_name,
                raw_data=quote,
            )

        except (SymbolNotFoundError, DataNotAvailableError):
            raise
        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get price: {e}")

    async def get_multiple_prices(
        self, symbols: List[str], currency: str = "INR"
    ) -> List[PriceData]:
        """
        Get current prices for multiple MCX commodities.

        Args:
            symbols: List of commodity symbols
            currency: Always INR for MCX

        Returns:
            List of PriceData objects
        """
        security_ids = [self._get_security_id(s) for s in symbols]
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            securities = {self.MCX_SEGMENT: security_ids}

            result = await loop.run_in_executor(
                None, partial(self._dhan.quote_data, securities=securities)
            )

            # Check for rate limiting in response
            if result.get("status") != "success":
                nested_data = result.get("data", {}).get("data", {})
                if isinstance(nested_data, dict):
                    for key, val in nested_data.items():
                        if isinstance(val, str) and "too many requests" in val.lower():
                            from .base import RateLimitError

                            raise RateLimitError(self.provider_name, val)

            results = []
            # Response structure: data.data.MCX_COMM.{security_id}
            data = result.get("data", {}).get("data", {}).get(self.MCX_SEGMENT, {})

            for symbol, security_id in zip(symbols, security_ids):
                quote = data.get(str(security_id), {})
                if quote and isinstance(quote, dict):
                    results.append(
                        PriceData(
                            symbol=symbol.upper(),
                            price=Decimal(str(quote.get("last_price", 0))),
                            currency="INR",
                            timestamp=datetime.now(),
                            exchange=Exchange.MCX,
                            unit="10g" if "GOLD" in symbol.upper() else "kg",
                            provider=self.provider_name,
                            raw_data=quote,
                        )
                    )

            return results

        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get prices: {e}")

    async def get_ohlc(
        self, symbol: str, date: date, currency: str = "INR"
    ) -> OHLCData:
        """
        Get OHLC data for a specific date.

        Args:
            symbol: Commodity symbol
            date: Date for OHLC data
            currency: Always INR for MCX

        Returns:
            OHLCData object
        """
        security_id = self._get_security_id(symbol)
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            securities = {self.MCX_SEGMENT: [security_id]}

            result = await loop.run_in_executor(
                None, partial(self._dhan.ohlc_data, securities=securities)
            )

            # Response structure: data.data.MCX_COMM.{security_id}
            data = (
                result.get("data", {})
                .get("data", {})
                .get(self.MCX_SEGMENT, {})
                .get(str(security_id), {})
            )

            return OHLCData(
                symbol=symbol.upper(),
                open=Decimal(str(data.get("open", 0))),
                high=Decimal(str(data.get("high", 0))),
                low=Decimal(str(data.get("low", 0))),
                close=Decimal(str(data.get("close", 0))),
                timestamp=datetime.combine(date, datetime.min.time()),
                currency="INR",
                exchange=Exchange.MCX,
                volume=int(data.get("volume", 0)) if data.get("volume") else None,
                provider=self.provider_name,
            )

        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get OHLC: {e}")

    async def get_historical_data(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "1d",
        currency: str = "INR",
    ) -> HistoricalData:
        """
        Get historical daily data.

        Args:
            symbol: Commodity symbol
            start_date: Start date
            end_date: End date
            interval: Only "1d" for daily data
            currency: Always INR for MCX

        Returns:
            HistoricalData with daily data points
        """
        security_id = self._get_security_id(symbol)
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            from_date = start_date.strftime("%Y-%m-%d")
            to_date = end_date.strftime("%Y-%m-%d")

            # Log the request for debugging
            logger.debug(
                f"Fetching historical data for {symbol} (security_id={security_id}) from {from_date} to {to_date}"
            )

            result = await loop.run_in_executor(
                None,
                partial(
                    self._dhan.historical_daily_data,
                    security_id=str(security_id),  # Historical API expects string
                    exchange_segment=self.MCX_SEGMENT,
                    instrument_type=self.INSTRUMENT_TYPE,
                    from_date=from_date,
                    to_date=to_date,
                ),
            )

            logger.debug(
                f"Historical data response type: {type(result)}, content: {str(result)[:200] if result else 'None'}"
            )

            # Handle error responses
            if result is None:
                raise DataNotAvailableError(
                    self.provider_name, f"No data returned for {symbol}"
                )

            if isinstance(result, str):
                raise AuthenticationError(self.provider_name, f"API error: {result}")

            if not isinstance(result, dict):
                raise ProviderError(
                    self.provider_name, f"Unexpected response type: {type(result)}"
                )

            # Check for API error status
            if result.get("status") == "failure" or result.get("errorCode"):
                error_msg = result.get(
                    "remarks", result.get("errorMessage", "Unknown error")
                )
                raise AuthenticationError(self.provider_name, f"API error: {error_msg}")

            data_points = []
            data = result.get("data", {})

            # DhanHQ returns data as parallel arrays: open[], high[], low[], close[], volume[], timestamp[]
            opens = data.get("open", [])
            highs = data.get("high", [])
            lows = data.get("low", [])
            closes = data.get("close", [])
            volumes = data.get("volume", [])
            timestamps = data.get("timestamp", [])

            for i in range(len(opens)):
                # Convert timestamp (Unix epoch) to date
                ts = timestamps[i] if i < len(timestamps) else 0
                candle_date = datetime.fromtimestamp(ts).date() if ts else start_date

                data_points.append(
                    HistoricalDataPoint(
                        date=candle_date,
                        open=Decimal(str(opens[i])) if i < len(opens) else Decimal("0"),
                        high=Decimal(str(highs[i])) if i < len(highs) else Decimal("0"),
                        low=Decimal(str(lows[i])) if i < len(lows) else Decimal("0"),
                        close=Decimal(str(closes[i]))
                        if i < len(closes)
                        else Decimal("0"),
                        volume=int(volumes[i])
                        if i < len(volumes) and volumes[i]
                        else None,
                    )
                )

            return HistoricalData(
                symbol=symbol.upper(),
                currency="INR",
                exchange=Exchange.MCX,
                data_points=data_points,
                start_date=start_date,
                end_date=end_date,
                interval=interval,
                provider=self.provider_name,
            )

        except Exception as e:
            raise ProviderError(
                self.provider_name, f"Failed to get historical data: {e}"
            )

    async def get_intraday_data(
        self, symbol: str, date: date, interval: str = "1m"
    ) -> HistoricalData:
        """
        Get intraday minute data.

        Args:
            symbol: Commodity symbol
            date: Date for intraday data
            interval: Time interval (1m, 5m, 15m, 25m, 60m)

        Returns:
            HistoricalData with intraday data points
        """
        security_id = self._get_security_id(symbol)
        loop = asyncio.get_event_loop()

        try:
            # Apply rate limiting
            await self._rate_limit()

            from_date = date.strftime("%Y-%m-%d")
            to_date = date.strftime("%Y-%m-%d")

            result = await loop.run_in_executor(
                None,
                partial(
                    self._dhan.intraday_minute_data,
                    security_id=security_id,
                    exchange_segment=self.MCX_SEGMENT,
                    instrument_type=self.INSTRUMENT_TYPE,
                    from_date=from_date,
                    to_date=to_date,
                ),
            )

            data_points = []
            candles = result.get("data", [])

            for candle in candles:
                timestamp = candle.get("start_Time", 0)
                if isinstance(timestamp, str):
                    dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
                else:
                    dt = datetime.fromtimestamp(timestamp)

                data_points.append(
                    HistoricalDataPoint(
                        date=dt.date(),
                        open=Decimal(str(candle.get("open", 0))),
                        high=Decimal(str(candle.get("high", 0))),
                        low=Decimal(str(candle.get("low", 0))),
                        close=Decimal(str(candle.get("close", 0))),
                        volume=int(candle.get("volume", 0))
                        if candle.get("volume")
                        else None,
                    )
                )

            return HistoricalData(
                symbol=symbol.upper(),
                currency="INR",
                exchange=Exchange.MCX,
                data_points=data_points,
                start_date=date,
                end_date=date,
                interval=interval,
                provider=self.provider_name,
            )

        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get intraday data: {e}")

    async def get_option_chain(
        self, underlying_symbol: str, expiry_date: str
    ) -> Dict[str, Any]:
        """
        Get option chain for MCX commodity.

        Args:
            underlying_symbol: Underlying commodity symbol
            expiry_date: Expiry date in YYYY-MM-DD format

        Returns:
            Option chain data
        """
        security_id = self._get_security_id(underlying_symbol)
        loop = asyncio.get_event_loop()

        try:
            result = await loop.run_in_executor(
                None,
                partial(
                    self._dhan.option_chain,
                    under_security_id=int(security_id),
                    under_exchange_segment=self.MCX_SEGMENT,
                    expiry=expiry_date,
                ),
            )

            return result

        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get option chain: {e}")
