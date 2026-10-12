"""
Hospitality Shift - FastAPI Backend
Connects to Supabase PostgreSQL with Supabase Auth (JWT) protection.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from decimal import Decimal
from typing import Optional

import psycopg2
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from database import get_connection, get_cursor, init_db

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

api_router = APIRouter(prefix="/api")


@app.on_event("startup")
def startup():
    try:
        init_db()
        logger.info("Database schema verified")
    except Exception as e:
        logger.error(f"Database init failed: {e}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    if isinstance(exc, psycopg2.Error):
        logger.error(f"PostgreSQL error detail: {exc.pgerror}")
        return JSONResponse(status_code=500, content={"detail": "A database error occurred. Please try again."})
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred. Please try again."})


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


@api_router.get("/health")
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


@api_router.get("/shifts", response_model=list[ShiftResponse])
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
    except psycopg2.Error as e:
        logger.error(f"DB error listing shifts: {e.pgerror}")
        raise HTTPException(status_code=500, detail="A database error occurred. Please try again.")
    finally:
        conn.close()


@api_router.post("/shifts", response_model=ShiftResponse, status_code=201)
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
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"DB error creating shift: {e.pgerror}")
        raise HTTPException(status_code=500, detail="A database error occurred. Please try again.")
    finally:
        conn.close()


@api_router.put("/shifts/{shift_id}", response_model=ShiftResponse)
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
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"DB error updating shift: {e.pgerror}")
        raise HTTPException(status_code=500, detail="A database error occurred. Please try again.")
    finally:
        conn.close()


@api_router.delete("/shifts/{shift_id}")
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
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"DB error deleting shift: {e.pgerror}")
        raise HTTPException(status_code=500, detail="A database error occurred. Please try again.")
    finally:
        conn.close()


app.include_router(api_router)