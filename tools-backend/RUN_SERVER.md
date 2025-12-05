# How to Run the Backend Server

## Prerequisites
- Python 3.11+ installed
- Virtual environment created

## Step-by-Step Instructions

### 1. Navigate to Backend Directory
```bash
cd d:\QA\tradeflix-tools\tools-backend
```

### 2. Activate Virtual Environment
```bash
.venv\Scripts\activate
```

You should see `(.venv)` in your terminal prompt.

### 3. Install Dependencies (First Time Only)
```bash
pip install -r requirements.txt
```

### 4. Create Environment File (First Time Only)
```bash
copy .env.example .env
```

Edit `.env` and set minimum required values:
```env
SECRET_KEY=your-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-here-change-this
DATABASE_URL=sqlite:///./bullion_brain.db
```

### 5. Run the Server
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Verify Server is Running

You should see output like:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Starting Bullion Brain API
INFO:     Environment: development
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 7. Access API Documentation

Open your browser and visit:
- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **Health Check:** http://localhost:8000/health

## Testing the Pivot Calculator

### Option 1: Using the Test Script
```bash
python test_pivot_api.py
```

### Option 2: Using curl
```bash
curl -X POST http://localhost:8000/api/v1/pivots/calculate ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"GOLD\",\"timeframe\":\"daily\",\"ohlc\":{\"high\":73500,\"low\":72800,\"close\":73200}}"
```

### Option 3: Using Swagger UI
1. Go to http://localhost:8000/api/v1/docs
2. Find the `/pivots/calculate` endpoint
3. Click "Try it out"
4. Enter test data:
   ```json
   {
     "symbol": "GOLD",
     "timeframe": "daily",
     "ohlc": {
       "high": 73500,
       "low": 72800,
       "close": 73200
     }
   }
   ```
5. Click "Execute"
6. See the response below

## Expected Response

```json
{
  "symbol": "GOLD",
  "timeframe": "daily",
  "date": "2025-11-11",
  "ohlc": {
    "high": 73500,
    "low": 72800,
    "close": 73200
  },
  "cpr": {
    "pivot": 73166.67,
    "bc": 73150.0,
    "tc": 73183.34,
    "width": 33.34,
    "width_percent": 0.046,
    "classification": "narrow"
  },
  "floor_pivots": {
    "pivot": 73166.67,
    "r1": 73533.34,
    "r2": 73866.67,
    "r3": 74233.34,
    "s1": 72833.34,
    "s2": 72466.67,
    "s3": 72100.0
  },
  "fibonacci": {
    "level_0": 73500.0,
    "level_236": 73334.76,
    "level_382": 73232.6,
    "level_500": 73150.0,
    "level_618": 73067.4,
    "level_786": 72949.8,
    "level_100": 72800.0
  },
  "current_price": null,
  "nearest_level": null
}
```

## Troubleshooting

### Error: "ModuleNotFoundError"
**Solution:** Make sure virtual environment is activated and dependencies are installed
```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "Address already in use"
**Solution:** Port 8000 is already in use. Either:
1. Stop the other process using port 8000
2. Use a different port: `python main.py --port 8001`

### Error: "No module named 'config'"
**Solution:** Make sure you're in the `tools-backend` directory
```bash
cd d:\QA\tradeflix-tools\tools-backend
```

## Next Steps

Once the server is running successfully:

1. ✅ Test all pivot endpoints using Swagger UI
2. ✅ Run the test script: `python test_pivot_api.py`
3. 📱 Build the frontend UI to consume this API
4. 🗄️ Set up database for historical data
5. 🔐 Implement authentication endpoints

## Stopping the Server

Press `Ctrl+C` in the terminal to stop the server.
