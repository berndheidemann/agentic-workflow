# Agent Context

> Validation 2 | 2026-02-19 | Stichproben-Validation, keine neuen done-REQs

## Validierungsergebnis

- **0 neue REQs seit Validation 1** — iter-006 startete REQ-021, wurde abgebrochen
- **0 REQs zurückgesetzt** — alle 15 done-REQs weiterhin korrekt
- **Preflight:** Build ✅, 228 Tests ✅, Lint ✅, Docker ✅, Playwright MCP ✅
- **Smoke-Tests:** Landing, Login, Register, Dashboard-Redirect, 404 — alle bestanden
- **Fortschritt:** 15/44 REQs done

## Offene Punkte für Sonnet

1. **E2E-Tests fehlen weiterhin:** Nur `e2e/login.spec.ts` existiert. Playwright nicht als npm-Paket installiert. Muss vor nächster Validation nachgeholt werden.
2. **act() Warnings:** use-unlock, LoginPage, RegisterPage Tests haben act()-Warnings. Keine Failures, aber sollten bereinigt werden.
3. **REQ-021 war angefangen:** iter-006 startete REQ-021 (Klassenverwaltung), wurde abgebrochen. Sonnet kann dort weitermachen.

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

## Nächste REQs

- **REQ-021** (P0, M, Klassenverwaltung — Deps ✓) — war bereits angefangen
- **REQ-050** (P0, S, Site-Integration Nginx — dep REQ-002 ✓)
- **REQ-009** (P1, S, Site-Registry — dep REQ-001 ✓)
