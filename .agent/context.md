# Agent Context

> 2026-02-19 | 34/44 done, 0 blocked, 10 open | REQ-033 abgeschlossen

## Was zuletzt passiert ist

**REQ-033 (ProgressBar Komponente — Sidebar):** Vollständig implementiert.

- **`SidebarProgressInjector`** (AP1-Trainer): React-Island die per DOM-Injection
  Fortschrittsbalken unter jeden Starlight-Sidebar-Link injiziert.
  - Liest `useAuth().isLoggedIn` → nur bei eingeloggtem Nutzer sichtbar
  - Liest `useProgressStore().getTopicProgress()` für completed/total pro Modul
  - Nutzt `EXERCISE_COUNTS` Registry für Gesamtzahl
  - Fortschrittsbalken: `role="progressbar"`, `aria-valuenow`, `aria-label` mit Text
  - Grüne Farbe bei 100%, Accent-Farbe bei Fortschritt
  - 8 Unit-Tests (alle grün)
- **`Sidebar.astro`** Override: mountet `SidebarProgressInjector client:load`
  neben dem bestehenden `SidebarUnlockInjector`

**REQ-032 (SidebarUnlock Komponente):** Weiterhin aktiv.

- `SidebarUnlockInjector`: DOM-Injection für Lock/Check-Icons
- `SidebarUnlock` im Shared-Package: Prop-basierte Komponente

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

1. **REQ-034** (P1, M) — Details prüfen
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
