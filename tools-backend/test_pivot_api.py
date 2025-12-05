"""
Test script for Pivot Calculator API
Run this after starting the FastAPI server to test the pivot endpoint
"""
import requests
import json

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_calculate_pivots():
    """Test the pivot calculation endpoint"""
    print("=" * 60)
    print("Testing Pivot Calculator API")
    print("=" * 60)
    
    # Test data - Gold prices
    test_data = {
        "symbol": "GOLD",
        "timeframe": "daily",
        "ohlc": {
            "high": 73500,
            "low": 72800,
            "close": 73200
        }
    }
    
    print("\n📊 Input Data:")
    print(json.dumps(test_data, indent=2))
    
    try:
        # Make API request
        response = requests.post(
            f"{BASE_URL}/pivots/calculate",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "=" * 60)
            print("📈 PIVOT CALCULATION RESULTS")
            print("=" * 60)
            
            # Display CPR
            print("\n🔵 Central Pivot Range (CPR):")
            cpr = result["cpr"]
            print(f"  Top Central (TC):    ₹{cpr['tc']:,.2f}")
            print(f"  Pivot:               ₹{cpr['pivot']:,.2f}")
            print(f"  Bottom Central (BC): ₹{cpr['bc']:,.2f}")
            print(f"  Width:               ₹{cpr['width']:,.2f} ({cpr['width_percent']:.3f}%)")
            print(f"  Classification:      {cpr['classification'].upper()}")
            
            # Display Floor Pivots
            print("\n🟢 Floor Pivot Points:")
            floor = result["floor_pivots"]
            print(f"  R3: ₹{floor['r3']:,.2f}")
            print(f"  R2: ₹{floor['r2']:,.2f}")
            print(f"  R1: ₹{floor['r1']:,.2f}")
            print(f"  P:  ₹{floor['pivot']:,.2f}")
            print(f"  S1: ₹{floor['s1']:,.2f}")
            print(f"  S2: ₹{floor['s2']:,.2f}")
            print(f"  S3: ₹{floor['s3']:,.2f}")
            
            # Display Fibonacci
            print("\n🟡 Fibonacci Retracement Levels:")
            fib = result["fibonacci"]
            print(f"  100.0%: ₹{fib['level_0']:,.2f}")
            print(f"  78.6%:  ₹{fib['level_786']:,.2f}")
            print(f"  61.8%:  ₹{fib['level_618']:,.2f} (Golden Ratio)")
            print(f"  50.0%:  ₹{fib['level_500']:,.2f}")
            print(f"  38.2%:  ₹{fib['level_382']:,.2f}")
            print(f"  23.6%:  ₹{fib['level_236']:,.2f}")
            print(f"  0.0%:   ₹{fib['level_100']:,.2f}")
            
            print("\n" + "=" * 60)
            print("✅ Test Passed!")
            print("=" * 60)
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.json())
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error!")
        print("Make sure the FastAPI server is running:")
        print("  cd tools-backend")
        print("  .venv\\Scripts\\activate")
        print("  python main.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_nearest_level():
    """Test the nearest level finder endpoint"""
    print("\n" + "=" * 60)
    print("Testing Nearest Level Finder")
    print("=" * 60)
    
    test_data = {
        "symbol": "GOLD",
        "current_price": 73100,
        "timeframe": "daily",
        "high": 73500,
        "low": 72800,
        "close": 73200
    }
    
    print("\n📊 Input Data:")
    print(f"  Current Price: ₹{test_data['current_price']:,.2f}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/pivots/nearest-level",
            params=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n📍 Nearest Level:")
            nearest = result["nearest_level"]
            print(f"  Level: {nearest['name']}")
            print(f"  Value: ₹{nearest['value']:,.2f}")
            print(f"  Distance: ₹{nearest['distance']:,.2f} ({nearest['distance_percent']:.3f}%)")
            print(f"\n📊 Market Bias: {result['market_bias'].upper()}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.json())
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_invalid_data():
    """Test error handling with invalid data"""
    print("\n" + "=" * 60)
    print("Testing Error Handling")
    print("=" * 60)
    
    # Test with high < low (invalid)
    invalid_data = {
        "symbol": "GOLD",
        "timeframe": "daily",
        "ohlc": {
            "high": 72800,  # Lower than low
            "low": 73500,
            "close": 73200
        }
    }
    
    print("\n📊 Testing with invalid data (high < low)...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/pivots/calculate",
            json=invalid_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✅ Error handling works correctly!")
            print(f"   Error message: {response.json()['detail']}")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 Starting Pivot Calculator API Tests\n")
    
    # Run tests
    test_calculate_pivots()
    test_nearest_level()
    test_invalid_data()
    
    print("\n" + "=" * 60)
    print("🎉 All Tests Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Check the API documentation: http://localhost:8000/api/v1/docs")
    print("2. Test with different symbols (SILVER, CRUDE)")
    print("3. Test with different timeframes (weekly, monthly)")
    print("4. Build the frontend UI")
