"""Script to add recession/crisis events to the database"""

from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

# Connect to database
conn = psycopg2.connect(os.getenv("DIRECT_URL"))
conn.autocommit = True
cur = conn.cursor()

# Step 1: Add enum value if not exists
try:
    cur.execute(
        "ALTER TYPE tradeflix_tools.event_type_enum ADD VALUE IF NOT EXISTS 'recession_crisis'"
    )
    print("✓ Enum value 'recession_crisis' added")
except Exception as e:
    print(f"Enum already exists or error: {e}")

conn.close()

# Reconnect for data insertion (new transaction)
conn = psycopg2.connect(os.getenv("DIRECT_URL"))
cur = conn.cursor()

# Step 2: Clear existing recession events
cur.execute(
    "DELETE FROM tradeflix_tools.seasonal_events WHERE event_type = 'recession_crisis'"
)
print(f"✓ Cleared existing recession events")

# Step 3: Insert recession periods
recession_periods = [
    # US Recessions
    (
        "Dot-com Bubble",
        "recession_crisis",
        "Tech bubble burst and subsequent US recession",
        "USA",
        "us",
        "2001-03-01",
        "2001-11-30",
    ),
    # Global Crises
    (
        "Global Financial Crisis",
        "recession_crisis",
        "Subprime mortgage crisis leading to global financial meltdown",
        "Global",
        "global",
        "2007-12-01",
        "2009-06-30",
    ),
    (
        "COVID-19 Recession",
        "recession_crisis",
        "Global pandemic-induced economic shutdown",
        "Global",
        "global",
        "2020-02-01",
        "2020-04-30",
    ),
    # Regional Crises
    (
        "European Debt Crisis",
        "recession_crisis",
        "Sovereign debt crisis in Eurozone countries",
        "Europe",
        "regional",
        "2011-07-01",
        "2012-06-30",
    ),
    (
        "China Stock Market Crash",
        "recession_crisis",
        "Chinese stock market bubble burst",
        "China",
        "regional",
        "2015-06-01",
        "2016-02-29",
    ),
    (
        "Brexit Vote",
        "recession_crisis",
        "UK referendum to leave European Union",
        "UK",
        "regional",
        "2016-06-01",
        "2016-07-31",
    ),
    # Commodity Crises
    (
        "Oil Price Collapse",
        "recession_crisis",
        "Crude oil price crash from oversupply",
        "Global",
        "commodity",
        "2014-06-01",
        "2016-01-31",
    ),
    # Financial Events
    (
        "Taper Tantrum",
        "recession_crisis",
        "Market reaction to Fed tapering announcement",
        "USA",
        "financial",
        "2013-05-01",
        "2013-09-30",
    ),
    # Trade Wars
    (
        "US-China Trade War",
        "recession_crisis",
        "Escalating tariffs between US and China",
        "Global",
        "trade",
        "2018-03-01",
        "2019-12-31",
    ),
    # Inflation Crises
    (
        "2022 Inflation Crisis",
        "recession_crisis",
        "Post-pandemic inflation surge and aggressive rate hikes",
        "Global",
        "inflation",
        "2022-01-01",
        "2022-12-31",
    ),
]

insert_sql = """
INSERT INTO tradeflix_tools.seasonal_events 
(name, event_type, description, country, region, start_date, end_date, recurrence, is_lunar_based, affects_gold, affects_silver, is_active, is_verified)
VALUES (%s, %s, %s, %s, %s, %s, %s, 'none', false, true, true, true, true)
"""

for period in recession_periods:
    cur.execute(insert_sql, period)
    print(f"  ✓ Added: {period[0]}")

conn.commit()
print(f"\n✓ Successfully inserted {len(recession_periods)} recession/crisis periods")

# Verify
cur.execute(
    "SELECT name, region, start_date, end_date FROM tradeflix_tools.seasonal_events WHERE event_type = 'recession_crisis' ORDER BY start_date"
)
print("\nInserted recession periods:")
for row in cur.fetchall():
    print(f"  - {row[0]} ({row[1]}): {row[2]} to {row[3]}")

conn.close()
