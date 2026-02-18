# Agent Context

> Iteration 3 | 2026-02-18 | REQ-002 abgeschlossen

## Projektstatus

- Fortschritt: 4/44 REQs done (REQ-000, REQ-001, REQ-002, REQ-004)
- Nächste REQs: REQ-003 (PocketBase Schema, P0, M, dep REQ-002), REQ-010 (P0, S, dep REQ-004)
- Blocker: Keine

## Was existiert

- Monorepo mit npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (workspaces), `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config: `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js` (ESLint v9 kompatibel)
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert `getGreeting()`, React 18 peer dep
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase (ghcr.io/muchobien/pocketbase:latest, Port 8090, Health-Check) + Nginx (COPY-basiert)
- `nginx.conf`: Security Headers, Path-Routing (/api/ → PocketBase, /_/ → Admin-UI, /ap1/ → AP1-Site, / → Hub)
- `nginx.Dockerfile`: COPY-basiert (Sandbox-Einschränkung), kopiert sites/hub + sites/ap1
- Vite Dev-Server Proxy: `/api/*` → `http://pocketbase:8090`
- Statische Test-Files: `sites/ap1/index.html` für Subpfad-Routing-Beweis

## Aktuelle Erkenntnisse

- REQ-002 war bereits durch REQ-000 Spike vollständig implementiert — nur Status-Formalisierung nötig
- Docker im Sandbox-Container nicht zugänglich (Permission Denied auf docker.sock) — Docker-Verifikation historisch via REQ-000 Spike belegt (ADR-001)
- REQ-003 (PocketBase Schema) ist jetzt freigeschaltet: Collections users, classes, course_unlocks, progress anlegen
- REQ-003 braucht PocketBase Admin API — Schema-Anlage via PocketBase HTTP API oder pb_hooks (Migrations-Skript)
- ESLint v9 nutzt Flat Config (`eslint.config.js`) — `--ext .ts,.tsx` Flag in eslint-Script ist für v9 obsolet, funktioniert aber noch
- `@eslint/js` muss v9.x sein (nicht v10) wenn eslint v9 installiert ist — Peer-Dep Konflikt sonst
- `workspace:*` ist pnpm-Syntax — npm nutzt `*` für interne Workspace-Deps
- tsup DTS-Build inkompatibel mit `composite: true` — entfernt
- PocketBase SDK: Base-URL muss leer sein (`''`), Vite-Proxy leitet `/api/*` weiter
- Docker Desktop Sandbox: Volumes nicht mountbar → COPY-Dockerfile
