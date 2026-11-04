import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  CandlestickChart,
  ChevronDown,
  Crosshair,
  MoveHorizontal,
  MousePointer2,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  TrendingUp,
  ZoomIn,
  ZoomOut,
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
type PricePoint = {
  price: number;
  time: string;
  source: 'live' | 'simulated';
  open?: number;
  high?: number;
  low?: number;
  close?: number;
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
  { symbol: 'MSFT', label: 'Microsoft', category: 'Stock', description: 'AI software', price: 436.19 },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'Stock', description: 'AI chip leader', price: 131.41 },
  { symbol: 'TSLA', label: 'Tesla', category: 'Stock', description: 'EV maker', price: 246.8 },
  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bond', description: 'Government bond', price: 4.21 },
  { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bond', description: 'Long bond', price: 4.63 },
  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Index', description: 'Tech index', price: 19742.3 },
  { symbol: 'SPX', label: 'S&P 500', category: 'Index', description: 'US broad index', price: 5562.1 },
  { symbol: 'DAX', label: 'DAX', category: 'Index', description: 'German index', price: 19124.3 },
  { symbol: 'FTSE', label: 'FTSE 100', category: 'Index', description: 'UK index', price: 19124.3 },
  { symbol: 'VIX', label: 'VIX', category: 'Index', description: 'Volatility index', price: 17.8 },
];

const orderOptions: OrderType[] = ['market', 'limit', 'take_profit', 'stop_loss'];
const timeframes = ['5m', '15m', '1h', '1D', '1W', '1M'];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
  maximumFractionDigits: Math.abs(value) < 100 ? 4 : 2,
}).format(value);
const formatPrice = (value: number, symbol: string) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2,
  maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD'].includes(symbol) ? 4 : 2,
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
const makeCandle = (open: number, close: number, time: string, source: 'live' | 'simulated'): PricePoint => {
  const wick = Math.max(Math.abs(close - open) * 2.2, Math.abs(close) * 0.00015);
  return { price: close, time, source, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick };
};

