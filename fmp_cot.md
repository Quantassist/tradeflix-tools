### Commitment Of Traders (COT) API

Source: https://site.financialmodelingprep.com/developer/docs/pricing

Access Commitment of Traders (COT) reports and analysis data.

```APIDOC
## Commitment Of Traders

### COT Report
Retrieve the Commitment of Traders (COT) report.

### COT Analysis By Dates
Access COT analysis filtered by date ranges.

### COT Report List
Get a list of available COT reports.
```

--------------------------------

### COT Report List API

Source: https://site.financialmodelingprep.com/developer/docs/index

Access a comprehensive list of available Commitment of Traders (COT) reports by commodity or futures contract.

```APIDOC
## GET /commitment-of-traders-list

### Description
Provides a list of available Commitment of Traders (COT) reports, filterable by commodity or futures contract.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-list
```

--------------------------------

### COT Analysis By Dates API

Source: https://site.financialmodelingprep.com/developer/docs/index

Gain in-depth insights into market sentiment by analyzing Commitment of Traders (COT) reports for a specific date range.

```APIDOC
## GET /commitment-of-traders-analysis

### Description
Analyzes Commitment of Traders (COT) reports within a specified date range to understand market dynamics and sentiment.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-analysis
```

--------------------------------

### COT Report API

Source: https://site.financialmodelingprep.com/developer/docs/index

Access comprehensive Commitment of Traders (COT) reports. Provides detailed information about long and short positions across various sectors, helping to assess market sentiment.

```APIDOC
## GET /commitment-of-traders-report

### Description
Fetches comprehensive Commitment of Traders (COT) reports for market sentiment analysis.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-report
```

--------------------------------

### COT Analysis By Dates API

Source: https://site.financialmodelingprep.com/developer/docs/stable

Analyze Commitment of Traders (COT) reports for a specific date range to evaluate market dynamics, sentiment, and potential reversals across various sectors.

```APIDOC
## GET /stable/commitment-of-traders-analysis

### Description
Analyze COT reports for a specific date range to understand market dynamics and sentiment.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-analysis

### Parameters
#### Query Parameters
- **symbol** (string) - Optional - The symbol of the commodity or futures contract (e.g., GC=F for Gold).
- **startDate** (string) - Required - The start date for the analysis (YYYY-MM-DD).
- **endDate** (string) - Required - The end date for the analysis (YYYY-MM-DD).

### Request Example
```
GET /stable/commitment-of-traders-analysis?symbol=GC=F&startDate=2023-11-01&endDate=2023-11-30
```

### Response
#### Success Response (200)
- **symbol** (string) - The symbol of the commodity or futures contract.
- **analysis** (object) - An object containing the analysis results.
  - **averageNonCommercialLong** (float) - Average long positions held by non-commercial traders.
  - **averageNonCommercialShort** (float) - Average short positions held by non-commercial traders.
  - **sentiment** (string) - An indicator of market sentiment (e.g., Bullish, Bearish, Neutral).

#### Response Example
```json
{
  "symbol": "GC=F",
  "analysis": {
    "averageNonCommercialLong": 210500.5,
    "averageNonCommercialShort": 95200.75,
    "sentiment": "Bullish"
  }
}
```
```

--------------------------------

### COT Report API

Source: https://site.financialmodelingprep.com/developer/docs/stable/cot-report

Retrieves Commitment of Traders (COT) reports. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment and track positions in commodities, indices, and financial instruments.

```APIDOC
## GET /stable/_commitment-of-traders-report_

### Description
Retrieves Commitment of Traders (COT) reports. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment and track positions in commodities, indices, and financial instruments.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/_commitment-of-traders-report_

### Parameters
#### Query Parameters
- **symbol** (string) - Required - The symbol for which to retrieve the COT report (e.g., AAPL).
- **from** (date) - Optional - The start date for the report period (e.g., 2024-01-01).
- **to** (date) - Optional - The end date for the report period (e.g., 2024-03-01).

### Request Example
`GET https://financialmodelingprep.com/stable/_commitment-of-traders-report_?symbol=AAPL&from=2024-01-01&to=2024-03-01`

### Response
#### Success Response (200)
- **symbol** (string) - The symbol for which the report is generated.
- **date** (date) - The date of the report.
- **openInterest** (integer) - The total open interest for the given instrument.
- **change** (integer) - The change in open interest from the previous report.
- **// Other relevant fields for COT report data will be present here.**

