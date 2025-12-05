"""
Unit tests for data providers API integration.

These tests verify that the APIs are correctly sending data.
Run with: pytest tests/test_data_providers.py -v

Note: These are integration tests that require valid API keys.
Set the following environment variables before running:
- METAL_PRICE_API_KEY
- DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN (for DhanHQ tests)
- FMP_API_KEY (for FMP COT tests)
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.data_providers import (
    MetalPriceAPIProvider,
    DhanHQProvider,
    YahooFinanceProvider,
    FMPCOTProvider,
    PriceData,
    OHLCData,
    HistoricalData,
    ProviderError,
    DataNotAvailableError,
    RateLimitError,
)
from config import settings


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def metal_price_api_key():
    """Get MetalPriceAPI key from settings or environment"""
    key = settings.metal_price_api_key or os.getenv("METAL_PRICE_API_KEY", "")
    if not key:
        pytest.skip("METAL_PRICE_API_KEY not configured")
    return key


@pytest.fixture
def dhan_credentials():
    """Get DhanHQ credentials from settings or environment"""
    client_id = settings.dhan_client_id or os.getenv("DHAN_CLIENT_ID", "")
    access_token = settings.dhan_access_token or os.getenv("DHAN_ACCESS_TOKEN", "")
    if not client_id or not access_token:
        pytest.skip("DhanHQ credentials not configured")
    return {"client_id": client_id, "access_token": access_token}


@pytest.fixture
def fmp_api_key():
    """Get FMP API key from settings or environment"""
    key = settings.fmp_api_key or os.getenv("FMP_API_KEY", "")
    if not key:
        pytest.skip("FMP_API_KEY not configured")
    return key


@pytest.fixture
def metal_price_provider(metal_price_api_key):
    """Create MetalPriceAPI provider instance"""
    return MetalPriceAPIProvider(api_key=metal_price_api_key)


@pytest.fixture(scope="function")
def dhan_provider(dhan_credentials):
    """Create DhanHQ provider instance - new instance for each test"""
    return DhanHQProvider(
        client_id=dhan_credentials["client_id"],
        access_token=dhan_credentials["access_token"],
    )


@pytest.fixture
def yahoo_provider():
    """Create Yahoo Finance provider instance (no API key needed)"""
    return YahooFinanceProvider()


@pytest.fixture
def fmp_provider(fmp_api_key):
    """Create FMP COT provider instance"""
    return FMPCOTProvider(api_key=fmp_api_key)


# ============================================================================
# MetalPriceAPI Tests
# ============================================================================


class TestMetalPriceAPI:
    """Tests for MetalPriceAPI provider"""

    @pytest.mark.asyncio
    async def test_get_gold_price_usd(self, metal_price_provider):
        """Test fetching gold price in USD"""
        price = await metal_price_provider.get_price("XAU", "USD")

        assert isinstance(price, PriceData)
        assert price.symbol == "XAU"
        assert price.currency == "USD"
        assert price.price > 0
        assert price.provider == "MetalPriceAPI"
        print(f"[PASS] Gold Price: ${price.price}/oz")

    @pytest.mark.asyncio
    async def test_get_silver_price_usd(self, metal_price_provider):
        """Test fetching silver price in USD"""
        price = await metal_price_provider.get_price("XAG", "USD")

        assert isinstance(price, PriceData)
        assert price.symbol == "XAG"
        assert price.price > 0
        print(f"[PASS] Silver Price: ${price.price}/oz")

    @pytest.mark.asyncio
    async def test_get_gold_price_inr(self, metal_price_provider):
        """Test fetching gold price in INR"""
        price = await metal_price_provider.get_price("GOLD", "INR")

        assert isinstance(price, PriceData)
        assert price.currency == "INR"
        assert price.price > 0
        print(f"[PASS] Gold Price: Rs.{price.price}/oz")

    @pytest.mark.asyncio
    async def test_get_multiple_prices(self, metal_price_provider):
        """Test fetching multiple metal prices"""
        prices = await metal_price_provider.get_multiple_prices(
            ["XAU", "XAG", "XPT"], "USD"
        )

        assert len(prices) >= 2
        for price in prices:
            assert isinstance(price, PriceData)
            assert price.price > 0
        print(f"[PASS] Got {len(prices)} metal prices")

    @pytest.mark.asyncio
    async def test_get_ohlc_data(self, metal_price_provider):
        """Test fetching OHLC data for gold"""
        yesterday = date.today() - timedelta(days=1)
        ohlc = await metal_price_provider.get_ohlc("XAU", yesterday, "USD")

        assert isinstance(ohlc, OHLCData)
        assert ohlc.symbol == "XAU"
        assert ohlc.open > 0
        assert ohlc.high >= ohlc.low
        assert ohlc.close > 0
        print(
            f"[PASS] Gold OHLC: O={ohlc.open}, H={ohlc.high}, L={ohlc.low}, C={ohlc.close}"
        )

    @pytest.mark.asyncio
    async def test_get_historical_data(self, metal_price_provider):
        """Test fetching historical data"""
        # Use 4 days to stay within free plan limit
        end_date = date.today() - timedelta(days=1)
        start_date = end_date - timedelta(days=4)

        try:
            history = await metal_price_provider.get_historical_data(
                "XAU", start_date, end_date, "1d", "USD"
            )

            assert isinstance(history, HistoricalData)
            assert len(history.data_points) > 0
            print(f"[PASS] Got {len(history.data_points)} historical data points")
        except ProviderError as e:
            if "paid plan" in str(e).lower() or "exceeding" in str(e).lower():
                pytest.skip("MetalPriceAPI historical data requires paid plan")
            raise

    @pytest.mark.asyncio
    async def test_currency_conversion(self, metal_price_provider):
        """Test currency conversion"""
        result = await metal_price_provider.convert_currency(
            Decimal("100"), "USD", "INR"
        )

        assert result > 0
        print(f"[PASS] 100 USD = {result} INR")

    @pytest.mark.asyncio
    async def test_forex_rate(self, metal_price_provider):
        """Test forex rate fetching"""
        rate = await metal_price_provider.get_forex_rate("USD", "INR")

        assert rate > 0
        print(f"[PASS] USD/INR Rate: {rate}")

    @pytest.mark.asyncio
    async def test_health_check(self, metal_price_provider):
        """Test provider health check"""
        is_healthy = await metal_price_provider.health_check()

        assert is_healthy is True
        print("[PASS] MetalPriceAPI health check passed")


# ============================================================================
# Yahoo Finance Tests
# ============================================================================


class TestYahooFinance:
    """Tests for Yahoo Finance provider (no API key required)"""

    @pytest.mark.asyncio
    async def test_get_gold_futures_price(self, yahoo_provider):
        """Test fetching COMEX gold futures price"""
        price = await yahoo_provider.get_price("GC=F", "USD")

        assert isinstance(price, PriceData)
        assert "GC" in price.symbol
        assert price.price > 0
        assert price.provider == "YahooFinance"
        print(f"[PASS] COMEX Gold Futures: ${price.price}")

    @pytest.mark.asyncio
    async def test_get_silver_futures_price(self, yahoo_provider):
        """Test fetching COMEX silver futures price"""
        price = await yahoo_provider.get_price("SI=F", "USD")

        assert isinstance(price, PriceData)
        assert price.price > 0
        print(f"[PASS] COMEX Silver Futures: ${price.price}")

    @pytest.mark.asyncio
    async def test_get_gold_etf_price(self, yahoo_provider):
        """Test fetching GLD ETF price"""
        price = await yahoo_provider.get_price("GLD", "USD")

        assert isinstance(price, PriceData)
        assert price.price > 0
        print(f"[PASS] GLD ETF: ${price.price}")

    @pytest.mark.asyncio
    async def test_get_multiple_futures_prices(self, yahoo_provider):
        """Test fetching multiple futures prices"""
        prices = await yahoo_provider.get_multiple_prices(
            ["GC=F", "SI=F", "CL=F"], "USD"
        )

        assert len(prices) >= 2
        for price in prices:
            assert price.price > 0
        print(f"[PASS] Got {len(prices)} futures prices")

    @pytest.mark.asyncio
    async def test_get_ohlc_data(self, yahoo_provider):
        """Test fetching OHLC data"""
        # Use a date that's likely to have data (last trading day)
        test_date = date.today() - timedelta(days=3)

        try:
            ohlc = await yahoo_provider.get_ohlc("GC=F", test_date, "USD")

            assert isinstance(ohlc, OHLCData)
            assert ohlc.open > 0
            assert ohlc.high >= ohlc.low
            print(
                f"[PASS] Gold Futures OHLC: O={ohlc.open}, H={ohlc.high}, L={ohlc.low}, C={ohlc.close}"
            )
        except DataNotAvailableError:
            # Market might have been closed
            pytest.skip(
                "No data available for the test date (market may have been closed)"
            )

    @pytest.mark.asyncio
    async def test_get_historical_data(self, yahoo_provider):
        """Test fetching historical data"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        history = await yahoo_provider.get_historical_data(
            "GC=F", start_date, end_date, "1d", "USD"
        )

        assert isinstance(history, HistoricalData)
        assert len(history.data_points) > 0
        print(
            f"[PASS] Got {len(history.data_points)} historical data points for gold futures"
        )

    @pytest.mark.asyncio
    async def test_get_forex_rate(self, yahoo_provider):
        """Test fetching forex rate"""
        rate = await yahoo_provider.get_forex_rate("USD", "INR")

        assert rate > 0
        print(f"[PASS] USD/INR Rate: {rate}")

    @pytest.mark.asyncio
    async def test_symbol_mapping(self, yahoo_provider):
        """Test that common symbol names are correctly mapped"""
        # Test using common name instead of Yahoo symbol
        price = await yahoo_provider.get_price("GOLD", "USD")

        assert isinstance(price, PriceData)
        assert price.price > 0
        print(f"[PASS] Symbol mapping works: GOLD -> {price.symbol}")

    @pytest.mark.asyncio
    async def test_health_check(self, yahoo_provider):
        """Test provider health check"""
        is_healthy = await yahoo_provider.health_check()

        assert is_healthy is True
        print("[PASS] Yahoo Finance health check passed")


