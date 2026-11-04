interface MarketRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface MarketResponse {
  setHeader(name: string, value: string): void;
  status(code: number): MarketResponse;
  json(body: unknown): MarketResponse;
}

interface TwelveDataBar {
  datetime?: string;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  close?: string | number;
  volume?: string | number;
}

interface TwelveDataResponse {
  status?: string;
  message?: string;
  code?: number;
  meta?: Record<string, unknown>;
  values?: TwelveDataBar[];
}

const ALLOWED_INTERVALS = new Set(['1min', '5min', '15min', '30min', '1h', '4h', '1day']);
const clampOutputSize = (value: string | undefined) => {
  const parsed = Number(value ?? 100);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 10), 500) : 100;
};

// Vercel injects environment variables at runtime; keep the API key server-side.
declare const process: { env: Record<string, string | undefined> };

export default async function handler(req: MarketRequest, res: MarketResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = typeof process !== 'undefined' ? process.env.TWELVE_DATA_API_KEY : undefined;
  if (!apiKey) {
    res.status(503).json({ error: 'Market data is not configured. Set TWELVE_DATA_API_KEY in the server environment.' });
    return;
  }

  const symbolValue = req.query?.symbol;
  const intervalValue = req.query?.interval;
  const symbol = Array.isArray(symbolValue) ? symbolValue[0] : symbolValue;
  const interval = Array.isArray(intervalValue) ? intervalValue[0] : intervalValue;
  const outputsizeValue = req.query?.outputsize;
  const outputsize = clampOutputSize(Array.isArray(outputsizeValue) ? outputsizeValue[0] : outputsizeValue);

  if (!symbol || symbol.length > 40 || !/^[A-Za-z0-9._/-]+$/.test(symbol)) {
    res.status(400).json({ error: 'Provide a valid market symbol, such as BTC/USD or AAPL.' });
    return;
  }
  if (!interval || !ALLOWED_INTERVALS.has(interval)) {
    res.status(400).json({ error: 'Unsupported interval. Use 1min, 5min, 15min, 30min, 1h, 4h, or 1day.' });
    return;
  }

  try {
    const url = new URL('https://api.twelvedata.com/time_series');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(outputsize));
    url.searchParams.set('order', 'ASC');
    url.searchParams.set('apikey', apiKey);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const body = (await response.json()) as TwelveDataResponse;

    if (!response.ok || body.status === 'error' || !Array.isArray(body.values)) {
      const message = body.message || `Twelve Data request failed (${response.status})`;
      res.status(response.ok ? 502 : response.status).json({ error: message });
      return;
    }

    const candles = body.values.map((bar) => ({
      time: bar.datetime,
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
      volume: Number(bar.volume ?? 0),
    })).filter((bar) => bar.time && [bar.open, bar.high, bar.low, bar.close].every((price) => Number.isFinite(price) && price > 0));

    res.status(200).json({ symbol, interval, meta: body.meta ?? {}, candles });
  } catch (error) {
    console.error('Twelve Data market request failed:', error);
    res.status(502).json({ error: 'Unable to load market data.' });
  }
}
