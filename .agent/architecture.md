# Architecture Decision Log

> Append-only. Neue Einträge am Ende anfügen, niemals bestehende ändern oder löschen.

---

## ADR-000: Grundarchitektur (2026-02-17, Initialisierung)

**Kontext:** 5 bestehende Lern-Sites sollen unter einer Domain vereint werden.

**Entscheidung:** Dünner Hub + Shared Package + PocketBase. Kein Monorepo-Migration, Sites bleiben eigenständig.

**Begründung:** Minimales Risiko, bestehende Sites funktionieren weiter. PocketBase bietet Auth + API + Realtime in einem Binary.

**Konsequenzen:** Jede Site muss `@lernplattform/shared` als Dependency einbinden. Base-Path-Konfiguration pro Site nötig.

---

## ADR-001: Docker-Stack-Architektur (2026-02-17, REQ-002)

**Kontext:** REQ-002 verlangt ein Docker-Setup für PocketBase + Nginx. Der Stack muss lokal und später in Produktion funktionieren (Traefik ist bereits vorhanden).

**Entscheidung:**

1. Basis-Compose für lokale Entwicklung (Port 80 direkt), Prod-Override kommt in REQ-070.
2. PocketBase Community-Image `ghcr.io/muchobien/pocketbase:latest` — kein eigenes Dockerfile.
3. Named Volume für `pb_data`, Bind-Mounts für `pb_hooks` und `sites`.
4. PocketBase ist nicht direkt exponiert — nur Nginx ist von außen erreichbar.
5. WebSocket-Support in nginx.conf für `/api/` (PocketBase Realtime).
6. Sites-Verzeichnisse werden leer angelegt — Nginx liefert 404 bis Sites deployed werden.

**Begründung:** Minimaler Aufwand, klare Trennung zwischen Daten (Volume) und Code (Bind-Mount), Defense in Depth durch kein direktes PocketBase-Exposure.

**Konsequenzen:** REQ-070 (Production-Setup) muss docker-compose.prod.yml mit Traefik-Labels als Override hinzufügen. `sites/` wird durch REQ-050/051 und Deployment befüllt.

---

## ADR-002: PocketBase Schema-Verwaltung via Migrations (2026-02-17, REQ-003)

**Kontext:** REQ-003 verlangt vier Collections (users, classes, course_unlocks, progress) mit API Rules und einem Composite-UNIQUE-Index. Das Schema muss versioniert und reproduzierbar sein.

**Entscheidung:**

1. JavaScript-Migrations in `pb_migrations/` statt `pb_schema.json` — inkrementell, versionierbar, PocketBase-Standard.
2. Nummerierte Dateinamen (`1_`, `2_`, `3_`, `4_`) statt Timestamps — deterministische Reihenfolge.
3. Reihenfolge: classes → users-Felder → course_unlocks → progress (Relationsabhängigkeiten).
4. UNIQUE-Constraint auf `progress(user_id, course, lesson, exercise)` via SQLite-Index in der `indexes`-Array der Collection-Definition.
5. `deleteRule: null` auf `progress` und `classes` — Records können nicht über die API gelöscht werden (nur Admin).
6. `pin_hash` wird NICHT als separates Feld angelegt. PocketBase Auth-Collections haben ein eingebautes `password`-Feld das bcrypt-Hashing übernimmt. Der 4-stellige PIN wird als Passwort gespeichert. REQ-008 erzwingt das Format "genau 4 Ziffern" via Server-Hook.
7. TypeScript-Typen in `packages/shared/src/types/collections.ts` mit `snake_case`-Properties (1:1 PocketBase-API-Match, kein Mapping-Layer).

**Begründung:** Migrations sind robuster als Snapshots (pb_schema.json) bei inkrementeller Entwicklung. PocketBase trackt angewandte Migrations und führt nur neue aus. Der Unique-Index auf DB-Ebene ist zuverlässiger als Application-Level-Checks allein. snake_case-Types vermeiden einen unnötigen Mapping-Layer zwischen API und Typen.

**Konsequenzen:** Spaetere Schema-Änderungen (z.B. REQ-008: `suspicious`-Flag auf `progress`) werden als neue Migrationsdatei hinzugefügt. docker-compose.yml bindet `./pb_migrations:/pb/pb_migrations:ro` ein.

---

## ADR-003: Auth-Architektur mit CookieAuthStore (2026-02-17, REQ-005)

**Kontext:** REQ-005 verlangt AuthProvider + useAuth Hook. PocketBase SDK speichert Auth-Tokens standardmäßig in localStorage. Die Platform hat 5 Sites unter verschiedenen Subpfaden, alle auf derselben Domain.

**Entscheidung:**

1. Custom `CookieAuthStore` (erweitert `BaseAuthStore`) speichert Token als Cookie mit `path=/` und konfigurierbarer Domain.
2. PocketBase-Client wird nicht als Singleton exportiert, sondern pro AuthProvider-Instanz erstellt (in useRef).
3. `pocketbase` als reguläre Dependency in `@lernplattform/shared`, aber in tsup als `external` markiert.
4. Login-Flow zweistufig: PocketBase-Auth, dann optional classCode-Verifizierung gegen `classes` Collection.
5. Gast-Modus ist Default: isLoggedIn=false, user=null. Kein Redirect, kein Blocking.
6. Vitest-Environment auf `jsdom` umgestellt für Cookie + React-Tests.

**Begründung:** Cookie mit `path=/` ermöglicht Auth-State-Sharing zwischen allen Sites auf gleicher Domain. Kein Singleton vermeidet globalen State und erleichtert Testing.

