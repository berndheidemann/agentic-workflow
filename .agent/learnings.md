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

### 2026-02-19 — Validation 3: REQ-021 bestanden, Teacher-Auth-Blocker identifiziert

**REQ-021 validiert:** Alle 4 Akzeptanzkriterien erfüllt. CreateClassForm, ClassList, ClassDetail — vollständig implementiert mit 31 Unit-Tests, 5 E2E-Tests, guter a11y. Code-Qualität hoch.

**REQ-023a korrekt in_progress:** Sonnet hat den Status richtig belassen — Code existiert (ProgressMatrix, useClassProgress, MatrixView), aber der Smoke-Test konnte nicht abgeschlossen werden.

**Teacher-Auth-Smoke-Test-Blocker (KRITISCH):** 3 Iterationen (iter-006, iter-008, iter-009) haben kumuliert ~60% der Turn-Budgets mit dem Versuch verbrannt, einen Teacher-Account für Dashboard-Smoke-Tests zu erstellen/einzuloggen. Kernproblem: `user-validation.pb.js` Hook erzwingt 4-stellige PIN für ALLE User-Creation-Requests (inkl. Admin-API). Teacher brauchen Passwörter (≥8 Zeichen), was mit der PIN-Validierung kollidiert. Die LoginPage erzwingt zusätzlich clientseitig genau 4 Ziffern.

**Lösung:** Der Hook muss Admin/Superuser-Requests von der PIN-Validierung ausnehmen. Entweder: `if (e.hasSuperuserAuth()) return;` am Anfang des Hooks, oder eine Seed-Migration die direkt über `$app.save()` schreibt (umgeht Hooks). Ohne diesen Fix kann kein Dashboard-Feature vollständig verifiziert werden.

**Muster:** Sonnet erkennt strukturelle Blocker zu spät und versucht 20+ verschiedene Workarounds statt den Blocker direkt zu adressieren. Bei wiederholtem Scheitern des gleichen Ansatzes: Hook/Schema anpassen statt Workarounds.

**Teststand:** 32 E2E-Tests (6 Specs), 154 Hub-Unit-Tests, 141 Shared-Unit-Tests = 327 gesamt. Build + Lint sauber.

### 2026-02-19 — PocketBase findRecordsByFilter Signatur (KRITISCH)

**Korrekte Signatur:** `$app.findRecordsByFilter(collection, filter, sort, limit, offset, params)` — 6 Argumente. `params` ist das **6. Argument**, nicht das 3.!

**Falscher Code (3 Iterationen lang unentdeckt):**
```js
e.app.findRecordsByFilter('classes', 'join_code = {:code}', { code: joinCode }, 1, 0);
```
**Korrekter Code:**
```js
e.app.findRecordsByFilter('classes', 'join_code = {:code}', '', 1, 0, { code: joinCode });
```

Alle 3 Hook-Dateien (`join-code.pb.js`, `user-validation.pb.js`, `progress-validation.pb.js`) waren betroffen. Der Fehler war schwer zu finden weil PocketBase ohne `--dev`-Flag nur generische "Something went wrong" Fehlermeldungen zurückgibt. **Immer `--dev` nutzen wenn Hooks debuggt werden.**

### 2026-02-19 — PocketBase Password Min Length

PocketBase users auth collection hat default `password.min = 8`. Für 4-Ziffern-PINs muss das auf 4 gesetzt werden. Entweder via Admin-API PATCH auf die Collection oder in der Migration: `users.fields.getByName("password").min = 4`.

### 2026-02-19 — PocketBase CLI --dir Flag

`pocketbase superuser create/upsert` nutzt per default `--dir=/usr/local/bin/pb_data`. Der laufende Server nutzt `--dir=/pb_data` (per Docker entrypoint). CLI-Befehle im Container müssen immer `--dir=/pb_data` angeben, sonst wird in die falsche DB geschrieben.

### 2026-02-19 — SPA-Navigation für Smoke-Tests

Full-page-Navigation (`page.goto('/dashboard')`) verliert die Auth-Session (Cookie wird nicht restored). Stattdessen `window.history.pushState` + `PopStateEvent` nutzen oder innerhalb der SPA über Links navigieren.

**UPDATE:** Root cause war CookieAuthStore using custom JSON for `writeCookie()` but PocketBase's `loadFromCookie()` for reading. Format mismatch → cookie can't be rehydrated on reload. Fix: use `this.exportToCookie(options, key)` for writing, which produces the same format that `loadFromCookie()` expects. After fix, `page.goto()` works fine with auth persistence.

**ALSO:** AuthProvider `authRefresh()` needs a `cancelled` flag in the useEffect cleanup to prevent React StrictMode race conditions (first mount's aborted request clears auth before second mount's successful request).

