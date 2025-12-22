#!/usr/bin/env bash
# Set GitHub Actions secrets for this repository using GitHub CLI (`gh`).
# Usage: export values into environment, then run this script
# Example:
#   export AZURE_WEBAPP_PUBLISH_PROFILE="..."
#   export AZURE_STATIC_WEB_APPS_API_TOKEN="..."
#   export STRIPE_SECRET_KEY="..."
#   export STRIPE_PUBLIC_KEY="..."
#   export STRIPE_WEBHOOK_SECRET="..."
#   export AZURE_WEBAPP_NAME="swconvert-backend"
#   ./scripts/set_github_secrets.sh

set -euo pipefail
REPO="Cholarajarp/SwiftConvert"

secrets=(AZURE_STATIC_WEB_APPS_API_TOKEN AZURE_WEBAPP_PUBLISH_PROFILE AZURE_WEBAPP_NAME STRIPE_SECRET_KEY STRIPE_PUBLIC_KEY STRIPE_WEBHOOK_SECRET DATABASE_URL)

for name in "${secrets[@]}"; do
  val=$(eval echo \$$name)
  if [ -z "$val" ]; then
    echo "Skipping $name — environment variable not set"
    continue
  fi
  echo "Setting secret $name..."
  echo -n "$val" | gh secret set "$name" --repo "$REPO" -o -
done

echo "Done. Verify secrets on GitHub UI: https://github.com/$REPO/settings/secrets/actions"