**Konsequenzen:** Jede App die `AuthProvider` nutzt muss auch `pocketbase` als Dependency installieren. REQ-006 (useProgress) und REQ-007 (useUnlock) bauen auf `useAuth` auf.

---

## ADR-004: Progress-Sync-Architektur (2026-02-17, REQ-006)

**Kontext:** REQ-006 verlangt Progress-Tracking mit debounced Sync. Der Hook muss in allen 5 Sites funktionieren, passiv auf CustomEvents lauschen und nur bei eingeloggten Usern aktiv sein.

**Entscheidung:**

1. `SyncEngine` als reine TypeScript-Klasse ohne React-Abhängigkeit — erleichtert Unit-Testing und ermöglicht spätere Erweiterung (z.B. REQ-034 Offline-Queue).
2. `ProgressProvider` erstellt eigenen PocketBase-Client (analog AuthProvider, kein Singleton). Auth-State wird via CookieAuthStore (`pb_auth`, `path=/`) automatisch geteilt.
3. URL-basierte Kurs/Lektions-Ableitung: Erstes Pfad-Segment ergibt CourseName, Rest ergibt Lesson. Kein expliziter Parameter nötig.
4. Upsert via `getFirstListItem` + create/update: PocketBase hat keinen nativen Upsert. UNIQUE-Index auf `(user_id, course, lesson, exercise)` schützt auf DB-Ebene.
5. Optimistischer lokaler Cache (`Map<CourseName, Progress[]>`): `getProgress` liest aus In-Memory-Cache, nicht direkt aus PocketBase. Beim Mount initial befüllt, bei `reportComplete` optimistisch aktualisiert.
6. 30s Debounce + visibilitychange: Sync wird bei `document.hidden === true` sofort ausgelöst (Tab-Schließ-Schutz). Normaler Sync alle 30s via `setInterval`.

**Begründung:** SyncEngine als reine Klasse ermöglicht zuverlässige Unit-Tests ohne React-Overhead. Cookie-basiertes Auth-State-Sharing ist konsistent mit ADR-003. URL-Ableitung ermöglicht passive Integration in bestehende Sites ohne API-Änderungen.

**Konsequenzen:** Consumer-Sites müssen `<ProgressProvider pocketbaseUrl="..." />` innerhalb von `<AuthProvider>` einbinden. CustomEvent `exercise-complete` muss `{ exerciseId: string, score: number, maxScore: number }` als `detail` liefern. REQ-034 (Offline-Queue) kann SyncEngine um localStorage-Persistenz erweitern.

---

## ADR-005: Unlock-Architektur (2026-02-17, REQ-007)

**Kontext:** REQ-007 verlangt einen useUnlock Hook der `course_unlocks` abfragt. Der Hook muss in allen 5 Sites funktionieren und lehrergesteuertes Freischalten unterstützen.

**Entscheidung:**
1. UnlockProvider + useUnlock folgen dem etablierten Context+Provider+Hook-Pattern (analog Auth, Progress).
2. Eigener PocketBase-Client pro Provider (ADR-003 konsistent). Auth-State wird via CookieAuthStore geteilt.
3. Read-only Cache: Unlock-Daten werden nur gelesen (einmaliger Fetch beim Mount für `user.class_id`). Kein SyncEngine, kein Schreib-Pfad — Mutationen sind Aufgabe des Lehrer-Dashboards (REQ-020).
4. Default-gesperrt: Für Schüler mit `class_id` ist ein Modul nur dann offen, wenn ein `course_unlocks`-Record mit `is_unlocked: true` existiert. Kein Record = gesperrt.
5. Lehrer und Gäste sehen alles: Lehrer (`role="teacher"`) und nicht-eingeloggte Nutzer erhalten immer `isModuleUnlocked = true`.
6. Kein Realtime-Subscription für V1: Cache wird nur beim Mount geladen. PocketBase Realtime kann später optional ergänzt werden.

**Begründung:** Read-only-Muster ist wesentlich einfacher als Progress-Sync (keine Queues, keine Konflikte). Default-gesperrt ist sicherer als Default-offen — Lehrer müssen explizit freischalten.

**Konsequenzen:** REQ-020 (Dashboard-Freischalt-UI) muss direkt über den PB-Client schreiben. REQ-031 (UnlockGate) und REQ-032 (SidebarUnlock) konsumieren useUnlock. Consumer-Sites müssen `<UnlockProvider>` innerhalb von `<AuthProvider>` einbinden.

---

## ADR-006: PocketBase Hook-Architektur (2026-02-17, REQ-008)

**Kontext:** REQ-008 verlangt Server-seitige Validierung für Klassen-Code-Generierung, PIN-Validierung, Progress-Status-Monotonie, Rate-Limiting und Suspicious-Flag.

**Entscheidung:**
1. **Eine Hook-Datei pro Collection** (`classes.pb.js`, `users.pb.js`, `progress.pb.js`) — bessere Übersicht und Wartbarkeit. PocketBase lädt alle `.pb.js` Dateien aus `pb_hooks/`.
2. **CSPRNG für Klassen-Codes:** `$security.randomStringWithAlphabet()` statt `Math.random()` — kryptografisch sicher, in PocketBase JSVM global verfügbar.
3. **Rate-Limiting via SQLite-Query:** Kein externer Cache (kein Redis). `findAllRecords` mit Zeitfenster-Filter zählt direkt in SQLite. Bei wenigen tausend Schülern ausreichend.
4. **Suspicious ist passives Flag, kein Block:** Request wird nicht abgelehnt — nur `suspicious = true` gesetzt. Pädagogischer Ansatz: Markieren statt Blockieren. REQ-040 konsumiert das Flag im Dashboard.
5. **Lehrer-Selbst-Registrierung per Hook geblockt:** PocketBase erlaubt standardmäßig Selbst-Registrierung ohne Rollenbeschränkung. Hook prüft: Wenn `role === "teacher"` und kein Admin-Token → BadRequestError. Verhindert Privilege-Escalation.
6. **PIN-Validierung nur bei Create:** Passwort-Änderung ist kein geplanter Flow. Bei Bedarf: `onRecordUpdate("users")` erweitern.

