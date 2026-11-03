interface CoinGeckoQuote {
  usd?: number;
  usd_24h_change?: number;
}

interface CoinGeckoResponse {
  bitcoin?: CoinGeckoQuote;
  ethereum?: CoinGeckoQuote;
  solana?: CoinGeckoQuote;
  ripple?: CoinGeckoQuote;
  cardano?: CoinGeckoQuote;
  dogecoin?: CoinGeckoQuote;
  chainlink?: CoinGeckoQuote;
  uniswap?: CoinGeckoQuote;
  aptos?: CoinGeckoQuote;
  sui?: CoinGeckoQuote;
  'bitcoin-cash'?: CoinGeckoQuote;
  filecoin?: CoinGeckoQuote;
  arbitrum?: CoinGeckoQuote;
  'avalanche-2'?: CoinGeckoQuote;
  tron?: CoinGeckoQuote;
  near?: CoinGeckoQuote;
  cosmos?: CoinGeckoQuote;
  litecoin?: CoinGeckoQuote;
  stellar?: CoinGeckoQuote;
  monero?: CoinGeckoQuote;
}

interface LivePrice {
  price: number;
  change24h: number | null;
  id: string;
  updatedAt: string;
}

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
    const ids = [
      'bitcoin',
      'ethereum',
      'solana',
      'ripple',
      'cardano',
      'dogecoin',
      'chainlink',
      'uniswap',
      'aptos',
      'sui',
      'bitcoin-cash',
      'filecoin',
      'arbitrum',
      'avalanche-2',
      'tron',
      'near',
      'cosmos',
      'litecoin',
      'stellar',
      'monero',
    ].join(',');

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      console.error('CoinGecko price request failed:', response.status);
      return jsonResponse({ error: 'Price provider request failed' }, 502);
    }

    const data = (await response.json()) as CoinGeckoResponse;
    const updatedAt = new Date().toISOString();
    const prices: Record<string, LivePrice> = {};

    const addQuote = (symbol: string, id: string, quote?: CoinGeckoQuote) => {
      const price = Number(quote?.usd);
      if (!Number.isFinite(price) || price <= 0) return;

      const change = Number(quote?.usd_24h_change);
      prices[symbol] = {
        price,
        change24h: Number.isFinite(change) ? change : null,
        id,
        updatedAt,
      };
    };

    addQuote('BTC/USD', 'bitcoin', data.bitcoin);
    addQuote('ETH/USD', 'ethereum', data.ethereum);
    addQuote('SOL/USD', 'solana', data.solana);
    addQuote('XRP/USD', 'ripple', data.ripple);
    addQuote('ADA/USD', 'cardano', data.cardano);
    addQuote('DOGE/USD', 'dogecoin', data.dogecoin);
    addQuote('LINK/USD', 'chainlink', data.chainlink);
    addQuote('UNI/USD', 'uniswap', data.uniswap);
    addQuote('APT/USD', 'aptos', data.aptos);
    addQuote('SUI/USD', 'sui', data.sui);
    addQuote('BCH/USD', 'bitcoin-cash', data['bitcoin-cash']);
    addQuote('FIL/USD', 'filecoin', data.filecoin);
    addQuote('ARB/USD', 'arbitrum', data.arbitrum);
    addQuote('AVAX/USD', 'avalanche-2', data['avalanche-2']);
    addQuote('TRX/USD', 'tron', data.tron);
    addQuote('NEAR/USD', 'near', data.near);
    addQuote('ATOM/USD', 'cosmos', data.cosmos);
    addQuote('LTC/USD', 'litecoin', data.litecoin);
    addQuote('XLM/USD', 'stellar', data.stellar);
    addQuote('XMR/USD', 'monero', data.monero);

    if (Object.keys(prices).length === 0) {
      return jsonResponse({ error: 'Price provider returned no usable quotes' }, 502);
    }

    return jsonResponse(
      { prices },
      200,
      'public, s-maxage=15, stale-while-revalidate=30',
    );
  } catch (error) {
    console.error('Error fetching live prices:', error);
    return jsonResponse({ error: 'Unable to fetch live prices' }, 502);
  }
}
