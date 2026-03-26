import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────
const VALID_USERS = {
  admin: 'trading2024',
  trader: 'password123',
};

const PRESET_PROMPTS = [
  {
    icon: '🚀',
    label: 'Breakout Kandidaten',
    desc: 'RSI < 30, hohes Volumen, nahe 52W-Hoch',
    prompt: 'Zeige Aktien mit RSI unter 30, überdurchschnittlichem Volumen und nahe ihrem 52-Wochen-Hoch — Breakout-Kandidaten nach meiner Strategie',
  },
  {
    icon: '📈',
    label: 'Swing Trade Setup',
    desc: 'Trendkanal-Ausbruch mit MACD-Bestätigung',
    prompt: 'Suche Aktien im Aufwärtstrend mit MACD-Crossover, RSI zwischen 40-60, die gerade aus einem Seitwärtstrend ausbrechen',
  },
  {
    icon: '💎',
    label: 'Oversold Reversal',
    desc: 'RSI < 25, Seitwärtstrend — Kauf-Signal',
    prompt: 'Finde stark überverkaufte Aktien mit RSI unter 25 in einem Seitwärtstrend — mein klassisches Kauf-Signal',
  },
  {
    icon: '⚡',
    label: 'Momentum Leader',
    desc: 'Starkes Momentum, hohes Volumen heute',
    prompt: 'Zeige die stärksten Momentum-Aktien heute mit überdurchschnittlichem Handelsvolumen und positivem Trend',
  },
  {
    icon: '🛡️',
    label: 'Sell-Signal Scan',
    desc: 'RSI > 75, fallender Trend — Verkaufszone',
    prompt: 'Scanne nach Aktien mit RSI über 75 in einem fallenden oder seitwärts Trend — meine Verkaufssignale',
  },
  {
    icon: '🔍',
    label: 'Tech Growth Stocks',
    desc: 'Wachstumsstärke im Technologiesektor',
    prompt: 'Analysiere die stärksten Technologie-Wachstumsaktien nach RSI, Volumen und Trendsignalen',
  },
];

// ──────────────────────────────────────────────
// HELPER COMPONENTS
// ──────────────────────────────────────────────
function TrendBadge({ trend }) {
  if (!trend) return null;
  const t = trend.toLowerCase();
  if (t.includes('bull') || t.includes('up') || t.includes('aufwärts') || t.includes('steigend'))
    return <span className="trend-badge trend-bullish">▲ Bullish</span>;
  if (t.includes('bear') || t.includes('down') || t.includes('abwärts') || t.includes('fallend'))
    return <span className="trend-badge trend-bearish">▼ Bearish</span>;
  return <span className="trend-badge trend-sideways">→ Seitwärts</span>;
}

function RSICell({ value }) {
  if (!value && value !== 0) return <span className="text-dim">—</span>;
  const cls = value < 30 ? 'rsi-low' : value > 70 ? 'rsi-high' : 'rsi-mid';
  return <span className={`rsi-cell ${cls}`}>{Number(value).toFixed(1)}</span>;
}

function formatVolume(v) {
  if (!v) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v;
}

function formatPrice(p) {
  if (!p && p !== 0) return '—';
  return '$' + Number(p).toFixed(2);
}

function formatPnL(v) {
  if (!v && v !== 0) return '—';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + '$' + n.toFixed(2);
}

