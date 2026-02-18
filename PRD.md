# Lernplattform — Product Requirements

> Status-Tracking für den Agent-Loop. Der Agent ändert nur Status-Felder und Checkboxen.

## Implizite Anforderungen (gelten für ALLE UI-Requirements)

Jedes REQ das UI erzeugt oder ändert muss zusätzlich zu seinen expliziten Akzeptanzkriterien folgende Anforderungen erfüllen. Diese werden **nicht** einzeln in den REQs aufgelistet, sind aber Pflicht:

- **a11y:** Semantisches HTML, ARIA-Labels, Keyboard-navigierbar, Fokus-Ring sichtbar, Farbkontrast WCAG AA (siehe CLAUDE.md)
- **Unit-Tests:** Mindestens ein Test pro neuer Funktion/Hook/Komponente (Vitest + React Testing Library). Mocks nur für externe APIs (PocketBase SDK Calls, fetch), **nicht** für eigene Module.
- **Integrations-Tests:** Cross-Cutting-Concerns (Auth/Cookie/Provider-Interaktion) werden mit echten Modulen getestet, nicht vollständig gemockt.
- **E2E-Tests:** Ein Playwright-Test pro User-Flow — **PFLICHT** für jedes UI-REQ, keine Ausnahmen.
- **Smoke-Test:** Verifikation gegen echten Stack (Docker + Playwright MCP). **Ohne bestandenen Smoke-Test kein `done`.** Ausnahme: `SANDBOX_MODE=1` — dann reichen Build + Unit-Tests + Lint.
- **Responsive:** Funktioniert auf Mobile (375px) und Desktop (1280px)
- **Visuelle Verifikation:** Agent prüft via Playwright MCP: Ausrichtung, Abstände, Farben, Lesbarkeit, keine Überlappungen
- **Voraussetzungen:** Docker (PocketBase + Nginx) und Playwright MCP müssen verfügbar sein. Fehlt eines → REQ ist `blocked`, nicht `done`. Ausnahme: `SANDBOX_MODE=1`.

---

## Phase 0: Tech-Stack Spike

### REQ-000: Tech-Stack Spike — Vertikaler Durchstich

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** —
- **Hinweis:** Einmaliger Spike zur Validierung des gesamten Tech-Stacks. Ziel ist ein dünner, funktionierender Durchstich durch alle Schichten — nicht produktionsreif, aber beweist Machbarkeit. Alles was hier entsteht wird in den nachfolgenden REQs verfeinert und erweitert.
- **Akzeptanzkriterien:**
  - [x] **Monorepo:** Root `package.json` mit npm Workspaces (`packages/shared`, `apps/hub`), TypeScript-Config
  - [x] **Shared Package:** `@lernplattform/shared` baut mit tsup, exportiert eine Dummy-Funktion, ist aus `apps/hub` importierbar
  - [x] **Hub App:** Vite + React + TypeScript + Tailwind, Dev-Server startet, zeigt "Hello Lernplattform" mit importierter Shared-Funktion
  - [x] **PocketBase:** Docker Compose mit PocketBase-Service, startet, `/api/health` antwortet mit 200
  - [x] **Nginx:** Docker Compose mit Nginx-Service, Path-Routing: `/api/*` → PocketBase, `/` → statische Dateien (oder Proxy auf Hub Dev-Server)
  - [x] **PocketBase SDK:** Hub kann PocketBase SDK importieren und Health-Endpoint erreichen (Proof of Connectivity)
  - [x] **Sites-Proxy:** Nginx routet `/ap1/` auf ein statisches Test-File (beweist Subpfad-Routing)
  - [x] **Build:** `npm run build` im Hub erfolgreich, Output in `dist/`
  - [x] **Dev-Workflow:** `npm run dev` startet Hub Dev-Server auf Port 5173, Docker Stack parallel nutzbar
  - [x] **Ergebnis dokumentiert:** Kurzer Abschnitt in `.agent/architecture.md` mit Erkenntnissen (was funktioniert, was angepasst werden musste, Versionen)

---

## Phase 1: Infrastruktur & Shared Package

