"""Script to ingest hardcoded seasonal events into the database"""

import requests

events = [
    {
        "name": "Akshaya Tritiya",
        "event_type": "festival_india",
        "start_date": "2025-05-10",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Auspicious day for gold purchases",
    },
    {
        "name": "Diwali",
        "event_type": "festival_india",
        "start_date": "2025-10-25",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Festival of lights - major gold buying season",
    },
    {
        "name": "Dhanteras",
        "event_type": "festival_india",
        "start_date": "2025-10-23",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Auspicious day for buying precious metals",
    },
    {
        "name": "Union Budget",
        "event_type": "budget_india",
        "start_date": "2025-02-01",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Annual budget announcement affecting import duties",
    },
    {
        "name": "Republic Day",
        "event_type": "holiday_trading_india",
        "start_date": "2025-01-26",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "National holiday",
    },
    {
        "name": "Independence Day",
        "event_type": "holiday_trading_india",
        "start_date": "2025-08-15",
        "country": "India",
        "affects_gold": True,
        "affects_silver": True,
        "description": "National holiday",
    },
    {
        "name": "Chinese New Year",
        "event_type": "holiday_trading_global",
        "start_date": "2025-02-10",
        "country": "China",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Major gold buying season in China",
    },
    {
        "name": "Christmas",
        "event_type": "holiday_trading_global",
        "start_date": "2025-12-25",
        "country": "Global",
        "affects_gold": True,
        "affects_silver": True,
        "description": "Global holiday affecting trading",
    },
    {
        "name": "New Year",
        "event_type": "holiday_trading_global",
        "start_date": "2025-01-01",
        "country": "Global",
        "affects_gold": True,
        "affects_silver": True,
        "description": "New year trading patterns",
    },
]

API_URL = "http://localhost:8000/api/v1/seasonal-events/"

if __name__ == "__main__":
    for event in events:
        try:
            resp = requests.post(API_URL, json=event)
            if resp.status_code == 200:
                print(f"Created: {event['name']}")
            else:
                print(f"Failed {event['name']}: {resp.status_code} - {resp.text[:100]}")
        except Exception as e:
            print(f"Error {event['name']}: {e}")
