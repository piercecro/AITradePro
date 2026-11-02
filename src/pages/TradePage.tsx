import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type TradeSide = 'Buy' | 'Sell';
type OrderType = 'market' | 'limit' | 'take_profit' | 'stop_loss';

type Instrument = {
  symbol: string;
  label: string;
  category: 'Currency' | 'Metal' | 'Stock' | 'Bond' | 'Index' | 'Crypto';
  description: string;
  price: number;
};

type TradeRow = {
  id: string;
  trading_pair: string;
  trade_type: string;
  amount: number;
  entry_price: number;
  exit_price?: number | null;
  profit_loss: number;
  status: string;
  opened_at: string;
  closed_at?: string | null;
  order_type?: string | null;
  execution_price?: number | null;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
};

const marketInstruments: Instrument[] = [
  { symbol: 'EUR/USD', label: 'Euro / Dollar', category: 'Currency', description: 'Major FX', price: 1.0862 },
  { symbol: 'GBP/USD', label: 'Pound / Dollar', category: 'Currency', description: 'Major FX', price: 1.2684 },
  { symbol: 'USD/JPY', label: 'Dollar / Yen', category: 'Currency', description: 'Major FX', price: 149.42 },
  { symbol: 'AUD/USD', label: 'Australian Dollar', category: 'Currency', description: 'Commodity FX', price: 0.6648 },
  { symbol: 'XAU/USD', label: 'Gold / Dollar', category: 'Metal', description: 'Precious metal', price: 2364.2 },
  { symbol: 'XAG/USD', label: 'Silver / Dollar', category: 'Metal', description: 'Precious metal', price: 31.42 },
  { symbol: 'BTC/USD', label: 'Bitcoin', category: 'Crypto', description: 'Major crypto', price: 62840 },
  { symbol: 'ETH/USD', label: 'Ethereum', category: 'Crypto', description: 'Smart contract', price: 3214.7 },
  { symbol: 'SOL/USD', label: 'Solana', category: 'Crypto', description: 'Layer 1', price: 149.92 },
  { symbol: 'AAPL', label: 'Apple', category: 'Stock', description: 'US stock', price: 214.64 },
  { symbol: 'MSFT', label: 'Microsoft', category: 'Stock', description: 'US stock', price: 436.19 },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'Stock', description: 'AI chip leader', price: 131.41 },
  { symbol: 'TSLA', label: 'Tesla', category: 'Stock', description: 'EV maker', price: 246.8 },
  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bond', description: 'Government bond', price: 4.21 },
  { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bond', description: 'Long bond', price: 4.63 },
  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Index', description: 'Tech index', price: 19742.3 },
  { symbol: 'SPX', label: 'S&P 500', category: 'Index', description: 'US broad index', price: 5562.1 },
  { symbol: 'DAX', label: 'DAX', category: 'Index', description: 'German index', price: 19124.3 },
  { symbol: 'FTSE', label: 'FTSE 100', category: 'Index', description: 'UK index', price: 8271.9 },
  { symbol: 'VIX', label: 'VIX', category: 'Index', description: 'Volatility index', price: 17.8 },
];

const tradeTabs = ['Open', 'Closed'];
const orderOptions: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
    maximumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
  }).format(value);

const formatPrice = (value: number, symbol: string) => {
  if (['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/JPY'].includes(symbol)) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: symbol === 'USD/JPY' ? 2 : 4,
      maximumFractionDigits: symbol === 'USD/JPY' ? 2 : 4,
    }).format(value);
  }

  if (['XAU/USD', 'XAG/USD'].includes(symbol)) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getOrderLabel = (orderType: OrderType) => {
  switch (orderType) {
    case 'market':
      return 'Market';
    case 'limit':
      return 'Limit';
    case 'take_profit':
      return 'Take Profit';
    case 'stop_loss':
      return 'Stop Loss';
    default:
      return 'Market';
  }
};

