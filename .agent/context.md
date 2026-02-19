# Agent Context

> REQ-021 done | 2026-02-19 | Klassen-Verwaltung vollständig implementiert

## Letzter Status

- **REQ-021** (Klassen-Verwaltung) abgeschlossen — WIP-Code aus iter-006 war vollständig, E2E-Tests ergänzt
- **Fortschritt:** 16/44 REQs done

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (141 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (118 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `*` (404)
  - `ProtectedRoute`: role-basiert, redirect-fähig, a11y-konform
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung) + voll implementierte Klassen-Verwaltung
  - `ClassList`, `ClassDetail`, `CreateClassForm`: vollständige Komponenten mit Tests
  - `sites.ts`: SiteConfig-Interface + 6 Sites (datengetrieben)
- Docker Compose: PocketBase (healthy) + Nginx
- E2E: 29 Tests in 5 Specs (login, landing, register, dashboard/404, klassen) — alle grün
- 118 Hub-Unit-Tests + 141 Shared-Unit-Tests = 259 gesamt, Build + Lint sauber

## Nächste REQs (nach Priorität)

- **REQ-031** (P0, M, UnlockGate — dep REQ-007 ✓) — nächstes REQ
- **REQ-050** (P0, S, Site-Integration Nginx — dep REQ-002 ✓)
- **REQ-073** (P0, S, Rate-Limiting — deps REQ-002, REQ-010 ✓)
- **REQ-023a** (P0, M, Freischaltungsmatrix — deps REQ-020 ✓, REQ-021 ✓ — jetzt freigegeben)
- **REQ-024** (P0, M, Modul-Freischaltung — deps REQ-007 ✓, REQ-021 ✓ — jetzt freigegeben)

## Offene Punkte

- act()-Warnings in use-unlock, LoginPage, RegisterPage Tests — keine Failures, technische Schuld