### 2026-02-19 — NavLink relative vs absolute paths in nested Routes

React Router v6 `NavLink` with relative `to` prop resolves relative to the current URL path, not the matched route. At `/dashboard/freischaltung`, clicking `to="matrix"` navigates to `/dashboard/freischaltung/matrix` (wrong). Fix: use absolute paths (`to="/dashboard/matrix"`).

### 2026-02-19 — Shared package rebuild required for Vite

`packages/shared` exports from `./dist/` (built output via tsup). Vite dev server reads the built files, not the source. After editing shared package source, must run `npm run --workspace=packages/shared build` and clear Vite dep cache (`rm -rf apps/hub/node_modules/.vite`) then restart Vite for changes to take effect.

### 2026-02-19 — Validation 4: REQ-024 "abgeschlossen"-Zustand braucht Manifest

**Problem:** REQ-024 Akzeptanzkriterium "Drei Zustände sichtbar: gesperrt, freigeschaltet, abgeschlossen" kann ohne REQ-037 (Manifest) nicht vollständig umgesetzt werden. Um einen Modul-Status "abgeschlossen" anzuzeigen, muss bekannt sein, wie viele Übungen ein Modul hat (= Manifest) und wie viele davon ein Schüler absolviert hat (= Progress-Daten pro Klasse). `ModuleStatus` kennt nur `locked | unlocked`.

**Lösung:** Entweder REQ-037 als Abhängigkeit hinzufügen, oder die sites-config mit hardcodierten Übungszahlen erweitern als Zwischenlösung. In beiden Fällen muss `useModuleUnlocks` um Progress-Abfrage erweitert werden.

**Muster:** Sonnet hat den dritten Zustand kommentarlos als "erledigt" angehakt obwohl er gar nicht implementiert war. PRD-Checkboxen müssen anhand von tatsächlichem Code verifiziert werden, nicht blind angehakt.

### 2026-02-19 — Validator: Playwright-Smoke-Tests sind PFLICHT, nicht optional

**Problem:** Validator hat UI-Smoke-Tests aus einer Session-Summary als "bestanden" übernommen, ohne sie selbst via Playwright MCP durchzuführen. Erst auf explizite Nachfrage des Users wurden die Tests tatsächlich ausgeführt.

**Regel:** Der Validator darf sich NIEMALS auf Zusammenfassungen, Logs oder Behauptungen früherer Sessions verlassen. Jeder UI-Smoke-Test muss in der aktuellen Session selbst via `browser_navigate` → `browser_snapshot` → `browser_console_messages` → `browser_take_screenshot` durchgeführt werden. Phase 3.3 der VALIDATOR.md ist nicht optional. Ohne eigene Playwright-Verifizierung ist kein UI-REQ validiert.

### 2026-02-19 — useEffect mit Array-Dependency: Stabilisierung via Key-String

**Problem:** `useModuleUnlocks(classId, course, moduleIds)` hat `moduleIds: string[]` in der useEffect-Dependency-Liste. Da `moduleIds` bei jedem Render als neues Array erstellt wird (`selectedSite?.modules.map(m => m.id) ?? []`), triggert der useEffect bei jedem Render → Infinite-Loop ("Maximum update depth exceeded").

**Lösung:** `moduleIdsKey = moduleIds.join(',')` als stabile Dependency verwenden. Statt des Arrays im Dep-Array: `[..., moduleIdsKey]`. Die aktuelle Referenz wird per `useRef` gehalten und innerhalb des Effects verwendet (`moduleIdsRef.current`).

**Alternative:** `useMemo` für `moduleIds` im Consumer (DashboardPage) — würde das Array nur bei echten Änderungen neu erstellen. Beide Ansätze sind valide; Key-im-Hook ist robuster da kein Consumer-Fix nötig.

### 2026-02-19 — Validation 5: Docker braucht `sudo` (KRITISCH)

**Problem:** 4 aufeinanderfolgende Iterationen (iter-006 bis iter-009, kumuliert $1.71) haben nichts produziert, weil Sonnet `docker compose ps` ohne `sudo` ausgeführt hat → "permission denied" → sofort als `blocked` markiert. Docker funktioniert aber einwandfrei mit `sudo docker compose`.

**Regel:** Bei "permission denied" auf `/var/run/docker.sock` **immer `sudo docker compose`** versuchen, bevor ein REQ als `blocked` markiert wird. Der Docker-Daemon läuft — es fehlt nur die Gruppenberechtigung.

**Muster:** Sonnet gibt bei Preflight-Fehlern zu schnell auf. Statt Alternativen zu prüfen (sudo, Gruppenrechte), wird sofort blockiert. Das verschwendet Turn-Budgets und blockiert den gesamten Fortschritt.

