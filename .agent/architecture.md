# Architecture Decision Log

> Append-only. Neue Einträge am Ende anfügen, niemals bestehende ändern oder löschen.

---

### ADR-001: REQ-000 Tech-Stack Spike — Erkenntnisse (2026-02-18)

**Entscheidung:** Vertikaler Durchstich validiert. Tech-Stack funktioniert wie geplant.

**Stack-Versionen:**
- Node.js v22.14.0, npm 10.9.2
- Vite 6.2.0, React 19.0.0, TypeScript 5.7.3, Tailwind CSS 4.0.9
- PocketBase 0.25.3 (Docker: ghcr.io/muchobien/pocketbase:latest)
- Nginx (Docker: nginx:alpine), tsup 8.4.0

**Architektur:**
- npm Workspaces (nicht pnpm) — `workspace:*`-Protokoll nicht verwendet, stattdessen `*` für interne Deps
- `@lernplattform/shared` baut mit tsup (ESM + CJS + DTS), ohne `composite: true` in tsconfig (tsup DTS-Build inkompatibel mit `rootDir`-Constraint)
- Hub App: Vite + React + Tailwind, Build-Output in `apps/hub/dist/`
- PocketBase SDK: `new PocketBase('')` (leere Base-URL) — Vite Proxy leitet `/api/*` an PocketBase weiter

**Docker-Setup (Sandbox-spezifisch):**
- Sandbox-Container (claude-sandbox) läuft selbst in Docker Desktop — Volumes von `/home/dev/project/` nicht mountbar
- Lösung: Nginx mit COPY-basiertem Dockerfile statt Volume-Mount; PocketBase mit named Volume `pb_data`
- Sandbox-Container mit Docker-Compose-Netzwerk verbunden (`docker network connect project_default <container>`)
- Port 3572 am Host belegt durch Sandbox → Nginx ohne Host-Port, PocketBase auf 8090
- Dev-Server (Vite) läuft direkt im Sandbox-Container auf Port 3572, Proxy auf `http://pocketbase:8090`

**Nginx Path-Routing:**
- `/` → Hub (statische Dateien via COPY)
- `/ap1/` → statische Test-Files (später: echte AP1-Site)
- `/api/` → PocketBase (proxy_pass)
- `/_/` → PocketBase Admin UI (proxy_pass)

**Offene Punkte für Nachfolge-REQs:**
- Nginx muss bei jeder Site-Änderung neu gebaut werden (Docker COPY statt Volume)
- Für Produktion: Traefik-Labels ergänzen (REQ-070)
- PocketBase Admin Ersteinrichtung erfolgt manuell nach erstem Start

---

## ADR-002: PocketBase Schema via JavaScript Migrations (2026-02-18, REQ-003)

**Kontext:** PocketBase Schema (Collections, Felder, API Rules) musste definiert und versioniert werden. Alternativen: Admin-UI (manuell, nicht versioniert), HTTP-Admin-API-Calls (umständlich, Auth-Abhängigkeit), JS-Migrations (automatisch beim Start).

**Entscheidung:** Schema wird als PocketBase JS-Migration in `pb_migrations/1708300000_create_collections.js` definiert. PocketBase-Container bekommt ein eigenes `pb.Dockerfile` das die Migrations per COPY ins Image bringt.

**Begründung:** Migrations sind versionierbar (Git), reproduzierbar (kein manuelles Setup), laufen beim Container-Start automatisch, und sind für CI/CD geeignet. COPY statt bind-mount wegen Sandbox-Einschränkung (ADR-001).

**Konsequenzen:**
- `pb.Dockerfile` muss bei jeder neuen Migration neu gebaut werden (docker compose build pocketbase)
- TypeScript-Typen in `@lernplattform/shared/schema` müssen manuell mit Migration-Definitionen synchron gehalten werden — Kommentar-Verweis in beiden Dateien als Mitigation
- Migration-Datei kann nicht ohne laufenden PocketBase getestet werden — strukturelle Validierung via Vitest + String-Analyse als Ersatz unter SANDBOX_MODE=1
- Rollback via DOWN-Funktion implementiert (löscht Collections in Reihenfolge: progress → course_unlocks → users → classes)
