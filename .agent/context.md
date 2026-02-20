# Agent Context

> 2026-02-20 | 37/44 done, 0 blocked, 0 in_progress, 7 open | REQ-037: Kursstruktur-Manifest abgeschlossen

## Was zuletzt passiert ist

**REQ-037 (Kursstruktur-Manifest):** Fertiggestellt. WIP-Code aus vorheriger Iteration war bereits umfassend.
- Bugfix: `LoginPage.tsx` → `pb.authStore?.record?.['role']` (optionales Chaining fehlte → TypeError im Test)
- Alle 297 Tests grün, Build sauber, Smoke-Test bestanden

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
  - `manifest/types.ts` — CourseManifest, ManifestModule, ManifestLesson, ManifestExercise
  - `manifest/index.ts` — validateManifest() + Re-Exports
  - SyncEngine: Offline-Detection, Auto-Reconnect, persistente Queue
- `apps/hub`: Vite + React + TS + Tailwind + React Router (297 Tests)
  - `use-manifests.ts` — fetcht course-manifest.json pro Site
  - `use-manifest-columns.ts` — manifestToColumns(), manifestToModuleOptions()
  - `use-course-progress.ts` — nutzt Manifest-totalExercises statt sites.json-Fallback
  - `use-class-progress.ts` — Matrix-Spalten aus Manifest (alle Exercises sichtbar)
  - Dashboard/MatrixView: Manifest-basierte Modul-Filter und Spalten
  - HomePage: useManifests + useCourseProgress mit Manifest-Integration
- `sites/AP1-Trainer`: Astro/Starlight (eigenes .git)
  - `manifest-generator.ts` — Astro-Integration, generiert course-manifest.json beim Build
  - Integration in `astro.config.mjs` aktiv
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-039** (P1, M) — Kurs-Filterung nach Klassen-Zuordnung (dep: REQ-012, REQ-021)
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) (dep: REQ-051 done)
3. **REQ-052** (P1, M) — Benutzerprofil (dep: REQ-001 done)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **PrerequisiteInjector:** `client:only="react"` (nicht `client:load`) — DOM-Zugriff im Funktionskörper
- **Offline-Queue Storage-Key:** `lernplattform:progress-queue:{userId}` — user-spezifisch
- **Manifest-URL:** `{basePath}course-manifest.json` — static file aus Build-Output

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