#### Response Example
{
  "symbol": "AAPL",
  "date": "2024-03-01",
  "openInterest": 100000,
  "change": 5000
  // ... other data fields
}
```

--------------------------------

### COT Report List API

Source: https://site.financialmodelingprep.com/developer/docs/stable

Access a comprehensive list of available Commitment of Traders (COT) reports by commodity or futures contract. This API provides an overview of different market segments.

```APIDOC
## GET /stable/commitment-of-traders-list

### Description
Retrieve a list of available COT reports by commodity or futures contract.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-list

### Parameters
None

### Request Example
```
GET /stable/commitment-of-traders-list
```

### Response
#### Success Response (200)
- **symbol** (string) - The symbol of the commodity or futures contract.
- **name** (string) - The name of the commodity or futures contract.

#### Response Example
```json
[
  {
    "symbol": "GC=F",
    "name": "Gold Futures"
  },
  {
    "symbol": "CL=F",
    "name": "Crude Oil Futures"
  }
]
```
```

--------------------------------

### COT Analysis By Dates API

Source: https://site.financialmodelingprep.com/developer/docs/stable/cot-report-analysis

This endpoint retrieves Commitment of Traders (COT) report analysis for a specified date range, enabling market sentiment evaluation and trend identification.

```APIDOC
## GET /_commitment-of-traders-analysis_

### Description
Retrieves detailed Commitment of Traders (COT) report analysis for a given date range, providing insights into market sentiment, net position changes, and historical comparisons.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/_commitment-of-traders-analysis_

### Parameters
#### Query Parameters
- **symbol** (string) - Required - The trading symbol for which to retrieve COT data (e.g., AAPL).
- **from** (date) - Required - The start date for the analysis (YYYY-MM-DD). Max 90-day date range.
- **to** (date) - Required - The end date for the analysis (YYYY-MM-DD). Max 90-day date range.

### Request Example
```json
{
  "request": "GET /_commitment-of-traders-analysis_?symbol=AAPL&from=2024-01-01&to=2024-03-01"
}
```

### Response
#### Success Response (200)
- **symbol** (string) - The trading symbol.
- **date** (string) - The date of the report.
- **name** (string) - The name of the asset (e.g., British Pound).
- **sector** (string) - The sector of the asset (e.g., CURRENCIES).
- **exchange** (string) - The exchange where the asset is traded.
- **currentLongMarketSituation** (number) - The current percentage of long positions.
- **currentShortMarketSituation** (number) - The current percentage of short positions.
- **marketSituation** (string) - The current market sentiment (e.g., Bullish).
- **previousLongMarketSituation** (number) - The previous percentage of long positions.
- **previousShortMarketSituation** (number) - The previous percentage of short positions.
- **previousMarketSituation** (string) - The previous market sentiment.
- **netPostion** (integer) - The net position (long - short).
- **previousNetPosition** (integer) - The previous net position.
- **changeInNetPosition** (number) - The change in net position from the previous period.
- **marketSentiment** (string) - An indicator of market sentiment change (e.g., Increasing Bullish).
- **reversalTrend** (boolean) - Indicates if a reversal trend is detected.

#### Response Example
```json
[
  {
    "symbol": "B6",
    "date": "2024-02-27 00:00:00",
    "name": "British Pound (B6)",
    "sector": "CURRENCIES",
    "exchange": "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE",
    "currentLongMarketSituation": 66.85,
    "currentShortMarketSituation": 33.15,
    "marketSituation": "Bullish",
    "previousLongMarketSituation": 67.97,
    "previousShortMarketSituation": 32.03,
    "previousMarketSituation": "Bullish",
    "netPostion": 46358,
    "previousNetPosition": 46312,
    "changeInNetPosition": 0.1,
    "marketSentiment": "Increasing Bullish",
    "reversalTrend": false
  }
]
```
```

--------------------------------

### COT Analysis By Dates API Response Example

Source: https://site.financialmodelingprep.com/developer/docs/stable/cot-report-analysis

This JSON response provides detailed COT data for a specific date, including current and previous market situations, net positions, and sentiment trends. It's used to evaluate market sentiment and potential reversals.

```json
[ { "symbol": "B6", "date": "2024-02-27 00:00:00", "name": "British Pound (B6)", "sector": "CURRENCIES", "exchange": "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE", "currentLongMarketSituation": 66.85, "currentShortMarketSituation": 33.15, "marketSituation": "Bullish", "previousLongMarketSituation": 67.97, "previousShortMarketSituation": 32.03, "previousMarketSituation": "Bullish", "netPostion": 46358, "previousNetPosition": 46312, "changeInNetPosition": 0.1, "marketSentiment": "Increasing Bullish", "reversalTrend": false } ]
```

--------------------------------

### Commitment of Traders Report API

Source: https://site.financialmodelingprep.com/developer/docs/cot-symbols-list-api

Access comprehensive Commitment of Traders (COT) reports with the FMP COT Report API. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment and track positions in commodities, indices, and financial instruments.

```APIDOC
## Commitment of Traders Report API

