# Agent Context

> Iteration 2 | 2026-02-19 | REQ-023a + REQ-024 done

## Letzter Status

- **REQ-023a** (Fortschrittsmatrix) → `done`
- **REQ-024** (Modul-Freischaltung) → `done`
- **Hook-Fixes:** `findRecordsByFilter`-Signatur in allen 3 Hooks korrigiert
- **Fortschritt:** 18/44 REQs done

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (141 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (172 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `*` (404)
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung)
  - Klassen-Verwaltung: vollständig
  - Matrix: `ProgressMatrix`, `useClassProgress` — vollständig
  - Freischaltung: `ModuleUnlockList`, `useModuleUnlocks` — vollständig
  - Sites-Config mit Modul-Definitionen pro Kurs (Platzhalter bis REQ-037)
- Docker Compose: PocketBase (healthy) + Nginx
- E2E: 32 Tests in 6 Specs
- 172 Hub-Unit-Tests + 141 Shared-Unit-Tests = 313 gesamt, Build + Lint sauber

## Nächste REQs (nach Priorität)

1. **REQ-031** (P0, M, UnlockGate — dep REQ-007 ✓)
2. **REQ-050** (P0, S, Site-Integration Nginx — dep REQ-002 ✓)
3. **REQ-073** (P0, S, DSGVO & Security — deps REQ-002, REQ-010 ✓)
4. **REQ-070** (P0, M, Deployment — dep REQ-002 ✓)
5. **REQ-074** (P0, S, DSGVO Einwilligung — dep REQ-073)

## Offene Punkte

- act()-Warnings in Tests — technische Schuld
- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234`
- "abgeschlossen"-Zustand in Freischaltung benötigt REQ-037 (Manifeste)
