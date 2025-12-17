"""
EOD Arbitrage Data Ingestion Script

This script fetches current arbitrage data for GOLD and SILVER and stores it in the database.
Designed to be run as a cron job at end of trading day (e.g., 6:00 PM IST).

Usage:
    # Run directly
    python scripts/eod_arbitrage_cron.py

    # Run with specific symbols
    python scripts/eod_arbitrage_cron.py --symbols GOLD SILVER

    # Dry run (don't save to DB)
    python scripts/eod_arbitrage_cron.py --dry-run

Cron Setup (Linux/Mac):
    # Add to crontab (crontab -e) - runs at 6:00 PM IST (12:30 PM UTC)
    30 12 * * 1-5 cd /path/to/tools-backend && /path/to/.venv/bin/python scripts/eod_arbitrage_cron.py >> /var/log/arbitrage_cron.log 2>&1

Windows Task Scheduler:
    - Create a new task to run at 6:00 PM IST on weekdays
    - Action: Start a program
    - Program: C:\\path\\to\\.venv\\Scripts\\python.exe
    - Arguments: scripts\\eod_arbitrage_cron.py
    - Start in: C:\\path\\to\\tools-backend

Environment Variables Required:
    - DATABASE_URL: PostgreSQL connection string
    - DHAN_CLIENT_ID: DhanHQ client ID
    - DHAN_ACCESS_TOKEN: DhanHQ access token
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config import settings
from services.arbitrage_service import ArbitrageService
from services.data_providers import YahooFinanceProvider, DhanHQProvider

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Constants
COMEX_SYMBOLS = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
}

MCX_CONTRACT_SIZES = {
    "GOLD": 10,  # 10 grams
    "SILVER": 1000,  # 1 kg (1000 grams)
}

IMPORT_DUTY_PERCENT = 2.5


class EODArbitrageIngestion:
    """Handles end-of-day arbitrage data ingestion."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.arbitrage_service = ArbitrageService()

        # Initialize providers
        self.yahoo_provider = YahooFinanceProvider()
        self.dhan_provider = None
        if settings.dhan_client_id and settings.dhan_access_token:
            self.dhan_provider = DhanHQProvider(
                client_id=settings.dhan_client_id,
                access_token=settings.dhan_access_token,
            )

        # Database connection
        if not dry_run:
            self.engine = create_engine(settings.database_url)
            self.Session = sessionmaker(bind=self.engine)

    async def fetch_comex_price(self, symbol: str) -> float | None:
        """Fetch current COMEX price from Yahoo Finance."""
        try:
            comex_symbol = COMEX_SYMBOLS.get(symbol)
            if not comex_symbol:
                logger.error(f"Unknown symbol: {symbol}")
                return None

            price_data = await self.yahoo_provider.get_price(comex_symbol)
            if price_data and price_data.price:
                logger.info(f"COMEX {symbol}: ${price_data.price:.2f}")
                return price_data.price
            return None
        except Exception as e:
            logger.error(f"Error fetching COMEX price for {symbol}: {e}")
            return None

    async def fetch_usdinr_rate(self) -> float | None:
        """Fetch current USD/INR rate."""
        try:
            price_data = await self.yahoo_provider.get_price("USDINR=X")
            if price_data and price_data.price:
                logger.info(f"USD/INR: ₹{price_data.price:.4f}")
                return price_data.price
            return None
        except Exception as e:
            logger.error(f"Error fetching USD/INR rate: {e}")
            return None

    async def fetch_mcx_price(self, symbol: str) -> float | None:
        """Fetch current MCX price from DhanHQ."""
        if not self.dhan_provider:
            logger.warning("DhanHQ provider not configured")
            return None

        try:
            price_data = await self.dhan_provider.get_price(symbol)
            if price_data and price_data.price:
                logger.info(f"MCX {symbol}: ₹{price_data.price:.2f}")
                return price_data.price
            return None
        except Exception as e:
            logger.error(f"Error fetching MCX price for {symbol}: {e}")
            return None

    def calculate_arbitrage(
        self, symbol: str, comex_price: float, mcx_price: float, usdinr_rate: float
    ) -> dict:
        """Calculate arbitrage metrics."""
        contract_size = MCX_CONTRACT_SIZES.get(symbol, 10)

        # Calculate fair value
        fair_value = self.arbitrage_service.calculate_fair_value(
            comex_price_usd_per_oz=comex_price,
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

    def save_to_database(
        self,
        symbol: str,
        comex_price: float,
        mcx_price: float,
        usdinr_rate: float,
        fair_value: float,
        premium: float,
        premium_percent: float,
        signal: str,
    ):
        """Save arbitrage record to database."""
        if self.dry_run:
            logger.info(
                f"[DRY RUN] Would save: {symbol} premium={premium_percent:.3f}%"
            )
            return

        session = self.Session()
        try:
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
                    "recorded_at": datetime.now().replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ),
                    "comex_price_usd": comex_price,
                    "mcx_price_inr": mcx_price,
                    "usdinr_rate": usdinr_rate,
                    "fair_value_inr": fair_value,
                    "premium": premium,
                    "premium_percent": premium_percent,
                    "signal": signal,
                    "comex_source": "YahooFinance",
                    "mcx_source": "DhanHQ",
                },
            )
            session.commit()
            logger.info(
                f"✓ Saved {symbol}: premium={premium_percent:.3f}%, signal={signal}"
            )
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving {symbol} to database: {e}")
            raise
        finally:
            session.close()

    async def process_symbol(self, symbol: str) -> bool:
        """Process a single symbol - fetch data and save to DB."""
        logger.info(f"\n{'=' * 50}")
        logger.info(f"Processing {symbol}")
        logger.info(f"{'=' * 50}")

        # Fetch prices
        comex_price = await self.fetch_comex_price(symbol)
        if not comex_price:
            logger.error(f"Failed to fetch COMEX price for {symbol}")
            return False

        usdinr_rate = await self.fetch_usdinr_rate()
        if not usdinr_rate:
            logger.error("Failed to fetch USD/INR rate")
            return False

        mcx_price = await self.fetch_mcx_price(symbol)
        if not mcx_price:
            logger.error(f"Failed to fetch MCX price for {symbol}")
            return False

        # Calculate arbitrage
        metrics = self.calculate_arbitrage(symbol, comex_price, mcx_price, usdinr_rate)

        logger.info(f"Fair Value: ₹{metrics['fair_value']:.2f}")
        logger.info(
            f"Premium: ₹{metrics['premium']:.2f} ({metrics['premium_percent']:.3f}%)"
        )
        logger.info(f"Signal: {metrics['signal']}")

        # Save to database
        self.save_to_database(
            symbol=symbol,
            comex_price=comex_price,
            mcx_price=mcx_price,
            usdinr_rate=usdinr_rate,
            fair_value=metrics["fair_value"],
            premium=metrics["premium"],
            premium_percent=metrics["premium_percent"],
            signal=metrics["signal"],
        )

        return True

    async def run(self, symbols: list[str]):
        """Run EOD ingestion for specified symbols."""
        logger.info(f"Starting EOD Arbitrage Ingestion at {datetime.now()}")
        logger.info(f"Symbols: {symbols}")
        logger.info(f"Dry run: {self.dry_run}")

        success_count = 0
        for symbol in symbols:
            try:
                if await self.process_symbol(symbol):
                    success_count += 1
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")

        logger.info(f"\n{'=' * 50}")
        logger.info(
            f"Completed: {success_count}/{len(symbols)} symbols processed successfully"
        )
        logger.info(f"{'=' * 50}")

        return success_count == len(symbols)


async def main():
    parser = argparse.ArgumentParser(description="EOD Arbitrage Data Ingestion")
    parser.add_argument(
        "--symbols",
        nargs="+",
        default=["GOLD", "SILVER"],
        help="Symbols to process (default: GOLD SILVER)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't save to database, just show what would be saved",
    )

    args = parser.parse_args()

    ingestion = EODArbitrageIngestion(dry_run=args.dry_run)
    success = await ingestion.run(args.symbols)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
