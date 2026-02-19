# Lernplattform — Projektkontext

> Dünner Hub + Auth + Progress-Tracking + Dashboard um 5 bestehende Lern-Sites herum.
> Kein Monorepo, kein Framework-Wechsel. Die Sites bleiben eigenständig.

## Projektziel

Eine zentrale Lernplattform (`learn.szut.dev`) die 5 bestehende Lern-Websites unter einer Domain vereint, Login/Tracking ergänzt und Lehrern ein Dashboard bietet.

**Zielgruppe:** Berufsschüler (IT-Berufe) und deren Lehrer.

## Tech-Stack

| Komponente     | Technologie                                              |
| -------------- | -------------------------------------------------------- |
| Hub/Landing    | React + Vite + TypeScript + Tailwind CSS                 |
| Dashboard      | Teil der Hub-App (Route `/dashboard/`)                   |
| Backend        | PocketBase (Auth, API, Realtime)                         |
| Datenbank      | SQLite (via PocketBase)                                  |
| Shared Package | `@lernplattform/shared` (npm, React Hooks + Komponenten) |
| Reverse Proxy  | Nginx (Path-Routing im Stack)                            |
| TLS/Routing    | Traefik (bereits vorhanden auf Server)                   |
| Container      | Docker Compose                                           |
| Linting        | ESLint (mit TypeScript-Plugin)                           |
| Formatting     | Prettier                                                 |
| Sites          | 3× Astro/Starlight + React, 2× React SPA (Vite)          |

### Bestehende Sites

| Site          | Framework               | Subpfad    |
| ------------- | ----------------------- | ---------- |
| AP1-Trainer   | Astro/Starlight + React | `/ap1/`    |
| pandas-lernen | Astro/Starlight + React | `/pandas/` |
| REST/NoSQL    | Astro/Starlight + React | `/rest/`   |
| World of Zuul | Astro/Starlight + React | `/zuul/`   |
| NumPy         | React SPA (Vite)        | `/numpy/`  |
| UML           | React SPA (Vite)        | `/uml/`    |

## Konventionen

- **Sprache Code:** Englisch (Variablen, Funktionen, Kommentare)
- **Sprache UI:** Deutsch (Benutzeroberfläche, Texte, Fehlermeldungen)
- **Sprache Docs:** Deutsch (PRD, Agent-Artefakte, Commit-Messages)
- **Naming:** camelCase (TS/JS), kebab-case (Dateien/Ordner)
- **Responsive:** Mobile-First (Schüler nutzen Handys)
- **Security:** Kein Klarname-Zwang, DSGVO-konform, Server-Validierung

## Accessibility (a11y)

Jede UI-Komponente muss diese Anforderungen erfüllen:

- **Semantisches HTML:** Korrekte Heading-Hierarchie (h1 → h2 → h3), `<button>` statt `<div onClick>`, `<nav>`, `<main>`, `<aside>`, `<form>` etc.
- **ARIA-Labels:** Alle interaktiven Elemente brauchen aussagekräftige Labels (`aria-label`, `aria-labelledby`, `aria-describedby`)
- **Keyboard-Navigation:** Alle Aktionen per Tab + Enter/Space erreichbar, sichtbarer Focus-Ring, logische Tab-Reihenfolge
- **Farbkontrast:** Mindestens WCAG AA (4.5:1 für Text, 3:1 für große Texte und UI-Elemente)
- **Formulare:** Labels mit `htmlFor`/`id` verknüpft, Fehlermeldungen per `aria-invalid` + `aria-describedby`, Pflichtfelder mit `aria-required`
- **Zustandskommunikation:** Ladezustände (`aria-busy`), Live-Regionen für dynamische Updates (`aria-live`), Toggles mit `aria-pressed`/`aria-expanded`
- **Bilder/Icons:** Dekorative Icons mit `aria-hidden="true"`, funktionale Icons mit `aria-label`

## Testing

| Ebene                 | Tool                           | Zweck                                                                  |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Unit-Tests            | Vitest + React Testing Library | Hooks, Utility-Funktionen, Komponenten-Logik                           |
| Integrations-Tests    | Vitest + echter PocketBase     | Cross-Cutting-Concerns: Auth/Cookie/Multi-Provider-Interaktion         |
| E2E-Tests             | Playwright                     | User-Flows, Formular-Interaktionen, Cross-Page-Navigation              |
| Smoke-Tests           | Dev-Server + Docker + Playwright MCP | Echte Verifikation gegen laufenden Stack (PocketBase + Nginx)    |
| Visuelle Verifikation | Playwright MCP (im Agent-Loop) | Layout, Ausrichtung, Farben, Responsiveness                            |

**Regeln:**

- Jede neue Funktion/Hook bekommt mindestens einen Unit-Test
- Jeder User-Flow (Login, Registrierung, Progress-Tracking) bekommt einen E2E-Test
- Keine UI-Änderung ohne visuelle Verifikation via Playwright MCP im Agent-Loop
- Test-Dateien liegen neben dem Code: `foo.ts` → `foo.test.ts`, `Foo.tsx` → `Foo.test.tsx`
- E2E-Tests liegen in `e2e/` im jeweiligen App-Verzeichnis

