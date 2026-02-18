# Agent Context

> Iteration 2 | 2026-02-18 | REQ-001 + REQ-004 abgeschlossen

## Projektstatus

- Fortschritt: 3/44 REQs done (REQ-000, REQ-001, REQ-004)
- Nächste REQs: REQ-002 (PocketBase Docker, P0, M), REQ-010 (P0, S, dep REQ-004) — REQ-002 hat keine weiteren Deps außer REQ-000
- Blocker: Keine

## Was existiert

- Monorepo mit npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json` (workspaces), `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config: `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js` (ESLint v9 kompatibel)
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert `getGreeting()`, React 18 peer dep
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase (healthy, Port 8090) + Nginx (path-routing, 8080)
- Vite Dev-Server Proxy: `/api/*` → `http://pocketbase:8090`
- Statische Test-Files: `sites/ap1/index.html` für Subpfad-Routing-Beweis
- Sandbox-Container mit project_default Netzwerk verbunden

## Aktuelle Erkenntnisse

- ESLint v9 nutzt Flat Config (`eslint.config.js`) — `--ext .ts,.tsx` Flag in eslint-Script ist für v9 obsolet, funktioniert aber noch
- `@eslint/js` muss v9.x sein (nicht v10) wenn eslint v9 installiert ist — Peer-Dep Konflikt sonst
- `workspace:*` ist pnpm-Syntax — npm nutzt `*` für interne Workspace-Deps
- tsup DTS-Build inkompatibel mit `composite: true` — entfernt
- PocketBase SDK: Base-URL muss leer sein (`''`), Vite-Proxy leitet `/api/*` weiter
- Docker Desktop Sandbox: Volumes nicht mountbar → COPY-Dockerfile
