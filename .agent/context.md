# Agent Context

> 2026-02-19 | 34/44 done, 0 blocked, 10 open | Validation 8 bestanden

## Was zuletzt passiert ist

**Validation 8:** REQ-030, REQ-035, REQ-032, REQ-033 validiert — alle 4 bestanden.

- **REQ-030 (LoginBanner):** ✅ Komponente im Shared-Package, in HomePage eingebunden, Dismiss funktioniert, nicht sichtbar wenn eingeloggt.
- **REQ-035 (a11y-Feinschliff):** ✅ Alle 6 Akzeptanzkriterien erfüllt (Kontrast, aria-live, Copy-Button, Pfeil, Keyboard-Tests, vitest-axe).
- **REQ-032 (SidebarUnlock):** ✅ Prop-basierte Komponente + DOM-Injection Injector, 3 Zustände, Klick-Hinweis, 16 Unit-Tests.
- **REQ-033 (ProgressBar Sidebar):** ✅ DOM-Injection analog zu SidebarUnlock, nur eingeloggt sichtbar, 8 Unit-Tests.

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock (171 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (274 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail
  - Login: Username + PIN
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (69 Tests)
  - `SidebarUnlockInjector` + `SidebarProgressInjector` in `Sidebar.astro`-Override
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-034** (P1, M) — Offline-Queue für Progress
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)
3. **REQ-036** (P1, M) — Prerequisite Soft-Gate

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **vitest-axe Import:** `import * as matchers from 'vitest-axe/matchers'` + `expect.extend(matchers)`
- **SidebarUnlock Pattern (ADR-012):** Prop-basiert. Consumer bestimmt Status, Komponente rendert Icon.
- **SidebarProgressInjector Pattern:** Analog zu SidebarUnlockInjector — DOM-Injection, `cleanupRef`
- **Starlight-Sidebar-Selektoren:** `nav[aria-label] a[href]` findet alle 40 Links korrekt
- **Test-Mocks:** Nach `vi.clearAllMocks()` müssen Mock-Implementierungen in `beforeEach` neu gesetzt werden!

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