**Begründung:** Server-seitige Hooks sind die einzige zuverlässige Validierungsebene (Client-Validierung kann umgangen werden). SQLite-basiertes Rate-Limiting ist für die Schülerzahl ausreichend und erfordert keine zusätzliche Infrastruktur.

**Konsequenzen:** REQ-013 (Registrierungs-UI) muss `join_code → class_id` clientseitig auflösen (Hook validiert class_id, nicht join_code direkt). Migration 5 fügt `suspicious` Boolean auf `progress` hinzu.

---

## ADR-007: Kurs-Kacheln als statische Daten + Presentational Components (2026-02-17, REQ-011)

**Kontext:** REQ-011 verlangt 5 Kurs-Kacheln auf der Landing Page. REQ-014 wird später Fortschrittsbalken hinzufügen. Die 5 Sites sind eigenständige Apps, die von Nginx unter eigenen Subpfaden geroutet werden.

**Entscheidung:**
1. Kursdaten als typisiertes `readonly Course[]` in `apps/hub/src/data/courses.ts` — nicht in die Komponente eingebettet.
2. `CourseCard` und `CourseGrid` sind rein präsentational (Props only, kein Context/State).
3. Externe Links via `<a href>` statt React Router `<Link>`, da die Sites von Nginx als separate Applikationen geroutet werden. SPA-Routing würde zu 404 führen.
4. Icons als Emoji-Strings mit `aria-hidden="true"` (dekorativ), keine externe Icon-Library.
5. Mobile-First responsive Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

**Begründung:** Datenseparation ermöglicht REQ-014 (Fortschrittsbalken) als reine Erweiterung der `CourseCard`-Props ohne Refactoring. Presentational Components sind leichter testbar. Externe Links vermeiden SPA-Routing-Konflikte mit Nginx.

**Konsequenzen:** REQ-014 erweitert das `Course`-Interface um optionale Progress-Daten und ergänzt `CourseCard` um einen Fortschrittsbalken. Die bestehende Daten-/Komponenten-Trennung bleibt stabil.

---

## ADR-008: Login-Seite mit Client-Validierung + useAuth-Delegation (2026-02-17, REQ-012)

**Kontext:** REQ-012 verlangt eine Login-Seite mit Klassen-Code + Username + 4-stelliger PIN. Die Auth-Logik ist bereits in `packages/shared` als `AuthProvider` + `useAuth` implementiert.

**Entscheidung:**
1. `LoginPage` ist eine reine UI-Komponente die `useAuth()` aus `@lernplattform/shared` nutzt. Kein eigener PocketBase-Client in der Page.
2. Zweistufige Validierung: Client-seitig (Formularfelder prüfen, sofortiges Feedback), dann Server-seitig (via `useAuth().login()`, PocketBase authentifiziert).
3. `classCode` ist ein optionales Feld. Wenn angegeben, verifiziert `login()` im AuthProvider dass der User zur Klasse gehört (ADR-003).
4. `AuthProvider` wird in `main.tsx` integriert — äusserster Wrapper, innerhalb von StrictMode, außerhalb von BrowserRouter.
5. Redirect nach Login via `useEffect` + `useNavigate`: Wenn `isLoggedIn` auf true wechselt, wird auf "/" navigiert.
6. Cookie-Session-Dauer: PocketBase JWT-Expiry bestimmt die Session-Dauer server-seitig (Standard: 14 Tage). Kein client-seitiges `maxAge` im CookieAuthStore nötig.

**Begründung:** Klare Trennung zwischen UI und Auth-Logik. LoginPage kennt kein PocketBase, nur das useAuth-Interface. Tests können useAuth vollständig mocken.

**Konsequenzen:** App-Tests die Seiten mit `useAuth()` rendern müssen `vi.mock("@lernplattform/shared")` einbinden. Alle künftigen Seiten mit Auth-Zustand folgen diesem Pattern.

---

## ADR-009: Registrierung als Erweiterung von useAuth (2026-02-17, REQ-013)

**Kontext:** REQ-013 verlangt eine Registrierungs-Seite. RegisterPage braucht Zugriff auf PocketBase für User-Erstellung und Auto-Login. ADR-008 definiert dass Pages Auth-Logik an useAuth() delegieren.

**Entscheidung:**
1. `AuthContextValue` wird um `register(params: RegisterParams) => Promise<void>` erweitert.
2. `RegisterParams` enthält `{ joinCode, username, pin }` — alle Pflichtfelder.
3. Die join_code-zu-class_id-Auflösung erfolgt im AuthProvider (nicht in der Page), da der PB-Client dort bereits existiert und login() bereits eine ähnliche join_code-Abfrage macht.
4. Ablauf: join_code → class_id auflösen (mit is_active-Check), User erstellen, Auto-Login via authWithPassword.
5. RegisterPage ist analog zu LoginPage eine reine UI-Komponente die `useAuth()` nutzt.
6. Klassen-Code ist bei Registrierung Pflicht (bei Login optional).

