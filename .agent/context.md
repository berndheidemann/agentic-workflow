# Agent Context

> Iter-012 | 2026-02-19 | 27/44 done, 0 blocked, 17 open

## Zuletzt abgeschlossen: REQ-014 (Kurs-Kacheln mit Fortschrittsbalken)

- `apps/hub/public/sites.json` — um `total_exercises` pro Site erweitert (AP1: 120, Pandas: 40, REST: 35, Zuul: 30, NumPy: 25, UML: 30)
- `apps/hub/src/config/sites.ts` — `SiteConfig.totalExercises: number` + Mapping in `siteFromJson()` + Fallback-Array
- `apps/hub/src/hooks/use-course-progress.ts` — Bulk-Query Hook: ein API-Call für alle Kurse, gruppiert nach course-Slug, Prozent berechnet
- `apps/hub/src/components/progress-bar.tsx` — ProgressBar-Komponente mit role="progressbar", ARIA, farbiger Balken (blau/grün)
- `apps/hub/src/components/course-card.tsx` — optionales `progress`-Prop → ProgressBar wird nur angezeigt wenn progress vorhanden und totalExercises > 0
- `apps/hub/src/components/course-grid.tsx` — optionales `courseProgress`-Prop (Map) weitergereicht an CourseCard
- `apps/hub/src/pages/HomePage.tsx` — `useCourseProgress` integriert, Gast-Modus: kein Fetch (leere Sites-Liste übergeben)
- 219 Unit-Tests (23 neu), Build OK, Lint OK, Smoke-Test bestanden (Fortschrittsbalken nach Login sichtbar)

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Lernplattform-Monorepo: `npm run test/build/lint` läuft in `packages/shared` + `apps/hub`.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (219 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung (alle 6 AK ✅)
  - `apps/hub/public/sites.json`: Site-Registry (SSOT) mit total_exercises
  - `apps/hub/src/config/sites.ts`: TypeScript-Typen + getSites() + useSites() + Fallback-Array
  - `apps/hub/src/hooks/use-course-progress.ts`: Bulk-Query für Kurs-Fortschritt
  - `apps/hub/src/components/progress-bar.tsx`: ARIA-konformer Fortschrittsbalken
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (ADR-009, 54 Tests)
  - Eigenes `.git`-Repo in `sites/AP1-Trainer/.git`
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- `scripts/generate-nginx.sh`: nginx.conf Generator aus sites.json
- `scripts/validate-sites.sh`: Site-Slug-Validator für Deploy-Scripts

## Nächste Prioritäten

1. **REQ-015** (P1, S) — Profil-Bereich (Hallo [Username], X von Y Aufgaben, Logout)
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) — abhängig von REQ-051 ✅
3. **REQ-035** (P1, S) — a11y-Feinschliff bestehende Komponenten

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- `useCourseProgress()` ist Hub-spezifisch (nicht in @lernplattform/shared) — Bulk-Query, Gast-Modus: kein Fetch
- ESLint: `fetch` + `HTMLElement` global in `apps/hub/eslint.config.js` (prod + test Block)
- ADR-011: `total_exercises` in sites.json als Workaround bis REQ-037 (Manifest)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