### Description
Access comprehensive Commitment of Traders (COT) reports with the FMP COT Report API. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment and track positions in commodities, indices, and financial instruments.

### Method
GET

### Endpoint
/api/v3/cot

### Parameters
#### Query Parameters
- **symbol** (string) - Optional - The ticker symbol for the report (e.g., 'GC' for Gold Futures).
- **date** (string) - Optional - The date for the report in 'YYYY-MM-DD' format.
```

--------------------------------

### Commitment Of Traders (COT) Report API

Source: https://site.financialmodelingprep.com/developer/docs/crowdfunding-offerings-by-cik-api

Access comprehensive Commitment of Traders (COT) reports. This API provides detailed information about long and short positions across various sectors.

```APIDOC
## GET /api/v3/cot

### Description
Access comprehensive Commitment of Traders (COT) reports. This API provides detailed information about long and short positions across various sectors.

### Method
GET

### Endpoint
/api/v3/cot

### Parameters
#### Query Parameters
- **apikey** (string) - Required - Your unique API key.

### Response
#### Success Response (200)
- **reports** (array) - An array of COT report objects.
  - **category** (string) - The category of the report (e.g., 'Non-Commercial', 'Commercial').
  - **contract_size** (integer) - The contract size for the commodity.
  - **change** (integer) - The change in positions from the previous report.
  - **change_open_interest** (integer) - The change in open interest.
  - **delta_w_delta** (float) - Delta W Delta value.
  - **future_price** (float) - The future price of the commodity.
  - **gross_short_actual** (integer) - Gross short positions.
  - **gross_short_non_reportable** (integer) - Non-reportable gross short positions.
  - **gross_long_actual** (integer) - Gross long positions.
  - **gross_long_non_reportable** (integer) - Non-reportable gross long positions.
  - **hedgers_ratio** (float) - Hedgers ratio.
  - **long_ைக** (integer) - Long interest.
  - **long_open_interest** (integer) - Long open interest.
  - **long_positions** (integer) - Total long positions.
  - **market** (string) - The market the report pertains to.
  - **previous_day_open_interest** (integer) - Open interest from the previous day.
  - **price_close** (float) - The closing price.
  - **price_change** (float) - The price change.
  - **report_date_week_ending** (string) - The date the report week ended.
  - **short_ைக** (integer) - Short interest.
  - **short_open_interest** (integer) - Short open interest.
  - **short_positions** (integer) - Total short positions.
  - **symbol** (string) - The symbol for the commodity.
  - **open_interest** (integer) - Total open interest.
  - **net_non_reportable** (integer) - Net non-reportable positions.
  - **net_non_commercial** (integer) - Net non-commercial positions.
  - **net_commercial** (integer) - Net commercial positions.
  - **net_hedging** (integer) - Net hedging positions.

#### Response Example
```json
{
  "reports": [
    {
      "category": "Non-Commercial",
      "contract_size": 100000,
      "change": -10000,
      "change_open_interest": -5000,
      "delta_w_delta": 0.1,
      "future_price": 1500.00,
      "gross_short_actual": 50000,
      "gross_short_non_reportable": 5000,
      "gross_long_actual": 70000,
      "gross_long_non_reportable": 8000,
      "hedgers_ratio": 0.5,
      "long_ைக": 78000,
      "long_open_interest": 80000,
      "long_positions": 90000,
      "market": "Gold",
      "previous_day_open_interest": 85000,
      "price_close": 1510.50,
      "price_change": 10.50,
      "report_date_week_ending": "2023-10-27",
      "short_ைக": 68000,
      "short_open_interest": 70000,
      "short_positions": 80000,
      "symbol": "GC=F",
      "open_interest": 150000,
      "net_non_reportable": 3000,
      "net_non_commercial": 20000,
      "net_commercial": -20000,
      "net_hedging": -5000
    }
  ]
}
```
```

--------------------------------

### GET /api/v4/commitment_of_traders_report

Source: https://site.financialmodelingprep.com/developer/docs/cot-reports-api

Retrieves the Commitment of Traders (COT) report for a specified date range. This report is crucial for understanding market sentiment and speculative positioning.

```APIDOC
## GET /api/v4/commitment_of_traders_report

