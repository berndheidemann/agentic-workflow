# Learnings

> Append-only. Erkenntnisse die über eine einzelne Iteration hinaus relevant sind.
> Nicht löschen, nicht umschreiben — nur neue Einträge am Ende anfügen.

---

### 2026-02-17 — Docker nicht in Entwicklungsumgebung verfügbar

Docker ist in der Agent-Sandbox nicht installiert. `docker compose config` und nginx -t sind nicht ausführbar. Validierung von docker-compose.yml und nginx.conf muss via Python-String-Checks oder YAML-Parsing erfolgen. Finale Tests müssen auf einem System mit Docker stattfinden. Dieses Muster gilt für alle Infrastructure-REQs (REQ-002, REQ-070, REQ-071, REQ-073).

### 2026-02-17 — PocketBase Migrations: pin_hash entfällt

PocketBase Auth-Collections haben ein eingebautes `password`-Feld das bcrypt-Hashing automatisch übernimmt. Ein separates `pin_hash`-Feld wäre redundant. Der 4-stellige PIN wird einfach als Passwort gespeichert. REQ-008 muss via Server-Hook das Format "genau 4 Ziffern" erzwingen.

### 2026-02-17 — PocketBase Relation-Felder brauchen collectionId

Bei Relation-Feldern in Migrations muss die `collectionId` der Ziel-Collection angegeben werden (z.B. via `app.findCollectionByNameOrId("classes").id`). Die interne ID für die eingebaute users Auth-Collection ist `_pb_users_auth_`. Diese kann direkt als String verwendet werden, solange kein custom users-Collection-Name gesetzt ist.

### 2026-02-17 — tsup DTS-Build braucht separate tsconfig

Die Root-tsconfig hat `allowImportingTsExtensions: true` und `noEmit: true`. tsup DTS-Build benötigt jedoch eine tsconfig ohne diese Flags (sonst Fehler: TS6307 "not listed within the file list"). Lösung: `tsconfig.build.json` im Package mit normalem Setup. In `tsup.config.ts` via `tsconfig: "./tsconfig.build.json"` referenzieren.

### 2026-02-17 — package.json exports: types vor import/require

In package.json exports-Konditionsobjekten muss `"types"` VOR `"import"` und `"require"` stehen, sonst Warnung von tsup/Node: "condition 'types' will never be used". Korrekte Reihenfolge: `{ "types": "...", "import": "...", "require": "..." }`.

### 2026-02-17 — PocketBase 0.21: .model statt .record im AuthStore

In PocketBase 0.21 speichert `BaseAuthStore` den authentifizierten User in `.model` (nicht `.record`). `.record` ist undefined. Für Session-Restore: `store.token && store.model` prüfen. `isValid` prüft JWT-Ablauf (nicht nur ob Token vorhanden) — für Tests lieber `.token !== ""` als Indikator nutzen.

### 2026-02-17 — Vitest jsdom Environment

Für Tests die `document.cookie` oder React-Rendering brauchen: `environment: "jsdom"` in vitest.config.ts, `jsdom` als devDependency. React Testing Library `renderHook` + `act` + `waitFor` funktionieren unter jsdom.

### 2026-02-17 — Vitest: vi.runAllTimersAsync() mit setInterval führt zu Endlosschleife

Wenn ein setInterval aktiv ist und `vi.useFakeTimers()` gesetzt ist, führt `vi.runAllTimersAsync()` zu einem Timeout/Endlosschleifenfehler (Vitest bricht nach 10.000 Timer-Iterationen ab). Stattdessen: Für Tests die nur auf Promise-Auflösung warten (async Handler hinter Event-Listener), mehrfach `await Promise.resolve()` aufrufen (3x reicht meist). Nur für direkte Timer-Tests `.advanceTimersByTimeAsync(ms)` oder `clearInterval` vor dem Test-Ende nutzen.

### 2026-02-17 — ProgressProvider: eigener PB-Client via CookieAuthStore

Der ProgressProvider erstellt einen eigenen PocketBase-Client (analog AuthProvider, ADR-003). Da beide den gleichen Cookie-Namen (`pb_auth`) mit `path=/` verwenden, teilen sie denselben Auth-State automatisch. Kein direkter Zugriff auf den PB-Client des AuthProviders nötig. Props `pocketbaseUrl` + `cookieDomain` analog zu AuthProviderProps.

### 2026-02-17 — CookieAuthStore Konstruktor-Signatur

`CookieAuthStore(cookieKey: string, cookieDomain?: string)` — das zweite Argument ist ein einfacher `string`, kein Optionsobjekt. Fehler: `new CookieAuthStore("pb_auth", { path: "/", domain: "..." })` → TS2345. Korrekt: `new CookieAuthStore("pb_auth", cookieDomain)`.

