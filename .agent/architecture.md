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

---

## ADR-003: CookieAuthStore für PocketBase Auth-Persistenz (2026-02-18, REQ-005)

**Kontext:** PocketBase SDK bietet `BaseAuthStore` (in-memory), `LocalAuthStore` (localStorage) und `AsyncAuthStore`. Für die Lernplattform muss Auth-State einen Page-Reload überleben und Cross-Subdomain funktionieren (`.szut.dev`), damit Sites unter `/ap1/`, `/pandas/` etc. denselben Login nutzen können.

**Entscheidung:** Eigener `CookieAuthStore extends BaseAuthStore` in `packages/shared/src/auth/cookie-auth-store.ts`. Überschreibt `save()` und `clear()`, serialisiert Auth-State als JSON in `document.cookie`. Domain ist über `CookieAuthStoreOptions.domain` konfigurierbar. `AuthProvider` React Context erstellt PocketBase-Client mit diesem Store und exponiert `useAuth()` Hook.

**Begründung:** `LocalAuthStore` (localStorage) funktioniert nicht Cross-Subdomain. `BaseAuthStore` hat eingebaute `loadFromCookie()`/`exportToCookie()` Hilfsmethoden — aber deren Format ist PocketBase-spezifisch. Eigenes JSON-Format ist transparenter und vermeidet Format-Abhängigkeiten.

**Konsequenzen:**
- Cookie ist `httpOnly: false` (JS muss lesen) — kein Sicherheitsproblem, Token lebt ohnehin im JS-Kontext
- `secure: true` in Produktion, `false` im Dev (konfigurierbar über `CookieAuthStoreOptions`)
- `pocketbase` als `peerDependency` in `@lernplattform/shared` — Consumer bringt eigene Version mit
- Auth-State-Updates via `pb.authStore.onChange()` — kein Polling, reaktiv über Callback-Pattern
- 14-Tage Cookie-Laufzeit (entspricht PRD-Anforderung für Session-Dauer)

---

## ADR-004: Progress Sync Architecture (2026-02-18, REQ-006)

**Kontext:** Progress-Tracking muss in allen Sites funktionieren (Astro/Starlight + React SPAs). Sites feuern `exercise-complete` CustomEvents. Sync muss effizient (gesammelt, nicht per Aufgabe) und robust sein.

**Entscheidung:** Dreischichtige Architektur:
- `url-parser.ts` (pure function): Framework-agnostisch, Pathname-Parsing, kein Seiteneffekt
- `SyncEngine` (Klasse): Framework-agnostisch, Queue + 30s-Debounce-Timer + visibilitychange-Listener + PocketBase-Upsert
- `useProgress` (React Hook): React-Integration, nutzt `useAuth()` für Login-Check, instanziiert SyncEngine

**Sync-Strategie:** Try-create-catch-update (optimistisch). Erster Versuch ist `create()`, bei UNIQUE-Constraint-Fehler wird bestehender Record per `getFirstListItem()` + `update()` aktualisiert. Weniger Queries im Happy Path.

**Gast-Modus:** Wenn `!isLoggedIn`, gibt `useProgress()` stabile `GUEST_RETURN`-Referenz zurück. Kein Fehler, kein Tracking, kein Netzwerk-Traffic.

**URL-Konvention:** Erstes Pfad-Segment = course (entspricht Nginx-Subpfad), Rest = lesson, Trailing Slashes entfernt.

**Konsequenzen:**
- `exercise-complete` CustomEvent ist der einzige Integrationspunkt mit bestehenden Sites
- SyncEngine ist unabhängig von React testbar
- Bei Netzwerk-Fehler bleibt Eintrag in Queue und wird beim nächsten Flush erneut versucht

---

## ADR-005: useUnlock Lazy-Cache-Architektur (2026-02-19, REQ-007)

**Kontext:** Der useUnlock Hook muss `course_unlocks` Einträge aus PocketBase abfragen, um zu prüfen welche Module für die Klasse des aktuellen Users freigeschaltet sind. Die Abfrage soll effizient sein (minimale API-Calls) und im Gast-Modus komplett ohne Netzwerk-Traffic funktionieren.

