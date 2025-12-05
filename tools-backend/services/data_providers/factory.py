"""
Data Provider Factory.

This module provides a factory pattern for creating and managing data providers.
It allows easy switching between providers without changing consuming code.

Usage:
    # Configure providers
    factory = DataProviderFactory()
    factory.configure_metal_price_api(api_key="your_key")
    factory.configure_dhanhq(client_id="id", access_token="token")
    factory.configure_yahoo_finance()

    # Get providers by use case
    global_provider = factory.get_global_metal_provider()
    mcx_provider = factory.get_mcx_provider()
    comex_provider = factory.get_comex_provider()

    # Or get by name
    provider = factory.get_provider("MetalPriceAPI")
"""

from typing import Optional, Dict, Union
from enum import Enum
import logging

from .base import (
    BasePriceProvider,
    BaseHistoricalDataProvider,
    Exchange,
    ProviderError,
)
from .metal_price_api import MetalPriceAPIProvider
from .dhanhq_provider import DhanHQProvider
from .yahoo_finance_provider import YahooFinanceProvider

logger = logging.getLogger(__name__)


class ProviderType(Enum):
    """Types of data providers"""

    METAL_PRICE_API = "MetalPriceAPI"
    DHANHQ = "DhanHQ"
    YAHOO_FINANCE = "YahooFinance"


class DataProviderFactory:
    """
    Factory for creating and managing data providers.

    This factory implements the Strategy pattern, allowing you to:
    1. Configure multiple providers
    2. Switch between providers easily
    3. Get the appropriate provider for specific use cases

    Example:
        factory = DataProviderFactory()

        # Configure providers (typically done at app startup)
        factory.configure_metal_price_api(api_key=settings.metal_price_api_key)
        factory.configure_dhanhq(
            client_id=settings.dhan_client_id,
            access_token=settings.dhan_access_token
        )
        factory.configure_yahoo_finance()

        # Use providers
        price = await factory.get_global_metal_provider().get_price("XAU", "USD")
        mcx_price = await factory.get_mcx_provider().get_price("GOLDM", "INR")
    """

    def __init__(self):
        """Initialize the factory with empty provider registry"""
        self._providers: Dict[ProviderType, BasePriceProvider] = {}
        self._default_providers: Dict[Exchange, ProviderType] = {
            Exchange.GLOBAL: ProviderType.METAL_PRICE_API,
            Exchange.MCX: ProviderType.DHANHQ,
            Exchange.COMEX: ProviderType.YAHOO_FINANCE,
            Exchange.FOREX: ProviderType.METAL_PRICE_API,
            Exchange.NSE: ProviderType.DHANHQ,
            Exchange.BSE: ProviderType.DHANHQ,
        }

    def configure_metal_price_api(
        self, api_key: str, timeout: float = 30.0
    ) -> "DataProviderFactory":
        """
        Configure MetalPriceAPI provider.

        Args:
            api_key: Your MetalPriceAPI API key
            timeout: Request timeout in seconds

        Returns:
            Self for method chaining
        """
        self._providers[ProviderType.METAL_PRICE_API] = MetalPriceAPIProvider(
            api_key=api_key, timeout=timeout
        )
        logger.info("MetalPriceAPI provider configured")
        return self

    def configure_dhanhq(
        self, client_id: str, access_token: str, auto_fetch_instruments: bool = True
    ) -> "DataProviderFactory":
        """
        Configure DhanHQ provider.

        Args:
            client_id: Your Dhan client ID
            access_token: Your Dhan access token
            auto_fetch_instruments: Whether to fetch instrument list on init

        Returns:
            Self for method chaining
        """
        self._providers[ProviderType.DHANHQ] = DhanHQProvider(
            client_id=client_id,
            access_token=access_token,
            auto_fetch_instruments=auto_fetch_instruments,
        )
        logger.info("DhanHQ provider configured")
        return self

    def configure_yahoo_finance(self) -> "DataProviderFactory":
        """
        Configure Yahoo Finance provider.

        Returns:
            Self for method chaining
        """
        self._providers[ProviderType.YAHOO_FINANCE] = YahooFinanceProvider()
        logger.info("Yahoo Finance provider configured")
        return self

    def set_default_provider(
        self, exchange: Exchange, provider_type: ProviderType
    ) -> "DataProviderFactory":
        """
        Set the default provider for an exchange.

        Args:
            exchange: The exchange to configure
            provider_type: The provider to use for this exchange

        Returns:
            Self for method chaining
        """
        if provider_type not in self._providers:
            raise ProviderError(
                "Factory", f"Provider {provider_type.value} not configured"
            )
        self._default_providers[exchange] = provider_type
        return self

    def get_provider(
        self, provider_type: Union[ProviderType, str]
    ) -> BasePriceProvider:
        """
        Get a specific provider by type or name.

        Args:
            provider_type: Provider type enum or string name

        Returns:
            The configured provider

        Raises:
            ProviderError: If provider not configured
        """
        if isinstance(provider_type, str):
            try:
                provider_type = ProviderType(provider_type)
            except ValueError:
                raise ProviderError("Factory", f"Unknown provider: {provider_type}")

        if provider_type not in self._providers:
            raise ProviderError(
                "Factory",
                f"Provider {provider_type.value} not configured. "
                f"Call configure_{provider_type.name.lower()}() first.",
            )

        return self._providers[provider_type]

    def get_provider_for_exchange(self, exchange: Exchange) -> BasePriceProvider:
        """
        Get the default provider for an exchange.

        Args:
            exchange: The exchange to get provider for

        Returns:
            The configured provider for this exchange
        """
        provider_type = self._default_providers.get(exchange)
        if not provider_type:
            raise ProviderError(
                "Factory", f"No default provider configured for {exchange.value}"
            )
        return self.get_provider(provider_type)

    # Convenience methods for common use cases

    def get_global_metal_provider(self) -> MetalPriceAPIProvider:
        """
        Get provider for global/international metal prices.

        Returns:
            MetalPriceAPI provider (or configured alternative)
        """
        return self.get_provider(ProviderType.METAL_PRICE_API)

    def get_mcx_provider(self) -> DhanHQProvider:
        """
        Get provider for MCX (Indian commodity exchange) prices.

        Returns:
            DhanHQ provider (or configured alternative)
        """
        return self.get_provider(ProviderType.DHANHQ)

    def get_comex_provider(self) -> YahooFinanceProvider:
        """
        Get provider for COMEX (US commodity exchange) prices.

        Returns:
            Yahoo Finance provider (or configured alternative)
        """
        return self.get_provider(ProviderType.YAHOO_FINANCE)

    def get_forex_provider(self) -> BasePriceProvider:
        """
        Get provider for forex rates.

        Returns:
            Provider configured for forex
        """
        return self.get_provider_for_exchange(Exchange.FOREX)

    def get_historical_provider(
        self, exchange: Optional[Exchange] = None
    ) -> BaseHistoricalDataProvider:
        """
        Get a provider that supports historical data.

        Args:
            exchange: Optional exchange preference

        Returns:
            Provider that implements BaseHistoricalDataProvider
        """
        if exchange:
            provider = self.get_provider_for_exchange(exchange)
            if isinstance(provider, BaseHistoricalDataProvider):
                return provider

        # Return first available historical provider
        for provider in self._providers.values():
            if isinstance(provider, BaseHistoricalDataProvider):
                return provider

        raise ProviderError("Factory", "No historical data provider configured")

    @property
    def configured_providers(self) -> list[str]:
        """List of configured provider names"""
        return [p.value for p in self._providers.keys()]

    def is_configured(self, provider_type: ProviderType) -> bool:
        """Check if a provider is configured"""
        return provider_type in self._providers

    async def health_check_all(self) -> Dict[str, bool]:
        """
        Check health of all configured providers.

        Returns:
            Dictionary mapping provider names to health status
        """
        results = {}
        for provider_type, provider in self._providers.items():
            try:
                results[provider_type.value] = await provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for {provider_type.value}: {e}")
                results[provider_type.value] = False
        return results


