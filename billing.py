"""Simple billing persistence using SQLite.

This module provides minimal functions to store and query subscription records.
It's intentionally lightweight for this scaffold; replace with a proper DB in
production (e.g., Postgres) when you need to scale.
"""
from __future__ import annotations

import sqlite3
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


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _get_conn()
    with conn:
        conn.executescript(CREATE_SQL)
    conn.close()


def upsert_subscription(email: str, stripe_customer_id: str, stripe_subscription_id: str, status: str, current_period_end: int) -> None:
    now = int(time.time())
    conn = _get_conn()
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
    conn = _get_conn()
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
