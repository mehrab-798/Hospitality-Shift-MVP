"""
Hospitality Shift - FastAPI Backend
Connects to Supabase PostgreSQL with Supabase Auth (JWT) protection.
"""
import os
from decimal import Decimal
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, get_cursor

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")

app = FastAPI(title="Hospitality Shift API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ShiftCreate(BaseModel):
    workplace: str = Field(..., min_length=1)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    startTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    endTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    hourlyRate: float = Field(..., gt=0)
    breakMinutes: int = Field(default=0, ge=0)


class ShiftUpdate(BaseModel):
    workplace: Optional[str] = Field(None, min_length=1)
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    startTime: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    endTime: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    hourlyRate: Optional[float] = Field(None, gt=0)
    breakMinutes: Optional[int] = Field(None, ge=0)


class ShiftResponse(BaseModel):
    id: str
    workplace: str
    date: str
    startTime: str
    endTime: str
    hourlyRate: float
    breakMinutes: int


def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = resp.json()
        return {"id": user["id"], "email": user.get("email", "")}
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


def format_time(t) -> str:
    return t.strftime("%H:%M") if t else ""


def format_date(d) -> str:
    return d.strftime("%Y-%m-%d") if d else ""


def row_to_shift(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "workplace": row["workplace_name"],
        "date": format_date(row["shift_date"]),
        "startTime": format_time(row["start_time"]),
        "endTime": format_time(row["end_time"]),
        "hourlyRate": float(row["hourly_rate"]),
        "breakMinutes": row["unpaid_break_minutes"],
    }


@app.get("/")
def root():
    return {"message": "Hospitality Shift API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


@app.get("/shifts", response_model=list[ShiftResponse])
def list_shifts(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute(
            "SELECT * FROM shifts WHERE user_id = %s ORDER BY shift_date DESC, start_time DESC",
            (user["id"],),
        )
        rows = cur.fetchall()
        cur.close()
        return [row_to_shift(r) for r in rows]
    finally:
        conn.close()


@app.post("/shifts", response_model=ShiftResponse, status_code=201)
def create_shift(data: ShiftCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute(
            """INSERT INTO shifts (user_id, workplace_name, shift_date, start_time, end_time, unpaid_break_minutes, hourly_rate)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               RETURNING *""",
            (user["id"], data.workplace.strip(), data.date, data.startTime, data.endTime,
             data.breakMinutes, Decimal(str(data.hourlyRate))),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        return row_to_shift(row)
    finally:
        conn.close()


@app.put("/shifts/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: str, data: ShiftUpdate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = get_cursor(conn)
        fields = []
        values = []
        if data.workplace is not None:
            fields.append("workplace_name = %s")
            values.append(data.workplace.strip())
        if data.date is not None:
            fields.append("shift_date = %s")
            values.append(data.date)
        if data.startTime is not None:
            fields.append("start_time = %s")
            values.append(data.startTime)
        if data.endTime is not None:
            fields.append("end_time = %s")
            values.append(data.endTime)
        if data.hourlyRate is not None:
            fields.append("hourly_rate = %s")
            values.append(Decimal(str(data.hourlyRate)))
        if data.breakMinutes is not None:
            fields.append("unpaid_break_minutes = %s")
            values.append(data.breakMinutes)

        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        values.extend([shift_id, user["id"]])
        cur.execute(
            f"UPDATE shifts SET {', '.join(fields)} WHERE id = %s AND user_id = %s RETURNING *",
            values,
        )
        row = cur.fetchone()
        if not row:
            conn.rollback()
            cur.close()
            raise HTTPException(status_code=404, detail="Shift not found")
        conn.commit()
        cur.close()
        return row_to_shift(row)
    finally:
        conn.close()


@app.delete("/shifts/{shift_id}")
def delete_shift(shift_id: str, user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute(
            "DELETE FROM shifts WHERE id = %s AND user_id = %s RETURNING id",
            (shift_id, user["id"]),
        )
        row = cur.fetchone()
        if not row:
            conn.rollback()
            cur.close()
            raise HTTPException(status_code=404, detail="Shift not found")
        conn.commit()
        cur.close()
        return {"message": "Shift deleted", "id": shift_id}
    finally:
        conn.close()