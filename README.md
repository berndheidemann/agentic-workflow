# Agentic Workflow

Ein Framework für autonome, iterative Softwareentwicklung mit Claude Code.

Der Agent arbeitet in einem 6-Phasen-Modell ein Requirement nach dem anderen ab, dokumentiert Entscheidungen, lernt aus Fehlern und verifiziert jede Iteration mit echten Browser-Tests.

## Konzept

```
┌─────────────────────────────────────────────────────────┐
│                    loop.sh (Orchestrator)                │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────┐ │
│  │  Orient   │──▶│ Preflight│──▶│  Opus-Planning (M)  │ │
│  │ Phase 1   │   │ Phase 2  │   │    Phase 2.5        │ │
│  └──────────┘   └──────────┘   └─────────────────────┘ │
│       ▲                              │                   │
│       │         ┌──────────┐   ┌──────────┐             │
│       │         │  Persist │◀──│Implement │             │
│       │         │ Phase 5  │   │ Phase 3  │             │
│       │         └──────────┘   └──────────┘             │
│       │              ▲               │                   │
│       │              │         ┌──────────┐             │
│       └──────────────┘◀────────│  Verify  │             │
│                                │ Phase 4  │             │
│                                └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Die 6 Phasen

| Phase | Name | Was passiert |
|-------|------|-------------|
| 1 | **Orient** | Agent liest Kontext, wählt nächstes REQ (Priorität + Abhängigkeiten) |
| 2 | **Preflight** | Build, Tests, Lint — alles grün? Playwright erreichbar? |
| 2.5 | **Opus-Planning** | Für M-sized REQs: Opus erstellt Architekturplan + User Journeys |
| 3 | **Implement** | Code + Tests schreiben, Checkpoint-Commit |
| 4 | **Verify** | Build + Tests + Lint + Smoke-Test im Browser |
| 5 | **Persist** | Artefakte updaten, Git Commit, Status finalisieren |

### Modell-Strategie

- **Sonnet** implementiert: Code, Tests, Dateien, Git
- **Opus** plant und reviewt: Architektur, Security, Validation

## Schnellstart

### 1. Repository klonen und anpassen

```bash
git clone https://github.com/DEIN-USER/agentic-workflow.git mein-projekt
cd mein-projekt
```

### 2. Dateien anpassen

1. **`CLAUDE.md`** — Projektkontext, Tech-Stack, Konventionen anpassen
2. **`PRD.md`** — Eigene Requirements eintragen
3. **`AGENT.md`** — Bei Bedarf Phasen anpassen (meist reicht es wie es ist)

### 3. Agent-Artefakte initialisieren

Die `.agent/`-Dateien werden beim ersten Lauf automatisch aus `PRD.md` generiert:

```bash
# Optional: Kontext manuell anlegen
echo "# Agent Context\n\n> Neues Projekt, noch keine Iteration gelaufen." > .agent/context.md
```

### 4. Loop starten

```bash
# Unbegrenzt (bis alle REQs done)
./loop.sh

# Max 5 Iterationen
./loop.sh 5

# Sandbox-Modus (ohne Docker)
SANDBOX_MODE=1 ./loop.sh
```

## Dateistruktur

```
agentic-workflow/
├── README.md                  # Diese Datei
├── loop.sh                    # Shell-Orchestrator (Hauptprogramm)
├── AGENT.md                   # Iterations-Prompt für den Agent
├── CLAUDE.md.example          # Vorlage: Projektkontext & Konventionen
├── PRD.md.example             # Vorlage: Requirements mit Status
├── .agent/                    # Agent-Artefakte (werden zur Laufzeit gefüllt)
│   ├── context.md.example     # Vorlage: Projektkontext (max 50 Zeilen)
│   ├── architecture.md.example# Vorlage: ADR-Log (append-only)
│   ├── learnings.md.example   # Vorlage: Erkenntnisse (append-only)
│   └── status.json.example    # Vorlage: REQ-Status (autoritativ)
├── examples/                  # Fertige Beispiele aus echtem Projekt
│   ├── context.md             # Beispiel-Kontext nach 45 REQs
│   ├── architecture.md        # 19 echte ADRs
│   ├── learnings.md           # 400+ Zeilen Erkenntnisse
│   ├── status.json            # 45 REQs mit Status
│   └── PRD.md                 # Echte PRD mit 45 REQs
└── presentation/
    └── index.html             # Interaktive Präsentation des Workflows
