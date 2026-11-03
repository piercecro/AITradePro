export interface LivePrice {
  price: number;
  change24h: number | null;
  id: string | null;
  updatedAt: string;
}

export type LivePriceMap = Record<string, LivePrice>;

/**
 * Fetches the latest prices from our own /api/prices endpoint (backed by the
 * Supabase `market_prices` table). Never throws: if the endpoint is missing
 * (e.g. plain `vite dev`) or fails, it returns an empty map so callers can
 * fall back to their previous behaviour.
 */
export const fetchLivePrices = async (): Promise<LivePriceMap> => {
  try {
    const response = await fetch('/api/prices', { headers: { Accept: 'application/json' } });
    if (!response.ok) return {};

    const body = (await response.json()) as { prices?: LivePriceMap };
    return body.prices ?? {};
  } catch {
    return {};
  }
};
