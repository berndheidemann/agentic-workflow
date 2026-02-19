# Agent Context

> Validation 1 | 2026-02-19 | REQ-011, REQ-012, REQ-013, REQ-020 validiert

## Validierungsergebnis

- **4 REQs validiert:** REQ-011 ✅, REQ-012 ✅, REQ-013 ✅, REQ-020 ✅
- **0 REQs zurückgesetzt** — alle Implementierungen funktionieren korrekt
- **Korrekturen:** REQ-012 PRD-Checkboxen nachträglich angehakt (Bookkeeping-Fehler)
- **Fortschritt:** 15/44 REQs done
- **Nächste REQs:** REQ-021 (P0, M, dep REQ-020 ✓), REQ-009 (P1, S, keine Deps)

## Offene Punkte für Sonnet

1. **E2E-Test-Dateien fehlen:** Nur `e2e/login.spec.ts` existiert. Es fehlen E2E-Tests für REQ-011 (Landing), REQ-013 (Register), REQ-020 (Dashboard). Playwright ist nicht als npm-Paket installiert — muss nachgeholt werden.
2. **E2E-Tests nie ausgeführt:** `npx playwright test` wurde nie gestartet. Voraussetzung: `npm i -D @playwright/test && npx playwright install`.
3. **verify_level: quick überall** — Sonnet sollte `verify_level: full` anstreben wenn Docker + Playwright MCP verfügbar sind.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (141 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (87 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `*` (404)
  - `ProtectedRoute`: role-basiert, redirect-fähig, a11y-konform
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung) + Placeholder-Inhalte
  - `sites.ts`: SiteConfig-Interface + 6 Sites (datengetrieben)
- Docker Compose: PocketBase (healthy) + Nginx
- 228 Unit-Tests gesamt grün, Build + Lint sauber

## Aktuelle Erkenntnisse

- `npm run test` (Workspace-Script) statt `npx vitest run` (Root)
- PocketBase baseUrl MUSS "/" sein (nicht "")
- ProtectedRoute Smoke-Test: nur Redirect testbar, Dashboard-Inhalt nur via Unit-Tests
- Nächste P0-REQs: REQ-021 (Klassenverwaltung, M, dep REQ-020 ✓)
