"""
Financial Modeling Prep (FMP) COT Provider Implementation.

This provider fetches Commitment of Traders (COT) data from Financial Modeling Prep API.

Supported features:
- COT Report List (available symbols)
- COT Report by symbol
- COT Analysis by date range
- COT Analysis by symbol

API Documentation: https://site.financialmodelingprep.com/developer/docs
"""

import httpx
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import logging

from .base import (
    ProviderError,
    RateLimitError,
    AuthenticationError,
    DataNotAvailableError,
)

logger = logging.getLogger(__name__)


@dataclass
class COTReportEntry:
    """
    Single COT report entry.
    """

    symbol: str
    date: datetime
    name: str
    sector: str
    exchange: str
    open_interest: int
    change: int
    change_open_interest: Optional[int] = None
    # Non-commercial positions
    non_commercial_long: Optional[int] = None
    non_commercial_short: Optional[int] = None
    # Commercial positions
    commercial_long: Optional[int] = None
    commercial_short: Optional[int] = None
    # Non-reportable positions
    non_reportable_long: Optional[int] = None
    non_reportable_short: Optional[int] = None
    # Net positions
    net_non_commercial: Optional[int] = None
    net_commercial: Optional[int] = None
    # Raw data
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class COTAnalysis:
    """
    COT analysis data with sentiment indicators.
    """

    symbol: str
    date: datetime
    name: str
    sector: str
    exchange: str
    # Current market situation
    current_long_market_situation: float
    current_short_market_situation: float
    market_situation: str  # "Bullish", "Bearish", "Neutral"
    # Previous market situation
    previous_long_market_situation: float
    previous_short_market_situation: float
    previous_market_situation: str
    # Net positions
    net_position: int
    previous_net_position: int
    change_in_net_position: float
    # Sentiment
    market_sentiment: str  # "Increasing Bullish", "Decreasing Bullish", etc.
    reversal_trend: bool
    # Raw data
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class COTSymbol:
    """
    Available COT symbol.
    """

    symbol: str
    name: str


