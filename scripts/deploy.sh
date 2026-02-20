#!/usr/bin/env bash
# deploy.sh — Einzelne Site oder Hub deployen
#
# Verwendung:
#   ./scripts/deploy.sh <site-name>           # Site deployen (z.B. "ap1", "pandas", "hub")
#   ./scripts/deploy.sh --list                # Alle deploybaren Sites anzeigen
#
# Umgebungsvariablen:
#   DEPLOY_HOST   Ziel-Server (Standard: learn.szut.dev)
#   DEPLOY_USER   SSH-Benutzer (Standard: deploy)
#   DEPLOY_PATH   Zielverzeichnis auf dem Server (Standard: /srv/sites)
#   DRY_RUN       Wenn gesetzt: nur anzeigen was deployt würde (kein rsync)
#   SITES_DIR     Lokales Sites-Verzeichnis (Standard: ./sites)
#
# Exit-Codes:
#   0 — Deploy erfolgreich
#   1 — Fehler (unbekannter Site-Name, Build-Fehler, rsync-Fehler)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SITES_JSON="$PROJECT_ROOT/apps/hub/public/sites.json"

# Konfiguration (überschreibbar via Umgebungsvariablen)
DEPLOY_HOST="${DEPLOY_HOST:-learn.szut.dev}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/srv/sites}"
DRY_RUN="${DRY_RUN:-}"
SITES_DIR="${SITES_DIR:-$PROJECT_ROOT/sites}"

# Voraussetzungen prüfen
if ! command -v jq &>/dev/null; then
  echo "Fehler: jq ist erforderlich aber nicht installiert." >&2
  exit 1
fi

if [[ ! -f "$SITES_JSON" ]]; then
  echo "Fehler: sites.json nicht gefunden: $SITES_JSON" >&2
  exit 1
fi

# --list: Verfügbare Sites anzeigen
if [[ "${1:-}" == "--list" ]]; then
  echo "Deploybare Sites (aus Site-Registry):"
  jq -r '.sites[] | select(.is_active == true) | "  \(.slug)\t[\(.framework_type)]\t\(.name)"' "$SITES_JSON"
  printf "  hub\t[hub]\tHub-App (apps/hub)\n"
  exit 0
fi

if [[ $# -eq 0 ]]; then
  echo "Verwendung: $0 <site-name>  oder  $0 --list" >&2
  exit 1
fi

SITE_NAME="$1"

echo "[$(date -Iseconds)] Deploy gestartet: $SITE_NAME"

# Hub ist ein Sonderfall (nicht in sites.json)
if [[ "$SITE_NAME" == "hub" ]]; then
  FRAMEWORK_TYPE="hub"
  SOURCE_DIR="$PROJECT_ROOT/apps/hub"
  BUILD_DIR="$SOURCE_DIR/dist"

  echo "[$(date -Iseconds)] Hub-App wird gebaut..."
  (cd "$SOURCE_DIR" && npm run build)

  RSYNC_SOURCE="$BUILD_DIR/"
  RSYNC_DEST="$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/hub/"

# Reguläre Sites: gegen Site-Registry validieren
else
  # Site-Name gegen Registry validieren
  SITE_ENTRY="$(jq -e --arg slug "$SITE_NAME" '.sites[] | select(.slug == $slug and .is_active == true)' "$SITES_JSON" 2>/dev/null || true)"

  if [[ -z "$SITE_ENTRY" ]]; then
    echo "Fehler: '$SITE_NAME' ist kein registrierter aktiver Site-Name." >&2
    echo "" >&2
    echo "Registrierte aktive Sites:" >&2
    jq -r '.sites[] | select(.is_active == true) | "  \(.slug)"' "$SITES_JSON" >&2
    echo "  hub" >&2
    exit 1
  fi

  FRAMEWORK_TYPE="$(echo "$SITE_ENTRY" | jq -r '.framework_type')"
  SITE_DIR="$SITES_DIR/$SITE_NAME"

  # Site-Verzeichnis ermitteln (Verzeichnisname kann vom Slug abweichen)
  # Suche in sites/ nach einem Verzeichnis das den Slug enthält
  if [[ ! -d "$SITE_DIR" ]]; then
    # Fallback: Site-Verzeichnis mit anderem Namen suchen
    FOUND_DIR=""
    for dir in "$SITES_DIR"/*/; do
      dirname="$(basename "$dir")"
      if [[ "$dirname" == *"$SITE_NAME"* ]] || [[ "$dirname" == "$SITE_NAME"* ]]; then
        FOUND_DIR="$dir"
        break
      fi
    done

    if [[ -n "$FOUND_DIR" ]]; then
      SITE_DIR="${FOUND_DIR%/}"
    else
      echo "Fehler: Site-Verzeichnis nicht gefunden für '$SITE_NAME'." >&2
      echo "Erwartet unter: $SITES_DIR/$SITE_NAME/" >&2
      echo "Hinweis: Stelle sicher dass das Repository ausgecheckt ist." >&2
      exit 1
    fi
  fi

  # Build je nach Framework-Typ
  echo "[$(date -Iseconds)] Site '$SITE_NAME' wird gebaut (Framework: $FRAMEWORK_TYPE)..."

  if [[ "$FRAMEWORK_TYPE" == "starlight" ]]; then
    (cd "$SITE_DIR" && npm run build)
    BUILD_DIR="$SITE_DIR/dist"
  elif [[ "$FRAMEWORK_TYPE" == "react-spa" ]]; then
    (cd "$SITE_DIR" && npm run build)
    BUILD_DIR="$SITE_DIR/dist"
  else
    echo "Fehler: Unbekannter Framework-Typ: $FRAMEWORK_TYPE" >&2
    exit 1
  fi

  if [[ ! -d "$BUILD_DIR" ]]; then
    echo "Fehler: Build-Verzeichnis nicht gefunden nach Build: $BUILD_DIR" >&2
    exit 1
  fi

  RSYNC_SOURCE="$BUILD_DIR/"
  RSYNC_DEST="$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/$SITE_NAME/"
fi

BUILD_SIZE="$(du -sh "$BUILD_DIR" 2>/dev/null | cut -f1 || echo "?")"
echo "[$(date -Iseconds)] Build erfolgreich ($BUILD_SIZE): $BUILD_DIR"

# Rsync-Optionen
RSYNC_OPTS=(-az --delete --checksum)

if [[ -n "$DRY_RUN" ]]; then
  echo "[$(date -Iseconds)] DRY_RUN: rsync ${RSYNC_OPTS[*]} --dry-run $RSYNC_SOURCE $RSYNC_DEST"
  rsync "${RSYNC_OPTS[@]}" --dry-run "$RSYNC_SOURCE" "$RSYNC_DEST"
  echo "[$(date -Iseconds)] DRY_RUN abgeschlossen — kein Deploy durchgeführt"
else
  echo "[$(date -Iseconds)] Synchronisiere nach $RSYNC_DEST ..."
  rsync "${RSYNC_OPTS[@]}" "$RSYNC_SOURCE" "$RSYNC_DEST"
  echo "[$(date -Iseconds)] Deploy erfolgreich: $SITE_NAME → $RSYNC_DEST"
fi
