import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import {
  Activity, Bell, CandlestickChart, ChevronDown, Crosshair, LineChart, MoveHorizontal,
  MousePointer2, Plus, Search, Settings, SlidersHorizontal, Star, TrendingUp,
  Wallet, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchLivePrices } from '../lib/livePrices';

type TradeSide = 'Buy' | 'Sell';
type OrderType = 'market' | 'limit' | 'take_profit' | 'stop_loss';
type Instrument = { symbol: string; label: string; category: 'Currency' | 'Metal' | 'Stock' | 'Bond' | 'Index' | 'Crypto'; description: string; price: number };
type TradeRow = { id: string; trading_pair: string; trade_type: string; amount: number; entry_price: number; exit_price?: number | null; profit_loss: number; status: string; opened_at: string; closed_at?: string | null; order_type?: string | null; stop_loss_price?: number | null; take_profit_price?: number | null };
type PricePoint = { price: number; time: number; source: 'live' | 'simulated'; open: number; high: number; low: number; close: number };
type Drawing = { x1: number; y1: number; x2: number; y2: number };
type Timeframe = '5m' | '15m' | '1h' | '1D';
type ChartMode = 'Candles' | 'Line';

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
  { symbol: 'MSFT', label: 'Microsoft', category: 'Stock', description: 'Software', price: 436.19 },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'Stock', description: 'AI chips', price: 131.41 },
  { symbol: 'TSLA', label: 'Tesla', category: 'Stock', description: 'EV maker', price: 246.8 },
  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bond', description: 'Government bond', price: 4.21 },
  { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bond', description: 'Long bond', price: 4.63 },
  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Index', description: 'Tech index', price: 19742.3 },
  { symbol: 'SPX', label: 'S&P 500', category: 'Index', description: 'S&P 500', price: 5562.1 },
  { symbol: 'DAX', label: 'DAX', category: 'Index', description: 'German index', price: 19124.3 },
  { symbol: 'FTSE', label: 'FTSE 100', category: 'Index', description: 'UK index', price: 8271.9 },
  { symbol: 'VIX', label: 'VIX', category: 'Index', description: 'Volatility index', price: 17.8 },
];
const orderOptions: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];
const timeframeMs: Record<Timeframe, number> = { '5m': 5 * 60_000, '15m': 15 * 60_000, '1h': 60 * 60_000, '1D': 24 * 60 * 60_000 };
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Math.abs(value) < 100 ? 4 : 2, maximumFractionDigits: Math.abs(value) < 100 ? 4 : 2 }).format(value);
const formatPrice = (value: number, symbol: string) => new Intl.NumberFormat('en-US', { minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2, maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2 }).format(value);
const formatTime = (time: number, timeframe: Timeframe) => new Date(time).toLocaleString([], timeframe === '1D' ? { month: 'short', day: 'numeric' } : { hour: '2-digit', minute: '2-digit' });
const orderLabel = (order: string) => ({ market: 'Market', limit: 'Limit', take_profit: 'Take Profit', stop_loss: 'Stop Loss' }[order] ?? 'Market');
const normalizeTrade = (trade: any): TradeRow => ({ id: trade.id, trading_pair: trade.token_pair ?? trade.trading_pair ?? '', trade_type: trade.trade_type ?? 'buy', amount: Number(trade.amount ?? 0), entry_price: Number(trade.execution_price ?? trade.entry_price ?? 0), exit_price: trade.exit_price == null ? null : Number(trade.exit_price), profit_loss: Number(trade.profit_loss ?? 0), status: trade.status ?? 'active', opened_at: trade.created_at ?? trade.opened_at ?? new Date().toISOString(), closed_at: trade.closed_at ?? null, order_type: trade.order_type ?? 'market', stop_loss_price: trade.stop_loss_price ?? null, take_profit_price: trade.take_profit_price ?? null });
const getPnl = (trade: TradeRow, price: number) => (trade.trade_type === 'buy' ? price - trade.entry_price : trade.entry_price - price) * trade.amount;
const makePoint = (open: number, close: number, time: number, source: PricePoint['source']): PricePoint => {
  const wick = Math.max(Math.abs(close - open) * 2.2, Math.abs(close) * 0.00015);
  return { price: close, time, source, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick };
};

