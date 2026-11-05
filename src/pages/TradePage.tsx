import { useEffect, useMemo, useState } from 'react';
import { Activity, CandlestickChart, Search, TrendingUp } from 'lucide-react';
import { fetchLivePrices, type LivePriceMap } from '../lib/livePrices';
import { fetchMarketCandles } from '../lib/marketData';

type Category = 'Crypto' | 'Metals' | 'Stocks' | 'Forex' | 'Indices' | 'Bonds';
type Candle = { time: number; open: number; high: number; low: number; close: number };
type Instrument = { symbol: string; label: string; category: Category };

const categories: Category[] = ['Crypto', 'Metals', 'Stocks', 'Forex', 'Indices', 'Bonds'];
const instruments: Instrument[] = [
  { symbol: 'BTC/USD', label: 'Bitcoin', category: 'Crypto' }, { symbol: 'ETH/USD', label: 'Ethereum', category: 'Crypto' },
  { symbol: 'SOL/USD', label: 'Solana', category: 'Crypto' }, { symbol: 'BNB/USD', label: 'BNB', category: 'Crypto' },
  { symbol: 'XRP/USD', label: 'XRP', category: 'Crypto' }, { symbol: 'ADA/USD', label: 'Cardano', category: 'Crypto' },
  { symbol: 'DOGE/USD', label: 'Dogecoin', category: 'Crypto' }, { symbol: 'LINK/USD', label: 'Chainlink', category: 'Crypto' },
  { symbol: 'XAU/USD', label: 'Gold', category: 'Metals' }, { symbol: 'XAG/USD', label: 'Silver', category: 'Metals' },
  { symbol: 'AAPL', label: 'Apple', category: 'Stocks' }, { symbol: 'MSFT', label: 'Microsoft', category: 'Stocks' },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'Stocks' }, { symbol: 'TSLA', label: 'Tesla', category: 'Stocks' },
  { symbol: 'AMZN', label: 'Amazon', category: 'Stocks' }, { symbol: 'GOOGL', label: 'Alphabet', category: 'Stocks' },
  { symbol: 'EUR/USD', label: 'Euro / US Dollar', category: 'Forex' }, { symbol: 'GBP/USD', label: 'Pound / US Dollar', category: 'Forex' },
  { symbol: 'USD/JPY', label: 'US Dollar / Yen', category: 'Forex' }, { symbol: 'AUD/USD', label: 'Australian Dollar', category: 'Forex' },
  { symbol: 'NASDAQ', label: 'NASDAQ 100', category: 'Indices' }, { symbol: 'SPX', label: 'S&P 500', category: 'Indices' },
  { symbol: 'DAX', label: 'DAX', category: 'Indices' }, { symbol: 'FTSE', label: 'FTSE 100', category: 'Indices' },
  { symbol: 'US10Y', label: 'US 10Y Bond', category: 'Bonds' }, { symbol: 'US30Y', label: 'US 30Y Bond', category: 'Bonds' },
  { symbol: 'DE10Y', label: 'Germany 10Y Bond', category: 'Bonds' }, { symbol: 'UK10Y', label: 'UK 10Y Bond', category: 'Bonds' },
];
const intervals = [{ label: '5m', api: '5min' }, { label: '15m', api: '15min' }, { label: '1h', api: '1h' }, { label: '1D', api: '1day' }];
const fmt = (value: number, symbol: string) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: symbol.includes('/') && !symbol.includes('USD') ? 4 : value < 1 ? 4 : 2,
  maximumFractionDigits: symbol.includes('/') && !symbol.includes('USD') ? 4 : value < 1 ? 6 : 2,
}).format(value);

