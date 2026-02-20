#!/usr/bin/env bash
# backup.sh — PocketBase SQLite-Datenbank sichern
#
# Verwendung:
#   ./scripts/backup.sh                  # Backup mit Standard-Einstellungen
#   BACKUP_DIR=/mnt/backups ./scripts/backup.sh   # Anderes Verzeichnis
#
# Umgebungsvariablen:
#   BACKUP_DIR    Zielverzeichnis für Backups (Standard: /var/backups/lernplattform)
#   PB_DATA_DIR   PocketBase-Datenverzeichnis (Standard: ./pb_data)
#   RETENTION_DAYS Anzahl Tage für die Aufbewahrung (Standard: 30)
#
# Cron-Beispiel (täglich um 03:00):
#   0 3 * * * /opt/lernplattform/scripts/backup.sh >> /var/log/lernplattform-backup.log 2>&1
#
# Exit-Codes:
#   0 — Backup erfolgreich
#   1 — Fehler (fehlende Dateien, Berechtigungsproblem, etc.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Konfiguration (überschreibbar via Umgebungsvariablen)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lernplattform}"
PB_DATA_DIR="${PB_DATA_DIR:-$PROJECT_ROOT/pb_data}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_SOURCE="$PB_DATA_DIR/data.db"
BACKUP_FILE="$BACKUP_DIR/pocketbase_${TIMESTAMP}.db.gz"

echo "[$(date -Iseconds)] Backup gestartet"

# Voraussetzungen prüfen
if [[ ! -d "$PB_DATA_DIR" ]]; then
  echo "Fehler: PocketBase-Datenverzeichnis nicht gefunden: $PB_DATA_DIR" >&2
  exit 1
fi

if [[ ! -f "$DB_SOURCE" ]]; then
  echo "Fehler: SQLite-Datenbank nicht gefunden: $DB_SOURCE" >&2
  exit 1
fi

# Zielverzeichnis anlegen falls nicht vorhanden
mkdir -p "$BACKUP_DIR"

# SQLite-Datenbank sichern und komprimieren
# sqlite3 .backup nutzt die SQLite-eigene Hot-Backup-API (safe für laufende PocketBase)
if command -v sqlite3 &>/dev/null; then
  TMP_DB="$(mktemp --suffix=.db)"
  trap 'rm -f "$TMP_DB"' EXIT
  sqlite3 "$DB_SOURCE" ".backup '$TMP_DB'"
  gzip -c "$TMP_DB" > "$BACKUP_FILE"
else
  # Fallback: direkte Kopie mit gzip (funktioniert wenn PocketBase nicht läuft)
  gzip -c "$DB_SOURCE" > "$BACKUP_FILE"
fi

BACKUP_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
echo "[$(date -Iseconds)] Backup erstellt: $BACKUP_FILE ($BACKUP_SIZE)"

# 30-Tage-Rotation: Alte Backups löschen
DELETED_COUNT=0
while IFS= read -r -d '' old_backup; do
  rm -f "$old_backup"
  echo "[$(date -Iseconds)] Altes Backup gelöscht: $(basename "$old_backup")"
  DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "$BACKUP_DIR" -name "pocketbase_*.db.gz" -mtime +"$RETENTION_DAYS" -print0 2>/dev/null)

echo "[$(date -Iseconds)] Rotation abgeschlossen: $DELETED_COUNT Backup(s) gelöscht (Aufbewahrung: ${RETENTION_DAYS} Tage)"
echo "[$(date -Iseconds)] Backup erfolgreich abgeschlossen"