### REQ-001: Projektstruktur initialisieren

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-000
- **Akzeptanzkriterien:**
  - [x] Monorepo-Struktur mit `packages/shared/` und `apps/hub/`
  - [x] Root `package.json` mit Workspaces
  - [x] TypeScript-Konfiguration (tsconfig.json)
  - [x] `.gitignore` korrekt konfiguriert

### REQ-002: PocketBase Docker-Setup

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-000
- **Akzeptanzkriterien:**
  - [x] `docker-compose.yml` mit PocketBase + Nginx Services
  - [x] `nginx.conf` mit Path-Routing für alle Sites + API
  - [x] PocketBase startet und ist unter `/api/` erreichbar
  - [x] Admin-UI unter `/_/` erreichbar
  - [x] Health-Check konfiguriert

### REQ-003: PocketBase Schema anlegen

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [ ] Collection `users` (Auth): username, role, class_id, display_name (pin_hash entfällt — PocketBase password-Feld übernimmt Hashing)
  - [ ] Collection `classes`: name, join_code, school_year, is_active, created_by
  - [ ] Collection `course_unlocks`: class_id, user_id (nullable, für späteres individuelles Freischalten), course, module, is_unlocked, unlocked_by, unlocked_at
  - [ ] Collection `progress`: user_id, course, lesson, exercise, status, score, max_score, attempts, completed_at
  - [ ] UNIQUE-Constraint auf progress (user_id, course, lesson, exercise)
  - [ ] API Rules korrekt gesetzt (siehe REQUIREMENTS.md Abschnitt 4)

### REQ-004: Shared Package Grundstruktur

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-000
- **Akzeptanzkriterien:**
  - [x] `packages/shared/package.json` mit korrektem Namen `@lernplattform/shared`
  - [x] TypeScript + React als Peer-Dependencies
  - [x] Build-Konfiguration (tsup)
  - [x] `src/index.ts` mit Exports
  - [x] Package ist von `apps/hub` importierbar

### REQ-005: AuthProvider + useAuth Hook

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [ ] `AuthProvider` React Context mit PocketBase SDK
  - [ ] `useAuth` Hook: isLoggedIn, user, login(username, pin, classCode), logout
  - [ ] Auth-State wird aus PocketBase Cookie gelesen
  - [ ] Login setzt Cookie auf Domain (konfigurierbar)
  - [ ] Logout löscht Cookie und Auth-State
  - [ ] TypeScript-Typen für User exportiert

### REQ-006: useProgress Hook + Sync

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [ ] `useProgress` Hook: reportComplete(exerciseId, score, maxScore), getProgress(course)
  - [ ] Debounced Sync: gesammelt alle 30s oder bei Page-Visibility-Change
  - [ ] Lauscht auf `exercise-complete` CustomEvent
  - [ ] Kurs und Lektion werden aus URL abgeleitet
  - [ ] Nur aktiv wenn User eingeloggt (Gast-Modus: kein Tracking)

### REQ-007: useUnlock Hook

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [ ] `useUnlock` Hook: isModuleUnlocked(course, module), getUnlockedModules(course)
  - [ ] Fragt `course_unlocks` Collection ab für aktuelle Klasse
  - [ ] Ohne Login: alles offen (Gast-Modus)
  - [ ] Cacht Unlock-Status lokal (minimale API-Calls)

### REQ-008: PocketBase Hooks & Server-Validierung

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003
- **Akzeptanzkriterien:**
  - [ ] Klassen-Code-Generierung: 6 Zeichen, Zeichensatz ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  - [ ] Klassen-Code-Validierung bei Registrierung
  - [ ] PIN-Validierung: genau 4 Ziffern
  - [ ] Progress-Status kann nur aufsteigen (started → completed, nie zurück)
  - [ ] Rate-Limiting: Max 60 Progress-Events pro Stunde pro User
  - [ ] User kann nur eigenen Progress schreiben (API Rule)
  - [ ] Plausibilitäts-Flag: `suspicious: true` wenn >5 Aufgaben/Minute

