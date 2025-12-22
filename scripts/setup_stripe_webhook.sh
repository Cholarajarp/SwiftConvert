#!/usr/bin/env bash
# Start Stripe CLI webhook forwarding to your local server.
# Run `stripe login` first and then execute this script.

set -euo pipefail

# Forward to local development server
stripe listen --forward-to localhost:3001/api/webhook

# This will print a webhook signing secret in the CLI output. Copy it and set it as STRIPE_WEBHOOK_SECRET in your .env and in production secrets.
