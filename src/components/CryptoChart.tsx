import { useEffect, useState } from 'react';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

type MarketPair =
  | 'BTC/USD'
  | 'ETH/USD'
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'AUD/USD'
  | 'XAU/USD';

type Timeframe = '7D' | '30D' | '90D';
type TradingTool = 'Crosshair' | 'Trend' | 'Indicators' | 'Measure';

const MARKET_PAIRS: Array<{
  key: MarketPair;
  type: 'crypto' | 'fx';
  id?: string;
  from?: string;
  to?: string;
  quote?: string;
}> = [
  { key: 'BTC/USD', type: 'crypto', id: 'bitcoin', quote: 'usd' },
  { key: 'ETH/USD', type: 'crypto', id: 'ethereum', quote: 'usd' },
  { key: 'EUR/USD', type: 'fx', from: 'EUR', to: 'USD' },
  { key: 'GBP/USD', type: 'fx', from: 'GBP', to: 'USD' },
  { key: 'USD/JPY', type: 'fx', from: 'USD', to: 'JPY' },
  { key: 'AUD/USD', type: 'fx', from: 'AUD', to: 'USD' },
  { key: 'XAU/USD', type: 'crypto', id: 'gold', quote: 'usd' },
];

const RANGE_OPTIONS: Timeframe[] = ['7D', '30D', '90D'];
const TOOL_OPTIONS: TradingTool[] = ['Crosshair', 'Trend', 'Indicators', 'Measure'];
const REFRESH_MS = 60_000;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatPrice = (value: number, pair: MarketPair) => {
  if (pair === 'USD/JPY' || pair === 'XAU/USD') {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
  }
  if (pair === 'EUR/USD' || pair === 'GBP/USD' || pair === 'AUD/USD') {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

const buildFallbackData = (pair: MarketPair, days: number): CandleData[] => {
  const base = {
    'BTC/USD': { open: 62000, high: 64000, low: 60000, close: 62800 },
    'ETH/USD': { open: 3100, high: 3300, low: 3000, close: 3210 },
    'EUR/USD': { open: 1.08, high: 1.1, low: 1.07, close: 1.09 },
    'GBP/USD': { open: 1.27, high: 1.29, low: 1.25, close: 1.28 },
    'USD/JPY': { open: 149, high: 151, low: 148, close: 150 },
    'AUD/USD': { open: 0.66, high: 0.67, low: 0.65, close: 0.66 },
    'XAU/USD': { open: 2320, high: 2385, low: 2300, close: 2360 },
  }[pair];

  const values: CandleData[] = [];
  let prev = base.open;

  for (let i = 0; i < days; i++) {
    const drift = (Math.sin((i + 1) * 0.9) * 0.012) + (i - days / 2) * 0.002;
    const open = prev;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + 0.01 + i * 0.001);
    const low = Math.min(open, close) * (1 - 0.01 - i * 0.001);

    values.push({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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

const fetchCryptoCandleData = async (pair: MarketPair, days: number) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config || !config.id || !config.quote) {
    return buildFallbackData(pair, days);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${config.id}/ohlc?vs_currency=${config.quote}&days=${days}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const raw = await response.json();
    const values = Array.isArray(raw) ? raw.slice(-days) : [];

    if (!values.length) {
      return buildFallbackData(pair, days);
    }

    return values.map(([timestamp, open, high, low, close]) => ({
      date: new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }));
  } catch (error) {
    console.error(`Error loading ${pair} data`, error);
    return buildFallbackData(pair, days);
  }
};

const fetchFxCandleData = async (pair: MarketPair, days: number) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config || !config.from || !config.to) {
    return buildFallbackData(pair, days);
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Math.max(days - 1, 0));

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const response = await fetch(
      `https://api.frankfurter.app/${startStr}..${endStr}?from=${config.from}&to=${config.to}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch FX data');
    }

    const json = await response.json();
    const entries = Object.entries(json.rates || {}).slice(-days);

    if (!entries.length) {
      return buildFallbackData(pair, days);
    }

    let previous = Number(entries[0][1][config.to]);

    return entries.map(([dateString, rates]) => {
      const rate = Number(rates[config.to]);
      const open = previous;
      const close = rate;
      const drift = clamp(Math.abs(close - open) * 0.7, 0.0004, 0.02);
      const high = Math.max(open, close) * (1 + drift);
      const low = Math.min(open, close) * (1 - drift);

      previous = close;

      return {
        date: new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        open: Number(open.toFixed(6)),
        high: Number(high.toFixed(6)),
        low: Number(low.toFixed(6)),
        close: Number(close.toFixed(6)),
      };
    });
  } catch (error) {
    console.error(`Error loading ${pair} FX data`, error);
    return buildFallbackData(pair, days);
  }
};

const fetchPairData = async (pair: MarketPair, days: number): Promise<CandleData[]> => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config) {
    return buildFallbackData(pair, days);
  }

  if (config.type === 'crypto') {
    return fetchCryptoCandleData(pair, days);
  }

  return fetchFxCandleData(pair, days);
};

const CandleChart = ({
  data,
  selectedPair,
  hoverIndex,
  setHoverIndex,
  activeTool,
}: {
  data: CandleData[];
  selectedPair: MarketPair;
  hoverIndex: number | null;
  setHoverIndex: (value: number | null) => void;
  activeTool: TradingTool;
}) => {
  const width = 960;
  const height = 360;
  const padding = 36;
  const maxPrice = Math.max(...data.map((d) => d.high));
  const minPrice = Math.min(...data.map((d) => d.low));
  const priceRange = maxPrice - minPrice || 1;
  const step = (width - padding * 2) / Math.max(data.length, 1);
  const candleWidth = clamp(step * 0.62, 6, 18);

  const closePath = data
    .map((point, index) => {
      const x = padding + index * step + step / 2;
      const y = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const activeIndex = hoverIndex ?? data.length - 1;
  const hoveredPoint = data[activeIndex];
  const hoverX = padding + activeIndex * step + step / 2;
  const hoverY = padding + ((maxPrice - hoveredPoint.close) / priceRange) * (height - padding * 2);

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding + (i / 4) * (height - padding * 2);
    return <line key={y} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#2a2f3b" strokeDasharray="4 6" />;
  });

  return (
    <div className="relative h-[420px] w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ cursor: activeTool === 'Crosshair' ? 'crosshair' : 'default' }}
        role="img"
        aria-label="Market candles"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - rect.left;
          const ratio = clamp(relativeX / rect.width, 0, 1);
          const nextIndex = Math.min(data.length - 1, Math.max(0, Math.floor(ratio * data.length)));
          setHoverIndex(nextIndex);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines}
        <path d={closePath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((point, index) => {
          const x = padding + index * step + step / 2;
          const yOpen = padding + ((maxPrice - point.open) / priceRange) * (height - padding * 2);
          const yClose = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
          const yHigh = padding + ((maxPrice - point.high) / priceRange) * (height - padding * 2);
          const yLow = padding + ((maxPrice - point.low) / priceRange) * (height - padding * 2);
          const isUp = point.close >= point.open;
          const color = isUp ? '#22c55e' : '#ef4444';
          const bodyY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(Math.abs(yClose - yOpen), 4);

          return (
            <g key={`${point.date}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.9}
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx={3}
                fill={color}
                opacity={0.8}
              />
            </g>
          );
        })}

        <line
          x1={hoverX}
          x2={hoverX}
          y1={padding}
          y2={height - padding}
          stroke="#93c5fd"
          strokeDasharray="6 6"
          opacity={0.8}
        />
        <line
          x1={padding}
          x2={width - padding}
          y1={hoverY}
          y2={hoverY}
          stroke="#93c5fd"
          strokeDasharray="6 6"
          opacity={0.8}
        />
      </svg>

      <div className="absolute top-3 left-3 rounded-md border border-blue-500/40 bg-slate-900/80 px-2 py-1 text-xs text-blue-200 shadow-lg">
        {hoveredPoint ? `${hoveredPoint.date}: ${formatPrice(hoveredPoint.close, selectedPair)}` : 'No price data'}
      </div>
    </div>
  );
};

