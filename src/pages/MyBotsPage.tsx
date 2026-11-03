import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react';
import { fetchBotMarketSnapshot, pairToCoinGeckoId, type BotMarketMap } from '../lib/marketData';
import {
  readBotConnectionState,
  subscribeBotConnectionState,
  writeBotConnectionState,
} from '../lib/botConnection';

interface BotCard {
  id: string;
  name: string;
  pair: string;
  strategy: string;
  pnl: number;
  last90: number;
  avgMonthly: number;
  daysRunning: number;
  color: string;
  accent: string;
  symbol: string;
}

const botSeeds: BotCard[] = [
  { id: 'bot-1', name: 'Telephorus Highhawk', pair: 'NEAR/USDT', strategy: 'Binance Futures', pnl: 75.67, last90: 52.21, avgMonthly: 6.56, daysRunning: 346, color: '#1f2937', accent: '#e2e8f0', symbol: 'N' },
  { id: 'bot-2', name: 'Naromita Magik B-1 Bot', pair: 'IOTA/USDT', strategy: 'Binance Futures', pnl: 29.35, last90: 64.83, avgMonthly: 7.65, daysRunning: 115, color: '#1d4ed8', accent: '#dbeafe', symbol: 'N' },
  { id: 'bot-3', name: 'Priapus Aegipan UZ-8 Bot', pair: 'HYPE/USDT', strategy: 'Binance Futures', pnl: 91.76, last90: 19.5, avgMonthly: 7.95, daysRunning: 346, color: '#0f766e', accent: '#ccfbf1', symbol: 'P' },
  { id: 'bot-4', name: 'Atlas Vulcan WW-2 Bot', pair: 'ETH/USDT', strategy: 'Bybit', pnl: 70.43, last90: 1.95, avgMonthly: 5.75, daysRunning: 367, color: '#60a5fa', accent: '#dbeafe', symbol: 'A' },
  { id: 'bot-5', name: 'Elohtros Doctor Doom I-3 Bot', pair: 'SOL/USDT', strategy: 'Bybit', pnl: 44.33, last90: 44.33, avgMonthly: 21.8, daysRunning: 61, color: '#7c3aed', accent: '#f3e8ff', symbol: 'E' },
  { id: 'bot-6', name: 'Corsair Phobos VH-5 Bot', pair: 'OSMO/USDT', strategy: 'Coinbase Advanced', pnl: 14.6, last90: 14.62, avgMonthly: 11.23, daysRunning: 39, color: '#c084fc', accent: '#f5d0fe', symbol: 'C' },
  { id: 'bot-7', name: 'Sasquatch Cable JRH-8 Bot', pair: 'BTC/USD', strategy: 'Bybit', pnl: 22.01, last90: 1.9, avgMonthly: 2.1, daysRunning: 148, color: '#f59e0b', accent: '#fef3c7', symbol: 'S' },
  { id: 'bot-8', name: 'Rocket Polaris CZA-3 Bot', pair: 'TAO/USDT', strategy: 'Binance Futures', pnl: 63.65, last90: 6.4, avgMonthly: 19.7, daysRunning: 24, color: '#ef4444', accent: '#fee2e2', symbol: 'R' },
  { id: 'bot-9', name: 'Trophonius Perseus TTT-3 Bot', pair: 'AVAX/USDT', strategy: 'Binance Futures', pnl: 20.84, last90: 2.3, avgMonthly: 5.7, daysRunning: 56, color: '#ef4444', accent: '#fee2e2', symbol: 'T' },
  { id: 'bot-10', name: 'Andromeda Flux X-9 Bot', pair: 'LINK/USDT', strategy: 'Binance', pnl: 38.1, last90: 12.5, avgMonthly: 8.2, daysRunning: 187, color: '#1d4ed8', accent: '#dbeafe', symbol: 'A' },
  { id: 'bot-11', name: 'Hydra Tides V7 Bot', pair: 'XRP/USDT', strategy: 'Binance Futures', pnl: 52.91, last90: 20.4, avgMonthly: 5.9, daysRunning: 95, color: '#0ea5e9', accent: '#dff6ff', symbol: 'H' },
  { id: 'bot-12', name: 'Vanguard Echo K-4 Bot', pair: 'BNB/USDT', strategy: 'Binance', pnl: 18.15, last90: 11.7, avgMonthly: 7.2, daysRunning: 220, color: '#1f2937', accent: '#e2e8f0', symbol: 'V' },
  { id: 'bot-13', name: 'Helios Pulse O-2 Bot', pair: 'DOGE/USDT', strategy: 'Bybit', pnl: 66.45, last90: 14.2, avgMonthly: 10.8, daysRunning: 90, color: '#f59e0b', accent: '#fef3c7', symbol: 'H' },
  { id: 'bot-14', name: 'Nova Stern A-8 Bot', pair: 'ADA/USDT', strategy: 'Binance Futures', pnl: 47.22, last90: 24.8, avgMonthly: 12.1, daysRunning: 210, color: '#10b981', accent: '#d1fae5', symbol: 'N' },
  { id: 'bot-15', name: 'Titan Ledger M-3 Bot', pair: 'APT/USDT', strategy: 'Coinbase Advanced', pnl: 33.04, last90: 9.9, avgMonthly: 7.5, daysRunning: 142, color: '#0f172a', accent: '#dbeafe', symbol: 'T' },
  { id: 'bot-16', name: 'Black Echo T-1 Bot', pair: 'SUI/USDT', strategy: 'Binance Futures', pnl: 58.67, last90: 18.9, avgMonthly: 13.7, daysRunning: 86, color: '#2563eb', accent: '#dbeafe', symbol: 'B' },
  { id: 'bot-17', name: 'Mosaic Lamplight Bot', pair: 'BCH/USDT', strategy: 'Binance', pnl: 26.51, last90: 5.4, avgMonthly: 8.8, daysRunning: 176, color: '#f97316', accent: '#fed7aa', symbol: 'M' },
  { id: 'bot-18', name: 'Aurora Current W-5 Bot', pair: 'FIL/USDT', strategy: 'Bybit', pnl: 41.11, last90: 7.7, avgMonthly: 6.2, daysRunning: 44, color: '#22c55e', accent: '#dcfce7', symbol: 'A' },
  { id: 'bot-19', name: 'Zenith Harbor P-7 Bot', pair: 'UNI/USDT', strategy: 'Binance Futures', pnl: 29.99, last90: 15.1, avgMonthly: 9.3, daysRunning: 99, color: '#8b5cf6', accent: '#ede9fe', symbol: 'Z' },
  { id: 'bot-20', name: 'Violet Ember N-2 Bot', pair: 'ARB/USDT', strategy: 'Binance', pnl: 72.66, last90: 26.8, avgMonthly: 17.1, daysRunning: 304, color: '#a855f7', accent: '#f3e8ff', symbol: 'V' },
  { id: 'bot-21', name: 'Ember Current L-9 Bot', pair: 'MATIC/USDT', strategy: 'Binance', pnl: 64.18, last90: 21.7, avgMonthly: 12.4, daysRunning: 88, color: '#14b8a6', accent: '#ccfbf1', symbol: 'E' },
  { id: 'bot-22', name: 'Helix Pulse X-4 Bot', pair: 'ATOM/USDT', strategy: 'Bybit', pnl: 33.41, last90: 8.9, avgMonthly: 5.9, daysRunning: 128, color: '#f43f5e', accent: '#ffe4e6', symbol: 'H' },
  { id: 'bot-23', name: 'Cinder Signal B-2 Bot', pair: 'DOT/USDT', strategy: 'Binance Futures', pnl: 71.2, last90: 28.4, avgMonthly: 11.3, daysRunning: 55, color: '#f97316', accent: '#fed7aa', symbol: 'C' },
  { id: 'bot-24', name: 'Orion Echo Q-7 Bot', pair: 'ETC/USDT', strategy: 'Coinbase Advanced', pnl: 48.7, last90: 16.9, avgMonthly: 9.1, daysRunning: 112, color: '#64748b', accent: '#e2e8f0', symbol: 'O' },
  { id: 'bot-25', name: 'Signal Reef K-1 Bot', pair: 'XLM/USDT', strategy: 'Kraken', pnl: 36.9, last90: 13.8, avgMonthly: 7.9, daysRunning: 210, color: '#7c3aed', accent: '#f3e8ff', symbol: 'S' },
  { id: 'bot-26', name: 'Summit Drift R-5 Bot', pair: 'EOS/USDT', strategy: 'Binance Futures', pnl: 52.2, last90: 22.8, avgMonthly: 10.2, daysRunning: 95, color: '#0ea5e9', accent: '#dbeafe', symbol: 'S' },
  { id: 'bot-27', name: 'Northstar Grid Y-3 Bot', pair: 'VET/USDT', strategy: 'Binance', pnl: 61.3, last90: 18.1, avgMonthly: 8.4, daysRunning: 148, color: '#a78bfa', accent: '#ede9fe', symbol: 'N' },
  { id: 'bot-28', name: 'Apex Relay Z-8 Bot', pair: 'THETA/USDT', strategy: 'Binance Futures', pnl: 40.1, last90: 15.4, avgMonthly: 11.8, daysRunning: 76, color: '#e11d48', accent: '#ffe4e6', symbol: 'A' },
  { id: 'bot-29', name: 'Quantum Drift S-4 Bot', pair: 'RNDR/USDT', strategy: 'Binance Futures', pnl: 54.8, last90: 19.6, avgMonthly: 13.7, daysRunning: 63, color: '#22c55e', accent: '#dcfce7', symbol: 'Q' },
  { id: 'bot-30', name: 'Velvet Flux H-7 Bot', pair: 'ALGO/USDT', strategy: 'Binance', pnl: 58.6, last90: 17.4, avgMonthly: 12.1, daysRunning: 100, color: '#0284c7', accent: '#e0f2fe', symbol: 'V' },
  { id: 'bot-31', name: 'Luna Arcade C-3 Bot', pair: 'PEPE/USDT', strategy: 'Binance', pnl: 46.7, last90: 20.4, avgMonthly: 9.8, daysRunning: 74, color: '#f59e0b', accent: '#fef3c7', symbol: 'L' },
  { id: 'bot-32', name: 'Blue Harbor K-5 Bot', pair: 'MANTA/USDT', strategy: 'Bybit', pnl: 44.6, last90: 14.3, avgMonthly: 10.7, daysRunning: 83, color: '#0f766e', accent: '#ccfbf1', symbol: 'B' },
  { id: 'bot-33', name: 'Prism Harbor U-2 Bot', pair: 'SEI/USDT', strategy: 'Coinbase Advanced', pnl: 52.3, last90: 16.8, avgMonthly: 11.9, daysRunning: 98, color: '#f97316', accent: '#fed7aa', symbol: 'P' },
  { id: 'bot-34', name: 'Nova Drift M-8 Bot', pair: 'JUP/USDT', strategy: 'Binance Futures', pnl: 49.2, last90: 18.9, avgMonthly: 12.6, daysRunning: 118, color: '#1d4ed8', accent: '#dbeafe', symbol: 'N' },
  { id: 'bot-35', name: 'Astra Dusk T-9 Bot', pair: 'OP/USDT', strategy: 'Bybit', pnl: 60.7, last90: 19.1, avgMonthly: 13.1, daysRunning: 140, color: '#7c3aed', accent: '#f3e8ff', symbol: 'A' },
  { id: 'bot-36', name: 'Zenith Deep P-2 Bot', pair: 'INJ/USDT', strategy: 'Binance Futures', pnl: 42.8, last90: 15.5, avgMonthly: 8.7, daysRunning: 76, color: '#0ea5e9', accent: '#dff6ff', symbol: 'Z' },
  { id: 'bot-37', name: 'Orca Signal T-5 Bot', pair: 'TIA/USDT', strategy: 'Binance', pnl: 38.3, last90: 13.2, avgMonthly: 8.8, daysRunning: 88, color: '#22c55e', accent: '#dcfce7', symbol: 'O' },
  { id: 'bot-38', name: 'Flashpoint D-4 Bot', pair: 'WIF/USDT', strategy: 'Binance', pnl: 51.4, last90: 21.3, avgMonthly: 10.5, daysRunning: 97, color: '#f43f5e', accent: '#ffe4e6', symbol: 'F' },
  { id: 'bot-39', name: 'Solaris Beam R-1 Bot', pair: 'BONK/USDT', strategy: 'Binance Futures', pnl: 45.9, last90: 17.9, avgMonthly: 9.3, daysRunning: 79, color: '#f59e0b', accent: '#fef3c7', symbol: 'S' },
  { id: 'bot-40', name: 'Frostline B-2 Bot', pair: 'MSTR/USDT', strategy: 'Binance', pnl: 60.7, last90: 18.8, avgMonthly: 13.4, daysRunning: 110, color: '#0f172a', accent: '#dbeafe', symbol: 'F' },
];