### 2026-02-17 — PocketBase Hooks: Privilege-Escalation-Schutz nötig

PocketBase Auth-Collections erlauben standardmäßig Selbst-Registrierung ohne Rolleneinschränkung. Ohne expliziten Hook-Guard kann sich jeder als "teacher" registrieren. Lösung: In `onRecordCreate("users")` prüfen ob `role === "teacher"` && `!info.admin` → BadRequestError. REQ-013 (Registrierung) muss deshalb join_code → class_id clientseitig auflösen.

### 2026-02-17 — PocketBase JSVM: $security.randomStringWithAlphabet verfügbar

`$security.randomStringWithAlphabet(length, charset)` steht in PocketBase JSVM (goja) zur Verfügung und nutzt einen CSPRNG. Besser als `Math.random()` für sicherheitsrelevante Codes (Klassen-Codes). Kein Import nötig — `$security` ist global verfügbar wie `$app`.

### 2026-02-17 — postcss.config und tailwind.config müssen .js sein (nicht .ts)

Wenn Vite einen PostCSS-Config lädt, versucht es .ts-Konfigurationen via `ts-node` zu parsen. Ist `ts-node` nicht installiert (Standardfall im Monorepo), schlägt `vitest run` mit "Cannot find module 'ts-node'" fehl. Lösung: `postcss.config.js` und `tailwind.config.js` statt `.ts`-Varianten verwenden. Diese sind ES-Module (type: "module" in package.json).

### 2026-02-17 — Vite Build-Script: kein tsc --noEmit nötig

Bei einem Vite+React+TypeScript-Projekt ist ein separater `tsc -p tsconfig.build.json --noEmit`-Aufruf im Build-Script überflüssig. Vite führt die TypeScript-Transformation selbst durch und zeigt TS-Fehler an. Ein `rootDir`-Konflikt entsteht wenn vite.config.ts in `include` aber außerhalb von `rootDir: src` liegt. Einfachste Lösung: Build-Script = `vite build`, tsc-Check separat via `typecheck`-Script falls gewünscht.

### 2026-02-17 — Playwright MCP Browser nicht installiert

In der Entwicklungsumgebung ist der Playwright MCP Browser (Chrome) nicht unter `/opt/google/chrome/chrome` vorhanden. `browser_navigate` schlägt mit "Chromium distribution 'chrome' is not found" fehl. Visuelle Verifikation via Playwright MCP überspringen — kein UI-Problem, kein REQ-Block. Diese Information in context.md festhalten.

### 2026-02-17 — CookieAuthStore: Methodenname-Konflikt mit BaseAuthStore

`BaseAuthStore` (pocketbase 0.21.x) hat eine öffentliche `loadFromCookie(cookie: string, key?: string): void` Methode. Private Methoden mit gleichem Namen aber anderer Signatur in Subklassen verursachen TS2415 im DTS-Build. Lösung: Private Methode in `CookieAuthStore` auf `restoreFromCookie()` umbenannt. Gilt für alle zukünftigen CookieAuthStore-Erweiterungen.

### 2026-02-17 — Dashboard-Komponenten die useClasses nutzen in Tests mocken

Wenn DashboardPage.tsx ClassesPage importiert und ClassesPage wiederum useClasses nutzt, müssen DashboardPage.test.tsx zusätzlich vi.mock("../hooks/use-classes") setzen. Sonst schlägt der Test fehl wegen fehlendem CookieAuthStore-Export im @lernplattform/shared-Mock. Allgemein: Transitive Imports von Hooks die eigene PB-Clients erstellen in Tests immer mocken.

### 2026-02-17 — CourseName: "zuul" fehlte im shared package

`CourseName` in `packages/shared/src/types/collections.ts` hatte kein `"zuul"`, obwohl der Kurs in `apps/hub/src/data/courses.ts` existierte. Dies verursachte TypeScript-Fehler wenn Zuul-Kurs-IDs als CourseName behandelt wurden. Lösung: `"zuul"` in CourseName-Union ergänzt + shared package rebuilt. Bei neuen Kursen: beide Dateien synchron halten.

### 2026-02-17 — Optimistisches UI-Update in Hooks mit Rollback

`useCourseUnlocks.toggleUnlock()` nutzt optimistisches UI-Update: State wird sofort umgeschaltet, PocketBase-Write läuft parallel. Bei Fehler wird der State zurückgesetzt (Rollback via `prev.map(m => ... !unlock ...)`). Das `modules`-Array muss daher in der `toggleUnlock`-Closure als Dependency aufgeführt sein (über `[modules]`).

### 2026-02-17 — @testing-library/jest-dom nicht im shared package

