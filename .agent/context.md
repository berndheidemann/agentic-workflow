# Agent Context

> Iteration 12 | 2026-02-19 | REQ-013 abgeschlossen

## Projektstatus

- Fortschritt: 14/44 REQs done (inkl. REQ-013)
- Nächste REQs: REQ-020 (P0, S, dep REQ-010 ✓), REQ-009 (P1, S, keine Deps)
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (test-script beide Workspaces), `tsconfig.json`, `.gitignore`, `.prettierrc`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), Auth + Progress + Unlock + Validation Module
  - `AuthContext` + `AuthContextValue` mit `login`, `register`, `logout`, `pb`
  - `register(username, pin, classCode)` im AuthProvider — löst join_code serverseitig auf
  - `isValidUsername`, `USERNAME_MIN_LENGTH` (3) in validation/username.ts
- `pb_hooks/`: join-code.pb.js, user-validation.pb.js (erweitert: join_code → class_id Resolution)
- `pb_migrations/`: create_collections.js, add_suspicious_field.js
- `apps/hub`: Vite + React 18 + TS + Tailwind + React Router 7
  - `App.tsx`: AuthProvider mit `baseUrl="/"` umschließt BrowserRouter (WICHTIG: "/" nicht "")
  - Routing: `/` (HomePage), `/login` (LoginPage), `/register` (RegisterPage), `/dashboard/*` (DashboardPage), `*` (NotFoundPage)
  - `src/config/sites.ts`: SiteConfig-Interface + 6 Sites
  - `src/components/course-card.tsx`, `course-grid.tsx`: Kurs-Kacheln
  - `src/pages/LoginPage.tsx`: Vollständiges Login-Formular
  - `src/pages/RegisterPage.tsx`: Vollständiges Registrierungs-Formular (REQ-013)
  - `src/pages/HomePage.tsx`: Landing Page mit CourseGrid
  - `apps/hub/e2e/login.spec.ts`: Playwright E2E-Test-Datei (braucht laufenden Stack)
  - `vitest.config.ts`: e2e/ aus Vitest ausgeschlossen
  - Vitest: 74 Unit-Tests in hub (26 register, 25 login, 7 sites, 6 course-card, 3 course-grid, 7 home)
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- Vitest gesamt: 215 Unit-Tests grün (141 shared + 74 hub)

## Aktuelle Erkenntnisse

- **register() im AuthProvider**: join_code wird als Body-Feld gesendet, Server-Hook löst ihn zu class_id auf. Vermeidet unauthentifizierten classes-Collection-Zugriff.
- **AuthContextValue Breaking Change**: register-Funktion hinzugefügt — alle Test-Mocks brauchen `register: vi.fn()`.
- **PocketBase baseUrl MUSS "/" sein**: Mit "" (leer) baut PocketBase SDK die API-URL relativ zu window.location.pathname.
- **vitest.config.ts exclude für e2e/**: Playwright E2E-Tests in e2e/ müssen aus Vitest ausgeschlossen werden.
- **Hub ESLint**: Separate Config-Blöcke für Test- vs. Prod-Dateien.
- Nächste P0-REQs: REQ-020 (Dashboard Grundstruktur, dep REQ-010 ✓)