const storageKey = 'my-bots-connections';

const makePath = (seed: number) => {
  const points = [18, 28, 32, 44, 47, 56, 68, 79, 90, 76, 88, 98, 100];
  const width = 250;
  const height = 72;
  const step = width / (points.length - 1);

  return points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point / 100) * (height - 16) - 8;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

export const MyBotsPage = () => {
  const [marketData, setMarketData] = useState<BotMarketMap>({});
  const [isGlobalConnected, setIsGlobalConnected] = useState<boolean>(() => readBotConnectionState());
  const [hideInsufficientBalance, setHideInsufficientBalance] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const unsubscribe = subscribeBotConnectionState((value) => setIsGlobalConnected(value));
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(connected));
  }, [connected]);

  useEffect(() => {
    const allPairs = botSeeds.map((bot) => bot.pair);

    void fetchBotMarketSnapshot(allPairs)
      .then((data) => setMarketData(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const allPairs = botSeeds.map((bot) => bot.pair);

      void fetchBotMarketSnapshot(allPairs)
        .then((data) => setMarketData(data))
        .catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const connectedCount = useMemo(() => {
    const total = Object.values(connected).filter(Boolean).length;
    return isGlobalConnected ? botSeeds.length : total;
  }, [connected, isGlobalConnected]);

  const toggleConnection = (id: string) => {
    if (isGlobalConnected) {
      writeBotConnectionState(false);
      setIsGlobalConnected(false);
      return;
    }

    setConnected((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getLiveBotStats = (bot: BotCard) => {
    const key = pairToCoinGeckoId(bot.pair);
    const snapshot = marketData[key];
    const price = snapshot?.price ?? 1;
    const change24h = snapshot?.change24h ?? 0;

    return {
      price,
      change24h,
      livePnl: Number((bot.pnl + change24h * 0.9).toFixed(2)),
      liveReturn: Number((bot.pnl + change24h).toFixed(2)),
    };
  };

  const displayedBots = useMemo(() => {
    return botSeeds.filter((bot) => {
      if (!hideInsufficientBalance) {
        return true;
      }

      const snapshot = marketData[pairToCoinGeckoId(bot.pair)];
      return (snapshot?.price ?? 1) > 0;
    });
  }, [hideInsufficientBalance, marketData]);

  return (
    <div className="min-h-screen bg-[#edf3f8] px-6 py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[#dfeaf4] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-[#dfeaf4] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-slate-700">
              My Bots
            </button>
            <button className="rounded-lg border border-[#dfeaf4] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-slate-500">
              Public DCA Bots
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#dfeaf4] bg-[#f8fbff] px-3 py-2">
              <Search size={14} className="text-slate-500" />
              <input
                className="w-44 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search..."
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1d73f5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1667d8]"
            >
              <Plus size={15} />
              Create Bot
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            {displayedBots.map((bot, index) => {
              const botStats = getLiveBotStats(bot);
              const isConnected = isGlobalConnected || !!connected[bot.id];
              const lineSeed = makePath(index + 1);

              return (
                <div
                  key={bot.id}
                  className="rounded-2xl border border-[#dfeaf4] bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: bot.color }}
                      >
                        {bot.symbol}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-slate-800">{bot.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{bot.pair}</span>
                          <span>•</span>
                          <span>{bot.strategy}</span>
                        </div>
                      </div>
                    </div>

                    <button className="rounded-lg border border-[#dfeaf4] bg-[#f7f9fc] px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                      Copy Bot
                    </button>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <span className={`text-base font-black ${bot.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {bot.pnl >= 0 ? '+' : ''}
                      {botStats.livePnl.toFixed(2)}%
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Total Profit</span>
                  </div>

                  <div className="mb-4 overflow-hidden rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-2">
                    <svg viewBox="0 0 250 72" className="h-16 w-full" preserveAspectRatio="none">
                      <path d={lineSeed} fill="none" stroke="#18b36d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                      <div className="text-[11px] text-slate-500">Last 90 Days</div>
                      <div className="mt-1 text-sm font-bold text-slate-800">{bot.last90.toFixed(2)}%</div>
                    </div>
                    <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                      <div className="text-[11px] text-slate-500">Live Price</div>
                      <div className="mt-1 text-sm font-bold text-slate-800">
                        ${botStats.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                      <div className="text-[11px] text-slate-500">24h</div>
                      <div className={`mt-1 text-sm font-bold ${botStats.change24h >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {botStats.change24h >= 0 ? '+' : ''}
                        {botStats.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#edf2f7] bg-[#f8fbff] px-3 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>{isConnected ? 'Connected' : 'Not connected'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleConnection(bot.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-[#1d73f5] text-white hover:bg-[#1667d8]'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </button>
                  </div>

                  {isConnected && (
                    <p className="mt-3 text-[11px] leading-5 text-slate-600">
                      Automated trading bot generate 5–15% daily returns through smart trading strategies
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="rounded-2xl border border-[#dfeaf4] bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Filters</span>
              </div>
              <button className="text-xs font-medium text-slate-500">Reset</button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Bot Amount</div>
                <div className="flex items-center justify-between rounded-xl border border-[#dfeaf4] bg-[#f9fbff] px-3 py-2">
                  <span className="text-sm text-slate-600">Hide insufficient funds</span>
                  <button
                    type="button"
                    aria-label="Toggle insufficient fund filters"
                    onClick={() => setHideInsufficientBalance((current) => !current)}
                    className={`relative h-6 w-11 rounded-full p-1 transition ${
                      hideInsufficientBalance ? 'bg-[#1d73f5]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        hideInsufficientBalance ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Exchanges</div>
                <div className="space-y-2 text-sm text-slate-600">
                  {['Binance', 'Binance Coin-Futures', 'Binance Futures', 'Bybit', 'KuCoin', 'Kraken'].map((exchange) => (
                    <label key={exchange} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#1d73f5]" />
                      <span>{exchange}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Symbols</div>
                <select className="w-full rounded-xl border border-[#dfeaf4] bg-[#f9fbff] px-3 py-2 text-sm text-slate-600 outline-none">
                  <option>All</option>
                  <option>BTC</option>
                  <option>ETH</option>
                  <option>SOL</option>
                </select>
              </div>

              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Days Running</div>
                <div className="rounded-xl border border-[#dfeaf4] bg-[#f9fbff] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>10</span>
                    <span>730</span>
                  </div>
                  <input type="range" min="10" max="730" defaultValue="100" className="w-full accent-[#1d73f5]" />
                </div>
              </div>

              <div className="rounded-xl border border-[#dfeaf4] bg-[#f9fbff] p-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Connected bots</span>
                  <span className="font-semibold text-slate-800">{connectedCount}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {connectedCount > 0
                    ? 'Your connected bot strategies are active and ready to trade.'
                    : 'Connect a bot to start automated trading.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dfeaf4] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Premium</div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">Premium subscribers only</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                aria-label="Close premium modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-slate-600">
              Create custom bots is available to premium subscribers only. Upgrade your plan to unlock this feature.
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="rounded-xl bg-[#1d73f5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1667d8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBotsPage;
