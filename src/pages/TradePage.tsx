import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Activity, CandlestickChart, ChevronDown, Crosshair, LineChart, MoveHorizontal, Plus, Search, Settings, SlidersHorizontal, Star, TrendingUp, Wallet, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchLivePrices, type LivePriceMap } from '../lib/livePrices';
import { fetchMarketCandles } from '../lib/marketData';

type Category = 'Crypto' | 'Metals' | 'Stocks' | 'Forex' | 'Indices' | 'Bonds';
type TradeSide = 'Buy' | 'Sell';
type OrderType = 'market' | 'limit' | 'take_profit' | 'stop_loss';
type Timeframe = '5m' | '15m' | '1h' | '1D';
type ChartMode = 'Candles' | 'Line';
type Instrument = { symbol: string; label: string; category: Category; price: number };
type Candle = { time: number; open: number; high: number; low: number; close: number; source: 'live' };
type TradeRow = { id: string; trading_pair: string; trade_type: string; amount: number; entry_price: number; profit_loss: number; status: string; opened_at: string; order_type?: string | null };

const instruments: Instrument[] = [
  { symbol: 'BTC/USD', label: 'Bitcoin', category: 'Crypto', price: 62840 },
  { symbol: 'ETH/USD', label: 'Ethereum', category: 'Crypto', price: 3214.7 },
  { symbol: 'SOL/USD', label: 'Solana', category: 'Crypto', price: 149.92 },
  { symbol: 'BNB/USD', label: 'BNB', category: 'Crypto', price: 596.2 },
  { symbol: 'XRP/USD', label: 'XRP', category: 'Crypto', price: 0.61 },
  { symbol: 'ADA/USD', label: 'Cardano', category: 'Crypto', price: 0.63 },
  { symbol: 'DOGE/USD', label: 'Dogecoin', category: 'Crypto', price: 0.18 },
  { symbol: 'LINK/USD', label: 'Chainlink', category: 'Crypto', price: 15.4 },
  { symbol: 'UNI/USD', label: 'Uniswap', category: 'Crypto', price: 7.5 },
  { symbol: 'APT/USD', label: 'Aptos', category: 'Crypto', price: 11.8 },
  { symbol: 'ARB/USD', label: 'Arbitrum', category: 'Crypto', price: 1.14 },
  { symbol: 'SUI/USD', label: 'Sui', category: 'Crypto', price: 0.87 },
  { symbol: 'FIL/USD', label: 'Filecoin', category: 'Crypto', price: 5.5 },

  { symbol: 'XAU/USD', label: 'Gold', category: 'Metals', price: 2364.2 },
  { symbol: 'XAG/USD', label: 'Silver', category: 'Metals', price: 31.42 },
  { symbol: 'XPT/USD', label: 'Platinum', category: 'Metals', price: 1042.8 },
  { symbol: 'XPD/USD', label: 'Palladium', category: 'Metals', price: 1432.4 },

  { symbol: 'AAPL', label: 'Apple', category: 'Stocks', price: 214.64 },
  { symbol: 'MSFT', label: 'Microsoft', category: 'Stocks', price: 436.19 },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'Stocks', price: 131.41 },
  { symbol: 'TSLA', label: 'Tesla', category: 'Stocks', price: 246.8 },
  { symbol: 'AMZN', label: 'Amazon', category: 'Stocks', price: 186.3 },
  { symbol: 'GOOGL', label: 'Alphabet', category: 'Stocks', price: 173.2 },
  { symbol: 'META', label: 'Meta', category: 'Stocks', price: 506.4 },
  { symbol: 'NFLX', label: 'Netflix', category: 'Stocks', price: 629.9 },

  { symbol: 'EUR/USD', label: 'Euro / US Dollar', category: 'Forex', price: 1.0862 },
  { symbol: 'GBP/USD', label: 'Pound / US Dollar', category: 'Forex', price: 1.2684 },
  { symbol: 'USD/JPY', label: 'US Dollar / Yen', category: 'Forex', price: 149.42 },
  { symbol: 'AUD/USD', label: 'Australian Dollar', category: 'Forex', price: 0.6648 },
  { symbol: 'USD/CAD', label: 'US Dollar / Canadian Dollar', category: 'Forex', price: 1.36 },
  { symbol: 'NZD/USD', label: 'New Zealand Dollar', category: 'Forex', price: 0.6127 },
  { symbol: 'CHF/USD', label: 'Swiss Franc / US Dollar', category: 'Forex', price: 0.898 },

  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Indices', price: 19742.3 },
  { symbol: 'SPX', label: 'S&P 500', category: 'Indices', price: 5562.1 },
  { symbol: 'DAX', label: 'DAX', category: 'Indices', price: 19124.3 },
  { symbol: 'FTSE', label: 'FTSE 100', category: 'Indices', price: 8271.9 },
  { symbol: 'VIX', label: 'VIX', category: 'Indices', price: 17.8 },
  { symbol: 'N225', label: 'Nikkei 225', category: 'Indices', price: 38000 },

  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bonds', price: 4.21 },
  { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bonds', price: 4.63 },
  { symbol: 'US2Y', label: 'US 2Y Bond', category: 'Bonds', price: 4.08 },
  { symbol: 'DE10Y', label: 'Germany 10Y Bond', category: 'Bonds', price: 2.39 },
  { symbol: 'UK10Y', label: 'UK 10Y Bond', category: 'Bonds', price: 4.42 },
];

