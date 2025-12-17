"""
Test script to explore DhanHQ historical data API for MCX commodities.

This script:
1. Fetches the instrument list to find all GOLD/SILVER contracts
2. Tests fetching historical data for different contract expiries
3. Determines how to build continuous historical data

Usage:
    python scripts/test_dhan_historical.py
"""

import asyncio
import sys
import os
from datetime import date, datetime, timedelta
import logging
import requests
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def fetch_mcx_instruments():
    """Fetch MCX instrument list from DhanHQ."""
    logger.info("Fetching MCX instrument list...")

    # Download the scrip master CSV
    url = "https://images.dhan.co/api-data/api-scrip-master.csv"

    try:
        df = pd.read_csv(url)
        logger.info(f"Total instruments: {len(df)}")

        # Filter for MCX commodities
        mcx_df = df[df["SEM_EXM_EXCH_ID"] == "MCX"]
        logger.info(f"MCX instruments: {len(mcx_df)}")

        # Filter for FUTCOM (Commodity Futures)
        futcom_df = mcx_df[mcx_df["SEM_INSTRUMENT_NAME"] == "FUTCOM"]
        logger.info(f"MCX FUTCOM instruments: {len(futcom_df)}")

        # Find GOLD contracts
        gold_df = futcom_df[
            futcom_df["SEM_TRADING_SYMBOL"].str.contains("GOLD", case=False, na=False)
        ]
        logger.info(f"\nGOLD contracts found: {len(gold_df)}")
        if not gold_df.empty:
            print("\nGOLD Contracts:")
            print(
                gold_df[
                    [
                        "SEM_SMST_SECURITY_ID",
                        "SEM_TRADING_SYMBOL",
                        "SEM_EXPIRY_DATE",
                        "SEM_LOT_UNITS",
                    ]
                ].to_string()
            )

        # Find SILVER contracts
        silver_df = futcom_df[
            futcom_df["SEM_TRADING_SYMBOL"].str.contains("SILVER", case=False, na=False)
        ]
        logger.info(f"\nSILVER contracts found: {len(silver_df)}")
        if not silver_df.empty:
            print("\nSILVER Contracts:")
            print(
                silver_df[
                    [
                        "SEM_SMST_SECURITY_ID",
                        "SEM_TRADING_SYMBOL",
                        "SEM_EXPIRY_DATE",
                        "SEM_LOT_UNITS",
                    ]
                ].to_string()
            )

        return gold_df, silver_df

    except Exception as e:
        logger.error(f"Failed to fetch instrument list: {e}")
        return None, None


def fetch_historical_data_v2(security_id: str, from_date: str, to_date: str):
    """Fetch historical data using DhanHQ v2 API directly."""

    if not settings.dhan_access_token:
        logger.error("DHAN_ACCESS_TOKEN not configured")
        return None

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

    logger.info(
        f"Fetching historical data for security_id={security_id} from {from_date} to {to_date}"
    )

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        if "open" in data:
            num_candles = len(data.get("open", []))
            logger.info(f"Received {num_candles} candles")

            if num_candles > 0:
                # Show first and last few data points
                timestamps = data.get("timestamp", [])
                closes = data.get("close", [])

                if timestamps:
                    first_date = datetime.fromtimestamp(timestamps[0]).strftime(
                        "%Y-%m-%d"
                    )
                    last_date = datetime.fromtimestamp(timestamps[-1]).strftime(
                        "%Y-%m-%d"
                    )
                    logger.info(f"Date range: {first_date} to {last_date}")
                    logger.info(f"First close: {closes[0]}, Last close: {closes[-1]}")

            return data
        else:
            logger.warning(f"Unexpected response: {data}")
            return data

    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error: {e}")
        logger.error(f"Response: {e.response.text if e.response else 'No response'}")
        return None
    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        return None


