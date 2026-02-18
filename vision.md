# Lernplattform — Vision

> Zuletzt aktualisiert: 2026-02-18

## Kernvision

Eine **erweiterbare Lernplattform**, die verschiedenste Lernsituationen unter einem Dach vereint. Die Plattform schafft den Rahmen — die Inhalte kommen aus eigenständigen Projekten.

## Zentrale Säulen

### 1. Universeller Rahmen für Lernsituationen

Die Plattform ist **nicht auf die aktuellen 6 Sites beschränkt**. Sie muss so gebaut sein, dass zukünftig deutlich mehr Lernsituationen einfach eingebunden werden können — unabhängig von Framework, Technologie oder Inhaltstyp.

**Bestehende Lernsituationen (Ausgangslage):**

| Lernsituation | Repo            | Typ                    |
| ------------- | --------------- | ---------------------- |
| AP1-Trainer   | `AP1-Trainer`   | Astro/Starlight + React |
| pandas-lernen | `pandas-lernen` | Astro/Starlight + React |
| REST/NoSQL    | `rest_noSQL_datenformate` | Astro/Starlight + React |
| World of Zuul | `lf05_worldOfZuul`        | Docusaurus (Migration → Astro/Starlight geplant) |
| UML           | `uml-site`      | React SPA (Vite)       |
| NumPy         | `numpy-lernsituation` | React SPA (Vite) |

Es werden **zukünftig deutlich mehr** Lernsituationen. Die Architektur muss das tragen.

### 2. Schrittweises Freischalten von Inhalten

Zwei Mechanismen, die zusammenspielen:

- **Definierter Lernpfad:** Module/Lektionen bauen aufeinander auf. Inhalte werden schrittweise freigeschaltet, basierend auf Fortschritt oder Lehrerentscheidung.
- **Manuelles Freischalten:** Lehrer können gezielt für **Klassen** und/oder **einzelne Schüler** Inhalte freischalten oder sperren.

Die Granularität (Kurs → Modul → Lektion → Aufgabe) soll flexibel sein.

### 3. Fortschritts-Tracking

Transparente Übersicht für alle Beteiligten:

- **Schüler** sehen ihren eigenen Fortschritt (pro Kurs, pro Modul)
- **Lehrer** sehen den Fortschritt ihrer Klassen in einer Matrix-Ansicht
- Tracking ist **optional** — ohne Login funktioniert alles wie bisher (Gast-Modus)

### 4. Erweiterbarkeit für zukünftige Features

Die Plattform soll **offen für sinnvolle Erweiterungen** sein, die für Lernplattformen typisch sind. Dazu gehören potenziell:

- Differenzierte Aufgabentypen und Bewertungssysteme
- Adaptive Lernpfade (basierend auf Schülerleistung)
- Gruppen-/Projektarbeit-Features
- Export von Leistungsdaten
- Benachrichtigungen (Lehrer wird informiert wenn Klasse Modul abgeschlossen hat)
- Integration externer Tools (IDEs, Jupyter, etc.)
- Analytics und Lernstandsdiagnose
- Peer-Review und Feedback-Mechanismen

**Nicht alles muss jetzt gebaut werden** — aber die Architektur darf diese Wege nicht verbauen.

## Abgrenzung

- **Kein LMS im klassischen Sinne** (kein Moodle-Ersatz) — sondern ein leichtgewichtiger Rahmen um bestehende, eigenständige Lern-Sites
- **Kein Monorepo** — jede Lernsituation bleibt eigenständig
- **Kein Gamification-Overkill** — kein XP, keine Badges, kein Leaderboard
- **Kein SSO/LDAP** — einfache Auth (Klassen-Code + Username + PIN)
- Die Sites **funktionieren ohne Plattform** weiter (Gast-Modus)