/** Main trading chart. The order ticket and stock sections are mounted by the parent layout. */
export const TradePage = () => {
  const [category, setCategory] = useState<Category>('Crypto');
  const [symbol, setSymbol] = useState('BTC/USD');
  const [timeframe, setTimeframe] = useState('5m');
  const [prices, setPrices] = useState<LivePriceMap>({});
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const markets = useMemo(() => instruments.filter((item) => item.category === category && `${item.symbol} ${item.label}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const instrument = instruments.find((item) => item.symbol === symbol) ?? instruments[0];
  const currentPrice = prices[symbol]?.price ?? candles[candles.length - 1]?.close;
  const selectedInterval = intervals.find((item) => item.label === timeframe) ?? intervals[0];

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const next = await fetchLivePrices();
      if (!cancelled) setPrices(next);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCandles([]);
    setError('');
    const load = async () => {
      try {
        const result = await fetchMarketCandles(symbol, selectedInterval.api, 100);
        if (cancelled) return;
        setCandles(result.candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
        if (!result.candles.length) setError(`No chart history is currently available for ${symbol}.`);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load market chart data.');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [symbol, selectedInterval.api]);

  const points = candles.slice(-50);
  const low = points.length ? Math.min(...points.map((candle) => candle.low)) : (currentPrice ?? 100) * 0.99;
  const high = points.length ? Math.max(...points.map((candle) => candle.high)) : (currentPrice ?? 100) * 1.01;
  const range = Math.max(high - low, Math.abs(high) * 0.001, 0.000001);
  const y = (price: number) => 16 + ((high - price) / range) * 320;

  const chooseCategory = (next: Category) => {
    setCategory(next);
    const first = instruments.find((item) => item.category === next);
    if (first) setSymbol(first.symbol);
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] p-3 lg:p-5">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <nav className="flex flex-wrap gap-2" aria-label="Market categories">
          {categories.map((item) => <button key={item} type="button" onClick={() => chooseCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{item}</button>)}
        </nav>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2"><CandlestickChart size={18} className="text-blue-600" /><div><h1 className="text-sm font-bold text-slate-900">{instrument.label} <span className="font-medium text-slate-500">· {symbol}</span></h1><p className="text-xs text-slate-500">{category} market</p></div></div>
              <div className="text-right"><p className="text-lg font-bold tabular-nums text-slate-900">{currentPrice ? fmt(currentPrice, symbol) : '—'}</p><p className="text-[11px] text-slate-500"><Activity size={12} className="mr-1 inline"/>Live quote</p></div>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <div className="flex gap-1" aria-label="Chart timeframe">{intervals.map((item) => <button key={item.label} type="button" onClick={() => setTimeframe(item.label)} className={`rounded px-3 py-1.5 text-xs font-semibold ${timeframe === item.label ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{item.label}</button>)}</div>
              <span className="text-xs text-slate-400">OHLC chart</span>
            </div>
            <div className="relative h-[380px] w-full p-3 sm:h-[480px]">
              {points.length ? <svg viewBox="0 0 1000 360" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`${symbol} candlestick chart`}>
                {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="0" x2="1000" y1={16 + line * 80} y2={16 + line * 80} stroke="#e8edf3" strokeDasharray="4 5" />)}
                {points.map((candle, index) => {
                  const x = 10 + index * (980 / points.length) + (490 / points.length);
                  const candleWidth = Math.max(3, Math.min(14, 700 / points.length));
                  const up = candle.close >= candle.open;
                  const color = up ? '#10a37f' : '#e55353';
                  return <g key={`${candle.time}-${index}`}><line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="2"/><rect x={x - candleWidth / 2} y={Math.min(y(candle.open), y(candle.close))} width={candleWidth} height={Math.max(2, Math.abs(y(candle.open) - y(candle.close)))} fill={color} rx="1"/></g>;
                })}
              </svg> : <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500"><TrendingUp size={24} className="text-blue-500"/><span>{error || 'Loading market chart…'}</span></div>}
              {points.length > 0 && error && <p className="absolute bottom-3 left-4 rounded bg-white/90 px-2 py-1 text-xs text-slate-500">{error}</p>}
            </div>
            <div className="flex justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500"><span>{points.length ? `${points.length} candles · ${timeframe}` : 'Waiting for chart data'}</span><span>{prices[symbol] ? 'Live feed connected' : 'Waiting for live quote'}</span></div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label={`${category} markets`}>
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">{category} markets</h2><p className="text-xs text-slate-500">Select an instrument</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{markets.length}</span></div>
            <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-2.5"><Search size={14} className="shrink-0 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets" className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"/></label>
            <div className="max-h-[390px] space-y-1 overflow-y-auto">{markets.map((item) => <button key={item.symbol} type="button" onClick={() => setSymbol(item.symbol)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${symbol === item.symbol ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}><span><span className="block text-xs font-semibold text-slate-800">{item.symbol}</span><span className="block text-[10px] text-slate-500">{item.label}</span></span><span className="text-xs font-medium tabular-nums text-slate-700">{prices[item.symbol] ? fmt(prices[item.symbol].price, item.symbol) : '—'}</span></button>)}</div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default TradePage;
