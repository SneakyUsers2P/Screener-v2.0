// api/analyze.js — KI Preisanalyse Endpoint
// Liefert Wahrscheinlichkeiten, Kursziele, Support/Resistance, Signal

const Anthropic = require('@anthropic-ai/sdk');

const STRATEGY_PROMPT = `
Du bist ein erfahrener Trading-Analyst und verwendest folgende Swing-Trading-Strategie:

KAUFSIGNALE:
- RSI unter 25 + Seitwärtstrend → BUY
- Breakout über Widerstand mit hohem Volumen → BUY

NICHT KAUFEN:
- RSI über 75 + fallender oder seitwärts Trend → HOLD oder WATCH

VERKAUFSSIGNALE:
- RSI über 75 + fallender Trend → SELL

HALTEN:
- RSI unter 25 + Seitwärtstrend bei aktiver Position → HOLD

Indikatoren: RSI, MACD, EMA, VWAP Auto-Anchored
Zeitrahmen: 1H-1D, Swing Trading

Analysiere die gegebenen Daten und liefere eine präzise, professionelle Analyse.
Antworte NUR mit validem JSON ohne Markdown.
`;

async function fetchAdditionalData(ticker) {
  const FMP_KEY = process.env.FMP_API_KEY;
  const results = {};

  try {
    const [quoteRes, histRes, rsiRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?timeseries=30&apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${ticker}?type=rsi&period=14&apikey=${FMP_KEY}`),
    ]);

    if (quoteRes.status === 'fulfilled') {
      const d = await quoteRes.value.json();
      results.quote = d[0] || null;
    }

    if (histRes.status === 'fulfilled') {
      const d = await histRes.value.json();
      results.history = d.historical?.slice(0, 30) || [];
    }

    if (rsiRes.status === 'fulfilled') {
      const d = await rsiRes.value.json();
      results.rsi = d.slice(0, 14) || [];
    }
  } catch (e) {
    console.error('FMP fetch error:', e);
  }

  return results;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ticker, stockData } = req.body || {};
  if (!ticker) return res.status(400).json({ error: 'Ticker fehlt' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Fetch additional market data
    const marketData = await fetchAdditionalData(ticker);

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `${STRATEGY_PROMPT}

Analysiere die Aktie: ${ticker}

Bekannte Daten vom Screener:
${JSON.stringify(stockData || {}, null, 2)}

Aktuelle Marktdaten:
${JSON.stringify(marketData, null, 2)}

Erstelle eine vollständige Analyse und antworte mit diesem JSON-Format:
{
  "signal": "BUY" | "SELL" | "HOLD" | "WATCH",
  "probabilities": {
    "bullish": 65,
    "bearish": 20,
    "sideways": 15
  },
  "targets": {
    "bullish": 195.00,
    "bearish": 165.00,
    "stopLoss": 168.50,
    "takeProfit": 192.00
  },
  "levels": [
    { "type": "resistance", "price": 190.00, "strength": "stark" },
    { "type": "support", "price": 170.00, "strength": "mittel" },
    { "type": "support", "price": 162.00, "strength": "schwach" }
  ],
  "reasoning": "Detaillierte Begründung auf Deutsch basierend auf RSI, Trend, Volumen und der Strategie. 2-3 Sätze."
}

Kursziele müssen realistisch sein (basierend auf aktuellem Kurs ±5-15%).
Nur JSON, kein Markdown.`,
      }],
    });

    const text = msg.content[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);

    return res.json(analysis);
  } catch (e) {
    console.error('Analyze API error:', e);
    return res.status(500).json({ error: e.message || 'Analyse fehlgeschlagen' });
  }
};
