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

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [x] Collection `users` (Auth): username, role, class_id, display_name (pin_hash entfällt — PocketBase password-Feld übernimmt Hashing)
  - [x] Collection `classes`: name, join_code, school_year, is_active, created_by
  - [x] Collection `course_unlocks`: class_id, user_id (nullable, für späteres individuelles Freischalten), course, module, is_unlocked, unlocked_by, unlocked_at
  - [x] Collection `progress`: user_id, course, lesson, exercise, status, score, max_score, attempts, completed_at
  - [x] UNIQUE-Constraint auf progress (user_id, course, lesson, exercise)
  - [x] API Rules korrekt gesetzt (siehe REQUIREMENTS.md Abschnitt 4)

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

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [x] `AuthProvider` React Context mit PocketBase SDK
  - [x] `useAuth` Hook: isLoggedIn, user, login(username, pin, classCode), logout
  - [x] Auth-State wird aus PocketBase Cookie gelesen
  - [x] Login setzt Cookie auf Domain (konfigurierbar)
  - [x] Logout löscht Cookie und Auth-State
  - [x] TypeScript-Typen für User exportiert

### REQ-006: useProgress Hook + Sync

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [x] `useProgress` Hook: reportComplete(exerciseId, score, maxScore), getProgress(course)
  - [x] Debounced Sync: gesammelt alle 30s oder bei Page-Visibility-Change
  - [x] Lauscht auf `exercise-complete` CustomEvent
  - [x] Kurs und Lektion werden aus URL abgeleitet
  - [x] Nur aktiv wenn User eingeloggt (Gast-Modus: kein Tracking)

### REQ-007: useUnlock Hook

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-004
- **Akzeptanzkriterien:**
  - [x] `useUnlock` Hook: isModuleUnlocked(course, module), getUnlockedModules(course)
  - [x] Fragt `course_unlocks` Collection ab für aktuelle Klasse
  - [x] Ohne Login: alles offen (Gast-Modus)
  - [x] Cacht Unlock-Status lokal (minimale API-Calls)

### REQ-008: PocketBase Hooks & Server-Validierung

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003
- **Akzeptanzkriterien:**
  - [x] Klassen-Code-Generierung: 6 Zeichen, Zeichensatz ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  - [x] Klassen-Code-Validierung bei Registrierung
  - [x] PIN-Validierung: genau 4 Ziffern
  - [x] Progress-Status kann nur aufsteigen (started → completed, nie zurück)
  - [x] Rate-Limiting: Max 60 Progress-Events pro Stunde pro User
  - [x] User kann nur eigenen Progress schreiben (API Rule)
  - [x] Plausibilitäts-Flag: `suspicious: true` wenn >5 Aufgaben/Minute

### REQ-009: Site-Registry (Single Source of Truth)

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-001
- **Hinweis:** Zentrale Konfiguration aller Lernsituationen. Eliminiert hartcodierte Site-Listen in nginx.conf, Landing Page, Dashboard und Deploy-Script. Entscheidend für die Vision "zukünftig deutlich mehr Lernsituationen".
- **Akzeptanzkriterien:**
  - [x] Konfigurationsdatei `sites.json` (oder PocketBase Collection `sites`) mit: slug, name, description, icon, base_path, framework_type (starlight|react-spa), is_active, sort_order
  - [x] Landing Page (REQ-011) liest Kurs-Kacheln aus der Registry statt aus hartcodiertem Code
  - [x] Dashboard-Kursfilter (REQ-023b) liest verfügbare Kurse aus der Registry
  - [x] Deploy-Script (REQ-071) validiert Site-Namen gegen die Registry
  - [x] Nginx-Config kann aus der Registry generiert werden (Template oder Script)
  - [x] Neue Lernsituation einbinden = 1 Eintrag in der Registry + Dateien deployen

---

## Phase 2: Hub-App