export const TradePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [selectedSide, setSelectedSide] = useState<TradeSide>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [tradeAmount, setTradeAmount] = useState<number>(1);
  const [triggerPrice, setTriggerPrice] = useState<number>(0);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(marketInstruments.map((instrument) => [instrument.symbol, instrument.price])),
  );
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosingTradeId, setIsClosingTradeId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const currentInstrument =
    marketInstruments.find((instrument) => instrument.symbol === selectedSymbol) ?? marketInstruments[0];
  const currentPrice = marketPrices[currentInstrument.symbol] ?? currentInstrument.price;

  const handleOrderSelect = (nextOrderType: OrderType) => {
    setOrderType(nextOrderType);

    if (nextOrderType === 'market') {
      setTriggerPrice(0);
      return;
    }

    if (triggerPrice <= 0) {
      setTriggerPrice(currentPrice);
    }
  };

  const loadProfileBalance = async () => {
    if (!user) {
      setAvailableBalance(0);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('available_balance, total_profit')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user balance:', error.message);
      setAvailableBalance(0);
      return;
    }

    setAvailableBalance(Number(data?.available_balance ?? 0));
  };

  const loadTrades = async () => {
    if (!user) {
      setTrades([]);
      return;
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('Error loading trades:', error.message);
      setTrades([]);
      return;
    }

    setTrades((data as TradeRow[]) ?? []);
  };

  useEffect(() => {
    void loadProfileBalance();
    void loadTrades();
  }, [user]);

  useEffect(() => {
    const refreshTicker = () => {
      setMarketPrices((prev) => {
        const next: Record<string, number> = { ...prev };

        for (const instrument of marketInstruments) {
          const lastPrice = prev[instrument.symbol] ?? instrument.price;
          const moveFactor = instrument.category === 'Index' ? 0.008 : instrument.category === 'Bond' ? 0.004 : 0.015;
          const drift = (Math.random() - 0.5) * moveFactor;
          const updated = Math.max(lastPrice * (1 + drift), 0.0001);
          next[instrument.symbol] = Number(updated.toFixed(4));
        }

        return next;
      });
    };

    refreshTicker();

    const interval = window.setInterval(refreshTicker, 12000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredInstruments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return marketInstruments;
    }

    return marketInstruments.filter(
      (instrument) =>
        instrument.symbol.toLowerCase().includes(query) ||
        instrument.label.toLowerCase().includes(query) ||
        instrument.category.toLowerCase().includes(query),
    );
  }, [searchTerm]);

  const visibleTrades = useMemo(() => {
    const filtered = trades.filter((trade) => {
      if (activeTab === 'Open') {
        return trade.status === 'active';
      }
      return trade.status !== 'active';
    });

    return filtered.filter((trade) => trade.trading_pair.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeTab, searchTerm, trades]);

  const totalOpenValue = useMemo(
    () =>
      trades
        .filter((trade) => trade.status === 'active')
        .reduce((sum, trade) => sum + Number(trade.amount) * Number(trade.entry_price), 0),
    [trades],
  );

  const openTradeCount = trades.filter((trade) => trade.status === 'active').length;

  const getExecutionPrice = () => {
    if (orderType === 'market') {
      return currentPrice;
    }

    if (orderType === 'limit') {
      return triggerPrice > 0 ? triggerPrice : currentPrice;
    }

    if (orderType === 'take_profit') {
      return triggerPrice > 0 ? triggerPrice : currentPrice;
    }

    if (orderType === 'stop_loss') {
      return triggerPrice > 0 ? triggerPrice : currentPrice;
    }

    return currentPrice;
  };

  const handlePlaceTrade = async () => {
    if (!user) {
      setErrorText('Please sign in to place a trade.');
      return;
    }

    if (!tradeAmount || tradeAmount <= 0) {
      setErrorText('Trade amount must be greater than zero.');
      return;
    }

    const executionPrice = getExecutionPrice();
    const notional = executionPrice * tradeAmount;

    if (availableBalance < notional) {
      setErrorText(`Not enough balance. You have ${formatCurrency(availableBalance)} available.`);
      return;
    }

    setErrorText(null);
    setIsSubmitting(true);

    try {
      const nextBalance = availableBalance - notional;

      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({ available_balance: nextBalance })
        .eq('id', user.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        trading_pair: currentInstrument.symbol,
        trade_type: selectedSide.toLowerCase(),
        amount: tradeAmount,
        entry_price: executionPrice,
        exit_price: null,
        profit_loss: 0,
        status: 'active',
        opened_at: new Date().toISOString(),
        order_type: orderType,
        execution_price: executionPrice,
        stop_loss_price: orderType === 'stop_loss' ? triggerPrice || executionPrice : null,
        take_profit_price: orderType === 'take_profit' ? triggerPrice || executionPrice : null,
      });

      if (error) {
        console.error('Error inserting trade:', error.message);
        await supabase
          .from('user_profiles')
          .update({ available_balance: availableBalance })
          .eq('id', user.id);
        setErrorText('Trade could not be created.');
        return;
      }

      setAvailableBalance(nextBalance);
      setSelectedSide('Buy');
      setOrderType('market');
      setTradeAmount(1);
      setTriggerPrice(0);
      await loadTrades();
      await loadProfileBalance();
    } catch (err) {
      console.error('Unexpected trade insert error:', err);
      setErrorText('Unexpected error placing trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    if (!user) {
      return;
    }

    const trade = trades.find((item) => item.id === tradeId);
    if (!trade) {
      return;
    }

    setIsClosingTradeId(tradeId);

    try {
      const closePrice = marketPrices[trade.trading_pair] ?? Number(trade.entry_price ?? 0);
      const pnl =
        trade.trade_type === 'buy'
          ? (closePrice - Number(trade.entry_price)) * Number(trade.amount)
          : (Number(trade.entry_price) - closePrice) * Number(trade.amount);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('available_balance, total_profit')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const existingBalance = Number(profileData?.available_balance ?? 0);
      const existingProfit = Number(profileData?.total_profit ?? 0);
      const updatedBalance = existingBalance + pnl;
      const updatedProfit = existingProfit + pnl;

      const { error: updateTradeError } = await supabase
        .from('trades')
        .update({
          status: 'closed',
          exit_price: closePrice,
          profit_loss: pnl,
          closed_at: new Date().toISOString(),
        })
        .eq('id', tradeId)
        .eq('user_id', user.id);

      if (updateTradeError) {
        throw updateTradeError;
      }

      const { error: balanceError } = await supabase
        .from('user_profiles')
        .update({
          available_balance: updatedBalance,
          total_profit: updatedProfit,
        })
        .eq('id', user.id);

      if (balanceError) {
        throw balanceError;
      }

      setAvailableBalance(updatedBalance);
      await loadTrades();
      await loadProfileBalance();
    } catch (err) {
      console.error('Unexpected close trade error:', err);
      setErrorText('Could not close trade.');
    } finally {
      setIsClosingTradeId(null);
    }
  };

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="overflow-hidden rounded-[20px] border border-[#dfe7f0] bg-[#f4f7fb] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-[#e3ebf4] bg-[#f8fafc] px-5 py-4">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[#dfe7f0] bg-[#f1f5f9] p-1">
              {tradeTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-[#1d73f5] shadow-sm ring-1 ring-[#dfe9f7]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Balance: {formatCurrency(availableBalance)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 border-b border-[#e3ebf4] bg-[#f3f6fa] p-5 lg:grid-cols-2 lg:p-6">
            <section className="rounded-2xl border border-[#e3ebf4] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Allocation</div>
                  <div className="text-[18px] font-bold text-slate-800">Trades amount allocation</div>
                </div>
                <div className="rounded-full bg-[#edf5ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1d73f5]">
                  {openTradeCount} active
                </div>
              </div>

              <div className="flex min-h-[180px] items-center justify-center gap-5">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#dfe9f3] border-t-[#2e7df6] border-r-[#8ca8ff] border-b-[#c8d5e6] border-l-[#d9e8ff]">
                  <div className="absolute inset-[18px] rounded-full bg-[#f5f8fc]" />
                  <div className="relative text-center">
                    <div className="text-[14px] font-black tracking-[-0.04em] text-slate-800">
                      {formatCurrency(totalOpenValue)}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-[14px] font-semibold text-slate-500">Open trades</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Your active positions are tracked here in real time.
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e3ebf4] bg-white p-4 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Order ticket</div>
                  <div className="text-[18px] font-bold text-slate-800">{currentInstrument.symbol}</div>
                </div>
                <div className="rounded-full border border-[#dfe7f0] bg-[#f8fafc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {currentInstrument.category}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSide('Buy')}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    selectedSide === 'Buy'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide('Sell')}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    selectedSide === 'Sell'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                {orderOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOrderSelect(option)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                      orderType === option
                        ? 'bg-[#1d73f5] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {getOrderLabel(option)}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5">
                  <span className="text-sm text-slate-500">Live price</span>
                  <span className="text-sm font-bold text-slate-800">{formatPrice(currentPrice, currentInstrument.symbol)}</span>
                </div>

                {(orderType === 'limit' || orderType === 'take_profit' || orderType === 'stop_loss') && (
                  <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5">
                    <span className="text-sm text-slate-500">
                      {orderType === 'limit' ? 'Limit price' : orderType === 'take_profit' ? 'Take profit' : 'Stop loss'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.0001}
                      value={triggerPrice > 0 ? triggerPrice : currentPrice}
                      onChange={(event) => setTriggerPrice(Number(event.target.value) || 0)}
                      className="w-28 bg-transparent text-right text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5">
                  <span className="text-sm text-slate-500">Quantity</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={tradeAmount}
                    onChange={(event) => setTradeAmount(Number(event.target.value) || 0.01)}
                    className="w-24 bg-transparent text-right text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5">
                  <span className="text-sm text-slate-500">Notional</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(getExecutionPrice() * tradeAmount)}</span>
                </div>
              </div>

              {errorText && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {errorText}
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceTrade}
                disabled={isSubmitting}
                className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition ${
                  selectedSide === 'Buy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                } ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {isSubmitting ? 'Placing order...' : `${selectedSide} ${currentInstrument.symbol} • ${getOrderLabel(orderType)}`}
              </button>
            </section>
          </div>

          <div className="overflow-hidden bg-[#f7f9fc]">
            <div className="flex flex-col gap-3 border-b border-[#e3ebf4] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-[18px] font-bold text-slate-700">{activeTab} Trades</div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search symbol..."
                    className="w-[220px] rounded-xl border border-[#dfe7f0] bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {filteredInstruments.map((instrument) => {
                  const price = marketPrices[instrument.symbol] ?? instrument.price;
                  const isSelected = instrument.symbol === selectedSymbol;
                  const direction = price >= instrument.price ? 'up' : 'down';

                  return (
                    <button
                      key={instrument.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(instrument.symbol)}
                      className={`flex items-center justify-between rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-[#1d73f5] bg-[#edf5ff] shadow-sm'
                          : 'border-[#e3ebf4] bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800">{instrument.symbol}</div>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{instrument.category}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">{formatPrice(price, instrument.symbol)}</div>
                        <div
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                            direction === 'up'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {direction === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {direction === 'up' ? 'Bullish' : 'Bearish'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#e3ebf4] bg-white">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-[#f3f6fa] text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Entry</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Opened</th>
                      <th className="px-4 py-3">PnL</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTrades.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-[#f8fafc] text-slate-300">
                              <Wallet size={24} />
                            </div>
                            <div>
                              <div className="text-[18px] font-bold text-slate-600">No {activeTab.toLowerCase()} trades</div>
                              <div className="mt-1 text-sm text-slate-400">Your executed trades will appear here.</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleTrades.map((trade) => {
                        const sideClass = trade.trade_type === 'buy' ? 'text-emerald-600' : 'text-rose-600';
                        const sideIcon = trade.trade_type === 'buy' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />;

                        return (
                          <tr key={trade.id} className="border-t border-[#edf2f7] last:border-0">
                            <td className="px-4 py-3 font-semibold text-slate-800">{trade.trading_pair}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${sideClass}`}>
                                {sideIcon}
                                {trade.trade_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">{trade.amount}</td>
                            <td className="px-4 py-3">{formatPrice(Number(trade.entry_price), trade.trading_pair)}</td>
                            <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                              {String(trade.order_type ?? 'market')}
                            </td>
                            <td className="px-4 py-3">{formatDate(trade.opened_at)}</td>
                            <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(trade.profit_loss))}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                  trade.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {trade.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {trade.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handleCloseTrade(trade.id)}
                                  disabled={isClosingTradeId === trade.id}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isClosingTradeId === trade.id ? 'Closing...' : 'Close'}
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePage;
