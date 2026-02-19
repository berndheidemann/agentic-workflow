# Agent Context

> Validation 4 | 2026-02-19 | REQ-024 reverted, 23/44 done

## Validierungsergebnis

- **8 REQs validiert:** REQ-023a, REQ-023b, REQ-024, REQ-031, REQ-050, REQ-070, REQ-073, REQ-074
- **7 bestanden**, 1 reverted (REQ-024)
- **REQ-024 Problem:** "abgeschlossen"-Zustand fehlt — nur locked/unlocked implementiert. Benötigt Progress-Aggregation pro Modul, die erst mit REQ-037 (Manifest) möglich ist.
- **Preflight:** 327 Tests grün, Build + Lint sauber, Docker healthy, Playwright OK
- **UI Smoke Tests:** HomePage, PrivacyPage, ConsentPage, RegisterPage — alle korrekt, 0 Fehler

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (179 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen-Verwaltung, Matrix (Aggregat + Filter + URL-Params), Freischaltung (5/6 Kriterien)
- Docker Compose: PocketBase (healthy) + Nginx + Traefik-Labels
- CookieAuthStore: Auth überlebt Page-Reload
- 327 Unit-Tests gesamt, Build + Lint sauber

## Nächste REQs (nach Priorität)

1. **REQ-024** (P0, fix: "abgeschlossen"-Zustand — abhängig von REQ-037 oder lokaler Lösung)
2. **REQ-051** (P0, M, AP1-Trainer Shared-Integration)
3. P1 REQs: REQ-009, REQ-014, REQ-015, REQ-025, etc.

## Offene Punkte

- REQ-024: `ModuleStatus` hat nur `locked | unlocked` — braucht `completed` basierend auf Progress-Daten
- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