### REQ-010: Hub Grundstruktur

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-004
- **Akzeptanzkriterien:**
  - [x] Vite + React + TypeScript + Tailwind CSS Setup
  - [x] Routing (React Router) mit Basis-Routes
  - [x] `@lernplattform/shared` als Workspace-Dependency
  - [x] Dev-Server startet auf Port 5173
  - [x] `npm run build` erfolgreich

### REQ-011: Landing Page mit Kurs-Kacheln

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-010
- **Akzeptanzkriterien:**
  - [x] Kurs-Kacheln mit Titel, Beschreibung und Icon — dynamisch aus Site-Registry (REQ-009) oder Konfigurationsdatei, nicht hartcodiert
  - [x] Kacheln verlinken auf die jeweiligen Sites (`/ap1/`, `/pandas/`, etc.)
  - [x] Responsive: 1 Spalte mobil, 2-3 Spalten Desktop
  - [x] Ohne Login: Kacheln ohne Fortschritt, direkter Link

### REQ-012: Login-Seite

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-010
- **Akzeptanzkriterien:**
  - [x] Formular: Username + 4-stelliger PIN (Klassen-Code nur bei Registrierung)
  - [x] Validierung mit Fehlermeldungen (deutsch)
  - [x] Erfolgreicher Login → Redirect auf Landing Page
  - [x] Session: Cookie, 14 Tage gültig
  - [x] Keyboard-navigierbar, Accessibility

### REQ-013: Registrierungs-Seite

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-008, REQ-010
- **Akzeptanzkriterien:**
  - [x] Formular: Klassen-Code eingeben → Username + PIN wählen
  - [x] Username-Validierung (Mindestlänge)
  - [x] PIN: genau 4 Ziffern
  - [x] Klassen-Code wird validiert (existiert und ist aktiv)
  - [x] Account wird erstellt, automatisch eingeloggt

### REQ-014: Kurs-Kacheln mit Fortschrittsbalken

- **Status:** done
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006, REQ-011
- **Akzeptanzkriterien:**
  - [x] Nach Login: Kacheln zeigen Fortschrittsbalken pro Kurs
  - [x] Prozent basierend auf completed/total Exercises
  - [x] Ansprechende Visualisierung (farbiger Balken)

### REQ-015: Profil-Bereich

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-005, REQ-006, REQ-010
- **Akzeptanzkriterien:**
  - [x] "Hallo [Username]! Du hast X von Y Aufgaben geschafft"
  - [x] Logout-Button
  - [x] Nur sichtbar wenn eingeloggt

---

## Phase 3: Lehrer-Dashboard

### REQ-020: Dashboard Grundstruktur

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-010
- **Akzeptanzkriterien:**
  - [x] Route `/dashboard/` in der Hub-App
  - [x] Nur für User mit role=teacher zugänglich
  - [x] Redirect auf Login wenn nicht eingeloggt oder nicht Lehrer
  - [x] Navigation: Klassen, Matrix, Freischaltung

### REQ-021: Klassen-Verwaltung

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-003, REQ-020
- **Akzeptanzkriterien:**
  - [x] Klasse erstellen: Name + Schuljahr → generierter 6-stelliger Code
  - [x] Klassen-Liste: Name, Code, Schüler-Anzahl
  - [x] Klassen-Code anzeigen (zum Teilen mit Schülern)
  - [x] Schüler-Liste pro Klasse

### REQ-022: Lehrer-Account erstellen (Backend)

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-003
- **Akzeptanzkriterien:**
  - [x] Lehrer-Login mit Username + Passwort (nicht PIN)
  - [x] Lehrer-Accounts werden initial über PocketBase Admin-UI erstellt
  - [x] role=teacher in der users Collection

### REQ-023a: Dashboard Matrix-Ansicht (Basis)

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [x] Schüler (Zeilen) × Aufgaben (Spalten), farbcodiert
  - [x] Farbcode: grün (geschafft), orange (versucht+falsch), grau (nicht angefangen)
  - [x] Darstellung für eine Klasse und einen Kurs
  - [x] Responsive: horizontal scrollbar bei vielen Aufgaben

