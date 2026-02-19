# Agent Context

> Iter-011 | 2026-02-19 | 26/44 done, 0 blocked, 18 open

## Zuletzt abgeschlossen: REQ-009 (Site-Registry)

- `apps/hub/public/sites.json` — Single Source of Truth für alle 6 Sites (slug, name, description, icon, base_path, framework_type, is_active, sort_order, modules)
- `getSites()` async Funktion fetcht `/sites.json`, Fallback auf statisches Array
- `useSites()` React Hook: startet mit statischen Sites (kein Loading-Flash), aktualisiert nach Fetch
- `HomePage` nutzt `useSites()` statt synchronem `getActiveSites()`
- `DashboardPage` (MatrixView + FreischaltungView) nutzen `useSites()` statt Modul-Variable
- `scripts/generate-nginx.sh` — generiert nginx.conf aus sites.json (alle aktiven Sites)
- `scripts/validate-sites.sh` — validiert Site-Slugs gegen Registry (für Deploy-Scripts)
- 196 Unit-Tests (8 neu), Build OK, Smoke-Test bestanden

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Lernplattform-Monorepo: `npm run test/build/lint` läuft in `packages/shared` + `apps/hub`.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (196 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung (alle 6 AK ✅)
  - `apps/hub/public/sites.json`: Site-Registry (SSOT)
  - `apps/hub/src/config/sites.ts`: TypeScript-Typen + getSites() + useSites() + Fallback-Array
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (ADR-009, 54 Tests)
  - Eigenes `.git`-Repo in `sites/AP1-Trainer/.git`
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- `scripts/generate-nginx.sh`: nginx.conf Generator aus sites.json
- `scripts/validate-sites.sh`: Site-Slug-Validator für Deploy-Scripts

## Nächste Prioritäten

1. **REQ-014** (P1, M) — Kurs-Kacheln mit Fortschrittsbalken
2. **REQ-015** (P1, S) — Profil-Bereich
3. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) — abhängig von REQ-051 ✅

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- ESLint: `fetch` global ist in `apps/hub/eslint.config.js` registriert (prod + test Block)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
