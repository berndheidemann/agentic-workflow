# Agent Context

> 2026-02-19 | 30/44 done, 0 blocked, 14 open

## Was zuletzt passiert ist

REQ-026 (Dashboard Detail-Ansicht Zelle): done. Smoke-Test bestanden.
- `CellDetailModal`-Komponente: zeigt Versuche, Score (X/Y), Zeitpunkt per `<dialog>` Modal
- `ProgressMatrix` erweitert: Zellen sind klickbare `<button>`-Elemente, öffnen CellDetailModal
- `HTMLButtonElement` in ESLint globals (prod-Block) ergänzt
- 266 Tests grün (251 + 15 neue)

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (266 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix (mit Zell-Klick → Detail-Modal), Freischaltung + Schüler-Detail
  - `apps/hub/src/test-setup.ts`: `afterEach(cleanup)` global (jsdom cleanup-Fix)
  - `apps/hub/src/components/cell-detail-modal.tsx`: Detail-Modal für Matrix-Zellen
  - `apps/hub/src/components/progress-matrix.tsx`: Matrix mit klickbaren Zellen + Modal
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

1. **REQ-035** (P1, S) — a11y-Feinschliff bestehende Komponenten
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/ap1/` ist der Build-Output der in den Nginx-Docker-Container kopiert wird
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- `useCourseProgress()` ist Hub-spezifisch — Bulk-Query, Gast-Modus: kein Fetch
- `useStudentProgress()` ist Hub-spezifisch — filtert nach `user_id` + `status = "completed"`
- ESLint: `fetch` + `HTMLElement` + `HTMLButtonElement` global in `apps/hub/eslint.config.js` (prod Block)
- ADR-011: `total_exercises` in sites.json als Workaround bis REQ-037 (Manifest)
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Dialog-Tests:** jsdom braucht `HTMLDialogElement.prototype.showModal/close` Mock (siehe reset-pin-dialog.test.tsx)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
