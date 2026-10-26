import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  available_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_profit: number;
}

interface Trade {
  id: string;
  trading_pair: string;
  profit_loss: number;
  opened_at: string;
}

interface Deposit {
  id: number;
  amount: number;
  status: string;
  created_at: string;
}

type MarketTab = 'Volume' | 'Top Gainers' | 'Top Losers' | 'New';
type DashboardMode = 'dashboard' | 'live-trading' | 'demo';

interface MarketEntry {
  id: string;
  pair: string;
  name: string;
  image?: string;
  current_price: number;
  total_volume: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

const marketTabs: MarketTab[] = ['Volume', 'Top Gainers', 'Top Losers', 'New'];

const staticMarketEntries: MarketEntry[] = [
  { id: 'btc-usd', pair: 'BTC/USD', name: 'Bitcoin', current_price: 68240.12, total_volume: 41250000000, market_cap: 1344000000000, price_change_percentage_24h: 2.64 },
  { id: 'eth-usd', pair: 'ETH/USD', name: 'Ethereum', current_price: 3498.7, total_volume: 18230000000, market_cap: 418000000000, price_change_percentage_24h: 1.85 },
  { id: 'sol-usd', pair: 'SOL/USD', name: 'Solana', current_price: 154.31, total_volume: 5100000000, market_cap: 71400000000, price_change_percentage_24h: 4.72 },
  { id: 'bnb-usd', pair: 'BNB/USD', name: 'Binance Coin', current_price: 582.5, total_volume: 1940000000, market_cap: 87500000000, price_change_percentage_24h: 1.58 },
  { id: 'xrp-usd', pair: 'XRP/USD', name: 'XRP', current_price: 0.5812, total_volume: 2300000000, market_cap: 33000000000, price_change_percentage_24h: -0.43 },
  { id: 'ada-usd', pair: 'ADA/USD', name: 'Cardano', current_price: 0.6328, total_volume: 1140000000, market_cap: 22300000000, price_change_percentage_24h: 2.12 },
  { id: 'aapl-usd', pair: 'AAPL/USD', name: 'Apple', current_price: 214.56, total_volume: 4600000000, market_cap: 3260000000000, price_change_percentage_24h: 0.87 },
  { id: 'msft-usd', pair: 'MSFT/USD', name: 'Microsoft', current_price: 428.12, total_volume: 2880000000, market_cap: 3180000000000, price_change_percentage_24h: 1.31 },
  { id: 'nvda-usd', pair: 'NVDA/USD', name: 'NVIDIA', current_price: 131.8, total_volume: 3430000000, market_cap: 3220000000000, price_change_percentage_24h: 3.54 },
  { id: 'tsla-usd', pair: 'TSLA/USD', name: 'Tesla', current_price: 248.9, total_volume: 5610000000, market_cap: 790000000000, price_change_percentage_24h: -1.76 },
  { id: 'eur-usd', pair: 'EUR/USD', name: 'Euro / Dollar', current_price: 1.0884, total_volume: 920000000, market_cap: 0, price_change_percentage_24h: 0.12 },
  { id: 'gbp-usd', pair: 'GBP/USD', name: 'Pound / Dollar', current_price: 1.2745, total_volume: 740000000, market_cap: 0, price_change_percentage_24h: -0.21 },
  { id: 'xau-usd', pair: 'XAU/USD', name: 'Gold / Dollar', current_price: 2367.8, total_volume: 2100000000, market_cap: 0, price_change_percentage_24h: 1.14 },
];

export const DashboardPage = ({ mode = 'dashboard' }: { mode?: DashboardMode }) => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [marketTab, setMarketTab] = useState<MarketTab>('Volume');
  const [marketEntries, setMarketEntries] = useState<MarketEntry[]>(staticMarketEntries);
  const [marketLoading, setMarketLoading] = useState(true);

