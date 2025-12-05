"""
Test script for Correlation Matrix API
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_correlation_matrix():
    """Test correlation matrix calculation"""
    print("=" * 60)
    print("Testing Correlation Matrix API")
    print("=" * 60)
    
    test_data = {
        "assets": ["GOLD", "SILVER", "CRUDE", "USDINR"],
        "period_days": 90,
        "timeframe": "daily"
    }
    
    print("\n📊 Input Data:")
    print(f"   Assets: {', '.join(test_data['assets'])}")
    print(f"   Period: {test_data['period_days']} days")
    
    try:
        response = requests.post(
            f"{BASE_URL}/correlation/matrix",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "=" * 60)
            print("📈 CORRELATION MATRIX RESULTS")
            print("=" * 60)
            
            print(f"\n📅 Period: {result['start_date']} to {result['end_date']}")
            print(f"📊 Assets Analyzed: {len(result['assets'])}")
            
            print("\n🔵 Pairwise Correlations:")
            for corr in result['correlations']:
                symbol = "+" if corr['direction'] == 'positive' else "-"
                print(f"   {corr['asset1']} vs {corr['asset2']}: {symbol}{abs(corr['correlation']):.3f} ({corr['strength'].upper()})")
                print(f"      p-value: {corr['p_value']:.3f}, sample: {corr['sample_size']} days")
            
            print("\n📊 Correlation Matrix:")
            assets = result['assets']
            matrix = result['matrix']
            
            # Print header
            print(f"{'':12}", end="")
            for asset in assets:
                print(f"{asset:>10}", end="")
            print()
            
            # Print matrix
            for asset1 in assets:
                print(f"{asset1:12}", end="")
                for asset2 in assets:
                    value = matrix[asset1][asset2]
                    print(f"{value:>10.3f}", end="")
                print()
            
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


def test_rolling_correlation():
    """Test rolling correlation"""
    print("\n" + "=" * 60)
    print("Testing Rolling Correlation")
    print("=" * 60)
    
    test_data = {
        "asset1": "GOLD",
        "asset2": "SILVER",
        "window_days": 30,
        "period_days": 180
    }
    
    print(f"\n📊 Analyzing: {test_data['asset1']} vs {test_data['asset2']}")
    print(f"   Window: {test_data['window_days']} days")
    print(f"   Period: {test_data['period_days']} days")
    
    try:
        response = requests.post(
            f"{BASE_URL}/correlation/rolling",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📈 Rolling Correlation Results:")
            print(f"   Current: {result['current_correlation']:.3f}")
            print(f"   Average: {result['avg_correlation']:.3f}")
            print(f"   Max: {result['max_correlation']:.3f}")
            print(f"   Min: {result['min_correlation']:.3f}")
            print(f"   Data Points: {len(result['data_points'])}")
            
            # Show first and last few points
            print(f"\n📊 Sample Data Points:")
            for point in result['data_points'][:3]:
                print(f"   {point['date']}: {point['correlation']:.3f} ({point['strength']})")
            print("   ...")
            for point in result['data_points'][-3:]:
                print(f"   {point['date']}: {point['correlation']:.3f} ({point['strength']})")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_beta_calculation():
    """Test beta calculation"""
    print("\n" + "=" * 60)
    print("Testing Beta Calculation")
    print("=" * 60)
    
    test_data = {
        "asset": "SILVER",
        "benchmark": "GOLD",
        "period_days": 90
    }
    
    print(f"\n📊 Calculating Beta:")
    print(f"   Asset: {test_data['asset']}")
    print(f"   Benchmark: {test_data['benchmark']}")
    print(f"   Period: {test_data['period_days']} days")
    
    try:
        response = requests.post(
            f"{BASE_URL}/correlation/beta",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📈 Beta Analysis:")
            print(f"   Beta: {result['beta']:.3f}")
            print(f"   Alpha: {result['alpha']:.4f}")
            print(f"   R-squared: {result['r_squared']:.3f}")
            print(f"   Correlation: {result['correlation']:.3f}")
            print(f"   Volatility Ratio: {result['volatility_ratio']:.3f}")
            
            print(f"\n💡 Interpretation:")
            print(f"   {result['interpretation']}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_diversification_analysis():
    """Test diversification analysis"""
    print("\n" + "=" * 60)
    print("Testing Diversification Analysis")
    print("=" * 60)
    
    test_data = {
        "assets": ["GOLD", "SILVER", "CRUDE", "USDINR", "NIFTY"],
        "period_days": 90
    }
    
    print(f"\n📊 Portfolio Assets: {', '.join(test_data['assets'])}")
    print(f"   Period: {test_data['period_days']} days")
    
    try:
        response = requests.post(
            f"{BASE_URL}/correlation/diversification",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📈 Diversification Analysis:")
            print(f"   Score: {result['diversification_score']:.2f}/100")
            print(f"   Rating: {result['rating'].upper()}")
            print(f"   Avg Correlation: {result['avg_correlation']:.3f}")
            print(f"   Max Correlation: {result['max_correlation']:.3f}")
            print(f"   Min Correlation: {result['min_correlation']:.3f}")
            
            print(f"\n💡 Recommendations:")
            for rec in result['recommendations']:
                print(f"   {rec}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def test_correlation_breakdown():
    """Test detailed correlation breakdown"""
    print("\n" + "=" * 60)
    print("Testing Correlation Breakdown")
    print("=" * 60)
    
    params = {
        "asset1": "GOLD",
        "asset2": "USDINR",
        "period_days": 90
    }
    
    print(f"\n📊 Analyzing: {params['asset1']} vs {params['asset2']}")
    print(f"   Period: {params['period_days']} days")
    
    try:
        response = requests.get(
            f"{BASE_URL}/correlation/breakdown",
            params=params
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📈 Correlation Analysis:")
            print(f"   Correlation: {result['correlation']:.3f} ({result['strength'].upper()})")
            print(f"   Direction: {result['direction'].upper()}")
            print(f"   P-value: {result['p_value']:.3f}")
            print(f"   95% CI: [{result['confidence_interval_lower']:.3f}, {result['confidence_interval_upper']:.3f}]")
            
            print(f"\n📊 Volatility:")
            print(f"   {result['asset_pair']['asset1']}: {result['asset1_volatility']:.2f}%")
            print(f"   {result['asset_pair']['asset2']}: {result['asset2_volatility']:.2f}%")
            
            print(f"\n💰 Returns:")
            print(f"   {result['asset_pair']['asset1']}: {result['asset1_return']:.2f}%")
            print(f"   {result['asset_pair']['asset2']}: {result['asset2_return']:.2f}%")
            
            print(f"\n📈 Covariance: {result['covariance']:.6f}")
            
            print(f"\n💡 Interpretation:")
            print(f"   {result['interpretation']}")
            
            print("\n✅ Test Passed!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 Starting Correlation Matrix API Tests\n")
    
    test_correlation_matrix()
    test_rolling_correlation()
    test_beta_calculation()
    test_diversification_analysis()
    test_correlation_breakdown()
    
    print("\n" + "=" * 60)
    print("🎉 All Tests Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Check API docs: http://localhost:8000/api/v1/docs")
    print("2. Test with different asset combinations")
    print("3. Integrate with real price data")
    print("4. Build correlation heatmap visualization")