**Entscheidung:** Lazy-Loading pro Course mit lokalem In-Memory-Cache.
- Kein initialer Bulk-Fetch aller Courses. Beim ersten Aufruf von `isModuleUnlocked(course, module)` oder `getUnlockedModules(course)` wird ein Fetch für genau diesen Course getriggert.
- Cache als `Map<string, CourseUnlock[]>` in einem `useRef`. Ein `useState`-Version-Counter triggert Re-Renders.
- Cache-Lifetime: bis zum Unmount oder classId-Wechsel. Kein TTL.
- Gast-Modus und User ohne classId: stabile `GUEST_RETURN`-Konstante, kein API-Call, alles offen.
- Default-Offenheit: Leere Ergebnismenge (keine Unlock-Regeln für Course/Klasse) = alles freigeschaltet.

**Begründung:**
- Lazy statt Eager: Sites nutzen typischerweise nur einen Course. Bulk-Fetch aller 6 Courses wäre Verschwendung.
- In-Memory statt localStorage: Unlock-Status ändert sich potentiell pro Session. Kein Risiko von Stale-Daten.
- Kein SyncEngine/Queue nötig: Unlock-Daten sind read-only aus Sicht des Hooks.

**Konsequenzen:**
- Erster Aufruf pro Course hat eine kurze Latenz. Während des Ladens gibt `isModuleUnlocked` optimistisch `true` zurück.
- Für Realtime-Updates (Lehrer schaltet frei während Schüler arbeitet) müsste PocketBase-Realtime-Subscription ergänzt werden. Aktuell: Page-Reload genügt.
- Cache-Key ist nur der Course-Name. classId ist implizit (aus useAuth). Bei classId-Wechsel wird der gesamte Cache invalidiert.

---

## ADR-006: Site-Konfiguration als TypeScript-Modul (2026-02-19, REQ-011)

**Kontext:** REQ-011 fordert datengetriebene Kurs-Kacheln. REQ-009 (Site-Registry als Single Source of Truth) ist noch OPEN. Eine Zwischenlösung ist nötig, die später nahtlos ersetzt werden kann.

**Entscheidung:** Zentrale TypeScript-Konfigurationsdatei `apps/hub/src/config/sites.ts` mit `SiteConfig`-Interface und statischem Array. Das Interface übernimmt exakt die Felder aus der REQ-009-Spezifikation (`slug`, `name`, `description`, `icon`, `basePath`, `frameworkType`, `isActive`, `sortOrder`).

**Begründung:**
- TypeScript statt JSON: Typensicherheit, Auto-Complete, Build-Time-Validierung. Kein Laufzeit-Fetch nötig.
- Exaktes REQ-009-Interface: Wenn REQ-009 implementiert wird, ändert sich nur die Datenquelle (JSON-Fetch oder PocketBase-Query), nicht das Interface oder die Konsumenten.
- Icons als SVG-Path-Strings (Heroicons MIT): Serialisierbar, keine React-Abhängigkeit im Datenmodell, kompatibel mit JSON/PocketBase-Speicherung.

**Migrationspfad zu REQ-009:**
1. `sites.ts` exportiert aktuell ein statisches Array
2. REQ-009 ersetzt dies durch eine asynchrone Quelle (Fetch aus `sites.json` oder PocketBase)
3. `CourseGrid` und `CourseCard` bleiben unverändert (nehmen `SiteConfig[]` als Props)
4. `HomePage` wechselt von synchronem Import zu `useEffect` + State für das Laden

**Konsequenzen:**
- Änderungen an der Site-Liste erfordern einen Rebuild. Akzeptabel, da Sites sich selten ändern.
- Das `icon`-Feld enthält SVG-Pfaddaten als String — ein einzelner `<path d="...">` genügt für einfache Icons.
- Bei REQ-009 entsteht ein kleiner Refactor in `HomePage` (sync zu async). `CourseGrid` und `CourseCard` bleiben stabil.

---

## ADR-007: AuthProvider baseUrl="/" statt "" (2026-02-19, REQ-012)

**Kontext:** ADR-001 dokumentierte `new PocketBase('')` als korrekte Konfiguration. Bei REQ-012 (Login-Seite) stellte sich heraus, dass PocketBase SDK mit leerem baseUrl die API-URL relativ zu `window.location.pathname` baut. Auf `/login` ergibt das `/login/api/...` — 404.

**Entscheidung:** `AuthProvider` erhält in `App.tsx` explizit `baseUrl="/"`. PocketBase `buildURL()` berechnet dann `window.location.origin + "/" + endpoint` = `/api/...` — korrekt für Vite-Proxy und Nginx.

