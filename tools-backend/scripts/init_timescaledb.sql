-- Initialize TimescaleDB and create hypertables for time-series data
-- Run this after creating the initial tables with Alembic

-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert historical_prices table to hypertable
-- This optimizes it for time-series queries
SELECT create_hypertable(
    'historical_prices',
    'timestamp',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '7 days'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol_timeframe 
    ON historical_prices (symbol, timeframe, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_historical_prices_exchange 
    ON historical_prices (exchange, symbol, timestamp DESC);

-- Add compression policy (compress data older than 30 days)
SELECT add_compression_policy(
    'historical_prices',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- Add retention policy (optional - keep data for 10 years)
SELECT add_retention_policy(
    'historical_prices',
    INTERVAL '10 years',
    if_not_exists => TRUE
);

-- Create continuous aggregates for common timeframe conversions
-- Daily OHLC from minute data
CREATE MATERIALIZED VIEW IF NOT EXISTS historical_prices_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    symbol,
    exchange,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume
FROM historical_prices
WHERE timeframe = '1min'
GROUP BY day, symbol, exchange;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy(
    'historical_prices_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_historical_prices_daily_symbol 
    ON historical_prices_daily (symbol, day DESC);

COMMENT ON TABLE historical_prices IS 'Time-series price data optimized with TimescaleDB hypertable';
COMMENT ON MATERIALIZED VIEW historical_prices_daily IS 'Daily OHLC data aggregated from minute data';
