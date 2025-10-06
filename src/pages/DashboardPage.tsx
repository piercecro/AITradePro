import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CryptoChart } from '../components/CryptoChart'; // ✅ Correct import

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
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (profileData) setProfile(profileData);

    // Fetch recent trades
    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user?.id)
      .order('opened_at', { ascending: false })
      .limit(5);

    if (tradesData) setRecentTrades(tradesData);

    // Fetch recent deposits
    const { data: depositsData } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (depositsData) setRecentDeposits(depositsData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">Dashboard</h1>

        {/* 💰 Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Available Balance</span>
              <Wallet size={20} className="text-blue-200" />
            </div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(profile?.available_balance || 0)}
            </div>
          </div>

          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Deposited</span>
              <ArrowDownToLine size={20} className="text-green-500" />
            </div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(profile?.total_deposited || 0)}
            </div>
          </div>

          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Withdrawn</span>
              <ArrowUpFromLine size={20} className="text-red-500" />
            </div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(profile?.total_withdrawn || 0)}
            </div>
          </div>

          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Profit</span>
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <div
              className={`text-3xl font-bold ${
                (profile?.total_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatCurrency(profile?.total_profit || 0)}
            </div>
          </div>
        </div>

        {/* 📈 Crypto & Metals Chart */}
        <div className="mb-8">
          <CryptoChart />
        </div>

        {/* 🧾 Recent trades and deposits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trades */}
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <h2 className="text-white text-xl font-semibold mb-6">Recent Trades</h2>

            {recentTrades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No recent trades</div>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 bg-[#1a1d29] rounded-lg"
                  >
                    <div>
                      <div className="text-white font-semibold">{trade.trading_pair}</div>
                      <div className="text-gray-400 text-sm">{formatDate(trade.opened_at)}</div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {formatCurrency(trade.profit_loss)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deposits */}
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <h2 className="text-white text-xl font-semibold mb-6">Recent Deposits</h2>

            {recentDeposits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No recent deposits</div>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 bg-[#1a1d29] rounded-lg"
                  >
                    <div>
                      <div className="text-white font-semibold">
                        {formatCurrency(deposit.amount)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatDate(deposit.created_at)}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deposit.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-500'
                            : deposit.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
