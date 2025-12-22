"""Billing persistence that supports SQLite (default) and Postgres (via DATABASE_URL).

If `DATABASE_URL` environment variable is set (e.g. postgres://...), Postgres will be used.
This keeps local development simple while allowing you to migrate to a managed DB in production.
"""
from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Optional, Dict, Any

DB_PATH = Path(__file__).parent / 'billing.db'
CREATE_SQL = '''
CREATE TABLE IF NOT EXISTS subscriptions (
    email TEXT PRIMARY KEY,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    current_period_end INTEGER,
    updated_at INTEGER
);
'''

# If DATABASE_URL present, use Postgres via psycopg2; otherwise use sqlite3
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(DATABASE_URL)


def _get_conn_sqlite():
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _get_conn_postgres():
    # psycopg2 binary is recommended (included in requirements)
    import psycopg2
    import psycopg2.extras
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def init_db() -> None:
    if USE_POSTGRES:
        conn = _get_conn_postgres()
        try:
            with conn.cursor() as cur:
                cur.execute(CREATE_SQL)
            conn.commit()
        finally:
            conn.close()
    else:
        conn = _get_conn_sqlite()
        with conn:
            conn.executescript(CREATE_SQL)
        conn.close()


def upsert_subscription(email: str, stripe_customer_id: str, stripe_subscription_id: str, status: str, current_period_end: int) -> None:
    now = int(time.time())
    if USE_POSTGRES:
        conn = _get_conn_postgres()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    INSERT INTO subscriptions (email, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET
                        stripe_customer_id = EXCLUDED.stripe_customer_id,
                        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                        status = EXCLUDED.status,
                        current_period_end = EXCLUDED.current_period_end,
                        updated_at = EXCLUDED.updated_at;
                    ''',
                    (email, stripe_customer_id, stripe_subscription_id, status, current_period_end, now)
                )
            conn.commit()
        finally:
            conn.close()
    else:
        conn = _get_conn_sqlite()
        with conn:
            conn.execute(
                '''
                INSERT INTO subscriptions (email, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                  stripe_customer_id=excluded.stripe_customer_id,
                  stripe_subscription_id=excluded.stripe_subscription_id,
                  status=excluded.status,
                  current_period_end=excluded.current_period_end,
                  updated_at=excluded.updated_at
                ''',
                (email, stripe_customer_id, stripe_subscription_id, status, current_period_end, now)
            )
        conn.close()


def get_subscription(email: str) -> Optional[Dict[str, Any]]:
    if USE_POSTGRES:
        import psycopg2
        import psycopg2.extras
        conn = _get_conn_postgres()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:  # type: ignore[name-defined]
                cur.execute('SELECT * FROM subscriptions WHERE email = %s', (email,))
                row = cur.fetchone()
                if not row:
                    return None
                return dict(row)
        finally:
            conn.close()
    else:
        conn = _get_conn_sqlite()
        try:
            cur = conn.execute('SELECT * FROM subscriptions WHERE email = ?', (email,))
            row = cur.fetchone()
            if not row:
                return None
            return {
                'email': row['email'],
                'stripe_customer_id': row['stripe_customer_id'],
                'stripe_subscription_id': row['stripe_subscription_id'],
                'status': row['status'],
                'current_period_end': row['current_period_end'],
                'updated_at': row['updated_at']
            }
        finally:
            conn.close()


def is_active(email: str) -> bool:
    rec = get_subscription(email)
    if not rec:
        return False
    # Consider active if status is 'active' and current_period_end in future
    try:
        return rec['status'] == 'active' and int(rec['current_period_end']) > int(time.time())
    except Exception:
        return False