### REQ-009: Site-Registry (Single Source of Truth)

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-001
- **Hinweis:** Zentrale Konfiguration aller Lernsituationen. Eliminiert hartcodierte Site-Listen in nginx.conf, Landing Page, Dashboard und Deploy-Script. Entscheidend für die Vision "zukünftig deutlich mehr Lernsituationen".
- **Akzeptanzkriterien:**
  - [ ] Konfigurationsdatei `sites.json` (oder PocketBase Collection `sites`) mit: slug, name, description, icon, base_path, framework_type (starlight|react-spa), is_active, sort_order
  - [ ] Landing Page (REQ-011) liest Kurs-Kacheln aus der Registry statt aus hartcodiertem Code
  - [ ] Dashboard-Kursfilter (REQ-023b) liest verfügbare Kurse aus der Registry
  - [ ] Deploy-Script (REQ-071) validiert Site-Namen gegen die Registry
  - [ ] Nginx-Config kann aus der Registry generiert werden (Template oder Script)
  - [ ] Neue Lernsituation einbinden = 1 Eintrag in der Registry + Dateien deployen

---

## Phase 2: Hub-App

### REQ-010: Hub Grundstruktur

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-004
- **Akzeptanzkriterien:**
  - [ ] Vite + React + TypeScript + Tailwind CSS Setup
  - [ ] Routing (React Router) mit Basis-Routes
  - [ ] `@lernplattform/shared` als Workspace-Dependency
  - [ ] Dev-Server startet auf Port 5173
  - [ ] `npm run build` erfolgreich

### REQ-011: Landing Page mit Kurs-Kacheln

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-010
- **Akzeptanzkriterien:**
  - [ ] Kurs-Kacheln mit Titel, Beschreibung und Icon — dynamisch aus Site-Registry (REQ-009) oder Konfigurationsdatei, nicht hartcodiert
  - [ ] Kacheln verlinken auf die jeweiligen Sites (`/ap1/`, `/pandas/`, etc.)
  - [ ] Responsive: 1 Spalte mobil, 2-3 Spalten Desktop
  - [ ] Ohne Login: Kacheln ohne Fortschritt, direkter Link

### REQ-012: Login-Seite

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-010
- **Akzeptanzkriterien:**
  - [ ] Formular: Klassen-Code + Username + 4-stelliger PIN
  - [ ] Validierung mit Fehlermeldungen (deutsch)
  - [ ] Erfolgreicher Login → Redirect auf Landing Page
  - [ ] Session: Cookie, 14 Tage gültig
  - [ ] Keyboard-navigierbar, Accessibility

### REQ-013: Registrierungs-Seite

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-008, REQ-010
- **Akzeptanzkriterien:**
  - [ ] Formular: Klassen-Code eingeben → Username + PIN wählen
  - [ ] Username-Validierung (Mindestlänge)
  - [ ] PIN: genau 4 Ziffern
  - [ ] Klassen-Code wird validiert (existiert und ist aktiv)
  - [ ] Account wird erstellt, automatisch eingeloggt

### REQ-014: Kurs-Kacheln mit Fortschrittsbalken

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006, REQ-011
- **Akzeptanzkriterien:**
  - [ ] Nach Login: Kacheln zeigen Fortschrittsbalken pro Kurs
  - [ ] Prozent basierend auf completed/total Exercises
  - [ ] Ansprechende Visualisierung (farbiger Balken)

### REQ-015: Profil-Bereich

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-005, REQ-006, REQ-010
- **Akzeptanzkriterien:**
  - [ ] "Hallo [Username]! Du hast X von Y Aufgaben geschafft"
  - [ ] Logout-Button
  - [ ] Nur sichtbar wenn eingeloggt

---

## Phase 3: Lehrer-Dashboard

### REQ-020: Dashboard Grundstruktur

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-010
- **Akzeptanzkriterien:**
  - [ ] Route `/dashboard/` in der Hub-App
  - [ ] Nur für User mit role=teacher zugänglich
  - [ ] Redirect auf Login wenn nicht eingeloggt oder nicht Lehrer
  - [ ] Navigation: Klassen, Matrix, Freischaltung

### REQ-021: Klassen-Verwaltung

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-020
- **Akzeptanzkriterien:**
  - [ ] Klasse erstellen: Name + Schuljahr → generierter 6-stelliger Code
  - [ ] Klassen-Liste: Name, Code, Schüler-Anzahl
  - [ ] Klassen-Code anzeigen (zum Teilen mit Schülern)
  - [ ] Schüler-Liste pro Klasse

