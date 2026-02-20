# Agent Context

> 2026-02-20 | 39/44 done, 0 blocked, 0 in_progress, 5 open | REQ-040: Suspicious-Markierung im Dashboard

## Was zuletzt passiert ist

**REQ-040 (Dashboard zeigt verdächtige Einträge):** Fertiggestellt.
- `MatrixCell`-Interface um `suspicious?: boolean` erweitert
- `useClassProgress`-Hook setzt `suspicious` aus `progress.suspicious`
- `ProgressMatrix`: zeigt ⚠-Icon mit `title`-Tooltip bei `suspicious: true`
- `CellDetailModal`: zeigt "Verdächtig"-Badge + `role="note"` mit Erklärung + "kein automatischer Block"
- 12 neue Tests, gesamt 323 Tests grün

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
  - `manifest/types.ts` — CourseManifest, ManifestModule, ManifestLesson, ManifestExercise
  - `manifest/index.ts` — validateManifest() + Re-Exports
  - SyncEngine: Offline-Detection, Auto-Reconnect, persistente Queue
- `apps/hub`: Vite + React + TS + Tailwind + React Router (323 Tests)
  - `use-manifests.ts` — fetcht course-manifest.json pro Site
  - `use-manifest-columns.ts` — manifestToColumns(), manifestToModuleOptions()
  - `use-course-progress.ts` — nutzt Manifest-totalExercises statt sites.json-Fallback
  - `use-class-progress.ts` — Matrix-Spalten aus Manifest, MatrixCell mit `suspicious`-Flag
  - `use-course-visibility.ts` — Kurs-Level-Filterung nach Klassen-Zuordnung (REQ-039)
  - `progress-matrix.tsx` — ⚠-Icon mit Tooltip für suspicious Zellen
  - `cell-detail-modal.tsx` — "Verdächtig"-Badge + note-Region mit Erklärung
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
