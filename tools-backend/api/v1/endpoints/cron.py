"""
Cron Job HTTP Endpoints

These endpoints allow triggering cron jobs via HTTP requests.
Useful for Railway/Render cron services or external cron triggers.

Security: Protected by CRON_SECRET header to prevent unauthorized access.
"""

from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from datetime import datetime
import logging

from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_cron_secret(x_cron_secret: str = Header(None, alias="X-Cron-Secret")):
    """Verify the cron secret header for authentication."""
    expected_secret = getattr(settings, "cron_secret", None) or settings.secret_key

    if not x_cron_secret:
        raise HTTPException(status_code=401, detail="Missing X-Cron-Secret header")

    if x_cron_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    return True


@router.post("/arbitrage")
async def trigger_arbitrage_cron(
    background_tasks: BackgroundTasks,
    x_cron_secret: str = Header(..., alias="X-Cron-Secret"),
    symbols: str = "GOLD,SILVER",
    dry_run: bool = False,
):
    """
    Trigger EOD Arbitrage Data Ingestion

    - **X-Cron-Secret**: Required header for authentication (use SECRET_KEY or CRON_SECRET)
    - **symbols**: Comma-separated list of symbols (default: GOLD,SILVER)
    - **dry_run**: If true, don't save to database

    This endpoint runs the arbitrage cron job to fetch current prices and store arbitrage data.
    """
    verify_cron_secret(x_cron_secret)

    logger.info(f"Cron triggered: arbitrage - symbols={symbols}, dry_run={dry_run}")

    # Import here to avoid circular imports
    from scripts.cron.eod_arbitrage_cron import EODArbitrageIngestion

    symbol_list = [s.strip().upper() for s in symbols.split(",")]

    try:
        ingestion = EODArbitrageIngestion(dry_run=dry_run)
        success = await ingestion.run(symbol_list)

        return {
            "status": "success" if success else "partial_failure",
            "timestamp": datetime.now().isoformat(),
            "symbols": symbol_list,
            "dry_run": dry_run,
            "message": "Arbitrage data ingestion completed",
        }
    except Exception as e:
        logger.error(f"Cron job failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cron job failed: {str(e)}")


@router.get("/health")
async def cron_health_check():
    """
    Health check endpoint for cron service.
    No authentication required - used by monitoring services.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "cron",
    }


@router.get("/status")
async def get_cron_status(
    x_cron_secret: str = Header(..., alias="X-Cron-Secret"),
):
    """
    Get status of available cron jobs and their last run times.

    - **X-Cron-Secret**: Required header for authentication
    """
    verify_cron_secret(x_cron_secret)

    # Import database utilities
    from database import get_db
    from sqlalchemy import text

    db = next(get_db())

    try:
        # Get latest arbitrage records for each symbol
        result = db.execute(
            text("""
            SELECT symbol, MAX(recorded_at) as last_recorded
            FROM tradeflix_tools.arbitrage_history
            GROUP BY symbol
            ORDER BY symbol
        """)
        )

        arbitrage_status = {
            row.symbol: row.last_recorded.isoformat() if row.last_recorded else None
            for row in result
        }

        return {
            "timestamp": datetime.now().isoformat(),
            "jobs": {
                "arbitrage": {
                    "description": "EOD Arbitrage Data Ingestion",
                    "endpoint": "/api/v1/cron/arbitrage",
                    "last_run": arbitrage_status,
                    "schedule": "6:00 PM IST (12:30 PM UTC) weekdays",
                }
            },
        }
    finally:
        db.close()
