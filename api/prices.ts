interface CoinGeckoQuote {
  usd?: number;
  usd_24h_change?: number;
}

interface CoinGeckoResponse {
  bitcoin?: CoinGeckoQuote;
  ethereum?: CoinGeckoQuote;
  solana?: CoinGeckoQuote;
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
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
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
