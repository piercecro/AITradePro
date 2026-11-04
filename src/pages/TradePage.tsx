import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Activity, CandlestickChart, ChevronDown, Crosshair, LineChart, MoveHorizontal, Plus, Search, Settings, SlidersHorizontal, Star, TrendingUp, Wallet, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchLivePrices, type LivePriceMap } from '../lib/livePrices';

type Category = 'Crypto' | 'Metals' | 'Stocks' | 'Forex' | 'Indices' | 'Bonds';
type TradeSide = 'Buy' | 'Sell';
type OrderType = 'market' | 'limit' | 'take_profit' | 'stop_loss';
type Timeframe = '5m' | '15m' | '1h' | '1D';
type ChartMode = 'Candles' | 'Line';
type Instrument = { symbol: string; label: string; category: Category; price: number };
type Candle = { time: number; open: number; high: number; low: number; close: number; source: 'live' };
type TradeRow = { id: string; trading_pair: string; trade_type: string; amount: number; entry_price: number; profit_loss: number; status: string; opened_at: string; order_type?: string | null };

const instruments: Instrument[] = [
  { symbol: 'BTC/USD', label: 'Bitcoin', category: 'Crypto', price: 62840 }, { symbol: 'ETH/USD', label: 'Ethereum', category: 'Crypto', price: 3214.7 }, { symbol: 'SOL/USD', label: 'Solana', category: 'Crypto', price: 149.92 },
  { symbol: 'XAU/USD', label: 'Gold', category: 'Metals', price: 2364.2 }, { symbol: 'XAG/USD', label: 'Silver', category: 'Metals', price: 31.42 },
  { symbol: 'AAPL', label: 'Apple', category: 'Stocks', price: 214.64 }, { symbol: 'MSFT', label: 'Microsoft', category: 'Stocks', price: 436.19 }, { symbol: 'NVDA', label: 'NVIDIA', category: 'Stocks', price: 131.41 }, { symbol: 'TSLA', label: 'Tesla', category: 'Stocks', price: 246.8 },
  { symbol: 'EUR/USD', label: 'Euro / US Dollar', category: 'Forex', price: 1.0862 }, { symbol: 'GBP/USD', label: 'Pound / US Dollar', category: 'Forex', price: 1.2684 }, { symbol: 'USD/JPY', label: 'US Dollar / Yen', category: 'Forex', price: 149.42 }, { symbol: 'AUD/USD', label: 'Australian Dollar', category: 'Forex', price: 0.6648 },
  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Indices', price: 19742.3 }, { symbol: 'SPX', label: 'S&P 500', category: 'Indices', price: 5562.1 }, { symbol: 'DAX', label: 'DAX', category: 'Indices', price: 19124.3 }, { symbol: 'FTSE', label: 'FTSE 100', category: 'Indices', price: 8271.9 }, { symbol: 'VIX', label: 'VIX', category: 'Indices', price: 17.8 },
  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bonds', price: 4.21 }, { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bonds', price: 4.63 },
];
const categories: Category[] = ['Crypto', 'Metals', 'Stocks', 'Forex', 'Indices', 'Bonds'];
const orderTypes: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];
const intervalMs: Record<Timeframe, number> = { '5m': 5 * 60_000, '15m': 15 * 60_000, '1h': 60 * 60_000, '1D': 24 * 60 * 60_000 };
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const priceText = (value: number, symbol: string) => new Intl.NumberFormat('en-US', { minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2, maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2 }).format(value);
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
    time, open: points[0].open, close: points[points.length - 1].close,
    high: Math.max(...points.map((point) => point.high)), low: Math.min(...points.map((point) => point.low)), source: 'live',
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

  const instrument = instruments.find((item) => item.symbol === symbol)!;
  const liveQuote = prices[symbol];
  const livePrice = liveQuote?.price;
  const availableInCategory = instruments.filter((item) => item.category === category);

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
      setFeedError(fetched[symbol] ? '' : `Live quotes are not configured for ${symbol}. Select a supported crypto market (BTC/USD, ETH/USD, or SOL/USD) or configure a provider for this asset class.`);
      const quote = fetched[symbol]?.price;
      if (!Number.isFinite(quote) || !quote || quote <= 0) {
        setCandles([]);
        return;
      }
      const now = Date.now();
      setCandles((previous) => {
        const last = previous[previous.length - 1];
        const open = last?.close ?? quote;
        const wick = Math.max(Math.abs(quote - open) * 1.5, quote * 0.00005);
        return [...previous, { time: now, open, close: quote, high: Math.max(open, quote) + wick, low: Math.max(0, Math.min(open, quote) - wick), source: 'live' }].slice(-3000);
      });
    };
    setCandles([]);
    void refreshPrices();
    const timer = window.setInterval(() => void refreshPrices(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [symbol]);

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
    else setTrades((tradesResult.data ?? []).map((row: any) => ({ id: row.id, trading_pair: row.token_pair ?? row.trading_pair ?? '', trade_type: row.trade_type ?? 'buy', amount: Number(row.amount ?? 0), entry_price: Number(row.execution_price ?? row.entry_price ?? 0), profit_loss: Number(row.profit_loss ?? 0), status: row.status ?? 'active', opened_at: row.created_at ?? row.opened_at ?? new Date().toISOString(), order_type: row.order_type ?? 'market' })));
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
  const onWheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) movePan(event.deltaX > 0 || event.deltaY > 0 ? 1 : -1); else if (event.deltaY < 0) zoomIn(); else zoomOut(); };
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
  const chooseCategory = (next: Category) => { setCategory(next); const first = instruments.find((item) => item.category === next); if (first) setSymbol(first.symbol); };
  const toggleFavorite = (value: string) => setFavorites((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  const filtered = instruments.filter((item) => item.category === category && `${item.symbol} ${item.label}`.toLowerCase().includes(query.toLowerCase()));

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
      const { error: insertError } = await supabase.from('trades').insert({ user_id: user.id, token_pair: symbol, trading_pair: symbol, trade_type: side.toLowerCase(), amount: quantity, entry_price: orderPrice, execution_price: orderPrice, profit_loss: 0, status: 'active', order_type: orderType, stop_loss_price: orderType === 'stop_loss' ? triggerPrice : null, take_profit_price: orderType === 'take_profit' ? triggerPrice : null, created_at: new Date().toISOString(), opened_at: new Date().toISOString() });
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
      const { data: updated, error: tradeError } = await supabase.from('trades').update({ status: 'closed', profit_loss: profit, exit_price: quote, closed_at: new Date().toISOString() }).eq('id', trade.id).eq('user_id', user.id).eq('status', 'active').select('id').maybeSingle();
      if (tradeError) throw tradeError;
      if (!updated) throw new Error('Trade already closed.');
      const { error: updateBalanceError } = await supabase.from('user_profiles').update({ available_balance: Number(profile?.available_balance ?? 0) + trade.entry_price * trade.amount + profit, total_profit: Number(profile?.total_profit ?? 0) + profit }).eq('id', user.id);
      if (updateBalanceError) throw updateBalanceError;
      await loadAccount();
    } catch (reason) { console.error(reason); setError('Could not close trade. Refresh and retry.'); }
    finally { setClosingId(null); }
  };

  return <div className="min-h-screen bg-[#edf3f8] p-3 lg:p-5"><div className="mx-auto max-w-[1540px] space-y-4">
    <div className="mb-1 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}</div>
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2"><div className="flex items-center gap-1"><button aria-label="Pan chart left" title="Pan left" onClick={() => movePan(-1)} disabled={!maxPan} className="rounded border bg-white p-2 disabled:opacity-40"><MoveHorizontal size={14} /></button><button aria-label="Zoom out" title="Zoom out" onClick={zoomOut} className="rounded border bg-white p-2"><ZoomOut size={14} /></button><button aria-label="Zoom in" title="Zoom in" onClick={zoomIn} className="rounded border bg-white p-2"><ZoomIn size={14} /></button><button aria-label="Pan chart right" title="Pan right" onClick={() => movePan(1)} disabled={!maxPan} className="rounded border bg-white px-2 py-2 text-xs disabled:opacity-40">→</button><button onClick={resetView} title="Reset zoom and pan" className="rounded border bg-white px-2 py-1.5 text-xs">Reset</button><label className="relative"><Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${category} symbols`} className="w-36 rounded border bg-white py-1.5 pl-7 pr-2 text-xs" /></label></div><div className="flex items-center gap-1">{(Object.keys(intervalMs) as Timeframe[]).map((value) => <button key={value} onClick={() => setTimeframe(value)} className={`rounded px-2.5 py-1.5 text-xs font-semibold ${timeframe === value ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>{value}</button>)}</div><div className="flex gap-1"><button title="Toggle grid" onClick={() => setShowGrid((value) => !value)} className="rounded border bg-white p-2"><SlidersHorizontal size={14} /></button><button title="Candlesticks" onClick={() => setChartMode('Candles')} className={`rounded border p-2 ${chartMode === 'Candles' ? 'bg-blue-50 text-blue-700' : 'bg-white'}`}><CandlestickChart size={14} /></button><button title="Line chart" onClick={() => setChartMode('Line')} className={`rounded border p-2 ${chartMode === 'Line' ? 'bg-blue-50 text-blue-700' : 'bg-white'}`}><LineChart size={14} /></button><button title="Settings" onClick={() => setShowSettings((value) => !value)} className="rounded border bg-white p-2"><Settings size={14} /></button></div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">{instrument.label} · {timeframe}</div><strong className="text-lg">{symbol} {livePrice ? priceText(livePrice, symbol) : '—'}</strong></div><div className="text-right text-xs"><span className={livePrice ? 'text-emerald-700' : 'text-amber-700'}>{livePrice ? `LIVE · ${liveQuote?.updatedAt ? new Date(liveQuote.updatedAt).toLocaleTimeString() : 'updated'}` : feedError || 'Waiting for live quote'}</span><div className="mt-1 flex gap-3 text-slate-500"><span>O {priceText(selectedCandle?.open ?? livePrice ?? instrument.price, symbol)}</span><span>H {priceText(selectedCandle?.high ?? livePrice ?? instrument.price, symbol)}</span><span>L {priceText(selectedCandle?.low ?? livePrice ?? instrument.price, symbol)}</span><span>C {priceText(selectedCandle?.close ?? livePrice ?? instrument.price, symbol)}</span></div></div></div>
      {showSettings && <div className="mx-3 mb-2 flex gap-4 rounded border bg-slate-50 p-2 text-xs"><label className="flex gap-2"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />Grid</label><label className="flex gap-2"><input type="checkbox" checked={showMA} onChange={(event) => setShowMA(event.target.checked)} />Moving average</label></div>}
      <div ref={chartRef} className={`relative h-[470px] touch-none overflow-hidden bg-white ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {visible.length ? <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">{showGrid && Array.from({ length: 6 }, (_, index) => { const gy = plot.top + index / 5 * (chartHeight - plot.top - plot.bottom); return <line key={`h${index}`} x1={plot.left} x2={chartWidth - plot.right} y1={gy} y2={gy} stroke="#e8eef5" strokeDasharray="3 6" />; })}{chartMode === 'Candles' ? visible.map((point, index) => { const rising = point.close >= point.open; const top = y(Math.max(point.open, point.close)); const bottom = y(Math.min(point.open, point.close)); const color = rising ? '#16a34a' : '#ef4444'; return <g key={`${point.time}-${index}`}><line x1={x(index)} x2={x(index)} y1={y(point.high)} y2={y(point.low)} stroke={color} /><rect x={x(index) - candleWidth / 2} y={top} width={candleWidth} height={Math.max(2, bottom - top)} fill={color} /></g>; }) : <path d={visible.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.close)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth={2} />}{showMA && <path d={maValues.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth={2} />}{selectedCandle && hoverIndex != null && <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={plot.top} y2={chartHeight - plot.bottom} stroke="#60a5fa" strokeDasharray="4 4" />}</svg> : <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-slate-500"><Activity size={22} />{feedError || `Loading live ${symbol} data…`}</div>}
        <div className="absolute bottom-3 left-3 flex gap-1 rounded border bg-white/95 p-1"><button aria-label="Zoom in" onClick={zoomIn} className="p-1"><ZoomIn size={14} /></button><button aria-label="Zoom out" onClick={zoomOut} className="p-1"><ZoomOut size={14} /></button><button aria-label="Pan left" disabled={!maxPan} onClick={() => movePan(-1)} className="p-1 disabled:opacity-40">←</button><button aria-label="Pan right" disabled={!maxPan} onClick={() => movePan(1)} className="p-1 disabled:opacity-40">→</button><button onClick={resetView} className="px-1 text-[10px]">Reset</button></div><div className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500">Drag to pan · scroll to zoom</div>
      </div>
      <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-2 text-[10px] text-slate-500"><span>{visible.length ? timeLabel(visible[0].time, timeframe) : 'No candle history yet'} — {visible.length ? timeLabel(visible[visible.length - 1].time, timeframe) : 'Now'}</span><span>{visible.length} candles · {zoom.toFixed(1)}×</span></div>
    </div>
    <aside className="space-y-3"><div className="rounded-xl border bg-white p-4"><div className="mb-3 flex items-center justify-between"><div><b className="text-sm">{category} markets</b><div className="text-[10px] text-slate-400">Select a symbol to chart</div></div><Star size={15} className="text-amber-500" /></div><div className="max-h-72 divide-y overflow-y-auto">{filtered.map((item) => { const quote = prices[item.symbol]; return <div key={item.symbol} className="flex items-center justify-between py-2"><button onClick={() => setSymbol(item.symbol)} className="text-left"><b className="block text-xs">{item.symbol}</b><span className="text-[10px] text-slate-400">{item.label}</span></button><div className="flex items-center gap-2"><span className="text-xs">{quote ? priceText(quote.price, item.symbol) : '—'}</span><button aria-label={`${favorites.includes(item.symbol) ? 'Remove' : 'Add'} ${item.symbol} favorite`} onClick={() => setFavorites((current) => current.includes(item.symbol) ? current.filter((entry) => entry !== item.symbol) : [...current, item.symbol])} className="text-amber-500"><Star size={13} fill={favorites.includes(item.symbol) ? 'currentColor' : 'none'} /></button></div></div>; })}</div></div><div className="rounded-xl border bg-white p-4"><div className="mb-3 flex justify-between"><div><span className="text-[10px] uppercase tracking-widest text-slate-500">Simulated order ticket</span><div className="font-bold">{symbol}</div></div><b>{livePrice ? priceText(livePrice, symbol) : 'No live quote'}</b></div><div className="mb-3 grid grid-cols-2 gap-2">{(['Buy', 'Sell'] as const).map((value) => <button key={value} onClick={() => setSide(value)} className={`rounded py-2 text-sm font-bold text-white ${side === value ? value === 'Buy' ? 'bg-green-600' : 'bg-red-600' : 'bg-slate-400'}`}>{value}</button>)}</div><div className="mb-3 grid grid-cols-2 gap-1">{orderTypes.map((value) => <button key={value} onClick={() => { setOrderType(value); if (value !== 'market' && !triggerPrice && livePrice) setTriggerPrice(livePrice); }} className={`rounded p-1.5 text-[10px] ${orderType === value ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{value.replace('_', ' ')}</button>)}</div>{orderType !== 'market' && <label className="mb-2 flex justify-between rounded bg-slate-50 p-2 text-xs">Trigger price<input type="number" value={triggerPrice || ''} onChange={(event) => setTriggerPrice(Number(event.target.value) || 0)} className="w-24 bg-transparent text-right" /></label>}<label className="flex justify-between rounded bg-slate-50 p-2 text-xs">Quantity<input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 0.01)} className="w-20 bg-transparent text-right" /></label><div className="my-2 flex justify-between text-xs"><span>Est. value</span><b>{orderPrice ? money(orderPrice * quantity) : '—'}</b></div>{error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}<button disabled={submitting || !livePrice} onClick={() => void submitTrade()} className={`w-full rounded py-2.5 text-sm font-bold text-white disabled:opacity-50 ${side === 'Buy' ? 'bg-green-600' : 'bg-red-600'}`}>{submitting ? 'Submitting…' : `${side} ${symbol}`}</button><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span><Wallet size={11} className="mr-1 inline" />Balance</span><b>{money(balance)}</b></div></div></aside></section>
    <section className="rounded-xl border bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between"><div className="flex gap-2">{(['Open', 'Closed'] as const).map((value) => <button key={value} onClick={() => setActiveTab(value)} className={`rounded px-3 py-2 text-xs ${activeTab === value ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{value}</button>)}</div><label className="relative"><Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trades" className="rounded border py-1.5 pl-7 pr-2 text-xs" /></label></div><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Symbol', 'Side', 'Qty', 'Entry', 'Order', 'Opened', 'P&L', 'Action'].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead><tbody>{visibleTrades.length ? visibleTrades.map((trade) => { const quote = prices[trade.trading_pair]?.price; const pnl = trade.status === 'active' && quote ? tradePnl(trade, quote) : trade.profit_loss; return <tr key={trade.id} className="border-t"><td className="px-3 py-2">{trade.trading_pair}</td><td className="px-3 py-2">{trade.trade_type}</td><td className="px-3 py-2">{trade.amount}</td><td className="px-3 py-2">{priceText(trade.entry_price, trade.trading_pair)}</td><td className="px-3 py-2">{trade.order_type ?? 'market'}</td><td className="px-3 py-2">{new Date(trade.opened_at).toLocaleString()}</td><td className="px-3 py-2">{money(pnl)}</td><td className="px-3 py-2">{trade.status === 'active' ? <button disabled={closingId === trade.id || !quote} onClick={() => void closeTrade(trade)} className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-40">{closingId === trade.id ? 'Closing' : 'Close'}</button> : 'Closed'}</td></tr>; }) : <tr><td colSpan={8} className="p-8 text-center text-slate-500">No {activeTab.toLowerCase()} trades.</td></tr>}</tbody></table></div><div className="mt-3 flex gap-4 text-xs text-slate-500"><span>Available balance: <b>{money(balance)}</b></span><span>Open P&amp;L: <b>{money(totalPnl)}</b></span><span>Favorites: {favorites.join(', ') || 'none'}</span></div></section>
  </div></div>;
};

export default TradePage;