### REQ-023b: Dashboard Matrix — Filter & Aggregation

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-023a
- **Akzeptanzkriterien:**
  - [x] Aggregat-Zeile: "X% der Klasse hat diese Aufgabe geschafft"
  - [x] Filter: nach Klasse, nach Kurs, nach Modul
  - [x] Filter-Kombination funktioniert korrekt
  - [x] URL-Parameter für aktiven Filter (Sharing/Bookmarking)

### REQ-024: Modul-Freischaltung im Dashboard

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-007, REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [x] Liste aller Module pro Kurs mit aktuellem Status (gesperrt/freigeschaltet)
  - [x] Toggle-Buttons zum Freischalten/Sperren pro Modul pro Klasse
  - [x] Bulk-Aktion: "Alle Module bis einschließlich Modul X freischalten" als Ein-Klick-Aktion
  - [x] Default-Zustand bei neuer Klasse: alles freigeschaltet (Lehrer sperrt bewusst, nicht andersrum)
  - [x] Änderungen werden sofort in PocketBase gespeichert
  - [x] Drei Zustände sichtbar: gesperrt, freigeschaltet, abgeschlossen *(Heuristik: "abgeschlossen" = mind. 1 Schüler mit completed-Progress. Volle Manifest-Semantik via REQ-037)*

### REQ-025: Schüler-Verwaltung im Dashboard

- **Status:** done
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-020, REQ-021
- **Akzeptanzkriterien:**
  - [x] PIN zurücksetzen für einzelne Schüler
  - [x] Schüler-Details: Username, Klasse, Fortschritt-Übersicht

### REQ-026: Dashboard Detail-Ansicht Zelle

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-023a
- **Akzeptanzkriterien:**
  - [x] Klick auf Zelle in Matrix → Detail: Anzahl Versuche, Score, Zeitpunkt
  - [x] Modal oder Sidebar-Panel

---

## Phase 4: Shared UI-Komponenten

### REQ-030: LoginBanner Komponente

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-005
- **Akzeptanzkriterien:**
  - [x] "Melde dich an um deinen Fortschritt zu speichern" Banner
  - [x] Link zur Login-Seite auf dem Hub
  - [x] Nur sichtbar wenn nicht eingeloggt
  - [x] Dismissbar (schließen-Button)

### REQ-031: UnlockGate Komponente

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-007
- **Akzeptanzkriterien:**
  - [x] Wrapper-Komponente: zeigt Schloss oder Content
  - [x] Gesperrt: Hinweis was fehlt ("Dieses Modul wurde noch nicht freigeschaltet")
  - [x] Ohne Login: alles offen (kein Gate)
  - [x] Freigeschaltet: Content normal sichtbar

### REQ-032: SidebarUnlock Komponente

- **Status:** done
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-007
- **Akzeptanzkriterien:**
  - [x] Icons in Sidebar: gesperrt, freigeschaltet, abgeschlossen
  - [x] Gesperrte Lektionen: sichtbar in Sidebar, Klick zeigt Hinweis
  - [x] Kompatibel mit Starlight-Sidebar und React-Router

### REQ-033: ProgressBar Komponente (Sidebar)

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-006
- **Akzeptanzkriterien:**
  - [x] Fortschrittsbalken pro Modul in der Sidebar
  - [x] Zeigt completed/total als Prozent
  - [x] Nur sichtbar wenn eingeloggt

### REQ-034: Offline-Queue für Progress

- **Status:** done
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006
- **Akzeptanzkriterien:**
  - [x] Progress-Events werden in localStorage gequeued bei Offline
  - [x] Automatischer Sync bei Reconnect
  - [x] Queue wird nach erfolgreichem Sync geleert

### REQ-036: Prerequisite-basiertes Soft-Gate

