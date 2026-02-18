# Lernplattform — Requirements

> Dünner Hub + Auth + Progress-Tracking + Dashboard um die bestehenden 5 Lern-Sites herum. Kein Monorepo, kein Framework-Wechsel. Die Sites bleiben eigenständig.

---

## 1. Überblick

### Ist-Zustand

5 separate Lern-Websites, eigenständig gehostet, kein Login, kein Tracking:

| Site          | Framework               | Repo                      | Besonderheiten                                  |
| ------------- | ----------------------- | ------------------------- | ----------------------------------------------- |
| AP1-Trainer   | Astro/Starlight + React | `AP1-Trainer`             | 8 Kapitel, ~22 Übungstypen, Zustand-Store       |
| pandas-lernen | Astro/Starlight + React | `pandas-lernen`           | 28 interaktive Komponenten, Pyodide, CodeMirror |
| REST/NoSQL    | Astro/Starlight + React | `rest_nosql_datenformate` | REST-API-Simulator, Live-Editoren               |
| NumPy         | React SPA (Vite)        | `numpy-lernsituation`     | Pyodide Web Worker, 17 Visualisierungen         |
| UML           | React SPA (Vite)        | `uml-site`                | 5 Diagramm-Builder, hat Achievement-System      |

### Ziel-Zustand

```
learn.szut.dev/
├── /                  ← Hub: Kurs-Kacheln + Login
├── /api/              ← PocketBase (Auth, Progress, Dashboard-Daten)
├── /dashboard/        ← Lehrer-Dashboard
├── /ap1/              ← AP1-Trainer (statischer Build)
├── /pandas/           ← pandas-lernen (statischer Build)
├── /rest/             ← REST/NoSQL (statischer Build)
├── /numpy/            ← NumPy (statischer Build)
└── /uml/              ← UML (statischer Build)
```

- Alles unter **einer Domain** auf eigenem Server
- Jede Site bleibt ein **eigenständiger Build** in eigenem Repo
- Eine **Shared-Komponente** (npm Package) für Auth + Progress + Unlock in jeder Site
- **PocketBase** als Backend für Auth, Progress-Daten und Dashboard

### Prinzipien

1. **Bestehende Sites nicht kaputt machen** — sie funktionieren, Schüler nutzen sie
2. **Inkrementell** — eine Site nach der anderen anbinden
3. **Minimal** — nur bauen was echten Wert hat
4. **Ohne Login nutzbar** — Gast-Modus = Status Quo (alles offen, kein Tracking)

---

## 2. Architektur

### 2.1 Infrastruktur

```
┌─────────────────────────────────────────────────┐
│                    Server                         │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  Traefik (bereits vorhanden, Let's Encrypt)│   │
│  │                                           │   │
│  │  learn.szut.dev/* → Lernplattform-Stack   │   │
│  └───────────────────────────────────────────┘   │
│          │                                        │
│          ▼                                        │
│  ┌───────────────────────────────────────────┐   │
│  │  Nginx (Container, Path-Routing)          │   │
│  │                                           │   │
│  │  /api/*  → PocketBase (:8090)             │   │
│  │  /ap1/*  → statische Files                │   │
│  │  /pandas/* → statische Files              │   │
│  │  /rest/* → statische Files                │   │
│  │  /numpy/* → statische Files               │   │
│  │  /uml/*  → statische Files                │   │
│  │  /*      → Hub (Landing + Dashboard)      │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌─────────────┐  ┌──────────────────────────┐   │
│  │ PocketBase  │  │  Sites (Volume)          │   │
│  │   + SQLite  │  │    hub/   ap1/   pandas/ │   │
│  │   + Hooks   │  │    rest/  numpy/ uml/    │   │
│  └─────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

| Komponente    | Technologie                 | Zweck                                              |
| ------------- | --------------------------- | -------------------------------------------------- |
| Reverse Proxy | Traefik (bereits vorhanden) | TLS-Terminierung, Routing zu Container             |
| Path-Routing  | Nginx (im Stack)            | Verteilt Requests auf PocketBase / statische Sites |
| Backend       | PocketBase                  | Auth, Progress-API, Realtime                       |
| Datenbank     | SQLite (via PocketBase)     | Users, Klassen, Progress                           |
| Sites         | Statische Builds            | Bestehende Lern-Sites, unveränderte Build-Outputs  |
| Hub           | Kleine React-App (Vite)     | Landing Page, Login, Kurs-Übersicht                |
| Dashboard     | Teil der Hub-App            | Lehrer-Matrix-Ansicht                              |

### 2.2 Shared-Komponente (`@lernplattform/shared`)

Ein npm Package das in jede Site eingebunden wird:

```
@lernplattform/shared/
├── src/
│   ├── auth/
│   │   ├── AuthProvider.tsx      # PocketBase Auth-Context
│   │   ├── LoginBanner.tsx       # "Melde dich an um Fortschritt zu speichern"
│   │   └── useAuth.ts            # Hook: isLoggedIn, user, login, logout
│   ├── progress/
│   │   ├── useProgress.ts        # Hook: reportComplete, getProgress
│   │   └── sync.ts               # Debounced Sync zu PocketBase
│   ├── unlock/
│   │   ├── UnlockGate.tsx        # Wrapper: zeigt 🔒 oder Content
│   │   ├── SidebarUnlock.tsx     # Sidebar-Icons (🔒/🔓/✅)
│   │   └── useUnlock.ts          # Hook: isUnlocked, prerequisites
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Integration in Starlight-Sites:**

