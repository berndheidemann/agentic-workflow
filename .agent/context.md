# Agent Context

> 2026-02-19 | 32/44 done, 0 blocked, 12 open | REQ-030 + REQ-035 abgeschlossen

## Was zuletzt passiert ist

**REQ-030 (LoginBanner):** Komponente in packages/shared implementiert + in HomePage.tsx eingebunden. Für Gäste: dismissbarer blauer Banner "Melde dich an um deinen Fortschritt zu speichern" mit /login-Link.

**REQ-035 (a11y-Feinschliff):** Alle Kriterien im Code vorhanden:
- `text-gray-600` in progress-matrix.tsx (war text-gray-400)
- `aria-live="assertive"` auf Error-Alerts (class-detail.tsx, LoginPage, RegisterPage)
- Copy-Button aria-label dynamisch ("Kopieren" → "Code kopiert") in class-detail.tsx
- `← aria-hidden="true"` Back-Link in class-detail.tsx
- Keyboard-Navigation-Tests + Axe-Audits in Login/Register/Matrix-Tests

**vitest-axe Fix:** test-setup.ts Import-Syntax repariert (`import * as matchers`). 274 Hub + 155 Shared Tests grün.

## KRITISCH: Docker braucht `sudo`

Sonnet muss `sudo docker compose` statt `docker compose` verwenden.
Tests korrekt via `npm run test` ausführen (workspace-aware), NICHT `npx vitest run` im Root.

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation + LoginBanner (155 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (274 Tests)
  - Routing: `/`, `/login`, `/register`, `/dashboard/*`, `/datenschutz`, `/einwilligung`, `*` (404)
  - Dashboard: Klassen, Matrix (Zell-Klick → Detail-Modal), Freischaltung + Schüler-Detail
  - Login: Username + PIN (kein Klassen-Code mehr)
  - Gast-CTA: Anmelden/Registrieren-Links + dismissbarer LoginBanner
  - `getCourseHref()`: Dev-Modus → localhost:8080, Prod → relativ
- `sites/AP1-Trainer`: Astro/Starlight mit Shared-Integration (54 Tests)
- Docker Compose: PocketBase + Nginx + Traefik-Labels
- E2E: 32+ Playwright-Tests (login, register, profile, dashboard, landing, 404)
- vitest-axe: Axe-Audits in LoginPage, RegisterPage, progress-matrix Tests

## Nächste Prioritäten

1. **REQ-032** (P1, M) — SidebarUnlock Komponente (Icons: gesperrt/freigeschaltet/abgeschlossen)
2. **REQ-033** (P1, S) — ProgressBar Komponente (Sidebar)
3. **REQ-060** (P1, M) — Starlight-Sites integrieren (pandas, REST/NoSQL)

## Wichtige Architektur-Details

- AP1-Trainer hat **eigenes `.git`-Repo** (`sites/AP1-Trainer/.git`) — Commits dort separat!
- `sites.json` ist SSOT — bei neuer Site: 1 Eintrag + generate-nginx.sh ausführen
- `useSites()` startet mit statischen Fallback-Sites → kein Loading-Flash
- **Test-Ausführung:** `npm run test` (workspace-aware), nie `npx vitest run` im Root!
- **vitest-axe Import:** `import * as matchers from 'vitest-axe/matchers'` + `expect.extend(matchers)`

## Credentials

- Superuser: `admin@lernplattform.test` / `admin12345678`
- Teacher: `testlehrer` / `1234` (join_code `L5RXKX`)
- Test-Klasse: join_code `S9VFB6` (id: e7bna5s0me9rtql)
- Schüler: `schueler1` / `1111`
