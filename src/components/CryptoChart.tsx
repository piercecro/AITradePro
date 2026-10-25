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

const REFRESH_MS = 60_000;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildFallbackData = (pair: MarketPair): CandleData[] => {
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

  for (let i = 0; i < 7; i++) {
    const drift = (Math.sin((i + 1) * 0.9) * 0.012) + (i - 3) * 0.0025;
    const open = prev;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + 0.01 + i * 0.001);
    const low = Math.min(open, close) * (1 - 0.01 - i * 0.001);

    values.push({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
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

const fetchCryptoCandleData = async (pair: MarketPair) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config || !config.id || !config.quote) {
    return buildFallbackData(pair);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${config.id}/ohlc?vs_currency=${config.quote}&days=7`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const raw = await response.json();
    const values = Array.isArray(raw) ? raw.slice(-7) : [];

    if (!values.length) {
      return buildFallbackData(pair);
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
    return buildFallbackData(pair);
  }
};

const fetchFxCandleData = async (pair: MarketPair) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config || !config.from || !config.to) {
    return buildFallbackData(pair);
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const response = await fetch(
      `https://api.frankfurter.app/${startStr}..${endStr}?from=${config.from}&to=${config.to}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch FX data');
    }

    const json = await response.json();
    const entries = Object.entries(json.rates || {}).slice(-7);

    if (!entries.length) {
      return buildFallbackData(pair);
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
    return buildFallbackData(pair);
  }
};

const fetchPairData = async (pair: MarketPair): Promise<CandleData[]> => {
  const config = MARKET_PAIRS.find((item) => item.key === pair);
  if (!config) {
    return buildFallbackData(pair);
  }

  if (config.type === 'crypto') {
    return fetchCryptoCandleData(pair);
  }

  return fetchFxCandleData(pair);
};

const CandleChart = ({ data }: { data: CandleData[] }) => {
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

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding + (i / 4) * (height - padding * 2);
    return <line key={y} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#2a2f3b" strokeDasharray="4 6" />;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label="Market candles">
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
    </svg>
  );
};

export const CryptoChart = () => {
  const [selectedPair, setSelectedPair] = useState<MarketPair>('BTC/USD');
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const nextData = await fetchPairData(selectedPair);
        if (isMounted) {
          setData(nextData);
        }
      } catch (error) {
        console.error('Error loading market overview data:', error);
        if (isMounted) {
          setData(buildFallbackData(selectedPair));
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
  }, [selectedPair]);

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

  return (
    <div className="bg-[#13151f] p-6 rounded-xl border border-gray-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-white text-xl font-semibold">7-Day Market Overview</h2>

        <div className="flex flex-wrap gap-2">
          {MARKET_PAIRS.map((pair) => (
            <button
              key={pair.key}
              onClick={() => setSelectedPair(pair.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedPair === pair.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
              }`}
            >
              {pair.key}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="text-gray-300">
          <span className="text-gray-400">Pair:</span> <span className="font-semibold text-white">{selectedPair}</span>
        </div>
        <div className={`font-semibold ${move >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {move >= 0 ? '+' : ''}
          {move.toFixed(2)}%
        </div>
      </div>

      <div className="h-[420px] w-full">
        <CandleChart data={data} />
      </div>
    </div>
  );
};

export default CryptoChart;
