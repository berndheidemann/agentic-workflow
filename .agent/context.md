# Agent Context

> Iteration 7 | 2026-02-19 | REQ-007 abgeschlossen

## Projektstatus

- Fortschritt: 8/44 REQs done (REQ-000 bis REQ-007)
- Nächste REQs: REQ-008 (P0, M, dep REQ-003 ✓), REQ-010 (P0, S, dep REQ-004 ✓)
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert Schema-Typen + Auth-Modul + Progress-Modul + Unlock-Modul
- `packages/shared/src/schema/`: TypeScript-Typen (User, Class, CourseUnlock, Progress) + COLLECTION_*-Konstanten
- `packages/shared/src/auth/`: CookieAuthStore, AuthProvider, useAuth, createPocketBaseClient, Typen
- `packages/shared/src/progress/`: useProgress Hook, SyncEngine (Queue+Debounce+Visibility), parseUrlToCoursePath, Typen
- `packages/shared/src/unlock/`: useUnlock Hook, Typen (UseUnlockReturn, UnlockCache)
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- `pb_migrations/`: PocketBase JS-Migrations mit Schema
- Vitest: 98 Unit-Tests grün (27 Schema + 7 CookieAuthStore + 8 AuthContext + 8 URL-Parser + 18 SyncEngine + 11 useProgress + 19 useUnlock)

## Aktuelle Erkenntnisse

- useUnlock: Lazy-Cache-Architektur (Map<course, CourseUnlock[]> in useRef, Version-Counter für Re-Renders)
- useUnlock: GUEST_RETURN (stabile Referenz) wenn !isLoggedIn — kein API-Call, alles offen
- useUnlock: Default-Offenheit — leere PocketBase-Ergebnismenge = alles freigeschaltet
- Docker-Netzwerk: `sudo docker network connect project_default claude-sandbox-sonstige_learn-szut-dev` nötig um PocketBase erreichbar zu machen
- `sites/`-Verzeichnis hat eigene e2e-Tests — `npm run test` (workspace-Filter) ist der korrekte Preflight-Befehl, nicht `npx vitest run`
- Nächste P0-REQs: REQ-008 (PocketBase Hooks/Server-Validierung), REQ-010 (Hub Grundstruktur)
