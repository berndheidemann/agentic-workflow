# Agent Context

> 2026-02-19 | 33/44 done, 0 blocked, 11 open | REQ-032 abgeschlossen

## Was zuletzt passiert ist

**REQ-032 (SidebarUnlock Komponente):** Vollständig implementiert.

- **`SidebarUnlock`** (Shared-Package): Prop-basierte React-Komponente mit 3 Status-Icons:
  - `locked`: Schloss-Icon + `onLockedClick`-Callback oder Inline-Hint-Toggle
  - `unlocked`: kein Icon (unauffällig, Standard)
  - `completed`: Checkmark-Icon in grün
  - 16 Unit-Tests (alle grün)
- **`SidebarUnlockInjector`** (AP1-Trainer): React-Island die Starlight-Sidebar per DOM-Injection mit Icons versieht
  - Liest `useUnlock()` + `useProgressStore()` für 3-Zustands-Logik
  - Gesperrte Links: opacity 0.65, Navigation geblockt, Tooltip-Hinweis bei Klick
  - 7 Unit-Tests (alle grün)
- **`Sidebar.astro`** Override (AP1-Trainer): mountet `SidebarUnlockInjector` neben Standard-Sidebar
- **CSS** in `custom.css`: Styles für `.sl-injected-lock-icon`, `.sl-injected-lock-hint`, `.sidebar-unlock-*`

**Bestätigte pre-existierende Hydration-Fehler** in DragDrop/SzenarioEntscheidung/SicherheitskonzeptUebung (randomisierte Optionen). Nicht durch REQ-032 verursacht.

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root!

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner + **SidebarUnlock** (171 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (274 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix, Freischaltung + Schüler-Detail
  - Login: Username + PIN
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (61 Tests)
  - **NEU:** `SidebarUnlockInjector` + `Sidebar.astro`-Override
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests

## Nächste Prioritäten

1. **REQ-033** (P1, S) — ProgressBar Komponente (Sidebar)
2. **REQ-034** (P1, M) — Details prüfen
3. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **vitest-axe Import:** `import * as matchers from 'vitest-axe/matchers'` + `expect.extend(matchers)`
- **SidebarUnlock Pattern (ADR-012):** Prop-basiert. Consumer bestimmt Status, Komponente rendert Icon.
- **Starlight-Sidebar-Selektoren:** `nav[aria-label] a[href]` findet alle 40 Links korrekt

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
