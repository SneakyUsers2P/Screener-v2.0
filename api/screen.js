// api/trades-store.js — Trade Persistenz
// Verwendet Vercel KV oder In-Memory Fallback

// In-Memory Store als Fallback (wird bei jedem Deployment zurückgesetzt)
// Für Produktion: Vercel KV, PlanetScale oder Supabase verwenden
let inMemoryTrades = [];

function getStore() {
  // Vercel KV (wenn verfügbar) — optional erweitern
  // import { kv } from '@vercel/kv';
  return null; // Nutzt In-Memory Fallback
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Lade alle Trades
    return res.json({
      trades: inMemoryTrades,
      count: inMemoryTrades.length,
      openCount: inMemoryTrades.filter(t => t.status === 'open').length,
      closedCount: inMemoryTrades.filter(t => t.status === 'closed').length,
    });
  }

  if (req.method === 'POST') {
    // Speichere neue Trades
    const { trades } = req.body || {};
    if (trades) {
      inMemoryTrades = trades;
    }
    return res.json({ success: true, count: inMemoryTrades.length });
  }

  if (req.method === 'PUT') {
    // Update einzelnen Trade
    const { id, updates } = req.body || {};
    if (id && updates) {
      inMemoryTrades = inMemoryTrades.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
    }
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    // Lösche Trade
    const { id } = req.body || {};
    if (id) {
      inMemoryTrades = inMemoryTrades.filter(t => t.id !== id);
    }
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
