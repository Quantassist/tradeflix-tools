import requests
import datetime
import time
import csv

# ---- CONFIG ----
PRIMARY_API_KEY = "3N4I1NPLYULAVSHWS05J972HWS05J"
SECONDARY_API_KEY = "YG3FY2P6DWXGOX5MGJJ87875MGJJ8"  # used after 100 requests
BASE_URL = "https://api.metals.dev/v1/timeseries"

START_DATE = datetime.date(2015, 1, 1)
END_DATE = datetime.date(2025, 12, 4)

# Chunk size (API constraint)
DAYS_PER_REQUEST = 30

# Output file
OUTPUT_CSV = "gold_prices_2015_to_2025.csv"


def daterange_chunks(start, end, size_days):
    """Yield (start, end) date ranges with chunk size."""
    current = start
    while current <= end:
        chunk_end = min(current + datetime.timedelta(days=size_days - 1), end)
        yield current, chunk_end
        current = chunk_end + datetime.timedelta(days=1)


def fetch_timeseries(api_key, start, end):
    """Call metals.dev API and return JSON."""
    params = {
        "api_key": api_key,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    }
    resp = requests.get(BASE_URL, params=params)
    resp.raise_for_status()
    return resp.json()


# ---------- MAIN EXECUTION ----------
rows = []
request_count = 0

for start, end in daterange_chunks(START_DATE, END_DATE, DAYS_PER_REQUEST):
    request_count += 1

    # select key after 100 requests
    api_key = PRIMARY_API_KEY if request_count <= 100 else SECONDARY_API_KEY

    print(
        f"[{request_count}] Fetching {start} → {end} using API key = "
        f"{'PRIMARY' if request_count <= 100 else 'SECONDARY'}"
    )

    data = fetch_timeseries(api_key, start, end)

    if "rates" not in data:
        print("⚠️ No rates in response, skipping chunk")
        continue

    # extract daily gold price
    for day, info in data["rates"].items():
        gold_price = info["metals"]["gold"]
        rows.append((day, gold_price))  # date and gold price

    # delay to avoid rate limiting
    time.sleep(1)


# ---------- SAVE CSV ----------
rows.sort(key=lambda x: x[0])  # sort by date

with open(OUTPUT_CSV, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["date", "gold_usd_toz"])
    writer.writerows(rows)

print("\n✓ DONE — CSV saved:", OUTPUT_CSV)
print("Total days fetched:", len(rows))
print("Total API requests:", request_count)
