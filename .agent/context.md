# Agent Context

> 2026-02-20 | 40/44 done, 0 blocked, 0 in_progress, 4 open | REQ-052: World of Zuul Migration

## Was zuletzt passiert ist

**REQ-052 (World of Zuul — Docusaurus → Astro/Starlight Migration):** Crash Recovery — Implementierung war bereits vollständig vorhanden.
- `sites/zuul/` Astro/Starlight-Projekt mit `base: '/zuul'` existierte bereits
- 25 Markdown-Seiten migriert (13 Arbeitsblätter + 11 Infoblätter + Index = 26 Seiten)
- 22 React-Komponenten übernommen (AbstractClassBuilder, ClassExtractionVisualizer etc.)
- Sidebar-Struktur aus `sidebars.js` korrekt übertragen
- localStorage-Progress-Tracking via `public/progress-script.js` (Starlight-kompatibel, gleicher Storage-Key)
- Build-Problem durch stale Dist-Cache — `rm -rf dist/` + sauberer Rebuild → 26 Seiten OK
- `scripts/serve-sites.mjs`: `/zuul/` Route eingetragen (war auskommentiert)
- Smoke-Test bestanden: Site lädt, Checkboxen funktionieren, keine Console-Fehler

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite + Manifest
  - `manifest/types.ts` — CourseManifest, ManifestModule, ManifestLesson, ManifestExercise
  - SyncEngine: Offline-Detection, Auto-Reconnect, persistente Queue
- `apps/hub`: Vite + React + TS + Tailwind + React Router (323 Tests)
  - `use-class-progress.ts` (MatrixCell + suspicious-Flag), `use-course-visibility.ts`
  - `progress-matrix.tsx`, `cell-detail-modal.tsx`
  - Dashboard/MatrixView: Manifest-basierte Modul-Filter und Spalten
- `sites/AP1-Trainer`: Astro/Starlight (eigenes .git), manifest-generator, SharedIntegration
- `sites/pandas-lernen`: Astro/Starlight, gebaut, unter `/pandas/` erreichbar
- `sites/zuul`: Astro/Starlight (FERTIG), base `/zuul`, 26 Seiten gebaut, Progress-Script vorhanden
- `scripts/serve-sites.mjs`: serviert /ap1/, /pandas/, /zuul/ auf Port 8080
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) (dep: REQ-051 done)
2. **REQ-053** (P1, M) — World of Zuul Shared-Integration (dep: REQ-052 → jetzt done)
3. **REQ-061** (P1, M) — NumPy/UML-Sites integrieren (dep: REQ-051 done)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites/zuul/` ist KEIN eigenes git-Repo — Commits im Monorepo-Root
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **PrerequisiteInjector:** `client:only="react"` (nicht `client:load`) — DOM-Zugriff im Funktionskörper
- **Zuul Build:** Bei Build-Fehler "slug not found" → stale cache. Fix: `rm -rf sites/zuul/dist/` dann rebuild.
- **serve-sites.mjs:** Neue Sites hier als Route eintragen wenn dist/ gebaut

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Schüler: `testschueler` / `1234` (Seed-Klasse FI24A, join_code `FI24AB`)
- Schüler (anderer): `schueler1` / `1111`
