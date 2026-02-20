# Agent Context

> 2026-02-20 | 42/44 done, 0 blocked, 0 in_progress, 2 open | REQ-060: Starlight-Sites pandas + REST/NoSQL

## Was zuletzt passiert ist

**REQ-060 (pandas + REST/NoSQL — Starlight-Sites):** Vollständig implementiert und verifiziert.
- `@lernplattform/shared` + `pocketbase` als Dependency in beiden Sites
- `SharedIntegration` + `ProgressBridge` React-Islands (identisch zu AP1-Trainer/Zuul-Pattern, ADR-009)
- `Head.astro` Override: `<SharedIntegration client:load />` in beiden Sites
- `Sidebar.astro` Override: `<SidebarUnlockInjector client:load />` für Lock-Icons
- pandas: `exerciseProgress.ts` + `useExercise.ts` dispatchen `exercise-complete` CustomEvents (ADR-017)
- REST/NoSQL: `useExerciseTracking.ts` dispatcht `exercise-complete` CustomEvents (ADR-017)
- 13 pandas-Tests + 39 REST/NoSQL-Tests alle grün, beide Builds erfolgreich (45 + 10 Seiten)
- TS-Fix in REST `useExerciseTracking.test.ts`: `[0]` → `.at(0)?.` (strict undefined check)

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
- `sites/numpy-lernsituation`: React SPA (Vite) — REQ-061 ausstehend
- `sites/uml-site`: React SPA (Vite) — REQ-061 ausstehend
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-061** (P1, M) — React-SPA-Sites integrieren (NumPy, UML) (dep: REQ-051 done)
2. **REQ-071** (P1, S) — Ops-Scripts (Backup + Deploy)
3. **REQ-075** (P1, M) — Löschkonzept & Klasse archivieren

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/zuul/`, `sites/pandas-lernen/`, `sites/rest_noSQL_datenformate/` sind KEINE eigenen git-Repos
- `sites/` ist im .gitignore (separate repos) — Site-Dateien werden nicht im Root-Repo committed
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **ADR-017:** Exercise-Event-Bridge: Sites dispatchen `exercise-complete` CustomEvents → `useProgress()` picked up
- **REST/NoSQL Tests:** `cd sites/rest_noSQL_datenformate && npx vitest run` (eigene Config)
- **pandas Tests:** `cd sites/pandas-lernen && npx vitest run`

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Schüler: `testschueler` / `1234` (Seed-Klasse FI24A, join_code `FI24AB`)
- Schüler (anderer): `schueler1` / `1111`
