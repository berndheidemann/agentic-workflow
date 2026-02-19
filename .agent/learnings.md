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

### 2026-02-18: REQ-003 PocketBase Schema + Migrations

- **pb_migrations/ in .gitignore:** Migrations gehören ins Repo — `.gitignore`-Eintrag für `pb_migrations/` entfernt. Nur `pb_data/` (Laufzeitdaten) bleibt ignoriert.
- **PocketBase Auth-Collection + Relations:** Beim Anlegen einer Relation auf die users-Collection (noch nicht gespeichert) kann `_pb_users_auth_` als Platzhalter-ID genutzt werden. Nach `app.save(users)` muss die Relation-Collection manuell aktualisiert werden (Patch-Pattern).
- **Vitest globals:** `beforeAll` und andere globals müssen entweder importiert werden (`import { beforeAll } from 'vitest'`) oder `globals: true` in vitest.config.ts gesetzt sein — beides geht. Expliziter Import bevorzugt (ESLint: no-undef).
- **`__dirname` in ESM:** In ESM-Modulen (`"type": "module"`) ist `__dirname` nicht verfügbar. Ersatz: `dirname(fileURLToPath(import.meta.url))`.
- **PocketBase Migrations Reihenfolge:** Collections mit Relations müssen nach den Collections angelegt werden, auf die sie verweisen: classes → users → course_unlocks → progress.

### 2026-02-18: REQ-005 AuthProvider + useAuth Hook

- **PocketBase als peerDep + devDep:** `pocketbase` muss in `packages/shared` als `peerDependency` (für Consumer) UND als `devDependency` (für direkte Test-Imports) deklariert werden.
- **`globals.browser` in ESLint:** Das `globals`-npm-Paket ist im Root vorhanden — `import globals from 'globals'` in ESLint flat config ermöglicht `globals.browser` für `document`, `window`, `console` etc.
- **Vitest-Umgebung per Datei:** `// @vitest-environment jsdom` als Kommentar in Test-Dateien setzt jsdom nur für diese Datei — vermeidet globale Umstellung auf jsdom (schema-Tests laufen so weiter in Node, schneller).
- **PocketBase `vi.mock` mit authStore.save:** Um `onChange`-Callbacks in Tests auszulösen, muss das `authWithPassword`-Mock `this.authStore.save(token, record)` aufrufen (nicht nur einen Wert zurückgeben). Klassenmethode als arrow function gibt `this` korrekt via Closure.
- **`@vitejs/plugin-react` im Root:** Kann in `vitest.config.ts` von Sub-Packages genutzt werden (kein erneutes Installieren nötig) — npm Workspace hoisting sorgt dafür.
- **`BaseAuthStore` API:** PocketBase 0.26+: `save(token, record?: AuthRecord)` und `clear()` sind die überschreibbaren Methoden. `onChange(callback, fireImmediately?)` gibt Unsubscribe-Funktion zurück.

### 2026-02-18: REQ-006 useProgress Hook + Sync

- **`vi.mock('pocketbase')` ohne `importOriginal`:** Wenn man pocketbase vollständig überschreibt, fehlt `BaseAuthStore` — und `CookieAuthStore` importiert dieses. Fix: `vi.mock('pocketbase', async (importOriginal) => { const actual = await importOriginal(); return { ...actual }; })` und nur die Methoden des PocketBase-Clients über `AuthContext.Provider` mocken.
- **SyncEngine-Timer-Tests:** `vi.runAllTimersAsync()` feuert alle ausstehenden Timer, inkl. dem 30s-Sync-Timer. Bei "negativ"-Tests (sollte NICHT flush) einen langen syncInterval (60s) nutzen und nur `vi.advanceTimersByTimeAsync(100)` aufrufen.
- **visibilitychange-Tests:** `document.visibilityState` muss via `Object.defineProperty` mit `configurable: true` überschrieben werden — direktes Assignment schlägt fehl.
- **Stabile Guest-Return-Referenz:** `GUEST_RETURN`-Konstante außerhalb der Render-Funktion deklarieren (nicht `useMemo`), damit bei Guest-Mode keine unnötigen Re-Renders entstehen und die Referenz stabil ist.

### 2026-02-19: REQ-007 useUnlock Hook

