"""
Test database connection without exposing credentials.
"""
import os
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    print("FAIL: DATABASE_URL is not set in .env")
    sys.exit(1)

# Mask password in any output
masked = DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "(masked)"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    cur.close()
    conn.close()
    if result and result[0] == 1:
        print(f"PASS: Database connection successful to {masked}")
        sys.exit(0)
    else:
        print("FAIL: Unexpected query result")
        sys.exit(1)
except psycopg2.OperationalError as e:
    err = str(e)
    if "could not translate host name" in err:
        print(f"FAIL: Cannot resolve database host '{masked}'")
        print("HINT: Go to Supabase Dashboard > Settings > Database")
        print("      Copy the correct Connection string (URI) and update DATABASE_URL in .env")
        print("      For newer projects, use the pooler connection string (port 6543).")
    elif "authentication failed" in err:
        print("FAIL: Authentication failed - check your password in DATABASE_URL")
    else:
        print(f"FAIL: Connection error: {err}")
    sys.exit(1)
except Exception as e:
    print(f"FAIL: Unexpected error: {e}")
    sys.exit(1)
