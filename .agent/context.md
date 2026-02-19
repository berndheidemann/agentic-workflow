# Agent Context

> Iteration 4 | 2026-02-19 | REQ-023b done, alle P0 bis auf REQ-051

## Letzter Status

- **REQ-023b** (Matrix Filter & Aggregation) → `done` — Smoke-Test bestanden
  - Aggregat-Zeile "Klasse gesamt" mit Prozenten pro Spalte
  - Modul-Filter-Dropdown (kursabhängig)
  - URL-Parameter für Klasse/Kurs/Modul (Sharing/Bookmarking)
- **Fortschritt:** ~24/44 REQs done

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (179 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `/datenschutz`, `/einwilligung`, `*` (404)
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung) — absolute Pfade
  - Klassen-Verwaltung: vollständig
  - Matrix: `ProgressMatrix` + `useClassProgress` + Aggregat-Zeile + Modul-Filter + URL-Params
  - Freischaltung: `ModuleUnlockList` + `useModuleUnlocks`
  - Sites-Config mit Modul-Definitionen pro Kurs
- Docker Compose: PocketBase (healthy) + Nginx + Traefik-Labels
- CookieAuthStore: exportToCookie/loadFromCookie — Auth überlebt Page-Reload
- 179 Hub-Unit-Tests + 148 Shared-Unit-Tests = 327 gesamt, Build + Lint sauber

## Nächste REQs (nach Priorität)

1. **REQ-051** (P0, M, AP1-Trainer Shared-Integration — deps REQ-005✓, REQ-006✓, REQ-007✓, REQ-050✓)
2. P1 REQs: REQ-009, REQ-014, REQ-015, REQ-025, REQ-026, REQ-030, etc.

## Offene Punkte

- act()-Warnings in Tests — technische Schuld
- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse mit 3 Schülern: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- progress-validation.pb.js verursacht Laufzeitfehler — muss debuggt werden
- PB_URL env var nötig für Vite-Proxy wenn Docker-Ports nicht erreichbar (Container-IP nutzen)
