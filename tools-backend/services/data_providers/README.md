# Data Providers Architecture

This module provides a **provider-agnostic architecture** for fetching market data from multiple sources. The design follows the **Strategy Pattern** and **Factory Pattern**, making it easy to switch data providers without changing consuming code.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DataProviderFactory                          │
│  (Singleton - manages all providers)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │MetalPriceAPI │  │   DhanHQ     │  │   YahooFinance       │  │
│  │  Provider    │  │  Provider    │  │     Provider         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └────────────────┬┴─────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │  BasePriceProvider    │                         │
│              │  (Abstract Interface) │                         │
│              └───────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Providers

### 1. MetalPriceAPI (`metal_price_api.py`)
**Use Case:** Global/International metal prices, Forex rates

| Feature | Support |
|---------|---------|
| Live Prices | ✅ |
| Historical (Daily) | ✅ |
| OHLC | ✅ |
| Currency Conversion | ✅ |
| Carat Prices | ✅ |
| Intraday | ❌ |

**Symbols:** `XAU` (Gold), `XAG` (Silver), `XPT` (Platinum), `XPD` (Palladium), `XCU` (Copper)

```python
from services.data_providers import MetalPriceAPIProvider

provider = MetalPriceAPIProvider(api_key="your_key")
price = await provider.get_price("XAU", "USD")
print(f"Gold: ${price.price}/oz")
```

### 2. DhanHQ (`dhanhq_provider.py`)
**Use Case:** MCX (Indian Commodity Exchange) prices

| Feature | Support |
|---------|---------|
| Live Prices | ✅ |
| Historical (Daily) | ✅ |
| Intraday (Minute) | ✅ |
| Option Chain | ✅ |
| Market Quotes | ✅ |

**Symbols:** `GOLDM`, `GOLD`, `SILVERM`, `SILVER`, `CRUDEOIL`, `NATURALGAS`, `COPPER`

```python
from services.data_providers import DhanHQProvider

provider = DhanHQProvider(client_id="id", access_token="token")
price = await provider.get_price("GOLDM", "INR")
print(f"MCX Gold Mini: ₹{price.price}/10g")
```

### 3. Yahoo Finance (`yahoo_finance_provider.py`)
**Use Case:** COMEX futures, ETFs, Global markets

| Feature | Support |
|---------|---------|
| Live Prices | ✅ |
| Historical (Multi-interval) | ✅ |
| Intraday | ✅ |
| Forex | ✅ |
| ETFs | ✅ |

**Symbols:** `GC=F` (Gold Futures), `SI=F` (Silver Futures), `GLD` (Gold ETF), `USDINR=X` (Forex)

```python
from services.data_providers import YahooFinanceProvider

provider = YahooFinanceProvider()
price = await provider.get_price("GC=F", "USD")
print(f"COMEX Gold: ${price.price}")
```

### 4. FMP COT Provider (`fmp_cot_provider.py`)
**Use Case:** Commitment of Traders (COT) data and analysis

| Feature | Support |
|---------|---------|
| COT Report List | ✅ |
| COT Report by Symbol | ✅ |
| COT Analysis by Dates | ✅ |
| COT Analysis by Symbol | ✅ |
| Market Sentiment | ✅ |

**Symbols:** `GC` (Gold), `SI` (Silver), `CL` (Crude Oil), `NG` (Natural Gas), `HG` (Copper)

```python
from services.data_providers import FMPCOTProvider

provider = FMPCOTProvider(api_key="your_key")

# Get list of available COT symbols
symbols = await provider.get_cot_list()

# Get COT report for Gold
reports = await provider.get_cot_report("GC")

# Get COT analysis for date range
from datetime import date, timedelta
analyses = await provider.get_cot_analysis_by_dates(
    start_date=date.today() - timedelta(days=30),
    end_date=date.today(),
    symbol="GC"
)
print(f"Gold Sentiment: {analyses[0].market_sentiment}")
```

## 🏭 Using the Factory

The `DataProviderFactory` is the recommended way to manage providers:

```python
from services.data_providers import DataProviderFactory

# Initialize factory
factory = DataProviderFactory()

# Configure providers (typically at app startup)
factory.configure_metal_price_api(api_key="your_metal_price_api_key")
factory.configure_dhanhq(client_id="dhan_id", access_token="dhan_token")
factory.configure_yahoo_finance()

# Get providers by use case
global_price = await factory.get_global_metal_provider().get_price("XAU", "USD")
mcx_price = await factory.get_mcx_provider().get_price("GOLDM", "INR")
comex_price = await factory.get_comex_provider().get_price("GC=F", "USD")
```

### Auto-configuration from Settings

```python
from config import settings
from services.data_providers import configure_providers_from_settings

# Automatically configure all providers from .env settings
factory = configure_providers_from_settings(settings)
```

## 🔄 Switching Providers

The architecture makes it easy to switch providers without changing consuming code:

```python
# Option 1: Change default provider for an exchange
factory.set_default_provider(Exchange.COMEX, ProviderType.METAL_PRICE_API)

# Option 2: Get specific provider
provider = factory.get_provider("YahooFinance")

# Option 3: Create custom provider mapping
class MyService:
    def __init__(self, price_provider: BasePriceProvider):
        self.provider = price_provider
    
    async def get_gold_price(self):
        return await self.provider.get_price("XAU", "USD")

# Inject different providers
service = MyService(factory.get_global_metal_provider())
# or
service = MyService(factory.get_comex_provider())
```

