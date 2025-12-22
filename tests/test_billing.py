import os
import time
import billing
from billing import DB_PATH

import tempfile


def test_billing_db_init_and_upsert(tmp_path):
    # Use a temp DB for testing
    old_db = billing.DB_PATH
    try:
        billing.DB_PATH = tmp_path / 'test_billing.db'
        billing.init_db()
        email = 'test@example.com'
        stripe_customer_id = 'cus_test'
        stripe_subscription_id = 'sub_test'
        status = 'active'
        current_period_end = int(time.time()) + 3600

        billing.upsert_subscription(email, stripe_customer_id, stripe_subscription_id, status, current_period_end)
        rec = billing.get_subscription(email)
        assert rec is not None
        assert rec['email'] == email
        assert rec['status'] == status
        assert billing.is_active(email) is True

    finally:
        billing.DB_PATH = old_db


def test_subscription_status_endpoint(client):
    # client fixture from conftest (Flask test client)
    from app import app
    with app.test_client() as c:
        # prepare DB
        billing.init_db()
        email = 'api@test.com'
        billing.upsert_subscription(email, 'cus', 'sub', 'active', int(time.time()) + 3600)

        resp = c.get('/api/subscription-status', query_string={'email': email})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['active'] is True
        assert data['email'] == email