### Description
Provides a full Commitment of Traders (COT) report for a given date range. This report includes information such as the net long and net short positions of different types of market participants, the change in these positions over time, the open interest for all symbols, and the speculative positioning index.

### Method
GET

### Endpoint
https://financialmodelingprep.com/api/v4/commitment_of_traders_report

### Parameters
#### Query Parameters
- **_from_** (date) - Required - The start date for the report (YYYY-MM-DD).
- **_to_** (date) - Required - The end date for the report (YYYY-MM-DD).

### Request Example
```
https://financialmodelingprep.com/api/v4/commitment_of_traders_report?_from_=2023-08-10&_to_=2023-10-10
```

### Response
#### Success Response (200)
- **symbol** (string) - The trading symbol.
- **date** (string) - The date of the report.
- **openInterest** (integer) - The total open interest for the symbol.
- **change** (integer) - The change in open interest from the previous period.
- **changeOpenInterest** (integer) - The change in open interest.
- **previousDayOpenInterest** (integer) - The open interest from the previous day.
- **net_non_commercial** (number) - Net non-commercial positions.
- **gross_non_commercial_long** (number) - Gross non-commercial long positions.
- **gross_non_commercial_short** (number) - Gross non-commercial short positions.
- **non_commercial_change** (number) - Change in non-commercial positions.
- **net_non_leveraged** (number) - Net non-leveraged positions.
- **gross_non_leveraged_long** (number) - Gross non-leveraged long positions.
- **gross_non_leveraged_short** (number) - Gross non-leveraged short positions.
- **non_leveraged_change** (number) - Change in non-leveraged positions.
- **net_commercial** (number) - Net commercial positions.
- **gross_commercial_long** (number) - Gross commercial long positions.
- **gross_commercial_short** (number) - Gross commercial short positions.
- **commercial_change** (number) - Change in commercial positions.
- **contract_type** (string) - The type of contract.

#### Response Example
```json
[
  {
    "symbol": "S",
    "date": "2023-10-10",
    "openInterest": 500000,
    "change": 10000,
    "changeOpenInterest": 5000,
    "previousDayOpenInterest": 495000,
    "net_non_commercial": 200000,
    "gross_non_commercial_long": 300000,
    "gross_non_commercial_short": 100000,
    "non_commercial_change": 5000,
    "net_non_leveraged": 150000,
    "gross_non_leveraged_long": 250000,
    "gross_non_leveraged_short": 100000,
    "non_leveraged_change": 4000,
    "net_commercial": -100000,
    "gross_commercial_long": 50000,
    "gross_commercial_short": 150000,
    "commercial_change": -3000,
    "contract_type": "F_F_SWING"
  }
]
```
```

--------------------------------

### Commitment Of Traders (COT) Report API

Source: https://site.financialmodelingprep.com/developer/docs/full-quote-commodities

Access comprehensive Commitment of Traders reports. This API provides detailed information about long and short positions across various sectors, helping to assess market sentiment and track positions in commodities, indices, and financial instruments.

```APIDOC
## GET /api/v3/cot/

### Description
Retrieves Commitment of Traders (COT) reports.

### Method
GET

### Endpoint
/api/v3/cot/

### Query Parameters
- **apikey** (string) - Required - Your API key.
- **symbol** (string) - Optional - Filter by commodity symbol (e.g., 'C%3DF'). Multiple symbols can be separated by commas.

### Request Example
```
https://financialmodelingprep.com/api/v3/cot/?symbol=C%3DF,HO%3DF&apikey=YOUR_API_KEY
```

### Response
#### Success Response (200)
- **symbol** (string) - The commodity symbol.
- **date** (string) - The date of the report.
- **open_interest** (integer) - Total open interest.
- **change_in_open_interest** (integer) - Change in open interest.
- **contract_size** (float) - The size of a single contract.
- **commercial_long_open_interest** (integer) - Commercial long open interest.
- **commercial_short_open_interest** (integer) - Commercial short open interest.
- **non_commercial_long_open_interest** (integer) - Non-commercial long open interest.
- **non_commercial_short_open_interest** (integer) - Non-commercial short open interest.
- **non_reportable_long_open_interest** (integer) - Non-reportable long open interest.
- **non_reportable_short_open_interest** (integer) - Non-reportable short open interest.

