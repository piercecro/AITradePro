interface CoinGeckoQuote {
  usd?: number;
  usd_24h_change?: number;
}

type CoinGeckoResponse = Record<string, CoinGeckoQuote | undefined>;

interface LivePrice {
  price: number;
  change24h: number | null;
  id: string;
  updatedAt: string;
}

const COINS: Record<string, string> = {
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
};

const jsonResponse = (body: unknown, status = 200, cacheControl = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const ids = [...new Set(Object.values(COINS))].join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      console.error('CoinGecko price request failed:', response.status, await response.text());
      return jsonResponse({ error: `CoinGecko request failed (${response.status})` }, 502);
    }

    const data = (await response.json()) as CoinGeckoResponse;
    const updatedAt = new Date().toISOString();
    const prices: Record<string, LivePrice> = {};

    for (const [symbol, id] of Object.entries(COINS)) {
      const quote = data[id];
      const price = Number(quote?.usd);
      if (!Number.isFinite(price) || price <= 0) continue;

      const change = Number(quote?.usd_24h_change);
      prices[symbol] = {
        price,
        change24h: Number.isFinite(change) ? change : null,
        id,
        updatedAt,
      };
    }

    if (Object.keys(prices).length === 0) {
      console.error('CoinGecko returned no usable price quotes.');
      return jsonResponse({ error: 'CoinGecko returned no usable price quotes' }, 502);
    }

    return jsonResponse({ prices }, 200, 'public, max-age=0, s-maxage=10, must-revalidate');
  } catch (error) {
    console.error('Error fetching live prices:', error);
    return jsonResponse({ error: 'Unable to fetch live prices from CoinGecko' }, 502);
  }
}
