import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Wallet2, ChevronDown, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type BalanceTab = 'assets' | 'positions';

interface BalanceProfile {
  available_balance: number | string | null;
  total_deposited?: number | string | null;
  total_withdrawn?: number | string | null;
  total_profit?: number | string | null;
}

interface TradeRow {
  id: string;
  trading_pair: string;
  trade_type: string;
  amount: number;
  entry_price: number;
  exit_price: number | null;
  profit_loss: number;
  status: string;
  opened_at: string;
  closed_at: string | null;
}

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeTrade = (trade: any): TradeRow => ({
  id: String(trade.id),
  trading_pair: trade.token_pair ?? trade.trading_pair ?? 'Unknown pair',
  trade_type: String(trade.trade_type ?? 'buy').toLowerCase(),
  amount: Number(trade.amount ?? 0),
  entry_price: Number(trade.execution_price ?? trade.entry_price ?? 0),
  exit_price: trade.exit_price == null ? null : Number(trade.exit_price),
  profit_loss: Number(trade.profit_loss ?? 0),
  status: String(trade.status ?? 'active').toLowerCase(),
  opened_at: trade.created_at ?? trade.opened_at ?? new Date().toISOString(),
  closed_at: trade.closed_at ?? null,
});

interface BalancePageProps {
  onNavigate?: (page: string) => void;
}

