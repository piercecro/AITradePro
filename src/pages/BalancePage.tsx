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

interface PlatformWallet {
  id: number;
  coin: string;
  network: string;
  address: string;
  label: string;
}

export const BalancePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      subscribeToProfileUpdates();
    }
    loadWallets();

    // Cleanup channel on unmount
    return () => {
      supabase.removeAllChannels();
    };
  }, [user]);

  // ✅ Real-time profile sync for updates (admin confirmations, etc.)
  const subscribeToProfileUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // listen for INSERT and UPDATE
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Profile change detected:', payload);
          loadProfile();
        }
      )
      .subscribe();

    return channel;
  };

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Error loading profile:', error);
    } else if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const loadWallets = async () => {
    const { data, error } = await supabase.from('platform_wallets').select('*');
    if (error) console.error('Error loading wallets:', error);
    if (data) setWallets(data);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const handleDeposit = async () => {
    if (!user || !selectedCoin || !depositAmount) return;

    try {
      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: parseFloat(depositAmount),
        payment_method: `${selectedCoin} (${selectedPaymentMethod})`,
        status: 'pending',
      });

      if (error) throw error;

      // ✅ Redirect to crypto payment
      window.open('https://bitpay.com', '_blank');

      // ✅ Reset modal
      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedCoin('');
      setSelectedPaymentMethod('');

      // ✅ Reload profile (optional, in case backend auto-adds)
      await loadProfile();
    } catch (err: any) {
      alert('Deposit error: ' + err.message);
    }
  };

  const selectedWallet = wallets.find(
    (w) => w.coin.toLowerCase() === selectedCoin.toLowerCase()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-white">
        Loading balance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">Balance</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Available Balance" icon={<Wallet size={20} className="text-blue-500" />} value={profile?.available_balance || 0} />
          <SummaryCard label="Total Deposited" icon={<ArrowDownToLine size={20} className="text-green-500" />} value={profile?.total_deposited || 0} />
          <SummaryCard label="Total Withdrawn" icon={<ArrowUpToLine size={20} className="text-red-500" />} value={profile?.total_withdrawn || 0} />
          <SummaryCard label="Total Profit" icon={<TrendingUp size={20} className="text-green-500" />} value={profile?.total_profit || 0} />
        </div>

        {/* Deposit section */}
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

        {/* Deposit Modal */}
        {showDepositModal && (
          <DepositModal
            wallets={wallets}
            selectedCoin={selectedCoin}
            setSelectedCoin={setSelectedCoin}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            selectedWallet={selectedWallet}
            onClose={() => setShowDepositModal(false)}
            onSubmit={handleDeposit}
          />
        )}
      </div>
    </div>
  );
};

/* ✅ SummaryCard subcomponent */
const SummaryCard = ({ label, icon, value }: { label: string; icon: JSX.Element; value: number }) => (
  <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-sm">{label}</span>
      {icon}
    </div>
    <div className="text-white text-3xl font-bold">
      {new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value)}
    </div>
  </div>
);

/* ✅ Deposit Modal subcomponent */
const DepositModal = ({
  wallets,
  selectedCoin,
  setSelectedCoin,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  depositAmount,
  setDepositAmount,
  selectedWallet,
  onClose,
  onSubmit,
}: any) => (
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
      </div>

      {selectedPaymentMethod === 'crypto' && (
        <>
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Select Coin:</label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="w-full bg-[#1a1d29] border border-gray-700 text-white p-3 rounded-lg focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Coin --</option>
              {wallets.map((w: any) => (
                <option key={w.id} value={w.coin}>
                  {w.coin} ({w.network})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Amount (USD)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </>
      )}

      {selectedCoin && selectedWallet && (
        <div className="mb-6 p-4 bg-[#1a1d29] rounded-lg">
          <div className="text-gray-400 text-sm mb-2">{selectedWallet.label} Address:</div>
          <div className="text-white text-sm font-mono break-all">{selectedWallet.address}</div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!selectedPaymentMethod || !selectedCoin || !depositAmount}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed
        </button>
      </div>
    </div>
  </div>
);

/* Icons */
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
