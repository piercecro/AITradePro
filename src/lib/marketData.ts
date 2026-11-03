import { fetchLivePrices } from './livePrices';

export interface BotPriceSnapshot {
  price: number;
  change24h: number;
}

export type BotMarketMap = Record<string, BotPriceSnapshot>;

export const pairToCoinGeckoId = (pair: string) => {
  const normalized = pair.trim().toUpperCase().replace('USDT', 'USD');
  const map: Record<string, string> = {
    'BTC/USD': 'bitcoin',
    'ETH/USD': 'ethereum',
    'ADA/USD': 'cardano',
    'SOL/USD': 'solana',
    'XRP/USD': 'ripple',
    'BNB/USD': 'binancecoin',
    'DOGE/USD': 'dogecoin',
    'LINK/USD': 'chainlink',
    'APT/USD': 'aptos',
    'SUI/USD': 'sui',
    'BCH/USD': 'bitcoin-cash',
    'FIL/USD': 'filecoin',
    'UNI/USD': 'uniswap',
    'ARB/USD': 'arbitrum',
    'AVAX/USD': 'avalanche-2',
    'TAO/USD': 'bittensor',
    'NEAR/USD': 'near',
    'IOTA/USD': 'iota',
    'OSMO/USD': 'osmosis',
    'LTC/USD': 'litecoin',
    'TRX/USD': 'tron',
    'MATIC/USD': 'matic-network',
    'ATOM/USD': 'cosmos',
    'DOT/USD': 'polkadot',
    'ETC/USD': 'ethereum-classic',
    'XLM/USD': 'stellar',
    'EOS/USD': 'eos',
    'VET/USD': 'vechain',
    'THETA/USD': 'theta-token',
    'RNDR/USD': 'render-token',
    'ALGO/USD': 'algorand',
  };

  return map[normalized] ?? normalized.replace('/', '').toLowerCase();
};

const toPairAssetId = (pair: string) => pairToCoinGeckoId(pair);

export const fetchBotMarketSnapshot = async (pairs: string[]): Promise<BotMarketMap> => {
  const ids = Array.from(new Set(pairs.map(toPairAssetId))).filter(Boolean);

  if (!ids.length) {
    return {};
  }

  // 1) Prefer our own cached live prices (shared across all visitors).
  const result: BotMarketMap = {};
  const live = await fetchLivePrices();
  for (const quote of Object.values(live)) {
    if (quote.id && ids.includes(quote.id)) {
      result[quote.id] = { price: quote.price, change24h: quote.change24h ?? 0 };
    }
  }

  const missing = ids.filter((id) => !result[id]);
  if (!missing.length) {
    return result;
  }

  // 2) Fall back to CoinGecko directly for anything we do not have stored.
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${missing.join(',')}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Market fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;

    for (const [id, values] of Object.entries(data)) {
      result[id] = {
        price: Number(values.usd ?? 0),
        change24h: Number(values.usd_24h_change ?? 0),
      };
    }

    return result;
  } catch {
    return result;
  }
};
