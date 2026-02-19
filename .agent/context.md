# Agent Context

> 2026-02-19 | 29/44 done, 0 blocked, 14 open

## Was zuletzt passiert ist

REQ-025 (Schüler-Verwaltung im Dashboard): done. Smoke-Test bestanden.
- `StudentDetail`-Komponente: Username, Klasse, Fortschritt-Übersicht pro Kurs + Gesamt
- `ResetPinDialog`-Komponente: PIN zurücksetzen mit 4-stelliger zufälliger Vorausfüllung
- `useStudentProgress`-Hook: Bulk-Query aller completed-Progress-Einträge für einen Schüler
- Route: `/dashboard/klassen/:classId/schueler/:studentId`
- Fix: `afterEach(cleanup)` in `apps/hub/src/test-setup.ts` global (jsdom cleanup war defekt)
- 251 Tests grün (via `npm run test`)

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (251 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail (alle AK ✅)
  - `apps/hub/src/test-setup.ts`: `afterEach(cleanup)` global (jsdom cleanup-Fix)
  - `apps/hub/src/components/student-detail.tsx`: Schüler-Detail mit Fortschritt + PIN-Reset
  - `apps/hub/src/components/reset-pin-dialog.tsx`: PIN-Reset-Dialog (Dialog-Element + a11y)
  - `apps/hub/src/hooks/use-student-progress.ts`: Fortschritt-Abfrage für einen Schüler
  - `apps/hub/public/sites.json`: Site-Registry (SSOT) mit total_exercises
  - `apps/hub/src/config/sites.ts`: TypeScript-Typen + getSites() + useSites() + Fallback-Array
  - `apps/hub/src/hooks/use-course-progress.ts`: Bulk-Query für Kurs-Fortschritt (Lehrer-Matrix)
  - `apps/hub/src/components/progress-bar.tsx`: ARIA-konformer Fortschrittsbalken
  - `apps/hub/src/components/profile-section.tsx`: Profil-Bereich (Begrüßung + Logout)
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (ADR-009, 54 Tests)
  - Eigenes `.git`-Repo in `sites/AP1-Trainer/.git`
  - SharedIntegration (AuthProvider + ProgressBridge) in Head.astro
  - LernpfadWidget + UnlockIndicator in Sidebar
- `sites/ap1/`: Build-Output des AP1-Trainers (für Nginx-Docker-Image)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- `scripts/generate-nginx.sh`: nginx.conf Generator aus sites.json
- `scripts/validate-sites.sh`: Site-Slug-Validator für Deploy-Scripts

## Nächste Prioritäten

1. **REQ-026** (P1, S) — Dashboard Detail-Ansicht Zelle [Abhängigkeit REQ-023a done]
2. **REQ-035** (P1, S) — a11y-Feinschliff bestehende Komponenten
3. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/ap1/` ist der Build-Output der in den Nginx-Docker-Container kopiert wird
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- `useCourseProgress()` ist Hub-spezifisch — Bulk-Query, Gast-Modus: kein Fetch
- `useStudentProgress()` ist Hub-spezifisch — filtert nach `user_id` + `status = "completed"`
- ESLint: `fetch` + `HTMLElement` global in `apps/hub/eslint.config.js` (prod + test Block)
- ADR-011: `total_exercises` in sites.json als Workaround bis REQ-037 (Manifest)
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
