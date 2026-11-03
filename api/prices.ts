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

// Vercel Node.js function request/response types, kept local to avoid a
// dependency on @vercel/node in this Vite application.
interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

const LIVE_COIN_IDS: Record<string, string> = {
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

const sendJson = (res: ApiResponse, status: number, body: unknown) =>
  res.status(status).json(body);

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, must-revalidate');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const ids = [...new Set(Object.values(LIVE_COIN_IDS))].join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      console.error('CoinGecko price request failed:', response.status, details);
      sendJson(res, 502, { error: `CoinGecko request failed (${response.status})` });
      return;
    }

    const data = (await response.json()) as CoinGeckoResponse;
    const updatedAt = new Date().toISOString();
    const prices: Record<string, LivePrice> = {};

    for (const [symbol, id] of Object.entries(LIVE_COIN_IDS)) {
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
      sendJson(res, 502, { error: 'CoinGecko returned no usable price quotes' });
      return;
    }

    sendJson(res, 200, { prices });
  } catch (error) {
    console.error('Error fetching live prices:', error);
    sendJson(res, 502, { error: 'Unable to fetch live prices from CoinGecko' });
  }
}
