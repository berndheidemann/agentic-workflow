# Agent Context

> Iteration 5 | 2026-02-18 | REQ-005 abgeschlossen

## Projektstatus

- Fortschritt: 6/44 REQs done (REQ-000, REQ-001, REQ-002, REQ-003, REQ-004, REQ-005)
- Nächste REQs: REQ-006 (P0, M, dep REQ-003 ✓ + REQ-004 ✓), REQ-007, REQ-008, REQ-010
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config (v9): `packages/shared/eslint.config.js` (mit `globals.browser` + React-Global), `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert Schema-Typen + Auth-Modul
- `packages/shared/src/schema/`: TypeScript-Typen (User, Class, CourseUnlock, Progress) + COLLECTION_*-Konstanten
- `packages/shared/src/auth/`: CookieAuthStore, AuthProvider, useAuth, createPocketBaseClient, Typen (AuthUser, AuthState etc.)
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- `pb_migrations/`: PocketBase JS-Migrations mit Schema (users, classes, course_unlocks, progress)
- Vitest: 42 Unit-Tests grün (27 Schema + 7 CookieAuthStore + 8 AuthContext)

## Aktuelle Erkenntnisse

- `pocketbase` ist in packages/shared als peerDependency + devDependency (peerDep: für Consumer; devDep: für Tests direkt)
- `globals` npm-Paket im Root vorhanden — nutzbar in ESLint-Configs (`globals.browser` für `document`, `console` etc.)
- Vitest `@vitest-environment jsdom` per-file-Direktive: Nur Auth-Tests laufen in jsdom, Schema-Tests bleiben in Node
- Mock-Strategie für PocketBase: `vi.mock('pocketbase', ...)` mit class-Extension, `override collection()` ruft `this.authStore.save()` auf
- `@vitejs/plugin-react` im Root — nutzbar in `vitest.config.ts` der Sub-Packages für JSX-Transform
- Auth-State-Updates via `pb.authStore.onChange()` Callback — kein Polling, reaktiv
- Nächste P0-REQs: REQ-006 (useProgress + Sync), REQ-007 (useUnlock), REQ-008 (PocketBase Hooks), REQ-010 (Hub Grundstruktur)