const categories: Category[] = ['Crypto', 'Metals', 'Stocks', 'Forex', 'Indices', 'Bonds'];
const categorySymbols: Record<Category, string[]> = {
  Crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD', 'LINK/USD', 'UNI/USD', 'APT/USD', 'ARB/USD', 'SUI/USD', 'FIL/USD'],
  Metals: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
  Stocks: ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'NFLX'],
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'CHF/USD'],
  Indices: ['NASDAQ', 'SPX', 'DAX', 'FTSE', 'VIX', 'N225'],
  Bonds: ['US10Y', 'US30Y', 'US2Y', 'DE10Y', 'UK10Y'],
};
const orderTypes: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];
const intervalMs: Record<Timeframe, number> = { '5m': 5 * 60_000, '15m': 15 * 60_000, '1h': 60 * 60_000, '1D': 24 * 60 * 60_000 };
const marketIntervalMap: Record<Timeframe, string> = { '5m': '5min', '15m': '15min', '1h': '1h', '1D': '1day' };
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const priceText = (value: number, symbol: string) => new Intl.NumberFormat('en-US', { minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'CHF/USD'].includes(symbol) ? 4 : 2, maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'CHF/USD'].includes(symbol) ? 4 : 2 }).format(value);
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const tradePnl = (trade: TradeRow, price: number) => (trade.trade_type === 'buy' ? price - trade.entry_price : trade.entry_price - price) * trade.amount;
const timeLabel = (time: number, tf: Timeframe) => new Date(time).toLocaleString([], tf === '1D' ? { month: 'short', day: 'numeric' } : { hour: '2-digit', minute: '2-digit' });

const toCandles = (samples: Candle[], interval: number): Candle[] => {
  const buckets = new Map<number, Candle[]>();
  for (const sample of samples) {
    const key = Math.floor(sample.time / interval) * interval;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(sample); else buckets.set(key, [sample]);
  }
  return [...buckets.entries()].sort(([a], [b]) => a - b).map(([time, points]) => ({
    time,
    open: points[0].open,
    close: points[points.length - 1].close,
    high: Math.max(...points.map((point) => point.high)),
    low: Math.min(...points.map((point) => point.low)),
    source: 'live',
  }));
};

