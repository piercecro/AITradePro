import { useEffect, useState } from 'react';
import { Activity, FlaskConical, LayoutDashboard, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CryptoChart } from '../components/CryptoChart';

type DashboardMode = 'dashboard' | 'live-trading' | 'demo';

interface DashboardPageProps {
  mode?: DashboardMode;
}

type TradeRow = {
  id: string;
  trading_pair: string;
  trade_type: string;
  amount: number;
  profit_loss: number;
  status: string;
  opened_at?: string | null;
  created_at?: string | null;
};

const modeMeta: Record<DashboardMode, { title: string; subtitle: string; Icon: typeof LayoutDashboard }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your account and markets', Icon: LayoutDashboard },
  'live-trading': { title: 'Live Trading', subtitle: 'Real-time market chart', Icon: Activity },
  demo: { title: 'Demo Trading', subtitle: 'Practice with market charts, no risk', Icon: FlaskConical },
};

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const DashboardPage = ({ mode = 'dashboard' }: DashboardPageProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const { title, subtitle, Icon } = modeMeta[mode];

  useEffect(() => {
    if (!user || mode === 'demo') return;
    let cancelled = false;

    const load = async () => {
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('available_balance, total_profit')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) console.error('Dashboard profile error:', profileErr.message);
      if (!cancelled) {
        setBalance(Number(profile?.available_balance ?? 0));
        setTotalProfit(Number(profile?.total_profit ?? 0));
      }

      const { data: tradeData, error: tradeErr } = await supabase
        .from('trades')
        .select('id, trading_pair, trade_type, amount, profit_loss, status, opened_at, created_at')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false })
        .limit(5);

      if (tradeErr) console.error('Dashboard trades error:', tradeErr.message);
      if (!cancelled) setTrades((tradeData as TradeRow[]) ?? []);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, mode]);

  const showStats = mode === 'dashboard';

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1460px] space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-[#dfe7f0]">
            <Icon className="h-5 w-5 text-[#1d4ed8]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {showStats && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#dfe7f0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Wallet className="h-4 w-4" /> Available balance
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-800">{money(balance)}</div>
            </div>
            <div className="rounded-2xl border border-[#dfe7f0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp className="h-4 w-4" /> Total profit
              </div>
              <div
                className={`mt-2 text-2xl font-semibold ${
                  totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {money(totalProfit)}
              </div>
            </div>
          </div>
        )}

        <CryptoChart />

        {showStats && (
          <div className="rounded-2xl border border-[#dfe7f0] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent trades</h2>
            {trades.length === 0 ? (
              <p className="text-sm text-slate-500">No trades yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Pair</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">P/L</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t.id} className="border-t border-[#eef2f7]">
                        <td className="py-2 pr-4">{t.trading_pair}</td>
                        <td className="py-2 pr-4">{t.trade_type}</td>
                        <td className="py-2 pr-4">{money(Number(t.amount))}</td>
                        <td
                          className={`py-2 pr-4 ${
                            Number(t.profit_loss) >= 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {money(Number(t.profit_loss))}
                        </td>
                        <td className="py-2">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