**Begründung:** Konsistente Erweiterung von ADR-008. Kein zweiter PB-Client nötig. Auth-Logik bleibt in AuthProvider zentralisiert. RegisterPage bleibt testbar durch einfaches Mocken von useAuth().

**Konsequenzen:** Bestehende useAuth()-Mocks in Tests müssen um `register: vi.fn()` erweitert werden. Shared-Package exportiert `RegisterParams` als neuen Typ.

---

## ADR-010: CookieAuthStore-Export + Dashboard-Hook-Muster (2026-02-17, REQ-021)

**Kontext:** REQ-021 benötigt direkten PocketBase-Zugriff im Hub (Klassen CRUD). Der AuthProvider exportiert keinen PB-Client. CookieAuthStore war intern in @lernplattform/shared und wurde nicht exportiert.

**Entscheidung:**
1. `CookieAuthStore` wird aus `@lernplattform/shared` exportiert (minimale Änderung).
2. `pocketbase` wird als direkte Dependency in `apps/hub/package.json` hinzugefügt.
3. Dashboard-Hooks (`useClasses` etc.) erstellen eigene PB-Clients mit CookieAuthStore — konsistent mit ADR-003.
4. PocketBase-URL ist fest `/api` (Hub-intern, kein konfigurierbarer Parameter).
5. Dashboard-Unterseiten leben in `apps/hub/src/pages/dashboard/` (Unterordner).
6. DashboardPage bleibt der Auth-Guard und Router-Container.

**Begründung:** CookieAuthStore-Export ist die einzige Möglichkeit, den Cookie-basierten Auth-State ohne Cookie-Parsing-Duplizierung zu nutzen. Unterordner-Struktur verhindert monolithische DashboardPage.tsx.

**Konsequenzen:** Künftige Dashboard-Features (REQ-023a Matrix, REQ-024 Freischaltung) nutzen dasselbe Muster. DashboardPage.test.tsx braucht vi.mock für useClasses/useProgress etc. um transitive PB-Client-Instanziierung zu vermeiden.

---

## ADR-011: Matrix-Ansicht Datenstruktur und Laden (2026-02-17, REQ-023a)

**Kontext:** REQ-023a verlangt eine Schüler × Aufgaben Matrix für eine Klasse + einen Kurs. Progress-Daten liegen in der PB `progress` Collection.

**Entscheidung:**
1. **Neuer Hook `useClassProgress`** folgt dem ADR-010 Muster (eigener PB-Client via CookieAuthStore).
2. **Imperativer Fetch:** Im Gegensatz zu `useClasses` (Auto-Fetch beim Mount) ist `useClassProgress` imperativ: `fetchProgress(classId, courseId)` wird explizit aufgerufen wenn die Selektion feststeht.
3. **Client-seitige Filterung:** Alle Progress-Records für einen Kurs werden geladen und client-seitig auf die Schüler der ausgewählten Klasse gefiltert. Einfacher als komplexe PB-OR-Filter-Queries.
4. **Exercise-Liste dynamisch aus Progress-Daten:** Keine statische Aufgaben-Registry nötig für V1. Nur Aufgaben die mindestens ein Schüler begonnen hat erscheinen als Spalten.
5. **ProgressMatrix ist präsentational:** Reine Props, kein Context. Erleichtert Testing und spätere Wiederverwendung (z.B. REQ-026 Detail-Ansicht, REQ-040 Suspicious-Markierung).
6. **Farbcode-Mapping:** `completed` = grün (bg-green-100), `started` = orange (bg-orange-100), kein Record = grau (bg-gray-100).

**Begründung:** Imperativer Fetch vermeidet unnötiges Laden (5 Kurse × N Klassen). Client-seitige Filterung ist bei der erwarteten Datenmenge (<1000 Records pro Kurs) performant und vermeidet komplexe OR-Filter-Ketten in PocketBase.

**Konsequenzen:** REQ-023b erweitert MatrixPage um Aggregat-Zeile und URL-Parameter-Filter. REQ-026 kann ProgressMatrix um onClick-Handler erweitern. REQ-040 kann ProgressMatrix um ein `suspicious`-Flag pro Zelle erweitern. Bei stark wachsender Datenmenge: dedizierter PB-Hook oder Custom-Endpoint für server-seitige Aggregation.

---

## ADR-012: Filter- und Aggregationslogik als reine Utility-Funktionen (2026-02-17, REQ-023b)

**Kontext:** REQ-023b verlangt Filter (Klasse, Kurs, Modul) und Aggregation (Klassenfortschritt pro Aufgabe) für die Matrix-Ansicht.

**Entscheidung:**
1. Kein neuer Hook — Filterlogik als reine Funktionen in `apps/hub/src/utils/matrix-filter.ts`.
2. URL-Parameter via `useSearchParams` (React Router) für alle drei Filter (`class`, `course`, `module`). Kein eigener URL-Sync-Hook.
3. `ClassProgressData` um `lessonLookup: Map<string, string>` erweitert — minimale Änderung am bestehenden Hook.
4. Aggregat-Zeile als optionale `aggregates`-Prop in `ProgressMatrix` (rückwärtskompatibel, kein Breaking Change).
5. Modul-Filter setzt sich zurück wenn Klasse oder Kurs geändert wird (kaskadierende Abhängigkeit via setSearchParams).

