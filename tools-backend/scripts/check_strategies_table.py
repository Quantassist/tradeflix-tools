"""Check strategies table structure"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    # Check strategies table structure
    result = conn.execute(
        text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'tradeflix_tools' 
        AND table_name = 'strategies'
        ORDER BY ordinal_position
    """)
    )
    print("strategies table columns:")
    for row in result:
        print(f"  {row.column_name}: {row.data_type} (nullable: {row.is_nullable})")

    # Check foreign keys
    result = conn.execute(
        text("""
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'tradeflix_tools'
        AND tc.table_name = 'strategies'
    """)
    )
    print("\nForeign keys on strategies:")
    for row in result:
        print(
            f"  {row.column_name} -> {row.foreign_table_schema}.{row.foreign_table_name}.{row.foreign_column_name}"
        )

    # Check User table primary key type
    result = conn.execute(
        text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'id'
    """)
    )
    print("\npublic.User.id column:")
    for row in result:
        print(f"  {row.column_name}: {row.data_type}")
