import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { fetchLivePrices } from '../lib/livePrices';

interface UserProfile {
  id: string;
  available_balance: number | string;
  total_deposited: number | string;
  total_withdrawn: number | string;
  total_profit: number | string;
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

interface PlatformWallet {
  id: number;
  coin: string;
  network: string;
  address: string;
  label: string;
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [marketEntries, setMarketEntries] = useState<MarketEntry[]>(staticMarketEntries);
  const [marketTab, setMarketTab] = useState<MarketTab>('Volume');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoType, setCryptoType] = useState('BTC');

  const isDemoMode = mode === 'demo';

  useEffect(() => {
    let active = true;

    const refreshMarketEntries = async () => {
      const live = await fetchLivePrices();

      if (!active) return;

      setMarketEntries((prev) =>
        prev.map((entry) => {
          const quote = live[entry.pair];
          if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
            return entry;
          }

          const nextChange = Number(quote.change24h ?? entry.price_change_percentage_24h);

          return {
            ...entry,
            current_price: Number(quote.price),
            price_change_percentage_24h: Number.isFinite(nextChange)
              ? nextChange
              : entry.price_change_percentage_24h,
          };
        }),
      );
    };

    void refreshMarketEntries();

    const refreshId = window.setInterval(() => {
      void refreshMarketEntries();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, []);

  const loadDashboardData = async () => {
    if (!user) {
      setProfile(null);
      setRecentTrades([]);
      setRecentDeposits([]);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    const { data: profileData, error: queryError } = await supabase
      .from('user_profiles')
      .select('id, available_balance, total_deposited, total_withdrawn, total_profit')
      .eq('id', user.id)
      .maybeSingle();

    if (queryError) {
      console.error('Error fetching user profile in dashboard:', queryError.message);
      setProfile(null);
      setProfileError(queryError.message);
    } else if (profileData) {
      setProfile(profileData as UserProfile);
    } else {
      setProfile(null);
      setProfileError('No user_profiles row was found for this signed-in account.');
    }
    setProfileLoading(false);

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(5);

    const { data: depositsData } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentTrades((tradesData as Trade[]) ?? []);
    setRecentDeposits((depositsData as Deposit[]) ?? []);
  };

  const loadWallets = async () => {
    const { data } = await supabase.from('platform_wallets').select('*');
    if (data) {
      setWallets(data as PlatformWallet[]);
    }
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRecentTrades([]);
      setRecentDeposits([]);
      setWallets([]);
      return;
    }

    void loadDashboardData();
    void loadWallets();

    const refreshId = window.setInterval(() => {
      void loadDashboardData();
    }, 15000);

    const channel = supabase
      .channel(`dashboard-profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}` },
        () => void loadDashboardData(),
      )
      .subscribe();

    return () => {
      window.clearInterval(refreshId);
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const portfolioBalance = Number(profile?.available_balance ?? 0);
  const totalProfit = Number(profile?.total_profit ?? 0);
  const totalDeposited = Number(profile?.total_deposited ?? 0);
  const totalWithdrawn = Number(profile?.total_withdrawn ?? 0);

  const portfolioChartData = useMemo(() => {
    const baseBalance = portfolioBalance;
    const points = [0.72, 0.78, 0.86, 0.83, 0.94, 1.02, 1.12, 1.06];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

    return labels.map((label, index) => ({
      name: label,
      value: Number((baseBalance * points[index]).toFixed(2)),
    }));
  }, [portfolioBalance]);

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
    }).format(Number(value || 0));

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

  const selectedWallet = wallets.find((w) => w.coin.toLowerCase() === selectedCoin.toLowerCase());

  const handleDeposit = async () => {
    if (!user || !selectedCoin || !depositAmount) return;

    try {
      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: Number(depositAmount),
        payment_method: `${selectedCoin} (${selectedPaymentMethod})`,
        status: 'pending',
      });

      if (error) throw error;

      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedCoin('');
      setSelectedPaymentMethod('');
      await loadDashboardData();
      if (typeof window !== 'undefined') {
        window.open('https://bitpay.com', '_blank');
      }
    } catch (err: any) {
      alert('Deposit error: ' + err.message);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount: Number(withdrawAmount),
        wallet_address: walletAddress,
        crypto_type: cryptoType,
        status: 'pending',
      });

      if (error) throw error;

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWalletAddress('');
      await loadDashboardData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
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
                {profileLoading && <div className="mt-1 text-xs text-slate-500">Refreshing account balance…</div>}
                {profileError && (
                  <div className="mt-2 max-w-xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Could not load your Supabase balance: {profileError}. Check that your user_profiles row has id = your Auth user ID and that the available_balance column exists and is readable.
                  </div>
                )}
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

            <div className="relative h-[250px] rounded-[14px] border border-dashed border-[#d9e3ee] bg-[#f7f9fc] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioChartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d73f5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1d73f5" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#dfe7f0" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 2500', 'dataMax + 2500']} />
                  <Tooltip
                    formatter={(value: number | string) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 12, border: '1px solid #dfe7f0', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#1d73f5" strokeWidth={3} fill="url(#portfolioChartFill)" />
                </AreaChart>
              </ResponsiveContainer>
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
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-500">Available balance</div>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    className="rounded-lg bg-[#1d73f5] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1667d8]"
                  >
                    Deposit
                  </button>
                </div>
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
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-500">Withdrawn</div>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(true)}
                      className="rounded-lg border border-[#dfe7f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Withdraw
                    </button>
                  </div>
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
                        <div className=\"font-bold text-slate-800\">{entry.pair}</div>
                        <div className=\"text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400\">{entry.name}</div>
                      </div>
                    </div>

                    <div className=\"font-bold text-slate-800\">${formatPrice(entry.current_price)}</div>
                    <div className={isPositive ? 'font-bold text-emerald-500' : 'font-bold text-rose-500'}>
                      {isPositive ? '+' : ''}
                      {entry.price_change_percentage_24h.toFixed(2)}%
                    </div>
                    <div className=\"font-semibold text-slate-700\">{formatCompactCurrency(entry.total_volume)}</div>
                    <div className=\"text-right font-bold text-slate-800\">{formatCompactCurrency(entry.market_cap)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className=\"rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]\">
            <div className=\"mb-4 text-lg font-black tracking-[-0.04em] text-slate-800\">Recent activity</div>

            <div className=\"space-y-3\">
              {recentDeposits.length === 0 && recentTrades.length === 0 ? (
                <div className=\"rounded-xl border border-dashed border-[#d9e3ee] bg-[#f7f9fc] p-4 text-sm text-slate-500\">
                  No account activity yet.
                </div>
              ) : (
                <>
                  {recentDeposits.slice(0, 3).map((deposit) => (
                    <div key={deposit.id} className=\"flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-3\">
                      <div className=\"flex items-center gap-3\">
                        <div className=\"flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700\">
                          <ArrowDownToLine size={16} />
                        </div>
                        <div>
                          <div className=\"text-sm font-bold text-slate-800\">Deposit</div>
                          <div className=\"text-[11px] text-slate-500\">{deposit.status}</div>
                        </div>
                      </div>
                      <div className=\"text-right\">
                        <div className=\"text-sm font-black text-slate-800\">{formatCurrency(deposit.amount)}</div>
                        <div className=\"text-[11px] text-slate-500\">{new Date(deposit.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}

                  {recentTrades.slice(0, 3).map((trade) => (
                    <div key={trade.id} className=\"flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#f8fbff] p-3\">
                      <div className=\"flex items-center gap-3\">
                        <div className=\"flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700\">
                          <ArrowUpFromLine size={16} />
                        </div>
                        <div>
                          <div className=\"text-sm font-bold text-slate-800\">{trade.trading_pair}</div>
                          <div className=\"text-[11px] text-slate-500\">{trade.status ?? 'active'}</div>
                        </div>
                      </div>
                      <div className=\"text-right\">
                        <div className={`text-sm font-black ${Number(trade.profit_loss) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(Number(trade.profit_loss || 0))}
                        </div>
                        <div className=\"text-[11px] text-slate-500\">{new Date(trade.opened_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {showDepositModal && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4\">
          <div className=\"w-full max-w-md rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-xl\">
            <h3 className=\"mb-6 text-2xl font-bold text-slate-800\">Select Payment Method</h3>

            <div className=\"mb-6 space-y-4\">
              <button
                type=\"button\"
                onClick={() => setSelectedPaymentMethod('crypto')}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  selectedPaymentMethod === 'crypto' ? 'border-[#1d73f5] bg-[#eff6ff]' : 'border-[#dfe7f0] hover:border-[#c7d7ef]'
                }`}
              >
                <div className=\"font-semibold text-slate-800\">Cryptocurrency</div>
                <div className=\"mt-1 text-sm text-slate-500\">BTC, USDT, USDC, LTC, BNB, ETH</div>
              </button>
            </div>

            {selectedPaymentMethod === 'crypto' && (
              <>
                <div className=\"mb-4\">
                  <label className=\"mb-2 block text-sm text-slate-500\">Select Coin</label>
                  <select
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    className=\"w-full rounded-xl border border-[#dfe7f0] bg-[#f9fbff] px-3 py-3 text-slate-700 outline-none\"
                  >
                    <option value=\"\">-- Select Coin --</option>
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.coin}>
                        {wallet.coin} ({wallet.network})
                      </option>
                    ))}
                  </select>
                </div>

                <div className=\"mb-4\">
                  <label className=\"mb-2 block text-sm text-slate-500\">Amount (USD)</label>
                  <input
                    type=\"number\"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder=\"Enter amount\"
                    min=\"1\"
                    className=\"w-full rounded-xl border border-[#dfe7f0] bg-[#f9fbff] px-3 py-3 text-slate-700 outline-none\"
                  />
                </div>
              </>
            )}

            {selectedCoin && selectedWallet && (
              <div className=\"mb-6 rounded-xl border border-[#dfe7f0] bg-[#f8fbff] p-4\">
                <div className=\"mb-2 text-sm text-slate-500\">{selectedWallet.label} Address</div>
                <div className=\"break-all font-mono text-sm text-slate-700\">{selectedWallet.address}</div>
              </div>
            )}

            <div className=\"flex gap-3\">
              <button
                type=\"button\"
                onClick={() => {
                  setShowDepositModal(false);
                  setSelectedPaymentMethod('');
                  setSelectedCoin('');
                  setDepositAmount('');
                }}
                className=\"flex-1 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300\"
              >
                Cancel
              </button>
              <button
                type=\"button\"
                onClick={handleDeposit}
                disabled={!selectedPaymentMethod || !selectedCoin || !depositAmount}
                className=\"flex-1 rounded-xl bg-[#1d73f5] px-4 py-3 font-semibold text-white hover:bg-[#1667d8] disabled:cursor-not-allowed disabled:opacity-50\"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4\">
          <div className=\"w-full max-w-md rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-xl\">
            <h3 className=\"mb-6 text-2xl font-bold text-slate-800\">Withdraw Funds</h3>

            <form onSubmit={handleWithdraw} className=\"space-y-4\">
              <div>
                <label className=\"mb-2 block text-sm text-slate-500\">Amount (USD)</label>
                <input
                  type=\"number\"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min=\"10\"
                  step=\"0.01\"
                  required
                  placeholder=\"Enter amount\"
                  className=\"w-full rounded-xl border border-[#dfe7f0] bg-[#f9fbff] px-3 py-3 text-slate-700 outline-none\"
                />
              </div>

              <div>
                <label className=\"mb-2 block text-sm text-slate-500\">Cryptocurrency</label>
                <select
                  value={cryptoType}
                  onChange={(e) => setCryptoType(e.target.value)}
                  className=\"w-full rounded-xl border border-[#dfe7f0] bg-[#f9fbff] px-3 py-3 text-slate-700 outline-none\"
                >
                  <option value=\"BTC\">Bitcoin (BTC)</option>
                  <option value=\"USDT\">Tether (USDT)</option>
                  <option value=\"USDC\">USD Coin (USDC)</option>
                  <option value=\"LTC\">Litecoin (LTC)</option>
                  <option value=\"BNB\">Binance Coin (BNB)</option>
                  <option value=\"ETH\">Ethereum (ETH)</option>
                </select>
              </div>

              <div>
                <label className=\"mb-2 block text-sm text-slate-500\">Wallet Address</label>
                <input
                  type=\"text\"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  placeholder=\"Enter your wallet address\"
                  className=\"w-full rounded-xl border border-[#dfe7f0] bg-[#f9fbff] px-3 py-3 font-mono text-sm text-slate-700 outline-none\"
                />
              </div>

              <div className=\"rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700\">
                Your withdrawal will be reviewed by our team. This usually takes 24–48 hours.
              </div>

              <div className=\"flex gap-3\">
                <button
                  type=\"button\"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setWalletAddress('');
                  }}
                  className=\"flex-1 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300\"
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  className=\"flex-1 rounded-xl bg-[#1d73f5] px-4 py-3 font-semibold text-white hover:bg-[#1667d8]\"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
