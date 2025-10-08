import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CryptoChart } from '../components/CryptoChart';
import Testimonials from '../components/Testimonials/Testimonials';

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
  const [showChat, setShowChat] = useState(false); // Live chat toggle

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
    <div className="relative min-h-screen bg-[#0a0c10] pl-16 pt-16">
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

        {/* --- Testimonials Section --- */}
        <section className="py-16 bg-gray-900 mt-12 rounded-xl">
          <h2 className="text-3xl font-bold text-center text-white mb-12">What Our Users Say</h2>
          <Testimonials />
        </section>

        {/* --- About Us Section --- */}
        <section className="py-16 max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">About Us</h2>
          <p className="text-lg mb-4 text-gray-200">
            We are a dedicated team building amazing web experiences.
          </p>
          <p className="text-lg mb-4 text-gray-200">
            Our mission is to provide top-notch services to all our users,
            ensuring reliability, innovation, and excellent support.
          </p>
          <p className="text-lg text-gray-200">
            With years of experience in the industry, we strive to make every
            interaction seamless and enjoyable.
          </p>
        </section>
      </div>

      {/* --- Live Chat Support Icon --- */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat((prev) => !prev)}
          className="bg-blue-600 text-white w-16 h-16 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-700 transition"
          title="Live Support"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.77 0-3.41-.5-4.79-1.35L3 21l1.35-4.21C3.5 15.41 3 13.77 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        {showChat && (
          <div className="absolute bottom-20 right-0 w-80 bg-[#13151f] rounded-xl shadow-xl p-4">
            <h3 className="text-white font-bold mb-2">Live Support</h3>
            <div className="h-40 overflow-y-auto text-gray-200 mb-2">
              <p>👋 Hi! How can we help you today?</p>
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
