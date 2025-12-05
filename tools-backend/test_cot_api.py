"""
Test script for COT Report Visualizer API
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_cot_analysis():
    """Test COT analysis endpoint"""
    print("=" * 60)
    print("Testing COT Analysis API")
    print("=" * 60)
    
    test_data = {
        "commodity": "GOLD",
        "weeks": 52
    }
    
    print(f"\n📊 Analyzing: {test_data['commodity']}")
    print(f"   Historical Period: {test_data['weeks']} weeks")
    
    try:
        response = requests.post(
            f"{BASE_URL}/cot/analysis",
            json=test_data
        )
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "=" * 60)
            print("📈 COT ANALYSIS RESULTS")
            print("=" * 60)
            
            print(f"\n📅 Latest Report: {result['latest_report_date']}")
            print(f"📊 Weeks Analyzed: {result['weeks_analyzed']}")
            
            # Current positions
            pos = result['current_positions']
            print(f"\n🔵 Current Positions:")
            print(f"   Commercial Net: {pos['commercial_net']:,} contracts")
            print(f"   Speculator Net: {pos['non_commercial_net']:,} contracts")
            print(f"   Open Interest: {pos['open_interest']:,} contracts")
            
            # Percentiles
            comm_pct = result['commercial_percentile']
            spec_pct = result['non_commercial_percentile']
            
            print(f"\n📊 Percentile Rankings:")
            print(f"   Commercial (1Y): {comm_pct['percentile_1y']:.1f}th percentile")
            if comm_pct['is_extreme']:
                print(f"   ⚠️  EXTREME: {comm_pct['extreme_level'].upper()}")
            
            print(f"   Speculator (1Y): {spec_pct['percentile_1y']:.1f}th percentile")
            if spec_pct['is_extreme']:
                print(f"   ⚠️  EXTREME: {spec_pct['extreme_level'].upper()}")
            
            # Changes
            print(f"\n📈 Week-over-Week Changes:")
            print(f"   Commercial: {result['commercial_net_change']:+,} contracts")
            print(f"   Speculator: {result['non_commercial_net_change']:+,} contracts")
            print(f"   Open Interest: {result['open_interest_change']:+,} contracts")
            
            # Signal
            signal = result['signal']
            print(f"\n🎯 Trading Signal:")
            print(f"   Signal: {signal['signal'].upper()}")
            print(f"   Confidence: {signal['confidence'].upper()}")
            print(f"   Commercial Bias: {signal['commercial_bias'].upper()}")
            print(f"   Speculator Bias: {signal['speculator_bias'].upper()}")
            print(f"\n💡 Reasoning: {signal['reasoning']}")
            
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


def test_cot_changes():
    """Test COT changes endpoint"""
    print("\n" + "=" * 60)
    print("Testing COT Changes Analysis")
    print("=" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/cot/changes",
            params={"commodity": "SILVER"}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📊 Position Changes:")
            print(f"   Report Date: {result['report_date']}")
            print(f"   Previous Date: {result['previous_date']}")
            
            print(f"\n📈 Commercial:")
            print(f"   Change: {result['commercial_net_change']:+,} contracts")
            print(f"   Change %: {result['commercial_net_change_percent']:+.2f}%")
            
            print(f"\n📈 Speculator:")
            print(f"   Change: {result['non_commercial_net_change']:+,} contracts")
            print(f"   Change %: {result['non_commercial_net_change_percent']:+.2f}%")
            
            print(f"\n💡 Interpretation:")
            print(f"   {result['interpretation']}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_extreme_positioning():
    """Test extreme positioning detection"""
    print("\n" + "=" * 60)
    print("Testing Extreme Positioning Detection")
    print("=" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/cot/extreme",
            params={"commodity": "CRUDE", "weeks": 52}
        )
        
        if response.status_code == 200:
            extremes = response.json()
            
            if extremes:
                print(f"\n⚠️  Found {len(extremes)} Extreme Position(s):")
                
                for ext in extremes:
                    print(f"\n📊 {ext['position_type'].upper()}:")
                    print(f"   Net Position: {ext['net_position']:,} contracts")
                    print(f"   Percentile: {ext['percentile']:.1f}th")
                    print(f"   Type: {ext['extreme_type'].upper()}")
                    print(f"   Potential Reversal: {'YES' if ext['potential_reversal'] else 'NO'}")
                    print(f"\n💡 Context: {ext['historical_context']}")
            else:
                print("\n✅ No extreme positioning detected")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_commodity_comparison():
    """Test commodity comparison"""
    print("\n" + "=" * 60)
    print("Testing Commodity Comparison")
    print("=" * 60)
    
    test_data = {
        "commodities": ["GOLD", "SILVER", "CRUDE"],
        "weeks": 52
    }
    
    print(f"\n📊 Comparing: {', '.join(test_data['commodities'])}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/cot/compare",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📈 Comparison Results:")
            print(f"   Report Date: {result['report_date']}")
            print(f"   Most Bullish: {result['most_bullish']} 🟢")
            print(f"   Most Bearish: {result['most_bearish']} 🔴")
            
            print(f"\n📊 Individual Analysis:")
            for item in result['comparison_data']:
                print(f"\n   {item['commodity']}:")
                print(f"      Signal: {item['signal'].upper()}")
                print(f"      Sentiment: {item['sentiment'].upper()}")
                print(f"      Commercial %ile: {item['commercial_percentile']:.1f}")
                print(f"      Speculator %ile: {item['non_commercial_percentile']:.1f}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 Starting COT Report Visualizer API Tests\n")
    
    test_cot_analysis()
    test_cot_changes()
    test_extreme_positioning()
    test_commodity_comparison()
    
    print("\n" + "=" * 60)
    print("🎉 All Tests Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Check API docs: http://localhost:8000/api/v1/docs")
    print("2. Integrate with real CFTC data")
    print("3. Build COT visualization charts")
    print("4. Set up alerts for extreme positioning")
