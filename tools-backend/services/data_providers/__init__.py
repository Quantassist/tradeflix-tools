# Data Providers Package
# Provider-agnostic architecture for easy switching between data sources

from .base import (
    BasePriceProvider,
    BaseHistoricalDataProvider,
    PriceData,
    OHLCData,
    HistoricalData,
    HistoricalDataPoint,
    ProviderError,
    RateLimitError,
    AuthenticationError,
    SymbolNotFoundError,
    DataNotAvailableError,
)
from .factory import (
    DataProviderFactory,
    get_data_provider_factory,
    configure_providers_from_settings,
)
from .metal_price_api import MetalPriceAPIProvider
from .dhanhq_provider import DhanHQProvider
from .yahoo_finance_provider import YahooFinanceProvider
from .fmp_cot_provider import FMPCOTProvider, COTReportEntry, COTAnalysis, COTSymbol

__all__ = [
    # Base classes
    "BasePriceProvider",
    "BaseHistoricalDataProvider",
    "PriceData",
    "OHLCData",
    "HistoricalData",
    "HistoricalDataPoint",
    # Errors
    "ProviderError",
    "RateLimitError",
    "AuthenticationError",
    "SymbolNotFoundError",
    "DataNotAvailableError",
    # Factory
    "DataProviderFactory",
    "get_data_provider_factory",
    "configure_providers_from_settings",
    # Providers
    "MetalPriceAPIProvider",
    "DhanHQProvider",
    "YahooFinanceProvider",
    "FMPCOTProvider",
    # COT Data structures
    "COTReportEntry",
    "COTAnalysis",
    "COTSymbol",
]