- **renderHook + Wrapper-Wechsel:** `rerender({ wrapper: newWrapper })` in `@testing-library/react` ändert den Wrapper-Kontext für bereits gemountete Hooks nicht korrekt. Stattdessen: Mutable variable als closure über den Wrapper nutzen (`let authValue = ...; const DynamicWrapper = ({ children }) => <AuthContext.Provider value={authValue}>...`) und `rerender()` ohne Argumente aufrufen.
- **Lazy-Cache mit Version-Counter:** `useRef<Map>` als Cache + `useState<number>` als Version-Counter ist das Pattern für cachebasierte Hooks ohne externe State-Library. Cache-Reads sind synchron, Cache-Writes triggern Re-Renders via `setVersion(v => v + 1)`.
- **Preflight-Befehl:** `npm run test` (workspace-spezifisch) statt `npx vitest run` (pickt sites/-Tests auf). In der Iteration-Root ist `npm run test` der korrekte Befehl.
- **Docker-Netzwerk Sandbox:** `sudo docker network connect project_default claude-sandbox-sonstige_learn-szut-dev` verbindet den Sandbox-Container mit dem Compose-Netzwerk. Muss nach jedem Neustart wiederholt werden wenn die Verbindung fehlt.

### 2026-02-19: REQ-008 PocketBase Hooks & Server-Validierung

- **Opus Security Review:** Role Escalation war kritisch — ohne explizites `e.record.set('role', 'student')` im `onRecordCreateRequest`-Hook können Clients sich als Teacher registrieren. Immer erzwingen.
- **PocketBase JSVM Crypto:** `$security.randomStringWithAlphabet(length, alphabet)` ist die korrekte API für kryptografisch sichere Zufallsstrings (nutzt `crypto/rand`). `Math.random()` ist für Join-Codes unzureichend.
- **Hook-Reihenfolge:** Server-seitige Hooks überschreiben Client-Felder via `e.record.set()` — `suspicious`, `role` etc. können so nicht vom Client manipuliert werden.
- **Parameterisierte Filter:** PocketBase JSVM nutzt `{:param}`-Syntax für sichere Queries — kein String-Concat in findRecordsByFilter nötig/erlaubt.

### 2026-02-19: REQ-010 Hub Grundstruktur + REQ-022 Lehrer-Backend

- **Vite Cache-Stale + Doppeltes React:** Nach npm install mit neuem Package (z.B. react-router-dom) kann Vite beim Neustart zwei React-Instanzen bundeln (alte deps-Cache + neue). Fix: `rm -rf node_modules/.vite` erzwingt saubere Dep-Optimierung. Symptom: "Invalid hook call" mit zwei verschiedenen Chunk-Hashes.
- **tsconfig.json exclude für Tests:** Test-Dateien (`*.test.tsx`) und Setup-Dateien (`test-setup.ts`) müssen in `exclude` der tsconfig.json stehen, sonst schlägt `tsc -b` fehl weil Vitest-Globals (`describe`, `it`, `expect`) unbekannt sind.
- **Hub ESLint für Tests:** Separate ESLint-Config-Blöcke für Test- vs. Prod-Dateien nötig: Test-Block definiert Vitest-Globals, Prod-Block definiert Browser-Globals.
- **Lehrer-Account ohne Code:** PocketBase `onRecordCreateRequest`-Hook erzwingt role=student nur bei HTTP-Requests. Admin-UI-Operationen laufen als superuser und umgehen Hooks — Lehrer-Accounts können sicher per Admin-UI erstellt werden.
- **npm test beide Workspaces:** Root-Skript `npm run test` muss `--workspace=packages/shared --workspace=apps/hub` enthalten wenn beide getestet werden sollen.

### 2026-02-19 — REQ-012 Login-Seite