`@testing-library/jest-dom` ist nicht als Dependency in `packages/shared` installiert. `toBeInTheDocument()` und ähnliche Matcher sind nicht verfügbar. Für Tests im shared package stattdessen nutzen: `.toBeTruthy()`, `.toBeNull()`, `.getAttribute()`, `.querySelector()`. Außerdem: `afterEach(cleanup)` aus `@testing-library/react` manuell importieren + aufrufen, wenn `render()` in mehreren Describe-Blöcken ohne vi.clearAllMocks genutzt wird (DOM akkumuliert sich sonst zwischen Tests).

### 2026-02-17 — UnlockGate: keine CSS-Framework-Abhängigkeit im shared package

UnlockGate liegt in `packages/shared` — kein Tailwind CSS verfügbar. Default-Styling via Inline-Styles. Consumer-Sites können über `lockedClassName` (CSS-Klasse) oder `renderLocked` (Custom-Render-Funktion) anpassen. REQ-032 (SidebarUnlock) kann denselben Ansatz nutzen oder direkt useUnlock konsumieren.

### 2026-02-17 — Astro Base-Path: Hardcoded Links in MDX/TSX/E2E müssen manuell ersetzt werden

Wenn der Astro `base`-Pfad geändert wird (z.B. von `/AP1-Trainer` auf `/ap1`), aktualisiert `astro.config.mjs` nur die Framework-generierten Links (Assets, Navigation). Hardcoded absolute Pfade in MDX-Dateien, TSX-Komponenten, E2E-Specs und playwright.config.ts bleiben unverändert und müssen manuell (z.B. via `sed -i`) ersetzt werden. Alle Auftreten prüfen mit: `grep -rn '/ALTERPFAD/' src/ e2e/`.

### 2026-02-17 — sites/ap1-trainer: separates Git-Repo (kein Submodul im Monorepo)

`sites/ap1-trainer/` hat ein eigenes `.git/`-Verzeichnis. Im Lernplattform-Monorepo ist es als Untracked (`??`) gelistet. Änderungen an `sites/ap1-trainer/` müssen im dortigen Repo committet werden — nicht im Monorepo. Das Monorepo-Commit enthält nur `.agent/status.json` und Artefakte. Beim finalen Commit `git add sites/ap1-trainer` NICHT ausführen (würde nested repo als Submodul behandeln).

### 2026-02-17 — Astro Islands: Island-Provider-Pattern für Shared-Context (ADR-015)

In Astro gibt es keine globale Root-Komponente — jede React-Komponente ist eine isolierte Insel. React Context wird nicht zwischen Inseln geteilt. Lösung (REQ-051): `SharedProviders`-Wrapper (AuthProvider > ProgressProvider > UnlockProvider), den jede Insel die Kontext braucht selbst wraps. Auth-State-Sharing läuft über CookieAuthStore (Cookie `pb_auth`, path=/). Eine headless `SharedProvidersIsland` im Starlight `PageFrame`-Override sorgt dafür, dass `exercise-complete`-Events via `ProgressBridge` immer getrackt werden. Dieses Pattern gilt für alle 5 Astro-Sites (REQ-051 bis REQ-060).

### 2026-02-17 — file:-Dependency für lokale Packages in separaten Repos

`"@lernplattform/shared": "file:../../packages/shared"` in `package.json` eines separaten Repos referenziert das shared-Package als lokale Kopie. Vorteile: kein npm publish nötig, TypeScript-Typen werden korrekt aufgelöst. Nachteil: Nach Änderungen am shared-Package muss `npm install` im abhängigen Repo erneut ausgeführt werden (file: kopiert, nicht linked). Für alle Sites (ap1, pandas, rest, numpy, uml, zuul) denselben relativen Pfad verwenden: `file:../../packages/shared`.

### 2026-02-17 — Starlight PageFrame-Override: bester Ort für globale headless Islands

Starlight-Overrides für `PageFrame` werden auf JEDER Seite gerendert (inkl. 404). `PageSidebar` wird nur auf Seiten mit Sidebar gerendert. Für globale client-seitige Funktionalität (Auth, Progress-Tracking) ist `PageFrame` der richtige Override. Registrierung in `astro.config.mjs` unter `starlight({ components: { PageFrame: '...' } })`.

### 2026-02-17 — Vitest Mock Vollständigkeit

Wenn `@lernplattform/shared` in einem Test-File via `vi.mock(...)` gemockt wird, müssen ALLE
Exports die von der getesteten Komponente importiert werden im Mock definiert sein (z.B. useAuth UND
useProgress). Fehlende Exports führen zu "No X export is defined on the mock"-Fehlern zur Laufzeit.
Betroffen: App.test.tsx musste useProgress-Mock ergänzt werden nach Einbindung in LandingPage.

### 2026-02-17 — Fortschrittsbalken: Modul-basiert statt Exercise-basiert

