# Agent Context

> Iteration REQ-009 blocked | 2026-02-19 | 24/44 done

## Was implementiert wurde (REQ-024 — Modul-Freischaltung im Dashboard)

- `ModuleStatus`: `'unlocked' | 'locked' | 'completed'` (alle 3 Zustände)
- `useModuleUnlocks`: parallel 3 API-Calls (course_unlocks, users, progress)
- "completed" wenn freigeschaltet UND mind. 1 Schüler mit `status="completed"` Progress im Modul
- `lessonBelongsToModule`: `lesson === moduleId || lesson.startsWith(moduleId + '/')`
- `moduleIdsKey = moduleIds.join(',')` + `useRef` verhindert useEffect-Infinite-Loop
- `module-unlock-list.tsx`: blauer Stil für `completed` (✅, "Abgeschlossen", "Sperren"-Button)
- 188 Hub-Tests + 148 Shared-Tests grün, Build + Lint sauber

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (188 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen-Verwaltung, Matrix (Aggregat + Filter + URL-Params), Freischaltung (6/6 ✅)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- CookieAuthStore: Auth überlebt Page-Reload
- `apps/hub/src/config/sites.ts`: SiteConfig-Interface + 6 Sites (REQ-009 Interface vorweggenommen durch ADR-006)

## Nächstes REQ

- **REQ-009** (P1, S) — Site-Registry — BLOCKED (Docker nicht verfügbar)
- **REQ-051** (P0, M) — AP1-Trainer Shared-Integration — BLOCKED (Docker nicht verfügbar)
- **REQ-015** (P1, S) — Deps: REQ-005, REQ-006, REQ-010 alle done — BLOCKED (Docker)

## Offene Punkte / Hinweise

- Docker nicht verfügbar (permission denied auf /var/run/docker.sock) → alle REQs blockiert
- "completed" ist Heuristik ohne Manifest: mit REQ-037 verfeinerbar (nur Hook-Änderung)
- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
