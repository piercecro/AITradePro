export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCandlesResponse {
  symbol: string;
  interval: string;
  candles: MarketCandle[];
}

/** Fetches real OHLC bars through the server-side market-data proxy. */
export const fetchMarketCandles = async (
  symbol: string,
  interval: string,
  outputsize = 100,
  signal?: AbortSignal,
): Promise<MarketCandlesResponse> => {
  const params = new URLSearchParams({ symbol, interval, outputsize: String(outputsize) });
  const response = await fetch(`/api/market?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });

  const body = await response.json() as MarketCandlesResponse | { error?: string };
  if (!response.ok) {
    throw new Error('error' in body ? body.error || `Market request failed (${response.status})` : `Market request failed (${response.status})`);
  }
  if (!('candles' in body) || !Array.isArray(body.candles)) {
    throw new Error('Market data returned an invalid candle response.');
  }

  return {
    ...body,
    candles: body.candles.map((candle) => ({
      ...candle,
      time: typeof candle.time === 'number' ? candle.time : new Date(candle.time).getTime(),
    })).filter((candle) => Number.isFinite(candle.time) && [candle.open, candle.high, candle.low, candle.close].every((price) => Number.isFinite(price) && price > 0)),
  };
};