**Begründung:** Reine Funktionen sind trivial testbar ohne React-Overhead. URL-Parameter ermöglichen Bookmarking und Sharing. Die Erweiterung von `ClassProgressData` vermeidet einen zweiten Fetch.

**Konsequenzen:** Spätere Filter-Erweiterungen (z.B. Zeitraum-Filter für REQ-040) können als weitere Utility-Funktionen in `matrix-filter.ts` ergänzt werden. REQ-026 kann ProgressMatrix um onClick-Handler erweitern. REQ-040 kann Aggregat-Zeile um suspicious-Markierung ergänzen.

---

## ADR-013: Statischer Modul-Katalog mit dynamischem Merge (2026-02-17, REQ-024)

**Kontext:** REQ-024 verlangt eine Modul-Freischaltungs-UI. Module sind im bestehenden System dynamisch (lesson-Wert aus Progress-Daten). Für die Freischaltung müssen Module aber vor erstem Progress sichtbar sein.

**Entscheidung:**
1. Statischer Modul-Katalog in `apps/hub/src/data/course-modules.ts` — manuell gepflegt, pro Kurs ein Array von `{ id, title }`.
2. Modul-IDs sind identisch mit `lesson`-Werten aus Progress-Daten (URL-Pfad-Segmente der Lern-Sites).
3. Merge-Strategie: Statische Module + dynamisch aus Progress extrahierte Lessons = Vereinigung via `mergeModules()`. Statische Module haben Vorrang für den `title`.
4. `CourseName` um `"zuul"` erweitert (war bisher ausgelassen, obwohl der Kurs existiert).
5. `useCourseUnlocks` Hook folgt ADR-010 (eigener PB-Client, imperativer Fetch).
6. Optimistisches UI-Update bei Toggle: Lokaler State sofort umgeschaltet, PB-Write parallel, Rollback bei Fehler.
7. "Abgeschlossen"-Status ist kein Toggle, sondern berechneter Wert aus Progress-Daten (completionPercent=100 wenn alle Schüler alle Exercises des Moduls completed haben).

**Begründung:** Statischer Katalog ist einfachste Lösung für eine Liste die sich 1-2x pro Jahr ändert. Merge-Strategie schützt gegen veraltete Kataloge. Optimistisches UI-Update für responsive Bedienung.

**Konsequenzen:** Bei neuen Modulen in den Lern-Sites muss `course-modules.ts` aktualisiert werden. Neue Module erscheinen auch automatisch via dynamischen Merge (aber ohne schönen Titel). REQ-031 (UnlockGate) und REQ-032 (SidebarUnlock) konsumieren dieselben Modul-IDs.

---

## ADR-014: UnlockGate als Wrapper-Komponente im Shared Package (2026-02-17, REQ-031)

**Kontext:** REQ-031 verlangt eine Wrapper-Komponente die Inhalte basierend auf dem Freischalt-Status ein- oder ausblendet. Die Komponente muss in allen 5 Consumer-Sites funktionieren.

**Entscheidung:**
1. UnlockGate ist eine reine React-Wrapper-Komponente in `packages/shared/src/unlock/` — gleiche Ebene wie UnlockProvider/useUnlock.
2. Konsumiert ausschließlich `useUnlock()` — kein eigener State, kein eigener PocketBase-Client.
3. Children-Pattern: Content als `children`, nicht als Render-Prop.
4. Kein CSS-Framework (kein Tailwind im shared package): Default-Styling via Inline-Styles. Consumer-Sites können via `lockedClassName` und `renderLocked` anpassen.
5. Loading-Zustand zeigt Content (optimistisch): Kein Blocking während Daten geladen werden.
6. `renderLocked`-Prop für vollständige Anpassung des Locked-UI hat Vorrang vor `lockedMessage`.

**Begründung:** Wrapper-Komponente im Shared Package vermeidet Code-Duplizierung in 5+ Sites. Children-Pattern ist das idiomatischste React-Muster für bedingte Sichtbarkeit. Inline-Styles für Default vermeiden CSS-Framework-Abhängigkeit.

**Konsequenzen:** REQ-032 (SidebarUnlock) kann auf UnlockGate aufbauen oder direkt `useUnlock()` konsumieren. Consumer-Sites müssen `<UnlockGate>` innerhalb eines `<UnlockProvider>` rendern. tsup baut die Komponente automatisch mit (Entry Point `src/index.ts`).

---

## ADR-015: Island-Provider-Pattern für Shared-Context in Astro-Sites (2026-02-17, REQ-051)

**Kontext:** REQ-051 verlangt die Integration von `@lernplattform/shared` in den AP1-Trainer (Astro/Starlight). Astro Islands sind isolierte React-Bäume — React Context wird nicht zwischen Inseln geteilt. Eine globale Root-Komponente wie in React SPAs existiert nicht.

**Entscheidung:**
1. **Island-Provider-Pattern:** Jede React-Insel, die Shared-Context braucht, wraps sich in einen `SharedProviders`-Wrapper (AuthProvider > ProgressProvider > UnlockProvider). Mehrere Instanzen sind unbedenklich — Auth-State wird via CookieAuthStore (Cookie `pb_auth`, path=/) geteilt.
2. **Headless Provider-Insel:** `SharedProvidersIsland` (client:load) im Starlight `PageFrame`-Override aktiviert `ProgressBridge` auf jeder Seite. Die Bridge adapted AP1-Trainer Event-Format in shared-Format.
3. **Event-Adapter (ProgressBridge):** Übersetzt `{ exerciseId, first: boolean|number, second: number }` in `{ exerciseId, score, maxScore }` für `ProgressProvider.reportComplete()`. Bestehende `ExerciseWrapper`-Logik bleibt unverändert (Koexistenz).
4. **file:-Dependency:** `"@lernplattform/shared": "file:../../packages/shared"` in separaten Site-Repos. Kein npm publish nötig.
5. **Starlight PageFrame-Override:** Beste Stelle für seitenübergreifende headless Islands (wird auf jeder Seite gerendert).

