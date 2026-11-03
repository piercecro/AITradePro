import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Wallet2, ChevronDown, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const positionHeaders = [
  'Position',
  'Direction',
  'Size',
  'Margin',
  'UPNL',
  'Entry price',
  'Liq. price',
  'Price (24h)',
];

const assetHeaders = ['Coin', 'Accounts', 'Total', 'Available', 'Quantity', 'Price', 'Price (24h)'];

interface BalanceProfile {
  available_balance: number | string | null;
  total_deposited?: number | string | null;
  total_withdrawn?: number | string | null;
  total_profit?: number | string | null;
}

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));

export const BalancePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BalanceProfile | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

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

  useEffect(() => {
    if (authLoading) return;
    void loadBalance();
    if (!user) return;

    const interval = window.setInterval(() => void loadBalance(), 10000);
    const channel = supabase
      .channel(`balance-page-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}`,
      }, () => void loadBalance())
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, user, loadBalance]);

  const [activeTab, setActiveTab] = useState<'assets' | 'positions'>('positions');

  const tabs = [
    { key: 'assets', label: 'Assets', count: 0 },
    { key: 'positions', label: 'Positions', count: 0 },
  ] as const;

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
              <div className="mt-1 text-xs text-slate-500">Live value from your Supabase user profile</div>
            </div>
            <button type="button" onClick={() => void loadBalance()} disabled={balanceLoading || authLoading}
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-[#f3f6fb] p-1 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white text-[#1d4ed8] shadow-sm ring-1 ring-[#dfe7f0]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label} {count > 0 ? `(${count})` : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Add asset"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3fb8]"
            >
              + Buy
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-[#dfe7f0] bg-[#f4f7fb] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-[#dfe7f0] bg-[#f7f9fc] px-5 py-4">
            <div className="text-[18px] font-semibold text-slate-700">
              {activeTab === 'assets' ? 'Assets' : 'Positions'}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-[210px] rounded-lg border border-[#dfe7f0] bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#a7c4ff]"
                />
              </div>

              {activeTab === 'positions' && (
                <>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Position filters"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3fb8]"
                  >
                    + Buy
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-b-[18px]">
            {activeTab === 'positions' ? (
              <>
                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {positionHeaders.map((header) => (
                    <div key={header} className="flex items-center gap-1">
                      <span>{header}</span>
                      {header !== 'Position' && <ChevronDown size={11} className="text-slate-400" />}
                    </div>
                  ))}
                </div>

                <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 bg-[#f4f7fb] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-white text-slate-300 shadow-sm">
                    <Wallet2 size={28} />
                  </div>

                  <div className="text-[18px] font-semibold text-slate-700">You don't have any positions</div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {assetHeaders.map((header) => (
                    <div key={header} className="flex items-center gap-1">
                      <span>{header}</span>
                      {header !== 'Coin' && <ChevronDown size={11} className="text-slate-400" />}
                    </div>
                  ))}
                </div>

                <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 bg-[#f4f7fb] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-white text-slate-300 shadow-sm">
                    <Wallet2 size={28} />
                  </div>

                  <div className="text-[18px] font-semibold text-slate-700">You don't have any coins</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancePage;
