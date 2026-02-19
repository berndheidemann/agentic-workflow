# Agent Context

> 2026-02-19 | 36/44 done, 0 blocked, 1 in_progress (REQ-037), 7 open | Validation 9: REQ-034 + REQ-036 bestanden

## Was zuletzt passiert ist

**Validation 9:** REQ-034 (Offline-Queue) und REQ-036 (Prerequisite-Soft-Gate) validiert — beide ✅ PASS.
**REQ-037 (Kursstruktur-Manifest):** in_progress. Manifest-Typen, Generator, Hooks und DashboardPage-Integration implementiert. Tests teilweise fehlgeschlagen (stale-closure). Noch nicht abgeschlossen.

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + SidebarUnlock + Prerequisite (236 Tests)
  - `prerequisite/`: `usePrerequisites`, `PrerequisiteBanner`, `PrerequisiteInfo` Types
  - `offline-queue-store.ts` — localStorage-Persistenz der SyncEngine-Queue
  - SyncEngine: Offline-Detection, Auto-Reconnect (online-Event), Retry-Counter
  - `manifest/types.ts` — ManifestModule, ManifestExercise Types
- `apps/hub`: Vite + React + TS + Tailwind + React Router (297 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail
  - `use-manifests.ts`, `use-manifest-columns.ts` — Manifest-Integration (REQ-037 WIP)
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (76 Tests)
  - `SidebarUnlockInjector` + `SidebarProgressInjector` + `PrerequisiteInjector` in Head.astro
  - `prerequisites` im Zod-Schema + Frontmatter von subnetting.mdx, ipv6.mdx
  - `manifest-generator.ts` in `src/integrations/` (REQ-037 WIP)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-037** (P1, M) — Kursstruktur-Manifest (in_progress, Fortsetzung)
2. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL) (dep: REQ-051 ✅)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **Starlight v0.37+:** `Astro.locals.starlightRoute.entry.data` für Frontmatter (NICHT `Astro.props.entry`)
- **PrerequisiteInjector:** `client:only="react"` (nicht `client:load`) — DOM-Zugriff im Funktionskörper
- **Offline-Queue Storage-Key:** `lernplattform:progress-queue:{userId}` — user-spezifisch

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
