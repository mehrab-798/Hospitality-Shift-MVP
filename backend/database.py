"""
Database connection utilities for the Hospitality Shift backend.
Uses psycopg2 to connect to Supabase PostgreSQL.
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def get_connection():
    """Create a new database connection."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return psycopg2.connect(DATABASE_URL)


def get_cursor(connection):
    """Return a cursor that returns rows as dicts."""
    return connection.cursor(cursor_factory=RealDictCursor)


def init_db():
    """Create the shifts table if it does not exist."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS shifts (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              workplace_name TEXT NOT NULL CHECK (char_length(trim(workplace_name)) > 0),
              shift_date DATE NOT NULL,
              start_time TIME NOT NULL,
              end_time TIME NOT NULL,
              unpaid_break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (unpaid_break_minutes >= 0),
              hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0),
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        """)
        conn.commit()
        cur.close()
    finally:
        conn.close()
