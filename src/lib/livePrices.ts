export interface LivePrice {
  price: number;
  change24h: number | null;
  id: string | null;
  updatedAt: string;
}

export type LivePriceMap = Record<string, LivePrice>;

/**
 * Fetches fresh prices from our /api/prices endpoint. The endpoint must be
 * deployed as a serverless function (for example on Vercel); if it is missing
 * or fails, return an empty map so callers can retain their existing fallback.
 */
export const fetchLivePrices = async (): Promise<LivePriceMap> => {
  try {
    const response = await fetch('/api/prices', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Live price request failed: ${response.status} ${response.statusText}`);
      return {};
    }

    const body = (await response.json()) as { prices?: unknown };
    if (!body.prices || typeof body.prices !== 'object' || Array.isArray(body.prices)) {
      console.warn('Live price endpoint returned an invalid prices payload.');
      return {};
    }

    const prices: LivePriceMap = {};
    for (const [symbol, value] of Object.entries(body.prices)) {
      if (!value || typeof value !== 'object') continue;

      const quote = value as Partial<LivePrice>;
      const price = Number(quote.price);
      if (!Number.isFinite(price) || price <= 0) continue;

      prices[symbol] = {
        price,
        change24h:
          quote.change24h === null || quote.change24h === undefined
            ? null
            : Number.isFinite(Number(quote.change24h))
              ? Number(quote.change24h)
              : null,
        id: typeof quote.id === 'string' ? quote.id : null,
        updatedAt: typeof quote.updatedAt === 'string' ? quote.updatedAt : '',
      };
    }

    return prices;
  } catch (error) {
    console.warn('Unable to fetch live prices:', error);
    return {};
  }
};