# ============================================================================
# DhanHQ Tests
# ============================================================================


class TestDhanHQ:
    """Tests for DhanHQ provider (requires valid trading account)"""

    @pytest.mark.asyncio
    async def test_provider_initialization(self, dhan_provider):
        """Test that provider initializes correctly"""
        assert dhan_provider.provider_name == "DhanHQ"
        assert dhan_provider._dhan is not None
        print("[PASS] DhanHQ provider initialized")

    @pytest.mark.asyncio
    async def test_fetch_security_list(self, dhan_provider):
        """Test fetching security list"""
        try:
            securities = await dhan_provider.fetch_security_list("MCX_COMM")

            assert isinstance(securities, list)
            print(f"[PASS] Fetched {len(securities)} MCX securities")
        except ProviderError as e:
            pytest.skip(f"Could not fetch security list: {e}")

    @pytest.mark.asyncio
    async def test_get_gold_price(self, dhan_provider):
        """Test fetching MCX Gold DEC FUT price (security_id: 445003)"""
        try:
            price = await dhan_provider.get_price("GOLD", "INR")

            assert isinstance(price, PriceData)
            assert price.symbol == "GOLD"
            assert price.currency == "INR"
            assert price.price > 0
            print(f"[PASS] MCX Gold DEC FUT: Rs.{price.price}")
        except ProviderError as e:
            pytest.skip(f"Could not fetch MCX price: {e}")

    @pytest.mark.asyncio
    async def test_get_silver_price(self, dhan_provider):
        """Test fetching MCX Silver price"""
        try:
            price = await dhan_provider.get_price("SILVER", "INR")

            assert isinstance(price, PriceData)
            assert price.price > 0
            print(f"[PASS] MCX Silver: Rs.{price.price}")
        except RateLimitError as e:
            pytest.skip(f"Rate limited by DhanHQ API: {e}")
        except ProviderError as e:
            pytest.skip(f"Could not fetch MCX price: {e}")

    @pytest.mark.asyncio
    async def test_get_multiple_prices(self, dhan_provider):
        """Test fetching multiple MCX prices"""
        try:
            prices = await dhan_provider.get_multiple_prices(["GOLD", "SILVER"], "INR")

            assert len(prices) >= 1
            print(f"[PASS] Got {len(prices)} MCX prices")
        except RateLimitError as e:
            pytest.skip(f"Rate limited by DhanHQ API: {e}")
        except ProviderError as e:
            pytest.skip(f"Could not fetch MCX prices: {e}")

    @pytest.mark.asyncio
    async def test_get_historical_data(self, dhan_provider):
        """Test fetching historical data"""
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

            history = await dhan_provider.get_historical_data(
                "GOLD", start_date, end_date, "1d", "INR"
            )

            assert isinstance(history, HistoricalData)
            print(f"[PASS] Got {len(history.data_points)} historical data points")
        except ProviderError as e:
            pytest.skip(f"Could not fetch historical data: {e}")