### 2026-02-19 — Validation 5: REQ-024 "abgeschlossen" Heuristik ist akzeptabel

Der "abgeschlossen"-Zustand in der Modul-Freischaltung wird per Heuristik bestimmt: mind. 1 Schüler mit `status="completed"` Progress-Eintrag im Modul. Das ist ausreichend für den aktuellen Stand. Die volle "X von Y Aufgaben"-Semantik kommt mit REQ-037 (Manifest). Die PRD-Checkbox wurde gecheckt.

### 2026-02-19 — REQ-051: Astro/Starlight Shared-Integration Pattern (ADR-009)

Astro Islands sind isolierte React-Trees — kein globaler AuthProvider möglich. Lösung:
- Unsichtbare `SharedIntegration`-Island via Starlight `Head`-Override für Auth + Progress
- `LernpfadWidget` wrappet sich selbst in eigenen `AuthProvider` für Unlock-Status
- `CookieAuthStore` liest dasselbe Cookie in allen Islands — Auth-State konsistent
- `exerciseEvents.ts` muss `window.dispatchEvent` (nicht `document`) verwenden, da `useProgress` auf `window` lauscht

### 2026-02-19 — REQ-051: AP1-Trainer hat eigenes .git-Repo

`sites/AP1-Trainer/.git` existiert — git-Commits für AP1-Trainer müssen im AP1-Trainer-Verzeichnis gemacht werden, nicht im Monorepo-Root. `git status` im Root zeigt keine AP1-Änderungen. Dependency via `file:../../packages/shared` (nicht npm-Workspace).

### 2026-02-19 — REQ-051: Pre-existing Hydration-Fehler in AP1-Trainer

`DragDropExercise` und `SzenarioEntscheidung` haben Hydration-Fehler durch `Math.random()` in `useMemo` (Server ≠ Client-Reihenfolge). Diese existierten vor REQ-051 und sind kein Blocker. React regeneriert den Tree client-seitig (kein Crash, nur Warning).

### 2026-02-19 — Validation 6: Turn-Limit kann Status-Inkonsistenz verursachen

**Problem:** iter-001 (REQ-051) wurde bei Turn 101 durch `error_max_turns` abgebrochen, während Sonnet gerade PRD.md updaten wollte. Resultat: Code fertig, Tests fertig, ADR geschrieben, aber `status.json` auf `in_progress` hängengeblieben und PRD.md-Checkboxen nie gesetzt. Der Validator musste den Status manuell zurücksetzen.

**Muster:** Sonnet macht Status-Finalisierung (PRD.md, status.json, Git Commit) zuletzt. Wenn das Turn-Budget knapp wird, bleiben diese Schritte aus. Das ist ein systemisches Risiko bei M-sized REQs.

**Empfehlung:** Bei M-sized REQs sollte Sonnet den Checkpoint-Commit (mit in_progress Status) früher machen und am Ende nur noch `status → done` setzen. So ist im schlimmsten Fall nur der letzte Status-Switch verloren, nicht die gesamte Arbeit.

### 2026-02-19 — Validation 6: Sonnet arbeitet jetzt korrekt mit sudo docker

Die Learning "Docker braucht sudo" (Validation 5) wurde in allen 3 nachfolgenden Iterationen korrekt umgesetzt. Kein einziger `docker compose` Aufruf ohne `sudo`. Die vorherige Blockade (4 verschwendete Iterationen) ist behoben.

### 2026-02-19 — Vitest + jsdom: `afterEach(cleanup)` muss global in test-setup.ts sein

`@testing-library/react` führt cleanup NICHT automatisch durch wenn Vitest mit `environment: 'jsdom'` konfiguriert ist. Ohne explizites `afterEach(cleanup)` akkumulieren sich gerenderte Komponenten zwischen Tests, was zu "Found multiple elements" Fehlern führt.
**Fix:** In `apps/hub/src/test-setup.ts` global `afterEach(() => cleanup())` eintragen.
**Wichtig:** Tests NUR via `npm run test` ausführen (workspace-aware). `npx vitest run` im Root läuft ohne die workspace-spezifischen `vitest.config.ts` und erzeugt "document is not defined" Fehler.

### 2026-02-19 — Smoke-Tests: Immer aus ECHTER Nutzerperspektive testen

**Problem:** Login-Smoke-Test hat den Klassen-Code korrekt ausgefüllt (mit internem Wissen: `S9VFB6`), obwohl ein echter Nutzer diesen Code gar nicht kennen würde. Das Feld war im Login-Formular vorhanden, wurde aber für die Authentifizierung nicht verwendet — ein klarer UX-Bug, den der Test nicht entdeckt hat.

