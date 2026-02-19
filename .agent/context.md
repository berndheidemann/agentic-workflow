# Agent Context

> 2026-02-19 | 35/44 done, 0 blocked, 9 open | REQ-034 Offline-Queue implementiert

## Was zuletzt passiert ist

**REQ-034 (Offline-Queue für Progress):** ✅ Implementiert und verifiziert.

- `offline-queue-store.ts`: localStorage-Abstraktion mit user-spezifischen Keys (`lernplattform:progress-queue:{userId}`), Type-Guard, roundtrip-sicher.
- `sync-engine.ts`: Erweitert um `isOffline` (navigator.onLine), localStorage-Persistence, `online`-Event-Listener für Auto-Reconnect, Retry-Logik (maxRetries=5).
- 31 neue Tests: 16 sync-engine (offline detection, online event, retry, persistence) + 15 offline-queue-store.
- Shared-Package: 202 Tests (vorher 171). Hub: 274 Tests unverändert.

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock (202 Tests)
  - **NEU:** `offline-queue-store.ts` — localStorage-Persistenz der SyncEngine-Queue
  - **NEU:** SyncEngine: Offline-Detection, Auto-Reconnect (online-Event), Retry-Counter
- `apps/hub`: Vite + React + TS + Tailwind + React Router (274 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail
  - Login: Username + PIN
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (69 Tests)
  - `SidebarUnlockInjector` + `SidebarProgressInjector` in `Sidebar.astro`-Override
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)
2. **REQ-036** (P1, M) — Prerequisite Soft-Gate
3. **REQ-037** (P1, M) — Kursstruktur-Manifest

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **vitest-axe Import:** `import * as matchers from 'vitest-axe/matchers'` + `expect.extend(matchers)`
- **SidebarUnlock Pattern (ADR-012):** Prop-basiert. Consumer bestimmt Status, Komponente rendert Icon.
- **SidebarProgressInjector Pattern:** Analog zu SidebarUnlockInjector — DOM-Injection, `cleanupRef`
- **Starlight-Sidebar-Selektoren:** `nav[aria-label] a[href]` findet alle 40 Links korrekt
- **Test-Mocks:** Nach `vi.clearAllMocks()` müssen Mock-Implementierungen in `beforeEach` neu gesetzt werden!
- **Offline-Queue Storage-Key:** `lernplattform:progress-queue:{userId}` — user-spezifisch, Konflikte vermeiden

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
