# Agent Context

> Iteration 6 | 2026-02-18 | REQ-006 abgeschlossen

## Projektstatus

- Fortschritt: 7/44 REQs done (REQ-000, REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006)
- Nächste REQs: REQ-007 (P0, M, dep REQ-003 ✓ + REQ-004 ✓), REQ-008, REQ-010
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert Schema-Typen + Auth-Modul + Progress-Modul
- `packages/shared/src/schema/`: TypeScript-Typen (User, Class, CourseUnlock, Progress) + COLLECTION_*-Konstanten
- `packages/shared/src/auth/`: CookieAuthStore, AuthProvider, useAuth, createPocketBaseClient, Typen
- `packages/shared/src/progress/`: useProgress Hook, SyncEngine (Queue+Debounce+Visibility), parseUrlToCoursePath, Typen
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- `pb_migrations/`: PocketBase JS-Migrations mit Schema
- Vitest: 79 Unit-Tests grün (27 Schema + 7 CookieAuthStore + 8 AuthContext + 8 URL-Parser + 18 SyncEngine + 11 useProgress)

## Aktuelle Erkenntnisse

- Progress-Modul: 3-Schichten-Architektur (url-parser pure fn → SyncEngine Klasse → useProgress Hook)
- SyncEngine: Try-create-catch-update Upsert-Strategie für PocketBase UNIQUE-Constraint
- Debounce-Timer: 30s nach letztem enqueue(), plus visibilitychange → hidden
- useProgress gibt `GUEST_RETURN` (stabile No-Op-Referenz) für nicht-eingeloggte User zurück
- Test-Isolation: `vi.mock('pocketbase', async importOriginal => ({ ...actual }))` nötig damit BaseAuthStore verfügbar bleibt wenn man den AuthContext direkt mockt
- Nächste P0-REQs: REQ-007 (useUnlock), REQ-008 (PocketBase Hooks), REQ-010 (Hub Grundstruktur)