class FMPCOTProvider:
    """
    Financial Modeling Prep COT data provider.

    Usage:
        provider = FMPCOTProvider(api_key="your_api_key")

        # Get list of available COT symbols
        symbols = await provider.get_cot_list()

        # Get COT report for a symbol
        report = await provider.get_cot_report("GC")  # Gold

        # Get COT analysis for date range
        analysis = await provider.get_cot_analysis_by_dates(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            symbol="GC"
        )

    Common Symbols:
        - GC: Gold
        - SI: Silver
        - CL: Crude Oil
        - NG: Natural Gas
        - HG: Copper
    """

    # API endpoints
    BASE_URL = "https://financialmodelingprep.com"

    # Stable API endpoints (recommended)
    STABLE_COT_LIST = "/stable/commitment-of-traders-list"
    STABLE_COT_REPORT = "/stable/commitment-of-traders-report"
    STABLE_COT_ANALYSIS = "/stable/commitment-of-traders-analysis"

    # Legacy v4 endpoints
    V4_COT_REPORT = "/api/v4/commitment_of_traders_report"
    V4_COT_ANALYSIS = "/api/v4/commitment_of_traders_report_analysis"
    V4_COT_LIST = "/api/v4/commitment_of_traders_report/list"

    # Legacy v3 endpoint
    V3_COT = "/api/v3/cot"

    def __init__(
        self, api_key: str, timeout: float = 30.0, use_stable_api: bool = True
    ):
        """
        Initialize FMP COT provider.

        Args:
            api_key: Your FMP API key
            timeout: Request timeout in seconds
            use_stable_api: Use stable API endpoints (recommended)
        """
        self.api_key = api_key
        self.timeout = timeout
        self.use_stable_api = use_stable_api
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_name(self) -> str:
        return "FinancialModelingPrep"

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self):
        """Close the HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Make authenticated request to FMP API.

        Args:
            endpoint: API endpoint
            params: Query parameters

        Returns:
            JSON response

        Raises:
            ProviderError: On API errors
        """
        client = await self._get_client()

        # Add API key to params
        if params is None:
            params = {}
        params["apikey"] = self.api_key

        url = f"{self.BASE_URL}{endpoint}"

        try:
            response = await client.get(url, params=params)

            # Check for HTTP errors
            if response.status_code == 401:
                raise AuthenticationError(self.provider_name, "Invalid API key")
            elif response.status_code == 429:
                raise RateLimitError(self.provider_name, "Rate limit exceeded")
            elif response.status_code != 200:
                raise ProviderError(
                    self.provider_name, f"HTTP {response.status_code}: {response.text}"
                )

            data = response.json()

            # Check for API error response
            if isinstance(data, dict) and "Error Message" in data:
                raise ProviderError(self.provider_name, data["Error Message"])

            return data

        except httpx.HTTPError as e:
            raise ProviderError(self.provider_name, f"HTTP error: {str(e)}", e)

    async def get_cot_list(self) -> List[COTSymbol]:
        """
        Get list of available COT symbols.

        Returns:
            List of COTSymbol objects
        """
        if self.use_stable_api:
            endpoint = self.STABLE_COT_LIST
        else:
            endpoint = self.V4_COT_LIST

        data = await self._make_request(endpoint)

        if not data:
            return []

        symbols = []
        for item in data:
            symbols.append(
                COTSymbol(
                    symbol=item.get("symbol") or item.get("trading_symbol", ""),
                    name=item.get("name") or item.get("short_name", ""),
                )
            )

        return symbols

    async def get_cot_report(
        self,
        symbol: str,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> List[COTReportEntry]:
        """
        Get COT report for a symbol.

        Args:
            symbol: COT symbol (e.g., "GC" for Gold)
            from_date: Optional start date
            to_date: Optional end date

        Returns:
            List of COTReportEntry objects
        """
        params: Dict[str, Any] = {"symbol": symbol}

        if from_date:
            params["from"] = from_date.strftime("%Y-%m-%d")
        if to_date:
            params["to"] = to_date.strftime("%Y-%m-%d")

        if self.use_stable_api:
            endpoint = self.STABLE_COT_REPORT
        else:
            endpoint = f"{self.V4_COT_REPORT}/{symbol}"
            params.pop("symbol", None)

        data = await self._make_request(endpoint, params)

        if not data:
            raise DataNotAvailableError(
                self.provider_name, f"No COT data available for {symbol}"
            )

        # Handle different response formats
        if isinstance(data, dict) and "data" in data:
            entries = data["data"]
        elif isinstance(data, list):
            entries = data
        else:
            entries = [data]

        reports = []
        for entry in entries:
            try:
                report_date = entry.get("date", "")
                if isinstance(report_date, str):
                    # Handle different date formats
                    if " " in report_date:
                        report_date = datetime.strptime(
                            report_date, "%Y-%m-%d %H:%M:%S"
                        )
                    else:
                        report_date = datetime.strptime(report_date, "%Y-%m-%d")

                reports.append(
                    COTReportEntry(
                        symbol=entry.get("symbol", symbol),
                        date=report_date,
                        name=entry.get("name", ""),
                        sector=entry.get("sector", ""),
                        exchange=entry.get("exchange", ""),
                        open_interest=int(
                            entry.get("openInterest") or entry.get("open_interest") or 0
                        ),
                        change=int(entry.get("change") or 0),
                        change_open_interest=int(
                            entry.get("changeOpenInterest")
                            or entry.get("change_in_open_interest")
                            or 0
                        )
                        if entry.get("changeOpenInterest")
                        or entry.get("change_in_open_interest")
                        else None,
                        non_commercial_long=int(
                            entry.get("nonCommercialLong")
                            or entry.get("non_commercial_long_open_interest")
                            or 0
                        )
                        if entry.get("nonCommercialLong")
                        or entry.get("non_commercial_long_open_interest")
                        else None,
                        non_commercial_short=int(
                            entry.get("nonCommercialShort")
                            or entry.get("non_commercial_short_open_interest")
                            or 0
                        )
                        if entry.get("nonCommercialShort")
                        or entry.get("non_commercial_short_open_interest")
                        else None,
                        commercial_long=int(
                            entry.get("commercialLong")
                            or entry.get("commercial_long_open_interest")
                            or 0
                        )
                        if entry.get("commercialLong")
                        or entry.get("commercial_long_open_interest")
                        else None,
                        commercial_short=int(
                            entry.get("commercialShort")
                            or entry.get("commercial_short_open_interest")
                            or 0
                        )
                        if entry.get("commercialShort")
                        or entry.get("commercial_short_open_interest")
                        else None,
                        non_reportable_long=int(
                            entry.get("non_reportable_long_open_interest") or 0
                        )
                        if entry.get("non_reportable_long_open_interest")
                        else None,
                        non_reportable_short=int(
                            entry.get("non_reportable_short_open_interest") or 0
                        )
                        if entry.get("non_reportable_short_open_interest")
                        else None,
                        net_non_commercial=int(entry.get("net_non_commercial") or 0)
                        if entry.get("net_non_commercial")
                        else None,
                        net_commercial=int(entry.get("net_commercial") or 0)
                        if entry.get("net_commercial")
                        else None,
                        raw_data=entry,
                    )
                )
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse COT entry: {e}")
                continue

        return reports

    async def get_cot_analysis_by_dates(
        self, start_date: date, end_date: date, symbol: Optional[str] = None
    ) -> List[COTAnalysis]:
        """
        Get COT analysis for a date range.

        Args:
            start_date: Start date for analysis
            end_date: End date for analysis (max 90 days from start)
            symbol: Optional symbol filter

        Returns:
            List of COTAnalysis objects
        """
        params: Dict[str, Any] = {
            "startDate" if self.use_stable_api else "from": start_date.strftime(
                "%Y-%m-%d"
            ),
            "endDate" if self.use_stable_api else "to": end_date.strftime("%Y-%m-%d"),
        }

        if symbol:
            params["symbol"] = symbol

        if self.use_stable_api:
            endpoint = self.STABLE_COT_ANALYSIS
        else:
            endpoint = self.V4_COT_ANALYSIS

        data = await self._make_request(endpoint, params)

        if not data:
            return []

        analyses = []
        for entry in data:
            try:
                report_date = entry.get("date", "")
                if isinstance(report_date, str):
                    if " " in report_date:
                        report_date = datetime.strptime(
                            report_date, "%Y-%m-%d %H:%M:%S"
                        )
                    else:
                        report_date = datetime.strptime(report_date, "%Y-%m-%d")

                analyses.append(
                    COTAnalysis(
                        symbol=entry.get("symbol", ""),
                        date=report_date,
                        name=entry.get("name", ""),
                        sector=entry.get("sector", ""),
                        exchange=entry.get("exchange", ""),
                        current_long_market_situation=float(
                            entry.get("currentLongMarketSituation", 0)
                        ),
                        current_short_market_situation=float(
                            entry.get("currentShortMarketSituation", 0)
                        ),
                        market_situation=entry.get("marketSituation", ""),
                        previous_long_market_situation=float(
                            entry.get("previousLongMarketSituation", 0)
                        ),
                        previous_short_market_situation=float(
                            entry.get("previousShortMarketSituation", 0)
                        ),
                        previous_market_situation=entry.get(
                            "previousMarketSituation", ""
                        ),
                        net_position=int(
                            entry.get("netPostion") or entry.get("netPosition") or 0
                        ),
                        previous_net_position=int(entry.get("previousNetPosition", 0)),
                        change_in_net_position=float(
                            entry.get("changeInNetPosition", 0)
                        ),
                        market_sentiment=entry.get("marketSentiment", ""),
                        reversal_trend=bool(entry.get("reversalTrend", False)),
                        raw_data=entry,
                    )
                )
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse COT analysis entry: {e}")
                continue

        return analyses

    async def get_cot_analysis_by_symbol(self, symbol: str) -> List[COTAnalysis]:
        """
        Get COT analysis for a specific symbol.

        Args:
            symbol: COT symbol

        Returns:
            List of COTAnalysis objects
        """
        endpoint = f"{self.V4_COT_ANALYSIS}/{symbol}"

        data = await self._make_request(endpoint)

        if not data:
            raise DataNotAvailableError(
                self.provider_name, f"No COT analysis available for {symbol}"
            )

        analyses = []
        for entry in data:
            try:
                report_date = entry.get("date", "")
                if isinstance(report_date, str):
                    if " " in report_date:
                        report_date = datetime.strptime(
                            report_date, "%Y-%m-%d %H:%M:%S"
                        )
                    else:
                        report_date = datetime.strptime(report_date, "%Y-%m-%d")

                analyses.append(
                    COTAnalysis(
                        symbol=entry.get("symbol", symbol),
                        date=report_date,
                        name=entry.get("name", ""),
                        sector=entry.get("sector", ""),
                        exchange=entry.get("exchange", ""),
                        current_long_market_situation=float(
                            entry.get("currentLongMarketSituation", 0)
                        ),
                        current_short_market_situation=float(
                            entry.get("currentShortMarketSituation", 0)
                        ),
                        market_situation=entry.get("marketSituation", ""),
                        previous_long_market_situation=float(
                            entry.get("previousLongMarketSituation", 0)
                        ),
                        previous_short_market_situation=float(
                            entry.get("previousShortMarketSituation", 0)
                        ),
                        previous_market_situation=entry.get(
                            "previousMarketSituation", ""
                        ),
                        net_position=int(
                            entry.get("netPostion") or entry.get("netPosition") or 0
                        ),
                        previous_net_position=int(entry.get("previousNetPosition", 0)),
                        change_in_net_position=float(
                            entry.get("changeInNetPosition", 0)
                        ),
                        market_sentiment=entry.get("marketSentiment", ""),
                        reversal_trend=bool(entry.get("reversalTrend", False)),
                        raw_data=entry,
                    )
                )
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse COT analysis entry: {e}")
                continue

        return analyses

    async def health_check(self) -> bool:
        """Check if the provider is available"""
        try:
            symbols = await self.get_cot_list()
            return len(symbols) > 0
        except Exception:
            return False