export const BalancePage = ({ onNavigate }: BalancePageProps) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BalanceProfile | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BalanceTab>('positions');
  const [searchTerm, setSearchTerm] = useState('');

  const loadBalance = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setBalanceLoading(false);
      setBalanceError('Sign in to view your account balance.');
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('available_balance, total_deposited, total_withdrawn, total_profit')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Balance page Supabase query failed:', error);
      setProfile(null);
      setBalanceError(`${error.message} (user ID: ${user.id})`);
    } else if (!data) {
      setProfile(null);
      setBalanceError(`No user_profiles row found for your signed-in account (user ID: ${user.id}).`);
    } else {
      setProfile(data as BalanceProfile);
    }
    setBalanceLoading(false);
  }, [user]);

  const loadTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setTradesError(null);
      return;
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Balance page trades query failed:', error);
      setTrades([]);
      setTradesError(error.message);
      return;
    }

    setTrades((data ?? []).map(normalizeTrade));
    setTradesError(null);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void loadBalance();
    void loadTrades();
    if (!user) return;

    const refresh = window.setInterval(() => {
      void loadBalance();
      void loadTrades();
    }, 10000);
    const balanceChannel = supabase
      .channel(`balance-page-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}`,
      }, () => void loadBalance())
      .subscribe();
    const tradesChannel = supabase
      .channel(`balance-trades-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}`,
      }, () => void loadTrades())
      .subscribe();

    return () => {
      window.clearInterval(refresh);
      void supabase.removeChannel(balanceChannel);
      void supabase.removeChannel(tradesChannel);
    };
  }, [authLoading, user, loadBalance, loadTrades]);

  const visibleTrades = trades.filter((trade) =>
    trade.trading_pair.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const openTradesCount = trades.filter((trade) => trade.status === 'active' || trade.status === 'open').length;
  const closedTradesCount = trades.length - openTradesCount;

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1460px]">
        <section className="mb-5 rounded-2xl border border-[#dfe7f0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Available account balance</div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {balanceLoading ? 'Loading…' : money(profile?.available_balance)}
              </div>
            </div>
            <button type="button" onClick={() => { void loadBalance(); void loadTrades(); }} disabled={balanceLoading || authLoading}
              className="flex items-center gap-2 rounded-lg border border-[#dfe7f0] px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={15} className={balanceLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {balanceError && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load your Supabase balance: {balanceError}</div>}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Total deposited</div><div className="mt-1 font-semibold text-slate-800">{money(profile?.total_deposited)}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Total withdrawn</div><div className="mt-1 font-semibold text-slate-800">{money(profile?.total_withdrawn)}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Total profit</div><div className="mt-1 font-semibold text-slate-800">{money(profile?.total_profit)}</div></div>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-[#f3f6fb] p-1 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <button type="button" onClick={() => setActiveTab('assets')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'assets' ? 'bg-white text-[#1d4ed8] shadow-sm ring-1 ring-[#dfe7f0]' : 'text-slate-500 hover:text-slate-800'}`}>
              Assets ({trades.length})
            </button>
            <button type="button" onClick={() => setActiveTab('positions')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'positions' ? 'bg-white text-[#1d4ed8] shadow-sm ring-1 ring-[#dfe7f0]' : 'text-slate-500 hover:text-slate-800'}`}>
              Positions ({openTradesCount} open · {closedTradesCount} closed)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50" aria-label="Add asset">
              <Plus size={16} />
            </button>
            <button type="button" onClick={() => onNavigate?.('trade')}
              className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3fb8]">
              + Buy
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-[#dfe7f0] bg-[#f4f7fb] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe7f0] bg-[#f7f9fc] px-5 py-4">
            <div className="text-[18px] font-semibold text-slate-700">{activeTab === 'assets' ? 'Assets & trades' : 'Positions'}</div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search pairs..."
                  className="h-9 w-[210px] rounded-lg border border-[#dfe7f0] bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#a7c4ff]" />
              </div>
              {activeTab === 'positions' && <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50" aria-label="Position filters"><SlidersHorizontal size={15} /></button>}
            </div>
          </div>

          {tradesError && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load trades: {tradesError}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-[#f9fbff] text-[11px] uppercase tracking-[0.12em] text-slate-500">
                {activeTab === 'assets' ? (
                  <tr>{['Asset / Pair', 'Trade', 'Quantity', 'Entry price', 'Status', 'Opened'].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}{header !== 'Asset / Pair' && <ChevronDown className="ml-1 inline" size={11} />}</th>)}</tr>
                ) : (
                  <tr>{['Position', 'Direction', 'Size', 'Entry price', 'Exit price', 'Profit / Loss', 'Status', 'Opened / Closed'].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}{header !== 'Position' && <ChevronDown className="ml-1 inline" size={11} />}</th>)}</tr>
                )}
              </thead>
              <tbody>
                {visibleTrades.length === 0 ? (
                  <tr><td colSpan={activeTab === 'assets' ? 6 : 8} className="px-4 py-16 text-center text-slate-500">
                    <div className="mb-3 flex justify-center text-slate-300"><Wallet2 size={30} /></div>
                    {searchTerm ? 'No trades match this pair.' : activeTab === 'assets' ? 'Assets from your buy and sell trades will appear here.' : 'Your open and closed positions will appear here.'}
                  </td></tr>
                ) : visibleTrades.map((trade) => {
                  const isOpen = trade.status === 'active' || trade.status === 'open';
                  const isBuy = trade.trade_type === 'buy';
                  return activeTab === 'assets' ? (
                    <tr key={trade.id} className="border-t border-[#e8eef5] bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-800">{trade.trading_pair}</td>
                      <td className={`px-4 py-3 font-semibold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>{isBuy ? 'Buy' : 'Sell'}</td>
                      <td className="px-4 py-3">{trade.amount}</td>
                      <td className="px-4 py-3">{money(trade.entry_price)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{isOpen ? 'Open' : 'Closed'}</span></td>
                      <td className="px-4 py-3">{formatDate(trade.opened_at)}</td>
                    </tr>
                  ) : (
                    <tr key={trade.id} className="border-t border-[#e8eef5] bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-800">{trade.trading_pair}</td>
                      <td className={`px-4 py-3 font-semibold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>{isBuy ? 'Buy' : 'Sell'}</td>
                      <td className="px-4 py-3">{trade.amount}</td>
                      <td className="px-4 py-3">{money(trade.entry_price)}</td>
                      <td className="px-4 py-3">{trade.exit_price == null ? '—' : money(trade.exit_price)}</td>
                      <td className={`px-4 py-3 font-semibold ${trade.profit_loss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(trade.profit_loss)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{isOpen ? 'Open' : 'Closed'}</span></td>
                      <td className="px-4 py-3">{formatDate(isOpen ? trade.opened_at : trade.closed_at ?? trade.opened_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancePage;
