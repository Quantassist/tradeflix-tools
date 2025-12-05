# Database Setup Guide - TimescaleDB Cloud

## Overview
This project uses **TimescaleDB Cloud** (hosted PostgreSQL with TimescaleDB extension) for time-series data storage and analysis.

## Connection Details

Your TimescaleDB cloud instance:
- **Host:** u20qkdsfsdf8w5fd.lwm2sdfdhzyqgt.tsdb.cloud.timescale.com
- **Port:** 32508
- **Database:** tsdb
- **User:** tsdbadmin
- **SSL Mode:** require

Connection string is already configured in `.env` file.

---

## Setup Steps

### 1. Test Database Connection

First, verify you can connect to TimescaleDB:

```bash
cd d:\QA\tradeflix-tools\tools-backend
uv run python scripts/test_db_connection.py
```

This will:
- ✅ Test connection to TimescaleDB cloud
- ✅ Check PostgreSQL and TimescaleDB versions
- ✅ List existing tables
- ✅ Verify write permissions

### 2. Run Database Migrations

Create all tables using Alembic:

```bash
# Generate initial migration (if not exists)
uv run alembic revision --autogenerate -m "Initial schema"

# Apply migrations
uv run alembic upgrade head
```

This creates:
- `users` table
- `historical_prices` table
- `strategies` and `backtests` tables
- `alert_rules` and `alerts` tables

### 3. Initialize TimescaleDB Features

Convert `historical_prices` to a hypertable for optimized time-series queries:

**Option A: Using psql (if installed)**
```bash
psql "postgres://tsdbadmin:j5jn3nfmx88fdsfsnons7@u20qkdsfsdf8w5fd.lwm2sdfdhzyqgt.tsdb.cloud.timescale.com:32508/tsdb?sslmode=require" < scripts/init_timescaledb.sql
```

**Option B: Using Python script (recommended)**
```bash
uv run python scripts/init_timescaledb.py
```

This will:
- ✅ Enable TimescaleDB extension
- ✅ Convert `historical_prices` to hypertable
- ✅ Create indexes for common queries
- ✅ Set up compression policy (compress data > 30 days old)
- ✅ Set up retention policy (keep 10 years of data)
- ✅ Create continuous aggregates for daily OHLC

### 4. Verify Setup

Check that everything is configured correctly:

```bash
uv run python scripts/verify_timescaledb.py
```

---

## Database Schema

### Users Table
```sql
users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    tier VARCHAR DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    telegram_chat_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
)
```

### Historical Prices Table (Hypertable)
```sql
historical_prices (
    id SERIAL,
    symbol VARCHAR NOT NULL,
    exchange VARCHAR NOT NULL,
    timeframe VARCHAR NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open DECIMAL NOT NULL,
    high DECIMAL NOT NULL,
    low DECIMAL NOT NULL,
    close DECIMAL NOT NULL,
    volume BIGINT,
    PRIMARY KEY (id, timestamp)
)
```

**TimescaleDB Features:**
- Partitioned by time (7-day chunks)
- Automatic compression after 30 days
- Continuous aggregates for daily data
- Optimized for time-range queries

### Strategies & Backtests Tables
```sql
strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    rules JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
)

backtests (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES strategies(id),
    symbol VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
)
```

### Alert Tables
```sql
alert_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR NOT NULL,
    condition JSONB NOT NULL,
    notification_channels JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
)

alerts (
    id SERIAL PRIMARY KEY,
    alert_rule_id INTEGER REFERENCES alert_rules(id),
    triggered_at TIMESTAMP DEFAULT NOW(),
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'sent'
)
```

---

## Common Operations

### View Migration History
```bash
uv run alembic history
```

### Check Current Migration
```bash
uv run alembic current
```

### Rollback Migration
```bash
uv run alembic downgrade -1
```

### Create New Migration
```bash
uv run alembic revision -m "description"
```

### Upgrade to Specific Version
```bash
uv run alembic upgrade <revision_id>
```

---

## TimescaleDB-Specific Queries

### Query Recent Prices
```sql
SELECT * FROM historical_prices
WHERE symbol = 'GOLD'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

### Get Daily OHLC (using continuous aggregate)
```sql
SELECT * FROM historical_prices_daily
WHERE symbol = 'GOLD'
  AND day > NOW() - INTERVAL '30 days'
ORDER BY day DESC;
```

### Check Hypertable Info
```sql
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'historical_prices';
```

### Check Compression Status
```sql
SELECT * FROM timescaledb_information.compression_settings
WHERE hypertable_name = 'historical_prices';
```

---

## Troubleshooting

### Connection Issues
1. Check if DATABASE_URL in `.env` is correct
2. Verify network connectivity (firewall, VPN)
3. Confirm SSL mode is set to `require`
4. Test with: `uv run python scripts/test_db_connection.py`

### Migration Errors
1. Check if database is accessible
2. Verify all model imports in `alembic/env.py`
3. Clear alembic version table if needed:
   ```sql
   DELETE FROM alembic_version;
   ```

### TimescaleDB Extension Not Found
1. Connect to database and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   ```
2. Verify with:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'timescaledb';
   ```

---

## Performance Tips

1. **Use time-bucketing for aggregations:**
   ```sql
   SELECT time_bucket('1 hour', timestamp) AS hour,
          AVG(close) as avg_price
   FROM historical_prices
   WHERE symbol = 'GOLD'
   GROUP BY hour;
   ```

2. **Leverage continuous aggregates** for frequently accessed data

3. **Use compression** for historical data (automatically enabled)

4. **Create indexes** on frequently queried columns

5. **Use connection pooling** (already configured in SQLAlchemy)

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Rotate database password regularly
- Use read-only credentials for analytics queries
- Enable IP whitelisting in TimescaleDB cloud console
- Monitor connection logs for suspicious activity

---

## Next Steps

After database setup:
1. ✅ Seed initial data (symbols, test users)
2. ✅ Set up data ingestion pipeline
3. ✅ Configure backup strategy
4. ✅ Set up monitoring and alerts
5. ✅ Test with production-like data volumes
