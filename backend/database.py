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
    """Create a new database connection with SSL enforced."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set in .env")
    url = DATABASE_URL
    if "sslmode" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}sslmode=require"
    return psycopg2.connect(url)


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

        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, shift_date)")
        conn.commit()

        # Enable RLS (safe to run repeatedly)
        cur.execute("ALTER TABLE shifts ENABLE ROW LEVEL SECURITY")
        conn.commit()

        # Create policies (IF NOT EXISTS not supported for policies, so use DROP IF EXISTS)
        policies = [
            ("Users can view own shifts", "SELECT", "USING (auth.uid() = user_id)"),
            ("Users can insert own shifts", "INSERT", "WITH CHECK (auth.uid() = user_id)"),
            ("Users can update own shifts", "UPDATE", "USING (auth.uid() = user_id)"),
            ("Users can delete own shifts", "DELETE", "USING (auth.uid() = user_id)"),
        ]
        for name, cmd, clause in policies:
            cur.execute(f'DROP POLICY IF EXISTS "{name}" ON shifts')
            cur.execute(f'CREATE POLICY "{name}" ON shifts FOR {cmd} {clause}')
        conn.commit()

        # updated_at trigger
        cur.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;
            $$ LANGUAGE plpgsql
        """)
        cur.execute("DROP TRIGGER IF EXISTS trigger_shifts_updated_at ON shifts")
        cur.execute("CREATE TRIGGER trigger_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at()")
        conn.commit()
        cur.close()
    finally:
        conn.close()
