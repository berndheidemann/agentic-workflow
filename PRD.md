# Lernplattform — Product Requirements

> Status-Tracking für den Agent-Loop. Der Agent ändert nur Status-Felder und Checkboxen.

## Implizite Anforderungen (gelten für ALLE UI-Requirements)

Jedes REQ das UI erzeugt oder ändert muss zusätzlich zu seinen expliziten Akzeptanzkriterien folgende Anforderungen erfüllen. Diese werden **nicht** einzeln in den REQs aufgelistet, sind aber Pflicht:

- **a11y:** Semantisches HTML, ARIA-Labels, Keyboard-navigierbar, Fokus-Ring sichtbar, Farbkontrast WCAG AA (siehe CLAUDE.md)
- **Unit-Tests:** Mindestens ein Test pro neuer Funktion/Hook/Komponente (Vitest + React Testing Library). Mocks nur für externe APIs (PocketBase SDK Calls, fetch), **nicht** für eigene Module.
- **Integrations-Tests:** Cross-Cutting-Concerns (Auth/Cookie/Provider-Interaktion) werden mit echten Modulen getestet, nicht vollständig gemockt.
- **E2E-Tests:** Ein Playwright-Test pro User-Flow — **PFLICHT** für jedes UI-REQ, keine Ausnahmen.
- **Smoke-Test:** Verifikation gegen echten Stack (Docker + Playwright MCP). **Ohne bestandenen Smoke-Test kein `done`.**
- **Responsive:** Funktioniert auf Mobile (375px) und Desktop (1280px)
- **Visuelle Verifikation:** Agent prüft via Playwright MCP: Ausrichtung, Abstände, Farben, Lesbarkeit, keine Überlappungen
- **Voraussetzungen:** Docker (PocketBase + Nginx) und Playwright MCP müssen verfügbar sein. Fehlt eines → REQ ist `blocked`, nicht `done`.

---

## Phase 1: Infrastruktur & Shared Package

### REQ-001: Projektstruktur initialisieren

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** —
- **Akzeptanzkriterien:**
  - [ ] Monorepo-Struktur mit `packages/shared/` und `apps/hub/`
  - [ ] Root `package.json` mit Workspaces
  - [ ] TypeScript-Konfiguration (tsconfig.json)
  - [ ] `.gitignore` korrekt konfiguriert

### REQ-002: PocketBase Docker-Setup

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-001
- **Akzeptanzkriterien:**
  - [ ] `docker-compose.yml` mit PocketBase + Nginx Services
  - [ ] `nginx.conf` mit Path-Routing für alle Sites + API
  - [ ] PocketBase startet und ist unter `/api/` erreichbar
  - [ ] Admin-UI unter `/_/` erreichbar
  - [ ] Health-Check konfiguriert

### REQ-003: PocketBase Schema anlegen

- **Status:** open
- **Priorität:** P0
- **Größe:** M
- **Abhängig von:** REQ-002
- **Akzeptanzkriterien:**
  - [ ] Collection `users` (Auth): username, role, class_id, display_name (pin_hash entfällt — PocketBase password-Feld übernimmt Hashing)
  - [ ] Collection `classes`: name, join_code, school_year, is_active, created_by
  - [ ] Collection `course_unlocks`: class_id, course, module, is_unlocked, unlocked_by, unlocked_at
  - [ ] Collection `progress`: user_id, course, lesson, exercise, status, score, max_score, attempts, completed_at
  - [ ] UNIQUE-Constraint auf progress (user_id, course, lesson, exercise)
  - [ ] API Rules korrekt gesetzt (siehe REQUIREMENTS.md Abschnitt 4)

### REQ-004: Shared Package Grundstruktur

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** REQ-001
- **Akzeptanzkriterien:**
  - [ ] `packages/shared/package.json` mit korrektem Namen `@lernplattform/shared`
  - [ ] TypeScript + React als Peer-Dependencies
  - [ ] Build-Konfiguration (tsup)
  - [ ] `src/index.ts` mit Exports
  - [ ] Package ist von `apps/hub` importierbar

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
  - [ ] 5 Kurs-Kacheln mit Titel, Beschreibung und Icon
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
- **Hinweis:** Quell-Repo liegt in `sites/zuul/` (Docusaurus). Ziel: Astro/Starlight-Projekt wie AP1/pandas/REST.
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
- **Hinweis:** Erfordert Zugriff auf die Repos `pandas-lernen` und `rest_nosql_datenformate`
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
  - [ ] Deploy-Script validiert Site-Name (ap1|pandas|rest|zuul|numpy|uml|hub)

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
