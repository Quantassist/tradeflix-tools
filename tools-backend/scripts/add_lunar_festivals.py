"""
Script to add lunar calendar festival dates for Indian festivals.
These festivals fall on different dates each year based on the lunar calendar.
"""

import requests

# API base URL
BASE_URL = "http://localhost:8000/api/v1/seasonal-events"

# Akshaya Tritiya dates 2015-2025
AKSHAYA_TRITIYA_DATES = [
    (2015, 4, 21),
    (2016, 5, 9),
    (2017, 4, 29),
    (2018, 4, 18),
    (2019, 5, 7),
    (2020, 4, 26),
    (2021, 5, 14),
    (2022, 5, 3),
    (2023, 4, 22),
    (2024, 5, 10),
    (2025, 4, 30),
]

# Diwali dates 2015-2025
DIWALI_DATES = [
    (2015, 11, 11),
    (2016, 10, 30),
    (2017, 10, 19),
    (2018, 11, 6),
    (2019, 10, 27),
    (2020, 11, 14),
    (2021, 11, 4),
    (2022, 10, 24),
    (2023, 11, 12),
    (2024, 10, 31),
    (2025, 10, 20),
]

# Dhanteras dates 2015-2025 (2 days before Diwali)
DHANTERAS_DATES = [
    (2015, 11, 9),
    (2016, 10, 28),
    (2017, 10, 17),
    (2018, 11, 4),
    (2019, 10, 25),
    (2020, 11, 12),
    (2021, 11, 2),
    (2022, 10, 22),
    (2023, 11, 10),
    (2024, 10, 29),
    (2025, 10, 18),
]


def create_event(event_data: dict) -> dict:
    """Create a seasonal event via API."""
    response = requests.post(BASE_URL + "/", json=event_data)
    if response.status_code == 201:
        print(f"✓ Created: {event_data['name']} - {event_data['start_date']}")
        return response.json()
    else:
        print(
            f"✗ Failed to create {event_data['name']}: {response.status_code} - {response.text}"
        )
        return None


def add_festival_dates(festival_name: str, dates: list, description: str):
    """Add all dates for a festival."""
    print(f"\n{'=' * 50}")
    print(f"Adding {festival_name} dates...")
    print(f"{'=' * 50}")

    for year, month, day in dates:
        event_data = {
            "name": festival_name,
            "event_type": "festival_india",
            "description": description,
            "country": "India",
            "start_date": f"{year}-{month:02d}-{day:02d}",
            "recurrence": "lunar",  # Mark as lunar-based recurrence
            "is_lunar_based": True,
            "duration_days": 1,
            "affects_gold": True,
            "affects_silver": True,
            "event_metadata": {
                "year": year,
                "lunar_calendar": True,
                "festival_category": "gold_buying",
            },
        }
        create_event(event_data)


def main():
    print("=" * 60)
    print("Adding Lunar Calendar Festival Dates")
    print("=" * 60)

    # Add Akshaya Tritiya dates
    add_festival_dates(
        "Akshaya Tritiya",
        AKSHAYA_TRITIYA_DATES,
        "Auspicious day for buying gold in Hindu tradition. Considered one of the most important gold-buying days in India.",
    )

    # Add Diwali dates
    add_festival_dates(
        "Diwali",
        DIWALI_DATES,
        "Festival of lights and major gold-buying occasion in India. One of the most significant festivals for precious metals demand.",
    )

    # Add Dhanteras dates
    add_festival_dates(
        "Dhanteras",
        DHANTERAS_DATES,
        "Festival of wealth, celebrated 2 days before Diwali. Traditionally the most auspicious day to buy gold and silver.",
    )

    print("\n" + "=" * 60)
    print("Done! All lunar calendar festival dates have been added.")
    print("=" * 60)


if __name__ == "__main__":
    main()