export const TradePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Open' | 'Closed'>('Open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('FTSE');
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
  const [chartZoom, setChartZoom] = useState(1.4);
  const [chartPan, setChartPan] = useState(0);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [isDraggingChart, setIsDraggingChart] = useState(false);
  const [chartWidth, setChartWidth] = useState(980);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const dragOriginX = useRef(0);
  const dragOriginPan = useRef(0);

  const currentInstrument = marketInstruments.find((item) => item.symbol === selectedSymbol) ?? marketInstruments[0];
  const currentPrice = marketPrices[selectedSymbol] ?? currentInstrument.price;

  useEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const updateSize = () => setChartWidth(Math.max(320, Math.round(el.clientWidth)));
    updateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadProfileBalance = async () => {
    if (!user) { setAvailableBalance(0); return; }
    const { data, error } = await supabase.from('user_profiles').select('available_balance').eq('id', user.id).maybeSingle();
    if (error) { console.error('Error fetching user balance:', error.message); return; }
    setAvailableBalance(Number(data?.available_balance ?? 0));
  };

  const loadTrades = async () => {
    if (!user) { setTrades([]); return; }
    const { data, error } = await supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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
            const last = previous[instrument.symbol] ?? instrument.price;
            const volatility = instrument.category === 'Crypto' ? 0.006 : instrument.category === 'Index' ? 0.002 : 0.003;
            next[instrument.symbol] = Number(Math.max(last * (1 + (Math.random() - 0.5) * volatility), 0.0001).toFixed(4));
          }
        }
        const latestPrice = next[selectedSymbol] ?? currentInstrument.price;
        setPriceHistory((history) => {
          const last = history[history.length - 1];
          const point = makeCandle(last?.close ?? latestPrice, latestPrice,
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            live[selectedSymbol]?.price ? 'live' : 'simulated');
          return [...history, point].slice(-320);
        });
        return next;
      });
    };
    setPriceHistory((history) => {
      if (history.length) return history;
      const price = marketPrices[selectedSymbol] ?? currentInstrument.price;
      return [makeCandle(price * 0.999, price, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'simulated')];
    });
    void refreshPrices();
    const timer = window.setInterval(() => void refreshPrices(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selectedSymbol]);

  const visibleChartCount = Math.max(12, Math.round(80 / chartZoom));
  const maxChartPan = Math.max(0, priceHistory.length - visibleChartCount);
  const safeChartPan = clamp(chartPan, 0, maxChartPan);
  const visibleChartData = priceHistory.slice(safeChartPan, safeChartPan + visibleChartCount);
  useEffect(() => { setChartPan(0); }, [selectedSymbol]);

  const chartMinPrice = Math.min(...visibleChartData.map((point) => point.low ?? point.price));
  const chartMaxPrice = Math.max(...visibleChartData.map((point) => point.high ?? point.price));
  const chartRange = Math.max(chartMaxPrice - chartMinPrice, Math.abs(currentPrice) * 0.001, 0.0001);
  const chartPadding = { top: 16, right: 18, bottom: 20, left: 18 };
  const chartHeight = 520;
  const xStep = (chartWidth - chartPadding.left - chartPadding.right) / Math.max(visibleChartData.length, 1);
  const candleWidth = Math.max(4, Math.min(14, xStep * 0.64));
  const yScale = (value: number) => chartPadding.top + ((chartMaxPrice - value) / chartRange) * (chartHeight - chartPadding.top - chartPadding.bottom);

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

  const handleChartWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setChartZoom((zoom) => clamp(zoom + (event.deltaY > 0 ? -0.2 : 0.2), 1, 4));
  };
  const handleChartPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingChart(true);
    dragOriginX.current = event.clientX;
    dragOriginPan.current = safeChartPan;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleChartPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setHoveredChartIndex(Math.min(visibleChartData.length - 1, Math.max(0, Math.floor(ratio * visibleChartData.length))));
    if (isDraggingChart) {
      const deltaBars = Math.round(((event.clientX - dragOriginX.current) / xStep) * 0.9);
      setChartPan(clamp(dragOriginPan.current - deltaBars, 0, maxChartPan));
    }
  };
  const endChartDrag = () => setIsDraggingChart(false);

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
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: nextBalance }).eq('id', user.id);
      if (balanceError) throw balanceError;
      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: user.id, token_pair: selectedSymbol, trading_pair: selectedSymbol,
        trade_type: selectedSide.toLowerCase(), amount: tradeAmount, entry_price: executionPrice,
        execution_price: executionPrice, profit_loss: 0, status: 'active', created_at: new Date().toISOString(),
        opened_at: new Date().toISOString(), order_type: orderType,
        stop_loss_price: orderType === 'stop_loss' ? triggerPrice || executionPrice : null,
        take_profit_price: orderType === 'take_profit' ? triggerPrice || executionPrice : null,
      });
      if (tradeError) {
        await supabase.from('user_profiles').update({ available_balance: availableBalance }).eq('id', user.id);
        throw tradeError;
      }
      setAvailableBalance(nextBalance);
      setSelectedSide('Buy'); setOrderType('market'); setTradeAmount(1); setTriggerPrice(0);
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
    setIsClosingTradeId(tradeId); setErrorText(null);
    try {
      const closePrice = marketPrices[trade.trading_pair] ?? trade.entry_price;
      const pnl = getPnl(trade, closePrice);
      const { data: profile, error: profileError } = await supabase.from('user_profiles').select('available_balance, total_profit').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      const nextBalance = Number(profile?.available_balance ?? 0) + trade.entry_price * trade.amount + pnl;
      const nextProfit = Number(profile?.total_profit ?? 0) + pnl;
      const { data: updatedTrade, error: tradeError } = await supabase.from('trades').update({
        status: 'closed', profit_loss: pnl, exit_price: closePrice, closed_at: new Date().toISOString(),
      }).eq('id', tradeId).eq('user_id', user.id).eq('status', 'active').select('id').maybeSingle();
      if (tradeError) throw tradeError;
      if (!updatedTrade) throw new Error('Trade was already closed. Refresh and try again.');
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: nextBalance, total_profit: nextProfit }).eq('id', user.id);
      if (balanceError) throw balanceError;
      setAvailableBalance(nextBalance); await loadTrades();
    } catch (error) {
      console.error('Could not close trade:', error);
      setErrorText('Could not close trade. Please refresh and try again.');
      await Promise.all([loadTrades(), loadProfileBalance()]);
    } finally { setIsClosingTradeId(null); }
  };

  const chartSource = priceHistory[priceHistory.length - 1]?.source === 'live' ? 'Live API' : 'Simulated fallback';
  const hoveredCandle = hoveredChartIndex == null ? visibleChartData[visibleChartData.length - 1] : visibleChartData[hoveredChartIndex];
  const selectedOpenTrades = openTrades.filter((trade) => trade.trading_pair === selectedSymbol);

  return (
    <div className="min-h-screen bg-[#edf3f8] p-3 lg:p-5">
      <div className="mx-auto max-w-[1540px] space-y-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="overflow-hidden rounded-[18px] border border-[#dfe7f0] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#e5ebf2] bg-[#fbfcfe] px-3 py-2">
              <div className="flex items-center gap-2">
                <button aria-label="Previous chart" className="rounded-md border border-[#dfe7f0] bg-white p-2 text-slate-600"><MoveHorizontal size={14} /></button>
                <div className="flex items-center gap-2 rounded-md border border-[#dfe7f0] bg-white px-2 py-1.5 text-xs font-semibold text-slate-700">{selectedSymbol}<ChevronDown size={12} /></div>
                <button aria-label="Add instrument" className="rounded-full border border-[#dfe7f0] bg-white p-1.5 text-slate-600"><Plus size={14} /></button>
              </div>
              <div className="hidden items-center gap-1 md:flex">{timeframes.map((timeframe) => <button key={timeframe} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${timeframe === '1D' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>{timeframe}</button>)}</div>
              <div className="flex items-center gap-2 text-slate-500">
                <button aria-label="Indicators" className="rounded-md p-2 hover:bg-slate-100"><Activity size={15} /></button>
                <button aria-label="Chart settings" className="rounded-md p-2 hover:bg-slate-100"><Settings size={15} /></button>
                <button className="rounded-md border border-[#1d73f5] px-2.5 py-1.5 text-xs font-semibold text-[#1d73f5]">Analyse chart</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5ebf2] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5ff] text-[#1d73f5]"><TrendingUp size={17} /></div>
                <div><div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{currentInstrument.label}</div><div className="text-lg font-bold text-slate-800">{selectedSymbol} <span className="ml-1 text-sm font-medium text-slate-500">{formatPrice(currentPrice, selectedSymbol)}</span></div></div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span>O: {formatPrice(hoveredCandle?.open ?? currentPrice, selectedSymbol)}</span>
                <span>H: {formatPrice(hoveredCandle?.high ?? currentPrice, selectedSymbol)}</span>
                <span>L: {formatPrice(hoveredCandle?.low ?? currentPrice, selectedSymbol)}</span>
                <span>C: {formatPrice(hoveredCandle?.close ?? currentPrice, selectedSymbol)}</span>
                <span className={`rounded px-1.5 py-0.5 font-semibold ${chartSource === 'Live API' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{chartSource}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2"><button className="rounded border border-[#dfe7f0] px-2 py-1">Indicators</button><button className="rounded border border-[#dfe7f0] px-2 py-1">Compare</button><button className="rounded border border-[#dfe7f0] px-2 py-1">Drawing tools</button></div>
              <div className="hidden items-center gap-2 sm:flex"><span>Zoom</span><button aria-label="Zoom in" onClick={() => setChartZoom((zoom) => clamp(zoom + 0.2, 1, 4))} className="rounded border border-[#dfe7f0] p-1 hover:bg-slate-50"><ZoomIn size={13} /></button><button aria-label="Zoom out" onClick={() => setChartZoom((zoom) => clamp(zoom - 0.2, 1, 4))} className="rounded border border-[#dfe7f0] p-1 hover:bg-slate-50"><ZoomOut size={13} /></button></div>
            </div>

            <div ref={chartAreaRef} className={`relative h-[500px] touch-none overflow-hidden bg-white ${isDraggingChart ? 'cursor-grabbing' : 'cursor-crosshair'}`} onWheel={handleChartWheel} onPointerDown={handleChartPointerDown} onPointerMove={handleChartPointerMove} onPointerUp={endChartDrag} onPointerCancel={endChartDrag}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
                {Array.from({ length: 6 }, (_, index) => {
                  const y = chartPadding.top + (index / 5) * (chartHeight - chartPadding.top - chartPadding.bottom);
                  return <line key={`h-${index}`} x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} stroke="#e9eff6" />;
                })}
                {Array.from({ length: Math.max(visibleChartData.length, 1) }, (_, index) => {
                  const x = chartPadding.left + index * xStep;
                  return <line key={`v-${index}`} x1={x} x2={x} y1={chartPadding.top} y2={chartHeight - chartPadding.bottom} stroke={index % 8 === 0 ? '#edf2f7' : '#f7f9fc'} />;
                })}
                {visibleChartData.map((point, index) => {
                  const x = chartPadding.left + index * xStep + xStep / 2;
                  const open = point.open ?? point.price;
                  const close = point.close ?? point.price;
                  const high = point.high ?? Math.max(open, close);
                  const low = point.low ?? Math.min(open, close);
                  const top = yScale(Math.max(open, close));
                  const bottom = yScale(Math.min(open, close));
                  const up = close >= open;
                  const color = up ? '#16a34a' : '#ef4444';
                  return <g key={`${point.time}-${index}`}><line x1={x} x2={x} y1={yScale(high)} y2={yScale(low)} stroke={color} strokeWidth={1.2} /><rect x={x - candleWidth / 2} y={top} width={candleWidth} height={Math.max(2, bottom - top)} rx={1} fill={up ? '#22c55e' : '#ef4444'} /></g>;
                })}
                {hoveredCandle && (() => {
                  const index = visibleChartData.indexOf(hoveredCandle);
                  const x = chartPadding.left + index * xStep + xStep / 2;
                  const y = yScale(hoveredCandle.close ?? hoveredCandle.price);
                  return <g><line x1={x} x2={x} y1={chartPadding.top} y2={chartHeight - chartPadding.bottom} stroke="#93c5fd" strokeDasharray="5 5" /><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} stroke="#93c5fd" strokeDasharray="5 5" /></g>;
                })()}
              </svg>
              <div className="pointer-events-none absolute left-3 top-2 rounded border border-blue-500/30 bg-slate-900/80 px-2 py-1 text-[10px] text-blue-100">{hoveredCandle ? `${hoveredCandle.time} · ${formatPrice(hoveredCandle.close ?? hoveredCandle.price, selectedSymbol)}` : 'Waiting for price data'}</div>
              <div className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-400">Drag to pan · Scroll to zoom</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">{formatPrice(currentPrice, selectedSymbol)}</div>
            </div>

            <div className="flex items-center justify-between border-t border-[#e5ebf2] bg-[#fbfcfe] px-4 py-2 text-[11px] text-slate-500"><div className="flex gap-4"><span>1D</span><span>1W</span><span>1M</span><span>3M</span><span>6M</span><span>YTD</span><span>1Y</span></div><span>Current time · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex items-center justify-between"><div className="text-sm font-bold text-slate-800">Watchlist</div><button className="rounded-full p-1 text-slate-400"><Star size={16} /></button></div>
              <div className="mb-4 rounded-lg border border-[#dfe7f0] px-3 py-2 text-xs text-slate-400"><div className="flex items-center gap-2"><Search size={14} />Search symbols to add</div></div>
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><span>Popular instruments</span><span>tap to chart</span></div>
              <div className="divide-y divide-slate-100">
                {[
                  ['NSE 30', '9,398.93', '+0.13%'], ['NSE All Share', '254,662.18', '+0.15%'],
                  ['US 30', '52,545.30', '+1.47%'], ['Brent Oil', '102.21', '-1.34%'],
                  ['Crude Oil WTI', '95.10', '-1.03%'], ['Gold', '4,046.00', '+2.89%'],
                ].map(([name, value, change]) => <button key={name} type="button" className="flex w-full items-center justify-between py-3 text-left"><div><div className="text-xs font-semibold text-slate-800">{name}</div><div className="text-[10px] text-slate-400">{name.split(' ')[0]}</div></div><div className="text-right"><div className="text-xs font-semibold text-slate-800">{value}</div><div className={`text-[10px] ${change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{change}</div></div></button>)}
              </div>
              <button className="mt-3 w-full rounded-lg bg-orange-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-orange-600">+ Sign up to save favourites</button>
            </div>

            <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Order ticket</div><div className="text-lg font-bold text-slate-800">{selectedSymbol}</div></div><div className="text-right"><div className="text-[10px] text-slate-500">Price</div><div className="font-bold text-slate-800">{formatPrice(currentPrice, selectedSymbol)}</div></div></div>
              <div className="mb-3 grid grid-cols-2 gap-2">{(['Buy', 'Sell'] as const).map((side) => <button key={side} type="button" onClick={() => setSelectedSide(side)} className={`rounded-lg py-2 text-sm font-bold text-white ${selectedSide === side ? (side === 'Buy' ? 'bg-green-600' : 'bg-red-600') : 'bg-slate-400'}`}>{side}</button>)}</div>
              <div className="mb-3 grid grid-cols-2 gap-1.5">{orderOptions.map((option) => <button key={option} type="button" onClick={() => { setOrderType(option); if (option !== 'market' && !triggerPrice) setTriggerPrice(currentPrice); }} className={`rounded px-2 py-1.5 text-[10px] font-semibold ${orderType === option ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{orderLabel(option)}</button>)}</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="text-slate-500">Live price</span><b>{formatPrice(currentPrice, selectedSymbol)}</b></div>
                {orderType !== 'market' && <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="text-slate-500">{orderLabel(orderType)} price</span><input aria-label="Trigger price" type="number" value={triggerPrice || ''} onChange={(event) => setTriggerPrice(Number(event.target.value) || 0)} className="w-24 bg-transparent text-right outline-none" /></label>}
                <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="text-slate-500">Quantity</span><input aria-label="Trade quantity" type="number" min="0.01" step="0.01" value={tradeAmount} onChange={(event) => setTradeAmount(Number(event.target.value) || 0.01)} className="w-20 bg-transparent text-right outline-none" /></label>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="text-slate-500">Estimated</span><b>{formatCurrency(getExecutionPrice() * tradeAmount)}</b></div>
              </div>
              {errorText && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">{errorText}</p>}
              <button type="button" onClick={handlePlaceTrade} disabled={isSubmitting} className={`mt-3 w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60 ${selectedSide === 'Buy' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>{isSubmitting ? 'Submitting…' : `${selectedSide} ${selectedSymbol}`}</button>
            </div>
          </aside>
        </div>

        <section className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{(['Open', 'Closed'] as const).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{tab}</button>)}</div><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search instrument or trade" className="w-64 rounded-xl border border-[#dfe7f0] bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none" /></div></div>
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">{filteredInstruments.map((instrument) => { const price = marketPrices[instrument.symbol] ?? instrument.price; const isUp = price >= instrument.price; return <button key={instrument.symbol} type="button" onClick={() => setSelectedSymbol(instrument.symbol)} className={`flex items-center justify-between rounded-xl border p-3 text-left ${selectedSymbol === instrument.symbol ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}><div><div className="font-bold text-slate-800">{instrument.symbol}</div><div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{instrument.category}</div></div><div className={`text-sm font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>{formatPrice(price, instrument.symbol)}</div></button>; })}</div>
          <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm text-slate-700"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Symbol', 'Side', 'Qty', 'Entry', 'Order', 'Opened', 'Value', 'PnL', 'Action'].map((label) => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{visibleTrades.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No {activeTab.toLowerCase()} trades found.</td></tr> : visibleTrades.map((trade) => { const price = marketPrices[trade.trading_pair] ?? trade.entry_price; const pnl = trade.status === 'active' ? getPnl(trade, price) : trade.profit_loss; return <tr key={trade.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{trade.trading_pair}</td><td className={`px-3 py-3 font-semibold ${trade.trade_type === 'buy' ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.trade_type}</td><td className="px-3 py-3">{trade.amount}</td><td className="px-3 py-3">{formatCurrency(trade.entry_price)}</td><td className="px-3 py-3">{orderLabel(trade.order_type ?? 'market')}</td><td className="px-3 py-3">{formatDate(trade.opened_at)}</td><td className="px-3 py-3">{formatCurrency(price * trade.amount)}</td><td className={`px-3 py-3 font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(pnl)}</td><td className="px-3 py-3">{trade.status === 'active' ? <button type="button" onClick={() => handleCloseTrade(trade.id)} disabled={isClosingTradeId === trade.id} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{isClosingTradeId === trade.id ? 'Closing…' : 'Close'}</button> : <span className="text-xs font-semibold uppercase text-slate-400">Closed</span>}</td></tr>; })}</tbody></table></div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span>Equity: <b className="text-slate-700">{formatCurrency(accountEquity)}</b></span><span>Available cash: <b className="text-slate-700">{formatCurrency(availableBalance)}</b></span><span>Open P&amp;L: <b className={unrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(unrealizedPnl)}</b></span><span>· Available cash excludes funds reserved for open positions.</span></div>
        </section>
      </div>
    </div>
  );
};

export default TradePage;
