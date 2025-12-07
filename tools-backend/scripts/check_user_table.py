"""Check User table structure in database"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    # Find User tables
    result = conn.execute(
        text("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name ILIKE '%user%' 
        ORDER BY table_schema, table_name
    """)
    )
    print("Tables with 'user' in name:")
    for row in result:
        print(f"  {row.table_schema}.{row.table_name}")

    # Check public schema tables
    result = conn.execute(
        text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    )
    print("\nAll tables in public schema:")
    for row in result:
        print(f"  {row.table_name}")
