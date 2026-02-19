# Agent Context

> Iteration 8 | 2026-02-19 | REQ-008 abgeschlossen

## Projektstatus

- Fortschritt: 9/44 REQs done (REQ-000 bis REQ-008)
- Nächste REQs: REQ-010 (P0, S, dep REQ-004 ✓), REQ-022 (P0, S, dep REQ-003 ✓)
- Blocker: Keine

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- Root: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `.prettierignore`
- ESLint flat config (v9): `packages/shared/eslint.config.js`, `apps/hub/eslint.config.js`
- `@lernplattform/shared`: tsup Build (ESM+CJS+DTS), exportiert Schema-Typen + Auth + Progress + Unlock + Validation Module
- `packages/shared/src/validation/`: join-code.ts, pin.ts, progress-rules.ts (je mit Tests)
- `pb_hooks/`: join-code.pb.js (kryptografisch sicher via $security.randomStringWithAlphabet), user-validation.pb.js (PIN + role-Erzwingung), progress-validation.pb.js (Rate-Limit, Status-Aufstieg, suspicious-Flag)
- `pb_migrations/`: create_collections.js + add_suspicious_field.js
- `apps/hub`: Vite + React 18 + TS + Tailwind, zeigt Shared-Import + PocketBase-Status
- Docker Compose: PocketBase + Nginx (COPY-basiert, pb_migrations)
- Vitest: 133 Unit-Tests grün

## Aktuelle Erkenntnisse

- **Security Fix (REQ-008):** Opus Security Review hat 2 Probleme gefunden:
  1. Role Escalation: Ohne `e.record.set('role', 'student')` in user-validation konnte sich jeder als Teacher registrieren → gefixt
  2. Math.random() für Join-Codes: Ersetzt durch `$security.randomStringWithAlphabet()` (kryptografisch sicher in PocketBase JSVM) → gefixt
- `$security.randomStringWithAlphabet(length, alphabet)` ist die korrekte PocketBase JSVM API für kryptografisch sichere Zufallsstrings
- PocketBase API Rules für `progress`: createRule + updateRule erzwingen `user_id = @request.auth.id` → User kann nur eigenen Progress schreiben
- pb_hooks überschreiben Server-seitig `suspicious` und `role` — Client-Input wird ignoriert
- Docker-Netzwerk: `sudo docker network connect project_default claude-sandbox-sonstige_learn-szut-dev` nötig um PocketBase erreichbar zu machen
- `npm run test` (workspace-Filter) ist der korrekte Preflight-Befehl
- Nächste P0-REQs: REQ-010 (Hub Grundstruktur), REQ-022 (Klassen-Verwaltung API)
