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
import { fetchLivePrices } from '../lib/livePrices';

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
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
};

type PricePoint = { price: number; time: string };

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

const orderOptions: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
  maximumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
}).format(value);
const formatPrice = (value: number, symbol: string) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : symbol === 'USD/JPY' ? 2 : 2,
  maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : symbol === 'USD/JPY' ? 2 : 2,
}).format(value);
const formatDate = (value: string) => new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const orderLabel = (order: string) => ({
  market: 'Market', limit: 'Limit', take_profit: 'Take Profit', stop_loss: 'Stop Loss',
}[order] ?? 'Market');
const normalizeTrade = (trade: any): TradeRow => ({
  id: trade.id,
  trading_pair: trade.token_pair ?? trade.trading_pair ?? '',
  trade_type: trade.trade_type ?? 'buy',
  amount: Number(trade.amount ?? 0),
  entry_price: Number(trade.execution_price ?? trade.entry_price ?? 0),
  exit_price: trade.exit_price == null ? null : Number(trade.exit_price),
  profit_loss: Number(trade.profit_loss ?? 0),
  status: trade.status ?? 'active',
  opened_at: trade.created_at ?? trade.opened_at ?? new Date().toISOString(),
  closed_at: trade.closed_at ?? null,
  order_type: trade.order_type ?? 'market',
  stop_loss_price: trade.stop_loss_price ?? null,
  take_profit_price: trade.take_profit_price ?? null,
});

const getPnl = (trade: TradeRow, price: number) =>
  (trade.trade_type === 'buy' ? price - trade.entry_price : trade.entry_price - price) * trade.amount;

