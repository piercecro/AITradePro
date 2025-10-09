import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Trade {
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

interface BotConnection {
  is_connected: boolean;
}

const tradingPairs = [
  { pair: 'USD/EUR', category: 'Forex' },
  { pair: 'USD/GBP', category: 'Forex' },
  { pair: 'USD/JPY', category: 'Forex' },
  { pair: 'USD/AUD', category: 'Forex' },
  { pair: 'EUR/GBP', category: 'Forex' },
  { pair: 'XAU/USD', name: 'Gold', category: 'Commodities' },
  { pair: 'XAG/USD', name: 'Silver', category: 'Commodities' },
  { pair: 'XCU/USD', name: 'Copper', category: 'Commodities' },
  { pair: 'SPX', name: 'S&P 500', category: 'Indices' },
  { pair: 'DJI', name: 'Dow Jones', category: 'Indices' },
  { pair: 'NASDAQ', name: 'NASDAQ', category: 'Indices' },
  { pair: 'FTSE', name: 'FTSE 100', category: 'Indices' },
];

export const TradePage = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [botConnected, setBotConnected] = useState(false);
  const [selectedPair, setSelectedPair] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadTrades();
      loadBotStatus();
    }
  }, [user]);

  const loadTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user?.id)
      .order('opened_at', { ascending: false });

    if (data) setTrades(data);
  };

  const loadBotStatus = async () => {
    const { data } = await supabase
      .from('bot_connections')
      .select('is_connected')
      .eq('user_id', user?.id)
      .eq('bot_name', 'trading_bot')
      .maybeSingle();

    if (data) setBotConnected(data.is_connected);
  };

  const handleConnectBot = async () => {
    const { data: existing } = await supabase
      .from('bot_connections')
      .select('*')
      .eq('user_id', user?.id)
      .eq('bot_name', 'trading_bot')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('bot_connections')
        .update({ is_connected: true, connected_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('bot_connections')
        .insert({
          user_id: user?.id,
          bot_name: 'trading_bot',
          is_connected: true,
          connected_at: new Date().toISOString(),
        });
    }

    setBotConnected(prev => !prev);
    setShowConnectModal(false);
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
        <h1 className="text-white text-3xl font-bold mb-8">Trade</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
              <h2 className="text-white text-xl font-semibold mb-6">Trading Pairs</h2>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search trading pairs..."
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {['Forex', 'Commodities', 'Indices'].map((category) => (
                  <div key={category}>
                    <div className="text-gray-400 text-sm font-semibold mb-2 mt-4">{category}</div>
                    {tradingPairs
                      .filter((item) => item.category === category)
                      .filter((item) =>
                        selectedPair
                          ? item.pair.toLowerCase().includes(selectedPair.toLowerCase()) ||
                            item.name?.toLowerCase().includes(selectedPair.toLowerCase())
                          : true
                      )
                      .map((item) => (
                        <button
                          key={item.pair}
                          className="w-full p-4 bg-[#1a1d29] rounded-lg hover:bg-[#1f2230] transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {item.pair.split('/')[0].substring(0, 2)}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="text-white font-semibold">{item.pair}</div>
                              {item.name && <div className="text-gray-400 text-sm">{item.name}</div>}
                            </div>
                          </div>
                          <TrendingUp size={20} className="text-green-500" />
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Trading Bot</h3>
                <Radio
                  size={20}
                  className={botConnected ? 'text-green-500' : 'text-gray-500'}
                />
              </div>

              <div className="mb-4">
                <div className="text-gray-400 text-sm mb-2">Status</div>
                <div className={`text-lg font-semibold ${botConnected ? 'text-green-500' : 'text-gray-400'}`}>
                  {botConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              <button
                onClick={() => setShowConnectModal(true)}
                disabled={botConnected}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {botConnected ? 'Bot Connected' : 'Connect Bot'}
              </button>

              {botConnected && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-green-500 text-sm">
                    Trading bot is active and monitoring markets
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
          <h2 className="text-white text-xl font-semibold mb-6">Active Trades</h2>

          {trades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active trades. Connect your bot to start trading.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-sm font-semibold pb-3">Pair</th>
                    <th className="text-left text-gray-400 text-sm font-semibold pb-3">Type</th>
                    <th className="text-right text-gray-400 text-sm font-semibold pb-3">Amount</th>
                    <th className="text-right text-gray-400 text-sm font-semibold pb-3">Entry</th>
                    <th className="text-right text-gray-400 text-sm font-semibold pb-3">Current</th>
                    <th className="text-right text-gray-400 text-sm font-semibold pb-3">P&L</th>
                    <th className="text-left text-gray-400 text-sm font-semibold pb-3">Status</th>
                    <th className="text-left text-gray-400 text-sm font-semibold pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-800">
                      <td className="py-4 text-white font-medium">{trade.trading_pair}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center space-x-1 ${
                            trade.trade_type === 'long' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {trade.trade_type === 'long' ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingDown size={16} />
                          )}
                          <span className="capitalize">{trade.trade_type}</span>
                        </span>
                      </td>
                      <td className="py-4 text-right text-white">{formatCurrency(trade.amount)}</td>
                      <td className="py-4 text-right text-white">{formatCurrency(trade.entry_price)}</td>
                      <td className="py-4 text-right text-white">
                        {trade.exit_price ? formatCurrency(trade.exit_price) : '-'}
                      </td>
                      <td
                        className={`py-4 text-right font-semibold ${
                          trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(trade.profit_loss)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400 text-sm">{formatDate(trade.opened_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showConnectModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#13151f] rounded-xl p-8 max-w-md w-full border border-gray-800">
              <h3 className="text-white text-2xl font-bold mb-4">Connect Trading Bot</h3>

              <p className="text-gray-400 mb-6">
                Connecting the trading bot will allow it to automatically execute trades on your behalf based on
                market conditions and your configured strategy.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectBot}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