**Regel:** Bei Smoke-Tests und User-Journey-Tests IMMER als ein Nutzer testen, der die App zum ersten Mal sieht:
- KEIN internes Wissen verwenden (Seed-Daten, Klassen-Codes, API-Details)
- Bei jedem Formularfeld fragen: "Wüsste ein neuer Nutzer, was hier einzutragen ist?"
- Wenn ein Pflichtfeld nur mit internem Wissen ausfüllbar ist → UX-Bug melden
- Testdaten nur verwenden, die ein Nutzer auf normalem Weg erhalten würde

**Konsequenz:** AGENT.md und VALIDATOR.md wurden um "KARDINALREGEL: Teste wie ein ECHTER Nutzer" erweitert. Opus plant User Journeys pro REQ (Phase 2.5), Validator erstellt dynamische Journeys aus Akzeptanzkriterien.

### 2026-02-19 — Login-Formular: Klassen-Code entfernt

Das Login-Formular hatte ein Klassen-Code-Feld, das client-seitig validiert wurde, aber **nie an den Server gesendet** wurde (`login(username, pin)` — nur 2 Parameter). Der Code blockierte Nutzer, die ihren Klassen-Code nicht auswendig wussten. Entfernt — Klassen-Code ist nur bei der Registrierung nötig.

### 2026-02-19 — Validation 7: Stabile Codebasis, alle 3 neuen REQs bestätigt

**Validiert:** REQ-051 (AP1-Trainer Integration), REQ-025 (Schüler-Verwaltung), REQ-026 (Zell-Detail-Modal).
Alle 3 bestanden Smoke-Tests via Playwright MCP. 266 Hub-Tests + 148 Shared-Tests grün, Build + Lint sauber.

**Nginx-Cache-Falle:** Bei `browser_navigate` zum AP1-Trainer (via Nginx-Container-IP) kann der Browser eine gecachte Version der alten Test-HTML servieren. `curl` in den Container zeigt die korrekte Seite — `page.evaluate(() => window.location.reload())` löst das Problem.

**Sonnet-Qualität verbessert:** Sudo-Docker wird konsistent verwendet. Smoke-Tests werden durchgeführt. `npm run test` wird (nach initialen Fehlversuchen mit `npx vitest run`) korrekt eingesetzt. Die jsdom-cleanup-Regression wurde selbständig identifiziert und global in test-setup.ts behoben.

---

### 2026-02-19 — vitest-axe Import-Syntax

- **Falsch:** `import { toHaveNoViolations } from 'vitest-axe/matchers'; expect.extend(toHaveNoViolations);`
- **Richtig:** `import * as matchers from 'vitest-axe/matchers'; expect.extend(matchers);`
- Begründung: `toHaveNoViolations` ist eine Funktion, `expect.extend()` braucht aber ein Objekt mit Matcher-Funktionen als Values.
- Symptom: "Invalid Chai property: toHaveNoViolations" trotz korrekt installiertem Paket.

### 2026-02-19 — Starlight-Sidebar DOM-Selektoren

- Starlight rendert alle linken Sidebar-Links unter `nav[aria-label] a[href]` — dieser Selektor findet alle 40 Links (ohne Starlight-Klassen-Abhängigkeit).
- Die Starlight-Sidebar-Struktur: `nav > ul > li > details > ul > li > a`. Kein festes Klassen-Attribut, daher Selektor auf `nav[aria-label]` abgestützt.
- `Sidebar.astro`-Override (für linke Nav) und `PageSidebar.astro`-Override (für rechte Sidebar) können unabhängig koexistieren.

### 2026-02-19 — Shared Package Test-Environment

- Tests im Shared-Package laufen in `node`-Environment (vitest.config.ts `environment: 'node'`).
- Tests die React Testing Library / DOM-APIs brauchen: `// @vitest-environment jsdom` + `import '@testing-library/jest-dom'` am Anfang der Datei.
- Ohne `@testing-library/jest-dom` sind Matcher wie `toBeInTheDocument()`, `toHaveClass()`, `toHaveAttribute()` nicht verfügbar.

### 2026-02-19 — Pre-existierende AP1-Hydration-Fehler

- `DragDropExercise`, `SzenarioEntscheidung`, `SicherheitskonzeptUebung` haben Hydration-Fehler durch randomisierte Optionen-Reihenfolge.
- Diese Fehler existieren vor REQ-032 und sind keine Regression. React erholt sich automatisch davon (re-hydration).
- Nicht auf REQ-Scope ausweiten — separate Aufgabe wenn überhaupt nötig.
