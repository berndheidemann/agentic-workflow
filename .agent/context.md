# Agent Context

> 2026-02-19 | 36/44 done, 0 blocked, 8 open | REQ-036 Prerequisite-Soft-Gate implementiert

## Was zuletzt passiert ist

**REQ-036 (Prerequisite-basiertes Soft-Gate):** ✅ Implementiert und verifiziert.

- `packages/shared/src/prerequisite/`: `usePrerequisites` Hook, `PrerequisiteBanner` Komponente, Types, Tests (33 Tests)
- `sites/AP1-Trainer/src/components/integration/prerequisite-injector.tsx`: DOM-Injection-Island (`client:only="react"`)
- `sites/AP1-Trainer/src/components/overrides/Head.astro`: Liest Prerequisites via `Astro.locals.starlightRoute.entry.data`
- `sites/AP1-Trainer/src/content.config.ts`: Zod-Schema mit `prerequisites: z.array(z.string()).optional()`
- `subnetting.mdx` + `ipv6.mdx`: Prerequisites definiert (`netzwerktechnik/ip-adressierung`)

**Kritischer Fix:** Starlight v0.37+ nutzt `Astro.locals.starlightRoute.entry` — nicht `Astro.props.entry`!

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite (225 Tests)
  - `prerequisite/`: `usePrerequisites`, `PrerequisiteBanner`, `PrerequisiteInfo` Types
  - `offline-queue-store.ts` — localStorage-Persistenz der SyncEngine-Queue
  - SyncEngine: Offline-Detection, Auto-Reconnect (online-Event), Retry-Counter
- `apps/hub`: Vite + React + TS + Tailwind + React Router (274 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (76 Tests)
  - `SidebarUnlockInjector` + `SidebarProgressInjector` + `PrerequisiteInjector` in Head.astro
  - `prerequisites` im Zod-Schema + Frontmatter von subnetting.mdx, ipv6.mdx
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-037** (P1, M) — Kursstruktur-Manifest (dep: REQ-009 ✅)
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) (dep: REQ-051 ✅)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **PrerequisiteInjector:** `client:only="react"` (nicht `client:load`) — DOM-Zugriff im Funktionskörper
- **vitest-axe Import:** `import * as matchers from 'vitest-axe/matchers'` + `expect.extend(matchers)`
- **SidebarUnlock Pattern (ADR-012):** Prop-basiert. Consumer bestimmt Status, Komponente rendert Icon.
- **Test-Mocks:** Nach `vi.clearAllMocks()` müssen Mock-Implementierungen in `beforeEach` neu gesetzt werden!
- **Offline-Queue Storage-Key:** `lernplattform:progress-queue:{userId}` — user-spezifisch, Konflikte vermeiden

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