**Mock-Grenzen:**

- **Erlaubt zu mocken:** Externe API-Calls (PocketBase SDK `pb.collection().getList()` etc.), Netzwerk-Requests, Browser-APIs (localStorage, fetch)
- **NICHT mocken:** Eigene Module (`CookieAuthStore`, Provider-Interaktion, Hook-Komposition). Diese werden real oder per Integrations-Test getestet.
- Wenn ein Test nur durch vollständiges Mocken eigener Module grün wird, fehlt ein Integrations-Test.

**Voraussetzungen (außer bei `SANDBOX_MODE=1`):**

- **Docker** muss laufen (PocketBase + Nginx Stack) — ohne Docker kein Smoke-Test, ohne Smoke-Test kein `done`
- **Playwright MCP** muss verfügbar sein — ohne Browser-Verifikation kein `done` für UI-REQs
- Unit-Tests allein reichen **nicht** für den Status `done` bei UI-REQs. Ein Smoke-Test gegen den echten Stack ist Pflicht.
- **`SANDBOX_MODE=1`:** Docker/Playwright-Checks entfallen. Build + Unit-Tests + Lint reichen für `done`.

## Modell-Strategie

- **Sonnet** (Hauptmodell): Code, Tests, Dateien editieren, Build/Test, Git
- **Opus** (via Task-Tool): Didaktische, architektonische, kreative und planerische Entscheidungen

Opus schreibt keinen Code — es liefert Entscheidungen und Pläne. Sonnet setzt um.

## Projektstruktur

```
lernplattform/
├── CLAUDE.md              # Dieses Dokument (Projektkontext)
├── AGENT.md               # Iterations-Prompt für den Agent-Loop
├── PRD.md                 # Requirements mit Status/Priorität/Abhängigkeiten
├── .agent/                # Agent-Artefakte (Kontext, Architektur, Log)
│   ├── context.md         # Kurzer Projektkontext (max 50 Zeilen, Rewrite)
│   ├── architecture.md    # Architektur-Entscheidungen (append-only ADRs)
│   ├── learnings.md       # Persistente Erkenntnisse (append-only)
│   ├── status.json        # Maschinenlesbarer REQ-Status (autoritativ für loop.sh)
│   └── iterations.jsonl   # Iterations-Log (JSONL, append)
├── loop.sh                # Shell-Orchestrator
├── docker-compose.yml     # Container-Stack (Nginx + PocketBase)
├── nginx.conf             # Path-Routing Konfiguration
├── pb_hooks/              # PocketBase Server-Hooks
├── packages/
│   └── shared/            # @lernplattform/shared npm Package
│       ├── src/
│       │   ├── auth/      # AuthProvider, useAuth, LoginBanner
│       │   ├── progress/  # useProgress, ProgressTracker, sync
│       │   ├── unlock/    # UnlockGate, SidebarUnlock, useUnlock
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── hub/               # Hub + Dashboard (Vite + React + Tailwind)
│       ├── src/
│       │   ├── pages/     # Landing, Login, Register, Dashboard
│       │   ├── components/
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── scripts/
│   ├── deploy.sh          # Deployment-Script
│   └── backup.sh          # Backup-Script
└── REQUIREMENTS.md        # Ursprüngliches Requirements-Dokument
```

## Referenz-Dokumente

| Datei                     | Zweck                             | Wann lesen                                           |
| ------------------------- | --------------------------------- | ---------------------------------------------------- |
| `PRD.md`                  | Requirements mit Status           | Jede Iteration (Phase 1)                             |
| `.agent/status.json`      | REQ-Status (autoritativ)          | Jede Iteration (Phase 1) — loop.sh liest nur hieraus |
| `.agent/context.md`       | Projektkontext (max 50 Zeilen)    | Jede Iteration (Phase 1)                             |
| `.agent/architecture.md`  | Architektur-Entscheidungen (ADRs) | Jede Iteration (Phase 1)                             |
| `.agent/learnings.md`     | Persistente Erkenntnisse          | Jede Iteration (Phase 1)                             |
| `.agent/iterations.jsonl` | Iterations-Log (JSONL)            | Bei Debugging/Analyse                                |
| `AGENT.md`                | Iterations-Ablauf                 | Wird als Prompt verwendet                            |
| `REQUIREMENTS.md`         | Vollständige Anforderungen        | Bei Detailfragen zu REQs                             |

## Wichtige Prinzipien

1. **Bestehende Sites nicht kaputt machen** — sie funktionieren, Schüler nutzen sie
2. **Inkrementell** — eine Site nach der anderen anbinden
3. **Minimal** — nur bauen was echten Wert hat
4. **Ohne Login nutzbar** — Gast-Modus = Status Quo (alles offen, kein Tracking)
5. **Local-First** — erst lokal entwickeln und testen, dann deployen