const aggregateCandles = (samples: PricePoint[], interval: number): PricePoint[] => {
  const buckets = new Map<number, PricePoint[]>();
  samples.forEach((point) => {
    const bucket = Math.floor(point.time / interval) * interval;
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), point]);
  });
  return [...buckets.entries()].sort(([a], [b]) => a - b).map(([time, points]) => ({
    time,
    open: points[0].open,
    close: points[points.length - 1].close,
    high: Math.max(...points.map((point) => point.high)),
    low: Math.min(...points.map((point) => point.low)),
    price: points[points.length - 1].close,
    source: points.some((point) => point.source === 'live') ? 'live' : 'simulated',
  }));
};

export const TradePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Open' | 'Closed'>('Open');
  const [searchTerm, setSearchTerm] = useState('');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('FTSE');
  const [selectedSide, setSelectedSide] = useState<TradeSide>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [tradeAmount, setTradeAmount] = useState(1);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() => Object.fromEntries(marketInstruments.map((item) => [item.symbol, item.price])));
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosingTradeId, setIsClosingTradeId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartMode, setChartMode] = useState<ChartMode>('Candles');
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [chartZoom, setChartZoom] = useState(1.4);
  const [chartPan, setChartPan] = useState(0);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [isDraggingChart, setIsDraggingChart] = useState(false);
  const [chartWidth, setChartWidth] = useState(900);
  const [drawMode, setDrawMode] = useState(false);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [pendingDrawing, setPendingDrawing] = useState<Drawing | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['FTSE', 'BTC/USD', 'ETH/USD']);
  const [showSettings, setShowSettings] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef({ x: 0, pan: 0 });
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const instrument = marketInstruments.find((item) => item.symbol === selectedSymbol) ?? marketInstruments[0];
  const currentPrice = marketPrices[selectedSymbol] ?? instrument.price;

  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;
    const resize = () => setChartWidth(Math.max(320, node.clientWidth));
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const loadAccount = async () => {
    if (!user) { setAvailableBalance(0); setTrades([]); return; }
    const [{ data: profile, error: profileError }, { data: rows, error: tradesError }] = await Promise.all([
      supabase.from('user_profiles').select('available_balance').eq('id', user.id).maybeSingle(),
      supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (profileError) console.error('Error fetching account balance:', profileError.message);
    else setAvailableBalance(Number(profile?.available_balance ?? 0));
    if (tradesError) console.error('Error loading trades:', tradesError.message);
    else setTrades((rows ?? []).map(normalizeTrade));
  };
  useEffect(() => { void loadAccount(); }, [user]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      let live: Record<string, { price: number }> = {};
      try { live = await fetchLivePrices(); } catch (error) { console.warn('Price feed unavailable:', error); }
      if (cancelled) return;
      const next = { ...marketPrices };
      for (const item of marketInstruments) {
        const quote = live[item.symbol]?.price;
        if (Number.isFinite(quote) && quote! > 0) next[item.symbol] = Number(quote!.toFixed(6));
      }
      const quote = live[selectedSymbol]?.price;
      const source: PricePoint['source'] = Number.isFinite(quote) && quote! > 0 ? 'live' : 'simulated';
      const latest = source === 'live' ? Number(quote) : (next[selectedSymbol] ?? instrument.price);
      setMarketPrices((previous) => ({ ...previous, ...next }));
      setPriceHistory((history) => {
        const previous = history[history.length - 1];
        const time = Date.now();
        return [...history, makePoint(previous?.close ?? latest, latest, time, source)].slice(-2400);
      });
    };
    setPriceHistory([]);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selectedSymbol]);

  const aggregated = useMemo(() => aggregateCandles(priceHistory, timeframeMs[timeframe]), [priceHistory, timeframe]);
  const visibleCount = Math.max(12, Math.round(80 / chartZoom));
  const maxPan = Math.max(0, aggregated.length - visibleCount);
  const safePan = clamp(chartPan, 0, maxPan);
  const visible = aggregated.slice(safePan, safePan + visibleCount);
  useEffect(() => { setChartPan(0); setHoveredChartIndex(null); setDrawings([]); }, [selectedSymbol, timeframe]);

  const allLow = visible.length ? Math.min(...visible.map((point) => point.low)) : currentPrice * 0.999;
  const allHigh = visible.length ? Math.max(...visible.map((point) => point.high)) : currentPrice * 1.001;
  const range = Math.max(allHigh - allLow, Math.abs(currentPrice) * 0.001, 0.000001);
  const plot = { left: 16, right: 18, top: 16, bottom: 24 };
  const svgHeight = 500;
  const step = (chartWidth - plot.left - plot.right) / Math.max(visible.length, 1);
  const candleWidth = Math.max(3, Math.min(14, step * 0.64));
  const y = (price: number) => plot.top + ((allHigh - price) / range) * (svgHeight - plot.top - plot.bottom);
  const x = (index: number) => plot.left + index * step + step / 2;
  const activeCandle = hoveredChartIndex == null ? visible[visible.length - 1] : visible[hoveredChartIndex];
  const sma = visible.map((_, index) => {
    const window = visible.slice(Math.max(0, index - 8), index + 1);
    return window.reduce((sum, point) => sum + point.close, 0) / window.length;
  });

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setChartZoom((zoom) => clamp(zoom + (event.deltaY < 0 ? 0.2 : -0.2), 1, 5));
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (drawMode) {
      const rect = event.currentTarget.getBoundingClientRect();
      drawStart.current = { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
      setPendingDrawing({ x1: drawStart.current.x, y1: drawStart.current.y, x2: drawStart.current.x, y2: drawStart.current.y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    setIsDraggingChart(true);
    dragOrigin.current = { x: event.clientX, pan: safePan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.min(visible.length - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * visible.length)));
    setHoveredChartIndex(index >= 0 ? index : null);
    if (drawMode && drawStart.current) {
      setPendingDrawing({ x1: drawStart.current.x, y1: drawStart.current.y, x2: clamp((event.clientX - rect.left) / rect.width, 0, 1), y2: clamp((event.clientY - rect.top) / rect.height, 0, 1) });
      return;
    }
    if (isDraggingChart && step > 0) setChartPan(clamp(dragOrigin.current.pan - Math.round((event.clientX - dragOrigin.current.x) / step), 0, maxPan));
  };
  const onPointerUp = () => {
    if (pendingDrawing && drawMode) setDrawings((items) => [...items, pendingDrawing]);
    drawStart.current = null;
    setPendingDrawing(null);
    setIsDraggingChart(false);
  };
  const zoomIn = () => setChartZoom((zoom) => clamp(zoom + 0.25, 1, 5));
  const zoomOut = () => setChartZoom((zoom) => clamp(zoom - 0.25, 1, 5));
  const resetChart = () => { setChartZoom(1.4); setChartPan(0); setHoveredChartIndex(null); };
  const toggleFavorite = (symbol: string) => setFavorites((items) => items.includes(symbol) ? items.filter((item) => item !== symbol) : [...items, symbol]);
  const selectInstrument = (symbol: string) => { setSelectedSymbol(symbol); setShowSymbolSearch(false); setSymbolQuery(''); };

  const openTrades = useMemo(() => trades.filter((trade) => trade.status === 'active'), [trades]);
  const visibleTrades = useMemo(() => trades.filter((trade) => (activeTab === 'Open' ? trade.status === 'active' : trade.status !== 'active') && trade.trading_pair.toLowerCase().includes(searchTerm.trim().toLowerCase())), [activeTab, searchTerm, trades]);
  const pnl = useMemo(() => openTrades.reduce((sum, trade) => sum + getPnl(trade, marketPrices[trade.trading_pair] ?? trade.entry_price), 0), [openTrades, marketPrices]);
  const positionValue = useMemo(() => openTrades.reduce((sum, trade) => sum + (marketPrices[trade.trading_pair] ?? trade.entry_price) * trade.amount, 0), [openTrades, marketPrices]);
  const filteredInstruments = marketInstruments.filter((item) => !symbolQuery || `${item.symbol} ${item.label} ${item.category}`.toLowerCase().includes(symbolQuery.toLowerCase()));
  const executionPrice = orderType === 'market' || !triggerPrice ? currentPrice : triggerPrice;

  const placeTrade = async () => {
    if (!user) { setErrorText('Please sign in to place a trade.'); return; }
    if (!Number.isFinite(tradeAmount) || tradeAmount <= 0) { setErrorText('Quantity must be greater than zero.'); return; }
    if (availableBalance < executionPrice * tradeAmount) { setErrorText(`Not enough balance. Available: ${formatCurrency(availableBalance)}.`); return; }
    setErrorText(null); setIsSubmitting(true);
    try {
      const nextBalance = availableBalance - executionPrice * tradeAmount;
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: nextBalance }).eq('id', user.id);
      if (balanceError) throw balanceError;
      const { error: insertError } = await supabase.from('trades').insert({ user_id: user.id, token_pair: selectedSymbol, trading_pair: selectedSymbol, trade_type: selectedSide.toLowerCase(), amount: tradeAmount, entry_price: executionPrice, execution_price: executionPrice, profit_loss: 0, status: 'active', created_at: new Date().toISOString(), opened_at: new Date().toISOString(), order_type: orderType, stop_loss_price: orderType === 'stop_loss' ? triggerPrice : null, take_profit_price: orderType === 'take_profit' ? triggerPrice : null });
      if (insertError) { await supabase.from('user_profiles').update({ available_balance: availableBalance }).eq('id', user.id); throw insertError; }
      setAvailableBalance(nextBalance); setSelectedSide('Buy'); setOrderType('market'); setTradeAmount(1); setTriggerPrice(0); await loadAccount();
    } catch (error) { console.error('Trade submission failed:', error); setErrorText('Trade could not be created.'); await loadAccount(); }
    finally { setIsSubmitting(false); }
  };
  const closeTrade = async (trade: TradeRow) => {
    if (!user || trade.status !== 'active') return;
    setIsClosingTradeId(trade.id); setErrorText(null);
    try {
      const closePrice = marketPrices[trade.trading_pair] ?? trade.entry_price;
      const profit = getPnl(trade, closePrice);
      const { data: profile, error: profileError } = await supabase.from('user_profiles').select('available_balance, total_profit').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      const { data: updated, error: updateError } = await supabase.from('trades').update({ status: 'closed', profit_loss: profit, exit_price: closePrice, closed_at: new Date().toISOString() }).eq('id', trade.id).eq('user_id', user.id).eq('status', 'active').select('id').maybeSingle();
      if (updateError) throw updateError;
      if (!updated) throw new Error('Trade already closed.');
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: Number(profile?.available_balance ?? 0) + trade.entry_price * trade.amount + profit, total_profit: Number(profile?.total_profit ?? 0) + profit }).eq('id', user.id);
      if (balanceError) throw balanceError;
      await loadAccount();
    } catch (error) { console.error('Could not close trade:', error); setErrorText('Could not close trade. Please refresh and try again.'); }
    finally { setIsClosingTradeId(null); }
  };

  const chartSource = priceHistory[priceHistory.length - 1]?.source === 'live' ? 'Live quote' : 'Sampled fallback';
  const change = visible.length > 1 ? ((visible[visible.length - 1].close - visible[0].open) / visible[0].open) * 100 : 0;
  const analysisText = change >= 0 ? `The visible ${timeframe} sample is up ${change.toFixed(2)}%. This is a chart summary, not a trading recommendation.` : `The visible ${timeframe} sample is down ${Math.abs(change).toFixed(2)}%. This is a chart summary, not a trading recommendation.`;
  const watchlist = favorites.map((symbol) => marketInstruments.find((item) => item.symbol === symbol)).filter((item): item is Instrument => Boolean(item));

  return (
    <div className="min-h-screen bg-[#edf3f8] p-3 lg:p-5">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border border-[#dfe7f0] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <button aria-label="Zoom out" title="Zoom out" onClick={zoomOut} className="rounded border bg-white p-2 text-slate-600 hover:bg-slate-100"><ZoomOut size={14} /></button>
                <button aria-label="Zoom in" title="Zoom in" onClick={zoomIn} className="rounded border bg-white p-2 text-slate-600 hover:bg-slate-100"><ZoomIn size={14} /></button>
                <div className="relative">
                  <button type="button" onClick={() => setShowSymbolSearch((open) => !open)} className="flex items-center gap-2 rounded border bg-white px-3 py-2 text-xs font-semibold text-slate-700">{selectedSymbol}<ChevronDown size={13} /></button>
                  {showSymbolSearch && <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"><label className="relative block"><Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus value={symbolQuery} onChange={(event) => setSymbolQuery(event.target.value)} placeholder="Search symbols" className="w-full rounded border px-7 py-2 text-xs outline-none focus:border-blue-400" /></label><div className="mt-2 max-h-56 overflow-y-auto">{filteredInstruments.map((item) => <button key={item.symbol} onClick={() => selectInstrument(item.symbol)} className="flex w-full justify-between rounded px-2 py-2 text-left text-xs hover:bg-blue-50"><span>{item.symbol} <span className="text-slate-400">{item.label}</span></span><span>{formatPrice(marketPrices[item.symbol] ?? item.price, item.symbol)}</span></button>)}</div></div>}
                </div>
                <button type="button" onClick={() => setShowSymbolSearch(true)} aria-label="Add symbol" title="Choose instrument" className="rounded-full border bg-white p-1.5 text-slate-600 hover:bg-slate-100"><Plus size={14} /></button>
              </div>
              <div className="flex items-center gap-1">{(Object.keys(timeframeMs) as Timeframe[]).map((value) => <button key={value} onClick={() => setTimeframe(value)} className={`rounded px-2.5 py-1.5 text-xs font-semibold ${timeframe === value ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-white'}`}>{value}</button>)}</div>
              <div className="flex items-center gap-1">
                <button type="button" title="Toggle grid" aria-label="Toggle grid" onClick={() => setShowGrid((value) => !value)} className={`rounded border p-2 ${showGrid ? 'bg-white text-slate-600' : 'bg-slate-200 text-slate-400'}`}><SlidersHorizontal size={14} /></button>
                <button type="button" title="Candlesticks" aria-label="Candlestick chart" onClick={() => setChartMode('Candles')} className={`rounded border p-2 ${chartMode === 'Candles' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-600'}`}><CandlestickChart size={14} /></button>
                <button type="button" title="Line chart" aria-label="Line chart" onClick={() => setChartMode('Line')} className={`rounded border p-2 ${chartMode === 'Line' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-600'}`}><LineChart size={14} /></button>
                <button type="button" title="Chart settings" aria-label="Chart settings" onClick={() => setShowSettings((value) => !value)} className={`rounded border p-2 ${showSettings ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-600'}`}><Settings size={14} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMovingAverage((value) => !value)} className={`flex items-center gap-1 rounded border px-2 py-1 ${showMovingAverage ? 'border-amber-300 bg-amber-50 text-amber-700' : 'bg-white'}`}><Activity size={12} />{showMovingAverage ? 'MA on' : 'Indicators'}</button>
                <button onClick={() => setDrawMode((value) => !value)} className={`flex items-center gap-1 rounded border px-2 py-1 ${drawMode ? 'border-blue-300 bg-blue-50 text-blue-700' : 'bg-white'}`}><Crosshair size={12} />{drawMode ? 'Draw: click & drag' : 'Trend line'}</button>
                <button onClick={() => { setDrawings([]); setPendingDrawing(null); }} disabled={!drawings.length} className="rounded border bg-white px-2 py-1 disabled:opacity-40">Clear drawings</button>
              </div>
              <button onClick={() => setShowAnalysis((value) => !value)} className={`flex items-center gap-1 rounded border px-2 py-1 ${showAnalysis ? 'border-blue-300 bg-blue-50 text-blue-700' : 'bg-white'}`}><TrendingUp size={12} />{showAnalysis ? 'Hide analysis' : 'Analyse chart'}</button>
            </div>

            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div><div className="text-[10px] uppercase tracking-widest text-slate-500">{instrument.label} · {timeframe}</div><div className="text-lg font-bold text-slate-800">{selectedSymbol} <span className="text-sm font-medium text-slate-500">{formatPrice(currentPrice, selectedSymbol)}</span></div></div>
              <div className="flex flex-wrap justify-end gap-x-3 text-[10px] text-slate-500"><span>O {formatPrice(activeCandle?.open ?? currentPrice, selectedSymbol)}</span><span>H {formatPrice(activeCandle?.high ?? currentPrice, selectedSymbol)}</span><span>L {formatPrice(activeCandle?.low ?? currentPrice, selectedSymbol)}</span><span>C {formatPrice(activeCandle?.close ?? currentPrice, selectedSymbol)}</span><span className={change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span><span>{chartSource}</span></div>
            </div>

            {showAnalysis && <div className="mx-3 mb-2 rounded border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">{analysisText}</div>}
            {showSettings && <div className="mx-3 mb-2 flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs"><strong>Chart settings</strong><label className="flex items-center gap-2"><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />Show grid</label><label className="flex items-center gap-2"><input type="checkbox" checked={showMovingAverage} onChange={(event) => setShowMovingAverage(event.target.checked)} />Moving average</label><button onClick={resetChart} className="rounded border bg-white px-2 py-1">Reset view</button></div>}

            <div ref={chartRef} className={`relative h-[470px] touch-none overflow-hidden bg-white ${drawMode ? 'cursor-crosshair' : isDraggingChart ? 'cursor-grabbing' : 'cursor-grab'}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              <svg viewBox={`0 0 ${chartWidth} ${svgHeight}`} className="h-full w-full">
                {showGrid && Array.from({ length: 6 }, (_, index) => { const gy = plot.top + index / 5 * (svgHeight - plot.top - plot.bottom); return <line key={`h${index}`} x1={plot.left} x2={chartWidth - plot.right} y1={gy} y2={gy} stroke="#e8eef5" strokeDasharray="3 6" />; })}
                {showGrid && Array.from({ length: Math.max(visible.length, 1) }, (_, index) => { const gx = x(index) - step / 2; return <line key={`v${index}`} x1={gx} x2={gx} y1={plot.top} y2={svgHeight - plot.bottom} stroke={index % 8 === 0 ? '#edf2f7' : '#f7f9fc'} />; })}
                {chartMode === 'Candles' ? visible.map((point, index) => { const up = point.close >= point.open; const top = y(Math.max(point.open, point.close)); const bottom = y(Math.min(point.open, point.close)); const color = up ? '#16a34a' : '#ef4444'; return <g key={`${point.time}-${index}`}><line x1={x(index)} x2={x(index)} y1={y(point.high)} y2={y(point.low)} stroke={color} strokeWidth={1.2} /><rect x={x(index) - candleWidth / 2} y={top} width={candleWidth} height={Math.max(2, bottom - top)} rx={1} fill={color} /></g>; }) : <path d={visible.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.close)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth={2} />}
                {showMovingAverage && visible.length > 0 && <path d={sma.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth={1.7} strokeDasharray="5 3" />}
                {activeCandle && hoveredChartIndex != null && visible[hoveredChartIndex] && <g><line x1={x(hoveredChartIndex)} x2={x(hoveredChartIndex)} y1={plot.top} y2={svgHeight - plot.bottom} stroke="#60a5fa" strokeDasharray="5 5" /><line x1={plot.left} x2={chartWidth - plot.right} y1={y(activeCandle.close)} y2={y(activeCandle.close)} stroke="#60a5fa" strokeDasharray="5 5" /></g>}
                {[...drawings, ...(pendingDrawing ? [pendingDrawing] : [])].map((line, index) => <line key={`drawing-${index}`} x1={line.x1 * chartWidth} y1={line.y1 * svgHeight} x2={line.x2 * chartWidth} y2={line.y2 * svgHeight} stroke="#7c3aed" strokeWidth={2} />)}
              </svg>
              <div className="pointer-events-none absolute left-3 top-2 rounded border border-blue-200 bg-slate-900/80 px-2 py-1 text-[10px] text-blue-100">{activeCandle ? `${formatTime(activeCandle.time, timeframe)} · ${formatPrice(activeCandle.close, selectedSymbol)}` : `Collecting ${timeframe} samples…`}</div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded border border-slate-200 bg-white/95 p-1 shadow-sm">
                <button aria-label="Zoom in" title="Zoom in" onClick={zoomIn} className="rounded p-1 text-slate-600 hover:bg-slate-100"><ZoomIn size={14} /></button><button aria-label="Zoom out" title="Zoom out" onClick={zoomOut} className="rounded p-1 text-slate-600 hover:bg-slate-100"><ZoomOut size={14} /></button><button aria-label="Reset chart view" title="Reset view" onClick={resetChart} className="rounded p-1 text-slate-600 hover:bg-slate-100"><MoveHorizontal size={14} /></button>
              </div>
              <div className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500">Drag to pan · scroll to zoom</div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500"><div>{visible.length ? formatTime(visible[0].time, timeframe) : 'Waiting'} <span className="mx-2">—</span> {visible.length ? formatTime(visible[visible.length - 1].time, timeframe) : 'Now'}</div><div className="flex items-center gap-3"><button onClick={() => { setChartPan(0); setChartZoom(1); }}>All</button><button onClick={() => { setChartPan(0); }}>Latest</button><span>{visible.length} candles</span></div></div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-bold text-slate-800">Watchlist</div><div className="text-[10px] text-slate-400">Tap a market to view its chart</div></div><Star size={16} className="text-amber-500" /></div>
              <label className="relative mb-3 block"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={symbolQuery} onFocus={() => setShowSymbolSearch(true)} onChange={(event) => { setSymbolQuery(event.target.value); setShowSymbolSearch(true); }} placeholder="Search symbols to add" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400" /></label>
              <div className="max-h-[310px] divide-y divide-slate-100 overflow-y-auto">{watchlist.length ? watchlist.map((item) => { const price = marketPrices[item.symbol] ?? item.price; return <div key={item.symbol} className={`flex items-center justify-between py-2.5 ${selectedSymbol === item.symbol ? 'text-blue-700' : ''}`}><button onClick={() => selectInstrument(item.symbol)} className="min-w-0 text-left"><div className="text-xs font-semibold text-slate-800">{item.symbol}</div><div className="truncate text-[10px] text-slate-400">{item.label}</div></button><div className="flex items-center gap-2"><span className="text-right text-xs font-semibold text-slate-800">{formatPrice(price, item.symbol)}</span><button aria-label={`Remove ${item.symbol} from watchlist`} title="Remove from watchlist" onClick={() => toggleFavorite(item.symbol)} className="p-1 text-amber-500"><Star size={13} fill="currentColor" /></button></div></div>; }) : <div className="py-6 text-center text-xs text-slate-400">Search and add markets to your watchlist.</div>}</div>
              {showSymbolSearch && symbolQuery && <div className="mt-2 max-h-36 overflow-auto rounded border bg-slate-50 p-1">{filteredInstruments.slice(0, 8).map((item) => <button key={item.symbol} onClick={() => { toggleFavorite(item.symbol); selectInstrument(item.symbol); }} className="flex w-full justify-between px-2 py-1.5 text-left text-[11px] hover:bg-blue-50"><span>{item.symbol} · {item.label}</span><Plus size={12} /></button>)}</div>}
            </div>

            <div className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">Order ticket</div><div className="text-base font-bold text-slate-800">{selectedSymbol}</div></div><div className="text-right"><div className="text-[10px] text-slate-500">Price</div><strong className="text-sm">{formatPrice(currentPrice, selectedSymbol)}</strong></div></div>
              <div className="mb-3 grid grid-cols-2 gap-2">{(['Buy', 'Sell'] as const).map((side) => <button key={side} onClick={() => setSelectedSide(side)} className={`rounded-lg py-2 text-sm font-bold text-white ${selectedSide === side ? (side === 'Buy' ? 'bg-green-600' : 'bg-red-600') : 'bg-slate-400'}`}>{side}</button>)}</div>
              <div className="mb-3 grid grid-cols-2 gap-1">{orderOptions.map((option) => <button key={option} onClick={() => { setOrderType(option); if (option !== 'market' && !triggerPrice) setTriggerPrice(currentPrice); }} className={`rounded px-1 py-1.5 text-[10px] ${orderType === option ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{orderLabel(option)}</button>)}</div>
              <div className="space-y-2 text-xs"><div className="flex justify-between rounded bg-slate-50 p-2.5"><span className="text-slate-500">Current price</span><b>{formatPrice(currentPrice, selectedSymbol)}</b></div>{orderType !== 'market' && <label className="flex items-center justify-between rounded bg-slate-50 p-2.5"><span className="text-slate-500">Trigger price</span><input aria-label="Trigger price" type="number" value={triggerPrice || ''} onChange={(event) => setTriggerPrice(Number(event.target.value) || 0)} className="w-24 bg-transparent text-right outline-none" /></label>}<label className="flex items-center justify-between rounded bg-slate-50 p-2.5"><span className="text-slate-500">Quantity</span><input aria-label="Quantity" type="number" min="0.01" step="0.01" value={tradeAmount} onChange={(event) => setTradeAmount(Number(event.target.value) || 0.01)} className="w-20 bg-transparent text-right outline-none" /></label><div className="flex justify-between rounded bg-slate-50 p-2.5"><span className="text-slate-500">Estimated</span><b>{formatCurrency(executionPrice * tradeAmount)}</b></div></div>
              {errorText && <p role="alert" className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">{errorText}</p>}
              <button onClick={placeTrade} disabled={isSubmitting} className={`mt-3 w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60 ${selectedSide === 'Buy' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>{isSubmitting ? 'Submitting…' : `${selectedSide} ${selectedSymbol}`}</button>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span><Wallet size={11} className="mr-1 inline" />Balance</span><b>{formatCurrency(availableBalance)}</b></div>
            </div>
          </aside>
        </section>

        <section className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{(['Open', 'Closed'] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{tab}</button>)}</div><label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search trades" className="rounded-lg border py-2 pl-9 pr-3 text-xs outline-none" /></label></div>
          <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full text-left text-xs text-slate-700"><thead className="bg-slate-50 uppercase text-slate-500"><tr>{['Symbol', 'Side', 'Qty', 'Entry', 'Order', 'Opened', 'Value', 'P&L', 'Action'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody>{visibleTrades.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No {activeTab.toLowerCase()} trades found.</td></tr> : visibleTrades.map((trade) => { const price = marketPrices[trade.trading_pair] ?? trade.entry_price; const profit = trade.status === 'active' ? getPnl(trade, price) : trade.profit_loss; return <tr key={trade.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{trade.trading_pair}</td><td className={`px-3 py-3 ${trade.trade_type === 'buy' ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.trade_type}</td><td className="px-3 py-3">{trade.amount}</td><td className="px-3 py-3">{formatPrice(trade.entry_price, trade.trading_pair)}</td><td className="px-3 py-3">{orderLabel(trade.order_type ?? 'market')}</td><td className="px-3 py-3">{new Date(trade.opened_at).toLocaleString()}</td><td className="px-3 py-3">{formatCurrency(price * trade.amount)}</td><td className={`px-3 py-3 font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(profit)}</td><td className="px-3 py-3">{trade.status === 'active' ? <button onClick={() => void closeTrade(trade)} disabled={isClosingTradeId === trade.id} className="rounded bg-slate-900 px-2.5 py-1.5 text-white disabled:opacity-50">{isClosingTradeId === trade.id ? 'Closing…' : 'Close'}</button> : <span className="text-slate-400">Closed</span>}</td></tr>; })}</tbody></table></div>
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500"><span>Equity: <b className="text-slate-700">{formatCurrency(availableBalance + positionValue)}</b></span><span>Open P&amp;L: <b className={pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(pnl)}</b></span><span>Chart prices use the configured live feed where available.</span></div>
        </section>
      </div>
    </div>
  );
};

export default TradePage;
