#!/usr/bin/env bash
# generate-nginx.sh — Generates nginx.conf from public/sites.json
#
# Usage:
#   ./scripts/generate-nginx.sh              # outputs to stdout
#   ./scripts/generate-nginx.sh nginx.conf   # writes to file
#
# Requires: jq

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SITES_JSON="$PROJECT_ROOT/apps/hub/public/sites.json"
OUTPUT="${1:-}"

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$SITES_JSON" ]]; then
  echo "Error: sites.json not found at $SITES_JSON" >&2
  exit 1
fi

# Read active sites from registry
mapfile -t SLUGS < <(jq -r '.sites[] | select(.is_active == true) | .slug' "$SITES_JSON")
mapfile -t PATHS < <(jq -r '.sites[] | select(.is_active == true) | .base_path' "$SITES_JSON")

generate() {
  cat <<'HEADER'
server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # DSGVO: Keine IP-Adressen protokollieren
    access_log off;

    # PocketBase API — no IP forwarding (DSGVO: keine IP-Logs)
    location /api/ {
        proxy_pass http://pocketbase:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # PocketBase Admin UI
    location /_/ {
        proxy_pass http://pocketbase:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

HEADER

  # Generate location block for each active site
  for i in "${!SLUGS[@]}"; do
    local slug="${SLUGS[$i]}"
    local base_path="${PATHS[$i]}"
    # Strip trailing slash for alias path
    local path_stripped="${base_path%/}"

    cat <<LOCATION
    # Site: $slug
    location $base_path {
        alias /srv/sites/$slug/;
        try_files \$uri \$uri/ ${path_stripped}/index.html;
    }

LOCATION
  done

  cat <<'FOOTER'
    # Hub (statische Dateien aus dist/)
    location / {
        root /srv/sites/hub;
        try_files $uri $uri/ /index.html;
    }
}
FOOTER
}

if [[ -n "$OUTPUT" ]]; then
  generate > "$OUTPUT"
  echo "Generated nginx config written to: $OUTPUT" >&2
else
  generate
fi