```typescript
// astro.config.mjs (z.B. AP1-Trainer)
export default defineConfig({
  site: "https://learn.szut.dev/ap1",
  base: "/ap1",
  integrations: [
    starlight({
      /* ... */
    }),
    react(),
  ],
});
```

**Integration in React-SPAs (NumPy, UML):**

```tsx
// main.tsx
import { AuthProvider } from "@lernplattform/shared";

root.render(
  <AuthProvider apiUrl="https://learn.szut.dev/api">
    <App />
  </AuthProvider>,
);
```

### 2.3 Auth-Flow

```
Schüler öffnet learn.szut.dev
  → Sieht Kurs-Kacheln (alle sichtbar)
  → Klickt "Anmelden"
  → Gibt Klassen-Code ein (z.B. "FI24A3")
  → Gibt Username + PIN ein (z.B. "max.m" + "4271")
  → Cookie wird gesetzt auf .learn.szut.dev
  → Redirect zurück
  → Alle Sites unter learn.szut.dev/* erkennen den Login
```

**Ohne Login:** Alles funktioniert wie bisher. Kein Tracking, keine Locks. Gast-Modus.

**Mit Login:** Progress wird getrackt, Freischaltlogik greift, Fortschritt wird angezeigt.

---

## 3. Features

### 3.1 Auth & Klassen

| REQ     | Beschreibung                                                                             | Prio |
| ------- | ---------------------------------------------------------------------------------------- | ---- |
| AUTH-01 | Schüler-Registrierung: Klassen-Code + Username + 4-stelliger PIN                         | P0   |
| AUTH-02 | Lehrer erstellt Klasse → bekommt 6-stelligen Einladungscode                              | P0   |
| AUTH-03 | Lehrer erstellt Schüler-Accounts (alternativ: Schüler registrieren sich selbst mit Code) | P0   |
| AUTH-04 | Gast-Modus: Alles nutzbar ohne Login, kein Tracking                                      | P0   |
| AUTH-05 | Lehrer-Login mit Passwort                                                                | P0   |
| AUTH-06 | Session: Cookie auf `.learn.szut.dev`, 14 Tage gültig                                    | P0   |
| AUTH-07 | Lehrer kann PIN zurücksetzen                                                             | P1   |
| AUTH-08 | Lehrer kann Schüler zwischen Klassen verschieben                                         | P2   |
| AUTH-09 | Username-Validierung (Länge, keine Beleidigungen)                                        | P1   |
| AUTH-10 | DSGVO: Kein Klarname-Zwang, nur Username + Klassen-Zuordnung                             | P0   |

**Klassen-Code-Generierung:**

```
6 Zeichen, Großbuchstaben + Ziffern (ohne I/O/0/1)
Zeichensatz: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
Beispiel: "K7FN3X"
```

### 3.2 Progress-Tracking

