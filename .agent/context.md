# Agent Context

> 2026-02-20 | 38/44 done, 0 blocked, 0 in_progress, 6 open | REQ-039: Kurs-Filterung abgeschlossen

## Was zuletzt passiert ist

**REQ-039 (Kurs-Filterung nach Klassen-Zuordnung):** Fertiggestellt.
- `useCourseVisibility` Hook in `apps/hub/src/hooks/` erstellt
- `HomePage.tsx` nutzt Hook um `visibleSites` zu berechnen, die an `CourseGrid` übergeben werden
- 14 neue Tests (9 Hook-Tests + 5 HomePage-Tests), gesamt 311 Tests grün
- Smoke-Test bestätigt: testschueler (FI24A) sieht nur AP1, Pandas, Zuul — REST, NumPy, UML ausgeblendet

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
  - `manifest/types.ts` — CourseManifest, ManifestModule, ManifestLesson, ManifestExercise
  - `manifest/index.ts` — validateManifest() + Re-Exports
  - SyncEngine: Offline-Detection, Auto-Reconnect, persistente Queue
- `apps/hub`: Vite + React + TS + Tailwind + React Router (311 Tests)
  - `use-manifests.ts` — fetcht course-manifest.json pro Site
  - `use-manifest-columns.ts` — manifestToColumns(), manifestToModuleOptions()
  - `use-course-progress.ts` — nutzt Manifest-totalExercises statt sites.json-Fallback
  - `use-class-progress.ts` — Matrix-Spalten aus Manifest (alle Exercises sichtbar)
  - `use-course-visibility.ts` — Kurs-Level-Filterung nach Klassen-Zuordnung (REQ-039)
  - Dashboard/MatrixView: Manifest-basierte Modul-Filter und Spalten
  - HomePage: useCourseVisibility → visibleSites → CourseGrid + useCourseProgress
- `sites/AP1-Trainer`: Astro/Starlight (eigenes .git)
  - `manifest-generator.ts` — Astro-Integration, generiert course-manifest.json beim Build
  - Integration in `astro.config.mjs` aktiv
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) (dep: REQ-051 done)
2. **REQ-052** (P1, M) — Benutzerprofil (dep: REQ-001 done)
3. **REQ-040** (P1, S) — Dashboard zeigt verdächtige Einträge (dep: REQ-008, REQ-023a)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **PrerequisiteInjector:** `client:only="react"` (nicht `client:load`) — DOM-Zugriff im Funktionskörper
- **Offline-Queue Storage-Key:** `lernplattform:progress-queue:{userId}` — user-spezifisch
- **Manifest-URL:** `{basePath}course-manifest.json` — static file aus Build-Output
- **useCourseVisibility:** filter `class_id = "{id}" && user_id = ""` — nur Klassen-Records (kein user_id)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Schüler: `testschueler` / `1234` (Seed-Klasse FI24A, join_code `FI24AB`)
- Schüler (anderer): `schueler1` / `1111`