# Global factory instance (singleton pattern)
_factory_instance: Optional[DataProviderFactory] = None


def get_data_provider_factory() -> DataProviderFactory:
    """
    Get the global factory instance.

    Returns:
        The singleton DataProviderFactory instance
    """
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = DataProviderFactory()
    return _factory_instance


def configure_providers_from_settings(settings) -> DataProviderFactory:
    """
    Configure all providers from application settings.

    Args:
        settings: Application settings object with provider credentials

    Returns:
        Configured DataProviderFactory

    Expected settings attributes:
        - metal_price_api_key: str
        - dhan_client_id: str
        - dhan_access_token: str
    """
    factory = get_data_provider_factory()

    # Configure MetalPriceAPI if key is available
    if hasattr(settings, "metal_price_api_key") and settings.metal_price_api_key:
        factory.configure_metal_price_api(api_key=settings.metal_price_api_key)

    # Configure DhanHQ if credentials are available
    if (
        hasattr(settings, "dhan_client_id")
        and settings.dhan_client_id
        and hasattr(settings, "dhan_access_token")
        and settings.dhan_access_token
    ):
        factory.configure_dhanhq(
            client_id=settings.dhan_client_id, access_token=settings.dhan_access_token
        )

    # Yahoo Finance doesn't need credentials
    factory.configure_yahoo_finance()

    return factory