export const TradePage = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>('Crypto');
  const [symbol, setSymbol] = useState('BTC/USD');
  const [query, setQuery] = useState('');
  const [prices, setPrices] = useState<LivePriceMap>({});
  const [feedError, setFeedError] = useState('');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [chartMode, setChartMode] = useState<ChartMode>('Candles');
  const [showGrid, setShowGrid] = useState(true);
  const [showMA, setShowMA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [chartWidth, setChartWidth] = useState(900);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['BTC/USD', 'ETH/USD']);
  const [activeTab, setActiveTab] = useState<'Open' | 'Closed'>('Open');
  const [search, setSearch] = useState('');
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [balance, setBalance] = useState(0);
  const [side, setSide] = useState<TradeSide>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState(1);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, pan: 0 });

  const instrument = instruments.find((item) => item.symbol === symbol) ?? instruments[0];
  const liveQuote = prices[symbol];
  const livePrice = liveQuote?.price ?? candles[candles.length - 1]?.close ?? instrument.price;
  const availableInCategory = instruments.filter((item) => categorySymbols[category].includes(item.symbol));

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const resize = () => setChartWidth(Math.max(320, element.clientWidth));
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshPrices = async () => {
      const fetched = await fetchLivePrices();
      if (cancelled) return;
      setPrices(fetched);
      if (fetched[symbol]) {
        setFeedError('');
      }
    };
    void refreshPrices();
    const timer = window.setInterval(() => void refreshPrices(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    const loadCandles = async () => {
      try {
        const response = await fetchMarketCandles(symbol, marketIntervalMap[timeframe], 200);
        if (cancelled) return;
        const nextCandles = response.candles
          .map((bar) => ({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close, source: 'live' as const }))
          .filter((bar) => Number.isFinite(bar.time) && Number.isFinite(bar.open) && Number.isFinite(bar.high) && Number.isFinite(bar.low) && Number.isFinite(bar.close));

        setCandles(nextCandles.slice(-300));
        setFeedError(nextCandles.length ? '' : `No live market data available for ${symbol}.`);
      } catch (error) {
        console.warn(`Unable to load Twelve Data candles for ${symbol}:`, error);
        if (!cancelled) {
          setCandles([]);
          setFeedError(`Unable to fetch market data for ${symbol}.`);
        }
      }
    };

    setCandles([]);
    void loadCandles();
    const timer = window.setInterval(() => void loadCandles(), 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [symbol, timeframe]);

  useEffect(() => { setPan(0); setHoverIndex(null); }, [symbol, timeframe]);

  const loadAccount = async () => {
    if (!user) { setBalance(0); setTrades([]); return; }
    const [profileResult, tradesResult] = await Promise.all([
      supabase.from('user_profiles').select('available_balance').eq('id', user.id).maybeSingle(),
      supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (profileResult.error) console.error('Error loading balance:', profileResult.error.message);
    else setBalance(Number(profileResult.data?.available_balance ?? 0));
    if (tradesResult.error) console.error('Error loading trades:', tradesResult.error.message);
    else setTrades((tradesResult.data ?? []).map((row: any) => ({ id: row.id, trading_pair: row.token_pair ?? row.trading_pair ?? '', trade_type: row.trade_type ?? 'buy', amount: Number(row.amount ?? 0), entry_price: Number(row.entry_price ?? 0), profit_loss: Number(row.profit_loss ?? 0), status: row.status ?? 'active', opened_at: row.created_at ?? new Date().toISOString(), order_type: row.order_type ?? null })));
  };
  useEffect(() => { void loadAccount(); }, [user]);

  const data = useMemo(() => toCandles(candles, intervalMs[timeframe]), [candles, timeframe]);
  const count = Math.max(2, Math.floor(70 / zoom));
  const maxPan = Math.max(0, data.length - count);
  const safePan = clamp(pan, 0, maxPan);
  const visible = data.slice(Math.max(0, data.length - count - safePan), data.length - safePan || undefined);
  const low = visible.length ? Math.min(...visible.map((point) => point.low)) : (livePrice ?? instrument.price) * 0.995;
  const high = visible.length ? Math.max(...visible.map((point) => point.high)) : (livePrice ?? instrument.price) * 1.005;
  const center = (low + high) / 2;
  const displayedRange = Math.max((high - low) / zoom, center * 0.00005, 0.000001);
  const minPrice = center - displayedRange / 2;
  const maxPrice = center + displayedRange / 2;
  const plot = { left: 14, right: 12, top: 16, bottom: 24 };
  const chartHeight = 490;
  const step = (chartWidth - plot.left - plot.right) / Math.max(visible.length, 1);
  const candleWidth = Math.max(3, Math.min(16, step * 0.68));
  const y = (price: number) => plot.top + ((maxPrice - price) / Math.max(maxPrice - minPrice, 0.000001)) * (chartHeight - plot.top - plot.bottom);
  const x = (index: number) => plot.left + step * index + step / 2;
  const selectedCandle = hoverIndex == null ? visible[visible.length - 1] : visible[hoverIndex];
  const maValues = visible.map((_, index) => { const part = visible.slice(Math.max(0, index - 8), index + 1); return part.reduce((total, point) => total + point.close, 0) / part.length; });

  const zoomIn = () => setZoom((value) => clamp(value * 1.25, 1, 8));
  const zoomOut = () => setZoom((value) => clamp(value / 1.25, 1, 8));
  const resetView = () => { setZoom(1); setPan(0); setHoverIndex(null); };
  const movePan = (direction: -1 | 1) => setPan((value) => clamp(value + direction * Math.max(1, Math.floor(count / 5)), 0, maxPan));
  const onWheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) movePan(event.deltaX > 0 || event.deltaY > 0 ? 1 : -1); else { if (event.deltaY < 0) zoomIn(); else zoomOut(); } };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { setDragging(true); dragRef.current = { x: event.clientX, pan: safePan }; event.currentTarget.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(clamp((event.clientX - bounds.left) / bounds.width, 0, 0.9999) * visible.length);
    setHoverIndex(index);
    if (!dragging || step <= 0) return;
    const bars = Math.round((dragRef.current.x - event.clientX) / step);
    setPan(clamp(dragRef.current.pan + bars, 0, maxPan));
  };
  const onPointerUp = () => setDragging(false);

  const openTrades = useMemo(() => trades.filter((trade) => trade.status === 'active'), [trades]);
  const visibleTrades = useMemo(() => trades.filter((trade) => (activeTab === 'Open' ? trade.status === 'active' : trade.status !== 'active') && trade.trading_pair.toLowerCase().includes(search.toLowerCase())), [trades, activeTab, search]);
  const totalPnl = openTrades.reduce((sum, trade) => sum + tradePnl(trade, prices[trade.trading_pair]?.price ?? trade.entry_price), 0);
  const orderPrice = orderType === 'market' || !triggerPrice ? livePrice : triggerPrice;
  const chooseCategory = (next: Category) => { setCategory(next); const first = categorySymbols[next][0]; if (first) setSymbol(first); };
  const toggleFavorite = (value: string) => setFavorites((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  const filtered = availableInCategory.filter((item) => `${item.symbol} ${item.label}`.toLowerCase().includes(query.toLowerCase()));

  const submitTrade = async () => {
    if (!user) { setError('Sign in to place a simulated trade.'); return; }
    if (!orderPrice || !Number.isFinite(quantity) || quantity <= 0) { setError('A live quote and valid quantity are required.'); return; }
    const cost = orderPrice * quantity;
    if (balance < cost) { setError(`Insufficient balance. Available: ${money(balance)}.`); return; }
    setSubmitting(true); setError('');
    try {
      const nextBalance = balance - cost;
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: nextBalance }).eq('id', user.id);
      if (balanceError) throw balanceError;
      const { error: insertError } = await supabase.from('trades').insert({ user_id: user.id, token_pair: symbol, trading_pair: symbol, trade_type: side.toLowerCase(), amount: quantity, entry_price: orderPrice, status: 'active, open', created_at: new Date().toISOString() });
      if (insertError) { await supabase.from('user_profiles').update({ available_balance: balance }).eq('id', user.id); throw insertError; }
      await loadAccount();
    } catch (reason) { console.error(reason); setError('Could not create trade.'); await loadAccount(); }
    finally { setSubmitting(false); }
  };

  const closeTrade = async (trade: TradeRow) => {
    if (!user || trade.status !== 'active') return;
    const quote = prices[trade.trading_pair]?.price;
    if (!quote) { setError('Cannot close this trade without a live quote.'); return; }
    setClosingId(trade.id); setError('');
    try {
      const profit = tradePnl(trade, quote);
      const { data: profile, error: profileError } = await supabase.from('user_profiles').select('available_balance, total_profit').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      const { data: updated, error: tradeError } = await supabase.from('trades').update({ status: 'closed', profit_loss: profit, exit_price: quote, closed_at: new Date().toISOString() }).eq('id', trade.id).select();
      if (tradeError) throw tradeError;
      if (!updated) throw new Error('Trade already closed.');
      const { error: updateBalanceError } = await supabase.from('user_profiles').update({ available_balance: Number(profile?.available_balance ?? 0) + trade.entry_price * trade.amount + profit }).eq('id', user.id);
      if (updateBalanceError) throw updateBalanceError;
      await loadAccount();
    } catch (reason) { console.error(reason); setError('Could not close trade. Refresh and retry.'); }
    finally { setClosingId(null); }
  };

  return <div className="min-h-screen bg-[#edf3f8] p-3 lg:p-5"><div className="mx-auto max-w-[1540px] space-y-4">
    <div className="mb-1 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{item}</button>)}</div>
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2"><div className="flex items-center gap-1"><button aria-label="Pan chart left" title="Pan left" onClick={() => movePan(-1)} className="rounded border bg-white p-1 text-slate-600"><MoveHorizontal size={14} className="rotate-180" /></button><button aria-label="Pan chart right" title="Pan right" onClick={() => movePan(1)} className="rounded border bg-white p-1 text-slate-600"><MoveHorizontal size={14} /></button></div><div className="flex items-center gap-2 text-xs"><button onClick={resetView} className="rounded border bg-white px-2 py-1 text-slate-600">Reset</button><button onClick={() => setShowSettings((value) => !value)} className="rounded border bg-white p-1 text-slate-600"><Settings size={14} /></button></div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">{instrument.label} · {timeframe}</div><strong className="text-lg">{symbol} {livePrice ? priceText(livePrice, symbol) : '—'}</strong></div><div className="text-right text-xs"><span className={livePrice ? 'text-emerald-700' : 'text-amber-700'}>{feedError || `LIVE · ${new Date().toLocaleTimeString()}`}</span><div className="mt-1 flex gap-3 text-slate-500"><span>O {priceText(selectedCandle?.open ?? livePrice ?? instrument.price, symbol)}</span><span>H {priceText(selectedCandle?.high ?? livePrice ?? instrument.price, symbol)}</span><span>L {priceText(selectedCandle?.low ?? livePrice ?? instrument.price, symbol)}</span><span>C {priceText(selectedCandle?.close ?? livePrice ?? instrument.price, symbol)}</span></div></div></div>
      {showSettings && <div className="mx-3 mb-2 flex gap-4 rounded border bg-slate-50 p-2 text-xs"><label className="flex gap-2"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /> Grid</label><label className="flex gap-2"><input type="checkbox" checked={showMA} onChange={(event) => setShowMA(event.target.checked)} /> MA</label><label className="flex gap-2"><span>Chart</span><select value={chartMode} onChange={(event) => setChartMode(event.target.value as ChartMode)} className="rounded border bg-white px-1 py-0.5"><option value="Candles">Candles</option><option value="Line">Line</option></select></label></div>}
      <div ref={chartRef} className={`relative h-[470px] touch-none overflow-hidden bg-white ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        {visible.length ? <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">{showGrid && Array.from({ length: 6 }, (_, index) => { const gy = plot.top + index / 5 * (chartHeight - plot.top - plot.bottom); return <line key={gy} x1={plot.left} x2={chartWidth - plot.right} y1={gy} y2={gy} stroke="#e2e8f0" strokeDasharray="4 6" />; })}{showGrid && Array.from({ length: 8 }, (_, index) => { const gx = plot.left + index / 7 * (chartWidth - plot.left - plot.right); return <line key={gx} x1={gx} x2={gx} y1={plot.top} y2={chartHeight - plot.bottom} stroke="#e2e8f0" strokeDasharray="4 6" />; })}{showMA && visible.length > 1 && <path d={maValues.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.8} />}{chartMode === 'Line' ? <path d={visible.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.close)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /> : visible.map((point, index) => { const openY = y(point.open); const closeY = y(point.close); const highY = y(point.high); const lowY = y(point.low); const isUp = point.close >= point.open; const color = isUp ? '#16a34a' : '#dc2626'; return <g key={`${point.time}-${index}`}><line x1={x(index)} x2={x(index)} y1={highY} y2={lowY} stroke={color} strokeWidth={1.5} /><rect x={x(index) - candleWidth / 2} y={Math.min(openY, closeY)} width={candleWidth} height={Math.max(Math.abs(closeY - openY), 3)} rx={1} fill={color} /></g>; })}{hoverIndex !== null && visible[hoverIndex] && <g><line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={plot.top} y2={chartHeight - plot.bottom} stroke="#60a5fa" strokeDasharray="6 6" /><line x1={plot.left} x2={chartWidth - plot.right} y1={y(visible[hoverIndex].close)} y2={y(visible[hoverIndex].close)} stroke="#60a5fa" strokeDasharray="6 6" /></g>}</svg> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Waiting for live market data…</div>}
        <div className="absolute bottom-3 left-3 flex gap-1 rounded border bg-white/95 p-1"><button aria-label="Zoom in" onClick={zoomIn} className="p-1"><ZoomIn size={14} /></button><button aria-label="Zoom out" onClick={zoomOut} className="p-1"><ZoomOut size={14} /></button><button aria-label="Reset view" onClick={resetView} className="p-1"><Activity size={14} /></button></div>
      </div>
      <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-2 text-[10px] text-slate-500"><span>{visible.length ? timeLabel(visible[0].time, timeframe) : 'No candle history'}</span><span>{visible.length ? `${visible.length} bars` : 'Waiting'}</span><span>{feedError || 'Live feed connected'}</span></div>
    </div>
    <aside className="space-y-3"><div className="rounded-xl border bg-white p-4"><div className="mb-3 flex items-center justify-between"><div><b className="text-sm">{category} markets</b><div className="text-xs text-slate-500">Relevant pairs</div></div><button className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">{categorySymbols[category].length}</button></div><div className="mb-3 flex items-center gap-2 rounded border bg-slate-50 px-2 py-1.5"><Search size={12} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search market" className="w-full bg-transparent text-xs outline-none" /></div><div className="space-y-2">{filtered.map((item) => <button key={item.symbol} onClick={() => setSymbol(item.symbol)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${symbol === item.symbol ? 'border border-blue-500/30 bg-blue-600/20 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}><div className="flex flex-col"><div className="font-medium">{item.symbol}</div><div className="text-[10px] text-slate-500">{item.label}</div></div><div className="text-xs font-semibold text-emerald-600">{priceText(prices[item.symbol]?.price ?? item.price, item.symbol)}</div></button>)}</div></div><section className="rounded-xl border bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between"><div className="flex gap-2">{(['Open', 'Closed'] as const).map((value) => <button key={value} onClick={() => setActiveTab(value)} className={`rounded-full px-2 py-1 text-xs ${activeTab === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value}</button>)}</div><button className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">P&L {money(totalPnl)}</button></div><div className="space-y-2">{visibleTrades.length ? visibleTrades.map((trade) => <div key={trade.id} className="rounded-lg border bg-slate-50 p-2 text-xs"><div className="flex items-center justify-between"><strong>{trade.trading_pair}</strong><span className={trade.trade_type === 'buy' ? 'text-emerald-600' : 'text-red-600'}>{trade.trade_type.toUpperCase()}</span></div><div className="mt-1 flex items-center justify-between text-slate-500"><span>{trade.amount} units</span><span>{money(trade.entry_price)}</span></div></div>) : <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">No {activeTab.toLowerCase()} trades yet.</div>}</div></section></aside></section></div></div>;
};

export default TradePage;
