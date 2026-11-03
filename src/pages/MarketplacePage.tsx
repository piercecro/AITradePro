import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { fetchBotMarketSnapshot, pairToCoinGeckoId, type BotMarketMap } from '../lib/marketData';

interface MarketplaceBot {
  id: string;
  name: string;
  pair: string;
  strategy: string;
  symbol: string;
  color: string;
  sampleChange: number;
}

const assetPairs = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LINK/USDT', 'DOT/USDT',
  'NEAR/USDT', 'LTC/USDT', 'BCH/USDT', 'UNI/USDT', 'ATOM/USDT', 'ETC/USDT', 'APT/USDT', 'SUI/USDT', 'ARB/USDT', 'OP/USDT',
  'FIL/USDT', 'INJ/USDT', 'ICP/USDT', 'AAVE/USDT', 'TAO/USDT', 'SEI/USDT', 'TIA/USDT', 'JUP/USDT', 'WIF/USDT', 'PEPE/USDT',
  'TRX/USDT', 'XLM/USDT', 'VET/USDT', 'ALGO/USDT', 'FET/USDT', 'RENDER/USDT', 'GRT/USDT', 'MKR/USDT', 'CRV/USDT', 'MANA/USDT',
  'SAND/USDT', 'FTM/USDT', 'EGLD/USDT', 'THETA/USDT', 'RUNE/USDT', 'AR/USDT', 'IMX/USDT', 'STX/USDT', 'ONDO/USDT', 'PYTH/USDT',
];
const strategies = ['Grid', 'DCA', 'Momentum', 'Trend following', 'Mean reversion'];
const colors = ['#1d4ed8', '#0f766e', '#7c3aed', '#f59e0b', '#0284c7', '#e11d48', '#059669', '#ea580c'];
const botCatalog: MarketplaceBot[] = assetPairs.map((pair, index) => {
  const asset = pair.split('/')[0];
  return {
    id: `market-bot-${index + 1}`,
    name: `${strategies[index % strategies.length]} ${asset} ${String(index + 1).padStart(2, '0')}`,
    pair,
    strategy: `${strategies[index % strategies.length]} strategy`,
    symbol: asset.slice(0, 1),
    color: colors[index % colors.length],
    // This is a sample catalog listing, not a measured bot return.
    sampleChange: ((index * 17) % 61) - 30,
  };
});

const makePath = (seed: number) => {
  const points = [18, 28, 32, 44, 47, 56, 68, 79, 90, 76, 88, 98, 100];
  const step = 250 / (points.length - 1);
  return points.map((point, index) => {
    const adjusted = Math.max(8, Math.min(92, point + ((seed * (index + 3)) % 9) - 4));
    const y = 72 - (adjusted / 100) * 56 - 8;
    return `${index === 0 ? 'M' : 'L'} ${index * step} ${y}`;
  }).join(' ');
};

export const MarketplacePage = () => {
  const [marketData, setMarketData] = useState<BotMarketMap>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void fetchBotMarketSnapshot(botCatalog.map((bot) => bot.pair))
        .then((data) => { if (active) setMarketData(data); })
        .catch(() => undefined);
    };
    refresh();
    const intervalId = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);

  const displayedBots = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return botCatalog;
    return botCatalog.filter((bot) => `${bot.name} ${bot.pair} ${bot.strategy}`.toLowerCase().includes(normalizedSearch));
  }, [search]);

  return (
    <div className="min-h-screen bg-[#edf3f8] px-6 py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[#dfeaf4] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#dfeaf4] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-slate-700">
              Bot Marketplace
              <Sparkles size={15} className="text-[#1d73f5]" />
            </div>
            <span className="hidden text-sm text-slate-500 sm:inline">Browse 50 strategy listings with live market prices</span>
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-[#dfeaf4] bg-[#f8fbff] px-3 py-2 sm:w-64">
            <Search size={14} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search..."
              aria-label="Search marketplace bots"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {displayedBots.map((bot, index) => {
            const quote = marketData[pairToCoinGeckoId(bot.pair)];
            const change = quote?.change24h;
            return (
              <div key={bot.id} className="rounded-2xl border border-[#dfeaf4] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: bot.color }}>
                      {bot.symbol}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold text-slate-800">{bot.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{bot.pair}</span>
                        <span>•</span>
                        <span>{bot.strategy}</span>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[#dfeaf4] bg-[#f7f9fc] px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                    Sample
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <span className={`text-base font-black ${bot.sampleChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {bot.sampleChange >= 0 ? '+' : ''}{bot.sampleChange.toFixed(1)}%
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Illustrative strategy metric</span>
                </div>

                <div className="mb-4 overflow-hidden rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-2">
                  <svg viewBox="0 0 250 72" className="h-16 w-full" preserveAspectRatio="none" aria-label="Decorative sample strategy chart">
                    <path d={makePath(index + 1)} fill="none" stroke={bot.sampleChange >= 0 ? '#18b36d' : '#f43f5e'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                    <div className="text-[11px] text-slate-500">Strategy</div>
                    <div className="mt-1 truncate text-sm font-bold text-slate-800">{bot.strategy.replace(' strategy', '')}</div>
                  </div>
                  <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                    <div className="text-[11px] text-slate-500">Live Price</div>
                    <div className="mt-1 text-sm font-bold text-slate-800">
                      {quote ? `$${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#f4f8fc] px-2 py-2">
                    <div className="text-[11px] text-slate-500">24h</div>
                    <div className={`mt-1 text-sm font-bold ${change === undefined ? 'text-slate-800' : change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {change === undefined ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#edf2f7] bg-[#f8fbff] px-3 py-2.5">
                  <span className="text-xs text-slate-500">Strategy template</span>
                  <button type="button" disabled title="A live bot provider is not connected" className="cursor-not-allowed rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                    Copy Bot
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {displayedBots.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d9e3ee] bg-white p-10 text-center text-sm text-slate-500">
            No sample bots match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
