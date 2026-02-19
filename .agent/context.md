# Agent Context

> Validator 3 | 2026-02-19 | REQ-021 validiert, REQ-023a in_progress korrekt

## Letzter Status

- **Validation 3:** REQ-021 ✅ bestanden (alle Akzeptanzkriterien erfüllt)
- **REQ-023a** (Fortschrittsmatrix) korrekt `in_progress` — Code existiert, Smoke-Test offen
- **Fortschritt:** 16/44 REQs done, 1 in_progress

## Was existiert

- Monorepo npm Workspaces: `packages/shared`, `apps/hub`
- `@lernplattform/shared`: Auth + Progress + Unlock + Validation (141 Tests)
- `apps/hub`: Vite + React + TS + Tailwind + React Router (154 Tests)
  - Routing: `/` (HomePage), `/login`, `/register`, `/dashboard/*` (teacher-only), `*` (404)
  - `DashboardPage`: NavLinks (Klassen, Matrix, Freischaltung)
  - Klassen-Verwaltung: `ClassList`, `ClassDetail`, `CreateClassForm` — vollständig
  - Matrix: `ProgressMatrix`, `useClassProgress` — Code vorhanden, Smoke-Test ausstehend
- Docker Compose: PocketBase (healthy) + Nginx
- E2E: 32 Tests in 6 Specs — alle grün
- 154 Hub-Unit-Tests + 141 Shared-Unit-Tests = 295 gesamt, Build + Lint sauber

## Blocker: Teacher-Account für Smoke-Tests

3 Iterationen haben vergeblich versucht, einen Teacher-Account für Dashboard-Smoke-Tests zu erstellen. Problem:
- `user-validation.pb.js` erzwingt 4-stellige PIN für ALLE User-Creation-Requests (auch Admin-API)
- LoginPage validiert PIN clientseitig als genau 4 Ziffern
- Teacher brauchen Passwörter statt PINs

**Lösung für Sonnet:** Vor REQ-023a-Abschluss den Hook anpassen: Admin/Superuser-Requests von der PIN-Validierung ausnehmen. ODER: Seed-Migration die direkt in die DB schreibt (ohne Hook).

## Nächste REQs (nach Priorität)

1. **REQ-023a** (P0, M, in_progress) — Smoke-Test abschließen, dann done
2. **REQ-031** (P0, M, UnlockGate — dep REQ-007 ✓)
3. **REQ-024** (P0, M, Modul-Freischaltung — deps REQ-007 ✓, REQ-021 ✓)
4. **REQ-050** (P0, S, Site-Integration Nginx — dep REQ-002 ✓)
5. **REQ-073** (P0, S, DSGVO & Security — deps REQ-002, REQ-010 ✓)

## Offene Punkte

- act()-Warnings in Tests — technische Schuld, keine Failures
- Teacher-Auth-Smoke-Test-Blocker muss vor nächstem Dashboard-REQ gelöst werden
