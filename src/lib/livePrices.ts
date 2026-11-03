import { supabase } from './supabase';

export interface LivePrice {
  price: number;
  change24h: number | null;
  id: string | null;
  updatedAt: string;
}

export type LivePriceMap = Record<string, LivePrice>;

const COINGECKO_ID_BY_SYMBOL: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
  'XRP/USD': 'ripple',
  'ADA/USD': 'cardano',
  'DOGE/USD': 'dogecoin',
  'LINK/USD': 'chainlink',
  'UNI/USD': 'uniswap',
  'APT/USD': 'aptos',
  'SUI/USD': 'sui',
  'BCH/USD': 'bitcoin-cash',
  'FIL/USD': 'filecoin',
  'ARB/USD': 'arbitrum',
  'AVAX/USD': 'avalanche-2',
  'TRX/USD': 'tron',
  'NEAR/USD': 'near',
  'ATOM/USD': 'cosmos',
  'LTC/USD': 'litecoin',
  'XLM/USD': 'stellar',
  'XMR/USD': 'monero',
  'BNB/USD': 'binancecoin',
  'TAO/USD': 'bittensor',
  'IOTA/USD': 'iota',
  'OSMO/USD': 'osmosis',
  'MATIC/USD': 'matic-network',
  'DOT/USD': 'polkadot',
  'ETC/USD': 'ethereum-classic',
  'EOS/USD': 'eos',
  'VET/USD': 'vechain',
  'THETA/USD': 'theta-token',
  'RNDR/USD': 'render-token',
  'ALGO/USD': 'algorand',
  'XAU/USD': 'tether-gold',
  'XAG/USD': 'silver',
};

const getCoinGeckoPriceData = async (): Promise<Record<string, { usd?: number; usd_24h_change?: number }>> => {
  const ids = Array.from(new Set(Object.values(COINGECKO_ID_BY_SYMBOL))).filter(Boolean).join(',');

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  return data;
};

const mapCoinGeckoResponse = (data: Record<string, { usd?: number; usd_24h_change?: number }>): LivePriceMap => {
  const prices: LivePriceMap = {};

  for (const [symbol, id] of Object.entries(COINGECKO_ID_BY_SYMBOL)) {
    const quote = data[id];
    const price = Number(quote?.usd);
    if (!Number.isFinite(price) || price <= 0) continue;

    const change = Number(quote?.usd_24h_change);
    prices[symbol] = {
      price,
      change24h: Number.isFinite(change) ? change : null,
      id,
      updatedAt: new Date().toISOString(),
    };
  }

  return prices;
};

const readSupabasePrices = async (): Promise<LivePriceMap> => {
  if (!supabase) {
    return {};
  }

  const possibleTables = ['crypto_prices', 'live_prices', 'market_prices', 'asset_prices'];
  const candidates = await Promise.all(
    possibleTables.map(async (tableName) => {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(200);
        if (error || !Array.isArray(data)) {
          return [] as Record<string, unknown>[];
        }
        return data;
      } catch {
        return [] as Record<string, unknown>[];
      }
    }),
  );

  const rows = candidates.flat();
  const prices: LivePriceMap = {};

  for (const row of rows) {
    const symbol = (row.symbol ?? row.asset ?? row.name ?? row.pair ?? '') as string;
    const rawPrice = row.price ?? row.usd ?? row.value ?? row.current_price;
    const rawChange = row.change_24h ?? row.change24h ?? row.percent_change_24h ?? null;

    const price = Number(rawPrice);
    if (!symbol || !Number.isFinite(price) || price <= 0) continue;

    prices[symbol] = {
      price,
      change24h: rawChange === null || rawChange === undefined || !Number.isFinite(Number(rawChange)) ? null : Number(rawChange),
      id: typeof row.coin_id === 'string' ? row.coin_id : null,
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
    };
  }

  return prices;
};

/**
 * Fetches fresh prices from the app's live endpoint when available, then falls back
 * to Supabase data, and finally to CoinGecko directly. This keeps the UI live even
 * in local Vite development where /api/* does not exist unless the app is deployed.
 */
export const fetchLivePrices = async (): Promise<LivePriceMap> => {
  try {
    const response = await fetch('/api/prices', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const body = (await response.json()) as { prices?: unknown };
      if (body.prices && typeof body.prices === 'object' && !Array.isArray(body.prices)) {
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
            updatedAt: typeof quote.updatedAt === 'string' ? quote.updatedAt : new Date().toISOString(),
          };
        }

        if (Object.keys(prices).length) {
          return prices;
        }
      }
    }
  } catch (error) {
    console.warn('Live API route not available, falling back to Supabase/CoinGecko:', error);
  }

  try {
    const supabasePrices = await readSupabasePrices();
    if (Object.keys(supabasePrices).length) {
      return supabasePrices;
    }
  } catch (error) {
    console.warn('Unable to read Supabase price cache:', error);
  }

  try {
    const coinGeckoResponse = await getCoinGeckoPriceData();
    const prices = mapCoinGeckoResponse(coinGeckoResponse);
    if (Object.keys(prices).length) {
      return prices;
    }
  } catch (error) {
    console.warn('Unable to fetch live prices from CoinGecko:', error);
  }

  return {};
};
