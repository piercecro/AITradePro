import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CryptoChart } from '../components/CryptoChart';

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

export const DashboardPage = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${Math.abs(value).toFixed(2)}%`;
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

  const portfolioValue = profile?.available_balance ?? 0;

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1360px]">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.8fr)_320px]">
          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Portfolio value</div>
                <div className="mt-2 text-5xl font-light tracking-[-0.08em] text-slate-800">
                  ${formatCurrency(portfolioValue).replace('$', '')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">1D</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">3D</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">1W</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">1M</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">3M</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">1Y</button>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-2xl font-light text-slate-800">$0</span>
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
              <div className="text-sm font-medium text-slate-500">Amount in Open Trades</div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2 py-1 text-slate-500">1D</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2 py-1 text-slate-500">3D</button>
                <button className="rounded-lg border border-[#dfe7f0] bg-white px-2 py-1 text-slate-500">1W</button>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] text-slate-400">Open trades</div>
                <div className="mt-2 text-4xl font-light tracking-[-0.08em] text-slate-800">$0</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm text-slate-500">0% of portfolio</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm text-slate-500">PnL in Open Trades</div>
                <div className="mt-2 text-4xl font-light tracking-[-0.08em] text-slate-800">$0</div>
                <div className="mt-1 text-xs text-slate-400">0.00% on the amount in trades</div>
              </div>

              <div className="border-t border-[#e0e7ef] pt-4">
                <div className="text-sm text-slate-500">Potential Profit</div>
                <div className="mt-2 text-4xl font-light tracking-[-0.08em] text-slate-800">$0</div>
                <div className="mt-1 text-xs text-slate-400">If every take-profit fills</div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xl font-semibold text-slate-700">Open Trades</div>
              <button className="text-sm font-medium text-sky-600">See all</button>
            </div>

            <div className="flex min-h-[260px] items-center justify-center rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] px-4 text-center">
              <div>
                <div className="mb-4 flex justify-center text-slate-300">
                  <Wallet size={34} />
                </div>
                <div className="text-2xl font-medium text-slate-500">No open trades</div>
                <button className="mt-5 rounded-xl bg-[#1d73f5] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1667d8]">
                  Create Trade
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xl font-semibold text-slate-700">Accounts</div>
              <button className="text-sm font-medium text-sky-600">See all</button>
            </div>

            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2f8] text-slate-400">
                <Wallet size={28} />
              </div>
              <div className="text-2xl font-medium text-slate-500">No exchange accounts connected</div>
              <div className="mt-2 text-sm text-slate-400">You haven&apos;t connected an exchange account to Cornix</div>
              <button className="mt-5 rounded-xl bg-[#1d73f5] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1667d8]">
                Create Account
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[18px] border border-[#dfe7f0] bg-[#f3f6fa] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-[#dfe7f0] px-5 py-4">
            <div className="text-xl font-semibold text-slate-700">Market</div>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
              <button className="rounded-t-lg border-b-2 border-[#1d73f5] px-2 py-2 text-sky-600">Volume</button>
              <button className="px-2 py-2">Top Gainers</button>
              <button className="px-2 py-2">Top Losers</button>
              <button className="px-2 py-2">See all</button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#e3ebf4] bg-[#f7f9fc] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>Pair</span>
              <span>Last price</span>
              <span>24h change</span>
              <span>24h low / high</span>
              <span className="text-right">24h volume</span>
            </div>

            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 px-5 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f8d24d] text-[10px] font-bold text-[#7a5200]">BTC</span>
                <span className="font-medium text-slate-700">BULLA/USDT</span>
              </div>
              <div>0.15402</div>
              <div className="text-emerald-500">+73.77%</div>
              <div>$0.00</div>
              <div className="text-right">$270.96M</div>
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