function formatPercent(v) {
  if (!v && v !== 0) return '—';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function now() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ──────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (VALID_USERS[user] && VALID_USERS[user] === pass) {
      onLogin(user);
    } else {
      setError('Ungültige Anmeldedaten. Bitte erneut versuchen.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">AI TERMINAL</div>
        <div className="login-subtitle">Trading Intelligence System</div>
        <form onSubmit={handleSubmit}>
          <label className="login-label">Benutzername</label>
          <input
            className="login-input"
            type="text"
            value={user}
            onChange={e => { setUser(e.target.value); setError(''); }}
            autoFocus
            autoComplete="username"
          />
          <label className="login-label">Passwort</label>
          <input
            className="login-input"
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(''); }}
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit">Anmelden →</button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// TRADINGVIEW CHART
// ──────────────────────────────────────────────
function TradingViewChart({ ticker }) {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !ticker) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Europe/Berlin',
      theme: 'dark',
      style: '1',
      locale: 'de_DE',
      toolbar_bg: '#0a0f1e',
      enable_publishing: false,
      allow_symbol_change: true,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'EMA@tv-basicstudies'],
      container_id: 'tv_chart',
      backgroundColor: 'rgba(5, 9, 18, 1)',
      gridColor: 'rgba(26, 37, 64, 0.5)',
    });

    containerRef.current.id = 'tv_chart';
    containerRef.current.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [ticker]);

  return (
    <div className="chart-container" style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        className="tradingview-widget-container"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// PROBABILITY BAR
// ──────────────────────────────────────────────
function ProbBar({ label, value, type }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value || 0), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="prob-item">
      <span className="prob-label">{label}</span>
      <div className="prob-bar-bg">
        <div
          className={`prob-bar-fill ${type}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`prob-value ${type === 'bullish' ? 'text-green' : type === 'bearish' ? 'text-red' : 'text-accent'}`}>
        {value || 0}%
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// STOCK MODAL
// ──────────────────────────────────────────────
function StockModal({ stock, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: stock.ticker, stockData: stock }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalysis(data);
      } catch (e) {
        setError(e.message || 'Analyse fehlgeschlagen.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stock]);

  const signal = analysis?.signal || 'WATCH';
  const signalClass = {
    BUY: 'signal-buy',
    SELL: 'signal-sell',
    HOLD: 'signal-hold',
    WATCH: 'signal-watch',
  }[signal] || 'signal-watch';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="modal-ticker">{stock.ticker}</span>
            <span className="modal-name">{stock.name}</span>
            <span className="font-bold" style={{ fontSize: 16 }}>{formatPrice(stock.price)}</span>
            <span className={stock.change >= 0 ? 'change-positive' : 'change-negative'}>
              {formatPercent(stock.change)}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <TradingViewChart ticker={stock.ticker} />

          <div className="analysis-panel">
            {loading ? (
              <div className="loading-container" style={{ padding: 30 }}>
                <div className="loading-spinner" />
                <span className="loading-text">KI analysiert...</span>
              </div>
            ) : error ? (
              <div className="error-banner">{error}</div>
            ) : (
              <>
                <div className="analysis-section">
                  <div className="analysis-section-title">KI-Signal</div>
                  <div className={`signal-box ${signalClass}`}>
                    {signal === 'BUY' ? '▲ KAUFEN' : signal === 'SELL' ? '▼ VERKAUFEN' : signal === 'HOLD' ? '◆ HALTEN' : '◎ BEOBACHTEN'}
                  </div>
                </div>

                <div className="analysis-section">
                  <div className="analysis-section-title">Wahrscheinlichkeiten (7 Tage)</div>
                  <ProbBar label="Bullish" value={analysis?.probabilities?.bullish} type="bullish" />
                  <ProbBar label="Bearish" value={analysis?.probabilities?.bearish} type="bearish" />
                  <ProbBar label="Neutral" value={analysis?.probabilities?.sideways} type="sideways" />
                </div>

                <div className="analysis-section">
                  <div className="analysis-section-title">Kursziele</div>
                  <div className="targets-grid">
                    <div className="target-item">
                      <div className="target-label">Ziel Bullish</div>
                      <div className="target-value bullish">{formatPrice(analysis?.targets?.bullish)}</div>
                    </div>
                    <div className="target-item">
                      <div className="target-label">Ziel Bearish</div>
                      <div className="target-value bearish">{formatPrice(analysis?.targets?.bearish)}</div>
                    </div>
                    <div className="target-item">
                      <div className="target-label">Stop-Loss</div>
                      <div className="target-value bearish">{formatPrice(analysis?.targets?.stopLoss)}</div>
                    </div>
                    <div className="target-item">
                      <div className="target-label">Take-Profit</div>
                      <div className="target-value bullish">{formatPrice(analysis?.targets?.takeProfit)}</div>
                    </div>
                  </div>
                </div>

                {analysis?.levels && (
                  <div className="analysis-section">
                    <div className="analysis-section-title">Support / Resistance</div>
                    {analysis.levels.map((lvl, i) => (
                      <div className="sr-item" key={i}>
                        <span className={lvl.type === 'resistance' ? 'text-red' : 'text-green'} style={{ fontSize: 10, letterSpacing: 1 }}>
                          {lvl.type === 'resistance' ? '▲ WIDERSTAND' : '▼ SUPPORT'}
                        </span>
                        <span className="font-bold">{formatPrice(lvl.price)}</span>
                        <span className="text-dim" style={{ fontSize: 10 }}>{lvl.strength}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="analysis-section">
                  <div className="analysis-section-title">KI-Begründung</div>
                  <div className="reasoning-text">{analysis?.reasoning}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREENER TAB
// ──────────────────────────────────────────────
function ScreenerTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selected, setSelected] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const runScreen = async (q) => {
    const prompt = q || query;
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setShowMenu(false);
    try {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.stocks || []);
    } catch (e) {
      setError(e.message || 'Screener-Anfrage fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">KI Aktien-Screener</div>
      </div>

      <div className="screener-input-row">
        <input
          className="screener-input"
          type="text"
          placeholder="z.B. Zeige überverkaufte Aktien mit hohem Volumen nahe Unterstützung..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScreen()}
        />
        <button className="btn-primary" onClick={() => runScreen()} disabled={loading || !query.trim()}>
          {loading ? '...' : 'Scannen'}
        </button>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button className="btn-menu" onClick={() => setShowMenu(v => !v)}>···</button>
          {showMenu && (
            <div className="preset-menu">
              {PRESET_PROMPTS.map((p, i) => (
                <div
                  key={i}
                  className="preset-item"
                  onClick={() => { setQuery(p.prompt); runScreen(p.prompt); }}
                >
                  <span className="preset-icon">{p.icon}</span>
                  <div className="preset-text">
                    <strong>{p.label}</strong>
                    <span>{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="stock-table">
        <div className="table-header">
          <span>Ticker</span>
          <span>Unternehmen</span>
          <span>Kurs</span>
          <span>RSI</span>
          <span>Volumen</span>
          <span>Veränd.</span>
          <span>Trend</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">KI scannt Markt...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            Gib eine Suchanfrage ein oder wähle ein Preset
          </div>
        ) : (
          results.map((s, i) => (
            <div key={i} className="stock-row" onClick={() => setSelected(s)}>
              <span className="ticker">{s.ticker}</span>
              <span className="stock-name">{s.name}</span>
              <span className="price">{formatPrice(s.price)}</span>
              <RSICell value={s.rsi} />
              <span className="volume-cell">{formatVolume(s.volume)}</span>
              <span className={s.change >= 0 ? 'change-positive' : 'change-negative'}>
                {formatPercent(s.change)}
              </span>
              <TrendBadge trend={s.trend} />
            </div>
          ))
        )}
      </div>

      {selected && <StockModal stock={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ──────────────────────────────────────────────
// TRADING BOT TAB
// ──────────────────────────────────────────────
function BotTab() {
  const [trades, setTrades] = useState([]);
  const [logs, setLogs] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [trading, setTrading] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState('');
  const logRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-80), { time: now(), msg, type }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Load trades on mount
  useEffect(() => {
    fetch('/api/trades-store')
      .then(r => r.json())
      .then(d => { if (d.trades) setTrades(d.trades); })
      .catch(() => {});
  }, []);

  const runScanner = async () => {
    setScanning(true);
    setError('');
    addLog('KI-1 Markt-Scanner gestartet...', 'info');
    try {
      const res = await fetch('/api/screener-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScanResults(data.candidates || []);
      addLog(`KI-1 hat ${data.candidates?.length || 0} Kandidaten gefunden`, 'success');
      data.candidates?.forEach(c => addLog(`  → ${c.ticker}: ${c.reason}`, 'info'));
    } catch (e) {
      addLog('Scanner-Fehler: ' + e.message, 'error');
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const runTrader = async () => {
    if (scanResults.length === 0) {
      addLog('Bitte zuerst Scanner ausführen.', 'warning');
      return;
    }
    setTrading(true);
    setError('');
    addLog('KI-2 Trading-Bot gestartet...', 'trade');
    try {
      const res = await fetch('/api/trading-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: scanResults }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      data.actions?.forEach(a => {
        addLog(`[${a.action}] ${a.ticker} @ ${formatPrice(a.price)} — ${a.reason}`, 'trade');
      });
      if (data.trades) setTrades(data.trades);
      addLog('KI-2 Zyklus abgeschlossen.', 'success');
    } catch (e) {
      addLog('Trading-Bot-Fehler: ' + e.message, 'error');
      setError(e.message);
    } finally {
      setTrading(false);
    }
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const wins = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = closedTrades.length ? ((wins / closedTrades.length) * 100).toFixed(1) : '—';
  const totalPnL = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  const [tab, setTab] = useState('open');

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Trading Bot Dashboard</div>
      </div>

      <div className="perf-grid">
        <div className="perf-card">
          <div className="perf-value text-accent">{openTrades.length}</div>
          <div className="perf-label">Offene Trades</div>
        </div>
        <div className="perf-card">
          <div className="perf-value">{closedTrades.length}</div>
          <div className="perf-label">Abgeschlossen</div>
        </div>
        <div className="perf-card">
          <div className="perf-value text-green">{winRate}{winRate !== '—' ? '%' : ''}</div>
          <div className="perf-label">Win Rate</div>
        </div>
        <div className="perf-card">
          <div className={`perf-value ${totalPnL >= 0 ? 'text-green' : 'text-red'}`}>
            {totalPnL !== 0 ? formatPnL(totalPnL) : '$0.00'}
          </div>
          <div className="perf-label">Gesamt P&L</div>
        </div>
      </div>

      <div className="bot-grid">
        <div className="bot-card scanner">
          <div className="bot-title">KI-1 — Markt Scanner</div>
          <div className="bot-subtitle">Scannt globale Märkte nach deiner Strategie</div>
          <div className="bot-status">
            <span className={`status-dot ${scanning ? '' : ''}`} style={{ background: scanning ? 'var(--yellow)' : 'var(--accent)' }} />
            <span className={scanning ? 'text-accent' : 'text-dim'}>
              {scanning ? 'Scannt...' : scanResults.length > 0 ? `${scanResults.length} Kandidaten bereit` : 'Bereit'}
            </span>
          </div>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value text-accent">{scanResults.length}</div>
              <div className="stat-label">Kandidaten</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{scanResults.filter(c => c.signal === 'BUY').length}</div>
              <div className="stat-label">Buy-Signale</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{scanResults.filter(c => c.signal === 'SELL').length}</div>
              <div className="stat-label">Sell-Signale</div>
            </div>
          </div>
          {error && <div className="error-banner" style={{ marginBottom: 8 }}>⚠ {error}</div>}
          <button className="bot-run-btn" onClick={runScanner} disabled={scanning}>
            {scanning ? '⟳ Scanner läuft...' : '▶ Scanner starten'}
          </button>
        </div>

        <div className="bot-card trader">
          <div className="bot-title">KI-2 — Trading Bot</div>
          <div className="bot-subtitle">Paper-Trading basierend auf Scanner-Signalen</div>
          <div className="bot-status">
            <span className="status-dot" style={{ background: trading ? 'var(--green)' : 'var(--text-dim)', boxShadow: trading ? '0 0 6px var(--green)' : 'none' }} />
            <span className={trading ? 'bot-status-active' : 'text-dim'}>
              {trading ? 'Führt Trades aus...' : 'Warte auf Signale'}
            </span>
          </div>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value text-green">{wins}</div>
              <div className="stat-label">Wins</div>
            </div>
            <div className="stat-box">
              <div className="stat-value text-red">{closedTrades.length - wins}</div>
              <div className="stat-label">Losses</div>
            </div>
            <div className="stat-box">
              <div className={`stat-value ${totalPnL >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: 14 }}>
                {totalPnL !== 0 ? formatPnL(totalPnL) : '$0'}
              </div>
              <div className="stat-label">P&L</div>
            </div>
          </div>
          <button
            className={`bot-run-btn ${scanResults.length > 0 ? 'active' : ''}`}
            onClick={runTrader}
            disabled={trading || scanResults.length === 0}
          >
            {trading ? '⟳ Handelt...' : scanResults.length > 0 ? '▶ Bot starten' : '— Warte auf Scanner'}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 10, fontSize: 14 }}>System Log</div>
        <div className="log-feed" ref={logRef}>
          {logs.length === 0 && (
            <div className="text-dim" style={{ fontSize: 11 }}>Starte den Scanner um den Bot zu nutzen...</div>
          )}
          {logs.map((l, i) => (
            <div key={i} className="log-line">
              <span className="log-time">{l.time}</span>
              <span className={`log-${l.type}`}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trades */}
      <div>
        <div className="tab-row">
          <button className={`tab-btn ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
            Offen ({openTrades.length})
          </button>
          <button className={`tab-btn ${tab === 'closed' ? 'active' : ''}`} onClick={() => setTab('closed')}>
            Geschlossen ({closedTrades.length})
          </button>
        </div>

        <div className="trades-section">
          <div className="trades-table-header">
            <span>Ticker</span>
            <span>Strategie</span>
            <span>Einstieg</span>
            <span>Aktuell</span>
            <span>Stop-Loss</span>
            <span>Take-Profit</span>
            <span>P&L</span>
            <span>Status</span>
          </div>

          {(tab === 'open' ? openTrades : closedTrades).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{tab === 'open' ? '📊' : '📁'}</div>
              {tab === 'open' ? 'Keine offenen Trades' : 'Keine abgeschlossenen Trades'}
            </div>
          ) : (
            (tab === 'open' ? openTrades : closedTrades).map((t, i) => (
              <div key={i} className="trade-row">
                <span className="ticker">{t.ticker}</span>
                <span className="text-secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.strategy || '—'}
                </span>
                <span>{formatPrice(t.entryPrice)}</span>
                <span>{formatPrice(t.currentPrice)}</span>
                <span className="text-red">{formatPrice(t.stopLoss)}</span>
                <span className="text-green">{formatPrice(t.takeProfit)}</span>
                <span className={t.pnl >= 0 ? 'text-green' : 'text-red'}>{formatPnL(t.pnl)}</span>
                <span className={t.status === 'open' ? 'trade-status-open' : 'trade-status-closed'}>
                  {t.status === 'open' ? '◎ OFFEN' : '✓ FERTIG'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem('trading_user') || null);
  const [activeTab, setActiveTab] = useState('screener');

  const handleLogin = (u) => {
    sessionStorage.setItem('trading_user', u);
    setUser(u);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('trading_user');
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-container">
      <div className="topbar">
        <div className="topbar-logo">⬡ AI TERMINAL</div>
        <nav className="topbar-nav">
          <button className={`nav-btn ${activeTab === 'screener' ? 'active' : ''}`} onClick={() => setActiveTab('screener')}>
            Screener
          </button>
          <button className={`nav-btn ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}>
            Trading Bot
          </button>
        </nav>
        <div className="topbar-right">
          <div className="market-status">
            <div className="status-dot" />
            <span>Markets Live</span>
          </div>
          <span className="text-dim" style={{ fontSize: 11 }}>{user}</span>
          <button className="logout-btn" onClick={handleLogout}>Abmelden</button>
        </div>
      </div>

      <div className="content">
        {activeTab === 'screener' && <ScreenerTab />}
        {activeTab === 'bot' && <BotTab />}
      </div>
    </div>
  );
}