- **PocketBase SDK baseUrl "" vs "/":** Mit leerem baseUrl (`""`) baut PocketBase `buildURL()` die API-URL relativ zu `window.location.pathname`. Auf `/login` ergibt das `/login/api/...` (falsch). Mit `"/"` wird `window.location.origin + "/" + "api/..."` gebaut — korrekt. AuthProvider in `App.tsx` muss immer `baseUrl="/"` erhalten, nie `""` oder kein Prop (Default wäre `""`).
- **Vitest schließt e2e/ nicht automatisch aus:** Playwright E2E-Tests in `apps/hub/e2e/*.spec.ts` werden von Vitest aufgelöst wenn keine `exclude`-Regel gesetzt ist — `@playwright/test` ist nicht installiert → Fehler. Fix: `exclude: ['e2e/**', 'node_modules/**']` in `vitest.config.ts`.
- **AuthContext für Test-Mocking:** `AuthContext` aus `@lernplattform/shared` exportieren erlaubt direktes `<AuthContext.Provider value={mockCtx}>` in Tests ohne real laufenden AuthProvider (inkl. PocketBase). Sauberere Alternative zu `vi.mock('@lernplattform/shared')`.

### 2026-02-19 — join_code-Auflösung ohne Auth (REQ-013)

Bei der Registrierung muss der Klassen-Code (join_code) in eine class_id aufgelöst werden, aber nicht-eingeloggte Nutzer haben keinen Lese-Zugriff auf die classes-Collection. Lösung: join_code als Extra-Body-Feld an users.create senden; der Server-Hook (user-validation.pb.js) löst ihn serverseitig mit findRecordsByFilter auf und setzt class_id. Das vermeidet API-Rule-Änderungen und hält Validierungslogik serverseitig.

### 2026-02-19 — AuthContextValue Breaking Change durch register()

Wenn register() zu AuthContextValue hinzugefügt wird, müssen ALLE Test-Mocks aktualisiert werden, die makeAuthContext() nutzen (auch LoginPage.test.tsx). TypeScript-Fehler ohne explizites `register: vi.fn()` im Mock-Objekt.

### 2026-02-19 — Vitest Root vs. Workspace

`npx vitest run` vom Monorepo-Root findet alle Test-Dateien inkl. externe AP1-Trainer E2E-Tests und schlägt fehl. Immer `npm run test` (Root-Script mit `--workspace=...`) verwenden. Alternativ aus dem Workspace-Verzeichnis: `npx vitest run`.

### 2026-02-19 — DashboardPage Sub-Route Tests

`DashboardPage` verwendet `<Routes>` intern mit relativen Pfaden (`klassen`, `matrix`, `freischaltung`). In Unit-Tests mit `MemoryRouter` muss `initialEntries` relative Pfade verwenden (z.B. `/klassen`), nicht den vollen Pfad `/dashboard/klassen`.

### 2026-02-19 — ProtectedRoute Smoke-Test Limitation

Fake-Auth-Cookies werden vom PocketBase SDK verworfen (Token wird gegen Server validiert). Ein Smoke-Test kann nur das Redirect-Verhalten testen (nicht-authentifiziert → /login). Das eingeloggte Dashboard kann nur mit echtem PocketBase-Token oder durch Unit-Tests verifiziert werden.

### 2026-02-19 — Validator-Ergebnis: Systematische E2E-Test-Lücke

**Muster erkannt:** Sonnet erstellt E2E-Test-Dateien (`e2e/*.spec.ts`), installiert aber nie Playwright als npm-Paket und führt die Tests nie aus.
**UPDATE (Validation 2):** Vollständig behoben. `@playwright/test` + Chromium installiert, `playwright.config.ts` vorhanden. 24 E2E-Tests in 4 Specs (login, landing, register, dashboard/404) — alle grün. `cd apps/hub && npx playwright test` ausführen. Bei neuen User-Flows entsprechende E2E-Specs ergänzen.

### 2026-02-19 — Validator: PRD-Checkboxen nachpflegen

Sonnet hat bei REQ-012 die PRD-Checkboxen nicht angehakt obwohl status.json auf `done` gesetzt wurde. Jede Iteration muss PRD.md-Checkboxen **und** status.json synchron halten. Validator hat die Checkboxen nachträglich korrigiert.

### 2026-02-19 — Validation 2: Stabile Codebasis, E2E-Lücke besteht weiter

Keine neuen done-REQs seit Validation 1. Alle 15 done-REQs weiterhin korrekt (Preflight + Smoke-Tests bestanden). E2E-Setup nachgeholt: `@playwright/test` + Chromium installiert, `playwright.config.ts` erstellt, 6 Login-E2E-Tests grün. act()-Warnings in mehreren Test-Dateien sind technische Schuld, keine Failures. iter-006 wurde abgebrochen (kein Status-Block) — REQ-021 korrekt als `open` geblieben.