#### Response Example
```json
[
  {
    "symbol": "C%3DF",
    "date": "2023-10-27",
    "open_interest": 500000,
    "change_in_open_interest": 10000,
    "contract_size": 1000.0,
    "commercial_long_open_interest": 200000,
    "commercial_short_open_interest": 150000,
    "non_commercial_long_open_interest": 100000,
    "non_commercial_short_open_interest": 50000,
    "non_reportable_long_open_interest": 50000,
    "non_reportable_short_open_interest": 0
  }
]
```
```

--------------------------------

### Fetch COT Report Analysis by Date Range (HTTP Request)

Source: https://site.financialmodelingprep.com/developer/docs/cot-reports-analysis-api

This snippet demonstrates how to fetch the Commitment of Traders (COT) report analysis for a specified date range using the financialmodelingprep API. It requires 'from' and 'to' date parameters. The response provides market sentiment, net positions, and other relevant data for various symbols.

```HTTP
https://financialmodelingprep.com/api/v4/commitment_of_traders_report_analysis?_from_ =2023-08-10&_to_ =2023-10-10
```

--------------------------------

### GET /stable/_commitment-of-traders-list_

Source: https://site.financialmodelingprep.com/developer/docs/stable/cot-report-list

Retrieves a comprehensive list of available Commitment of Traders (COT) reports by commodity or futures contract. This API provides an overview of different market segments, allowing users to retrieve and explore COT reports for a wide variety of commodities and financial instruments.

```APIDOC
## GET /stable/_commitment-of-traders-list_

### Description
Retrieves a comprehensive list of available Commitment of Traders (COT) reports by commodity or futures contract. This API provides an overview of different market segments, allowing users to retrieve and explore COT reports for a wide variety of commodities and financial instruments.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/_commitment-of-traders-list_

### Parameters
#### Query Parameters
This endpoint does not have any query parameters.

#### Request Body
This endpoint does not accept a request body.

### Request Example
```
GET https://financialmodelingprep.com/stable/_commitment-of-traders-list_
```

### Response
#### Success Response (200)
- **symbol** (string) - The symbol representing the commodity or futures contract.
- **name** (string) - The full name of the commodity or futures contract.

#### Response Example
```json
[
  {
    "symbol": "NG",
    "name": "Natural Gas (NG)"
  }
]
```

#### Error Handling
This documentation does not specify error responses.
```

--------------------------------

### Commitment Of Traders Report API

Source: https://site.financialmodelingprep.com/developer/docs/stable

Access comprehensive Commitment of Traders (COT) reports. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment.

```APIDOC
## GET /stable/commitment-of-traders-report

### Description
Retrieve comprehensive Commitment of Traders (COT) reports.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/commitment-of-traders-report

### Parameters
#### Query Parameters
- **symbol** (string) - Optional - The symbol of the commodity or futures contract (e.g., GC=F for Gold).

### Request Example
```
GET /stable/commitment-of-traders-report?symbol=GC=F
```

### Response
#### Success Response (200)
- **symbol** (string) - The symbol of the commodity or futures contract.
- **data** (array) - An array of objects, each representing a report entry.
  - **date** (string) - The date of the report.
  - **openInterest** (integer) - The open interest.
  - **change** (integer) - The change in open interest.
  - **changeFromOpenInterest** (float) - The percentage change from the previous open interest.
  - **nonCommercialLong** (integer) - Long positions held by non-commercial traders.
  - **nonCommercialShort** (integer) - Short positions held by non-commercial traders.
  - **commercialLong** (integer) - Long positions held by commercial traders.
  - **commercialShort** (integer) - Short positions held by commercial traders.

#### Response Example
```json
{
  "symbol": "GC=F",
  "data": [
    {
      "date": "2023-12-26",
      "openInterest": 500000,
      "change": 10000,
      "changeFromOpenInterest": 2.0,
      "nonCommercialLong": 200000,
      "nonCommercialShort": 100000,
      "commercialLong": 150000,
      "commercialShort": 140000
    }
  ]
}
```
```

--------------------------------

### Example JSON Response for COT Report Analysis

Source: https://site.financialmodelingprep.com/developer/docs/cot-reports-analysis-api

This JSON object represents a sample response from the Analysis By Dates API. It details the analysis of the COT report for a specific symbol and date, including market situation, net positions, changes, and market sentiment. This data can be used to identify trends and inform trading decisions.

```json
[
  {
    "symbol": "T6",
    "date": "2022-08-23 00:00:00",
    "sector": "CURRENCIES",
    "currentLongMarketSituation": 0.77,
    "currentShortMarketSituation": 0.23,
    "marketSituation": "Bullish",
    "previousLongMarketSituation": 0.69,
    "previousShortMarketSituation": 0.22,
    "previousMarketSituation": "Bullish",
    "netPostion": 6885,
    "previousNetPosition": 5925,
    "changeInNetPosition": 16.2,
    "marketSentiment": "Increasing Bullish",
    "reversalTrend": false,
    "name": "South African Rand (T6)",
    "exchange": "SO AFRICAN RAND - CHICAGO MERCANTILE EXCHANGE"
  }
]
```

--------------------------------

### Analysis By Symbol API

Source: https://site.financialmodelingprep.com/developer/docs/analysis-by-symbol-commitment-of-traders

Provides an analysis of the Commitment of Traders (COT) report for a given symbol. This analysis includes information such as net long and net short positions, changes in positions, and open interest.

```APIDOC
## GET /api/v4/commitment_of_traders_report_analysis/{symbol}