| REQ     | Beschreibung                                                                           | Prio |
| ------- | -------------------------------------------------------------------------------------- | ---- |
| PROG-01 | Bestehender `exercise-complete` CustomEvent wird abgefangen und an PocketBase gemeldet | P0   |
| PROG-02 | Daten pro Aufgabe: status (started/completed), score, attempts, timestamp              | P0   |
| PROG-03 | Debounced Sync: gesammelt alle 30s oder bei Page-Visibility-Change                     | P0   |
| PROG-04 | Offline-tolerant: Queue in localStorage, Sync bei Reconnect                            | P1   |
| PROG-05 | Fortschrittsbalken pro Modul in der Sidebar                                            | P1   |
| PROG-06 | Kurs-Fortschritt auf Hub-Landing-Page (z.B. "AP1: 34% abgeschlossen")                  | P1   |

**Integration mit bestehendem ExerciseWrapper:**

Die meisten Sites dispatchen bereits `exercise-complete` CustomEvents. Die Shared-Komponente lauscht darauf:

```typescript
// @lernplattform/shared/progress/useProgress.ts
useEffect(() => {
  const handler = (e: CustomEvent) => {
    const { exerciseId, score, maxScore } = e.detail;
    reportProgress({
      course: getCurrentCourse(), // aus URL: /ap1/ → "ap1"
      lesson: getCurrentLesson(), // aus URL: /ap1/netzwerktechnik/subnetting → "netzwerktechnik/subnetting"
      exercise: exerciseId,
      status: "completed",
      score,
      maxScore,
    });
  };
  window.addEventListener("exercise-complete", handler);
  return () => window.removeEventListener("exercise-complete", handler);
}, []);
```

**Für Sites ohne CustomEvent:** Wrapper-Funktion die manuell aufgerufen wird.

### 3.3 Freischaltlogik

| REQ       | Beschreibung                                                                                 | Prio |
| --------- | -------------------------------------------------------------------------------------------- | ---- |
| UNLOCK-01 | Zwei Modi: **Lehrergesteuert** (Default) und **automatisch** (optional)                      | P0   |
| UNLOCK-02 | Lehrergesteuert: Lehrer schaltet Module pro Klasse frei/sperrt                               | P0   |
| UNLOCK-03 | Automatisch (optional): Prerequisites in Frontmatter, Soft-Gate (Warnung, kein harter Block) | P1   |
| UNLOCK-04 | Drei Zustände: 🔒 gesperrt, 🔓 freigeschaltet, ✅ abgeschlossen                              | P0   |
| UNLOCK-05 | Gesperrte Lektionen: Sichtbar in Sidebar mit 🔒, Klick zeigt Hinweis was fehlt               | P0   |
| UNLOCK-06 | Innerhalb eines freigeschalteten Moduls: alles offen                                         | P0   |
| UNLOCK-07 | Ohne Login: alles offen (Gast-Modus = kein Lock)                                             | P0   |

**Lehrergesteuertes Freischalten:**

```
Lehrer-Dashboard:
  Klasse: FI24a
  Kurs: AP1-Trainer

  ✅ Modul 1: IT-Grundlagen        [sperren]
  ✅ Modul 2: Netzwerktechnik      [sperren]
  🔓 Modul 3: Datenbanken          [sperren]
  🔒 Modul 4: Programmierung       [freischalten]
  🔒 Modul 5: IT-Sicherheit        [freischalten]
  ...
```

Der Lehrer klickt "freischalten" → PocketBase speichert → nächster Seitenaufruf der Schüler zeigt Modul als offen.

**Automatisches Freischalten (Soft-Gate):**

```yaml
# Frontmatter in MDX (optional)
---
title: Subnetting
prerequisites:
  - netzwerktechnik/ip-adressierung
---
```

Wenn Prerequisites nicht erfüllt: gelber Hinweis oben auf der Seite ("Wir empfehlen zuerst: IP-Adressierung"), Content ist trotzdem sichtbar. Kein harter Block.

### 3.4 Lehrer-Dashboard

