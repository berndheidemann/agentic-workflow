# Agent Context

> Iter-013 | 2026-02-19 | 28/44 done, 0 blocked, 16 open

## Zuletzt abgeschlossen: REQ-015 (Profil-Bereich)

- `apps/hub/src/components/profile-section.tsx` — ProfileSection-Komponente: Begrüßung, X von Y Aufgaben, Logout-Button; nur sichtbar wenn eingeloggt; `<aside aria-label="Profil">`
- `apps/hub/src/pages/HomePage.tsx` — ProfileSection integriert; Summe completed/total aus useCourseProgress-Map berechnet
- `apps/hub/src/components/profile-section.test.tsx` — 7 Unit-Tests (null bei Gast, Begrüßung, Fortschritt, Logout-Button, logout-Aufruf, a11y, 0/0)
- `apps/hub/e2e/profile.spec.ts` — 4 E2E-Tests
- 226 Unit-Tests (7 neu), Build OK, Lint OK, Smoke-Test bestanden

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Lernplattform-Monorepo: `npm run test/build/lint` läuft in `packages/shared` + `apps/hub`.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (226 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung (alle 6 AK ✅)
  - `apps/hub/public/sites.json`: Site-Registry (SSOT) mit total_exercises
  - `apps/hub/src/config/sites.ts`: TypeScript-Typen + getSites() + useSites() + Fallback-Array
  - `apps/hub/src/hooks/use-course-progress.ts`: Bulk-Query für Kurs-Fortschritt
  - `apps/hub/src/components/progress-bar.tsx`: ARIA-konformer Fortschrittsbalken
  - `apps/hub/src/components/profile-section.tsx`: Profil-Bereich (Begrüßung + Logout)
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (ADR-009, 54 Tests)
  - Eigenes `.git`-Repo in `sites/AP1-Trainer/.git`
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- `scripts/generate-nginx.sh`: nginx.conf Generator aus sites.json
- `scripts/validate-sites.sh`: Site-Slug-Validator für Deploy-Scripts

## Nächste Prioritäten

1. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) — abhängig von REQ-051 ✅
2. **REQ-035** (P1, S) — a11y-Feinschliff bestehende Komponenten
3. **REQ-025** (P1, M) — Schüler-Fortschrittsübersicht im Dashboard

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- `useCourseProgress()` ist Hub-spezifisch (nicht in @lernplattform/shared) — Bulk-Query, Gast-Modus: kein Fetch
- `ProfileSection` rechnet Summe aus useCourseProgress-Map (completed/total über alle Kurse)
- ESLint: `fetch` + `HTMLElement` global in `apps/hub/eslint.config.js` (prod + test Block)
- ADR-011: `total_exercises` in sites.json als Workaround bis REQ-037 (Manifest)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