## 📊 Data Structures

### PriceData
```python
@dataclass
class PriceData:
    symbol: str           # e.g., "XAU", "GOLDM"
    price: Decimal        # Current price
    currency: str         # e.g., "USD", "INR"
    timestamp: datetime   # When price was recorded
    exchange: Exchange    # MCX, COMEX, GLOBAL, etc.
    unit: str            # "troy_oz", "10g", "kg"
    bid: Optional[Decimal]
    ask: Optional[Decimal]
    change: Optional[Decimal]
    change_percent: Optional[float]
    provider: str        # Provider name
    raw_data: Dict       # Original API response
```

### OHLCData
```python
@dataclass
class OHLCData:
    symbol: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    timestamp: datetime
    currency: str
    exchange: Exchange
    volume: Optional[int]
    provider: str
```

### HistoricalData
```python
@dataclass
class HistoricalData:
    symbol: str
    currency: str
    exchange: Exchange
    data_points: List[HistoricalDataPoint]
    start_date: date
    end_date: date
    interval: str  # "1d", "1h", "15m", etc.
    provider: str
```

## ⚠️ Error Handling

All providers raise specific exceptions:

```python
from services.data_providers.base import (
    ProviderError,        # Base exception
    RateLimitError,       # API rate limit exceeded
    AuthenticationError,  # Invalid credentials
    SymbolNotFoundError,  # Unknown symbol
    DataNotAvailableError # Data not available
)

try:
    price = await provider.get_price("UNKNOWN", "USD")
except SymbolNotFoundError as e:
    print(f"Symbol not found: {e}")
except RateLimitError as e:
    print(f"Rate limited: {e}")
except ProviderError as e:
    print(f"Provider error: {e}")
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# MetalPriceAPI - For global/international metal prices
METAL_PRICE_API_KEY=your_api_key_here

# DhanHQ - For MCX commodity prices
DHAN_CLIENT_ID=your_client_id
DHAN_ACCESS_TOKEN=your_access_token
```

### Getting API Keys

1. **MetalPriceAPI**: Register at https://metalpriceapi.com
2. **DhanHQ**: Get credentials from https://web.dhan.co (requires Dhan trading account)
3. **Yahoo Finance**: No API key required (free)

## 🧪 Health Checks

```python
# Check all providers
health = await factory.health_check_all()
# Returns: {"MetalPriceAPI": True, "DhanHQ": True, "YahooFinance": True}

# Check specific provider
is_healthy = await provider.health_check()
```

## 📝 Adding a New Provider

1. Create a new file (e.g., `my_provider.py`)
2. Implement `BasePriceProvider` and/or `BaseHistoricalDataProvider`
3. Add to `__init__.py`
4. Add configuration method to `DataProviderFactory`

```python
from .base import BasePriceProvider, PriceData, Exchange

class MyProvider(BasePriceProvider):
    @property
    def provider_name(self) -> str:
        return "MyProvider"
    
    @property
    def supported_exchanges(self) -> List[Exchange]:
        return [Exchange.GLOBAL]
    
    async def get_price(self, symbol: str, currency: str = "USD", 
                        exchange: Optional[Exchange] = None) -> PriceData:
        # Your implementation
        pass
    
    async def get_multiple_prices(self, symbols: List[str], 
                                   currency: str = "USD") -> List[PriceData]:
        # Your implementation
        pass
    
    async def get_ohlc(self, symbol: str, date: date, 
                       currency: str = "USD") -> OHLCData:
        # Your implementation
        pass
```

## 📈 Usage Examples

### Arbitrage Calculation
```python
async def calculate_arbitrage():
    factory = get_data_provider_factory()
    
    # Get COMEX price (international)
    comex_price = await factory.get_comex_provider().get_price("GC=F", "USD")
    
    # Get MCX price (domestic)
    mcx_price = await factory.get_mcx_provider().get_price("GOLDM", "INR")
    
    # Get forex rate
    forex = await factory.get_forex_provider().get_forex_rate("USD", "INR")
    
    # Calculate fair value
    fair_value = comex_price.price * forex / Decimal("31.1035")  # Convert oz to gram
    premium = mcx_price.price - fair_value
    
    return {
        "comex_usd": comex_price.price,
        "mcx_inr": mcx_price.price,
        "fair_value": fair_value,
        "premium": premium
    }
```

### Historical Analysis
```python
async def get_gold_history():
    factory = get_data_provider_factory()
    provider = factory.get_historical_provider(Exchange.COMEX)
    
    history = await provider.get_historical_data(
        symbol="GC=F",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 1),
        interval="1d"
    )
    
    for point in history.data_points:
        print(f"{point.date}: Open={point.open}, Close={point.close}")
```

## 🔒 Best Practices

1. **Use the Factory**: Always use `DataProviderFactory` instead of instantiating providers directly
2. **Handle Errors**: Wrap provider calls in try-except blocks
3. **Cache Results**: Consider caching for frequently accessed data
4. **Rate Limiting**: Be aware of API rate limits for each provider
5. **Fallback Strategy**: Implement fallback to alternative providers on failure

```python
async def get_gold_price_with_fallback():
    factory = get_data_provider_factory()
    
    # Try primary provider
    try:
        return await factory.get_global_metal_provider().get_price("XAU", "USD")
    except ProviderError:
        # Fallback to Yahoo Finance
        return await factory.get_comex_provider().get_price("GC=F", "USD")
```
