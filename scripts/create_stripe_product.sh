#!/usr/bin/env bash
# Create a product and price in Stripe using the Stripe CLI
# Requirements: stripe CLI installed and `stripe login` run
set -euo pipefail

# Replace the values below if you want different amounts or currencies
PRODUCT_NAME="SwiftConvert Pro Plan"
PRICE_INR=4900       # amount in paise - 49.00 INR -> 4900
PRICE_USD=999       # amount in cents - 9.99 USD -> 999

# Create product
echo "Creating Stripe product..."
prod=$(stripe products create --name "$PRODUCT_NAME" --json)
prod_id=$(echo "$prod" | jq -r '.id')

echo "Product created: $prod_id"

# Create INRs recurring monthly price
price_inr=$(stripe prices create --product "$prod_id" --unit-amount $PRICE_INR --currency inr --recurring 'interval=month' --json)
price_inr_id=$(echo "$price_inr" | jq -r '.id')

echo "Created INR price: $price_inr_id"

# Create USD recurring monthly price
price_usd=$(stripe prices create --product "$prod_id" --unit-amount $PRICE_USD --currency usd --recurring 'interval=month' --json)
price_usd_id=$(echo "$price_usd" | jq -r '.id')

echo "Created USD price: $price_usd_id"

echo
cat <<EOF
Product and prices created:
Product ID: $prod_id
INR Price ID: $price_inr_id
USD Price ID: $price_usd_id

Store those price IDs in your environment or in the Stripe Dashboard and update the server to use price IDs for checkout if you prefer (recommended).
EOF