- **Status:** done
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-006, REQ-007
- **Hinweis:** Umsetzung von UNLOCK-03 aus REQUIREMENTS.md. Automatisches Freischalten als Empfehlung, kein harter Block.
- **Akzeptanzkriterien:**
  - [x] Sites können in Frontmatter Prerequisites definieren: `prerequisites: ["netzwerktechnik/ip-adressierung"]`
  - [x] Wenn Prerequisites nicht erfüllt: gelber Hinweis oben auf der Seite ("Wir empfehlen zuerst: [Lektionsname]")
  - [x] Content ist trotzdem sichtbar (Soft-Gate, kein harter Block)
  - [x] Ohne Login: kein Hinweis (Gast-Modus, alles offen)
  - [x] Prerequisite-Check basiert auf Progress-Daten des eingeloggten Users

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

## Phase 4c: Kurs-Sichtbarkeit

### REQ-039: Kurs-Filterung nach Klassen-Zuordnung auf der Landing Page

- **Status:** open
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-012, REQ-021
- **Hinweis:** Aktuell sehen eingeloggte Schüler alle 6 Kurse, unabhängig von ihrer Klassen-Zuordnung. Das Unlock-System arbeitet bisher nur auf Modul-Ebene innerhalb von Kursen. Für die Landing Page fehlt Kurs-Level-Filterung: Schüler sollen nur Kurse sehen, die für ihre Klasse freigeschaltet sind.
- **Akzeptanzkriterien:**
  - [ ] Eingeloggte Schüler sehen nur Kurse, die für ihre Klasse freigeschaltet sind
  - [ ] Nicht freigeschaltete Kurse werden auf der Landing Page ausgeblendet (nicht ausgegraut)
  - [ ] Ohne Login (Gast-Modus): alle Kurse sichtbar (Status Quo)
  - [ ] Lehrer sehen immer alle Kurse
  - [ ] Testschüler (Klasse FI24A) sieht nur AP1, Pandas und Zuul
  - [ ] Wenn keine Freischaltungs-Records existieren: alle Kurse sichtbar (Default = offen)

---

## Phase 4b: Accessibility Hardening

### REQ-035: a11y-Feinschliff bestehende Komponenten

- **Status:** done
- **Priorität:** P1
- **Größe:** S
- **Abhängig von:** REQ-011, REQ-023a
- **Akzeptanzkriterien:**
  - [x] Farbkontrast-Fix: `progress-matrix.tsx` — `text-gray-400` → `text-gray-600` für "Nicht angefangen"-Zellen (WCAG AA 4.5:1)
  - [x] `aria-live="assertive"` auf Fehler-Alerts in `ClassesPage.tsx` und `ClassDetailPage.tsx`
  - [x] Copy-Button (`ClassDetailPage`): `aria-label` aktualisiert sich bei Zustandswechsel ("Kopieren" → "Code kopiert")
  - [x] Dekorativer Pfeil in Back-Link (`ClassDetailPage`): `←` mit `aria-hidden="true"` wrappen
  - [x] Explizite Keyboard-Navigation-Tests (Tab-Reihenfolge) für LoginPage, RegisterPage, MatrixPage
  - [x] `jest-axe` als Dev-Dependency hinzufügen, mindestens 1 axe-Audit pro Page-Test

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

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [x] `astro.config.mjs`: `base: '/ap1'` und `site: 'https://learn.szut.dev'`
  - [x] Build erfolgreich mit Subpfad
  - [x] Alle internen Links funktionieren mit Prefix

### REQ-051: AP1-Trainer Shared-Integration

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-005, REQ-006, REQ-007, REQ-050
- **Akzeptanzkriterien:**
  - [x] `@lernplattform/shared` als Dependency
  - [x] `AuthProvider` im Layout eingebunden
  - [x] `ProgressTracker` lauscht auf `exercise-complete` Events
  - [x] Sidebar zeigt Unlock-Status
  - [x] Gast-Modus funktioniert (alles offen, kein Tracking)

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

- **Status:** done
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [x] Traefik-Labels für `learn.szut.dev`
  - [x] TLS via Let's Encrypt (Traefik certresolver)
  - [x] PocketBase persistent Volume
  - [x] Nginx mit korrektem Path-Routing
  - [x] `docker compose up -d` startet alles

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

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-002, REQ-010
- **Akzeptanzkriterien:**
  - [x] Datenschutzerklärung auf Landing Page verlinkt
  - [x] Kein Klarname-Zwang (nur Username + Klasse)
  - [x] Keine IP-Logs in PocketBase
  - [x] Hinweis auf Datenminimierung in der Registrierung
  - [x] Security Headers in nginx.conf: X-Content-Type-Options, X-Frame-Options, Referrer-Policy

