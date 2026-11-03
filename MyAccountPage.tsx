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
    (w) => w.coin.toLowerCase() === selectedCoin.toLowerCase(),
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
    <div className="min-h-screen bg-[#edf3f8] pl-16 pt-16">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="mb-8 text-3xl font-bold text-slate-800">My Account</h1>

        <div className="mb-6 rounded-xl border border-[#dfe7f0] bg-white p-8 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500">
              <User size={32} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{username || 'User'}</div>
              <div className="text-slate-500">{user?.email}</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <ArrowDownToLine size={20} />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ArrowUpFromLine size={20} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#dfe7f0] bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="mb-6 text-xl font-semibold text-slate-800">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No withdrawals yet</div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="rounded-lg bg-[#f8fbff] p-4 ring-1 ring-[#edf2f7]">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold text-slate-800">{formatCurrency(withdrawal.amount)}</div>
                      {getStatusIcon(withdrawal.status)}
                    </div>
                    <div className="mb-1 text-sm text-slate-500">{withdrawal.crypto_type}</div>
                    <div className="mb-2 truncate font-mono text-xs text-slate-500">{withdrawal.wallet_address}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(withdrawal.created_at)}</span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
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

          <div className="rounded-xl border border-[#dfe7f0] bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="mb-6 text-xl font-semibold text-slate-800">Deposit History</h2>
            {deposits.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No deposits yet</div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <div key={deposit.id} className="rounded-lg bg-[#f8fbff] p-4 ring-1 ring-[#edf2f7]">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold text-slate-800">{formatCurrency(deposit.amount)}</div>
                      {getStatusIcon(deposit.status)}
                    </div>
                    <div className="mb-2 capitalize text-sm text-slate-500">{deposit.payment_method}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(deposit.created_at)}</span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
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

        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-[#dfe7f0] bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-2xl font-bold text-slate-800">Select Payment Method</h3>

              <div className="mb-6 space-y-4">
                <button
                  onClick={() => setSelectedPaymentMethod('crypto')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPaymentMethod === 'crypto'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-left text-slate-800">Cryptocurrency</div>
                  <div className="text-left text-sm text-slate-500">BTC, USDT, USDC, LTC, BNB, ETH</div>
                </button>
              </div>

              {selectedPaymentMethod === 'crypto' && (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-slate-500">Select Coin:</label>
                    <select
                      value={selectedCoin}
                      onChange={(e) => setSelectedCoin(e.target.value)}
                      className="w-full rounded-lg border border-[#dfe7f0] bg-[#f9fbff] p-3 text-slate-700"
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
                    <label className="mb-2 block text-sm text-slate-500">Amount (USD)</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full rounded-lg border border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-slate-700 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {selectedCoin && selectedWallet && (
                <div className="mb-6 rounded-lg bg-[#f8fbff] p-4 ring-1 ring-[#edf2f7]">
                  <div className="mb-2 text-sm text-slate-500">{selectedWallet.label} Address:</div>
                  <div className="break-all font-mono text-sm text-slate-700">{selectedWallet.address}</div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!selectedPaymentMethod || !selectedCoin || !depositAmount}
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-[#dfe7f0] bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-2xl font-bold text-slate-800">Withdraw Funds</h3>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Amount (USD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-slate-700 focus:border-blue-600 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-500">Cryptocurrency</label>
                  <select
                    value={cryptoType}
                    onChange={(e) => setCryptoType(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-slate-700 focus:border-blue-600 focus:outline-none"
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
                  <label className="mb-2 block text-sm text-slate-500">Wallet Address</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 font-mono text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
                    placeholder="Enter your wallet address"
                  />
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                  Your withdrawal will be reviewed by our team. This usually takes 24-48 hours.
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
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
