# ⬡ AI Trading Terminal

KI-gestütztes Swing-Trading Dashboard mit Claude AI, TradingView Charts und echten Börsendaten.

## Features

- **KI Aktien-Screener** — Freitext + Preset-Prompts, echte Marktdaten via FMP
- **TradingView Chart** — RSI, MACD, EMA direkt im Modal
- **KI Preisanalyse** — Wahrscheinlichkeiten, Kursziele, Support/Resistance
- **Trading Bot** — KI-1 scannt, KI-2 handelt Paper-Trades automatisch
- **Login-Schutz** — Benutzername/Passwort

## Tech Stack

- React 18 (Create React App)
- Vercel Serverless Functions
- Anthropic Claude Sonnet 4
- Financial Modeling Prep API
- NewsAPI
- TradingView Widget

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Vercel CLI installieren (für API-Routen lokal)
npm install -g vercel

# 3. Umgebungsvariablen setzen
cp .env.example .env.local
# Dann .env.local mit deinen Keys befüllen

# 4. Lokal starten
vercel dev
```

## Umgebungsvariablen

Setze diese in Vercel Dashboard → Settings → Environment Variables:

| Variable | Beschreibung |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Von console.anthropic.com |
| `FMP_API_KEY` | Von financialmodelingprep.com |
| `NEWS_API_KEY` | Von newsapi.org |

## Login-Daten (Standard)

| Benutzer | Passwort |
|---------|----------|
| admin | trading2024 |
| trader | password123 |

> ⚠️ Für Produktion: Passwörter in `src/App.js` → `VALID_USERS` ändern!

## Deployment auf Vercel

```bash
# 1. GitHub Repository erstellen und pushen
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DEIN-USERNAME/ai-trading-terminal.git
git push -u origin main

# 2. Vercel verbinden
# → vercel.com → New Project → GitHub Repo importieren
# → Environment Variables setzen
# → Deploy klicken
```

## Trading-Strategie

**Swing Trading mit Trendkanal-Strategie**

- **Kauf**: RSI < 25 + Seitwärtstrend ODER Breakout über Widerstand mit hohem Volumen
- **Nicht kaufen**: RSI > 75 + fallender/seitwärts Trend  
- **Verkauf**: RSI > 75 + fallender Trend
- **Halten**: RSI < 25 + Seitwärtstrend bei aktiver Position
- **Indikatoren**: RSI, MACD, EMA, VWAP Auto-Anchored
- **Zeitrahmen**: 1H-1D Chart

## Datei-Struktur

```
ai-trading-terminal/
├── public/
│   └── index.html          # HTML + Google Fonts
├── src/
│   ├── App.js              # Haupt-React-App
│   ├── App.css             # Dark Terminal Theme
│   └── index.js            # Entry Point
├── api/
│   ├── screen.js           # Screener API (Claude + FMP)
│   ├── analyze.js          # Chart-Analyse API
│   ├── screener-ai.js      # KI-1 Scanner Bot
│   ├── trading-bot.js      # KI-2 Trading Bot
│   └── trades-store.js     # Trade-Persistenz
├── package.json
├── vercel.json
└── .gitignore
```
