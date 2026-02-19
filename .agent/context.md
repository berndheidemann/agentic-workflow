# Agent Context

> Iteration 13 | 2026-02-19 | REQ-020 abgeschlossen

## Projektstatus

- Fortschritt: 15/44 REQs done (inkl. REQ-020)
- Nächste REQs: REQ-009 (P1, S, keine Deps), REQ-021 (P0, M, dep REQ-020 ✓)
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (test-script beide Workspaces), `tsconfig.json`, `.gitignore`, `.prettierrc`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), Auth + Progress + Unlock + Validation Module
  - `AuthContext` + `AuthContextValue` mit `login`, `register`, `logout`, `pb`
  - `AuthUser` mit `role: 'student' | 'teacher'`
  - `register(username, pin, classCode)` im AuthProvider — löst join_code serverseitig auf
  - `isValidUsername`, `USERNAME_MIN_LENGTH` (3) in validation/username.ts
- `pb_hooks/`: join-code.pb.js, user-validation.pb.js
- `pb_migrations/`: create_collections.js, add_suspicious_field.js
- `apps/hub`: Vite + React 18 + TS + Tailwind + React Router 7
  - `App.tsx`: AuthProvider mit `baseUrl="/"`, Dashboard-Route mit ProtectedRoute gesichert
  - Routing: `/` (HomePage), `/login` (LoginPage), `/register` (RegisterPage), `/dashboard/*` (DashboardPage, teacher-only), `*` (NotFoundPage)
  - `src/components/protected-route.tsx`: ProtectedRoute-Komponente (role-basiert, redirect-fähig)
  - `src/pages/DashboardPage.tsx`: Lehrer-Dashboard mit NavLinks: Klassen, Matrix, Freischaltung
  - Sub-Routes in DashboardPage: klassen, matrix, freischaltung (Placeholder-Inhalte)
  - `src/config/sites.ts`: SiteConfig-Interface + 6 Sites
  - `src/components/course-card.tsx`, `course-grid.tsx`: Kurs-Kacheln
  - `src/pages/LoginPage.tsx`: Vollständiges Login-Formular
  - `src/pages/RegisterPage.tsx`: Vollständiges Registrierungs-Formular (REQ-013)
  - `src/pages/HomePage.tsx`: Landing Page mit CourseGrid
  - `apps/hub/e2e/login.spec.ts`: Playwright E2E-Test-Datei (braucht laufenden Stack)
  - `vitest.config.ts`: e2e/ aus Vitest ausgeschlossen
  - Vitest: 87 Unit-Tests in hub (13 protected-route, 7 dashboard, 26 register, 25 login, 7 sites, 6 course-card, 3 course-grid, 7 home)
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- Vitest gesamt: 228 Unit-Tests grün (141 shared + 87 hub)

## Aktuelle Erkenntnisse

- **npx vitest run vom Root**: Findet AP1-Trainer E2E-Tests und schlägt fehl. Immer `npm run test` (Workspace-Script) verwenden.
- **DashboardPage Tests**: MemoryRouter initialEntries mit relativem Pfad (z.B. `/klassen`), nicht `/dashboard/klassen` — die sub-Routes in DashboardPage sind relativ zum Parent-Route.
- **ProtectedRoute mit Cookie-Auth**: Fake-Cookies werden vom PocketBase SDK beim Laden verworfen (Token-Validierung gegen Server). Smoke-Test kann nur Redirect-Verhalten testen.
- **register() im AuthProvider**: join_code wird als Body-Feld gesendet, Server-Hook löst ihn zu class_id auf.
- **AuthContextValue Breaking Change**: register-Funktion hinzugefügt — alle Test-Mocks brauchen `register: vi.fn()`.
- **PocketBase baseUrl MUSS "/" sein**: Mit "" (leer) baut PocketBase SDK die API-URL relativ zu window.location.pathname.
- **vitest.config.ts exclude für e2e/**: Playwright E2E-Tests in e2e/ müssen aus Vitest ausgeschlossen werden.
- Nächste P0-REQs: REQ-021 (Klassenverwaltung, M, dep REQ-020 ✓)
