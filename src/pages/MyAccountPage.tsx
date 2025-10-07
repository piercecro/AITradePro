import { useState, useEffect } from 'react';
import { User, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Withdrawal {
  id: string;
  amount: number;
  wallet_address: string;
  crypto_type: string;
  status: string;
  created_at: string;
}

interface Deposit {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface PlatformWallet {
  id: number;
  coin: string;
  network: string;
  address: string;
  label: string;
}

export const MyAccountPage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoType, setCryptoType] = useState('BTC');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTransactions();
      loadWallets();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setUsername(data.username || '');
    }
  };

  const loadWallets = async () => {
    const { data, error } = await supabase.from('platform_wallets').select('*');
    if (error) console.error('Error loading wallets:', error);
    if (data) setWallets(data);
  };

  const loadTransactions = async () => {
    const { data: withdrawalsData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (withdrawalsData) setWithdrawals(withdrawalsData);

    const { data: depositsData } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (depositsData) setDeposits(depositsData);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user?.id,
        amount: parseFloat(withdrawAmount),
        wallet_address: walletAddress,
        crypto_type: cryptoType,
        status: 'pending',
      });

      if (error) throw error;

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWalletAddress('');
      loadTransactions();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

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

      // ✅ Redirect to BitPay after logging deposit
      window.open('https://bitpay.com', '_blank');
      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedCoin('');
      setSelectedPaymentMethod('');
      loadTransactions();
    } catch (err: any) {
      alert('Deposit error: ' + err.message);
    }
  };

  const selectedWallet = wallets.find(
    (w) => w.coin.toLowerCase() === selectedCoin.toLowerCase()
  );

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">My Account</h1>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <div className="text-white text-2xl font-bold">{username || 'User'}</div>
              <div className="text-gray-400">{user?.email}</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <ArrowDownToLine size={20} />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <ArrowUpFromLine size={20} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawals */}
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <h2 className="text-white text-xl font-semibold mb-6">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No withdrawals yet</div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 bg-[#1a1d29] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold">{formatCurrency(withdrawal.amount)}</div>
                      {getStatusIcon(withdrawal.status)}
                    </div>
                    <div className="text-gray-400 text-sm mb-1">{withdrawal.crypto_type}</div>
                    <div className="text-gray-500 text-xs font-mono mb-2 truncate">{withdrawal.wallet_address}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{formatDate(withdrawal.created_at)}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          withdrawal.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-500'
                            : withdrawal.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deposits */}
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <h2 className="text-white text-xl font-semibold mb-6">Deposit History</h2>
            {deposits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No deposits yet</div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <div key={deposit.id} className="p-4 bg-[#1a1d29] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold">{formatCurrency(deposit.amount)}</div>
                      {getStatusIcon(deposit.status)}
                    </div>
                    <div className="text-gray-400 text-sm mb-2 capitalize">{deposit.payment_method}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{formatDate(deposit.created_at)}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
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

        {/* Deposit Modal */}
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
              </div>

              {selectedPaymentMethod === 'crypto' && (
                <>
                  <div className="mb-4">
                    <label className="text-gray-400 text-sm mb-2 block">Select Coin:</label>
                    <select
                      value={selectedCoin}
                      onChange={(e) => setSelectedCoin(e.target.value)}
                      className="w-full bg-[#1a1d29] border border-gray-700 text-white p-3 rounded-lg"
                    >
                      <option value="">-- Select Coin --</option>
                      {wallets.map((w) => (
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
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!selectedPaymentMethod || !selectedCoin || !depositAmount}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#13151f] rounded-xl p-8 max-w-md w-full border border-gray-800">
              <h3 className="text-white text-2xl font-bold mb-6">Withdraw Funds</h3>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Amount (USD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10"
                    step="0.01"
                    required
                    className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Cryptocurrency</label>
                  <select
                    value={cryptoType}
                    onChange={(e) => setCryptoType(e.target.value)}
                    className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="USDT">Tether (USDT)</option>
                    <option value="USDC">USD Coin (USDC)</option>
                    <option value="LTC">Litecoin (LTC)</option>
                    <option value="BNB">Binance Coin (BNB)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Wallet Address</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none font-mono text-sm"
                    placeholder="Enter your wallet address"
                  />
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="text-yellow-500 text-sm">
                    Your withdrawal will be reviewed by our team. This usually takes 24-48 hours.
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
