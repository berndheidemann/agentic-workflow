# Agent Context

> Iteration 9 | 2026-02-19 | REQ-010 + REQ-022 abgeschlossen

## Projektstatus

- Fortschritt: 11/44 REQs done (inkl. REQ-010, REQ-022)
- Nächste REQs: REQ-011 (P0, M, dep REQ-010 ✓), REQ-009 (P1, S, dep REQ-001 ✓)
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (test-script beide Workspaces), `tsconfig.json`, `.gitignore`, `.prettierrc`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js` (mit Vitest-Globals für Test-Dateien)
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), Auth + Progress + Unlock + Validation Module
- `pb_hooks/`: join-code.pb.js, user-validation.pb.js (role=student erzwungen), progress-validation.pb.js
- `pb_migrations/`: create_collections.js (role: student|teacher), add_suspicious_field.js
- `apps/hub`: Vite + React 18 + TS + Tailwind + React Router 7
  - Routing: `/` (HomePage), `/login` (LoginPage), `/register` (RegisterPage), `/dashboard/*` (DashboardPage), `*` (NotFoundPage)
  - Vitest konfiguriert: 11 Unit-Tests in `src/pages/*.test.tsx`
  - Test-Dateien aus tsconfig exclude für Production-Build
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- Vitest gesamt: 144 Unit-Tests grün (133 shared + 11 hub)

## Aktuelle Erkenntnisse

- **Vite Dual-React Bug:** Alter Vite-Cache erzeugt zwei React-Chunks (verschiedene Hash-Versionen) → "Invalid hook call" im Browser. Fix: `rm -rf node_modules/.vite` vor neuem Dev-Start.
- **Dev-Port in Sandbox:** Port 3572 ist vom Sandbox-Container belegt → Vite weicht auf 3573 aus. Smoke-Tests laufen auf 3573 (intern erreichbar via Playwright MCP).
- **Lehrer-Account (REQ-022):** Kein Code nötig. PocketBase Admin-UI erstellt Lehrer-Accounts direkt. Hook erzwingt role=student nur bei Selbstregistrierung — greift nicht für Admin-Operationen.
- **tsconfig.json exclude:** Test-Dateien müssen in `exclude` der tsconfig.json stehen, sonst findet `tsc -b` Vitest-Globals nicht.
- **Hub ESLint:** Separate Config-Blöcke für Test-Dateien vs. Prod-Dateien nötig (Vitest-Globals vs. Browser-Globals).
- Nächste P0-REQs: REQ-011 (Landing Page mit Kurs-Kacheln, dep REQ-010 ✓)
