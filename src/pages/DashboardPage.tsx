import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
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
  status?: string;
}

interface Deposit {
  id: string;
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
  { id: 'eth-usd', pair: 'ETH/USD', name: 'Ethereum', current_price: 3520.5, total_volume: 22800000000, market_cap: 422800000000, price_change_percentage_24h: 1.42 },
  { id: 'sol-usd', pair: 'SOL/USD', name: 'Solana', current_price: 168.42, total_volume: 5800000000, market_cap: 74000000000, price_change_percentage_24h: 4.18 },
  { id: 'xrp-usd', pair: 'XRP/USD', name: 'XRP', current_price: 0.621, total_volume: 2400000000, market_cap: 34600000000, price_change_percentage_24h: -0.84 },
  { id: 'ada-usd', pair: 'ADA/USD', name: 'Cardano', current_price: 0.712, total_volume: 1700000000, market_cap: 25500000000, price_change_percentage_24h: 1.92 },
  { id: 'doge-usd', pair: 'DOGE/USD', name: 'Dogecoin', current_price: 0.155, total_volume: 1900000000, market_cap: 22400000000, price_change_percentage_24h: 3.11 },
];

export const DashboardPage = ({ mode = 'dashboard' }: { mode?: DashboardMode }) => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [marketEntries, setMarketEntries] = useState<MarketEntry[]>(staticMarketEntries);
  const [marketTab, setMarketTab] = useState<MarketTab>('Volume');

  const isDemoMode = mode === 'demo';

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRecentTrades([]);
      setRecentDeposits([]);
      return;
    }

    const loadData = async () => {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false })
        .limit(5);

      if (tradesData) {
        setRecentTrades((tradesData as Trade[]) ?? []);
      }

      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (depositsData) {
        setRecentDeposits((depositsData as Deposit[]) ?? []);
      }
    };

    void loadData();
  }, [user]);

  const portfolioBalance = profile?.available_balance ?? 0;
  const totalProfit = profile?.total_profit ?? 0;
  const totalDeposited = profile?.total_deposited ?? 0;
  const totalWithdrawn = profile?.total_withdrawn ?? 0;

  const openTradePnl = useMemo(
    () =>
      recentTrades.reduce((sum, trade) => {
        const value = Number(trade.profit_loss ?? 0);
        return sum + value;
      }, 0),
    [recentTrades],
  );

  const filteredMarketEntries = useMemo(() => {
    const list = [...marketEntries];

    switch (marketTab) {
      case 'Top Gainers':
        return list.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      case 'Top Losers':
        return list.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      case 'New':
        return list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
      case 'Volume':
      default:
        return list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    }
  }, [marketEntries, marketTab]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatCompactCurrency = (value: number) => {
    if (!value) return '$0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (value >= 0.01) return value.toFixed(2);
    return value.toFixed(4);
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
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <TrendingUp size={16} className="text-[#1d73f5]" />
            Demo account mode is active.
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Live market</div>
        </div>
      )}

      <div className="mx-auto max-w-[1360px] space-y-5">
        <section className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-500">Portfolio value</div>
                <div className="mt-2 text-[42px] font-black tracking-[-0.08em] text-slate-800">
                  ${formatCurrency(portfolioBalance).replace('$', '')}
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
              <span className="text-[34px] font-bold text-slate-800">${formatCurrency(portfolioBalance).replace('$', '')}</span>
              <span className="text-slate-500">using your Supabase balance</span>
            </div>

            <div className="relative h-[250px] rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] p-5">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-slate-400">
                <Wallet className="mb-2 text-slate-400" size={20} />
                <div>Balance synced from Supabase</div>
                <div className="mt-2 text-xl font-bold text-slate-700">{formatCurrency(portfolioBalance)}</div>
              </div>
            </div>
          </div>

          <aside className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">Overview</div>
              <div className="rounded-full bg-[#e9f4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d73f5]">
                Live
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e6edf5] bg-[#f8fbff] p-4">
                <div className="text-sm font-medium text-slate-500">Available balance</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">
                  {formatCurrency(portfolioBalance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#e6edf5] bg-[#f8fbff] p-4">
                  <div className="text-sm font-medium text-slate-500">Total deposits</div>
                  <div className="mt-2 text-[22px] font-black tracking-[-0.06em] text-slate-800">
                    {formatCurrency(totalDeposited)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e6edf5] bg-[#f8fbff] p-4">
                  <div className="text-sm font-medium text-slate-500">Withdrawn</div>
                  <div className="mt-2 text-[22px] font-black tracking-[-0.06em] text-slate-800">
                    {formatCurrency(totalWithdrawn)}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm font-medium text-slate-500">PnL in Open Trades</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">
                  {formatCurrency(openTradePnl)}
                </div>
                <div className="mt-1 text-xs text-slate-400">from the latest trades on this account</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm font-medium text-slate-500">Total profit</div>
                <div className="mt-2 text-[38px] font-black tracking-[-0.08em] text-slate-800">
                  {formatCurrency(totalProfit)}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-lg font-black tracking-[-0.04em] text-slate-800">Market overview</div>
              <div className="flex items-center gap-2">
                {marketTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMarketTab(tab)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      marketTab === tab ? 'bg-[#1d73f5] text-white' : 'bg-[#f3f7fb] text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#edf2f7]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                <div>Pair</div>
                <div>Price</div>
                <div>24h</div>
                <div>Vol</div>
                <div>Mkt Cap</div>
              </div>

              {filteredMarketEntries.map((entry) => {
                const isPositive = entry.price_change_percentage_24h >= 0;

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center border-t border-[#edf2f7] px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfeaff] text-xs font-black text-[#1d73f5]">
                        {entry.pair.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{entry.pair}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{entry.name}</div>
                      </div>
                    </div>

                    <div className="font-bold text-slate-800">${formatPrice(entry.current_price)}</div>
                    <div className={isPositive ? 'font-bold text-emerald-500' : 'font-bold text-rose-500'}>
                      {isPositive ? '+' : ''}
                      {entry.price_change_percentage_24h.toFixed(2)}%
                    </div>
                    <div className="font-semibold text-slate-700">{formatCompactCurrency(entry.total_volume)}</div>
                    <div className="text-right font-bold text-slate-800">{formatCompactCurrency(entry.market_cap)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-4 text-lg font-black tracking-[-0.04em] text-slate-800">Recent activity</div>

            <div className="space-y-3">
              {recentDeposits.length === 0 && recentTrades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d9e3ee] bg-[#f7f9fc] p-4 text-sm text-slate-500">
                  No account activity yet.
                </div>
              ) : (
                <>
                  {recentDeposits.slice(0, 3).map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <ArrowDownToLine size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Deposit</div>
                          <div className="text-[11px] text-slate-500">{deposit.status}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-800">{formatCurrency(deposit.amount)}</div>
                        <div className="text-[11px] text-slate-500">{new Date(deposit.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}

                  {recentTrades.slice(0, 3).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <ArrowUpFromLine size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{trade.trading_pair}</div>
                          <div className="text-[11px] text-slate-500">{trade.status ?? 'active'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${Number(trade.profit_loss) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(Number(trade.profit_loss || 0))}
                        </div>
                        <div className="text-[11px] text-slate-500">{new Date(trade.opened_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
