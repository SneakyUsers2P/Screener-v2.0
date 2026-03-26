import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const VALID_USERS = {
  admin: 'trading2024',
  trader: 'password123',
};

const PRESET_PROMPTS = [
  { icon: '🚀', label: 'Breakout Kandidaten', desc: 'RSI < 30, hohes Volumen, nahe 52W-Hoch', prompt: 'Zeige Aktien mit RSI unter 30, überdurchschnittlichem Volumen und nahe ihrem 52-Wochen-Hoch' },
  { icon: '📈', label: 'Swing Trade Setup', desc: 'Trendkanal-Ausbruch mit MACD', prompt: 'Suche Aktien im Aufwärtstrend mit MACD-Crossover, RSI 40-60' },
  { icon: '💎', label: 'Oversold Reversal', desc: 'RSI < 25, Seitwärts - Kauf-Signal', prompt: 'Finde stark überverkaufte Aktien mit RSI unter 25' }
];

function TrendBadge({ trend }) {
  if (!trend) return null;
  const t = trend.toLowerCase();
  if (t.includes('bull') || t.includes('up')) return <span className="trend-badge trend-bullish">▲ Bullish</span>;
  if (t.includes('bear') || t.includes('down')) return <span className="trend-badge trend-bearish">▼ Bearish</span>;
  return <span className="trend-badge trend-sideways">→ Seitwärts</span>;
}

function RSICell({ value }) {
  const cls = value < 30 ? 'rsi-low' : value > 70 ? 'rsi-high' : 'rsi-mid';
  return <span className={`rsi-cell ${cls}`}>{Number(value).toFixed(1)}</span>;
}

function TradingViewChart({ ticker }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !ticker) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: ticker, interval: 'D', timezone: 'Europe/Berlin', theme: 'dark', style: '1', locale: 'de_DE',
      enable_publishing: false, allow_symbol_change: true, container_id: 'tv_chart'
    });
    containerRef.current.id = 'tv_chart';
    containerRef.current.appendChild(script);
  }, [ticker]);
  return <div className="chart-container"><div ref={containerRef} style={{ width: '100%', height: '100%' }} /></div>;
}

// ... (Rest der App Logik wie LoginScreen, ScreenerTab, BotTab)
// Hinweis: Da der Code sehr lang ist, stelle sicher, dass du den am Anfang 
// der Unterhaltung geposteten App.js Code hier vollständig einfügst.
export default function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem('trading_user') || null);
  const [activeTab, setActiveTab] = useState('screener');
  if (!user) return <LoginScreen onLogin={(u) => { sessionStorage.setItem('trading_user', u); setUser(u); }} />;
  return (
    <div className="app-container">
      <div className="topbar"><div className="topbar-logo">⬡ AI TERMINAL</div>
      <nav className="topbar-nav">
        <button className={activeTab === 'screener' ? 'active' : ''} onClick={() => setActiveTab('screener')}>Screener</button>
        <button className={activeTab === 'bot' ? 'active' : ''} onClick={() => setActiveTab('bot')}>Bot</button>
      </nav>
      <button onClick={() => { sessionStorage.removeItem('trading_user'); setUser(null); }}>Logout</button></div>
      <div className="content">{activeTab === 'screener' ? <ScreenerTab /> : <BotTab />}</div>
    </div>
  );
}
