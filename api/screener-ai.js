// api/trading-bot.js — KI-2 Trading Bot
// Paper-Trading Engine: entscheidet basierend auf KI-1 Signalen

const Anthropic = require('@anthropic-ai/sdk');

// In-Memory Paper Portfolio
let paperPortfolio = {
  cash: 100000, // Start-Kapital: $100,000
  trades: [],
  totalTrades: 0,
};

const TRADING_SYSTEM = `
Du bist KI-2, ein automatischer Paper-Trading-Bot für Swing-Trading.

Deine Aufgabe: Entscheide basierend auf KI-1 Scanner-Signalen, welche Trades du eingehst, aktualisierst oder schließt.

TRADING-REGELN:
1. Maximal 5 offene Positionen gleichzeitig
2. Risiko pro Trade: maximal 2% des Portfolios
3. Position Size: (Portfolio × 2%) / (Einstieg - Stop-Loss)
4. Nur BUY-Signale kaufen, SELL-Signale bei offenen Positionen schließen
5. Stop-Loss immer setzen
6. Take-Profit bei 2:1 Risk-Reward Minimum

ENTSCHEIDUNGSLOGIK:
- BUY Signal + freie Slot + genug Cash → Trade öffnen
- SELL Signal + offene Position → Position schließen
- Offene Position hat Stop-Loss getroffen → Schließen (Verlust)
- Offene Position hat Take-Profit → Schließen (Gewinn)

Antworte nur mit validem JSON, kein Markdown.
`;

function generateId() {
  return 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function calculatePnL(trade, currentPrice) {
  const direction = trade.direction || 'long';
  if (direction === 'long') {
    return (currentPrice - trade.entryPrice) * trade.shares;
  }
  return (trade.entryPrice - currentPrice) * trade.shares;
}

function checkExitConditions(trade, currentPrice) {
  if (!currentPrice) return null;

  // Stop-Loss getroffen
  if (trade.stopLoss && currentPrice <= trade.stopLoss) {
    return { reason: 'stop_loss', exitPrice: trade.stopLoss };
  }

  // Take-Profit getroffen
  if (trade.takeProfit && currentPrice >= trade.takeProfit) {
    return { reason: 'take_profit', exitPrice: trade.takeProfit };
  }

  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { candidates } = req.body || {};
  if (!candidates || !Array.isArray(candidates)) {
    return res.status(400).json({ error: 'Candidates fehlen' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const openTrades = paperPortfolio.trades.filter(t => t.status === 'open');
    const openSlots = 5 - openTrades.length;

    // Auto-check exit conditions for open trades
    const autoExits = [];
    for (const trade of openTrades) {
      const candidate = candidates.find(c => c.ticker === trade.ticker);
      const currentPrice = candidate?.price || trade.currentPrice;

      const exit = checkExitConditions(trade, currentPrice);
      if (exit) {
        autoExits.push({ trade, exit, currentPrice });
      }
    }

    // Ask AI for trading decisions
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: TRADING_SYSTEM,
      messages: [{
        role: 'user',
        content: `Aktueller Portfolio-Status:
- Cash: $${paperPortfolio.cash.toFixed(2)}
- Offene Positionen: ${openTrades.length}/5
- Freie Slots: ${openSlots}
- Gesamtkapital ca: $${(paperPortfolio.cash + openTrades.reduce((s, t) => s + t.entryPrice * t.shares, 0)).toFixed(2)}

Offene Trades:
${JSON.stringify(openTrades, null, 2)}

KI-1 Scanner-Signale (neue Kandidaten):
${JSON.stringify(candidates, null, 2)}

Automatische Stop/TP-Exits:
${JSON.stringify(autoExits.map(e => ({ ticker: e.trade.ticker, reason: e.exit.reason, price: e.exit.exitPrice })), null, 2)}

Entscheide welche Aktionen durchzuführen sind und antworte mit:
{
  "actions": [
    {
      "action": "BUY" | "SELL" | "CLOSE_SL" | "CLOSE_TP" | "HOLD",
      "ticker": "AAPL",
      "price": 180.50,
      "shares": 10,
      "stopLoss": 172.00,
      "takeProfit": 196.00,
      "strategy": "RSI Oversold Reversal",
      "reason": "Kurze Begründung der Entscheidung"
    }
  ]
}

Maximal ${openSlots} neue BUY-Orders. Nur sinnvolle Aktionen, kein HOLD wenn keine offene Position. Nur JSON.`,
      }],
    });

    const text = msg.content[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const decisions = JSON.parse(clean);

    // Execute trading decisions
    const executedActions = [];

    for (const action of (decisions.actions || [])) {
      if (action.action === 'BUY') {
        const cost = action.price * action.shares;
        if (paperPortfolio.cash >= cost && openTrades.length < 5) {
          const newTrade = {
            id: generateId(),
            ticker: action.ticker,
            direction: 'long',
            entryPrice: action.price,
            currentPrice: action.price,
            shares: action.shares,
            stopLoss: action.stopLoss,
            takeProfit: action.takeProfit,
            strategy: action.strategy || 'AI Strategy',
            reason: action.reason,
            status: 'open',
            pnl: 0,
            entryTime: new Date().toISOString(),
          };
          paperPortfolio.trades.push(newTrade);
          paperPortfolio.cash -= cost;
          paperPortfolio.totalTrades++;
          executedActions.push({ ...action, executed: true });
        }
      } else if (['SELL', 'CLOSE_SL', 'CLOSE_TP'].includes(action.action)) {
        const tradeIdx = paperPortfolio.trades.findIndex(
          t => t.ticker === action.ticker && t.status === 'open'
        );
        if (tradeIdx !== -1) {
          const trade = paperPortfolio.trades[tradeIdx];
          const exitPrice = action.price || trade.currentPrice;
          const pnl = calculatePnL(trade, exitPrice);
          const proceeds = exitPrice * trade.shares;

          paperPortfolio.trades[tradeIdx] = {
            ...trade,
            status: 'closed',
            exitPrice,
            exitTime: new Date().toISOString(),
            pnl: Math.round(pnl * 100) / 100,
            currentPrice: exitPrice,
          };
          paperPortfolio.cash += proceeds;
          executedActions.push({ ...action, pnl, executed: true });
        }
      }
    }

    // Update current prices for open trades
    paperPortfolio.trades = paperPortfolio.trades.map(trade => {
      if (trade.status !== 'open') return trade;
      const candidate = candidates.find(c => c.ticker === trade.ticker);
      if (candidate?.price) {
        return {
          ...trade,
          currentPrice: candidate.price,
          pnl: Math.round(calculatePnL(trade, candidate.price) * 100) / 100,
        };
      }
      return trade;
    });

    return res.json({
      actions: executedActions,
      trades: paperPortfolio.trades,
      portfolio: {
        cash: Math.round(paperPortfolio.cash * 100) / 100,
        totalTrades: paperPortfolio.totalTrades,
        openTrades: paperPortfolio.trades.filter(t => t.status === 'open').length,
      },
    });
  } catch (e) {
    console.error('[KI-2] Fehler:', e);
    return res.status(500).json({ error: e.message || 'Trading-Bot-Fehler' });
  }
};
