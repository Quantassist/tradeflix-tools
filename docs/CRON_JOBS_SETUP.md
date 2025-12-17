# Cron Jobs Setup Guide

This document details all scheduled tasks (cron jobs) for the Tradeflix Tools backend, including setup instructions for local development and cloud deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Available Cron Jobs](#available-cron-jobs)
3. [HTTP Endpoints (Recommended)](#http-endpoints-recommended)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
   - [Windows Task Scheduler](#windows-task-scheduler)
   - [Linux/Mac Crontab](#linuxmac-crontab)
6. [Cloud Deployment](#cloud-deployment)
   - [Render](#render)
   - [Railway](#railway)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Cron jobs are scheduled tasks that run automatically at specified intervals. For Tradeflix Tools, these jobs handle:

- **Data ingestion**: Fetching and storing market data at end of day
- **Data cleanup**: Archiving or removing old records
- **Health checks**: Monitoring external API availability

All cron scripts are located in `tools-backend/scripts/cron/` directory.

---

## Available Cron Jobs

### 1. EOD Arbitrage Data Ingestion

**Script**: `scripts/cron/eod_arbitrage_cron.py`

**Purpose**: Fetches current COMEX and MCX prices for Gold and Silver, calculates arbitrage metrics, and stores them in the database.

**Recommended Schedule**: 6:00 PM IST (12:30 PM UTC) on weekdays (Mon-Fri)

**Why this time?**: MCX closes at 11:30 PM IST, but 6:00 PM captures the overlap period when both COMEX and MCX are actively trading.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--symbols` | Space-separated list of symbols | `GOLD SILVER` |
| `--dry-run` | Test mode - don't save to DB | `false` |

**Usage Examples**:
```bash
# Standard run
python scripts/cron/eod_arbitrage_cron.py

# Dry run (test without saving)
python scripts/cron/eod_arbitrage_cron.py --dry-run

# Single symbol
python scripts/cron/eod_arbitrage_cron.py --symbols GOLD

# With logging to file
python scripts/cron/eod_arbitrage_cron.py >> logs/arbitrage_cron.log 2>&1
```

**Expected Output**:
```
2025-12-17 18:00:00 - INFO - Starting EOD Arbitrage Ingestion
2025-12-17 18:00:01 - INFO - COMEX GOLD: $2650.50
2025-12-17 18:00:01 - INFO - USD/INR: ₹84.5000
2025-12-17 18:00:02 - INFO - MCX GOLD: ₹75500.00
2025-12-17 18:00:02 - INFO - ✓ Saved GOLD: premium=2.150%, signal=neutral
```

---

## HTTP Endpoints (Recommended)

The recommended approach for cloud deployment is using HTTP endpoints. This leverages your existing FastAPI app with all environment variables already configured.

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cron/arbitrage` | POST | Trigger EOD arbitrage data ingestion |
| `/api/v1/cron/health` | GET | Health check (no auth required) |
| `/api/v1/cron/status` | GET | Get status of all cron jobs |

### Authentication

All cron endpoints (except `/health`) require the `X-Cron-Secret` header for authentication.

**Use your `SECRET_KEY` environment variable as the cron secret.**

### Trigger Arbitrage Cron via HTTP

```bash
# Using curl
curl -X POST "https://your-api.com/api/v1/cron/arbitrage" \
  -H "X-Cron-Secret: your_secret_key" \
  -H "Content-Type: application/json"

# With custom symbols
curl -X POST "https://your-api.com/api/v1/cron/arbitrage?symbols=GOLD" \
  -H "X-Cron-Secret: your_secret_key"

# Dry run
curl -X POST "https://your-api.com/api/v1/cron/arbitrage?dry_run=true" \
  -H "X-Cron-Secret: your_secret_key"
```

### Response Format

```json
{
  "status": "success",
  "timestamp": "2025-12-17T18:00:00.000000",
  "symbols": ["GOLD", "SILVER"],
  "dry_run": false,
  "message": "Arbitrage data ingestion completed"
}
```

### Check Cron Status

```bash
curl -X GET "https://your-api.com/api/v1/cron/status" \
  -H "X-Cron-Secret: your_secret_key"
```

---

## Environment Variables

Ensure these environment variables are set before running any cron job:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DHAN_CLIENT_ID` | Yes | DhanHQ API client ID |
| `DHAN_ACCESS_TOKEN` | Yes | DhanHQ API access token |

**Example `.env`**:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
DHAN_CLIENT_ID=your_client_id
DHAN_ACCESS_TOKEN=your_access_token
```

---

## Local Development Setup

### Windows Task Scheduler

1. **Open Task Scheduler**: Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create New Task**: Click "Create Task" in the right panel

3. **General Tab**:
   - Name: `Tradeflix EOD Arbitrage`
   - Description: `Fetches and stores daily arbitrage data`
   - Check "Run whether user is logged on or not"

4. **Triggers Tab**:
   - Click "New..."
   - Begin the task: "On a schedule"
   - Settings: Daily
   - Start: 6:00:00 PM
   - Advanced settings:
     - Check "Repeat task every: 1 day"
     - Check "Stop task if it runs longer than: 30 minutes"
   - Click OK

5. **Actions Tab**:
   - Click "New..."
   - Action: "Start a program"
   - Program/script: `D:\QA\tradeflix-tools\tools-backend\.venv\Scripts\python.exe`
   - Add arguments: `scripts\eod_arbitrage_cron.py`
   - Start in: `D:\QA\tradeflix-tools\tools-backend`
   - Click OK

6. **Conditions Tab**:
   - Uncheck "Start the task only if the computer is on AC power" (if needed)

7. **Settings Tab**:
   - Check "Allow task to be run on demand"
   - Check "If the task fails, restart every: 5 minutes"
   - Attempt to restart up to: 3 times

8. Click OK and enter your Windows password when prompted

**Test the task**: Right-click the task → "Run"

### Linux/Mac Crontab

1. **Open crontab editor**:
   ```bash
   crontab -e
   ```

2. **Add cron entry** (runs at 6:00 PM IST / 12:30 PM UTC on weekdays):
   ```bash
   # EOD Arbitrage Data Ingestion - Mon-Fri at 6:00 PM IST
   30 12 * * 1-5 cd /path/to/tradeflix-tools/tools-backend && /path/to/.venv/bin/python scripts/eod_arbitrage_cron.py >> /var/log/tradeflix/arbitrage_cron.log 2>&1
   ```

3. **Create log directory**:
   ```bash
   sudo mkdir -p /var/log/tradeflix
   sudo chown $USER:$USER /var/log/tradeflix
   ```

4. **Verify cron is running**:
   ```bash
   crontab -l
   ```

**Cron Time Format Reference**:
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * * command
```

**Common Schedules**:
| Schedule | Cron Expression |
|----------|-----------------|
| Every day at 6 PM IST | `30 12 * * *` |
| Weekdays at 6 PM IST | `30 12 * * 1-5` |
| Every hour | `0 * * * *` |
| Every 15 minutes | `*/15 * * * *` |

---

## Cloud Deployment

Since your FastAPI app already has all environment variables configured, the **HTTP endpoint approach is recommended**. This avoids duplicating env vars and leverages your existing deployment.

### Render (Recommended: HTTP Endpoint)

Use Render's built-in cron to call your HTTP endpoint:

1. **Go to Render Dashboard** → Your project → **Cron Jobs**

2. **Create a new Cron Job**:
   - **Name**: `eod-arbitrage-cron`
   - **Schedule**: `30 12 * * 1-5` (6:00 PM IST on weekdays)
   - **Command**:
     ```bash
     curl -X POST "https://your-api.onrender.com/api/v1/cron/arbitrage" \
       -H "X-Cron-Secret: $SECRET_KEY" \
       -H "Content-Type: application/json"
     ```

3. **Add Environment Variable**:
   - `SECRET_KEY`: Same as your main web service

4. **Deploy**

**Alternative: Use cron-job.org (Free)**

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-api.onrender.com/api/v1/cron/arbitrage`
   - **Schedule**: Custom → 12:30 UTC, Mon-Fri
   - **Request Method**: POST
   - **Headers**: Add `X-Cron-Secret: your_secret_key`
3. Save and enable

### Railway (Recommended: HTTP Endpoint)

Use Railway's cron feature to call your HTTP endpoint:

1. **Go to Railway Dashboard** → Your project

2. **Add a Cron Job**:
   - Click **+ New** → **Cron Job**
   - **Schedule**: `30 12 * * 1-5`
   - **Command**:
     ```bash
     curl -X POST "$RAILWAY_PUBLIC_DOMAIN/api/v1/cron/arbitrage" \
       -H "X-Cron-Secret: $SECRET_KEY" \
       -H "Content-Type: application/json"
     ```

3. **Link Environment Variables** from your main service

**Alternative: Railway HTTP Cron (Simpler)**

Railway can directly call HTTP endpoints:

1. Go to your web service → **Settings** → **Cron**
2. Add cron trigger:
   - **Path**: `/api/v1/cron/arbitrage`
   - **Schedule**: `30 12 * * 1-5`
   - **Method**: POST
   - **Headers**: `X-Cron-Secret: ${SECRET_KEY}`

### Quick Setup Checklist

| Step | Render | Railway |
|------|--------|---------|
| 1. Deploy main app | ✅ | ✅ |
| 2. Note your API URL | `your-app.onrender.com` | `your-app.up.railway.app` |
| 3. Get SECRET_KEY | From env vars | From env vars |
| 4. Create cron job | Dashboard → Cron Jobs | Dashboard → + New → Cron |
| 5. Set schedule | `30 12 * * 1-5` | `30 12 * * 1-5` |
| 6. Test endpoint | `curl -X POST ...` | `curl -X POST ...` |

---

## Monitoring & Logging

### Log Locations

| Environment | Log Location |
|-------------|--------------|
| Windows | Check Task Scheduler History |
| Linux/Mac | `/var/log/tradeflix/arbitrage_cron.log` |
| Render | Render Dashboard → Logs |
| Railway | Railway Dashboard → Logs |

### Health Checks

To verify cron jobs are running correctly:

```sql
-- Check latest arbitrage records
SELECT symbol, recorded_at, premium_percent, signal 
FROM tradeflix_tools.arbitrage_history 
ORDER BY recorded_at DESC 
LIMIT 10;

-- Check if today's data exists
SELECT * FROM tradeflix_tools.arbitrage_history 
WHERE recorded_at::date = CURRENT_DATE;

-- Count records per day (last 7 days)
SELECT recorded_at::date, COUNT(*) 
FROM tradeflix_tools.arbitrage_history 
WHERE recorded_at > NOW() - INTERVAL '7 days'
GROUP BY recorded_at::date 
ORDER BY recorded_at::date DESC;
```

### Alerting (Optional)

Consider setting up alerts for:
- Cron job failures (Render/Railway have built-in notifications)
- Missing daily data (custom monitoring script)
- API rate limit errors

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Ensure you're using the correct Python environment
which python  # Linux/Mac
where python  # Windows

# Activate virtual environment first
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

#### 2. Database connection errors
```bash
# Test database connection
python -c "from config import settings; print(settings.database_url[:50])"

# Verify DATABASE_URL is set
echo $DATABASE_URL  # Linux/Mac
echo %DATABASE_URL% # Windows
```

#### 3. DhanHQ API errors
```bash
# Test DhanHQ credentials
python scripts/eod_arbitrage_cron.py --dry-run
```

#### 4. Cron not running (Linux)
```bash
# Check if cron service is running
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog
```

#### 5. Task Scheduler not running (Windows)
- Check Task Scheduler service is running
- Verify "Run whether user is logged on or not" is checked
- Check task history for error codes

### Error Codes

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | Partial failure (some symbols failed) |
| 2 | Complete failure (all symbols failed) |

---

## Adding New Cron Jobs

When adding a new cron job:

1. Create the script in `tools-backend/scripts/`
2. Follow the pattern of `eod_arbitrage_cron.py`:
   - Use argparse for CLI arguments
   - Include `--dry-run` option
   - Use proper logging
   - Return appropriate exit codes
3. Update this document with the new job details
4. Add deployment configurations for Render/Railway

---

## Future Cron Jobs (Planned)

| Job | Purpose | Schedule | Status |
|-----|---------|----------|--------|
| EOD Arbitrage | Daily arbitrage data | 6 PM IST weekdays | ✅ Active |
| COT Data Sync | Weekly COT report ingestion | Saturday 8 AM IST | 🔜 Planned |
| Data Cleanup | Archive old records | Sunday 2 AM IST | 🔜 Planned |
| API Health Check | Monitor external APIs | Every 15 min | 🔜 Planned |

---

*Last updated: December 17, 2025*
