# Agent Context

> Iteration 10 | 2026-02-19 | REQ-011 abgeschlossen

## Projektstatus

- Fortschritt: 12/44 REQs done (inkl. REQ-011)
- Nächste REQs: REQ-012 (P0, M, dep REQ-005+REQ-010 ✓), REQ-020 (P0, S, dep REQ-010 ✓)
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
  - `src/config/sites.ts`: SiteConfig-Interface + 6 Sites (slug, name, description, icon, basePath, frameworkType, isActive, sortOrder)
  - `src/components/course-card.tsx`: Einzelne Kurs-Kachel mit SVG-Icon, h2-Titel, Beschreibung, Link
  - `src/components/course-grid.tsx`: Responsive Grid (1→2→3 Spalten), rendert CourseCards
  - `src/pages/HomePage.tsx`: Nutzt getActiveSites() + CourseGrid — vollständig datengetrieben
  - Vitest: 29 Unit-Tests in hub (7 sites, 6 course-card, 3 course-grid, 7 home, 3 login, 3 register)
  - Test-Dateien aus tsconfig exclude für Production-Build
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- Vitest gesamt: 162 Unit-Tests grün (133 shared + 29 hub)

## Aktuelle Erkenntnisse

- **sites.ts → REQ-009 Migration:** SiteConfig-Interface ist identisch mit dem geplanten REQ-009-Format. Migration = nur Datenquelle wechseln (sync Array → async fetch). Komponenten bleiben unverändert.
- **SVG-Icons als d-Path-Strings:** Heroicons MIT, in SiteConfig als `icon: string` gespeichert. Serialisierbar, kompatibel mit zukünftiger JSON/PocketBase-Quelle.
- **Vite Dual-React Bug:** Fix: `rm -rf node_modules/.vite` vor Dev-Start (ADR aus REQ-010 bestätigt).
- **Dev-Port in Sandbox:** Port 3572 direkt nutzbar wenn der Vite-Cache frisch ist.
- **tsconfig.json exclude:** Test-Dateien müssen in `exclude` der tsconfig.json stehen, sonst findet `tsc -b` Vitest-Globals nicht.
- **Hub ESLint:** Separate Config-Blöcke für Test-Dateien vs. Prod-Dateien nötig (Vitest-Globals vs. Browser-Globals).
- Nächste P0-REQs: REQ-012 (Login-Seite, dep REQ-005+REQ-010 ✓), REQ-020 (Registrierungsseite MVP, dep REQ-010 ✓)
