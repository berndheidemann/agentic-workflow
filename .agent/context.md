# Agent Context

> 2026-02-20 | 44/44 done, 0 blocked, 0 in_progress, 0 open | REQ-071 implementiert

## Was zuletzt passiert ist

**REQ-071 (Ops-Scripts: Backup + Deploy):** Abgeschlossen.
- `scripts/backup.sh`: Sichert PocketBase SQLite-DB via sqlite3 Hot-Backup-API (oder Fallback gzip), komprimiert mit gzip, 30-Tage-Rotation per `find -mtime +30`, Cron-fähig mit ISO-Timestamps
- `scripts/deploy.sh`: Deployt einzelne Sites (Build + rsync), validiert Site-Name gegen `apps/hub/public/sites.json` (REQ-009 Site-Registry), Hub als Sonderfall, `--list` Modus, `DRY_RUN` Support
- REQ-061 status.json war noch auf `in_progress` — auf `done` gesetzt

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
- `apps/hub`: Vite + React + TS + Tailwind + React Router (323 Tests)
- `sites/AP1-Trainer`: Astro/Starlight (eigenes .git), vollständige SharedIntegration
- `sites/pandas-lernen`: Astro/Starlight, SharedIntegration FERTIG, Build 45 Seiten, `/pandas/`
- `sites/rest_noSQL_datenformate`: Astro/Starlight, SharedIntegration FERTIG, Build 10 Seiten, `/rest/`
- `sites/zuul`: Astro/Starlight (FERTIG + SharedIntegration), base `/zuul`, 26 Seiten
- `sites/numpy-lernsituation`: React SPA (Vite) — SharedIntegration FERTIG, base `/numpy/`, Build OK
- `sites/uml-site`: React SPA (Vite) — SharedIntegration FERTIG, base `/uml/`, Build OK
- `scripts/backup.sh`: PocketBase-Backup, gzip, 30-Tage-Rotation, Cron-fähig
- `scripts/deploy.sh`: Site-Deploy via rsync, Site-Registry-Validierung, Hub-Support
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-075** (P1, M) — Löschkonzept & Klasse archivieren (abhängig von REQ-021, REQ-073 — beide done)
2. Alle REQs abgeschlossen! Nur REQ-075 noch offen.

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/zuul/`, `sites/pandas-lernen/`, `sites/rest_noSQL_datenformate/` sind KEINE eigenen git-Repos
- `sites/` ist im .gitignore (separate repos) — Site-Dateien werden nicht im Root-Repo committed
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **ADR-017:** Exercise-Event-Bridge: Sites dispatchen `exercise-complete` CustomEvents → `useProgress()` picked up
- **ADR-018:** React-SPA SharedIntegration: `AuthProvider` in `main.tsx`, `ProgressBridge` als Sibling. `resolve.dedupe` für React bei React-19-Sites nötig.
- **REST/NoSQL Tests:** `cd sites/rest_noSQL_datenformate && npx vitest run` (eigene Config)
- **pandas Tests:** `cd sites/pandas-lernen && npx vitest run`
- **NumPy Tests:** `cd sites/numpy-lernsituation && npx vitest run`
- **UML Tests:** `cd sites/uml-site && npx vitest run`

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Schüler: `testschueler` / `1234` (Seed-Klasse FI24A, join_code `FI24AB`)
- Schüler (anderer): `schueler1` / `1111`
