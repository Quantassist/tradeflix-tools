"""
Script to populate arbitrage_history table with historical data.

Data Sources:
- COMEX prices: yfinance (GC=F for Gold, SI=F for Silver)
- MCX prices: DhanHQ API (historical daily data)
- USD/INR rates: metals_prices_spot table in Supabase

Rate Limiting:
- yfinance: No strict limit, but we batch requests
- DhanHQ: 1 request per second (built into provider)

Usage:
    python scripts/populate_arbitrage_history.py --symbol GOLD --start-date 2024-01-01 --end-date 2024-12-31
"""

import asyncio
import argparse
import sys
import os
from datetime import date, datetime, timedelta
from typing import Dict
import logging
import time
import requests

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yfinance as yf
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config import settings
from services.arbitrage_service import ArbitrageService

# DhanHQ Security IDs for MCX commodities
DHAN_SECURITY_IDS = {
    "GOLD": "449534",  # Current GOLD contract - returns continuous data
    "SILVER": "451666",  # Current SILVER contract - returns continuous data
}

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Constants
COMEX_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
}

# MCX contract sizes (for fair value calculation)
MCX_CONTRACT_SIZES = {
    "GOLD": 10,  # 10 grams
    "SILVER": 1000,  # 1 kg = 1000 grams
}

# Import duty percentage
IMPORT_DUTY_PERCENT = 2.5