### REQ-074: Einwilligungsformular Erziehungsberechtigte

- **Status:** done
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-073
- **Hinweis:** Ohne Einwilligung der Erziehungsberechtigten darf die Plattform mit Minderjährigen (< 16 Jahre) nicht betrieben werden. Rechtliche Pflicht für den Schulbetrieb.
- **Akzeptanzkriterien:**
  - [x] PDF-Template für Einwilligungserklärung der Erziehungsberechtigten
  - [x] Inhalt: Welche Daten werden erhoben (Username, Klasse, Lernfortschritt), Zweck, Speicherdauer, Löschung am Schuljahresende
  - [x] Hinweis auf Freiwilligkeit (Plattform auch ohne Login nutzbar)
  - [x] Download-Link auf der Registrierungsseite
  - [x] Datenschutzerklärungs-Seite mit vollständigem Inhalt (nicht nur Link)

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

## Phase 9: Manifest-zentrische Kursanbindung & Kursadministration

> Zukunftssicheres Konzept für die automatische Verbindung zwischen Kursen und Hub.
> Jede Site generiert beim Build ein `course-manifest.json` mit der kompletten Struktur.
> Der Hub konsumiert diese Manifeste zur Laufzeit — keine doppelte Pflege.

### REQ-056: Manifest-Schema v2 mit Erweiterungen

- **Status:** planned
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-037
- **Hinweis:** Erweitert das bestehende Manifest-Schema um Felder für Freischaltung, Gruppierung und Cache-Invalidierung. Rückwärtskompatibel zu v1.
- **Akzeptanzkriterien:**
  - [ ] `ManifestLesson` hat neue Felder: `path` (URL-Pfad relativ zum Site-Base), `tags` (string[]), `prerequisites` (string[])
  - [ ] `CourseManifest` hat neue Felder: `buildHash` (string), `totalLessons` (number), `allTags` (string[])
  - [ ] `CourseManifest.version` akzeptiert `1 | 2`
  - [ ] `validateManifest()` akzeptiert v1 und v2 und konvertiert v1 automatisch zu v2 (fehlende Felder mit Defaults: leere Arrays, leere Strings)
  - [ ] Bestehende Konsumenten (`useManifests`, `manifestToColumns`, `useCourseProgress`) funktionieren unverändert mit v1 und v2
  - [ ] Typen und Validierung im Shared-Package exportiert
  - [ ] Unit-Tests für v1-zu-v2-Konvertierung und Validierung beider Versionen

### REQ-055: Manifest-Generator für Astro/Starlight-Sites

- **Status:** planned
- **Priorität:** P0
- **Größe:** L
- **Abhängig von:** REQ-037, REQ-056
- **Hinweis:** Erster Generator. AP1-Trainer als Pilot, danach auf pandas-lernen, REST/NoSQL und World of Zuul ausrollen. Ohne diesen Generator bleibt REQ-037 ein leeres Schema.
- **Akzeptanzkriterien:**
  - [ ] Astro-Integration-Plugin `astro-manifest-plugin` im Shared-Package oder als eigenständiges npm-Paket
  - [ ] Plugin scannt `src/content/docs/` und liest Starlight-Sidebar-Config
  - [ ] Frontmatter-Felder werden extrahiert: `title`, `exercises` (optional, default 0), `tags` (optional), `prerequisites` (optional)
  - [ ] Aufgaben-Erkennung: Zählt React-Komponenten-Imports deren Name auf `Exercise`, `Quiz`, `Aufgabe`, `Trainer` endet (Heuristik), überschreibbar per Frontmatter `exercises: N`
  - [ ] Generiert `course-manifest.json` als `afterBuild`-Hook in `dist/`
  - [ ] Manifest entspricht dem `CourseManifest` v2 Schema (REQ-056)
  - [ ] AP1-Trainer generiert beim Build ein korrektes Manifest mit allen Modulen, Lektionen und Aufgaben
  - [ ] Build-Hash (Git-Commit oder Zeitstempel) wird ins Manifest geschrieben
  - [ ] Plugin ist konfigurierbar: `manifestPlugin({ course: 'ap1', name: 'AP1-Trainer' })`

