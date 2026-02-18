# Learnings

> Append-only. Erkenntnisse die über eine einzelne Iteration hinaus relevant sind.
> Nicht löschen, nicht umschreiben — nur neue Einträge am Ende anfügen.

---

### 2026-02-18: Vision-Abgleich — Opus-Analyse

- **Vision gespeichert** in `vision.md`: Erweiterbare Plattform für beliebig viele Lernsituationen, schrittweises Freischalten (Klasse + Schüler), Tracking, Zukunftsfähigkeit.
- **Gesamtdeckung der REQs:** ~70-75%. Kern gut, strategische Aspekte haben Lücken.
- **Kritischste Lücke:** Keine Site-Registry → Shotgun Surgery bei neuen Sites (nginx, Landing Page, Dashboard, Deploy-Script alle hardcoded). Gelöst durch REQ-009.
- **Schema-Entscheidung:** `course_unlocks.user_id` (nullable) jetzt vorsehen, um spätere Migration zu vermeiden. Individuelles Freischalten kommt UI-seitig später.
- **Didaktische Erkenntnis:** Default-Zustand bei neuer Klasse muss "alles offen" sein (nicht alles gesperrt). Sonst sperren Lehrer reflexartig alles und bremsen motivierte Schüler aus. Eingebaut in REQ-024.
- **DSGVO-Lücke:** Einwilligungsformular für Erziehungsberechtigte ist P0 für den Schulbetrieb mit Minderjährigen. War vorher nicht als REQ formuliert → REQ-074.
- **Manifest-Bedarf:** Dashboard und Fortschrittsbalken brauchen Kursstruktur-Daten (Module, Lektionen, Aufgaben-IDs). Ohne Manifest (REQ-037) kann "total" nicht berechnet werden.
- **Erweiterungs-Backlog:** 9 Zukunfts-Features dokumentiert (Auto-Unlock, Zeitsteuerung, Datenexport, etc.). Architektur verbaut keine Wege.

### 2026-02-18: REQ-000 Tech-Stack Spike

- **npm Workspaces:** `workspace:*`-Protokoll funktioniert nicht mit npm — nur pnpm. Stattdessen `"*"` verwenden für interne Workspace-Deps.
- **tsup + composite:** tsup DTS-Build schlägt fehl wenn `composite: true` im tsconfig. `rootDir`-Constraint kollidiert mit tsup. Lösung: `composite` entfernen.
- **PocketBase SDK Base-URL:** `new PocketBase('/api')` führt zu doppeltem Prefix (`/api/api/health`). Korrekt: `new PocketBase('')` mit Vite-Proxy für `/api`.
- **Docker Desktop Sandbox:** Volumes von `/home/dev/project/` nicht mountbar (Docker Desktop File Sharing nur für `/var`, `/Users`). Lösung: COPY-basiertes Dockerfile statt bind-mount.
- **Sandbox-Netzwerk:** Um von innerhalb des Sandbox-Containers auf Docker-Compose-Services zuzugreifen: `docker network connect <compose-network> <sandbox-container>`. Danach sind Services per Name erreichbar (`http://pocketbase:8090`).
- **Vite working directory:** `npx vite` nutzt CWD — muss mit `--config <path>` und `--root <path>` aufgerufen werden wenn man aus einem anderen Verzeichnis startet.
- **Port 3572:** Einziger Port der vom Host erreichbar ist. Dev-Server muss darauf laufen. Docker-Services können nicht auf 3572 binden (vom Sandbox-Container belegt).
- **Ports 8080 + 8090:** Zusätzlich offen (via `.sandbox-ports`). Können für Docker-Services (z.B. Nginx auf 8080, PocketBase auf 8090) genutzt werden, um sie direkt vom Host aus erreichbar zu machen.

### 2026-02-18: REQ-001 + REQ-004 Projektstruktur + Shared Package

- **ESLint v9 Flat Config:** ESLint v9 nutzt `eslint.config.js` (Flat Config) — Legacy `.eslintrc.*` nicht mehr unterstützt. Scripts mit `eslint src --ext .ts,.tsx` funktionieren noch, aber die Config muss als `eslint.config.js` vorliegen.
- **@eslint/js Versionskonflikt:** `@eslint/js@10.x` erfordert eslint v10 als peer dep. Wenn eslint v9 installiert ist, muss `@eslint/js@^9.0.0` verwendet werden — sonst npm-Auflösungsfehler.
- **Prettier + generierte Dateien:** `vite.config.d.ts` und andere `.d.ts`-Build-Outputs werden von Prettier geprüft wenn `packages/**/*.{ts,tsx}` glob genutzt wird. Fix: `.prettierignore` mit `*.d.ts` Eintrag.
- **S-Batch Strategie:** REQ-001 + REQ-004 waren inhaltlich fast identisch mit dem Spike aus REQ-000 — die Struktur war bereits vorhanden. Die Hauptarbeit war die fehlende ESLint-Konfiguration nachzuliefern.
