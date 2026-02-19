# Agent Context

> Iteration REQ-024 done | 2026-02-19 | 24/44 done

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

## Nächstes REQ

1. **REQ-051** (P0, M) — AP1-Trainer Shared-Integration — alle Deps done
   - Erfordert: Docker + Playwright MCP verfügbar

## Offene Punkte / Hinweise

- "completed" ist Heuristik ohne Manifest: mit REQ-037 verfeinerbar (nur Hook-Änderung)
- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