### REQ-022: Lehrer-Account erstellen (Backend)

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-003
- **Akzeptanzkriterien:**
  - [ ] Lehrer-Login mit Username + Passwort (nicht PIN)
  - [ ] Lehrer-Accounts werden initial über PocketBase Admin-UI erstellt
  - [ ] role=teacher in der users Collection

### REQ-023a: Dashboard Matrix-Ansicht (Basis)

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [ ] Schüler (Zeilen) × Aufgaben (Spalten), farbcodiert
  - [ ] Farbcode: grün (geschafft), orange (versucht+falsch), grau (nicht angefangen)
  - [ ] Darstellung für eine Klasse und einen Kurs
  - [ ] Responsive: horizontal scrollbar bei vielen Aufgaben

### REQ-023b: Dashboard Matrix — Filter & Aggregation

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-023a
- **Akzeptanzkriterien:**
  - [ ] Aggregat-Zeile: "X% der Klasse hat diese Aufgabe geschafft"
  - [ ] Filter: nach Klasse, nach Kurs, nach Modul
  - [ ] Filter-Kombination funktioniert korrekt
  - [ ] URL-Parameter für aktiven Filter (Sharing/Bookmarking)

### REQ-024: Modul-Freischaltung im Dashboard

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-007, REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [ ] Liste aller Module pro Kurs mit aktuellem Status (gesperrt/freigeschaltet)
  - [ ] Toggle-Buttons zum Freischalten/Sperren pro Modul pro Klasse
  - [ ] Bulk-Aktion: "Alle Module bis einschließlich Modul X freischalten" als Ein-Klick-Aktion
  - [ ] Default-Zustand bei neuer Klasse: alles freigeschaltet (Lehrer sperrt bewusst, nicht andersrum)
  - [ ] Änderungen werden sofort in PocketBase gespeichert
  - [ ] Drei Zustände sichtbar: gesperrt, freigeschaltet, abgeschlossen

### REQ-025: Schüler-Verwaltung im Dashboard

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [ ] PIN zurücksetzen für einzelne Schüler
  - [ ] Schüler-Details: Username, Klasse, Fortschritt-Übersicht

### REQ-026: Dashboard Detail-Ansicht Zelle

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-023a
- **Akzeptanzkriterien:**
  - [ ] Klick auf Zelle in Matrix → Detail: Anzahl Versuche, Score, Zeitpunkt
  - [ ] Modal oder Sidebar-Panel

---

## Phase 4: Shared UI-Komponenten

### REQ-030: LoginBanner Komponente

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-005
- **Akzeptanzkriterien:**
  - [ ] "Melde dich an um deinen Fortschritt zu speichern" Banner
  - [ ] Link zur Login-Seite auf dem Hub
  - [ ] Nur sichtbar wenn nicht eingeloggt
  - [ ] Dismissbar (schließen-Button)

### REQ-031: UnlockGate Komponente

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-007
- **Akzeptanzkriterien:**
  - [ ] Wrapper-Komponente: zeigt Schloss oder Content
  - [ ] Gesperrt: Hinweis was fehlt ("Dieses Modul wurde noch nicht freigeschaltet")
  - [ ] Ohne Login: alles offen (kein Gate)
  - [ ] Freigeschaltet: Content normal sichtbar

### REQ-032: SidebarUnlock Komponente

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-007
- **Akzeptanzkriterien:**
  - [ ] Icons in Sidebar: gesperrt, freigeschaltet, abgeschlossen
  - [ ] Gesperrte Lektionen: sichtbar in Sidebar, Klick zeigt Hinweis
  - [ ] Kompatibel mit Starlight-Sidebar und React-Router

### REQ-033: ProgressBar Komponente (Sidebar)

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-006
- **Akzeptanzkriterien:**
  - [ ] Fortschrittsbalken pro Modul in der Sidebar
  - [ ] Zeigt completed/total als Prozent
  - [ ] Nur sichtbar wenn eingeloggt

