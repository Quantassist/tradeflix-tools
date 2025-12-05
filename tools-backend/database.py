from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from config import settings

# Schema name for all tables
SCHEMA_NAME = settings.database_schema

# Create database engine with Supabase-compatible settings
engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.debug,  # Log SQL queries in debug mode
    # Set search_path via connect_args
    connect_args={"options": f"-c search_path={SCHEMA_NAME},public"},
)


# Set search_path on each connection
@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    """Set the search_path to use our schema"""
    cursor = dbapi_connection.cursor()
    cursor.execute(f"SET search_path TO {SCHEMA_NAME}, public")
    cursor.close()


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for models with schema support
# All models will use tradeflix_tools schema by default via metadata
Base = declarative_base()
Base.metadata.schema = SCHEMA_NAME


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_schema_if_not_exists():
    """Create the schema if it doesn't exist"""
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME}"))
        conn.commit()