class ArbitrageHistoryPopulator:
    def __init__(self):
        self.engine = create_engine(settings.database_url)
        self.Session = sessionmaker(bind=self.engine)
        self.arbitrage_service = ArbitrageService()

    def fetch_usdinr_rates(self, start_date: date, end_date: date) -> Dict[date, float]:
        """Fetch USD/INR rates from metals_prices_spot table."""
        logger.info(f"Fetching USD/INR rates from {start_date} to {end_date}")

        with self.Session() as session:
            result = session.execute(
                text("""
                    SELECT date, usd_inr_rate 
                    FROM tradeflix_tools.metals_prices_spot 
                    WHERE date >= :start_date AND date <= :end_date
                    AND usd_inr_rate IS NOT NULL
                    ORDER BY date
                """),
                {"start_date": start_date, "end_date": end_date},
            )
            rates = {row.date: float(row.usd_inr_rate) for row in result}

        logger.info(f"Fetched {len(rates)} USD/INR rates")
        return rates

    def fetch_comex_prices(
        self, symbol: str, start_date: date, end_date: date
    ) -> Dict[date, float]:
        """Fetch COMEX prices from yfinance."""
        yahoo_symbol = COMEX_SYMBOLS.get(symbol)
        if not yahoo_symbol:
            raise ValueError(f"Unknown symbol: {symbol}")

        logger.info(
            f"Fetching COMEX {symbol} ({yahoo_symbol}) prices from {start_date} to {end_date}"
        )

        # yfinance expects string dates
        ticker = yf.Ticker(yahoo_symbol)

        # Add 1 day to end_date because yfinance end is exclusive
        df = ticker.history(
            start=start_date.isoformat(), end=(end_date + timedelta(days=1)).isoformat()
        )

        if df.empty:
            logger.warning(f"No COMEX data returned for {symbol}")
            return {}

        # Convert to dict with date keys
        prices = {}
        for idx, row in df.iterrows():
            # idx is a Timestamp, convert to date
            d = idx.date() if hasattr(idx, "date") else idx
            prices[d] = float(row["Close"])

        logger.info(f"Fetched {len(prices)} COMEX prices for {symbol}")
        return prices

    def fetch_mcx_prices_dhan_direct(
        self, symbol: str, start_date: date, end_date: date, max_retries: int = 3
    ) -> Dict[date, float]:
        """
        Fetch MCX prices from DhanHQ API directly using requests.
        Fetches data in yearly chunks to handle long date ranges.
        """
        if not settings.dhan_access_token:
            logger.warning("DhanHQ access token not configured, skipping MCX data")
            return {}

        security_id = DHAN_SECURITY_IDS.get(symbol)
        if not security_id:
            logger.warning(f"No DhanHQ security ID for {symbol}")
            return {}

        logger.info(
            f"Fetching MCX {symbol} prices from DhanHQ from {start_date} to {end_date}"
        )

        all_prices = {}

        # Fetch data in yearly chunks
        current_start = start_date
        while current_start <= end_date:
            # Calculate chunk end (1 year or end_date, whichever is earlier)
            chunk_end = min(date(current_start.year, 12, 31), end_date)

            prices = self._fetch_dhan_chunk(
                security_id=security_id,
                from_date=current_start.strftime("%Y-%m-%d"),
                to_date=chunk_end.strftime("%Y-%m-%d"),
                max_retries=max_retries,
            )

            all_prices.update(prices)
            logger.info(f"  {current_start.year}: {len(prices)} candles")

            # Move to next year
            current_start = date(current_start.year + 1, 1, 1)

            # Rate limiting between chunks
            time.sleep(1.5)

        logger.info(f"Total MCX prices fetched for {symbol}: {len(all_prices)}")
        return all_prices

    def _fetch_dhan_chunk(
        self, security_id: str, from_date: str, to_date: str, max_retries: int = 3
    ) -> Dict[date, float]:
        """Fetch a single chunk of historical data from DhanHQ with retry logic."""
        url = "https://api.dhan.co/v2/charts/historical"

        headers = {
            "Content-Type": "application/json",
            "access-token": settings.dhan_access_token,
        }

        payload = {
            "securityId": security_id,
            "exchangeSegment": "MCX_COMM",
            "instrument": "FUTCOM",
            "expiryCode": 0,
            "oi": False,
            "fromDate": from_date,
            "toDate": to_date,
        }

        for attempt in range(max_retries):
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                response.raise_for_status()
                data = response.json()

                if "open" not in data:
                    logger.warning(
                        f"Unexpected response for {from_date} to {to_date}: {str(data)[:200]}"
                    )
                    return {}

                prices = {}
                timestamps = data.get("timestamp", [])
                closes = data.get("close", [])

                for i, ts in enumerate(timestamps):
                    if i < len(closes):
                        candle_date = datetime.fromtimestamp(ts).date()
                        prices[candle_date] = float(closes[i])

                return prices

            except requests.exceptions.SSLError as e:
                logger.warning(f"SSL error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2**attempt)  # Exponential backoff
                continue
            except requests.exceptions.RequestException as e:
                logger.warning(
                    f"Request error (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt < max_retries - 1:
                    time.sleep(2**attempt)
                continue
            except Exception as e:
                logger.error(f"Unexpected error fetching DhanHQ data: {e}")
                return {}

        logger.error(f"Failed to fetch DhanHQ data after {max_retries} attempts")
        return {}

    async def fetch_mcx_prices_dhan(
        self, symbol: str, start_date: date, end_date: date
    ) -> Dict[date, float]:
        """Fetch MCX prices from DhanHQ API (wrapper for async compatibility)."""
        return self.fetch_mcx_prices_dhan_direct(symbol, start_date, end_date)

    def estimate_mcx_price(
        self, comex_price_usd: float, usdinr_rate: float, symbol: str
    ) -> float:
        """Estimate MCX price based on COMEX price when DhanHQ data is unavailable."""
        contract_size = MCX_CONTRACT_SIZES.get(symbol, 10)

        # Calculate fair value
        fair_value = self.arbitrage_service.calculate_fair_value(
            comex_price_usd_per_oz=comex_price_usd,
            usdinr_rate=usdinr_rate,
            import_duty_percent=IMPORT_DUTY_PERCENT,
            contract_size_grams=contract_size,
        )

        # Add typical premium (0.3% to 0.8% for Gold, higher for Silver)
        typical_premium = 0.005 if symbol == "GOLD" else 0.008
        return fair_value * (1 + typical_premium)

    def calculate_arbitrage_metrics(
        self, mcx_price: float, comex_price_usd: float, usdinr_rate: float, symbol: str
    ) -> Dict:
        """Calculate arbitrage metrics for a single data point."""
        contract_size = MCX_CONTRACT_SIZES.get(symbol, 10)

        # Calculate fair value
        fair_value = self.arbitrage_service.calculate_fair_value(
            comex_price_usd_per_oz=comex_price_usd,
            usdinr_rate=usdinr_rate,
            import_duty_percent=IMPORT_DUTY_PERCENT,
            contract_size_grams=contract_size,
        )

        # Calculate premium
        premium = mcx_price - fair_value
        premium_percent = (premium / fair_value) * 100 if fair_value > 0 else 0

        # Generate signal
        if premium_percent < -0.8:
            signal = "strong_long"
        elif premium_percent < -0.3:
            signal = "long"
        elif premium_percent > 1.2:
            signal = "strong_short"
        elif premium_percent > 0.7:
            signal = "short"
        else:
            signal = "neutral"

        return {
            "fair_value": fair_value,
            "premium": premium,
            "premium_percent": premium_percent,
            "signal": signal,
        }

    def insert_arbitrage_record(
        self,
        session,
        symbol: str,
        record_date: date,
        comex_price_usd: float,
        mcx_price_inr: float,
        usdinr_rate: float,
        fair_value_inr: float,
        premium: float,
        premium_percent: float,
        signal: str,
        comex_source: str,
        mcx_source: str,
    ):
        """Insert a single arbitrage record into the database."""
        session.execute(
            text("""
                INSERT INTO tradeflix_tools.arbitrage_history 
                (symbol, recorded_at, comex_price_usd, mcx_price_inr, usdinr_rate, 
                 fair_value_inr, premium, premium_percent, signal, comex_source, mcx_source)
                VALUES (:symbol, :recorded_at, :comex_price_usd, :mcx_price_inr, :usdinr_rate,
                        :fair_value_inr, :premium, :premium_percent, :signal, :comex_source, :mcx_source)
                ON CONFLICT (symbol, recorded_at) DO UPDATE SET
                    comex_price_usd = EXCLUDED.comex_price_usd,
                    mcx_price_inr = EXCLUDED.mcx_price_inr,
                    usdinr_rate = EXCLUDED.usdinr_rate,
                    fair_value_inr = EXCLUDED.fair_value_inr,
                    premium = EXCLUDED.premium,
                    premium_percent = EXCLUDED.premium_percent,
                    signal = EXCLUDED.signal,
                    comex_source = EXCLUDED.comex_source,
                    mcx_source = EXCLUDED.mcx_source
            """),
            {
                "symbol": symbol,
                "recorded_at": datetime.combine(record_date, datetime.min.time()),
                "comex_price_usd": comex_price_usd,
                "mcx_price_inr": mcx_price_inr,
                "usdinr_rate": usdinr_rate,
                "fair_value_inr": fair_value_inr,
                "premium": premium,
                "premium_percent": premium_percent,
                "signal": signal,
                "comex_source": comex_source,
                "mcx_source": mcx_source,
            },
        )

    async def populate(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        use_dhan: bool = True,
        batch_size: int = 100,
    ):
        """Main method to populate arbitrage history."""
        logger.info(f"Starting arbitrage history population for {symbol}")
        logger.info(f"Date range: {start_date} to {end_date}")

        # Step 1: Fetch USD/INR rates from database
        usdinr_rates = self.fetch_usdinr_rates(start_date, end_date)
        if not usdinr_rates:
            logger.error("No USD/INR rates found in database")
            return

        # Step 2: Fetch COMEX prices from yfinance
        comex_prices = self.fetch_comex_prices(symbol, start_date, end_date)
        if not comex_prices:
            logger.error("No COMEX prices fetched")
            return

        # Step 3: Fetch MCX prices from DhanHQ (if available)
        mcx_prices = {}
        if use_dhan:
            mcx_prices = await self.fetch_mcx_prices_dhan(symbol, start_date, end_date)

        # Step 4: Calculate arbitrage and insert records
        records_inserted = 0
        records_skipped = 0

        with self.Session() as session:
            batch_count = 0

            for record_date in sorted(comex_prices.keys()):
                # Check if we have USD/INR rate for this date
                if record_date not in usdinr_rates:
                    records_skipped += 1
                    continue

                comex_price = comex_prices[record_date]
                usdinr_rate = usdinr_rates[record_date]

                # Get MCX price (from DhanHQ or estimate)
                if record_date in mcx_prices:
                    mcx_price = mcx_prices[record_date]
                    mcx_source = "DhanHQ"
                else:
                    mcx_price = self.estimate_mcx_price(
                        comex_price, usdinr_rate, symbol
                    )
                    mcx_source = "estimated"

                # Calculate arbitrage metrics
                metrics = self.calculate_arbitrage_metrics(
                    mcx_price=mcx_price,
                    comex_price_usd=comex_price,
                    usdinr_rate=usdinr_rate,
                    symbol=symbol,
                )

                # Insert record
                self.insert_arbitrage_record(
                    session=session,
                    symbol=symbol,
                    record_date=record_date,
                    comex_price_usd=comex_price,
                    mcx_price_inr=mcx_price,
                    usdinr_rate=usdinr_rate,
                    fair_value_inr=metrics["fair_value"],
                    premium=metrics["premium"],
                    premium_percent=metrics["premium_percent"],
                    signal=metrics["signal"],
                    comex_source=f"Yahoo Finance ({COMEX_SYMBOLS[symbol]})",
                    mcx_source=mcx_source,
                )

                records_inserted += 1
                batch_count += 1

                # Commit in batches
                if batch_count >= batch_size:
                    session.commit()
                    logger.info(
                        f"Committed batch of {batch_count} records (total: {records_inserted})"
                    )
                    batch_count = 0

            # Final commit
            if batch_count > 0:
                session.commit()
                logger.info(f"Committed final batch of {batch_count} records")

        logger.info("Population complete!")
        logger.info(f"Records inserted: {records_inserted}")
        logger.info(f"Records skipped (no USD/INR rate): {records_skipped}")


async def main():
    parser = argparse.ArgumentParser(description="Populate arbitrage history table")
    parser.add_argument(
        "--symbol",
        type=str,
        default="GOLD",
        choices=["GOLD", "SILVER"],
        help="Commodity symbol (GOLD or SILVER)",
    )
    parser.add_argument(
        "--start-date", type=str, default="2024-01-01", help="Start date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--end-date",
        type=str,
        default=None,
        help="End date (YYYY-MM-DD), defaults to today",
    )
    parser.add_argument(
        "--no-dhan",
        action="store_true",
        help="Skip DhanHQ and use estimated MCX prices",
    )
    parser.add_argument(
        "--batch-size", type=int, default=100, help="Batch size for database commits"
    )

    args = parser.parse_args()

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
    end_date = (
        datetime.strptime(args.end_date, "%Y-%m-%d").date()
        if args.end_date
        else date.today()
    )

    populator = ArbitrageHistoryPopulator()
    await populator.populate(
        symbol=args.symbol,
        start_date=start_date,
        end_date=end_date,
        use_dhan=not args.no_dhan,
        batch_size=args.batch_size,
    )


if __name__ == "__main__":
    asyncio.run(main())