### REQ-034: Offline-Queue für Progress

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006
- **Akzeptanzkriterien:**
  - [ ] Progress-Events werden in localStorage gequeued bei Offline
  - [ ] Automatischer Sync bei Reconnect
  - [ ] Queue wird nach erfolgreichem Sync geleert

### REQ-036: Prerequisite-basiertes Soft-Gate

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006, REQ-007
- **Hinweis:** Umsetzung von UNLOCK-03 aus REQUIREMENTS.md. Automatisches Freischalten als Empfehlung, kein harter Block.
- **Akzeptanzkriterien:**
  - [ ] Sites können in Frontmatter Prerequisites definieren: `prerequisites: ["netzwerktechnik/ip-adressierung"]`
  - [ ] Wenn Prerequisites nicht erfüllt: gelber Hinweis oben auf der Seite ("Wir empfehlen zuerst: [Lektionsname]")
  - [ ] Content ist trotzdem sichtbar (Soft-Gate, kein harter Block)
  - [ ] Ohne Login: kein Hinweis (Gast-Modus, alles offen)
  - [ ] Prerequisite-Check basiert auf Progress-Daten des eingeloggten Users

### REQ-037: Kursstruktur-Manifest

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-009
- **Hinweis:** Ohne Manifest kann das Dashboard die Matrix nicht vollständig aufbauen (es kennt nur Aufgaben mit existierenden Progress-Einträgen). Der Fortschrittsbalken kann "total" nicht berechnen.
- **Akzeptanzkriterien:**
  - [ ] Jede Site exportiert beim Build eine `course-manifest.json` mit: Kursname, Module (mit Titel), Lektionen (mit Titel), Aufgaben-IDs (mit Titel und Typ)
  - [ ] Manifest-Format ist dokumentiert und einheitlich für Starlight- und React-SPA-Sites
  - [ ] Dashboard (REQ-023a) liest Manifeste um die vollständige Matrix aufzubauen (inkl. Aufgaben ohne Progress-Einträge)
  - [ ] Fortschrittsbalken (REQ-014, REQ-033) berechnen "total" aus dem Manifest
  - [ ] Build-Script oder Plugin generiert das Manifest automatisch (kein manuelles Pflegen)

---

## Phase 4b: Accessibility Hardening

### REQ-035: a11y-Feinschliff bestehende Komponenten

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-011, REQ-023a
- **Akzeptanzkriterien:**
  - [ ] Farbkontrast-Fix: `progress-matrix.tsx` — `text-gray-400` → `text-gray-600` für "Nicht angefangen"-Zellen (WCAG AA 4.5:1)
  - [ ] `aria-live="assertive"` auf Fehler-Alerts in `ClassesPage.tsx` und `ClassDetailPage.tsx`
  - [ ] Copy-Button (`ClassDetailPage`): `aria-label` aktualisiert sich bei Zustandswechsel ("Kopieren" → "Code kopiert")
  - [ ] Dekorativer Pfeil in Back-Link (`ClassDetailPage`): `←` mit `aria-hidden="true"` wrappen
  - [ ] Explizite Keyboard-Navigation-Tests (Tab-Reihenfolge) für LoginPage, RegisterPage, MatrixPage
  - [ ] `jest-axe` als Dev-Dependency hinzufügen, mindestens 1 axe-Audit pro Page-Test

---

## Phase 5: Security & Anti-Cheat

### REQ-040: Dashboard zeigt verdächtige Einträge

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-008, REQ-023a
- **Akzeptanzkriterien:**
  - [ ] Dashboard-Matrix zeigt Einträge mit `suspicious: true` mit Warnung-Icon
  - [ ] Tooltip oder Hinweis erklärt warum verdächtig
  - [ ] Kein harter Block — nur visuelle Markierung

---

## Phase 5b: Zuul-Migration (Docusaurus → Astro/Starlight)