  const isDemoMode = mode === 'demo';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    fetchMarketData();
    const interval = window.setInterval(fetchMarketData, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setMarketLoading(true);
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();
      const liveEntries: MarketEntry[] = Array.isArray(data)
        ? data.map((coin: any) => ({
            id: coin.id,
            pair: `${(coin.symbol || 'BTC').toUpperCase()}/USD`,
            name: coin.name || 'Market Asset',
            image: coin.image,
            current_price: Number(coin.current_price || 0),
            total_volume: Number(coin.total_volume || 0),
            market_cap: Number(coin.market_cap || 0),
            price_change_percentage_24h: Number(coin.price_change_percentage_24h || 0),
          }))
        : [];

      const merged = [...liveEntries, ...staticMarketEntries];
      const unique = new Map<string, MarketEntry>();
      merged.forEach((entry) => unique.set(entry.pair, entry));
      setMarketEntries(Array.from(unique.values()));
    } catch (error) {
      console.error('Market data fetch error:', error);
      setMarketEntries(staticMarketEntries);
    } finally {
      setMarketLoading(false);
    }
  };

  const visibleMarketEntries = useMemo(() => {
    const list = [...marketEntries];

    switch (marketTab) {
      case 'Top Gainers':
        return list
          .filter((entry) => entry.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      case 'Top Losers':
        return list
          .filter((entry) => entry.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      case 'New':
        return list.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
      case 'Volume':
      default:
        return list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    }
  }, [marketEntries, marketTab]);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (profileData) setProfile(profileData);

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user?.id)
      .order('opened_at', { ascending: false })
      .limit(5);

    if (tradesData) setRecentTrades(tradesData);

    const { data: depositsData } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (depositsData) setRecentDeposits(depositsData);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const formatCompactCurrency = (value: number) => {
    if (!value) return '$0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) return value.toFixed(2);
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    return value.toFixed(6);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#edf3f8] text-slate-700">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#edf3f8] text-slate-700">
        You must be logged in to view the dashboard.
      </div>
    );
  }

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      {isDemoMode && (
        <div className="mx-auto mb-4 flex max-w-[1360px] items-center justify-between rounded-[12px] border border-[#dfe7f0] bg-[#edf7ff] px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
            <span>
              You&apos;re in demo mode. <span className="text-slate-500">Bots and trades here are virtual funds.</span>
            </span>
          </div>
          <button
            onClick={() => window.location.assign('/')}
            className="rounded-lg border border-[#cfe0ff] bg-white px-3 py-1.5 font-semibold text-sky-700 hover:bg-sky-50"
          >
            Switch to live
          </button>
        </div>
      )}

      <div className="mx-auto max-w-[1360px]">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.8fr)_320px]">
          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-500">Portfolio value</div>
                <div className="mt-2 text-[42px] font-black tracking-[-0.08em] text-slate-800">
                  ${formatCurrency(profile?.available_balance ?? 0).replace('$', '')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {['1D', '3D', '1W', '1M', '3M', '1Y'].map((tab) => (
                  <button
                    key={tab}
                    className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-[34px] font-bold text-slate-800">$0</span>
              <span className="text-slate-500">$0.00% over 1D</span>
            </div>

            <div className="relative h-[250px] rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc]">
              <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-slate-400">
                No balance history for this range yet
              </div>
            </div>
          </section>

          <aside className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">Amount in Open Trades</div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                {['1D', '3D', '1W'].map((tab) => (
                  <button key={tab} className="rounded-lg border border-[#dfe7f0] bg-white px-2 py-1 font-semibold text-slate-500">
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] text-slate-400">Open trades</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">$0</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm font-medium text-slate-500">0% of portfolio</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm font-medium text-slate-500">PnL in Open Trades</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">$0</div>
                <div className="mt-1 text-xs text-slate-400">0.00% on the amount in trades</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm font-medium text-slate-500">Potential Profit</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">$0</div>
                <div className="mt-1 text-xs text-slate-400">If every take-profit fills</div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xl font-bold text-slate-700">Open Trades</div>
              <button className="text-sm font-semibold text-sky-600">See all</button>
            </div>

            <div className="flex min-h-[260px] items-center justify-center rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] px-4 text-center">
              <div>
                <div className="mb-4 flex justify-center text-slate-300">
                  <Wallet size={34} />
                </div>
                <div className="text-2xl font-bold text-slate-500">No open trades</div>
                <button className="mt-5 rounded-xl bg-[#1d73f5] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1667d8]">
                  Create Trade
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xl font-bold text-slate-700">Accounts</div>
              <button className="text-sm font-semibold text-sky-600">See all</button>
            </div>

            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2f8] text-slate-400">
                <Wallet size={28} />
              </div>
              <div className="text-2xl font-bold text-slate-500">No exchange accounts connected</div>
              <div className="mt-2 text-sm text-slate-400">You haven&apos;t connected an exchange account to Cornix</div>
              <button className="mt-5 rounded-xl bg-[#1d73f5] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1667d8]">
                {isDemoMode ? 'Create Demo Account' : 'Create Account'}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex flex-col gap-3 border-b border-[#dfe7f0] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xl font-bold text-slate-700">Market</div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              {marketTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMarketTab(tab)}
                  className={`rounded-t-lg px-2 py-2 transition-colors ${
                    marketTab === tab
                      ? 'border-b-2 border-[#1d73f5] text-sky-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button className="px-2 py-2 text-slate-500 hover:text-slate-700">See all</button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#e3ebf4] bg-[#f7f9fc] px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              <span>Pair</span>
              <span>Last price</span>
              <span>24h change</span>
              <span>24h low / high</span>
              <span className="text-right">24h volume</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {marketLoading ? (
                <div className="flex items-center justify-center py-12 text-sm font-medium text-slate-500">Loading market data...</div>
              ) : visibleMarketEntries.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm font-medium text-slate-500">
                  No market data available right now.
                </div>
              ) : (
                visibleMarketEntries.map((entry, index) => {
                  const change = Number(entry.price_change_percentage_24h ?? 0);
                  const isPositive = change >= 0;

                  return (
                    <div
                      key={`${entry.pair}-${index}`}
                      className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-[#edf1f6] px-5 py-4 text-sm text-slate-600 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        {entry.image ? (
                          <img src={entry.image} alt={entry.name} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                            {entry.pair.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="text-[15px] font-black text-slate-800">{entry.pair}</div>
                          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{entry.name}</div>
                        </div>
                      </div>

                      <div className="text-base font-bold text-slate-800">${formatPrice(entry.current_price)}</div>

                      <div className={isPositive ? 'text-base font-bold text-emerald-500' : 'text-base font-bold text-rose-500'}>
                        {isPositive ? '+' : ''}
                        {change.toFixed(2)}%
                      </div>

                      <div className="text-base font-semibold text-slate-700">
                        {entry.market_cap > 0 ? `$${(entry.market_cap / 1_000_000).toFixed(2)}M` : '$0.00'}
                      </div>

                      <div className="text-right text-base font-bold text-slate-800">
                        {formatCompactCurrency(entry.total_volume)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {showChat && (
        <div className="fixed bottom-6 right-6 w-[340px] rounded-[18px] border border-[#dfe7f0] bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">Live Support</div>
            <button onClick={() => setShowChat(false)} className="text-slate-400">×</button>
          </div>
          <div className="mb-3 h-40 rounded-xl bg-[#f7f9fc] p-3 text-sm text-slate-500">
            👋 Hi! How can we help you today?
          </div>
          <input className="w-full rounded-xl border border-[#dfe7f0] bg-[#f7f9fc] px-3 py-2 text-sm outline-none" placeholder="Type a message..." />
        </div>
      )}

      <button
        onClick={() => setShowChat((value) => !value)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1d73f5] text-white shadow-lg hover:bg-[#1667d8]"
        aria-label="Open chat"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.42-4.03 8-9 8-1.77 0-3.41-.5-4.79-1.35L3 21l1.35-4.21C3.5 15.41 3 13.77 3 12c0-4.42 4.03-8 9-8s9 3.58 9 8Z" />
        </svg>
      </button>
    </div>
  );
};

const formatCompactCurrency = (value: number) => {
  if (!value) return '$0';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatPrice = (value: number) => {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
};

export default DashboardPage;
