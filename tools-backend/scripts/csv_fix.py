import csv
from decimal import Decimal, InvalidOperation

INPUT_CSV = "metals_historical_usd_inr.csv"
OUTPUT_CSV = "output_filled.csv"

USD_COLUMNS = ["gold_usd", "palladium_usd", "platinum_usd", "silver_usd"]
INR_COLUMNS = ["gold_inr", "palladium_inr", "platinum_inr", "silver_inr"]


def safe_decimal(value: str):
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        return None


def main():
    last_rate = None

    with (
        open(INPUT_CSV, newline="", encoding="utf-8") as f_in,
        open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f_out,
    ):
        reader = csv.DictReader(f_in)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            # If this row has a usd_inr_rate, update last_rate
            rate = safe_decimal(row.get("usd_inr_rate", ""))
            if rate is not None:
                last_rate = rate
            # If missing but we have a previous rate, fill it
            elif last_rate is not None:
                row["usd_inr_rate"] = str(last_rate)

            # Recompute INR prices if we now have a rate
            rate = safe_decimal(row.get("usd_inr_rate", ""))
            if rate is not None:
                for usd_col, inr_col in zip(USD_COLUMNS, INR_COLUMNS):
                    usd_val = safe_decimal(row.get(usd_col, ""))
                    if usd_val is not None:
                        inr_val = usd_val * rate
                        row[inr_col] = f"{inr_val:.6f}"

            writer.writerow(row)


if __name__ == "__main__":
    main()