export const CryptoChart = () => {
  const [selectedPair, setSelectedPair] = useState<MarketPair>('BTC/USD');
  const [selectedRange, setSelectedRange] = useState<Timeframe>('7D');
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<TradingTool>('Crosshair');
  const [tradeSide, setTradeSide] = useState<'Buy' | 'Sell'>('Buy');
  const [tradeVolume, setTradeVolume] = useState<number>(0.5);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const daysMap: Record<Timeframe, number> = { '7D': 7, '30D': 30, '90D': 90 };
        const nextData = await fetchPairData(selectedPair, daysMap[selectedRange]);
        if (isMounted) {
          setData(nextData);
          setHoverIndex(null);
        }
      } catch (error) {
        console.error('Error loading market overview data:', error);
        if (isMounted) {
          const daysMap: Record<Timeframe, number> = { '7D': 7, '30D': 30, '90D': 90 };
          setData(buildFallbackData(selectedPair, daysMap[selectedRange]));
          setHoverIndex(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const interval = window.setInterval(() => {
      loadData();
    }, REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [selectedPair, selectedRange]);

  if (loading) {
    return (
      <div className="bg-[#13151f] text-gray-400 p-8 rounded-xl text-center border border-gray-800">
        Loading market data...
      </div>
    );
  }

  const latest = data[data.length - 1];
  const start = data[0];
  const move = latest && start ? (((latest.close - start.open) / start.open) * 100) : 0;
  const pointerPrice = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex].close : latest?.close ?? 0;
  const pointerLabel = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex].date : 'Live';

  const actionButtonClass = (side: 'Buy' | 'Sell') => {
    const active = tradeSide === side;
    const base = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors';
    return active
      ? side === 'Buy'
        ? `${base} bg-green-600 text-white shadow-lg shadow-green-900/40`
        : `${base} bg-red-600 text-white shadow-lg shadow-red-900/40`
      : `${base} bg-[#1a1d29] text-gray-300 hover:bg-[#242b38]`;
  };

  return (
    <div className="bg-[#13151f] p-6 rounded-xl border border-gray-800 shadow-2xl shadow-slate-950/40">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 px-3 py-2 text-sm font-bold text-white">
              {selectedPair}
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-widest">Market</div>
              <div className="text-white text-xl font-semibold">{selectedPair}</div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm flex-wrap">
            <div className="text-gray-300">
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.14em]">Last</div>
              <div className="text-white font-semibold">{formatPrice(latest?.close ?? 0, selectedPair)}</div>
            </div>
            <div className="text-gray-300">
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.14em]">Change</div>
              <div className={`font-semibold ${move >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {move >= 0 ? '+' : ''}
                {move.toFixed(2)}%
              </div>
            </div>
            <div className="text-gray-300">
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.14em]">Hover</div>
              <div className="text-white font-semibold">{formatPrice(pointerPrice, selectedPair)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TOOL_OPTIONS.map((tool) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  activeTool === tool
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  selectedRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {MARKET_PAIRS.map((pair) => (
            <button
              key={pair.key}
              onClick={() => setSelectedPair(pair.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedPair === pair.key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
              }`}
            >
              {pair.key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="rounded-xl border border-gray-800 bg-[#10141d] p-3">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="text-gray-300">
              <span className="text-gray-400">Hovered:</span>{' '}
              <span className="font-semibold text-white">{formatPrice(pointerPrice, selectedPair)}</span>
            </div>
            <div className="text-gray-400">{pointerLabel}</div>
          </div>

          <CandleChart
            data={data}
            selectedPair={selectedPair}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
            activeTool={activeTool}
          />
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#10141d] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.14em]">Order Ticket</div>
              <div className="text-white text-lg font-semibold">{selectedPair}</div>
            </div>
            <div className="rounded-full border border-gray-700 bg-[#1a1d29] px-2 py-1 text-xs text-gray-300">
              {selectedRange}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTradeSide('Buy')} className={actionButtonClass('Buy')}>
              Buy
            </button>
            <button type="button" onClick={() => setTradeSide('Sell')} className={actionButtonClass('Sell')}>
              Sell
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
              <span className="text-gray-400">Price</span>
              <span className="text-white font-semibold">{formatPrice(latest?.close ?? 0, selectedPair)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
              <span className="text-gray-400">Volume</span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={tradeVolume}
                onChange={(e) => setTradeVolume(Number(e.target.value) || 0.01)}
                className="w-20 bg-transparent text-right text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
              <span className="text-gray-400">Estimated</span>
              <span className="text-white font-semibold">
                {formatCurrency((latest?.close ?? 0) * tradeVolume)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                tradeSide === 'Buy'
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {tradeSide} {selectedPair}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default CryptoChart;