def test_continuous_data():
    """Test fetching continuous historical data by using INDEX instrument type."""

    if not settings.dhan_access_token:
        logger.error("DHAN_ACCESS_TOKEN not configured")
        return

    # Try fetching with INDEX instrument type for continuous data
    # MCX provides continuous contracts for analysis

    url = "https://api.dhan.co/v2/charts/historical"

    headers = {
        "Content-Type": "application/json",
        "access-token": settings.dhan_access_token,
    }

    # Try different approaches
    test_cases = [
        # Try with FUTCOM and different expiry codes
        {
            "securityId": "449534",
            "instrument": "FUTCOM",
            "expiryCode": 0,
            "desc": "GOLD current contract",
        },
        {
            "securityId": "449534",
            "instrument": "FUTCOM",
            "expiryCode": 1,
            "desc": "GOLD expiry code 1",
        },
        {
            "securityId": "449534",
            "instrument": "FUTCOM",
            "expiryCode": 2,
            "desc": "GOLD expiry code 2",
        },
    ]

    for tc in test_cases:
        payload = {
            "securityId": tc["securityId"],
            "exchangeSegment": "MCX_COMM",
            "instrument": tc["instrument"],
            "expiryCode": tc["expiryCode"],
            "oi": False,
            "fromDate": "2024-01-01",
            "toDate": "2024-12-31",
        }

        logger.info(f"\nTesting: {tc['desc']}")

        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()

            if "open" in data:
                num_candles = len(data.get("open", []))
                timestamps = data.get("timestamp", [])

                if num_candles > 0 and timestamps:
                    first_date = datetime.fromtimestamp(timestamps[0]).strftime(
                        "%Y-%m-%d"
                    )
                    last_date = datetime.fromtimestamp(timestamps[-1]).strftime(
                        "%Y-%m-%d"
                    )
                    logger.info(
                        f"  Candles: {num_candles}, Range: {first_date} to {last_date}"
                    )
                else:
                    logger.info(f"  No data returned")
            else:
                logger.info(f"  Response: {str(data)[:200]}")

        except Exception as e:
            logger.error(f"  Error: {e}")


async def test_with_provider():
    """Test using the existing DhanHQ provider."""
    from services.data_providers import DhanHQProvider

    if not settings.dhan_client_id or not settings.dhan_access_token:
        logger.error("DhanHQ credentials not configured")
        return

    provider = DhanHQProvider(
        client_id=settings.dhan_client_id,
        access_token=settings.dhan_access_token,
    )

    # Test fetching historical data
    try:
        logger.info("\nTesting with DhanHQProvider...")

        # Try fetching recent data
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        data = await provider.get_historical_data(
            symbol="GOLD",
            start_date=start_date,
            end_date=end_date,
        )

        logger.info(f"Provider returned {len(data.data_points)} data points")
        if data.data_points:
            logger.info(
                f"First: {data.data_points[0].date} - {data.data_points[0].close}"
            )
            logger.info(
                f"Last: {data.data_points[-1].date} - {data.data_points[-1].close}"
            )

    except Exception as e:
        logger.error(f"Provider error: {e}")


def main():
    logger.info("=" * 60)
    logger.info("DhanHQ Historical Data Test")
    logger.info("=" * 60)

    # Step 1: Fetch instrument list
    gold_df, silver_df = fetch_mcx_instruments()

    if gold_df is not None and not gold_df.empty:
        # Step 2: Test fetching historical data for the first GOLD contract
        first_gold_id = str(gold_df.iloc[0]["SEM_SMST_SECURITY_ID"])
        logger.info("\n" + "=" * 60)
        logger.info(f"Testing historical data fetch for GOLD (ID: {first_gold_id})")
        logger.info("=" * 60)

        # Try fetching 1 year of data
        fetch_historical_data_v2(
            security_id=first_gold_id,
            from_date="2024-01-01",
            to_date="2024-12-31",
        )

        # Try fetching older data (2023)
        logger.info("\nTrying older data (2023)...")
        fetch_historical_data_v2(
            security_id=first_gold_id,
            from_date="2023-01-01",
            to_date="2023-12-31",
        )

        # Try fetching even older data (2020)
        logger.info("\nTrying 2020 data...")
        fetch_historical_data_v2(
            security_id=first_gold_id,
            from_date="2020-01-01",
            to_date="2020-12-31",
        )

    # Step 3: Test continuous data approaches
    logger.info("\n" + "=" * 60)
    logger.info("Testing continuous data approaches")
    logger.info("=" * 60)
    test_continuous_data()

    # Step 4: Test with provider
    logger.info("\n" + "=" * 60)
    logger.info("Testing with DhanHQProvider")
    logger.info("=" * 60)
    asyncio.run(test_with_provider())


if __name__ == "__main__":
    main()