export const TradePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Open' | 'Closed'>('Open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [selectedSide, setSelectedSide] = useState<TradeSide>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [tradeAmount, setTradeAmount] = useState(1);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(marketInstruments.map((instrument) => [instrument.symbol, instrument.price])),
  );
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosingTradeId, setIsClosingTradeId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const currentInstrument = marketInstruments.find((item) => item.symbol === selectedSymbol) ?? marketInstruments[0];
  const currentPrice = marketPrices[selectedSymbol] ?? currentInstrument.price;

  const loadProfileBalance = async () => {
    if (!user) { setAvailableBalance(0); return; }
    const { data, error } = await supabase.from('user_profiles')
      .select('available_balance').eq('id', user.id).maybeSingle();
    if (error) { console.error('Error fetching user balance:', error.message); return; }
    setAvailableBalance(Number(data?.available_balance ?? 0));
  };

  const loadTrades = async () => {
    if (!user) { setTrades([]); return; }
    const { data, error } = await supabase.from('trades').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error loading trades:', error.message); return; }
    setTrades((data ?? []).map(normalizeTrade));
  };

  useEffect(() => {
    void loadProfileBalance();
    void loadTrades();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const refreshPrices = async () => {
      let live: Record<string, { price: number }> = {};
      try { live = await fetchLivePrices(); } catch (error) { console.warn('Using simulated prices:', error); }
      if (cancelled) return;
      setMarketPrices((previous) => {
        const next = { ...previous };
        for (const instrument of marketInstruments) {
          const quote = live[instrument.symbol]?.price;
          if (quote && quote > 0) {
            next[instrument.symbol] = Number(quote.toFixed(4));
          } else {
            // Random-walk fallback keeps the demo chart and open-position P&L moving without a live quote.
            const last = previous[instrument.symbol] ?? instrument.price;
            const volatility = instrument.category === 'Crypto' ? 0.006 : instrument.category === 'Index' ? 0.002 : 0.003;
            next[instrument.symbol] = Number(Math.max(last * (1 + (Math.random() - 0.5) * volatility), 0.0001).toFixed(4));
          }
        }
        const nextSelectedPrice = next[selectedSymbol] ?? currentInstrument.price;
        setPriceHistory((history) => [...history, { price: nextSelectedPrice, time: new Date().toLocaleTimeString() }].slice(-40));
        return next;
      });
    };
    setPriceHistory([{ price: marketPrices[selectedSymbol] ?? currentInstrument.price, time: new Date().toLocaleTimeString() }]);
    void refreshPrices();
    const timer = window.setInterval(() => void refreshPrices(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selectedSymbol]);

  const openTrades = useMemo(() => trades.filter((trade) => trade.status === 'active'), [trades]);
  const visibleTrades = useMemo(() => trades.filter((trade) =>
    (activeTab === 'Open' ? trade.status === 'active' : trade.status !== 'active') &&
    trade.trading_pair.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  ), [activeTab, searchTerm, trades]);
  const unrealizedPnl = useMemo(() => openTrades.reduce((sum, trade) =>
    sum + getPnl(trade, marketPrices[trade.trading_pair] ?? trade.entry_price), 0,
  ), [openTrades, marketPrices]);
  const openPositionValue = useMemo(() => openTrades.reduce((sum, trade) =>
    sum + (marketPrices[trade.trading_pair] ?? trade.entry_price) * trade.amount, 0,
  ), [openTrades, marketPrices]);
  const accountEquity = availableBalance + openPositionValue;
  const filteredInstruments = marketInstruments.filter((instrument) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || instrument.symbol.toLowerCase().includes(query) || instrument.label.toLowerCase().includes(query) || instrument.category.toLowerCase().includes(query);
  });

  const getExecutionPrice = () => orderType === 'market' ? currentPrice : triggerPrice > 0 ? triggerPrice : currentPrice;

  const handlePlaceTrade = async () => {
    if (!user) { setErrorText('Please sign in to place a trade.'); return; }
    if (!Number.isFinite(tradeAmount) || tradeAmount <= 0) { setErrorText('Trade amount must be greater than zero.'); return; }
    const executionPrice = getExecutionPrice();
    const notional = executionPrice * tradeAmount;
    if (availableBalance < notional) { setErrorText(`Not enough balance. You have ${formatCurrency(availableBalance)} available.`); return; }

    setErrorText(null);
    setIsSubmitting(true);
    try {
      const nextBalance = availableBalance - notional;
      const { error: balanceError } = await supabase.from('user_profiles')
        .update({ available_balance: nextBalance }).eq('id', user.id);
      if (balanceError) throw balanceError;

      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: user.id,
        token_pair: selectedSymbol,
        trading_pair: selectedSymbol,
        trade_type: selectedSide.toLowerCase(),
        amount: tradeAmount,
        entry_price: executionPrice,
        execution_price: executionPrice,
        profit_loss: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
        order_type: orderType,
        stop_loss_price: orderType === 'stop_loss' ? triggerPrice || executionPrice : null,
        take_profit_price: orderType === 'take_profit' ? triggerPrice || executionPrice : null,
      });
      if (tradeError) {
        await supabase.from('user_profiles').update({ available_balance: availableBalance }).eq('id', user.id);
        throw tradeError;
      }
      setAvailableBalance(nextBalance);
      setSelectedSide('Buy');
      setOrderType('market');
      setTradeAmount(1);
      setTriggerPrice(0);
      await loadTrades();
    } catch (error) {
      console.error('Could not place trade:', error);
      setErrorText('Trade could not be created.');
      await loadProfileBalance();
    } finally { setIsSubmitting(false); }
  };

  const handleCloseTrade = async (tradeId: string) => {
    if (!user) return;
    const trade = trades.find((item) => item.id === tradeId);
    if (!trade || trade.status !== 'active') return;
    setIsClosingTradeId(tradeId);
    setErrorText(null);
    try {
      const closePrice = marketPrices[trade.trading_pair] ?? trade.entry_price;
      // The notional was reserved when opened. Release that principal and add the marked-to-market P&L.
      const pnl = getPnl(trade, closePrice);
      const { data: profile, error: profileError } = await supabase.from('user_profiles')
        .select('available_balance, total_profit').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      const refund = trade.entry_price * trade.amount;
      const nextBalance = Number(profile?.available_balance ?? 0) + refund + pnl;
      const nextProfit = Number(profile?.total_profit ?? 0) + pnl;

      const { data: updatedTrade, error: tradeError } = await supabase.from('trades').update({
        status: 'closed', profit_loss: pnl, exit_price: closePrice, closed_at: new Date().toISOString(),
      }).eq('id', tradeId).eq('user_id', user.id).eq('status', 'active').select('id').maybeSingle();
      if (tradeError) throw tradeError;
      if (!updatedTrade) throw new Error('Trade was already closed. Refresh and try again.');

      const { error: balanceError } = await supabase.from('user_profiles')
        .update({ available_balance: nextBalance, total_profit: nextProfit }).eq('id', user.id);
      if (balanceError) throw balanceError;
      setAvailableBalance(nextBalance);
      await loadTrades();
    } catch (error) {
      console.error('Could not close trade:', error);
      setErrorText('Could not close trade. Please refresh and try again.');
      await Promise.all([loadTrades(), loadProfileBalance()]);
    } finally { setIsClosingTradeId(null); }
  };

  const chartWidth = 720;
  const chartHeight = 210;
  const prices = priceHistory.map((point) => point.price);
  const minPrice = Math.min(...prices, currentPrice) * 0.9995;
  const maxPrice = Math.max(...prices, currentPrice) * 1.0005;
  const priceRange = Math.max(maxPrice - minPrice, currentPrice * 0.0001, 0.0001);
  const pointCoordinates = priceHistory.map((point, index) => {
    const x = priceHistory.length <= 1 ? chartWidth : (index / (priceHistory.length - 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const selectedOpenTrades = openTrades.filter((trade) => trade.trading_pair === selectedSymbol);
  const priceToY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  return (
    <div className="min-h-screen bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe7f0] bg-white p-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Trade</h1>
            <p className="mt-1 text-sm text-slate-500">Simulated trading. Open-position P&amp;L follows the displayed market price.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              <div className="text-xs font-medium text-emerald-600">Account equity</div>
              <strong>{formatCurrency(accountEquity)}</strong>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
              <div className="text-xs text-slate-500">Available cash</div>
              <strong>{formatCurrency(availableBalance)}</strong>
            </div>
            <div className={`rounded-xl px-4 py-2 text-sm ${unrealizedPnl >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <div className="text-xs">Open P&amp;L</div><strong>{formatCurrency(unrealizedPnl)}</strong>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-[#dfe7f0] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-bold text-slate-800">{selectedSymbol} price movement</h2><p className="text-sm text-slate-500">{currentInstrument.label} · updates every 5 seconds</p></div>
              <div className="text-right"><div className="text-xl font-bold text-slate-800">{formatPrice(currentPrice, selectedSymbol)}</div><div className="text-xs text-slate-500">{selectedOpenTrades.length} open position{selectedOpenTrades.length === 1 ? '' : 's'} on this symbol</div></div>
            </div>
            <div className="overflow-hidden rounded-xl bg-slate-950 p-3">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="h-56 w-full" role="img" aria-label={`${selectedSymbol} price chart with open trade entry levels`}>
                {[0.25, 0.5, 0.75].map((fraction) => <line key={fraction} x1="0" x2={chartWidth} y1={chartHeight * fraction} y2={chartHeight * fraction} stroke="#263244" strokeDasharray="4 5" />)}
                {selectedOpenTrades.map((trade) => {
                  const y = priceToY(trade.entry_price);
                  return <g key={trade.id}><line x1="0" x2={chartWidth} y1={y} y2={y} stroke={trade.trade_type === 'buy' ? '#34d399' : '#fb7185'} strokeDasharray="7 5" /><text x="8" y={Math.max(y - 5, 12)} fill={trade.trade_type === 'buy' ? '#34d399' : '#fb7185'} fontSize="11">{trade.trade_type.toUpperCase()} entry {formatPrice(trade.entry_price, selectedSymbol)}</text></g>;
                })}
                {pointCoordinates && <polyline points={pointCoordinates} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
              </svg>
              <div className="flex justify-between text-[11px] text-slate-500"><span>{priceHistory[0]?.time ?? 'Waiting for price'}</span><span>Live simulated chart</span><span>{priceHistory[priceHistory.length - 1]?.time ?? ''}</span></div>
            </div>
            {selectedOpenTrades.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selectedOpenTrades.map((trade) => {
              const pnl = getPnl(trade, currentPrice);
              return <span key={trade.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${pnl >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{trade.trade_type.toUpperCase()} {formatCurrency(pnl)} unrealized</span>;
            })}</div>}
          </section>

          <section className="rounded-2xl border border-[#dfe7f0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-800">Order ticket</h2><p className="text-sm text-slate-500">{currentInstrument.category} · {currentInstrument.description}</p></div><Wallet className="text-blue-600" size={21} /></div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['Buy', 'Sell'] as const).map((side) => <button key={side} type="button" onClick={() => setSelectedSide(side)} className={`rounded-xl px-4 py-3 font-bold ${selectedSide === side ? side === 'Buy' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{side}</button>)}
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">{orderOptions.map((option) => <button key={option} type="button" onClick={() => { setOrderType(option); if (option !== 'market' && triggerPrice <= 0) setTriggerPrice(currentPrice); if (option === 'market') setTriggerPrice(0); }} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase ${orderType === option ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{orderLabel(option)}</button>)}</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Live price</span><strong>{formatPrice(currentPrice, selectedSymbol)}</strong></div>
              {(orderType !== 'market') && <label className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-slate-500">{orderLabel(orderType)} price</span><input aria-label="Order trigger price" type="number" min="0" step="0.0001" value={triggerPrice || currentPrice} onChange={(event) => setTriggerPrice(Number(event.target.value) || 0)} className="w-32 bg-transparent text-right font-semibold outline-none" /></label>}
              <label className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Quantity</span><input aria-label="Trade quantity" type="number" min="0.01" step="0.01" value={tradeAmount} onChange={(event) => setTradeAmount(Number(event.target.value) || 0.01)} className="w-24 bg-transparent text-right font-semibold outline-none" /></label>
              <div className="flex justify-between rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Reserved notional</span><strong>{formatCurrency(getExecutionPrice() * tradeAmount)}</strong></div>
            </div>
            {errorText && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errorText}</p>}
            <button type="button" onClick={handlePlaceTrade} disabled={isSubmitting} className={`mt-4 w-full rounded-xl px-4 py-3 font-bold text-white disabled:opacity-60 ${selectedSide === 'Buy' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{isSubmitting ? 'Placing order…' : `${selectedSide} ${selectedSymbol} · ${orderLabel(orderType)}`}</button>
          </section>
        </div>

        <section className="rounded-2xl border border-[#dfe7f0] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">{(['Open', 'Closed'] as const).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{tab} trades</button>)}</div>
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search symbols or instruments" className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" /></div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">{filteredInstruments.map((instrument) => {
            const price = marketPrices[instrument.symbol] ?? instrument.price;
            const up = price >= instrument.price;
            return <button key={instrument.symbol} type="button" onClick={() => setSelectedSymbol(instrument.symbol)} className={`flex items-center justify-between rounded-xl border p-3 text-left ${selectedSymbol === instrument.symbol ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}><span><strong className="block text-sm text-slate-800">{instrument.symbol}</strong><small className="text-slate-500">{instrument.category}</small></span><span className="text-right"><strong className="block text-xs">{formatPrice(price, instrument.symbol)}</strong><small className={up ? 'text-emerald-600' : 'text-rose-600'}>{up ? <TrendingUp className="inline" size={12} /> : <TrendingDown className="inline" size={12} />} {up ? 'Up' : 'Down'}</small></span></button>;
          })}</div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Symbol', 'Side', 'Qty', 'Entry', 'Order', 'Opened', 'P&L', 'Status', 'Action'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
              <tbody>{visibleTrades.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No {activeTab.toLowerCase()} trades found.</td></tr> : visibleTrades.map((trade) => {
                const price = marketPrices[trade.trading_pair] ?? trade.entry_price;
                const pnl = trade.status === 'active' ? getPnl(trade, price) : trade.profit_loss;
                return <tr key={trade.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{trade.trading_pair}</td><td className={`px-3 py-3 font-semibold ${trade.trade_type === 'buy' ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.trade_type === 'buy' ? <ArrowUpRight className="inline" size={14} /> : <ArrowDownRight className="inline" size={14} />} {trade.trade_type}</td><td className="px-3 py-3">{trade.amount}</td><td className="px-3 py-3">{formatPrice(trade.entry_price, trade.trading_pair)}</td><td className="px-3 py-3">{orderLabel(trade.order_type ?? 'market')}</td><td className="px-3 py-3">{formatDate(trade.opened_at)}</td><td className={`px-3 py-3 font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(pnl)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${trade.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{trade.status}</span></td><td className="px-3 py-3">{trade.status === 'active' && <button type="button" onClick={() => void handleCloseTrade(trade.id)} disabled={isClosingTradeId === trade.id} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60">{isClosingTradeId === trade.id ? 'Closing…' : 'Close trade'}</button>}</td></tr>;
              })}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Simulated price movements are for demonstration only. Available cash excludes funds reserved for open positions; account equity reflects current position value.</p>
        </section>
      </div>
    </div>
  );
};

export default TradePage;
