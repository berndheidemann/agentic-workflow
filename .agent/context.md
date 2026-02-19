# Agent Context

> Iteration 2 | 2026-02-19 | REQ-023a done, Hook-Fixes deployed

## Letzter Status

- **REQ-023a** (Fortschrittsmatrix) → `done` — Smoke-Test bestanden
- **Hook-Fixes:** `findRecordsByFilter`-Signatur in allen 3 Hooks korrigiert (params war an falscher Position)
- **Password-Min:** PB users collection password min auf 4 gesetzt (für 4-Ziffern-PINs), Migration angepasst
- **Fortschritt:** 17/44 REQs done

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (141 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (154 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `*` (404)
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung)
  - Klassen-Verwaltung: `ClassList`, `ClassDetail`, `CreateClassForm` — vollständig
  - Matrix: `ProgressMatrix`, `useClassProgress` — vollständig, Smoke-Test bestanden
- Docker Compose: PocketBase (healthy) + Nginx
- E2E: 32 Tests in 6 Specs — alle grün
- 154 Hub-Unit-Tests + 141 Shared-Unit-Tests = 295 gesamt, Build + Lint sauber

## Nächste REQs (nach Priorität)

1. **REQ-024** (P0, M, Modul-Freischaltung — deps REQ-007 ✓, REQ-021 ✓)
2. **REQ-031** (P0, M, UnlockGate — dep REQ-007 ✓)
3. **REQ-050** (P0, S, Site-Integration Nginx — dep REQ-002 ✓)
4. **REQ-073** (P0, S, DSGVO & Security — deps REQ-002, REQ-010 ✓)
5. **REQ-070** (P0, M, Deployment — dep REQ-002 ✓)

## Offene Punkte

- act()-Warnings in Tests — technische Schuld, keine Failures
- Superuser `admin@lernplattform.test` / `admin12345678` für PB-Admin-Zugang
- Teacher `testlehrer` / `1234` für Dashboard-Smoke-Tests
