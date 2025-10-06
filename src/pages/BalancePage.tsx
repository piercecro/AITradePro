import { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  available_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_profit: number;
}

export const BalancePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleDeposit = () => {
    if (selectedPaymentMethod === 'crypto') {
      window.open('https://bitpay.com', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">Balance</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Available Balance</span>
              <Wallet size={20} className="text-blue-500" />
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
              <ArrowUpToLine size={20} className="text-red-500" />
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
            <div className="text-white text-3xl font-bold">
              {formatCurrency(profile?.total_profit || 0)}
            </div>
          </div>
        </div>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800">
          <h2 className="text-white text-xl font-semibold mb-6">Deposit Funds</h2>

          <button
            onClick={() => setShowDepositModal(true)}
            className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowDownToLine size={20} />
            <span>Deposit</span>
          </button>
        </div>

        {showDepositModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#13151f] rounded-xl p-8 max-w-md w-full border border-gray-800">
              <h3 className="text-white text-2xl font-bold mb-6">Select Payment Method</h3>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod('crypto')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'crypto'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-white font-semibold text-left">Cryptocurrency</div>
                  <div className="text-gray-400 text-sm text-left">BTC, USDT, USDC, LTC, BNB, ETH</div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('bank')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'bank'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-white font-semibold text-left">Bank Transfer</div>
                  <div className="text-gray-400 text-sm text-left">Direct bank deposit</div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-white font-semibold text-left">PayPal</div>
                  <div className="text-gray-400 text-sm text-left">Pay with PayPal account</div>
                </button>
              </div>

              {selectedPaymentMethod && (
                <div className="mb-6 p-4 bg-[#1a1d29] rounded-lg">
                  <div className="text-gray-400 text-sm mb-2">Platform Wallet Address:</div>
                  <div className="text-white text-sm font-mono break-all">
                    bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!selectedPaymentMethod}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ArrowUpToLine = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
    <line x1="5" y1="3" x2="19" y2="3" />
  </svg>
);

const TrendingUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