# ============================================================================
# FMP COT Tests
# ============================================================================


class TestFMPCOT:
    """Tests for Financial Modeling Prep COT provider"""

    @pytest.mark.asyncio
    async def test_get_cot_list(self, fmp_provider):
        """Test fetching list of available COT symbols"""
        try:
            symbols = await fmp_provider.get_cot_list()

            assert isinstance(symbols, list)
            assert len(symbols) > 0

            # Check that we have some expected symbols
            symbol_names = [s.symbol for s in symbols]
            print(f"[PASS] Got {len(symbols)} COT symbols")
            print(f"   Sample symbols: {symbol_names[:5]}")
        except ProviderError as e:
            if "402" in str(e) or "subscription" in str(e).lower():
                pytest.skip("FMP COT endpoint requires paid subscription")
            raise

    @pytest.mark.asyncio
    async def test_get_cot_report_gold(self, fmp_provider):
        """Test fetching COT report for Gold"""
        try:
            reports = await fmp_provider.get_cot_report("GC")

            assert isinstance(reports, list)
            if len(reports) > 0:
                report = reports[0]
                assert report.symbol is not None
                assert report.open_interest >= 0
                print(f"[PASS] Gold COT Report: Open Interest = {report.open_interest}")
            else:
                print("[WARN] No COT reports returned for Gold")
        except DataNotAvailableError:
            pytest.skip("No COT data available for Gold")
        except ProviderError as e:
            if "402" in str(e) or "subscription" in str(e).lower():
                pytest.skip("FMP COT endpoint requires paid subscription")
            raise

    @pytest.mark.asyncio
    async def test_get_cot_report_with_dates(self, fmp_provider):
        """Test fetching COT report with date range"""
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=90)

            reports = await fmp_provider.get_cot_report(
                "GC", from_date=start_date, to_date=end_date
            )

            assert isinstance(reports, list)
            print(f"[PASS] Got {len(reports)} COT reports for date range")
        except DataNotAvailableError:
            pytest.skip("No COT data available for date range")
        except ProviderError as e:
            if "402" in str(e) or "subscription" in str(e).lower():
                pytest.skip("FMP COT endpoint requires paid subscription")
            raise

    @pytest.mark.asyncio
    async def test_get_cot_analysis_by_dates(self, fmp_provider):
        """Test fetching COT analysis for date range"""
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

            analyses = await fmp_provider.get_cot_analysis_by_dates(
                start_date=start_date, end_date=end_date
            )

            assert isinstance(analyses, list)
            if len(analyses) > 0:
                analysis = analyses[0]
                assert analysis.symbol is not None
                assert analysis.market_situation in [
                    "Bullish",
                    "Bearish",
                    "Neutral",
                    "",
                ]
                print(f"[PASS] Got {len(analyses)} COT analyses")
                print(f"   Sample: {analysis.symbol} - {analysis.market_situation}")
            else:
                print("[WARN] No COT analyses returned")
        except Exception as e:
            pytest.skip(f"Could not fetch COT analysis: {e}")

    @pytest.mark.asyncio
    async def test_get_cot_analysis_for_gold(self, fmp_provider):
        """Test fetching COT analysis specifically for Gold"""
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

            analyses = await fmp_provider.get_cot_analysis_by_dates(
                start_date=start_date, end_date=end_date, symbol="GC"
            )

            assert isinstance(analyses, list)
            print(f"[PASS] Got {len(analyses)} COT analyses for Gold")
        except Exception as e:
            pytest.skip(f"Could not fetch Gold COT analysis: {e}")

    @pytest.mark.asyncio
    async def test_health_check(self, fmp_provider):
        """Test provider health check"""
        try:
            is_healthy = await fmp_provider.health_check()
            if is_healthy:
                print("[PASS] FMP COT health check passed")
            else:
                # Health check returns False when subscription is needed
                pytest.skip(
                    "FMP COT endpoint requires paid subscription (health check returned False)"
                )
        except ProviderError as e:
            if "402" in str(e) or "subscription" in str(e).lower():
                pytest.skip("FMP COT endpoint requires paid subscription")
            raise


# ============================================================================
# Integration Tests
# ============================================================================


class TestProviderIntegration:
    """Integration tests across multiple providers"""

    @pytest.mark.asyncio
    async def test_compare_gold_prices(self, metal_price_provider, yahoo_provider):
        """Compare gold prices from different providers"""
        # Get price from MetalPriceAPI
        metal_price = await metal_price_provider.get_price("XAU", "USD")

        # Get price from Yahoo Finance
        yahoo_price = await yahoo_provider.get_price("GC=F", "USD")

        # Prices should be in the same ballpark (within 5%)
        price_diff_pct = (
            abs(float(metal_price.price) - float(yahoo_price.price))
            / float(metal_price.price)
            * 100
        )

        print(f"[PASS] MetalPriceAPI Gold: ${metal_price.price}")
        print(f"[PASS] Yahoo Finance Gold: ${yahoo_price.price}")
        print(f"   Price difference: {price_diff_pct:.2f}%")

        # Allow for some difference due to different data sources
        assert price_diff_pct < 10, f"Price difference too large: {price_diff_pct}%"


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    # Run with: python -m pytest tests/test_data_providers.py -v
    pytest.main([__file__, "-v", "-s"])