### Description
Provides an analysis of the Commitment of Traders (COT) report for a given symbol. This analysis includes information such as the net long and net short positions of different types of market participants, the change in these positions over time, and the open interest for the symbol.

### Method
GET

### Endpoint
https://financialmodelingprep.com/api/v4/commitment_of_traders_report_analysis/_M6_

### Parameters
#### Path Parameters
- **symbol** (string) - Required - The symbol for which to retrieve the COT report analysis.

### Request Example
```json
{
  "symbol": "M6"
}
```

### Response
#### Success Response (200)
- **symbol** (string) - The financial symbol.
- **date** (string) - The date of the report.
- **sector** (string) - The sector of the symbol.
- **currentLongMarketSituation** (float) - The current long market situation.
- **currentShortMarketSituation** (float) - The current short market situation.
- **marketSituation** (string) - The overall market situation (e.g., 'Bearish', 'Bullish').
- **previousLongMarketSituation** (float) - The previous long market situation.
- **previousShortMarketSituation** (float) - The previous short market situation.
- **previousMarketSituation** (string) - The previous market situation.
- **netPostion** (integer) - The net position.
- **previousNetPosition** (integer) - The previous net position.
- **changeInNetPosition** (integer) - The change in net position.
- **marketSentiment** (string) - The market sentiment (e.g., 'Bearish', 'Bullish').
- **reversalTrend** (boolean) - Indicates if there is a reversal trend.
- **name** (string) - The name of the symbol.
- **exchange** (string) - The exchange where the symbol is traded.

#### Response Example
```json
[
  {
    "symbol": "M6",
    "date": "2022-08-23 00:00:00",
    "sector": "CURRENCIES",
    "currentLongMarketSituation": 0.43,
    "currentShortMarketSituation": 0.57,
    "marketSituation": "Bearish",
    "previousLongMarketSituation": 0.46,
    "previousShortMarketSituation": 0.55,
    "previousMarketSituation": "Bearish",
    "netPostion": -31316,
    "previousNetPosition": -21371,
    "changeInNetPosition": 0,
    "marketSentiment": "Bearish",
    "reversalTrend": false,
    "name": "Mexican Peso (M6)",
    "exchange": "MEXICAN PESO - CHICAGO MERCANTILE EXCHANGE"
  }
]
```
```

--------------------------------

### GET /api/v4/commitment_of_traders_report/{symbol}

Source: https://site.financialmodelingprep.com/developer/docs/report-by-symbol-commitment-of-traders

Retrieves the full Commitment of Traders (COT) report for a specified symbol. This endpoint is a legacy version.

```APIDOC
## GET /api/v4/commitment_of_traders_report/{symbol}

### Description
Provides a full Commitment of Traders (COT) report for a given symbol. This report includes information such as the net long and net short positions of different types of market participants, the change in these positions over time, the open interest for the symbol, and the speculative positioning index.

### Method
GET

### Endpoint
https://financialmodelingprep.com/api/v4/commitment_of_traders_report/_M6_

### Parameters
#### Path Parameters
- **symbol** (string) - Required - The trading symbol for which to retrieve the COT report. Example: M6

### Request Example
```bash
curl GET https://financialmodelingprep.com/api/v4/commitment_of_traders_report/M6
```

### Response
#### Success Response (200)
- **symbol** (string) - The trading symbol.
- **date** (string) - The date of the report.
- **reportType** (string) - The type of the report (e.g., 'Weekly').
- **contractType** (string) - The type of contract.
- **change** (integer) - The change in positions.
- **openInterest** (integer) - The total open interest.
- **changeFromOpenInterest** (integer) - The change in open interest.
- **previousOpenInterest** (integer) - The previous day's open interest.
- **thirParty** (object) - Details about third-party positions.
  - **thirParty.fundsNonUtil** (integer) - Non-utilization funds.
  - **thirParty.non_Util_Non_Reportable** (integer) - Non-reportable non-utilization.
  - **thirParty.fundsReportable** (integer) - Reportable funds.
  - **thirParty.non_Reportable** (integer) - Non-reportable positions.
