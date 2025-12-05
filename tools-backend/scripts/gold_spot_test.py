import pandas as pd
import requests

API_KEY = "YG3FY2P6DWXGOX5MGJJ87875MGJJ8"
INPUT_EXCHANGE_FILE = "usd_inr_timeseries.csv"
TEST_OUTPUT_FILE = "gold_test.csv"

TEST_START = "2023-01-01"
TEST_END = "2023-01-10"


def fetch_timeseries(start, end):
    url = (
        f"https://api.metals.dev/v1/timeseries"
        f"?api_key={API_KEY}&metal=gold&start_date={start}&end_date={end}"
    )
    print(f"🔍 Requesting timeseries: {url}")
    response = requests.get(url, timeout=15)
    data = response.json()
    return data.get("rates", {})  # dict of dates -> dict


def main():
    # Load FX data
    fx_df = pd.read_csv(INPUT_EXCHANGE_FILE, parse_dates=["date"])

    # Restrict to test range
    mask = (fx_df["date"] >= TEST_START) & (fx_df["date"] <= TEST_END)
    fx_test = fx_df.loc[mask].copy()
    fx_test["date_str"] = fx_test["date"].dt.strftime("%Y-%m-%d")

    print(f"📌 Testing with {len(fx_test)} dates")

    # Fetch gold prices only once
    rates_raw = fetch_timeseries(TEST_START, TEST_END)

    results = []
    for _, row in fx_test.iterrows():
        date_str = row["date_str"]
        usd_inr_rate = row["usd_inr_rate"]

        item = rates_raw.get(date_str)  # None if missing

        if item and "metals" in item and "gold" in item["metals"]:
            usd_price = float(item["metals"]["gold"])
            inr_price = usd_price * float(usd_inr_rate)
            status = "OK"
        else:
            usd_price = None
            inr_price = None
            status = "MISSING"

        results.append(
            {
                "date": date_str,
                "usd_price": usd_price,
                "usd_inr_rate": usd_inr_rate,
                "inr_price": inr_price,
                "status": status,
            }
        )

        print(f"{date_str} → USD={usd_price}, INR={inr_price}, status={status}")

    pd.DataFrame(results).to_csv(TEST_OUTPUT_FILE, index=False)
    print(f"\n💾 Test CSV saved: {TEST_OUTPUT_FILE}")
    print("\n👉 If this looks correct, we will run full range next.")


if __name__ == "__main__":
    main()
