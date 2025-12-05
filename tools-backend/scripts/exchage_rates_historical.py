import pandas as pd
from bs4 import BeautifulSoup

# Path to your saved HTML file containing the table
HTML_FILE = "exchange_history.html"


def parse_exchange_history():
    with open(HTML_FILE, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file.read(), "html.parser")

    # Find table body
    tbody = soup.find("tbody")
    if not tbody:
        raise Exception("No <tbody> found in HTML file")

    rows = tbody.find_all("tr")

    dates = []
    rates = []

    # Skip first row (Average)
    for row in rows[1:]:
        cols = row.find_all("td")
        if len(cols) < 2:
            continue

        date_str = cols[0].text.strip()
        rate_str = cols[1].text.strip()

        try:
            rate = float(rate_str)
        except ValueError:
            continue  # skip rows with invalid numbers

        dates.append(date_str)
        rates.append(rate)

    # Construct time series
    df = pd.DataFrame({"date": pd.to_datetime(dates), "usd_inr_rate": rates})

    # Sort by date ascending (optional but recommended)
    df = df.sort_values("date").reset_index(drop=True)

    return df


if __name__ == "__main__":
    df = parse_exchange_history()
    print(df)

    # Save to CSV
    df.to_csv("usd_inr_timeseries.csv", index=False)
    print("\nSaved: usd_inr_timeseries.csv")
