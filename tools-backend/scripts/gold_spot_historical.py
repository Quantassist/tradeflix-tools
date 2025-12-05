import requests
import csv
import time
from datetime import datetime, timedelta

# -------------- SETTINGS ----------------
API_KEYS = ["QDDOQ0HPTM5K3WR2AUXT598R2AUXT", "MNYOMWJA6MO3NDU3BZ7O587U3BZ7O"]

API_URL = "https://api.metals.dev/v1/timeseries"
BATCH_DAYS = 30

FX_CSV = "usd_inr_timeseries.csv"
OUTPUT_CSV = "metals_historical_usd_inr.csv"

START_DATE = datetime(2017, 1, 1)
END_DATE = datetime.today()

REQUEST_DELAY = 1.5  # seconds between API calls
# -----------------------------------------


# Load FX mapping (date → USD/INR rate)
def load_fx_map():
    fx_map = {}
    with open(FX_CSV, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            fx_map[row["date"]] = float(row["usd_inr_rate"])
    return fx_map


# Thread-safe CSV writer
def write_row(header, row):
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row)


# API fetch helper (never return None)
def fetch_timeseries(start_date, end_date, api_key, metal=None):
    params = {
        "api_key": api_key,
        "start_date": start_date,
        "end_date": end_date,
    }
    if metal:
        params["metal"] = metal

    try:
        resp = requests.get(API_URL, params=params, timeout=20)
        data = resp.json()
        if "rates" in data and isinstance(data["rates"], dict):
            return data["rates"]
        print("  ⚠ API returned no 'rates' field")
        return {}
    except Exception as e:
        print(f"  ❌ API request failed: {e}")
        return {}


def main():
    fx_map = load_fx_map()

    # Write CSV header dynamically based on metals
    # We'll detect metals from the first API batch
    first_key = API_KEYS[0]
    sample_rates = fetch_timeseries("2017-01-01", "2017-01-02", first_key)
    sample_day = next(iter(sample_rates.values()))
    metals_list = (
        list(sample_day["metals"].keys()) if "metals" in sample_day else ["gold"]
    )

    # Build dynamic header
    header = ["date", "usd_inr_rate", "status"]
    for m in metals_list:
        header.append(f"{m}_usd")
        header.append(f"{m}_inr")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)

    cursor = START_DATE
    key_index = 0

    while cursor <= END_DATE:
        start_str = cursor.strftime("%Y-%m-%d")
        end_dt = cursor + timedelta(days=BATCH_DAYS - 1)
        end_dt = min(end_dt, END_DATE)
        end_str = end_dt.strftime("%Y-%m-%d")

        api_key = API_KEYS[key_index]
        key_index = (key_index + 1) % len(API_KEYS)  # rotate

        print(f"\n🌐 Fetching {start_str} → {end_str}")
        print(f"  ✔ Using API key {key_index + 1}")

        rates_raw = fetch_timeseries(start_str, end_str, api_key)

        cur = cursor
        while cur <= end_dt:
            date_str = cur.strftime("%Y-%m-%d")
            fx_rate = fx_map.get(date_str)
            item = rates_raw.get(date_str)

            row = [date_str, fx_rate if fx_rate else "", "OK"]

            if item and "metals" in item:
                for m in metals_list:
                    usd_price = item["metals"].get(m)
                    if usd_price is not None:
                        usd_price = float(usd_price)
                        inr_price = usd_price * float(fx_rate) if fx_rate else ""
                        row.append(usd_price)
                        row.append(inr_price)
                    else:
                        row.append("")
                        row.append("")
                        row[2] = "API_MISSING"
            else:
                for _ in metals_list:
                    row.append("")
                    row.append("")
                row[2] = "API_MISSING"

            write_row(header, row)
            cur += timedelta(days=1)

        cursor = end_dt + timedelta(days=1)
        time.sleep(REQUEST_DELAY)

    print("\n🎉 Completed. CSV saved as:", OUTPUT_CSV)


if __name__ == "__main__":
    main()
