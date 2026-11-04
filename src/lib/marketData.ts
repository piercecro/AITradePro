import { fetchLivePrices } from './livePrices';

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

export interface BotMarketQuote {
  price: number;
  change24h: number;
}

export type BotMarketMap = Record<string, BotMarketQuote>;

// IDs match the CoinGecko IDs returned by /api/prices. Bot pairs use multiple
// quote currencies (for example USDT and USD), so key them by their base asset.
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple',
  ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2', LINK: 'chainlink', DOT: 'polkadot',
  NEAR: 'near', LTC: 'litecoin', BCH: 'bitcoin-cash', UNI: 'uniswap', ATOM: 'cosmos',
  ETC: 'ethereum-classic', APT: 'aptos', SUI: 'sui', ARB: 'arbitrum', OP: 'optimism',
  FIL: 'filecoin', INJ: 'injective-protocol', ICP: 'internet-computer', AAVE: 'aave',
  TAO: 'bittensor', SEI: 'sei-network', TIA: 'celestia', JUP: 'jupiter-exchange-solana',
  WIF: 'dogwifcoin', PEPE: 'pepe', TRX: 'tron', XLM: 'stellar', VET: 'vechain',
  ALGO: 'algorand', FET: 'fetch-ai', RENDER: 'render-token', RNDR: 'render-token',
  GRT: 'the-graph', MKR: 'maker', CRV: 'curve-dao-token', MANA: 'decentraland',
  SAND: 'the-sandbox', FTM: 'fantom', EGLD: 'elrond-erd-2', THETA: 'theta-token',
  RUNE: 'thorchain', AR: 'arweave', IMX: 'immutable-x', STX: 'blockstack',
  ONDO: 'ondo-finance', PYTH: 'pyth-network', IOTA: 'iota', HYPE: 'hyperliquid',
  OSMO: 'osmosis', MATIC: 'matic-network', MANTA: 'manta-network', JTO: 'jito-governance-token',
  HBAR: 'hedera-hashgraph', ZIL: 'zilliqa', MASK: 'mask-network', ENJ: 'enjincoin',
};

export const pairToCoinGeckoId = (pair: string): string => {
  const base = pair.trim().toUpperCase().split('/')[0];
  return COIN_IDS[base] ?? base.toLowerCase();
};

/** Provides bot-market quotes from the existing server-side live-price feed. */
export const fetchBotMarketSnapshot = async (pairs: string[]): Promise<BotMarketMap> => {
  const livePrices = await fetchLivePrices();
  const pricesById = new Map<string, { price: number; change24h: number }>();

  for (const quote of Object.values(livePrices)) {
    if (!quote.id) continue;
    pricesById.set(quote.id, {
      price: quote.price,
      change24h: quote.change24h ?? 0,
    });
  }

  const snapshot: BotMarketMap = {};
  for (const pair of pairs) {
    const id = pairToCoinGeckoId(pair);
    const quote = pricesById.get(id);
    if (quote) snapshot[id] = quote;
  }
  return snapshot;
};
