"""
Test database connection to TimescaleDB cloud
"""
import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from config import settings

def test_connection():
    """Test connection to TimescaleDB"""
    print("=" * 60)
    print("Testing TimescaleDB Connection")
    print("=" * 60)
    
    # Mask password in output
    masked_url = settings.database_url.replace(
        settings.database_url.split('@')[0].split(':')[-1],
        '****'
    )
    print(f"\n📡 Connecting to: {masked_url}")
    
    try:
        # Create engine
        engine = create_engine(
            settings.database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before using
            echo=False
        )
        
        # Test connection
        with engine.connect() as conn:
            # Check PostgreSQL version
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"\n✅ Connected successfully!")
            print(f"\n📊 PostgreSQL Version:")
            print(f"   {version[:80]}...")
            
            # Check TimescaleDB extension
            result = conn.execute(text(
                "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb'"
            ))
            timescale = result.fetchone()
            
            if timescale:
                print(f"\n⏰ TimescaleDB Extension:")
                print(f"   Version: {timescale[1]}")
                print(f"   Status: ENABLED ✅")
            else:
                print(f"\n⚠️  TimescaleDB extension not found")
                print(f"   Run: CREATE EXTENSION timescaledb;")
            
            # Check current database
            result = conn.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"\n💾 Current Database: {db_name}")
            
            # Check existing tables
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            tables = result.fetchall()
            
            if tables:
                print(f"\n📋 Existing Tables ({len(tables)}):")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print(f"\n📋 No tables found (database is empty)")
                print(f"   Run migrations: uv run alembic upgrade head")
            
            # Test write permission
            try:
                conn.execute(text("CREATE TEMP TABLE test_write (id INT)"))
                conn.execute(text("DROP TABLE test_write"))
                print(f"\n✅ Write permissions: OK")
            except Exception as e:
                print(f"\n❌ Write permissions: FAILED")
                print(f"   Error: {str(e)}")
            
        print("\n" + "=" * 60)
        print("✅ Connection Test Passed!")
        print("=" * 60)
        print("\nNext Steps:")
        print("1. Run migrations: uv run alembic upgrade head")
        print("2. Initialize TimescaleDB: psql < scripts/init_timescaledb.sql")
        print("3. Start the server: uv run python main.py")
        
        return True
        
    except OperationalError as e:
        print("\n" + "=" * 60)
        print("❌ Connection Failed!")
        print("=" * 60)
        print(f"\nError: {str(e)}")
        print("\nPossible issues:")
        print("1. Check if DATABASE_URL in .env is correct")
        print("2. Verify network connectivity to TimescaleDB cloud")
        print("3. Confirm database credentials are valid")
        print("4. Check if SSL mode is required")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