**Begründung:** PocketBase SDK `buildURL()`: wenn baseUrl mit `http(s)://` beginnt → absolut; mit `/` → `origin + baseUrl`; leer → relativ zu `window.location.pathname`. Mit React Router (Unterrouten) muss `"/"` verwendet werden.

**Konsequenzen:** ADR-001 war unvollständig — `""` nur korrekt wenn App ausschließlich von `/` servt wird. Alle Hub-Integrationen und Site-Integrationen müssen `baseUrl="/"` (oder absolute URL) verwenden.

---

## ADR-008: register()-Funktion im AuthProvider mit serverseitigem join_code-Lookup (2026-02-19, REQ-013)

**Kontext:** Registrierung erfordert Join-Code → class_id Auflösung. Nicht-eingeloggte User haben keinen Lese-Zugriff auf die classes-Collection (listRule: '@request.auth.id != ""').

**Entscheidung:** `register(username, pin, classCode)` im AuthProvider. Sendet join_code als Extra-Body-Feld an users.create. Server-Hook (user-validation.pb.js) löst join_code zu class_id auf via findRecordsByFilter — kein Client-Side-Lookup nötig.

**Begründung:** Kein API-Rule-Änderung (kein Sicherheitsrisiko), Validierungslogik bleibt serverseitig, RegisterPage bleibt reine UI-Komponente.

**Konsequenzen:** AuthContextValue um register erweitert — Breaking Change für Test-Mocks. Alle makeAuthContext() Hilfsfunktionen brauchen `register: vi.fn()`.

---

## ADR-009: AP1-Trainer Shared-Integration via Head Override + Integration Island (2026-02-19, REQ-051)

**Kontext:** Astro/Starlight-Seiten sind keine React SPAs. Es gibt keinen einzigen React-Root der die ganze Seite umschließt. Stattdessen gibt es isolierte "Islands" — unabhängige React-Bäume. `AuthProvider` und `useProgress` benötigen React Context, der nicht global über alle Islands gelegt werden kann.

**Entscheidung:**
- Unsichtbare `SharedIntegration`-React-Island wird via Starlight `Head`-Component-Override in jede Seite eingebunden (`client:load`)
- Diese Island mountet `AuthProvider baseUrl="/"` und `ProgressBridge` (aktiviert `useProgress`)
- Islands die Unlock-Status benötigen (z.B. `LernpfadWidget`) erhalten einen eigenen `AuthProvider` (gleicher Cookie → gleicher Auth-State)
- `exerciseEvents.ts` dispatcht auf `window` (nicht `document`) — `useProgress` lauscht auf `window`

**Begründung:**
- Kein Umbau des bestehenden Island-Systems nötig
- Gast-Modus funktioniert ohne Änderung (Hooks geben sichere Defaults zurück)
- `CookieAuthStore` liest dasselbe Cookie in allen Islands — Auth-State konsistent
- Pattern ist wiederverwendbar für alle Astro/Starlight-Sites (pandas-lernen, REST/NoSQL)

**Konsequenzen:**
- Jede Island mit eigenem `AuthProvider` macht einen eigenen `authRefresh`-Call (akzeptabel bei 2 Islands pro Seite)
- `notifyExerciseComplete` MUSS auf `window` dispatchen (nicht `document`)
- Hydration-Fehler in Komponenten mit `Math.random()` sind pre-existing und kein Blocker
- AP1-Trainer hat ein eigenes `.git`-Repo — Commits dort separat vom Monorepo

---

## ADR-010: Site-Registry als `sites.json` in `public/` (2026-02-19, REQ-009)

**Kontext:** REQ-009 fordert eine Single Source of Truth für alle Lernsituationen. ADR-006 hatte TypeScript-Modul (`sites.ts`) als Zwischenlösung gewählt. REQ-009 löst diese technische Schuld auf.

**Entscheidung:** `apps/hub/public/sites.json` ist die autoritative Registry. Sie wird von Vite als statisches Asset ausgeliefert. `getSites()` (async) fetcht `/sites.json` und konvertiert snake_case → camelCase. `useSites()` React Hook startet mit statischen Fallback-Sites (kein Loading-Flash) und aktualisiert nach Fetch. `sites.ts` behält TypeScript-Typen + Fallback-Array.

**Begründung:**
- JSON in `public/`: kein Build-Step nötig, kann direkt von Nginx / Produktionsdienst serviert werden
- Fallback auf statisches Array: App bleibt funktional ohne Netzwerk (Offline, Test-Env)
- `useSites()` mit initialem Fallback: kein Loading-Spinner auf der Landing Page
- snake_case im JSON: konsistent mit REST-API-Konventionen und PocketBase-Schema