- **commercial** (object) - Details about commercial positions.
  - **commercial.fundsNonUtil** (integer) - Non-utilization funds.
  - **commercial.non_Util_Non_Reportable** (integer) - Non-reportable non-utilization.
  - **commercial.fundsReportable** (integer) - Reportable funds.
  - **commercial.non_Reportable** (integer) - Non-reportable positions.
- **nonCommercial** (object) - Details about non-commercial positions.
  - **nonCommercial.fundsNonUtil** (integer) - Non-utilization funds.
  - **nonCommercial.non_Util_Non_Reportable** (integer) - Non-reportable non-utilization.
  - **nonCommercial.fundsReportable** (integer) - Reportable funds.
  - **nonCommercial.non_Reportable** (integer) - Non-reportable positions.
- **producerMerchant** (object) - Details about producer/merchant positions.
  - **producerMerchant.fundsNonUtil** (integer) - Non-utilization funds.
  - **producerMerchant.non_Util_Non_Reportable** (integer) - Non-reportable non-utilization.
  - **producerMerchant.fundsReportable** (integer) - Reportable funds.
  - **producerMerchant.non_Reportable** (integer) - Non-reportable positions.
- **leveragedSpeculator** (object) - Details about leveraged speculator positions.
  - **leveragedSpeculator.fundsNonUtil** (integer) - Non-utilization funds.
  - **leveragedSpeculator.non_Util_Non_Reportable** (integer) - Non-reportable non-utilization.
  - **leveragedSpeculator.fundsReportable** (integer) - Reportable funds.
  - **leveragedSpeculator.non_Reportable** (integer) - Non-reportable positions.

#### Response Example
```json
{
  "symbol": "M6",
  "date": "2023-10-24",
  "reportType": "Weekly",
  "contractType": "F_F_N_O",
  "change": 3000,
  "openInterest": 100000,
  "changeFromOpenInterest": 5000,
  "previousOpenInterest": 95000,
  "thirParty": {
    "fundsNonUtil": 1000,
    "non_Util_Non_Reportable": 500,
    "fundsReportable": 2000,
    "non_Reportable": 1500
  },
  "commercial": {
    "fundsNonUtil": 500,
    "non_Util_Non_Reportable": 200,
    "fundsReportable": 1000,
    "non_Reportable": 800
  },
  "nonCommercial": {
    "fundsNonUtil": 1500,
    "non_Util_Non_Reportable": 700,
    "fundsReportable": 3000,
    "non_Reportable": 1200
  },
  "producerMerchant": {
    "fundsNonUtil": 200,
    "non_Util_Non_Reportable": 100,
    "fundsReportable": 300,
    "non_Reportable": 250
  },
  "leveragedSpeculator": {
    "fundsNonUtil": 100,
    "non_Util_Non_Reportable": 50,
    "fundsReportable": 200,
    "non_Reportable": 150
  }
}
```
```

--------------------------------

### Analysis By Dates API

Source: https://site.financialmodelingprep.com/developer/docs/cot-reports-analysis-api

Provides an analysis of the Commitment of Traders (COT) report for a given date range, including net long/short positions, changes over time, and open interest.

```APIDOC
## GET /api/v4/commitment_of_traders_report_analysis

### Description
Provides an analysis of the Commitment of Traders (COT) report for a given date range. This analysis includes information such as the net long and net short positions of different types of market participants, the change in these positions over time, and the open interest for all symbols.

### Method
GET

### Endpoint
https://financialmodelingprep.com/api/v4/commitment_of_traders_report_analysis

### Parameters
#### Query Parameters
- **_from_** (date) - Required - The start date for the analysis (e.g., 2023-08-10).
- **_to_** (date) - Required - The end date for the analysis (e.g., 2023-10-10).

### Response
#### Success Response (200)
- **symbol** (string) - The symbol for the financial instrument.
- **date** (string) - The date of the report.
- **sector** (string) - The sector of the financial instrument.
- **currentLongMarketSituation** (number) - The current long market situation percentage.
- **currentShortMarketSituation** (number) - The current short market situation percentage.
- **marketSituation** (string) - The overall market situation (e.g., "Bullish").
- **previousLongMarketSituation** (number) - The previous long market situation percentage.
- **previousShortMarketSituation** (number) - The previous short market situation percentage.
- **previousMarketSituation** (string) - The previous market situation.
- **netPostion** (integer) - The net position for the current period.
- **previousNetPosition** (integer) - The net position for the previous period.
- **changeInNetPosition** (number) - The percentage change in net position.
- **marketSentiment** (string) - The market sentiment indicator.
- **reversalTrend** (boolean) - Indicates if there is a reversal trend.
- **name** (string) - The name of the financial instrument.
- **exchange** (string) - The exchange where the instrument is traded.