REQ-014 verwendet Modul-basierten Fortschritt (nicht exercise-basiert), da kein statischer
Exercise-Katalog existiert. lesson-Pfade wie "netzwerktechnik/subnetting" → erstes Segment
ist die Modul-ID. Ein Modul gilt als "completed" wenn ≥1 Progress-Record mit status="completed"
für dieses Modul existiert. Formel: completedModules / totalModules * 100 (gerundet).

### 2026-02-17 — Error-State-Trennung in Dashboard-Pages

Bei Pages die sowohl Ladefehler als auch Aktionsfehler (z.B. PIN-Reset) anzeigen müssen:
Globalen Error-Alert (`role="alert"`) nur zeigen wenn kein Daten-Record geladen ist. Aktionsfehler
im zugehörigen Formular anzeigen. Sonst: `getByText(...)` in Tests findet denselben Text zweimal
(duplizierte IDs/Alerts), Tests schlagen fehl. Pattern: `{error && !isLoading && !record && ...}`
für globalen Alert, separater Fehler-Anzeige im Aktions-Formular.

### 2026-02-18 — Astro Checkbox Progress aus Docusaurus Client Module portieren

Docusaurus Client Modules (`onRouteDidUpdate`) werden in Astro durch React Islands mit `astro:page-load` EventListener ersetzt. Der CSS-Selektor muss von `.markdown input[type="checkbox"]` (Docusaurus) auf `.sl-markdown-content input[type="checkbox"]` (Starlight) geändert werden. `client:load` in PageFrame-Override sichert Ausführung auf jeder Seite.

### 2026-02-18 — Docusaurus @site/src/components-Imports in MDX

Beim Migrieren zu Starlight: `import X from '@site/src/components/X'` wird zu `import X from '../../../components/X/index.jsx'` (Tiefe 2 = arbeitsblaetter/infoblaetter). Dateien mit Imports werden zu `.mdx`, Dateien ohne Imports bleiben `.md`. React-Komponenten in MDX brauchen `client:load` Directive in der JSX-Verwendung.

### 2026-02-18 — Docusaurus Link-Komponente in Starlight

Docusaurus `Link` von `@docusaurus/Link` hat keine Starlight-Entsprechung — ersetzen durch einfache `<a>` Tags. Absolute Pfade müssen den Base-Path (`/zuul/`) als Prefix bekommen, da Starlight/Astro keine automatische Base-Prefix-Injection für React-Komponenten macht.

### 2026-02-18 — ProgressBridge-Pattern für bestehende Sites (REQ-060)

Wenn eine Site keine `exercise-complete` Events dispatcht, braucht sie eine ProgressBridge:
- pandas-lernen: Bridge lauscht auf eigene `exercise-progress` Events → übersetzt in `exercise-complete`
- rest-nosql: Bridge subscribed auf Zustand-Store via `useProgressStore.subscribe()` → dispatcht bei neuen completedExerciseIds

### 2026-02-18 — `astro check` in Build-Scripts prüft Test-Dateien

Wenn `package.json` `"build": "astro check && astro build"` enthält, laufen TypeScript-Checks über ALLE .ts/.tsx-Dateien inkl. Tests. Array-Zugriffe `arr[0].prop` müssen zu `arr[0]!.prop` werden wenn TypeScript strict-mode aktiv ist.

### 2026-02-18 — Separate Git-Repos in sites/ — keine gitlink-Einträge

`sites/pandas-lernen/` und `sites/rest-nosql/` haben eigene `.git`-Verzeichnisse (wie ap1-trainer). Beim `git add sites/pandas-lernen` entstehen 160000-Gitlink-Einträge (Submodule). Immer vorher mit `ls sites/X/.git` prüfen und ggf. mit `git rm --cached` zurücksetzen.

### 2026-02-18 — React-SPA-Integration (Direct Provider Wrapping)

React SPAs brauchen kein Island-Pattern (ADR-015) — Provider direkt in main.tsx wrappen. `ProgressProvider` und `UnlockProvider` haben kein `course`-Prop (nur `pocketbaseUrl`, `cookieDomain`). Die Bridge wird als Geschwister der App-Komponente (innerhalb Provider, außerhalb Router) gerendert.

### 2026-02-18 — Vitest + Playwright Konflikt

Wenn `e2e/` im selben Verzeichnis wie Unit-Tests liegt, muss Vitest konfiguriert werden: `test.exclude: ['e2e/**', 'node_modules/**']`. Ohne diese Konfiguration lädt Vitest Playwright spec-Dateien und wirft "Playwright Test did not expect test.describe()".

### 2026-02-18 — UML Progress-Store Struktur

UML-Store nutzt `chapters[diagramType].exercises[exerciseId].completed` (boolean), nicht `completedExerciseIds[]` wie NumPy/REST. UML-Bridge muss über exercises iterieren und `completed === true` prüfen. Außerdem hat UML echte `score`/`maxScore`-Werte (keine pauschalen 1/1).