**Begründung:** Astro Islands sind architekturbedingt isolierte React-Bäume. CookieAuthStore ermöglicht Auth-State-Sharing ohne Context. Mehrere Provider-Instanzen sind dank Cookie-basiertem Ansatz (ADR-003) unbedenklich.

**Konsequenzen:** Dieses Pattern ist die Vorlage für alle 5 Astro-Sites (pandas, rest, zuul) und React-SPA-Sites (numpy, uml). React-SPA-Sites können Provider einmalig in der Root-Komponente einbinden (kein Island-Pattern nötig).

---

## ADR-016: Docker Compose Production-Setup mit Traefik-Override (2026-02-17, REQ-070)

**Kontext:** REQ-070 verlangt ein Production-Setup mit Traefik-Labels und Let's Encrypt TLS. Traefik ist bereits auf dem Ziel-Server vorhanden.

**Entscheidung:**
1. Separates `docker-compose.prod.yml` als Override — Basis-File bleibt unverändert.
2. Traefik-Labels nur auf `nginx`-Service (PocketBase bleibt intern, kein direkter Zugriff).
3. Externes Netzwerk `traefik` — muss auf dem Ziel-Server vorhanden sein.
4. HTTP→HTTPS-Redirect via Traefik-Middleware (`redirect-to-https`).
5. Certresolver-Name `letsencrypt` — muss mit Traefik-Konfiguration auf Server übereinstimmen.
6. PocketBase-Logs rotiert via `logging.driver=local, max-size=10m, max-file=3`.
7. Start-Befehl: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

**Begründung:** Override-Pattern trennt Entwicklungs- und Produktionskonfiguration sauber. Kein Risiko, lokale Entwicklung zu brechen. Nginx bleibt einziger externer Endpunkt (ADR-001).

**Konsequenzen:** `scripts/deploy.sh` (REQ-071) muss den Compose-Befehl mit beiden Files verwenden.

---

## ADR-017: DSGVO-Massnahmen und Datenschutzerklärung (2026-02-17, REQ-073)

**Kontext:** REQ-073 verlangt DSGVO-Konformität: Datenschutzerklärung, Datenminimierung, keine IP-Speicherung.

**Entscheidung:**
1. `access_log off` in nginx.conf — keine IP-Speicherung im Webserver.
2. PocketBase-Logs nicht persistiert (kein Volume-Mount für Log-Verzeichnis); Docker-Logs rotiert.
3. Datenschutzerklärung als Route `/datenschutz` in der Hub-App (`PrivacyPage.tsx`).
4. Datenminimierungs-Hinweis im Registrierungsformular vor dem Submit-Button.
5. Kein Klarname-Zwang: Feld heisst "Benutzername" (bereits umgesetzt, bestätigt).
6. Session-Cookie `pb_auth` ist technisch notwendig — kein Cookie-Banner erforderlich (DSGVO Art. 6 Abs. 1 lit. e).

**Begründung:** Minimale Datenerhebung ist bester Datenschutz. Schulplattform unter öffentlichem Interesse. Cookie-Banner entfällt bei rein technischen Cookies.

**Konsequenzen:** Bei späteren Änderungen (Analytics, externe Dienste) muss Datenschutzerklärung aktualisiert und ggf. Cookie-Banner ergänzt werden.

---

## ADR-018: Schüler-Verwaltung via PocketBase manageRule (2026-02-17, REQ-025)

**Kontext:** REQ-025 verlangt PIN-Reset durch Lehrer. PocketBase Auth-Collections erlauben standardmäßig nur dem User selbst, sein Passwort zu ändern.

**Entscheidung:**
1. `manageRule: '@request.auth.role = "teacher"'` auf der users Auth-Collection (Migration 6). PocketBase-nativer Mechanismus — kein Custom-Endpoint nötig.
2. PIN-Validierung (genau 4 Ziffern) wird von `onRecordCreate` auf `onRecordUpdate` erweitert in `users.pb.js`. Prüft ob password im Request-Body vorhanden und ob Ziel-User role="student" hat.
3. `useStudent` Hook folgt ADR-010 (eigener PB-Client via CookieAuthStore, imperativer Fetch). PIN-Reset via `pb.collection("users").update(id, { password, passwordConfirm })`.
4. Schüler-Fortschritt wird in einem einzigen PB-Request für alle Kurse geladen (kein Filter nach Kurs), dann client-seitig nach Kurs und Modul gruppiert.
5. Route `/dashboard/klassen/:classId/schueler/:studentId` — geschachtelt unter Klassen (classId für Breadcrumb/Zurück-Navigation).
6. Globalen Error-Alert nur zeigen wenn kein Student geladen (Ladefehler) — nicht bei Aktion-Fehlern (PIN-Reset), die im Formular angezeigt werden.

**Begründung:** `manageRule` ist PocketBase's offizieller Mechanismus für Benutzer-Verwaltung durch andere Benutzer. Vermeidet Custom-Endpoints und bleibt konsistent mit dem PocketBase-Ökosystem. Ein Request für alle Kurse ist einfacher als 6 parallele Requests.