| REQ     | Beschreibung                                                                           | Prio |
| ------- | -------------------------------------------------------------------------------------- | ---- |
| DASH-01 | Matrix-Ansicht: Schüler (Zeilen) × Aufgaben (Spalten), farbcodiert                     | P0   |
| DASH-02 | Farbcode: ✅ geschafft (grün), ❌ versucht+falsch (orange), ⬜ nicht angefangen (grau) | P0   |
| DASH-03 | Aggregat-Zeile: "X% der Klasse hat diese Aufgabe geschafft"                            | P0   |
| DASH-04 | Filter: nach Klasse, nach Kurs, nach Modul                                             | P0   |
| DASH-05 | Klick auf Zelle → Detail: Anzahl Versuche, Score, Zeitpunkt                            | P1   |
| DASH-06 | Modul-Freischaltung pro Klasse (Buttons)                                               | P0   |
| DASH-07 | Klassen-Verwaltung: Erstellen, Code anzeigen, Schüler-Liste                            | P0   |
| DASH-08 | Schüler-Verwaltung: PIN zurücksetzen, Klasse wechseln                                  | P1   |

**Mockup Dashboard-Matrix:**

```
FI24a → AP1-Trainer → Netzwerktechnik

             | IP-Adr. | Subnetz | OSI    | TCP/IP | DNS   |
Max M.       |   ✅    |   ✅    |   ✅   |   ❌   |  ⬜   |
Lisa K.      |   ✅    |   ✅    |   ✅   |   ✅   |  ✅   |
Tom S.       |   ✅    |   ❌    |   ⬜   |   ⬜   |  ⬜   |
Anna B.      |   ✅    |   ✅    |   ✅   |   ✅   |  ⬜   |
─────────────┼─────────┼─────────┼────────┼────────┼───────┤
Klasse       |  100%   |   75%   |   75%  |   50%  |  25%  |
```

**Das ist die eine Ansicht die den meisten Wert liefert.** Mehr braucht es für Phase 1 nicht.

### 3.5 Hub / Landing Page

| REQ    | Beschreibung                                                       | Prio |
| ------ | ------------------------------------------------------------------ | ---- |
| HUB-01 | Kurs-Kacheln mit Titel, Beschreibung, Icon, Fortschrittsbalken     | P0   |
| HUB-02 | Login/Registrierung (Klassen-Code + Username + PIN)                | P0   |
| HUB-03 | Profil-Bereich: "Hallo Max! Du hast 34 von 120 Aufgaben geschafft" | P1   |
| HUB-04 | Responsive: funktioniert auf Handy (Schüler in der Bahn)           | P0   |
| HUB-05 | Ohne Login: Kacheln ohne Fortschritt, direkter Link zu den Sites   | P0   |

---

## 4. Datenbank-Schema (PocketBase Collections)

### users (Auth Collection)

```
id              TEXT PK       (auto)
username        TEXT UNIQUE   "max.m"
pin_hash        TEXT          bcrypt-Hash des 4-stelligen PINs
role            TEXT          "student" | "teacher"
class_id        RELATION      → classes
display_name    TEXT          optional, für Lehrer-Ansicht
created         DATETIME      (auto)
updated         DATETIME      (auto)
```

### classes

```
id              TEXT PK       (auto)
name            TEXT          "FI24a"
join_code       TEXT UNIQUE   "K7FN3X"
school_year     TEXT          "2025/26"
is_active       BOOL          true
created_by      RELATION      → users (teacher)
created         DATETIME      (auto)
```

### course_unlocks

```
id              TEXT PK       (auto)
class_id        RELATION      → classes
course          TEXT          "ap1"
module          TEXT          "netzwerktechnik"
is_unlocked     BOOL          true
unlocked_by     RELATION      → users (teacher)
unlocked_at     DATETIME
```

### progress

```
id              TEXT PK       (auto)
user_id         RELATION      → users
course          TEXT          "ap1"
lesson          TEXT          "netzwerktechnik/subnetting"
exercise        TEXT          "subnetting-01"
status          TEXT          "started" | "completed"
score           INT           Punkte
max_score       INT           Maximale Punkte
attempts        INT           Anzahl Versuche
completed_at    DATETIME
created         DATETIME      (auto)
updated         DATETIME      (auto)

UNIQUE(user_id, course, lesson, exercise)
```

### PocketBase API Rules

```
// progress
listRule:   @request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role = "teacher")
createRule: @request.auth.id != "" && user_id = @request.auth.id
updateRule: @request.auth.id != "" && user_id = @request.auth.id

// course_unlocks
listRule:   @request.auth.id != ""
createRule: @request.auth.role = "teacher"
updateRule: @request.auth.role = "teacher"

// classes
listRule:   @request.auth.id != ""
createRule: @request.auth.role = "teacher"
```

---