### REQ-057: Manifest-Generator für React-SPA-Sites

- **Status:** planned
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-037, REQ-056
- **Hinweis:** React-SPAs haben keine dateibasierte Content-Struktur. Stattdessen deklarative `manifest.config.ts` als Single Source of Truth im Site-Repo.
- **Akzeptanzkriterien:**
  - [ ] Vite-Plugin `vite-manifest-plugin` im Shared-Package oder eigenständiges Paket
  - [ ] Plugin liest `manifest.config.ts` aus dem Site-Root
  - [ ] `ManifestConfig`-Typ im Shared-Package exportiert (vereinfachte Eingabe-Struktur, Plugin ergänzt fehlende Felder)
  - [ ] Plugin generiert `course-manifest.json` als `closeBundle`-Hook in `dist/`
  - [ ] NumPy-Site hat eine `manifest.config.ts` und generiert beim Build ein korrektes Manifest
  - [ ] UML-Site hat eine `manifest.config.ts` und generiert beim Build ein korrektes Manifest
  - [ ] Build-Hash wird automatisch aus Git-Commit oder Zeitstempel generiert

### REQ-062: Manifest-Generierung für alle bestehenden Sites ausrollen

- **Status:** planned
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-055, REQ-057
- **Hinweis:** Stellt sicher dass alle 6 Sites ein Manifest generieren. Erst dann kann `total_exercises` aus `sites.json` entfernt und das Dashboard vollständig Manifest-basiert werden.
- **Akzeptanzkriterien:**
  - [ ] AP1-Trainer: Manifest wird beim Build generiert, deployed und vom Hub lesbar
  - [ ] pandas-lernen: Manifest wird beim Build generiert
  - [ ] REST/NoSQL: Manifest wird beim Build generiert
  - [ ] World of Zuul: Manifest wird beim Build generiert
  - [ ] NumPy: Manifest wird beim Build generiert
  - [ ] UML: Manifest wird beim Build generiert
  - [ ] Hub zeigt für alle Kurse Manifest-basierte Fortschrittsbalken (nicht mehr `total_exercises` aus `sites.json`)
  - [ ] Dashboard-Matrix nutzt für alle Kurse Manifest-basierte Spalten
  - [ ] `total_exercises` und `modules` in `sites.json` sind als deprecated markiert (Fallback bleibt erhalten)

### REQ-059: Granulare Freischaltung auf Lektions-Ebene

- **Status:** planned
- **Priorität:** P0
- **Größe:** L
- **Abhängig von:** REQ-024, REQ-037, REQ-056
- **Hinweis:** Erweitert die bestehende Modul-Freischaltung (REQ-024) um Lektions-Granularität. Default bleibt: alles offen. Lehrer sperren gezielt.
- **Akzeptanzkriterien:**
  - [ ] `course_unlocks`-Collection erweitert um Feld `scope` (enum: "module", "lesson") und `target` (string, ersetzt bisheriges `module`-Feld)
  - [ ] PocketBase-Migration für Schema-Erweiterung, bestehende Records werden migriert (`scope: "module"`, `target: bisheriger module-Wert`)
  - [ ] `useUnlock`-Hook im Shared-Package unterstützt granulare Abfrage: `isLessonUnlocked(course, lessonSlug)`
  - [ ] Hierarchische Logik: Modul-Lock sperrt alle Lektionen, Lektion-Lock/Unlock überschreibt Modul innerhalb
  - [ ] Dashboard-Freischaltungs-UI (REQ-024) zeigt Manifest-basierte Baumstruktur: Module aufklappbar, Lektionen einzeln schaltbar
  - [ ] Bulk-Aktionen: "Ganzes Modul sperren/freischalten", "Alle bis einschließlich Lektion X freischalten"
  - [ ] `UnlockGate`- und `SidebarUnlock`-Komponenten funktionieren mit der neuen Granularität
  - [ ] Default-Zustand: Keine Records = alles offen (unverändert)
  - [ ] Rückwärtskompatibilität: Alte Modul-Records funktionieren weiterhin

