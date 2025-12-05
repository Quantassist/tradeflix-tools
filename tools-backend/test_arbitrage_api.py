"""
Test script for Arbitrage Calculator API
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_arbitrage_calculation():
    """Test arbitrage calculation with real-world data"""
    print("=" * 60)
    print("Testing Arbitrage Calculator API")
    print("=" * 60)
    
    # Test data - Gold arbitrage scenario
    test_data = {
        "comex_price_usd": 2650.50,  # COMEX Gold price in USD/oz
        "mcx_price_inr": 73200,       # MCX Gold price in INR (100g)
        "usdinr_rate": 83.45,         # USD/INR exchange rate
        "import_duty_percent": 2.5,   # Import duty
        "contract_size_grams": 100    # MCX contract size
    }
    
    print("\n📊 Input Data:")
    print(f"   COMEX Price: ${test_data['comex_price_usd']}/oz")
    print(f"   MCX Price: ₹{test_data['mcx_price_inr']}/100g")
    print(f"   USDINR Rate: ₹{test_data['usdinr_rate']}")
    print(f"   Import Duty: {test_data['import_duty_percent']}%")
    
    try:
        response = requests.post(
            f"{BASE_URL}/arbitrage/calculate",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "=" * 60)
            print("💰 ARBITRAGE ANALYSIS RESULTS")
            print("=" * 60)
            
            # Fair Value
            fv = result["fair_value"]
            print("\n🔵 Fair Value Calculation:")
            print(f"   COMEX Price: ${fv['comex_price_usd']}/oz")
            print(f"   USDINR Rate: ₹{fv['usdinr_rate']}")
            print(f"   Price/gram (with duty): ₹{fv['price_per_gram_inr']}")
            print(f"   Fair Value (100g): ₹{fv['fair_value_inr']:,.2f}")
            
            # Arbitrage Metrics
            arb = result["arbitrage"]
            print("\n📊 Arbitrage Metrics:")
            print(f"   MCX Price: ₹{arb['mcx_price']:,.2f}")
            print(f"   Fair Value: ₹{arb['fair_value']:,.2f}")
            print(f"   Premium: ₹{arb['premium']:,.2f}")
            print(f"   Premium %: {arb['premium_percent']:.3f}%")
            print(f"   Signal: {arb['signal'].upper()}")
            
            if arb['z_score']:
                print(f"   Z-Score: {arb['z_score']:.2f}")
            if arb['percentile']:
                print(f"   Percentile: {arb['percentile']:.1f}%")
            
            # Profit Analysis
            profit = result["profit_analysis"]
            print("\n💵 Profit Analysis:")
            print(f"   Gross Profit: ₹{profit['gross_profit']:,.2f}")
            print(f"   Brokerage: ₹{profit['brokerage']:,.2f}")
            print(f"   Exchange Fees: ₹{profit['exchange_fees']:,.2f}")
            print(f"   Tax (STT+GST): ₹{profit['tax']:,.2f}")
            print(f"   Total Costs: ₹{profit['total_costs']:,.2f}")
            print(f"   Net Profit: ₹{profit['net_profit']:,.2f}")
            print(f"   Net Profit %: {profit['net_profit_percent']:.2f}%")
            
            # Recommendation
            print("\n🎯 Trading Recommendation:")
            print(f"   {result['recommendation']}")
            print(f"   Risk Level: {result['risk_level'].upper()}")
            
            print("\n" + "=" * 60)
            print("✅ Test Passed!")
            print("=" * 60)
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.json())
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error!")
        print("Make sure the FastAPI server is running:")
        print("  uv run python main.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_realtime_arbitrage():
    """Test real-time arbitrage endpoint"""
    print("\n" + "=" * 60)
    print("Testing Real-time Arbitrage (Mock Data)")
    print("=" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/arbitrage/realtime",
            params={"symbol": "GOLD", "contract_size": 100}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Real-time data retrieved")
            print(f"   Symbol: {result['symbol']}")
            print(f"   Premium: {result['arbitrage']['premium_percent']:.3f}%")
            print(f"   Signal: {result['arbitrage']['signal'].upper()}")
            print(f"   Recommendation: {result['recommendation']}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_sensitivity_analysis():
    """Test USDINR sensitivity analysis"""
    print("\n" + "=" * 60)
    print("Testing USDINR Sensitivity Analysis")
    print("=" * 60)
    
    params = {
        "comex_price_usd": 2650.50,
        "current_usdinr": 83.45,
        "usdinr_change": 0.50,  # 50 paisa increase
        "contract_size": 100
    }
    
    print(f"\n📊 Scenario: USDINR increases by ₹{params['usdinr_change']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/arbitrage/sensitivity",
            params=params
        )
        
        if response.status_code == 200:
            result = response.json()
            analysis = result["analysis"]
            
            print(f"\n📈 Impact Analysis:")
            print(f"   Current USDINR: ₹{analysis['current_usdinr']}")
            print(f"   New USDINR: ₹{analysis['new_usdinr']}")
            print(f"   Current Fair Value: ₹{analysis['current_fair_value']:,.2f}")
            print(f"   New Fair Value: ₹{analysis['new_fair_value']:,.2f}")
            print(f"   Change: ₹{analysis['fair_value_change']:,.2f} ({analysis['fair_value_change_percent']:.3f}%)")
            
            interp = result["interpretation"]
            print(f"\n💡 Interpretation:")
            print(f"   Impact per ₹1 USDINR: ₹{interp['impact_per_rupee']:.2f}")
            print(f"   Direction: Fair value {interp['direction']}")
            print(f"   Magnitude: {interp['magnitude'].upper()}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 Starting Arbitrage Calculator API Tests\n")
    
    test_arbitrage_calculation()
    test_realtime_arbitrage()
    test_sensitivity_analysis()
    
    print("\n" + "=" * 60)
    print("🎉 All Tests Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Check API docs: http://localhost:8000/api/v1/docs")
    print("2. Test with Silver: symbol=SILVER")
    print("3. Integrate live data feeds")
    print("4. Build frontend visualization")