#### Response Example
```json
[
  {
    "symbol": "T6",
    "date": "2022-08-23 00:00:00",
    "sector": "CURRENCIES",
    "currentLongMarketSituation": 0.77,
    "currentShortMarketSituation": 0.23,
    "marketSituation": "Bullish",
    "previousLongMarketSituation": 0.69,
    "previousShortMarketSituation": 0.22,
    "previousMarketSituation": "Bullish",
    "netPostion": 6885,
    "previousNetPosition": 5925,
    "changeInNetPosition": 16.2,
    "marketSentiment": "Increasing Bullish",
    "reversalTrend": false,
    "name": "South African Rand (T6)",
    "exchange": "SO AFRICAN RAND - CHICAGO MERCANTILE EXCHANGE"
  }
]
```
```

--------------------------------

### Commitment of Traders Report API

Source: https://site.financialmodelingprep.com/developer/docs/cot-symbols-list-api

Retrieves data from the Commitment of Traders Report. This legacy endpoint provides insights into market participant positions.

```APIDOC
## GET /api/v4/_commitment_of_traders_report_/_list_

### Description
This endpoint retrieves data from the Commitment of Traders Report (COT), offering insights into the positions of various market participants.

### Method
GET

### Endpoint
https://financialmodelingprep.com/api/v4/_commitment_of_traders_report_/_list_

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **trading_symbol** (string) - The trading symbol for the market.
- **short_name** (string) - The short name or description of the market.

#### Response Example
```json
[
  {
    "trading_symbol": "NG",
    "short_name": "Natural Gas (NG)"
  }
]
```
```

--------------------------------

### ETF Holdings Endpoint Details

Source: https://site.financialmodelingprep.com/developer/docs/cot-symbols-list-api

Provides a detailed description of each field returned by the ETF Holdings endpoint. This helps in understanding the composition and data associated with an ETF's holdings.

```APIDOC
## ETF Holdings Endpoint Field Descriptions

### Description
Provides a detailed description of each field returned by the ETF Holdings endpoint. This helps in understanding the composition and data associated with an ETF's holdings.

### Fields:
- **symbol** (string) - The ticker symbol of the ETF (e.g., SPY).
- **asset** (string) - The ticker symbol of the underlying asset held by the ETF (e.g., NVDA).
- **name** (string) - The full name of the underlying asset.
- **isin** (string) - The International Securities Identification Number (ISIN) of the asset.
- **securityCusip** (string) - The CUSIP identifier of the asset.
- **sharesNumber** (integer) - The total number of shares of the asset held by the ETF.
- **weightPercentage** (float) - The asset’s weight as a percentage of the ETF’s total portfolio.
- **marketValue** (float) - The total market value of the asset holding.
- **updatedAt** (string) - The timestamp indicating the most recent update of the data.
```

--------------------------------

### Cryptocurrencies List API

Source: https://site.financialmodelingprep.com/developer/docs/cot-symbols-list-api

Get a list of all cryptocurrencies covered by the API. This endpoint provides information on supported digital assets.

```APIDOC
## Cryptocurrencies List API

### Description
Get a list of all cryptocurrencies covered by the API. This endpoint provides information on supported digital assets.

### Method
GET

### Endpoint
/api/v3/cryptocurrencies

### Parameters
#### Query Parameters
- **apikey** (string) - Required - Your API key.
```

--------------------------------

### ETF Holdings Bulk API

Source: https://site.financialmodelingprep.com/developer/docs/cot-symbols-list-api

Retrieve a list of tickers included in an ETF. This endpoint provides the composition of an ETF, listing its constituent assets.

```APIDOC
## ETF Holdings Bulk API

### Description
Retrieve a list of tickers included in an ETF. This endpoint provides the composition of an ETF, listing its constituent assets.

### Method
GET

### Endpoint
https://financialmodelingprep.com/stable/etf-holder-bulk

### Parameters
#### Query Parameters
- **date** (string) - Optional - The date for the holdings in 'YYYY-MM-DD' format.
- **apikey** (string) - Required - Your API key.
```