**Konsequenzen:** Die `manageRule` erlaubt Lehrern grundsätzlich auch andere User-Felder zu ändern. Für REQ-025 ist das akzeptabel. PIN-Validierung server-seitig (Hook) schützt gegen API-Missbrauch.

---

## ADR-019: SidebarUnlock als generisches Status-Widget (2026-02-18, REQ-032)

**Kontext:** REQ-032 verlangt Icons in der Sidebar für gesperrt/freigeschaltet/abgeschlossen. Starlight hat ein eigenes Sidebar-System das nicht direkt mit React-Komponenten erweiterbar ist.

**Entscheidung:**
1. SidebarUnlock ist ein eigenständiges Status-Widget in `packages/shared/src/unlock/` — kein DOM-Enhancement der nativen Starlight-Sidebar-Links.
2. Drei Status-Zustände pro Modul: `"locked"` (useUnlock), `"completed"` (useProgress), `"unlocked"` (default).
3. Konsumiert `useUnlock()` + `useProgress()` — muss innerhalb beider Provider gerendert werden.
4. Inline-Styles für Defaults (ADR-014 konsistent). Consumer-Sites überschreiben via `className`/`renderItem`.
5. Klick auf gesperrte Module zeigt temporären Inline-Hinweis (`role="alert"`).
6. Rendert `null` wenn `isActive === false` (Gäste, Lehrer).
7. `href`-Prop pro Modul ermöglicht Link-Rendering — funktioniert mit Starlight (`<a>`) und React-Router (Consumer nutzt `renderItem` mit `<Link>`).

**Begründung:** DOM-Enhancement der Starlight-Sidebar wäre fragil (CSS-Selektoren, Versionsabhängig). Ein eigenständiges Widget ist robust, testbar und in allen Frameworks nutzbar.

**Konsequenzen:** Consumer-Sites binden `SidebarUnlock` via PageSidebar-Override ein (ADR-015). React-SPAs rendern es als reguläre Komponente. Das bestehende `unlock-status-widget.tsx` in ap1-trainer kann optional auf `SidebarUnlock` umgestellt werden.

---

## ADR-020: Offline-Queue als OfflineQueue-Klasse in SyncEngine (2026-02-18, REQ-034)

**Kontext:** REQ-034 verlangt, dass Progress-Events bei Offline-Status in localStorage gequeued werden. Die bestehende SyncEngine (ADR-004) hält die Queue nur im Memory — bei Seiten-Reload oder Browser-Crash gehen Entries verloren.

**Entscheidung:**
1. Neue `OfflineQueue`-Klasse (`offline-queue.ts`) als reine localStorage-Abstraktionsschicht — kein React, kein PocketBase, rein synchron.
2. SyncEngine bekommt optionales `enableOfflineQueue`-Flag (Default: `true`). Komposition statt Vererbung.
3. localStorage-Key pro User: `lp_offline_queue_${userId}` — verhindert Datenleaks zwischen verschiedenen Usern auf demselben Gerät.
4. Datenformat: `JSON.stringify(Record<string, PendingEntry>)` — Key ist `course||lesson||exercise`, konsistent mit der Memory-Queue.
5. Online-Reconnect via `window.addEventListener("online", ...)` löst sofort `flush()` aus.
6. Graceful Degradation: Alle localStorage-Zugriffe in try/catch. Bei Fehlern (Private Browsing, QuotaExceeded) fällt das System auf Memory-only zurück.
7. Kein Breaking Change an der öffentlichen API: `SyncEngineConfig`, `PendingEntry`, `ProgressProvider`, `ProgressContextValue` bleiben kompatibel.

**Begründung:** Separate Klasse für localStorage ermöglicht isolierte Unit-Tests ohne SyncEngine-Overhead. Das Kompositions-Muster hält die SyncEngine-Klasse übersichtlich. Graceful Degradation stellt sicher, dass kein Browser-Kontext den Progress-Flow bricht. Memory-Queue hat Vorrang (neuerer Stand), localStorage ist Write-Through-Cache.

**Konsequenzen:** Die Memory-Queue in SyncEngine bleibt die primäre Datenquelle während der Laufzeit. OfflineQueue ist ein Write-Through-Cache für Persistenz über Page-Reloads/Crashes hinweg. Consumer-Sites müssen keine Änderungen vornehmen — die Offline-Fähigkeit ist vollständig in `@lernplattform/shared` eingekapselt.

---

## ADR-021: Zuul Checkbox-Progress als React Island (2026-02-18, REQ-052)

**Kontext:** World of Zuul nutzt ein Docusaurus Client Module (`onRouteDidUpdate`) für checkbox-basiertes Progress-Tracking mit localStorage-Key `lf10-weather-progress-v1`. Astro hat keine Client Modules.

**Entscheidung:**
1. `CheckboxProgress` React-Komponente als headless Astro Island (`client:load`) im PageFrame-Override.
2. `useEffect` mit `astro:page-load` Event-Listener statt `onRouteDidUpdate`.
3. localStorage-Key `lf10-weather-progress-v1` beibehalten für Daten-Kompatibilität.
4. Einmalige Migration der pageKey-Prefixe von `/lf05_worldOfZuul/` auf `/zuul/` beim ersten Laden.
5. CSS-Selektor auf `.sl-markdown-content input[type="checkbox"]` angepasst (Starlight-Klasse).
6. Koexistenz mit SharedProviders-Island: beide headless im PageFrame, unabhängig.

