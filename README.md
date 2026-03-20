# Bucki - Immobilien-Verwaltungs-App

Eine moderne, lokale Immobilien-Verwaltungs-App für die Verwaltung von Immobilien, Einheiten, Mietern, Finanzen und mehr.

## Features

- **Dashboard** - Übersicht aller wichtigen Kennzahlen
- **Immobilien** - Verwaltung Ihrer Immobilien
- **Einheiten** - Verwaltung der Wohneinheiten
- **Mieter** - Mieterverwaltung mit Verträgen
- **Finanzen** - Einnahmen und Ausgaben
- **Finanzierung** - Kreditverwaltung
- **Abschreibungen** - AfA-Berechnungen
- **Hausgelder** - Nebenkostenverwaltung
- **Dokumente** - Dokumentenablage
- **Aufgaben** - Aufgabenverwaltung
- **Reports** - Auswertungen und Berichte

## Technologie

- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (State Management)
- Recharts (Charts)
- Lucide Icons

## Installation

### Voraussetzungen

- Node.js 18+ oder Bun
- npm, yarn, pnpm oder bun

### Lokale Installation

```bash
# Repository klonen
git clone https://github.com/DEIN-USERNAME/bucki.git
cd bucki

# Dependencies installieren
npm install
# oder
bun install

# Entwicklungsserver starten
npm run dev
# oder
bun run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

## Vercel Deployment

1. Repository auf GitHub hochladen
2. Bei Vercel anmelden: https://vercel.com
3. "New Project" → GitHub Repository auswählen
4. Deploy klicken

Keine Umgebungsvariablen erforderlich - alle Daten werden lokal im Browser gespeichert!

## Daten-Export/Import

Die App speichert alle Daten lokal im Browser (localStorage). Sie können:

- **Export**: Alle Daten als JSON-Datei exportieren
- **Import**: Daten aus JSON-Datei importieren
- **Reset**: Auf Demo-Daten zurücksetzen

## Lizenz

MIT License
