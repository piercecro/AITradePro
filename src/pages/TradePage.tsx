import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Radio, CandlestickChart, Activity, Crosshair, BarChart3, LineChart as LineChartIcon, SlidersHorizontal } from 'lucide-react';
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

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const tradingPairs = [
  { pair: 'BTC/USD', category: 'Crypto' },
  { pair: 'ETH/USD', category: 'Crypto' },
  { pair: 'EUR/USD', category: 'Forex' },
  { pair: 'USD/JPY', category: 'Forex' },
  { pair: 'GBP/USD', category: 'Forex' },
  { pair: 'AUD/USD', category: 'Forex' },
  { pair: 'XAU/USD', category: 'Metals' },
  { pair: 'XAG/USD', category: 'Metals' },
  { pair: 'SPX', category: 'Indices' },
  { pair: 'FTSE', category: 'Indices' },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const buildChartData = (pair: string): CandleData[] => {
  const base = {
    'BTC/USD': 62000,
    'ETH/USD': 3250,
    'EUR/USD': 1.08,
    'GBP/USD': 1.27,
    'USD/JPY': 150,
    'AUD/USD': 0.66,
    'XAU/USD': 2350,
    'XAG/USD': 28,
    SPX: 5400,
    FTSE: 8300,
  } as Record<string, number>;

  const start = base[pair] ?? 100;
  const values: CandleData[] = [];
  let prev = start;

  for (let i = 0; i < 24; i++) {
    const drift = (Math.sin((i + 1) * 0.8) * 0.018) + (i - 12) * 0.0013;
    const open = prev;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + 0.012 + i * 0.0007);
    const low = Math.min(open, close) * (1 - 0.012 - i * 0.0007);

    values.push({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
    });

    prev = close;
  }

  return values;
};