**Skripte aus Registry:**
- `scripts/generate-nginx.sh`: generiert nginx.conf location-Blöcke für alle aktiven Sites
- `scripts/validate-sites.sh`: validiert Site-Slugs gegen Registry (für Deploy-Scripts)

**Migrationspfad:**
- Neue Site = 1 Eintrag in `sites.json` + `generate-nginx.sh` ausführen + Dateien deployen
- Zukünftig: `getSites()` kann auf PocketBase-Collection wechseln — `useSites()` und Konsumenten bleiben stabil

---

## ADR-011: Fortschrittsbalken mit `total_exercises` als Zwischenlösung (2026-02-19, REQ-014)

**Kontext:** REQ-014 fordert Fortschrittsbalken mit "Prozent basierend auf completed/total". REQ-037 (Manifest, liefert echte Gesamtzahl) ist `open`. Ohne "total" ist keine Prozentberechnung möglich.

**Entscheidung:** `total_exercises` als manuell gepflegtes Feld in `sites.json` und `SiteConfig`. Neuer Hook `useCourseProgress` im Hub (nicht im Shared-Package) holt alle Progress-Records des Users in einem Bulk-Query und gruppiert nach Kurs.

**Begründung:**
- Manuell gepflegte Zahl ist akzeptabel (Kursinhalt ändert sich selten)
- Ein Bulk-Query (alle Kurse in einem API-Call) statt 6 Einzel-Queries — Performance
- Hook im Hub statt im Shared-Package: Fortschrittsbalken-Logik ist UI-spezifisch
- `ProgressBar` als eigene Komponente: wiederverwendbar für REQ-015 und andere

**Migrationspfad:** Wenn REQ-037 implementiert wird, ersetzt die Manifest-Zahl das `total_exercises`-Feld. Hook behält seine Signatur (`CourseProgressItem`), nur die Quelle für `totalExercises` ändert sich.

**Konsequenzen:**
- `total_exercises` muss bei Kursinhalt-Änderungen manuell aktualisiert werden
- Wenn `total_exercises = 0`: kein Fortschrittsbalken (Division-by-Zero-Schutz)
- Gast-Modus: kein API-Call, kein Balken — explizit gewollt (AK: "Nach Login")

---

## ADR-012: SidebarUnlock — Prop-basierte Komponente + DOM-Injection für Starlight (2026-02-19, REQ-032)

**Kontext:** REQ-032 fordert drei Status-Icons (gesperrt/freigeschaltet/abgeschlossen) in der Sidebar. Starlight rendert die linke Sidebar als server-seitiges Astro-HTML; direkte JSX-Manipulation ist nicht möglich. Der "abgeschlossen"-Zustand erfordert Progress-Daten, die nicht im Unlock-Modul liegen.

**Entscheidung:**
- `SidebarUnlock` im Shared-Package ist **prop-basiert**: nimmt `status: 'locked' | 'unlocked' | 'completed'` als Prop, rendert Icon + Verhalten. Bestimmt Status nicht selbst.
- Für **Starlight-Sites**: `SidebarUnlockInjector` (React Island) liest `useUnlock()` + lokalen Progress-Store, findet Sidebar-Links via `nav[aria-label] a[href]` und injiziert Icons + Handler per DOM-Manipulation.
- Für **React-Router/SPA-Sites**: `SidebarUnlock` wird direkt als JSX verwendet.
- Starlight-Sidebar-Override via `Sidebar.astro` der Default-Sidebar + `<SidebarUnlockInjector client:load />` rendert.

**Begründung:**
- Prop-basiert: Entkoppelt Unlock-Logik von Progress-Logik. Shared-Package hat keine Abhängigkeit auf site-spezifische Stores.
- DOM-Injection: Vermeidet Copy-Paste von Starlight-Internals. Zukunftssicher bei Starlight-Updates.
- Selektor `nav[aria-label] a[href]` ist semantisch stabil (nicht auf Starlight-CSS-Klassen angewiesen).

**Konsequenzen:**
- Consumer muss `status` selbst bestimmen (leicht erweiterbar, aber mehr Boilerplate beim Aufrufer)
- DOM-Injection ist fragil bei Starlight-HTML-Struktur-Änderungen (Mitigation: semantischer Selektor)
- MutationObserver kann bei Bedarf für ViewTransitions nachgerüstet werden