```

## Konfiguration

### Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `ITER_TIMEOUT` | 1800 (30 min) | Timeout pro Iteration in Sekunden |
| `SAFE_BRANCH` | 1 | Automatisch Agent-Branch erstellen wenn auf main |
| `SANDBOX_MODE` | 0 | Docker-Checks überspringen |
| `FULL_VERIFY` | 0 | Full Verification erzwingen |
| `VALIDATE_INTERVAL` | 5 | Opus-Validation alle N Iterationen |
| `VALIDATOR_TIMEOUT` | 2400 (40 min) | Timeout für Validation-Iterationen |

### Dateien

| Datei | Zweck | Wer schreibt |
|-------|-------|-------------|
| `AGENT.md` | Iterations-Prompt | Du (einmalig) |
| `CLAUDE.md` | Projektkontext | Du (einmalig + Updates) |
| `PRD.md` | Requirements | Du (initial), Agent (Status-Updates) |
| `.agent/status.json` | REQ-Status (autoritativ) | Agent |
| `.agent/context.md` | Aktueller Kontext (50 Zeilen) | Agent (jede Iteration neu) |
| `.agent/architecture.md` | Architektur-Entscheidungen | Agent (append-only) |
| `.agent/learnings.md` | Persistente Erkenntnisse | Agent (append-only) |
| `.agent/iterations.jsonl` | Iterations-Log | loop.sh (automatisch) |

## Wie es funktioniert

### Requirements schreiben

Requirements folgen einem festen Format in `PRD.md`:

```markdown
### REQ-001: Feature-Name

- **Status:** open
- **Priorität:** P0
- **Größe:** S
- **Abhängig von:** —
- **Akzeptanzkriterien:**
  - [ ] Kriterium 1
  - [ ] Kriterium 2
```

**Status-Werte:** `open` → `in_progress` → `done` | `blocked`

**Prioritäten:** `P0` (kritisch) > `P1` (wichtig) > `P2` (nice-to-have)

**Größen:** `S` (klein, <1h) | `M` (mittel, 1-4h)

### S-Batching

Kleine REQs (Größe S) mit gleicher Priorität und ohne gegenseitige Abhängigkeit werden automatisch gebatcht — bis zu 3 pro Iteration.

### Abhängigkeiten

Der Agent respektiert Abhängigkeiten: Ein REQ wird erst bearbeitet wenn alle `Abhängig von`-REQs den Status `done` haben.

### Crash Recovery

- `loop.sh` erkennt `in_progress`-REQs von abgebrochenen Iterationen und setzt sie auf `open`
- WIP-Checkpoint-Commits sichern Zwischenstände
- `status.json` wird atomar geschrieben (Temp-Datei + mv)

### Validation Loop

Alle N Iterationen (Default: 5) läuft eine Opus-Validation:
- Prüft ob `done`-REQs wirklich funktionieren
- Analysiert Agent-Logs auf Regelumgehungen
- Kann REQs zurücksetzen (`done` → `open`) oder blocken

## Präsentation

Die interaktive Präsentation erklärt den Workflow visuell:

```bash
# Lokaler Webserver
cd presentation
python3 -m http.server 8080
# Dann http://localhost:8080 öffnen
```

## Tipps

- **Starte mit wenigen P0-REQs** — der Agent arbeitet sie der Reihe nach ab
- **Abhängigkeiten nutzen** — der Agent respektiert sie, also bau einen sinnvollen DAG
- **S-REQs bevorzugen** — kleinere Einheiten = bessere Iteration = weniger Timeouts
- **Learnings lesen** — `.agent/learnings.md` enthält Gold nach ein paar Iterationen
- **Präsentation zeigen** — hilft dem Team den Workflow zu verstehen

## Voraussetzungen

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installiert und authentifiziert
- `jq` installiert (`brew install jq` / `apt install jq`)
- `bash` 4+ (macOS: `brew install bash`)
- Optional: Docker (für Stack-Tests)
- Optional: Playwright MCP (für Browser-Verifikation)

## Lizenz

MIT