### REQ-058: Manifest-Caching im Hub (Stale-While-Revalidate)

- **Status:** planned
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-037, REQ-056
- **Hinweis:** Performance-Optimierung. Stale-While-Revalidate verhindert Loading-Spinner, der Index reduziert Netzwerk-Traffic bei vielen Kursen.
- **Akzeptanzkriterien:**
  - [ ] `useManifests` cached geladene Manifeste in `localStorage` mit Key `lernplattform:manifest:{course}`
  - [ ] Beim Laden wird zuerst der Cache gelesen (sofortige Anzeige), dann im Hintergrund aktualisiert
  - [ ] Bei neuem `buildHash` wird der Cache aktualisiert und ein Re-Render ausgelöst
  - [ ] Cache wird beim Logout oder nach 7 Tagen invalidiert
  - [ ] Landing Page zeigt Kurs-Kacheln ohne Verzögerung (Manifest-Cache oder `sites.json`-Fallback)

### REQ-065: Themengruppen für Lehrer (Kursadministration)

- **Status:** planned
- **Priorität:** P1
- **Größe:** L
- **Abhängig von:** REQ-037, REQ-056, REQ-059
- **Hinweis:** Lehrer können kursübergreifende Themengruppen erstellen. Gruppen sind intern nutzbar (Dashboard-Filter) und optional als Lernpfad für Schüler veröffentlichbar (REQ-066).
- **Akzeptanzkriterien:**
  - [ ] PocketBase-Collection `topic_groups` mit: teacher_id, class_id (nullable), name, description, color, items (JSON-Array von `{course, lessonSlug}`), sort_order, published (boolean, default false)
  - [ ] Dashboard-Route `/dashboard/themen` mit CRUD-Oberfläche für Themengruppen
  - [ ] Themengruppe erstellen: Name vergeben, Lektionen aus Manifest-Baumansicht auswählen (kursübergreifend)
  - [ ] Lektionen können per Checkbox hinzugefügt/entfernt werden
  - [ ] Themengruppe ist als Filter in der Matrix-Ansicht (REQ-023b) verwendbar
  - [ ] Fortschrittsbalken pro Themengruppe auf der Themen-Übersichtsseite
  - [ ] Themengruppen können klassenspezifisch (nur für eine Klasse) oder global (für alle eigenen Klassen) sein
  - [ ] Tag-basierte Quick-Grouping: Button "Themengruppe aus Tag erstellen" nutzt `allTags` aus Manifesten
  - [ ] Maximal 50 Themengruppen pro Lehrer

### REQ-066: Lernpfade für Schüler (veröffentlichte Themengruppen)

- **Status:** planned
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-065
- **Hinweis:** Lehrer entscheidet per `published`-Flag welche Themengruppen als Lernpfad für Schüler sichtbar sind. Nicht jede interne Gruppierung muss für Schüler sichtbar sein.
- **Akzeptanzkriterien:**
  - [ ] Themengruppen mit `published: true` erscheinen als Lernpfad auf der HomePage für Schüler der jeweiligen Klasse
  - [ ] Lernpfad-Bereich oberhalb der Kursübersicht: Titel, Fortschrittsbalken, Liste der enthaltenen Lektionen mit Status (erledigt/offen)
  - [ ] Klick auf eine Lektion im Lernpfad verlinkt direkt zur Seite im jeweiligen Kurs
  - [ ] Lektionen aus verschiedenen Kursen sind visuell unterscheidbar (Kurs-Name als Badge/Tag)
  - [ ] Mehrere Lernpfade pro Klasse möglich (z.B. "Prüfungsvorbereitung" + "Zusatzaufgaben")
  - [ ] Lernpfad zeigt nur Lektionen die für den Schüler freigeschaltet sind (gesperrte Lektionen ausgegraut mit Hinweis)
  - [ ] Ohne Login oder ohne Klassenzugehörigkeit: keine Lernpfade sichtbar
  - [ ] Lehrer kann `published`-Status jederzeit im Dashboard togglen

