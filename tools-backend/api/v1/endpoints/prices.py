from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
import logging

from services.data_providers import (
    YahooFinanceProvider,
    DhanHQProvider,
    MetalPriceAPIProvider,
    ProviderError,
)
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Symbol mappings for different providers
YAHOO_SYMBOLS = {
    "GOLD": "GC=F",  # COMEX Gold Futures
    "SILVER": "SI=F",  # COMEX Silver Futures
    "CRUDE": "CL=F",  # Crude Oil Futures
    "COPPER": "HG=F",  # Copper Futures
    "PLATINUM": "PL=F",  # Platinum Futures
    "PALLADIUM": "PA=F",  # Palladium Futures
    "NATURALGAS": "NG=F",  # Natural Gas Futures
}

MCX_SYMBOLS = ["GOLD", "SILVER", "CRUDEOIL", "NATURALGAS", "COPPER"]


@router.get("/current")
async def get_current_prices(
    symbols: str = Query(default="GOLD,SILVER", description="Comma-separated symbols"),
    exchange: str = Query(default="COMEX", description="Exchange: COMEX, MCX, or SPOT"),
):
    """
    Get current prices for specified symbols

    - **symbols**: Comma-separated list (GOLD, SILVER, CRUDE, etc.)
    - **exchange**: COMEX (futures), MCX (Indian futures), or SPOT (spot prices)

    Returns current prices from live data providers.
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    results = []

    try:
        if exchange.upper() == "COMEX":
            # Use Yahoo Finance for COMEX futures
            yahoo = YahooFinanceProvider()
            for symbol in symbol_list:
                yahoo_symbol = YAHOO_SYMBOLS.get(symbol, f"{symbol}=F")
                try:
                    price_data = await yahoo.get_price(yahoo_symbol, "USD")
                    results.append(
                        {
                            "symbol": symbol,
                            "price": float(price_data.price),
                            "currency": "USD",
                            "exchange": "COMEX",
                            "change": float(price_data.change)
                            if price_data.change
                            else None,
                            "change_percent": price_data.change_percent,
                            "timestamp": price_data.timestamp.isoformat(),
                            "provider": price_data.provider,
                        }
                    )
                except ProviderError as e:
                    logger.warning(f"Could not fetch {symbol} from COMEX: {e}")

        elif exchange.upper() == "MCX":
            # Use DhanHQ for MCX futures
            if not settings.dhan_client_id or not settings.dhan_access_token:
                raise HTTPException(
                    status_code=503, detail="MCX data provider not configured"
                )

            dhan = DhanHQProvider(settings.dhan_client_id, settings.dhan_access_token)
            for symbol in symbol_list:
                if symbol in MCX_SYMBOLS:
                    try:
                        price_data = await dhan.get_price(symbol, "INR")
                        results.append(
                            {
                                "symbol": symbol,
                                "price": float(price_data.price),
                                "currency": "INR",
                                "exchange": "MCX",
                                "timestamp": price_data.timestamp.isoformat(),
                                "provider": price_data.provider,
                            }
                        )
                    except ProviderError as e:
                        logger.warning(f"Could not fetch {symbol} from MCX: {e}")

        elif exchange.upper() == "SPOT":
            # Use MetalPriceAPI for spot prices
            if not settings.metal_price_api_key:
                raise HTTPException(
                    status_code=503, detail="Spot price provider not configured"
                )

            metal_api = MetalPriceAPIProvider(settings.metal_price_api_key)
            metal_symbols = {
                "GOLD": "XAU",
                "SILVER": "XAG",
                "PLATINUM": "XPT",
                "PALLADIUM": "XPD",
            }

            for symbol in symbol_list:
                metal_symbol = metal_symbols.get(symbol)
                if metal_symbol:
                    try:
                        price_data = await metal_api.get_price(metal_symbol, "USD")
                        results.append(
                            {
                                "symbol": symbol,
                                "price": float(price_data.price),
                                "currency": "USD",
                                "exchange": "SPOT",
                                "timestamp": price_data.timestamp.isoformat(),
                                "provider": price_data.provider,
                            }
                        )
                    except ProviderError as e:
                        logger.warning(f"Could not fetch {symbol} spot price: {e}")
        else:
            raise HTTPException(status_code=400, detail=f"Unknown exchange: {exchange}")

        if not results:
            raise HTTPException(
                status_code=404, detail="No price data available for requested symbols"
            )

        return {"prices": results, "count": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching prices: {str(e)}")


@router.get("/historical")
async def get_historical_prices(
    symbol: str = Query(description="Symbol (GOLD, SILVER, etc.)"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days"),
    exchange: str = Query(default="COMEX", description="Exchange: COMEX or MCX"),
):
    """
    Get historical price data for a symbol

    - **symbol**: Trading symbol
    - **days**: Number of days of history (1-365)
    - **exchange**: COMEX or MCX

    Returns daily OHLC data from live providers.
    """
    symbol = symbol.upper()
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    try:
        if exchange.upper() == "COMEX":
            yahoo = YahooFinanceProvider()
            yahoo_symbol = YAHOO_SYMBOLS.get(symbol, f"{symbol}=F")

            history = await yahoo.get_historical_data(
                yahoo_symbol, start_date, end_date, "1d", "USD"
            )

            data_points = [
                {
                    "date": dp.date.isoformat(),
                    "open": float(dp.open),
                    "high": float(dp.high),
                    "low": float(dp.low),
                    "close": float(dp.close),
                    "volume": dp.volume,
                }
                for dp in history.data_points
            ]

            return {
                "symbol": symbol,
                "exchange": "COMEX",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "data_points": data_points,
                "count": len(data_points),
                "provider": history.provider,
            }

        elif exchange.upper() == "MCX":
            if not settings.dhan_client_id or not settings.dhan_access_token:
                raise HTTPException(
                    status_code=503, detail="MCX data provider not configured"
                )

            dhan = DhanHQProvider(settings.dhan_client_id, settings.dhan_access_token)

            history = await dhan.get_historical_data(
                symbol, start_date, end_date, "1d", "INR"
            )

            data_points = [
                {
                    "date": dp.date.isoformat(),
                    "open": float(dp.open),
                    "high": float(dp.high),
                    "low": float(dp.low),
                    "close": float(dp.close),
                    "volume": dp.volume,
                }
                for dp in history.data_points
            ]

            return {
                "symbol": symbol,
                "exchange": "MCX",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "data_points": data_points,
                "count": len(data_points),
                "provider": history.provider,
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unknown exchange: {exchange}")

    except HTTPException:
        raise
    except ProviderError as e:
        raise HTTPException(status_code=503, detail=f"Data provider error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching historical prices: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching historical prices: {str(e)}"
        )


@router.get("/forex")
async def get_forex_rate(
    base: str = Query(default="USD", description="Base currency"),
    quote: str = Query(default="INR", description="Quote currency"),
):
    """
    Get current forex rate

    - **base**: Base currency (USD, EUR, etc.)
    - **quote**: Quote currency (INR, USD, etc.)

    Returns current exchange rate.
    """
    try:
        yahoo = YahooFinanceProvider()
        rate = await yahoo.get_forex_rate(base.upper(), quote.upper())

        return {
            "base": base.upper(),
            "quote": quote.upper(),
            "rate": float(rate),
            "pair": f"{base.upper()}/{quote.upper()}",
            "provider": "YahooFinance",
        }

    except ProviderError as e:
        raise HTTPException(
            status_code=503, detail=f"Could not fetch forex rate: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error fetching forex rate: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching forex rate: {str(e)}"
        )
