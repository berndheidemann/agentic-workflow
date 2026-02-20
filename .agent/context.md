# Agent Context

> 2026-02-20 | 45/45 done, 0 blocked, 0 in_progress, 0 open | REQ-075 implementiert

## Was zuletzt passiert ist

**REQ-075 (Löschkonzept & Klasse archivieren):** Abgeschlossen. DSGVO-konforme Archivierung.
- `pb_hooks/archive-class.pb.js`: Custom API Endpoint `POST /api/classes/:classId/archive` — validiert Teacher-Auth + Ownership, setzt `is_active=false`, löscht kaskadierend: Progress → CourseUnlocks (user-spezifisch + klassenspezifisch) → User-Accounts
- `apps/hub/src/hooks/use-archive-class.ts`: React Hook für API-Call + State-Management
- `apps/hub/src/components/archive-class-dialog.tsx`: Bestätigungsdialog mit Irreversibilitäts-Hinweis, Schüleranzahl, Fehlerbehandlung
- `apps/hub/src/components/class-detail.tsx`: "Klasse archivieren"-Button (rot, nur für aktive Klassen), Dialog-Integration, `onArchived`-Callback
- `apps/hub/src/components/class-list.tsx`: Archivierte Klassen ausgegraut + "Archiviert"-Badge, Sortierung aktiv → archiviert

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
- `apps/hub`: Vite + React + TS + Tailwind + React Router (348 Tests)
- `sites/AP1-Trainer`: Astro/Starlight (eigenes .git), vollständige SharedIntegration
- `sites/pandas-lernen`: Astro/Starlight, SharedIntegration FERTIG, Build 45 Seiten, `/pandas/`
- `sites/rest_noSQL_datenformate`: Astro/Starlight, SharedIntegration FERTIG, Build 10 Seiten, `/rest/`
- `sites/zuul`: Astro/Starlight (FERTIG + SharedIntegration), base `/zuul`, 26 Seiten
- `sites/numpy-lernsituation`: React SPA (Vite) — SharedIntegration FERTIG, base `/numpy/`, Build OK
- `sites/uml-site`: React SPA (Vite) — SharedIntegration FERTIG, base `/uml/`, Build OK
- `scripts/backup.sh`: PocketBase-Backup, gzip, 30-Tage-Rotation, Cron-fähig
- `scripts/deploy.sh`: Site-Deploy via rsync, Site-Registry-Validierung, Hub-Support
- `pb_hooks/archive-class.pb.js`: DSGVO-Löschung via Custom API Endpoint (REQ-075)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Alle REQs abgeschlossen!

Alle 45 Requirements sind `done`. Keine offenen REQs mehr.

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/` ist im .gitignore (separate repos) — Site-Dateien werden nicht im Root-Repo committed
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **ADR-019:** Klassen-Archivierung via Custom API Endpoint — Teacher-Auth + kaskad. Löschung serverseitig
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter
- **REST/NoSQL Tests:** `cd sites/rest_noSQL_datenformate && npx vitest run`

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Schüler: `testschueler` / `1234` (Seed-Klasse FI24A, join_code `FI24AB`)
