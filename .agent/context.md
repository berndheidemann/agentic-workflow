# Agent Context

> Iteration 4 | 2026-02-18 | REQ-003 abgeschlossen

## Projektstatus

- Fortschritt: 5/44 REQs done (REQ-000, REQ-001, REQ-002, REQ-003, REQ-004)
- Nächste REQs: REQ-010 (P0, S, dep REQ-004 ✓), REQ-005/006/007/008 (P0, M, dep REQ-003 ✓ + REQ-004 ✓)
- Blocker: Keine

## Was existiert

- Monorepo mit npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (workspaces + test-Script), `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config: `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js` (ESLint v9 kompatibel)
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert `getGreeting()` + Schema-Typen (User, Class, CourseUnlock, Progress)
- `packages/shared/src/schema/`: TypeScript-Typen für alle Collections, Collection-Konstanten (COLLECTION_*)
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase (via pb.Dockerfile mit COPY pb_migrations) + Nginx (COPY-basiert)
- `pb.Dockerfile`: PocketBase-Image + COPY pb_migrations + COPY pb_hooks
- `pb_migrations/1708300000_create_collections.js`: Erstellt users (auth), classes, course_unlocks, progress mit API Rules + Indizes
- `pb_hooks/.gitkeep`: Leeres Verzeichnis für spätere Server-Hooks
- `nginx.conf`: Security Headers, Path-Routing (/api/ → PocketBase, /_/ → Admin-UI, /ap1/ → AP1-Site, / → Hub)
- Vitest: in packages/shared installiert, 27 Unit-Tests grün

## Aktuelle Erkenntnisse

- PocketBase Schema via JS-Migrations (`pb_migrations/`): versionierbar, reproduzierbar, läuft beim Start automatisch
- `pb_migrations/` war fälschlicherweise in .gitignore — wurde entfernt (Migrations gehören ins Repo)
- Schema-Typen in `@lernplattform/shared` als Single Source of Truth für Frontend-Code
- vitest muss per Workspace separat installiert werden — noch nicht in root/hub vorhanden
- Nächste P0-REQs: REQ-010 (AuthProvider Grundstruktur in shared), dann REQ-005/006/007 (Auth-Flow)
- Docker-Verifikation für Migration erst möglich wenn Docker läuft (SANDBOX_MODE=1 in dieser Iteration)
