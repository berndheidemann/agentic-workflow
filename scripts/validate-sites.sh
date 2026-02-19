#!/usr/bin/env bash
# validate-sites.sh — Validates site names against the registry (public/sites.json)
#
# Usage:
#   ./scripts/validate-sites.sh ap1 pandas rest    # validate given site slugs
#   ./scripts/validate-sites.sh --list              # list all registered site slugs
#
# Exit code:
#   0 — all provided slugs are valid and active
#   1 — one or more slugs are unknown or inactive

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SITES_JSON="$PROJECT_ROOT/apps/hub/public/sites.json"

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$SITES_JSON" ]]; then
  echo "Error: sites.json not found at $SITES_JSON" >&2
  exit 1
fi

# --list mode: print all active site slugs
if [[ "${1:-}" == "--list" ]]; then
  jq -r '.sites[] | select(.is_active == true) | .slug' "$SITES_JSON"
  exit 0
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <slug> [slug...]  or  $0 --list" >&2
  exit 1
fi

# Build lookup of active slugs
mapfile -t REGISTERED < <(jq -r '.sites[] | select(.is_active == true) | .slug' "$SITES_JSON")

ERRORS=0
for slug in "$@"; do
  found=false
  for registered in "${REGISTERED[@]}"; do
    if [[ "$slug" == "$registered" ]]; then
      found=true
      break
    fi
  done

  if [[ "$found" == false ]]; then
    echo "Error: '$slug' is not a registered active site in sites.json" >&2
    ERRORS=$((ERRORS + 1))
  fi
done

if [[ $ERRORS -gt 0 ]]; then
  echo "Registered active sites: ${REGISTERED[*]}" >&2
  exit 1
fi

echo "All sites validated: $*"
