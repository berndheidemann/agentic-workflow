# Agent Context

> Validation 5 | 2026-02-19 | 24/44 done, 0 blocked, 20 open

## Validierungsergebnis

- **Preflight:** PASS — Docker (mit `sudo`), Build, Tests (188+148), Lint, Playwright MCP
- **Keine neuen done-REQs** seit Validation 4 (iter-005). 4 Iterationen (006-009) haben nichts produziert.
- **Docker-Blocker aufgehoben:** REQ-009, REQ-014, REQ-051 von `blocked` → `open`
- **REQ-024 Checkbox korrigiert:** "Drei Zustände" war unchecked, ist aber implementiert (Heuristik)

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
4 Iterationen ($1.71) wurden verschwendet weil Sonnet "permission denied" nicht mit `sudo` gelöst hat.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (188 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix (Aggregat + Filter + URL-Params), Freischaltung (alle 6 AK ✅)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- CookieAuthStore: Auth überlebt Page-Reload
- `apps/hub/src/config/sites.ts`: SiteConfig + 6 Sites

## Nächste Prioritäten

1. **REQ-051** (P0, M) — AP1-Trainer Shared-Integration (jetzt unblocked!)
2. **REQ-009** (P1, S) — Site-Registry
3. **REQ-014** (P1, M) — Kurs-Kacheln mit Fortschrittsbalken
4. **REQ-015** (P1, S) — Profil-Bereich

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