const TradingChart = ({
  pair,
  chartMode,
  showIndicators,
}: {
  pair: string;
  chartMode: 'candles' | 'line';
  showIndicators: boolean;
}) => {
  const data = buildChartData(pair);
  const width = 960;
  const height = 420;
  const padding = 32;
  const maxPrice = Math.max(...data.map((d) => d.high));
  const minPrice = Math.min(...data.map((d) => d.low));
  const priceRange = maxPrice - minPrice || 1;
  const step = (width - padding * 2) / Math.max(data.length, 1);
  const candleWidth = clamp(step * 0.62, 8, 18);
  const hoverX = width - padding;
  const closeLine = data
    .map((point, index) => {
      const x = padding + index * step + step / 2;
      const y = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const movingAverage = data.map((point, index) => {
    const next = data.slice(Math.max(0, index - 5), index + 1);
    const avg = next.reduce((sum, item) => sum + item.close, 0) / Math.max(next.length, 1);
    return { ...point, avg };
  });

  const movingAveragePath = movingAverage
    .map((point, index) => {
      const x = padding + index * step + step / 2;
      const y = padding + ((maxPrice - point.avg) / priceRange) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-gray-800 bg-[#0f1117]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" aria-label="Trading chart">
        {Array.from({ length: 5 }, (_, i) => {
          const y = padding + (i / 4) * (height - padding * 2);
          return <line key={y} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#1f2937" strokeDasharray="4 6" />;
        })}

        {showIndicators && (
          <path d={movingAveragePath} fill="none" stroke="#38bdf8" strokeWidth={2} strokeOpacity={0.8} />
        )}

        {chartMode === 'candles' ? (
          data.map((point, index) => {
            const x = padding + index * step + step / 2;
            const yOpen = padding + ((maxPrice - point.open) / priceRange) * (height - padding * 2);
            const yClose = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
            const yHigh = padding + ((maxPrice - point.high) / priceRange) * (height - padding * 2);
            const yLow = padding + ((maxPrice - point.low) / priceRange) * (height - padding * 2);
            const isUp = point.close >= point.open;
            const color = isUp ? '#22c55e' : '#ef4444';
            const bodyY = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 6);

            return (
              <g key={`${point.time}-${index}`}>
                <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.7} />
                <rect x={x - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} rx={2} fill={color} opacity={0.9} />
              </g>
            );
          })
        ) : (
          <path d={closeLine} fill="none" stroke="#f59e0b" strokeWidth={2.7} strokeLinejoin="round" strokeLinecap="round" />
        )}

        <line
          x1={hoverX}
          x2={hoverX}
          y1={padding}
          y2={height - padding}
          stroke="#93c5fd"
          strokeDasharray="5 7"
          opacity={0.8}
        />
      </svg>

      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-200">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        {pair}
      </div>
    </div>
  );
};

export const TradePage = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [botConnected, setBotConnected] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMarketPair, setSelectedMarketPair] = useState<string>(() => {
    if (typeof window === 'undefined') return 'BTC/USD';
    return localStorage.getItem('selectedTradingPair') || 'BTC/USD';
  });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');
  const [showIndicators, setShowIndicators] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedTradingPair', selectedMarketPair);
    }
  }, [selectedMarketPair]);

  useEffect(() => {
    if (user) {
      loadTrades();
      loadBotStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id || !botConnected) return;

    const ensureSelectedPairTrade = async () => {
      const { data: existing, error } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
        .eq('trading_pair', selectedMarketPair)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error checking active trade for selected pair:', error.message);
        return;
      }

      if (existing) {
        return;
      }

      const tradeType = Math.random() > 0.5 ? 'long' : 'short';
      const entryPrice = Math.random() * 1000 + 100;
      const amount = 100 + Math.random() * 900;
      const profitLoss = (Math.random() - 0.5) * 250;

      const newTrade = {
        user_id: user.id,
        trading_pair: selectedMarketPair,
        trade_type: tradeType,
        amount,
        entry_price: entryPrice,
        exit_price: null,
        profit_loss: profitLoss,
        status: 'active',
        opened_at: new Date().toISOString(),
        closed_at: null,
      };

      const { error: insertError } = await supabase.from('trades').insert(newTrade);
      if (insertError) {
        console.error('Error creating selected pair trade:', insertError.message);
        return;
      }

      await loadTrades();
    };

    ensureSelectedPairTrade();
  }, [selectedMarketPair, botConnected, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setBotConnected(false);
      return;
    }

    const channel = supabase
      .channel(`bot-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_connections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const nextRow = payload.new ?? payload.old;
          if (!nextRow || nextRow.bot_name !== 'trading_bot') return;
          setBotConnected(Boolean(nextRow.is_connected));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadTrades = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('Error loading trades:', error.message);
      return;
    }

    setTrades(data ?? []);
  };

  const loadBotStatus = async () => {
    if (!user?.id) {
      setBotConnected(false);
      return;
    }

    const { data, error } = await supabase
      .from('bot_connections')
      .select('is_connected')
      .eq('user_id', user.id)
      .eq('bot_name', 'trading_bot')
      .maybeSingle();

    if (error) {
      console.error('Error loading bot status:', error.message);
      return;
    }

    setBotConnected(Boolean(data?.is_connected));
  };

  const createMockTrade = async (pair = selectedMarketPair) => {
    if (!user?.id) return;

    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', user.id)
      .eq('trading_pair', pair)
      .eq('status', 'active')
      .maybeSingle();

    if (existingTrade) {
      return;
    }

    const tradeType = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = Math.random() * 1000 + 100;
    const amount = 100 + Math.random() * 900;
    const profitLoss = (Math.random() - 0.5) * 250;

    const trade = {
      user_id: user.id,
      trading_pair: pair,
      trade_type: tradeType,
      amount,
      entry_price: entryPrice,
      exit_price: null,
      profit_loss: profitLoss,
      status: 'active',
      opened_at: new Date().toISOString(),
      closed_at: null,
    };

    const { error } = await supabase.from('trades').insert(trade);
    if (error) {
      console.error('Error creating mock trade:', error.message);
      return;
    }

    await loadTrades();
  };

  const persistBotStatus = async (connected: boolean) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('bot_connections')
      .upsert(
        {
          user_id: user.id,
          bot_name: 'trading_bot',
          is_connected: connected,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,bot_name' }
      );

    if (error) {
      throw error;
    }

    setBotConnected(connected);
  };

  const handleConnectBot = async () => {
    if (!user?.id) {
      console.error('Connect bot failed: no authenticated user');
      return;
    }

    try {
      const { data: existing, error: existingError } = await supabase
        .from('bot_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('bot_name', 'trading_bot')
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      const nextStatus = existing ? !existing.is_connected : true;
      await persistBotStatus(nextStatus);

      if (nextStatus && !existing?.is_connected) {
        await createMockTrade(selectedMarketPair);
      }

      setShowConnectModal(false);
    } catch (error: any) {
      console.error('Bot connection update failed:', error.message);
      alert(`Bot connection failed: ${error.message}`);
    }
  };

  const filteredPairs = tradingPairs.filter((item) =>
    item.pair.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-white text-3xl font-bold">Trading Terminal</h1>
          <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-[#13151f] px-4 py-2">
            <Radio size={16} className={botConnected ? 'text-green-500' : 'text-slate-400'} />
            <span className={botConnected ? 'text-green-500' : 'text-slate-400'}>
              {botConnected ? 'Bot Online' : 'Bot Offline'}
            </span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-[1.7fr_0.7fr] gap-6">
          <div className="rounded-2xl border border-gray-800 bg-[#13151f] p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-white">{selectedMarketPair}</div>
                <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                  Live
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setChartMode('candles')}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    chartMode === 'candles' ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CandlestickChart size={14} /> Candles
                  </span>
                </button>
                <button
                  onClick={() => setChartMode('line')}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    chartMode === 'line' ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LineChartIcon size={14} /> Line
                  </span>
                </button>
                <button
                  onClick={() => setShowIndicators((prev) => !prev)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    showIndicators ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Activity size={14} /> Indicators
                  </span>
                </button>
              </div>
            </div>

            <TradingChart pair={selectedMarketPair} chartMode={chartMode} showIndicators={showIndicators} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-[#13151f] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-white text-lg font-semibold">Trading Bot</h2>
                <Radio size={18} className={botConnected ? 'text-green-500' : 'text-slate-400'} />
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-[#1a1d29] p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Current Pair</div>
                  <div className="mt-1 text-lg font-semibold text-white">{selectedMarketPair}</div>
                </div>

                <div className="rounded-xl bg-[#1a1d29] p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Status</div>
                  <div className={`mt-1 text-lg font-semibold ${botConnected ? 'text-green-500' : 'text-slate-200'}`}>
                    {botConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>

                <button
                  onClick={() => setShowConnectModal(true)}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {botConnected ? 'Disconnect Bot' : 'Connect Bot'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-[#13151f] p-4">
              <h3 className="mb-3 text-white text-lg font-semibold">Analysis Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Crosshair', icon: Crosshair },
                  { label: 'Volume', icon: BarChart3 },
                  { label: 'Trend', icon: Activity },
                  { label: 'Indicators', icon: SlidersHorizontal },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#1a1d29] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-[#232734]"
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.7fr] gap-6">
          <div className="rounded-2xl border border-gray-800 bg-[#13151f] p-4">
            <h2 className="mb-4 text-white text-xl font-semibold">Select Pair</h2>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search market pair..."
              className="mb-4 w-full rounded-xl border border-gray-700 bg-[#1a1d29] px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />

            <div className="space-y-2">
              {filteredPairs.map((item) => (
                <button
                  key={item.pair}
                  onClick={() => setSelectedMarketPair(item.pair)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                    selectedMarketPair === item.pair ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'bg-[#1a1d29] hover:bg-[#232734]'
                  }`}
                >
                  <div>
                    <div className="text-white font-medium">{item.pair}</div>
                    <div className="text-xs text-slate-400">{item.category}</div>
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#13151f] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-white text-xl font-semibold">Active Trades</h2>
              <div className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                {trades.filter((trade) => trade.status === 'active').length} active
              </div>
            </div>

            {trades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No active trades. Connect your bot to start trading.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Pair</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Size</th>
                      <th className="pb-3 text-right">Entry</th>
                      <th className="pb-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-800 text-sm">
                        <td className="py-4 text-white">{trade.trading_pair}</td>
                        <td className="py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${trade.trade_type === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {trade.trade_type}
                          </span>
                        </td>
                        <td className="py-4 text-right text-white">{formatCurrency(trade.amount)}</td>
                        <td className="py-4 text-right text-white">{formatCurrency(trade.entry_price)}</td>
                        <td className={`py-4 text-right font-semibold ${trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(trade.profit_loss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-w-md rounded-2xl border border-gray-800 bg-[#13151f] p-8">
              <h3 className="mb-4 text-2xl font-bold text-white">
                {botConnected ? 'Disconnect Trading Bot' : 'Connect Trading Bot'}
              </h3>

              <p className="mb-6 text-sm text-slate-300">
                {botConnected
                  ? 'Disconnecting the bot will stop automated trading for the selected pair.'
                  : `Connecting will allow the bot to monitor ${selectedMarketPair} and open a live trade using this pair.`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectBot}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  {botConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePage;