### REQ-063: Manifest-Diff und Änderungserkennung

- **Status:** planned
- **Priorität:** P1
- **Größe:** M
- **Abhängig von:** REQ-058
- **Hinweis:** Wenn Kursinhalte sich ändern, müssen Lehrer und Dashboard sinnvoll darauf reagieren. Verwaiste Progress-/Unlock-Records dürfen nicht stillschweigend verschwinden.
- **Akzeptanzkriterien:**
  - [ ] Hub erkennt Manifest-Änderungen anhand des `buildHash`-Feldes
  - [ ] Bei Änderung wird ein Diff berechnet: neue Lektionen, gelöschte Lektionen, verschobene Lektionen
  - [ ] Dashboard zeigt Hinweis wenn Manifest-Änderungen vorliegen: "Kurs [X] wurde aktualisiert: N neue Lektionen, M entfernt"
  - [ ] Verwaiste Progress-Records (Lektion existiert nicht mehr im Manifest) werden in der Matrix mit Warnung-Icon markiert, nicht gelöscht
  - [ ] Verwaiste Unlock-Records werden im Freischaltungs-UI mit Hinweis markiert
  - [ ] Themengruppen (REQ-065) die gelöschte Lektionen enthalten zeigen Warnung

### REQ-064: sites.json Entschlackung (Manifest-First)

- **Status:** planned
- **Priorität:** P2
- **Größe:** S
- **Abhängig von:** REQ-062
- **Hinweis:** Aufräum-REQ. Wenn alle Sites Manifeste haben, kann `sites.json` auf Identitätsdaten reduziert werden. Module und Aufgabenzahlen kommen dann ausschließlich aus Manifesten.
- **Akzeptanzkriterien:**
  - [ ] `sites.json` enthält nur noch: slug, name, description, icon, base_path, framework_type, is_active, sort_order
  - [ ] `total_exercises` und `modules[]` sind aus `sites.json` entfernt
  - [ ] `SiteConfig`-TypeScript-Typ ist entsprechend verschlankt
  - [ ] Alle Hub-Konsumenten (Landing Page, Dashboard, Freischaltung) beziehen Modul- und Aufgabendaten ausschließlich aus Manifesten
  - [ ] Fallback bei fehlendem Manifest: Kurs wird angezeigt aber ohne Fortschrittsbalken/Matrix (statt Absturz)

### REQ-067: Skalierungs-Vorbereitung für 20+ Kurse

- **Status:** planned
- **Priorität:** P2
- **Größe:** M
- **Abhängig von:** REQ-058, REQ-062
- **Hinweis:** Architektur-Hardening für die Vision "deutlich mehr Lernsituationen". Nicht nötig für die aktuellen 6 Sites, aber verhindert spätere Umbauten.
- **Akzeptanzkriterien:**
  - [ ] `useManifests` lädt Manifeste lazy pro Kurs (nicht alle parallel beim App-Start)
  - [ ] Landing Page zeigt Kurs-Kacheln aus `sites.json`-Cache, Manifest wird erst bei Dashboard-Zugriff geladen
  - [ ] Dashboard Matrix-Kursfilter ist Pflichtfeld (keine "alle Kurse"-Option bei >10 Kursen)
  - [ ] Modul-Filter wird automatisch vorausgewählt (erstes Modul) wenn >20 Spalten
  - [ ] Virtualisiertes Scrolling für Matrizen mit >30 Spalten oder >50 Zeilen
  - [ ] Performance-Test: Dashboard mit 20 simulierten Kursen, 100 Schülern, 500 Aufgaben lädt in <3s

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
