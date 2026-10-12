"""
Verify the shifts table and Row Level Security policies exist.
"""
import os
import sys

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    print("FAIL: DATABASE_URL is not set in .env")
    sys.exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Check table exists
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'shifts'
    """)
    table = cur.fetchone()
    if table:
        print("PASS: shifts table exists")
    else:
        print("FAIL: shifts table not found")
        sys.exit(1)

    # Check columns
    cur.execute("""
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = 'shifts' ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    print(f"INFO: shifts table has {len(columns)} columns:")
    for col in columns:
        print(f"  - {col['column_name']}: {col['data_type']}")

    # Check RLS enabled
    cur.execute("""
        SELECT relrowsecurity FROM pg_class
        WHERE relname = 'shifts'
    """)
    rls = cur.fetchone()
    if rls and rls['relrowsecurity']:
        print("PASS: Row Level Security is enabled")
    else:
        print("FAIL: Row Level Security is NOT enabled")
        sys.exit(1)

    # Check policies
    cur.execute("""
        SELECT policyname, cmd FROM pg_policies WHERE tablename = 'shifts'
    """)
    policies = cur.fetchall()
    if policies:
        print(f"PASS: {len(policies)} RLS policies found:")
        for p in policies:
            print(f"  - {p['policyname']} ({p['cmd']})")
    else:
        print("FAIL: No RLS policies found")
        sys.exit(1)

    cur.close()
    conn.close()
    print("\nAll checks passed.")
    sys.exit(0)

except psycopg2.OperationalError as e:
    print(f"FAIL: Connection error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"FAIL: Unexpected error: {e}")
    sys.exit(1)
