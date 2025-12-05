"""
Yahoo Finance Provider Implementation.

This provider fetches COMEX and global market data using the yfinance library.

Supported features:
- COMEX Gold/Silver futures prices
- Historical daily/intraday data
- Multiple intervals (1m to 1mo)
- Stock/ETF/Index data

Library: https://github.com/ranaroussi/yfinance
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
import logging
import asyncio
import math
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
    DataNotAvailableError,
)

logger = logging.getLogger(__name__)


class YahooFinanceProvider(BasePriceProvider, BaseHistoricalDataProvider):
    """
    Yahoo Finance provider for COMEX and global market data.

    Usage:
        provider = YahooFinanceProvider()
        price = await provider.get_price("GC=F", "USD")  # Gold Futures

    Common COMEX Symbols:
        - GC=F: Gold Futures
        - SI=F: Silver Futures
        - HG=F: Copper Futures
        - PL=F: Platinum Futures
        - PA=F: Palladium Futures
        - CL=F: Crude Oil Futures
        - NG=F: Natural Gas Futures

    ETF Symbols:
        - GLD: SPDR Gold Trust
        - SLV: iShares Silver Trust
        - IAU: iShares Gold Trust
    """

    # Symbol mapping for common names to Yahoo Finance tickers
    SYMBOL_MAP = {
        # COMEX Futures
        "GOLD": "GC=F",
        "SILVER": "SI=F",
        "COPPER": "HG=F",
        "PLATINUM": "PL=F",
        "PALLADIUM": "PA=F",
        "CRUDE": "CL=F",
        "CRUDEOIL": "CL=F",
        "NATURALGAS": "NG=F",
        # Direct futures symbols
        "GC=F": "GC=F",
        "SI=F": "SI=F",
        "HG=F": "HG=F",
        "PL=F": "PL=F",
        "PA=F": "PA=F",
        "CL=F": "CL=F",
        "NG=F": "NG=F",
        # ETFs
        "GLD": "GLD",
        "SLV": "SLV",
        "IAU": "IAU",
        # Forex
        "USDINR": "USDINR=X",
        "EURUSD": "EURUSD=X",
        "GBPUSD": "GBPUSD=X",
        # Metal symbols
        "XAU": "GC=F",
        "XAG": "SI=F",
        "XPT": "PL=F",
        "XPD": "PA=F",
    }

    # Valid intervals for yfinance
    VALID_INTERVALS = [
        "1m",
        "2m",
        "5m",
        "15m",
        "30m",
        "60m",
        "90m",
        "1h",
        "1d",
        "5d",
        "1wk",
        "1mo",
        "3mo",
    ]

    def __init__(self):
        """Initialize Yahoo Finance provider."""
        self._yf = None
        self._init_client()

    def _init_client(self):
        """Initialize yfinance"""
        try:
            import yfinance as yf

            self._yf = yf
        except ImportError:
            raise ProviderError(
                self.provider_name,
                "yfinance package not installed. Install with: pip install yfinance",
            )

    @property
    def provider_name(self) -> str:
        return "YahooFinance"

    @property
    def supported_exchanges(self) -> List[Exchange]:
        return [Exchange.COMEX, Exchange.GLOBAL, Exchange.NSE, Exchange.FOREX]

    @property
    def supported_intervals(self) -> List[str]:
        return self.VALID_INTERVALS

    @property
    def max_history_days(self) -> int:
        return 365 * 10  # Yahoo Finance supports up to 10 years for daily data

    def _normalize_symbol(self, symbol: str) -> str:
        """Convert common symbol names to Yahoo Finance format"""
        return self.SYMBOL_MAP.get(symbol.upper(), symbol.upper())

    def _get_ticker(self, symbol: str):
        """Get yfinance Ticker object"""
        normalized = self._normalize_symbol(symbol)
        return self._yf.Ticker(normalized)

    async def get_price(
        self, symbol: str, currency: str = "USD", exchange: Optional[Exchange] = None
    ) -> PriceData:
        """
        Get current price for a symbol.

        Args:
            symbol: Asset symbol (e.g., "GOLD", "GC=F", "GLD")
            currency: Target currency (note: Yahoo returns in native currency)
            exchange: Optional exchange hint

        Returns:
            PriceData with current price
        """
        loop = asyncio.get_event_loop()
        normalized_symbol = self._normalize_symbol(symbol)

        try:
            ticker = self._get_ticker(symbol)

            # Get ticker info in executor
            info = await loop.run_in_executor(None, lambda: ticker.info)

            if not info or "regularMarketPrice" not in info:
                # Try fast_info as fallback
                fast_info = await loop.run_in_executor(None, lambda: ticker.fast_info)
                if hasattr(fast_info, "last_price"):
                    price = Decimal(str(fast_info.last_price))
                else:
                    raise DataNotAvailableError(
                        self.provider_name, f"No price data available for {symbol}"
                    )
            else:
                price = Decimal(str(info.get("regularMarketPrice", 0)))

            # Determine exchange from symbol
            detected_exchange = Exchange.COMEX
            if "=X" in normalized_symbol:
                detected_exchange = Exchange.FOREX
            elif "=F" not in normalized_symbol:
                detected_exchange = Exchange.GLOBAL

            return PriceData(
                symbol=normalized_symbol,
                price=price,
                currency=info.get("currency", currency),
                timestamp=datetime.now(),
                exchange=exchange or detected_exchange,
                unit="contract" if "=F" in normalized_symbol else "share",
                bid=Decimal(str(info.get("bid", 0))) if info.get("bid") else None,
                ask=Decimal(str(info.get("ask", 0))) if info.get("ask") else None,
                change=Decimal(str(info.get("regularMarketChange", 0)))
                if info.get("regularMarketChange")
                else None,
                change_percent=float(info.get("regularMarketChangePercent", 0))
                if info.get("regularMarketChangePercent")
                else None,
                provider=self.provider_name,
                raw_data=info,
            )

        except DataNotAvailableError:
            raise
        except Exception as e:
            raise ProviderError(
                self.provider_name, f"Failed to get price for {symbol}: {e}"
            )

    async def get_multiple_prices(
        self, symbols: List[str], currency: str = "USD"
    ) -> List[PriceData]:
        """
        Get current prices for multiple symbols.

        Args:
            symbols: List of asset symbols
            currency: Target currency

        Returns:
            List of PriceData objects
        """
        loop = asyncio.get_event_loop()
        normalized_symbols = [self._normalize_symbol(s) for s in symbols]

        try:
            # Use yf.download for batch fetching
            data = await loop.run_in_executor(
                None,
                partial(
                    self._yf.download,
                    tickers=" ".join(normalized_symbols),
                    period="1d",
                    progress=False,
                ),
            )

            results = []
            for orig_symbol, norm_symbol in zip(symbols, normalized_symbols):
                try:
                    if len(normalized_symbols) == 1:
                        close_price = data["Close"].iloc[-1]
                    else:
                        close_price = data["Close"][norm_symbol].iloc[-1]

                    results.append(
                        PriceData(
                            symbol=norm_symbol,
                            price=Decimal(str(close_price)),
                            currency=currency,
                            timestamp=datetime.now(),
                            exchange=Exchange.COMEX
                            if "=F" in norm_symbol
                            else Exchange.GLOBAL,
                            unit="contract" if "=F" in norm_symbol else "share",
                            provider=self.provider_name,
                        )
                    )
                except Exception as e:
                    logger.warning(f"Failed to get price for {norm_symbol}: {e}")

            return results

        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get prices: {e}")

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
        loop = asyncio.get_event_loop()
        normalized_symbol = self._normalize_symbol(symbol)

        try:
            # Fetch data for the specific date range
            start = date
            end = date + timedelta(days=1)

            data = await loop.run_in_executor(
                None,
                partial(
                    self._yf.download,
                    tickers=normalized_symbol,
                    start=start.strftime("%Y-%m-%d"),
                    end=end.strftime("%Y-%m-%d"),
                    progress=False,
                ),
            )

            if data.empty:
                raise DataNotAvailableError(
                    self.provider_name, f"No data available for {symbol} on {date}"
                )

            row = data.iloc[0]

            return OHLCData(
                symbol=normalized_symbol,
                open=Decimal(str(row["Open"])),
                high=Decimal(str(row["High"])),
                low=Decimal(str(row["Low"])),
                close=Decimal(str(row["Close"])),
                timestamp=datetime.combine(date, datetime.min.time()),
                currency=currency,
                exchange=Exchange.COMEX
                if "=F" in normalized_symbol
                else Exchange.GLOBAL,
                volume=int(row["Volume"]) if row["Volume"] else None,
                provider=self.provider_name,
            )

        except DataNotAvailableError:
            raise
        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get OHLC: {e}")

    async def get_historical_data(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "1d",
        currency: str = "USD",
    ) -> HistoricalData:
        """
        Get historical price data.

        Args:
            symbol: Asset symbol
            start_date: Start date
            end_date: End date
            interval: Time interval (1d, 1h, 15m, etc.)
            currency: Target currency

        Returns:
            HistoricalData with data points
        """
        loop = asyncio.get_event_loop()
        normalized_symbol = self._normalize_symbol(symbol)

        if interval not in self.VALID_INTERVALS:
            raise ProviderError(
                self.provider_name,
                f"Invalid interval: {interval}. Valid: {self.VALID_INTERVALS}",
            )

        try:
            data = await loop.run_in_executor(
                None,
                partial(
                    self._yf.download,
                    tickers=normalized_symbol,
                    start=start_date.strftime("%Y-%m-%d"),
                    end=(end_date + timedelta(days=1)).strftime("%Y-%m-%d"),
                    interval=interval,
                    progress=False,
                ),
            )

            if data.empty:
                raise DataNotAvailableError(
                    self.provider_name, f"No historical data available for {symbol}"
                )

            data_points = []
            for idx, row in data.iterrows():
                # Handle both DatetimeIndex and regular index
                if hasattr(idx, "date"):
                    point_date = idx.date()
                else:
                    point_date = idx

                # Skip rows with NaN values
                try:
                    # Handle both scalar and Series values
                    open_raw = row["Open"]
                    close_raw = row["Close"]
                    open_val = (
                        float(open_raw.iloc[0])
                        if hasattr(open_raw, "iloc")
                        else float(open_raw)
                    )
                    close_val = (
                        float(close_raw.iloc[0])
                        if hasattr(close_raw, "iloc")
                        else float(close_raw)
                    )
                    if math.isnan(open_val) or math.isnan(close_val):
                        continue
                except (ValueError, TypeError, IndexError):
                    continue

                # Extract scalar values for all fields
                def get_scalar(val):
                    if hasattr(val, "iloc"):
                        return val.iloc[0]
                    return val

                try:
                    high_val = get_scalar(row["High"])
                    low_val = get_scalar(row["Low"])
                    volume_raw = (
                        get_scalar(row["Volume"]) if "Volume" in row.index else None
                    )
                    adj_close_raw = (
                        get_scalar(row["Adj Close"])
                        if "Adj Close" in row.index
                        else None
                    )

                    data_points.append(
                        HistoricalDataPoint(
                            date=point_date,
                            open=Decimal(str(open_val)),
                            high=Decimal(str(high_val)),
                            low=Decimal(str(low_val)),
                            close=Decimal(str(close_val)),
                            volume=int(volume_raw)
                            if volume_raw and not math.isnan(volume_raw)
                            else None,
                            adjusted_close=Decimal(str(adj_close_raw))
                            if adj_close_raw and not math.isnan(adj_close_raw)
                            else None,
                        )
                    )
                except (ValueError, TypeError):
                    continue

            return HistoricalData(
                symbol=normalized_symbol,
                currency=currency,
                exchange=Exchange.COMEX
                if "=F" in normalized_symbol
                else Exchange.GLOBAL,
                data_points=data_points,
                start_date=start_date,
                end_date=end_date,
                interval=interval,
                provider=self.provider_name,
            )

        except DataNotAvailableError:
            raise
        except Exception as e:
            raise ProviderError(
                self.provider_name, f"Failed to get historical data: {e}"
            )

    async def get_intraday_data(
        self, symbol: str, date: date, interval: str = "1m"
    ) -> HistoricalData:
        """
        Get intraday data for a specific date.

        Note: Yahoo Finance only keeps 7 days of 1m data, 60 days of 2m-90m data.

        Args:
            symbol: Asset symbol
            date: Date for intraday data
            interval: Time interval (1m, 5m, 15m, etc.)

        Returns:
            HistoricalData with intraday data points
        """
        # For intraday, we need to use period instead of date range for recent data
        return await self.get_historical_data(
            symbol=symbol, start_date=date, end_date=date, interval=interval
        )

    async def get_ticker_info(self, symbol: str) -> Dict[str, Any]:
        """
        Get detailed ticker information.

        Args:
            symbol: Asset symbol

        Returns:
            Dictionary with ticker info
        """
        loop = asyncio.get_event_loop()
        ticker = self._get_ticker(symbol)

        try:
            info = await loop.run_in_executor(None, lambda: ticker.info)
            return info
        except Exception as e:
            raise ProviderError(self.provider_name, f"Failed to get ticker info: {e}")

    async def get_forex_rate(self, from_currency: str, to_currency: str) -> Decimal:
        """
        Get forex exchange rate.

        Args:
            from_currency: Base currency (e.g., "USD")
            to_currency: Quote currency (e.g., "INR")

        Returns:
            Exchange rate
        """
        symbol = f"{from_currency}{to_currency}=X"
        price_data = await self.get_price(symbol)
        return price_data.price