## 5. Server-Setup

### Docker Compose

Traefik läuft bereits auf dem Server. Die Lernplattform ist ein eigener Stack der sich bei Traefik per Labels registriert.

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./sites:/srv/sites:ro
    depends_on:
      - pocketbase
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.lernplattform.rule=Host(`learn.szut.dev`)"
      - "traefik.http.routers.lernplattform.entrypoints=websecure"
      - "traefik.http.routers.lernplattform.tls.certresolver=letsencrypt"
      - "traefik.http.services.lernplattform.loadbalancer.server.port=80"
    networks:
      - traefik
      - default

  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    volumes:
      - pb_data:/pb/pb_data
      - ./pb_hooks:/pb/pb_hooks
    healthcheck:
      test:
        ["CMD", "wget", "-q", "--spider", "http://localhost:8090/api/health"]
      interval: 30s
    networks:
      - default

volumes:
  pb_data:

networks:
  traefik:
    external: true
```

> **Hinweis:** Der Netzwerk-Name `traefik` muss dem externen Traefik-Netzwerk auf dem Server entsprechen. Ggf. anpassen (z.B. `proxy`, `web`).

### nginx.conf

```nginx
server {
    listen 80;
    server_name learn.szut.dev;

    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # PocketBase API + Admin
    location /api/ {
        proxy_pass http://pocketbase:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /_/ {
        proxy_pass http://pocketbase:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Statische Sites
    location /ap1/ {
        alias /srv/sites/ap1/;
        try_files $uri $uri/ /ap1/index.html;
    }
    location /pandas/ {
        alias /srv/sites/pandas/;
        try_files $uri $uri/ /pandas/index.html;
    }
    location /rest/ {
        alias /srv/sites/rest/;
        try_files $uri $uri/ /rest/index.html;
    }
    location /numpy/ {
        alias /srv/sites/numpy/;
        try_files $uri $uri/ /numpy/index.html;
    }
    location /uml/ {
        alias /srv/sites/uml/;
        try_files $uri $uri/ /uml/index.html;
    }

    # Hub (Fallback)
    location / {
        root /srv/sites/hub;
        try_files $uri $uri/ /index.html;
    }
}
```

### Deployment

Empfehlung: **GitHub Actions** pro Repo. Bei Push auf `main` → Build → rsync/scp zum Server in den passenden `sites/`-Ordner.

```yaml
# .github/workflows/deploy.yml (Beispiel für AP1-Trainer)
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci && npm run build
      - name: Deploy to Server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/opt/lernplattform/sites/ap1/"
          strip_components: 1
          rm: true
```

Alternativ: Manuell per Script vom lokalen Rechner:

```bash
#!/bin/bash
# deploy.sh <site-name>
set -euo pipefail
SITE=${1:?Usage: deploy.sh <ap1|pandas|rest|numpy|uml|hub>}
npm ci && npm run build
rsync -az --delete dist/ "server:/opt/lernplattform/sites/$SITE/"
echo "✅ $SITE deployed"
```

### Backup

```bash
#!/bin/bash
# backup.sh — Täglich per Cron: 0 3 * * *
DATE=$(date +%Y-%m-%d)
docker compose exec -T pocketbase sqlite3 /pb/pb_data/data.db ".backup /pb/pb_data/backup.db"
docker compose cp pocketbase:/pb/pb_data/backup.db "/opt/backups/lernplattform_${DATE}.db"
gzip "/opt/backups/lernplattform_${DATE}.db"
find /opt/backups -name "lernplattform_*.db.gz" -mtime +30 -delete
```

---

## 6. Anti-Cheat (Pragmatisch)

| REQ    | Beschreibung                                                         | Prio |
| ------ | -------------------------------------------------------------------- | ---- |
| SEC-01 | Server-seitige Validierung: User kann nur eigenen Progress schreiben | P0   |
| SEC-02 | Status kann nur aufsteigen (started → completed), nie zurück         | P0   |
| SEC-03 | Rate-Limiting: Max 60 Progress-Events pro Stunde pro User            | P0   |
| SEC-04 | Plausibilitäts-Flag: wenn >5 Aufgaben/Minute → `suspicious: true`    | P1   |
| SEC-05 | Dashboard zeigt verdächtige Einträge mit ⚠️                          | P1   |

**Kein harter Schutz gegen localStorage-Manipulation** — das ist bei Client-Side-Tracking nicht möglich. Aber:

- Progress wird nur vom **Server akzeptiert** (nicht aus localStorage kopiert)
- Der Server prüft ob der Request vom eingeloggten User kommt
- Unrealistisch schnelle Completion wird geflaggt

**Pädagogischer Ansatz:** IT-Berufsschüler die das Tracking austricksen haben immerhin was über API-Security gelernt. 😄

---

## 7. DSGVO

| Maßnahme             | Details                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| Hosting              | Eigener Server, Deutschland                                                        |
| AVV                  | Auftragsverarbeitungsvertrag mit Server-Hoster abschließen                         |
| Datenminimierung     | Nur Username + PIN + Klasse + Progress. Kein Klarname, keine E-Mail, keine IP-Logs |
| Einwilligung         | Formular für Erziehungsberechtigte bei Minderjährigen (< 16)                       |
| Löschkonzept         | Accounts werden am Schuljahresende gelöscht                                        |
| Datenschutzerklärung | Auf der Landing Page verlinkt                                                      |
| Verschlüsselung      | TLS 1.3 (Traefik/Let's Encrypt), bcrypt für PINs                                   |
| Zugriff              | Schüler sehen nur eigene Daten, Lehrer sehen nur eigene Klassen                    |

**Zu erstellen (einmalig):**

1. Verarbeitungsverzeichnis (1-2 Seiten)
2. Datenschutzerklärung für die Website
3. Einwilligungsformular für Eltern
4. Kurze TOM-Dokumentation

---

## 8. Änderungen an bestehenden Sites

### Pro Starlight-Site (AP1, Pandas, REST):

1. **`@lernplattform/shared` als Dependency** hinzufügen
2. **Astro-Config:** `base` auf Subpfad setzen (`/ap1/`, `/pandas/`, `/rest/`)
3. **Layout erweitern:** `AuthProvider` + `ProgressTracker` einbinden
4. **Sidebar:** `SidebarUnlock` Komponente für 🔒/🔓/✅ Icons
5. **ExerciseWrapper:** Falls `exercise-complete` Event nicht vorhanden → hinzufügen

```typescript
// astro.config.mjs — Änderung pro Site
export default defineConfig({
  base: "/ap1", // NEU
  integrations: [
    starlight({
      /* ... */
    }),
    react(),
  ],
});
```

```astro
<!-- src/components/Layout.astro — Ergänzung -->
<AuthProvider apiUrl="/api" client:load>
  <ProgressTracker course="ap1" client:load />
  <slot />
</AuthProvider>
```

### Pro React-SPA (NumPy, UML):

1. **`@lernplattform/shared` als Dependency**
2. **Vite-Config:** `base` auf Subpfad setzen
3. **Root-Komponente:** `AuthProvider` wrappen
4. **Router:** `basename` auf Subpfad setzen

```typescript
// vite.config.ts — Änderung
export default defineConfig({
  base: "/numpy", // NEU
});
```

### Geschätzter Aufwand pro Site:

- Starlight-Sites: **2-3 Tage** (Astro-Config, Shared-Komponente einbinden, Sidebar-Unlock, testen)
- React-SPAs: **1-2 Tage** (einfacher, kein Starlight-Layout)

---

## 9. Umsetzungsplan (Local-First Entwicklung)

### Phase 1 — Lokales Backend + Shared Package (2-3 Abende)

**PocketBase lokal aufsetzen:**

1. PocketBase Binary herunterladen → `./pocketbase serve`
2. Admin-UI aufrufen (`localhost:8090/_/`), Admin-Account anlegen
3. Collections anlegen: `users`, `classes`, `course_unlocks`, `progress`
4. API Rules setzen, testen mit Browser/Postman
5. Basis-Hooks schreiben (Klassen-Code-Validierung)

**Shared Package erstellen:**
Neues Repo: `@lernplattform/shared`

1. PocketBase JS-SDK einbinden
2. `AuthProvider` + `useAuth` Hook (login, logout, isLoggedIn, user)
3. `useProgress` Hook (reportComplete, getProgress)
4. `ProgressTracker` Komponente (lauscht auf `exercise-complete` Events)
5. `useUnlock` Hook (isModuleUnlocked für aktuelle Klasse)
6. Lokal linken: `npm link` oder `file:../shared` Dependency

**Ergebnis:** PocketBase läuft lokal, Shared Package ist bereit

---

### Phase 2 — Hub-App entwickeln (1 Wochenende)

Neues Repo: `lernplattform-hub` (Vite + React + TypeScript + Tailwind)

1. Landing Page: 5 Kurs-Kacheln mit Beschreibung + Icon (statisch erstmal)
2. Login-Seite: Klassen-Code → Username + PIN
3. Registrierungs-Seite: Klassen-Code eingeben → Account erstellen
4. Nach Login: Kacheln zeigen Fortschrittsbalken (Dummy-Daten)
5. Profil-Bereich: "Hallo Max, 34/120 Aufgaben geschafft"
6. Link zum Dashboard (nur für Lehrer sichtbar)
7. Lokal testen: `npm run dev` → `localhost:5173`

**Ergebnis:** Hub läuft lokal, Login/Registrierung funktioniert gegen lokales PocketBase

---

### Phase 3 — Dashboard entwickeln (1 Wochenende)

Teil der Hub-App (eigene Route `/dashboard/`)

1. Klassen-Verwaltung: Klasse erstellen, Code anzeigen, Schüler-Liste
2. Matrix-Ansicht: Schüler × Aufgaben (✅/❌/⬜) — erst mit Mock-Daten
3. Aggregat-Zeile: Prozent pro Aufgabe
4. Filter: Klasse → Kurs → Modul
5. Modul-Freischaltung: Toggle-Buttons pro Modul pro Klasse
6. PIN-Reset für Schüler

**Ergebnis:** Dashboard funktional, getestet mit Mock-Daten und Test-Klasse

---

### Phase 4 — Erste Site anbinden: AP1-Trainer (3-4 Abende)

Im bestehenden `AP1-Trainer` Repo:

1. `@lernplattform/shared` als lokale Dependency
2. Lokalen Dev-Server so konfigurieren dass PocketBase erreichbar (CORS beachten)
3. `AuthProvider` im Layout einbinden
4. Prüfen ob `exercise-complete` Events überall gefeuert werden — ggf. nachrüsten
5. `ProgressTracker` einbinden → Events gehen an lokales PocketBase
6. Sidebar erweitern: 🔒/🔓/✅ Icons basierend auf Unlock-Status + Progress
7. Fortschrittsbalken pro Modul in der Sidebar
8. **Lokal testen:** Hub + AP1-Trainer zusammen laufen lassen
9. Mit Test-User durchklicken, Progress prüfen

**Ergebnis:** AP1-Trainer funktioniert lokal mit Auth + Tracking + Freischaltung

---

### Phase 5 — Restliche Sites anbinden (je 1-2 Abende pro Site)

Gleicher Ablauf wie Phase 4, in dieser Reihenfolge:

1. **pandas-lernen** — hat viele Übungstypen, guter zweiter Test
2. **REST/NoSQL** — ähnlich wie AP1/Pandas (Starlight)
3. **NumPy** — React-SPA, anderer Integrationspfad (kein Starlight)
4. **UML** — React-SPA, hat bereits Achievement-System (ggf. umbauen)

Pro Site:

- `@lernplattform/shared` lokal einbinden
- Dev-Server konfigurieren (CORS, API-URL)
- Events prüfen/nachrüsten
- Lokal mit Hub testen

**Ergebnis:** Alle 5 Sites laufen lokal, komplett integriert

---

### Phase 6 — Server-Deployment (1-2 Abende)

**Jetzt erst die Infrastruktur:**

1. Auf dem Server: Ordner `/opt/lernplattform/` anlegen
2. `docker-compose.yml` + `nginx.conf` aus dem Requirements-Doc deployen
3. `docker compose up -d` → PocketBase + Nginx laufen
4. Traefik routet `learn.szut.dev` → Nginx-Container
5. PocketBase Admin-UI aufrufen (`learn.szut.dev/_/`), Admin-Account anlegen
6. Schema + Hooks vom lokalen Setup übertragen
7. Alle Sites mit Production-URLs (`learn.szut.dev`) builden und deployen
8. **Erster Test mit echter Klasse!**

**Ergebnis:** `learn.szut.dev` ist live, alles funktioniert

---

### Phase 7 — Polish + Produktion (fortlaufend)

- Backup-Cron einrichten
- Monitoring aufsetzen (UptimeRobot)
- Offline-Queue testen und härten
- Anti-Cheat Plausibilitätschecks in PocketBase-Hooks
- Mobile UX optimieren
- DSGVO-Docs schreiben (Datenschutzerklärung, Verarbeitungsverzeichnis)
- Feedback von Schülern einbauen

---

### Timeline (realistisch, abends/Wochenende)

```
Woche 1:  Phase 1 (PocketBase lokal + Shared Package)
Woche 2:  Phase 2 (Hub-App lokal)
Woche 3:  Phase 3 (Dashboard lokal)
Woche 4:  Phase 4 (AP1-Trainer anbinden, alles lokal)
Woche 5:  Phase 5a (Pandas + REST lokal)
Woche 6:  Phase 5b (NumPy + UML lokal)
Woche 7:  Phase 6 (Server-Deployment, Go-Live)
Woche 8+: Phase 7 (Polish + Produktion)
```

**Vorteile des Local-First-Ansatzes:**

- Kein Server nötig bis alles funktioniert
- Schnelles Iterieren ohne Deployment
- Geringeres Risiko (lokale Entwicklung kann nicht die Produktion brechen)
- **Nach Woche 6 hast du ein vollständiges System** — lokal getestet und bereit für Deployment

---

## 10. Kosten

Server und Domain sind bereits vorhanden (`learn.szut.dev`, Traefik + Let's Encrypt). Zusätzliche Kosten:

| Posten                              | Monatlich |
| ----------------------------------- | --------- |
| Server (bereits vorhanden)          | €0,00     |
| Domain (bereits vorhanden)          | €0,00     |
| UptimeRobot (Monitoring, Free Tier) | €0,00     |
| **Zusätzliche Kosten**              | **€0,00** |

Die Lernplattform verbraucht minimal Ressourcen (PocketBase + Nginx + statische Files). Einziger relevanter Faktor ist Speicherplatz für die SQLite-DB und Backups.

---

## 11. Risiken & Mitigierung

| Risiko                                    | Wahrscheinlichkeit | Impact  | Mitigierung                                 |
| ----------------------------------------- | ------------------ | ------- | ------------------------------------------- |
| Starlight-Update bricht Shared-Komponente | Mittel             | Mittel  | Pinned Versions, vor Update testen          |
| PocketBase-Projekt wird aufgegeben        | Niedrig            | Hoch    | Dünne API-Schicht → leicht ersetzbar        |
| Schüler manipulieren Progress             | Hoch               | Niedrig | Server-Validierung + Plausibilitäts-Flags   |
| Server fällt aus                          | Niedrig            | Hoch    | Tägliche Backups, Recovery < 30 Min         |
| Zu viele gleichzeitige User               | Sehr niedrig       | Mittel  | SQLite + PocketBase handelt 500 User locker |

---

## 12. Was bewusst NICHT drin ist

| Feature                        | Warum nicht                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| XP-System                      | Aufwand-Nutzen-Verhältnis schlecht. Fortschrittsbalken + Freischaltung sind die eigentliche Motivation |
| Badges/Achievements            | Cargo-Cult-Gamification. Funktioniert nicht bei Pflichtveranstaltungen                                 |
| Leaderboard                    | Quasi Mobbing-Infrastruktur in Klassenkontext                                                          |
| Streaks                        | Sinnlos bei Pflichtunterricht                                                                          |
| Präsentationsmodus             | CSS-Toggle (`?present=true`) reicht, kein eigenes Feature                                              |
| Monorepo-Migration             | Zu riskant, zu aufwendig, kein zusätzlicher Nutzen für Schüler                                         |
| Server-seitige Code-Ausführung | Nice-to-have für Phase 3+, nicht MVP                                                                   |
| SSO/LDAP                       | Jede Schule hat andere Systeme, Rabbit Hole                                                            |

---

## 13. Offene Entscheidungen

- [x] **Domain:** `learn.szut.dev` ✅
- [ ] **Subpfade:** `/ap1/` oder `/kurse/ap1/`?
- [ ] **Pilotklasse:** Welche Klasse testet zuerst?
- [ ] **Welche Site zuerst?** Empfehlung: AP1-Trainer (am meisten genutzt, am besten strukturiert)