### REQ-052: World of Zuul — Docusaurus → Astro/Starlight Migration

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-001
- **Hinweis:** Quell-Repo liegt in `sites/lf05_worldOfZuul/` (Docusaurus). Ziel: Astro/Starlight-Projekt wie AP1/pandas/REST.
- **Akzeptanzkriterien:**
  - [ ] Neues Astro/Starlight-Projekt mit `base: '/zuul'`
  - [ ] Alle 25 Markdown-Seiten migriert (Arbeitsblätter + Infoblätter)
  - [ ] Sidebar-Struktur aus `sidebars.js` in Starlight-Config übertragen
  - [ ] Alle 22 React-Komponenten übernommen und funktionsfähig
  - [ ] `@site/src/components/...` Imports auf Starlight-kompatible Pfade umgestellt
  - [ ] Admonitions angepasst (Docusaurus → Starlight Syntax)
  - [ ] Build erfolgreich mit Subpfad `/zuul/`
  - [ ] Bisheriges localStorage-Progress-Tracking (`progress.js`) funktioniert weiterhin

### REQ-053: World of Zuul — Shared-Integration

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-006, REQ-007, REQ-052
- **Akzeptanzkriterien:**
  - [ ] `@lernplattform/shared` als Dependency
  - [ ] `AuthProvider` im Layout eingebunden
  - [ ] `ProgressTracker` lauscht auf `exercise-complete` Events
  - [ ] Sidebar zeigt Unlock-Status
  - [ ] Gast-Modus funktioniert (alles offen, kein Tracking)
  - [ ] Checkbox-basiertes Progress-Tracking mit `exercise-complete` Events kompatibel

---

## Phase 6: Site-Integration (AP1-Trainer als Pilot)

### REQ-050: AP1-Trainer Base-Path konfigurieren

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [ ] `astro.config.mjs`: `base: '/ap1'` und `site: 'https://learn.szut.dev'`
  - [ ] Build erfolgreich mit Subpfad
  - [ ] Alle internen Links funktionieren mit Prefix

### REQ-051: AP1-Trainer Shared-Integration

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-006, REQ-007, REQ-050
- **Akzeptanzkriterien:**
  - [ ] `@lernplattform/shared` als Dependency
  - [ ] `AuthProvider` im Layout eingebunden
  - [ ] `ProgressTracker` lauscht auf `exercise-complete` Events
  - [ ] Sidebar zeigt Unlock-Status
  - [ ] Gast-Modus funktioniert (alles offen, kein Tracking)

---

## Phase 7: Weitere Sites anbinden

### REQ-060: Starlight-Sites integrieren (pandas, REST/NoSQL)

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-051
- **Hinweis:** Erfordert Zugriff auf die Repos `pandas-lernen` und `rest_noSQL_datenformate`
- **Akzeptanzkriterien:**
  - [ ] pandas-lernen: Base-Path `/pandas/`, Shared-Komponente integriert, Build erfolgreich
  - [ ] REST/NoSQL: Base-Path `/rest/`, Shared-Komponente integriert, Build erfolgreich
  - [ ] Exercise-Events werden in beiden Sites getrackt
  - [ ] Gast-Modus funktioniert in beiden Sites

### REQ-061: React-SPA-Sites integrieren (NumPy, UML)

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-051
- **Hinweis:** Erfordert Zugriff auf die Repos `numpy-lernsituation` und `uml-site`
- **Akzeptanzkriterien:**
  - [ ] NumPy: Vite `base: '/numpy'`, AuthProvider in Root, Router basename, Build erfolgreich
  - [ ] UML: Vite `base: '/uml'`, AuthProvider in Root, Build erfolgreich
  - [ ] UML: Bestehendes Achievement-System mit Progress-Tracking kompatibel machen
  - [ ] Exercise-Events werden in beiden Sites getrackt

---

## Phase 8: Deployment & Betrieb

### REQ-070: Docker Compose Production-Setup

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [ ] Traefik-Labels für `learn.szut.dev`
  - [ ] TLS via Let's Encrypt (Traefik certresolver)
  - [ ] PocketBase persistent Volume
  - [ ] Nginx mit korrektem Path-Routing
  - [ ] `docker compose up -d` startet alles

### REQ-071: Ops-Scripts (Backup + Deploy)

- **Status:** open
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-070
- **Akzeptanzkriterien:**
  - [ ] `scripts/backup.sh` sichert PocketBase SQLite-DB, gzip, 30-Tage-Rotation, Cron-fähig
  - [ ] `scripts/deploy.sh <site-name>` deployt eine einzelne Site (Build + rsync)
  - [ ] Deploy-Script validiert Site-Name gegen Site-Registry (REQ-009), nicht gegen hartcodierte Liste

