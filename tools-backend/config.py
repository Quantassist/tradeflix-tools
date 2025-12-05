from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    app_name: str = "Bullion Brain"
    app_env: str = "development"
    debug: bool = True
    secret_key: str
    api_version: str = "v1"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str
    direct_url: str = ""  # Direct connection for migrations (bypasses pgbouncer)
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_schema: str = "tradeflix_tools"  # Schema for all tables

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS settings
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        description="Allowed CORS origins (comma-separated)",
    )
    cors_allow_credentials: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # External APIs
    alpha_vantage_api_key: str = ""
    yahoo_finance_api_key: str = ""
    cftc_api_url: str = "https://www.cftc.gov/dea/newcot"

    # Data Provider APIs
    # MetalPriceAPI - For global/international metal prices
    metal_price_api_key: str = "74d6625961e3341cd920319d76e1f9d3"

    # DhanHQ - For MCX (Indian commodity exchange) prices
    dhan_client_id: str = ""
    dhan_access_token: str = ""

    # Financial Modeling Prep - For COT data
    fmp_api_key: str = "OIDX6hjIZTz0LVsOnF4lC2C5Q3SE6PWE"

    # Telegram
    telegram_bot_token: str = ""
    telegram_webhook_url: str = ""

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@bullionbrain.com"

    # Monitoring
    sentry_dsn: str = ""

    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
