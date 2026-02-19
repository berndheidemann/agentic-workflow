# Agent Context

> 2026-02-19 | 30/44 done, 0 blocked, 14 open | Bugfixes: Login-Klassencode entfernt, Kurs-Links repariert, Gast-CTA ergänzt

## Was zuletzt passiert ist

**Manuelle Validierung (Session mit User):**
- Login-Formular: Klassen-Code-Feld entfernt (war für Auth nicht verwendet, blockierte aber Nutzer)
- Kurs-Kacheln: Links führten zu 404 — `getCourseHref()` ergänzt (Dev: localhost:8080, Prod: relativ)
- Gast-CTA: ProfileSection zeigt jetzt Anmelden/Registrieren-Links statt nichts
- E2E-Tests (login.spec.ts, profile.spec.ts) an neue Login-Form angepasst
- 264 Hub-Tests + 148 Shared-Tests grün, Build + Lint sauber
- Agent-Loop-Prozess überarbeitet: AGENT.md + VALIDATOR.md mit "Teste wie ein ECHTER Nutzer"-Regel

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (148 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (264 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix (mit Zell-Klick → Detail-Modal), Freischaltung + Schüler-Detail
  - Login: Username + PIN (kein Klassen-Code mehr)
  - Gast-CTA: Anmelden/Registrieren-Links auf Landing-Page
  - `getCourseHref()`: Dev-Modus → localhost:8080, Prod → relativ
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (54 Tests)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests (login, register, profile, dashboard, landing, 404)

## Nächste Prioritäten

1. **REQ-035** (P1, S) — a11y-Feinschliff bestehende Komponenten
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Agent-Loop:** Opus plant User Journeys pro REQ (Phase 2.5), Sonnet testet als echter Nutzer (Phase 4.2b)

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
