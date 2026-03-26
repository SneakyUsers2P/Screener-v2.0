// api/screen.js — KI Aktien-Screener Endpoint
// Kombiniert Claude AI + Financial Modeling Prep

const Anthropic = require('@anthropic-ai/sdk');

const STRATEGY_CONTEXT = `
Du bist ein professioneller Trading-Analyst. Die Strategie des Nutzers:

KAUFSIGNALE:
- RSI unter 25 + Seitwärtstrend → Kaufen
- Breakout über Widerstand mit hohem Volumen → Kaufen

NICHT KAUFEN wenn:
- RSI über 75 + fallender oder seitwärts Trend

VERKAUFSSIGNALE:
- RSI über 75 + fallender Trend → Verkaufen

HALTEN:
- RSI unter 25 + Seitwärtstrend bei aktiver Position

Indikatoren: RSI, MACD, EMA, VWAP Auto-Anchored
Zeitrahmen: 1H–1D Chart, Swing Trading

Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen außerhalb des JSON.
`;

async function fetchFMPData(symbols) {
  const FMP_KEY = process.env.FMP_API_KEY;
  const results = [];

  for (const symbol of symbols.slice(0, 15)) {
    try {
      const [quoteRes, rsiRes] = await Promise.allSettled([
        fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?type=rsi&period=14&apikey=${FMP_KEY}`),
      ]);

      const quote = quoteRes.status === 'fulfilled' ? await quoteRes.value.json() : null;
      const rsiData = rsiRes.status === 'fulfilled' ? await rsiRes.value.json() : null;

      if (quote && quote[0]) {
        const q = quote[0];
        const rsi = rsiData && rsiData[0] ? rsiData[0].rsi : null;
        results.push({
          ticker: q.symbol,
          name: q.name,
          price: q.price,
          change: q.changesPercentage,
          volume: q.volume,
          avgVolume: q.avgVolume,
          rsi: rsi ? Math.round(rsi * 10) / 10 : null,
          high52: q.yearHigh,
          low52: q.yearLow,
          marketCap: q.marketCap,
        });
      }
    } catch (e) {
      // Skip failed symbols
    }
  }

  return results;
}

async function getSymbolsFromClaude(client, query) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${STRATEGY_CONTEXT}

Der Nutzer sucht: "${query}"

Antworte mit einem JSON-Array von 10-15 US-Aktientickern, die zu dieser Suchanfrage passen könnten.
Beispiel: {"symbols": ["AAPL", "MSFT", "NVDA", "AMD", "TSLA"]}

Nur das JSON, nichts anderes.`,
    }],
  });

  const text = msg.content[0]?.text || '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed.symbols || [];
}

async function analyzeWithClaude(client, query, stockData) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `${STRATEGY_CONTEXT}

Nutzeranfrage: "${query}"

Aktuelle Marktdaten:
${JSON.stringify(stockData, null, 2)}

Analysiere diese Aktien basierend auf der Strategie und der Suchanfrage.
Gib die besten Treffer zurück als JSON:

{
  "stocks": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "price": 180.50,
      "change": 1.25,
      "volume": 55000000,
      "rsi": 28.4,
      "trend": "bullish",
      "aiScore": 85,
      "matchReason": "RSI unter 30, Seitwärtstrend, Kauf-Signal nach Strategie"
    }
  ]
}

Sortiere nach Relevanz. Nur passende Aktien einschließen. Nur JSON.`,
    }],
  });

  const text = msg.content[0]?.text || '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query fehlt' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Step 1: Get candidate symbols from Claude
    const symbols = await getSymbolsFromClaude(client, query);

    if (symbols.length === 0) {
      return res.json({ stocks: [] });
    }

    // Step 2: Fetch real market data from FMP
    const stockData = await fetchFMPData(symbols);

    if (stockData.length === 0) {
      return res.json({ stocks: [] });
    }

    // Step 3: AI analysis with real data
    const result = await analyzeWithClaude(client, query, stockData);

    return res.json(result);
  } catch (e) {
    console.error('Screen API error:', e);
    return res.status(500).json({ error: e.message || 'Interner Fehler' });
  }
};