### REQ-073: DSGVO & Security Hardening

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-002, REQ-010
- **Akzeptanzkriterien:**
  - [ ] Datenschutzerklärung auf Landing Page verlinkt
  - [ ] Kein Klarname-Zwang (nur Username + Klasse)
  - [ ] Keine IP-Logs in PocketBase
  - [ ] Hinweis auf Datenminimierung in der Registrierung
  - [ ] Security Headers in nginx.conf: X-Content-Type-Options, X-Frame-Options, Referrer-Policy

### REQ-074: Einwilligungsformular Erziehungsberechtigte

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-073
- **Hinweis:** Ohne Einwilligung der Erziehungsberechtigten darf die Plattform mit Minderjährigen (< 16 Jahre) nicht betrieben werden. Rechtliche Pflicht für den Schulbetrieb.
- **Akzeptanzkriterien:**
  - [ ] PDF-Template für Einwilligungserklärung der Erziehungsberechtigten
  - [ ] Inhalt: Welche Daten werden erhoben (Username, Klasse, Lernfortschritt), Zweck, Speicherdauer, Löschung am Schuljahresende
  - [ ] Hinweis auf Freiwilligkeit (Plattform auch ohne Login nutzbar)
  - [ ] Download-Link auf der Registrierungsseite
  - [ ] Datenschutzerklärungs-Seite mit vollständigem Inhalt (nicht nur Link)

### REQ-075: Löschkonzept & Klasse archivieren

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-021, REQ-073
- **Hinweis:** DSGVO-Pflicht: personenbezogene Daten müssen nach Wegfall des Zwecks gelöscht werden. Am Schuljahresende müssen Schüler-Daten löschbar sein.
- **Akzeptanzkriterien:**
  - [ ] Dashboard-Aktion "Klasse archivieren" für Lehrer
  - [ ] Archivierung löscht: alle Schüler-Accounts der Klasse, deren Progress-Daten, Unlock-Einträge
  - [ ] Sicherheitsabfrage vor Löschung ("Klasse FI24a mit 23 Schülern wirklich archivieren?")
  - [ ] Klasse wird als `is_active: false` markiert, aber Name/Schuljahr bleiben für Lehrer-Referenz erhalten
  - [ ] Löschung ist irreversibel — Hinweis im Dialog

---

## Erweiterungs-Backlog (nicht in Phase 1, aber Architektur darf sie nicht verbauen)

> Diese Features sind bewusst nicht im aktuellen Scope, aber als Zukunfts-Optionen identifiziert.
> Die aktuelle Architektur muss diese Wege offen halten, ohne sie jetzt zu implementieren.

- **Individuelles Freischalten pro Schüler** — Schema ist vorbereitet (`user_id` nullable in `course_unlocks`). UI kommt wenn konkreter Bedarf entsteht.
- **Fortschrittsbasiertes Auto-Unlock** — "Wenn 80% von Modul 1 → Modul 2 freischalten". Konfigurierbar pro Klasse/Kurs. Braucht Manifest (REQ-037) als Grundlage.
- **Zeitgesteuerte Freischaltung** — `unlocked_from`-Datumsfeld in `course_unlocks`. Lehrer bereitet Freischaltung für nächste Woche vor.
- **Freischalt-Vorlagen** — Freischalt-Konfiguration als Template speichern und auf Parallelklassen anwenden.
- **Datenexport** — CSV/Excel-Export der Progress-Matrix für Lehrer (Notendokumentation).
- **Benachrichtigungen** — Lehrer wird informiert wenn Klasse ein Modul abschließt (PocketBase Realtime).
- **Server-seitige Code-Ausführung** — Für externe Tool-Integration (IDEs, Jupyter). Nicht Phase 1, aber Architektur erlaubt es später.
- **Analytics & Lernstandsdiagnose** — Aggregierte Auswertungen über Klassen/Schuljahre hinweg.
- **Peer-Review & Feedback** — Schüler bewerten Lösungen gegenseitig. Braucht neue Collections.