**Begründung:** React Island ist der natürliche Astro-Ersatz für Docusaurus Client Modules. `astro:page-load` Event deckt clientseitige Navigation ab (entspricht `onRouteDidUpdate`). localStorage-Key-Beibehaltung schützt bestehende Schülerdaten.

**Konsequenzen:** REQ-053 (Auth-Integration) kann Checkbox-Completions zusätzlich als `exercise-complete` Events dispatchen, damit die ProgressBridge sie an PocketBase weiterleitet.

---

## ADR-022: Zuul-Starlight im Monorepo (kein separates Git-Repo) (2026-02-18, REQ-052)

**Kontext:** AP1-Trainer (`sites/ap1-trainer/`) ist ein separates Git-Repo. Für Zuul-Starlight muss entschieden werden, ob dasselbe Muster gilt.

**Entscheidung:** `sites/zuul-starlight/` wird im Monorepo-Verzeichnis abgelegt, NICHT als separates Git-Repo. Kein Submodul.

**Begründung:** Das Original `sites/zuul/` (Docusaurus) ist ebenfalls im Monorepo. Zuul-Starlight ist eine Migration, keine eigenständige Weiterentwicklung. REQ-053 (Auth-Integration) muss auf die Dateien zugreifen können, was im Monorepo einfacher ist. Der AP1-Trainer-Sonderfall entstand weil er bereits als separates Repo existierte.

**Konsequenzen:** `git add sites/zuul-starlight/` funktioniert direkt im Monorepo. Kein separater Deployment-Workflow nötig.

---

## ADR-023: Zuul Checkbox-to-ProgressProvider Event-Bridge (2026-02-18, REQ-053)

**Kontext:** Zuul hat keine interaktiven Exercises sondern Checkboxen. Der ProgressProvider lauscht auf `exercise-complete` CustomEvents auf `window`. Frage: direkte Dispatch vs. separater Bridge wie AP1-Trainer?

**Entscheidung:**
1. CheckboxProgress dispatcht `exercise-complete` direkt auf `window` (kein separater ProgressBridge).
2. Event-Format: `{ exerciseId: "${pageKey}#${trackId}", score: 1, maxScore: 1 }` — binär (erledigt/nicht erledigt).
3. Events nur beim Ankreuzen (Monotonie-Prinzip), nicht beim Abhaken.
4. `KNOWN_COURSES` in `url-utils.ts` um "zuul" erweitert (Voraussetzung für reportComplete).
5. `SidebarUnlock` aus `@lernplattform/shared` statt eigenem Widget (im Gegensatz zu AP1-Trainer).

**Begründung:** Kein Event-Format-Mismatch — Checkboxen können direkt das shared-Format dispatchen. Separate Bridge wäre unnötige Indirektion. SidebarUnlock ist seit REQ-032 generisch verfügbar.

**Konsequenzen:** Zukünftige Sites mit Checkboxen nutzen dasselbe Pattern. AP1-Trainer behält seinen ProgressBridge wegen abweichendem Event-Format aus ExerciseWrapper.

---

## ADR-024: ProgressBridge-Pattern für bestehende Sites (2026-02-18, REQ-060)

**Kontext:** pandas-lernen und rest-nosql haben eigene Progress-Systeme (localStorage/Zustand), die nicht das `exercise-complete` Event-Format dispatchen. Die bestehenden Exercise-Komponenten sollen nicht geändert werden.

**Entscheidung:**
1. Jede Site bekommt eine eigene `ProgressBridge`-Komponente als headless Island im PageFrame-Override.
2. pandas-Bridge lauscht auf `exercise-progress` Window-Events und übersetzt in `exercise-complete`.
3. rest-Bridge subscribed auf den Zustand progressStore und dispatcht `exercise-complete` bei neuen completedExerciseIds (Set-Diffing).
4. Bestehende Exercise-Komponenten und Progress-Systeme bleiben unberührt — Koexistenz.

**Begründung:** Keine Änderung bestehender Exercise-Komponenten minimiert Regressions-Risiko. Bridge-Pattern ist bewährt (AP1-Trainer). Zwei parallele Progress-Systeme sind akzeptabel, da sie unterschiedliche Zwecke erfüllen (lokales UX vs. zentrales Tracking).

**Konsequenzen:** Zukünftige Sites mit eigenen Progress-Systemen nutzen das Bridge-Pattern. pandas-lernen und rest-nosql sind separate Git-Repos (wie ap1-trainer) — keine Monorepo-Commits für deren Dateien.

---

## ADR-025: React-SPA-Integration mit Direct Provider Wrapping (2026-02-18, REQ-061)

**Kontext:** NumPy und UML sind React SPAs (kein Astro/Starlight). Das Island-Provider-Pattern (ADR-015) ist für Astro-Frameworks. React SPAs haben einen einzigen React-Tree.

**Entscheidung:** Provider-Stack (`AuthProvider` > `ProgressProvider` > `UnlockProvider`) wird direkt in `main.tsx` um den gesamten Komponentenbaum gewickelt. Die ProgressBridge wird als Geschwister-Element der App-Komponente, innerhalb der Provider aber außerhalb des Routers, gerendert. HashRouter bleibt erhalten.

**Begründung:** React SPAs benötigen kein Island-Pattern. Provider wirken global im gesamten React-Tree. Kein PageFrame-Override nötig (keine Astro-Slots). HashRouter erfordert keinen Router basename — Vite `base` ist ausreichend.

**Konsequenzen:** Gilt als Muster für alle zukünftigen React-SPA-Sites. Wenn eine SPA BrowserRouter nutzt, müssen Vite `base` und Router `basename` konsistent gesetzt werden.
