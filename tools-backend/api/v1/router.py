from fastapi import APIRouter

from api.v1.endpoints import (
    auth,
    users,
    prices,
    backtest,
    pivots,
    arbitrage,
    seasonal,
    correlation,
    cot,
    alerts,
    seasonal_events,
    metals_prices,
    cron,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(prices.router, prefix="/prices", tags=["Prices"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["Backtest"])
api_router.include_router(pivots.router, prefix="/pivots", tags=["Pivots"])
api_router.include_router(arbitrage.router, prefix="/arbitrage", tags=["Arbitrage"])
api_router.include_router(seasonal.router, prefix="/seasonal", tags=["Seasonal"])
api_router.include_router(
    seasonal_events.router, prefix="/seasonal-events", tags=["Seasonal Events"]
)
api_router.include_router(
    metals_prices.router, prefix="/metals-prices", tags=["Metals Prices"]
)
api_router.include_router(
    correlation.router, prefix="/correlation", tags=["Correlation"]
)
api_router.include_router(cot.router, prefix="/cot", tags=["COT"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(cron.router, prefix="/cron", tags=["Cron Jobs"])
