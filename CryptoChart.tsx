import { useState } from 'react';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

type MarketPair =
  | 'BTC/USD'
  | 'ETH/USD'
  | 'SOL/USD'
  | 'BNB/USD'
  | 'XRP/USD'
  | 'ADA/USD'
  | 'DOGE/USD'
  | 'AVAX/USD'
  | 'LINK/USD'
  | 'MATIC/USD'
  | 'DOT/USD'
  | 'TRX/USD'
  | 'NEAR/USD'
  | 'ATOM/USD'
  | 'LTC/USD'
  | 'BCH/USD'
  | 'UNI/USD'
  | 'APT/USD'
  | 'ARB/USD'
  | 'OP/USD'
  | 'SUI/USD'
  | 'FIL/USD'
  | 'ALGO/USD'
  | 'EOS/USD'
  | 'TAO/USD'
  | 'WIF/USD'
  | 'PEPE/USD'
  | 'BONK/USD'
  | 'RNDR/USD'
  | 'ICP/USD'
  | 'FTM/USD'
  | 'THETA/USD'
  | 'XTZ/USD'
  | 'VET/USD'
  | 'INJ/USD'
  | 'GRT/USD'
  | 'HBAR/USD'
  | 'KAS/USD'
  | 'FET/USD'
  | 'AAVE/USD'
  | 'SAND/USD'
  | 'MANA/USD'
  | 'CHZ/USD'
  | 'IMX/USD'
  | 'FLOW/USD'
  | 'EGLD/USD'
  | 'DYDX/USD'
  | 'ZIL/USD'
  | 'MASK/USD'
  | 'ENJ/USD'
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'AUD/USD'
  | 'XAU/USD';

type Timeframe = '7D' | '30D' | '90D';
type TradingTool = 'Crosshair' | 'Trend' | 'Indicators' | 'Measure';
type ChartMode = 'Candles' | 'Line';
type IndicatorMode = 'None' | 'MA' | 'RSI' | 'MACD';

const DEFAULT_CRYPTO_PAIRS = [
  { key: 'BTC/USD', name: 'Bitcoin', market: 'Major', id: 'bitcoin', quote: 'usd', description: 'The original digital store of value and the benchmark crypto asset.' },
  { key: 'ETH/USD', name: 'Ethereum', market: 'Major', id: 'ethereum', quote: 'usd', description: 'Smart-contract platform powering DeFi, NFT, and blockchain apps.' },
  { key: 'SOL/USD', name: 'Solana', market: 'Layer 1', id: 'solana', quote: 'usd', description: 'High-speed Layer 1 blockchain focused on scalability and low fees.' },
  { key: 'BNB/USD', name: 'BNB', market: 'Exchange', id: 'binancecoin', quote: 'usd', description: 'Utility token for Binance ecosystem and transaction flow.' },
  { key: 'XRP/USD', name: 'XRP', market: 'Payments', id: 'ripple', quote: 'usd', description: 'Cross-border payment token designed for fast settlement.' },
  { key: 'ADA/USD', name: 'Cardano', market: 'Layer 1', id: 'cardano', quote: 'usd', description: 'Research-driven blockchain with staking and smart contracts.' },
  { key: 'DOGE/USD', name: 'Dogecoin', market: 'Meme', id: 'dogecoin', quote: 'usd', description: 'Popular meme coin with broad retail trading attention.' },
  { key: 'AVAX/USD', name: 'Avalanche', market: 'Layer 1', id: 'avalanche-2', quote: 'usd', description: 'High-throughput blockchain ecosystem with subnets and DeFi.' },
  { key: 'LINK/USD', name: 'Chainlink', market: 'Oracle', id: 'chainlink', quote: 'usd', description: 'Decentralized oracle network connecting blockchains to real-world data.' },
  { key: 'MATIC/USD', name: 'Polygon', market: 'Layer 2', id: 'matic-network', quote: 'usd', description: 'Ethereum scaling network focused on faster and cheaper transactions.' },
  { key: 'DOT/USD', name: 'Polkadot', market: 'Layer 1', id: 'polkadot', quote: 'usd', description: 'Interoperability network linking multiple blockchains together.' },
  { key: 'TRX/USD', name: 'TRON', market: 'Payments', id: 'tron', quote: 'usd', description: 'Blockchain focused on media, entertainment, and staking ecosystems.' },
  { key: 'NEAR/USD', name: 'NEAR Protocol', market: 'Layer 1', id: 'near', quote: 'usd', description: 'Developer-friendly blockchain built for speed and usability.' },
  { key: 'ATOM/USD', name: 'Cosmos', market: 'Interoperability', id: 'cosmos', quote: 'usd', description: 'Internet of blockchains project enabling cross-chain communication.' },
  { key: 'LTC/USD', name: 'Litecoin', market: 'Major', id: 'litecoin', quote: 'usd', description: 'Lightweight Bitcoin alternative optimized for speed and efficiency.' },
  { key: 'BCH/USD', name: 'Bitcoin Cash', market: 'Major', id: 'bitcoin-cash', quote: 'usd', description: 'Bitcoin fork focused on scalable payments and lower fees.' },
  { key: 'UNI/USD', name: 'Uniswap', market: 'DeFi', id: 'uniswap', quote: 'usd', description: 'Leading decentralized exchange protocol with automated market making.' },
  { key: 'APT/USD', name: 'Aptos', market: 'Layer 1', id: 'aptos', quote: 'usd', description: 'Move-based blockchain engineered for performance and developer tooling.' },
  { key: 'ARB/USD', name: 'Arbitrum', market: 'Layer 2', id: 'arbitrum', quote: 'usd', description: 'Ethereum layer-two scaling network known for lower gas costs.' },
  { key: 'OP/USD', name: 'Optimism', market: 'Layer 2', id: 'optimism', quote: 'usd', description: 'Scalable Ethereum solution designed for fast transactions and lower fees.' },
  { key: 'SUI/USD', name: 'Sui', market: 'Layer 1', id: 'sui', quote: 'usd', description: 'High-performance blockchain created for asset ownership and web3 apps.' },
  { key: 'FIL/USD', name: 'Filecoin', market: 'Storage', id: 'filecoin', quote: 'usd', description: 'Decentralized storage network for digital assets and data retrieval.' },
  { key: 'ALGO/USD', name: 'Algorand', market: 'Layer 1', id: 'algorand', quote: 'usd', description: 'Pure proof-of-stake blockchain focused on efficient settlement.' },
  { key: 'EOS/USD', name: 'EOS', market: 'Smart Contract', id: 'eos', quote: 'usd', description: 'Blockchain built for dApps with high throughput and governance structures.' },
  { key: 'TAO/USD', name: 'Bittensor', market: 'AI', id: 'bittensor', quote: 'usd', description: 'AI-focused decentralized network for machine intelligence and market signals.' },
  { key: 'WIF/USD', name: 'dogwifhat', market: 'Meme', id: 'dogwifhat', quote: 'usd', description: 'Solana-based meme coin that gained strong retail trading momentum.' },
  { key: 'PEPE/USD', name: 'Pepe', market: 'Meme', id: 'pepe', quote: 'usd', description: 'Memecoin with heavy community trading and social sentiment influence.' },
  { key: 'BONK/USD', name: 'Bonk', market: 'Meme', id: 'bonk', quote: 'usd', description: 'Solana meme coin known for community-driven trading and liquidity.' },
  { key: 'RNDR/USD', name: 'Render', market: 'AI / Compute', id: 'render-token', quote: 'usd', description: 'Distributed GPU rendering network for digital content and compute.' },
  { key: 'ICP/USD', name: 'Internet Computer', market: 'Layer 1', id: 'internet-computer', quote: 'usd', description: 'Blockchain web infrastructure that enables internet-scale decentralized apps.' },
  { key: 'FTM/USD', name: 'Fantom', market: 'Layer 1', id: 'fantom', quote: 'usd', description: 'High-speed blockchain for DeFi protocols and dApps.' },
  { key: 'THETA/USD', name: 'Theta Network', market: 'Media', id: 'theta-token', quote: 'usd', description: 'Video streaming and media network powered by blockchain infrastructure.' },
  { key: 'XTZ/USD', name: 'Tezos', market: 'Layer 1', id: 'tezos', quote: 'usd', description: 'Smart contract blockchain with on-chain governance and upgrades.' },
  { key: 'VET/USD', name: 'VeChain', market: 'Supply Chain', id: 'vechain', quote: 'usd', description: 'Enterprise blockchain focused on logistics and supply-chain tracking.' },
  { key: 'INJ/USD', name: 'Injective', market: 'DeFi', id: 'injective-protocol', quote: 'usd', description: 'Cross-chain DeFi protocol for trading and composable finance.' },
  { key: 'GRT/USD', name: 'The Graph', market: 'Indexing', id: 'the-graph', quote: 'usd', description: 'Blockchain indexing protocol supporting data access for dApps.' },
  { key: 'HBAR/USD', name: 'Hedera', market: 'Enterprise', id: 'hedera-hashgraph', quote: 'usd', description: 'Hashgraph-based network designed for enterprise-scale applications.' },
  { key: 'KAS/USD', name: 'Kaspa', market: 'Layer 1', id: 'kaspa', quote: 'usd', description: 'High-speed proof-of-work network built for efficient block creation.' },
  { key: 'FET/USD', name: 'Fetch.ai', market: 'AI', id: 'fetch-ai', quote: 'usd', description: 'AI agent network focused on autonomous economic systems.' },
  { key: 'AAVE/USD', name: 'Aave', market: 'DeFi', id: 'aave', quote: 'usd', description: 'Leading DeFi lending protocol with liquidity markets and borrowing.' },
  { key: 'SAND/USD', name: 'The Sandbox', market: 'Gaming', id: 'the-sandbox', quote: 'usd', description: 'Metaverse gaming ecosystem with tokenized digital assets and lands.' },
  { key: 'MANA/USD', name: 'Decentraland', market: 'Metaverse', id: 'decentraland', quote: 'usd', description: 'Virtual world platform for land, assets, and digital experiences.' },
  { key: 'CHZ/USD', name: 'Chiliz', market: 'Sports', id: 'chiliz', quote: 'usd', description: 'Fan engagement and sports token ecosystem for digital collectibles.' },
  { key: 'IMX/USD', name: 'Immutable X', market: 'NFT', id: 'immutable-x', quote: 'usd', description: 'Layer-two NFT platform built to scale digital collectibles efficiently.' },
  { key: 'FLOW/USD', name: 'Flow', market: 'NFT / Gaming', id: 'flow', quote: 'usd', description: 'Blockchain designed for consumer-grade digital collectibles and gaming.' },
  { key: 'EGLD/USD', name: 'MultiversX', market: 'Layer 1', id: 'elrond-erd-2', quote: 'usd', description: 'High-throughput chain with sharding and scalable smart contract support.' },
  { key: 'DYDX/USD', name: 'dYdX', market: 'DeFi', id: 'dydx-chain', quote: 'usd', description: 'Decentralized derivatives exchange for margin and perpetual contracts.' },
  { key: 'ZIL/USD', name: 'Zilliqa', market: 'Layer 1', id: 'zilliqa', quote: 'usd', description: 'Blockchain with sharding architecture designed for scalable dApps.' },
  { key: 'MASK/USD', name: 'Mask Network', market: 'Web3', id: 'mask-network', quote: 'usd', description: 'Web3 infrastructure protocol connecting social platforms and blockchain apps.' },
  { key: 'ENJ/USD', name: 'Enjin', market: 'Gaming', id: 'enjincoin', quote: 'usd', description: 'Gaming ecosystem focused on tokenized digital assets and collectibles.' },
];

const FX_PAIRS = [
  { key: 'EUR/USD', type: 'fx', from: 'EUR', to: 'USD', name: 'Euro / US Dollar', description: 'Major FX pair tracking euro strength against the US dollar.' },
  { key: 'GBP/USD', type: 'fx', from: 'GBP', to: 'USD', name: 'Pound / US Dollar', description: 'Major FX pair reflecting GBP strength against USD.' },
  { key: 'USD/JPY', type: 'fx', from: 'USD', to: 'JPY', name: 'US Dollar / Japanese Yen', description: 'Key macro pair reflecting rate and risk sentiment.' },
  { key: 'AUD/USD', type: 'fx', from: 'AUD', to: 'USD', name: 'Australian Dollar / US Dollar', description: 'Commodity-linked FX pair sensitive to global risk conditions.' },
  { key: 'XAU/USD', type: 'crypto', id: 'gold', quote: 'usd', name: 'Gold / US Dollar', description: 'Precious metal benchmark tracking safe-haven price action.' },
] as const;

const MARKET_PAIRS = [...DEFAULT_CRYPTO_PAIRS, ...FX_PAIRS] as const;

type MarketPair = typeof MARKET_PAIRS[number]['key'];

const RANGE_OPTIONS: Timeframe[] = ['7D', '30D', '90D'];
const TOOL_OPTIONS: TradingTool[] = ['Crosshair', 'Trend', 'Indicators', 'Measure'];
const CHART_MODES: ChartMode[] = ['Candles', 'Line'];
const INDICATOR_OPTIONS: IndicatorMode[] = ['None', 'MA', 'RSI', 'MACD'];
const REFRESH_MS = 60_000;

const WATCHLIST = DEFAULT_CRYPTO_PAIRS.slice(0, 20).map((item) => ({
  pair: item.key,
  name: item.name,
  description: item.description,
  change: (Math.random() * 10 - 5),
}));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatPrice = (value: number, pair: MarketPair) => {
  if (pair === 'USD/JPY' || pair === 'XAU/USD') {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
  }
  if (pair === 'EUR/USD' || pair === 'GBP/USD' || pair === 'AUD/USD') {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

const buildFallbackData = (pair: MarketPair, days: number): CandleData[] => {
  const baseMap: Record<string, { open: number; high: number; low: number; close: number }> = {
    'BTC/USD': { open: 62000, high: 64000, low: 60000, close: 62800 },
    'ETH/USD': { open: 3100, high: 3300, low: 3000, close: 3210 },
    'SOL/USD': { open: 148, high: 152, low: 142, close: 150 },
    'BNB/USD': { open: 580, high: 610, low: 560, close: 600 },
    'XRP/USD': { open: 0.58, high: 0.62, low: 0.54, close: 0.59 },
    'ADA/USD': { open: 0.62, high: 0.68, low: 0.58, close: 0.64 },
    'DOGE/USD': { open: 0.16, high: 0.18, low: 0.15, close: 0.17 },
    'AVAX/USD': { open: 32, high: 35, low: 30, close: 33 },
    'LINK/USD': { open: 15.2, high: 16.5, low: 14.7, close: 15.8 },
    'MATIC/USD': { open: 0.8, high: 0.92, low: 0.74, close: 0.84 },
    'DOT/USD': { open: 6.6, high: 7.2, low: 6.1, close: 6.9 },
    'TRX/USD': { open: 0.12, high: 0.14, low: 0.11, close: 0.13 },
    'NEAR/USD': { open: 5.1, high: 5.8, low: 4.9, close: 5.4 },
    'ATOM/USD': { open: 8.8, high: 9.5, low: 8.1, close: 9.1 },
    'LTC/USD': { open: 72, high: 76, low: 68, close: 74 },
    'BCH/USD': { open: 355, high: 372, low: 340, close: 362 },
    'UNI/USD': { open: 7.1, high: 7.9, low: 6.7, close: 7.4 },
    'APT/USD': { open: 11.1, high: 12.3, low: 10.6, close: 11.8 },
    'ARB/USD': { open: 1.05, high: 1.19, low: 0.98, close: 1.12 },
    'OP/USD': { open: 2.4, high: 2.8, low: 2.2, close: 2.6 },
    'SUI/USD': { open: 0.78, high: 0.9, low: 0.72, close: 0.85 },
    'FIL/USD': { open: 5.5, high: 6.4, low: 5.1, close: 5.9 },
    'ALGO/USD': { open: 0.18, high: 0.2, low: 0.17, close: 0.19 },
    'EOS/USD': { open: 0.7, high: 0.74, low: 0.66, close: 0.71 },
    'TAO/USD': { open: 340, high: 370, low: 320, close: 350 },
    'WIF/USD': { open: 2.8, high: 3.3, low: 2.4, close: 2.9 },
    'PEPE/USD': { open: 0.000011, high: 0.000014, low: 0.000009, close: 0.000012 },
    'BONK/USD': { open: 0.000022, high: 0.000024, low: 0.000019, close: 0.000021 },
    'RNDR/USD': { open: 5.3, high: 5.9, low: 4.8, close: 5.6 },
    'ICP/USD': { open: 8.2, high: 9.1, low: 7.7, close: 8.5 },
    'FTM/USD': { open: 0.62, high: 0.7, low: 0.58, close: 0.65 },
    'THETA/USD': { open: 1.35, high: 1.55, low: 1.2, close: 1.42 },
    'XTZ/USD': { open: 1.22, high: 1.35, low: 1.14, close: 1.28 },
    'VET/USD': { open: 0.034, high: 0.039, low: 0.031, close: 0.036 },
    'INJ/USD': { open: 19.4, high: 21.6, low: 18.1, close: 20.2 },
    'GRT/USD': { open: 0.17, high: 0.19, low: 0.15, close: 0.17 },
    'HBAR/USD': { open: 0.07, high: 0.08, low: 0.066, close: 0.073 },
    'KAS/USD': { open: 0.09, high: 0.11, low: 0.084, close: 0.096 },
    'FET/USD': { open: 0.88, high: 1.06, low: 0.81, close: 0.94 },
    'AAVE/USD': { open: 78, high: 92, low: 72, close: 84 },
    'SAND/USD': { open: 0.6, high: 0.7, low: 0.55, close: 0.64 },
    'MANA/USD': { open: 0.55, high: 0.62, low: 0.5, close: 0.57 },
    'CHZ/USD': { open: 0.09, high: 0.11, low: 0.08, close: 0.09 },
    'IMX/USD': { open: 1.22, high: 1.46, low: 1.12, close: 1.31 },
    'FLOW/USD': { open: 0.82, high: 0.96, low: 0.75, close: 0.88 },
    'EGLD/USD': { open: 38, high: 44, low: 35, close: 40 },
    'DYDX/USD': { open: 2.4, high: 2.9, low: 2.2, close: 2.6 },
    'ZIL/USD': { open: 0.04, high: 0.05, low: 0.037, close: 0.042 },
    'MASK/USD': { open: 4.2, high: 4.9, low: 3.9, close: 4.5 },
    'ENJ/USD': { open: 0.3, high: 0.35, low: 0.28, close: 0.32 },
    'EUR/USD': { open: 1.08, high: 1.1, low: 1.07, close: 1.09 },
    'GBP/USD': { open: 1.27, high: 1.29, low: 1.25, close: 1.28 },
    'USD/JPY': { open: 149, high: 151, low: 148, close: 150 },
    'AUD/USD': { open: 0.66, high: 0.67, low: 0.65, close: 0.66 },
    'XAU/USD': { open: 2320, high: 2385, low: 2300, close: 2360 },
  };

  const base = baseMap[pair] ?? baseMap['BTC/USD'];
  const values: CandleData[] = [];
  let prev = base.open;

  for (let i = 0; i < days; i++) {
    const drift = (Math.sin((i + 1) * 0.9) * 0.012) + (i - days / 2) * 0.002;
    const open = prev;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + 0.01 + i * 0.001);
    const low = Math.min(open, close) * (1 - 0.01 - i * 0.001);

    values.push({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
    });

    prev = close;
  }

  return values;
};

const fetchCryptoCandleData = async (pair: MarketPair, days: number) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair) as typeof MARKET_PAIRS[number] | undefined;
  const metadata = DEFAULT_CRYPTO_PAIRS.find((item) => item.key === pair);
  if (!config || !metadata?.id) {
    return buildFallbackData(pair, days);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${metadata.id}/ohlc?vs_currency=${metadata.quote}&days=${days}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const raw = await response.json();
    const values = Array.isArray(raw) ? raw.slice(-days) : [];

    if (!values.length) {
      return buildFallbackData(pair, days);
    }

    return values.map(([timestamp, open, high, low, close]) => ({
      date: new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }));
  } catch (error) {
    console.error(`Error loading ${pair} data`, error);
    return buildFallbackData(pair, days);
  }
};

const fetchFxCandleData = async (pair: MarketPair, days: number) => {
  const config = MARKET_PAIRS.find((item) => item.key === pair) as typeof MARKET_PAIRS[number] | undefined;
  if (!config || !('from' in config) || !('to' in config)) {
    return buildFallbackData(pair, days);
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Math.max(days - 1, 0));

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const response = await fetch(
      `https://api.frankfurter.app/${startStr}..${endStr}?from=${config.from}&to=${config.to}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch FX data');
    }

    const json = await response.json();
    const entries = Object.entries(json.rates || {}).slice(-days);

    if (!entries.length) {
      return buildFallbackData(pair, days);
    }

    let previous = Number(entries[0][1][config.to]);

    return entries.map(([dateString, rates]) => {
      const rate = Number(rates[config.to]);
      const open = previous;
      const close = rate;
      const drift = clamp(Math.abs(close - open) * 0.7, 0.0004, 0.02);
      const high = Math.max(open, close) * (1 + drift);
      const low = Math.min(open, close) * (1 - drift);

      previous = close;

      return {
        date: new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        open: Number(open.toFixed(6)),
        high: Number(high.toFixed(6)),
        low: Number(low.toFixed(6)),
        close: Number(close.toFixed(6)),
      };
    });
  } catch (error) {
    console.error(`Error loading ${pair} FX data`, error);
    return buildFallbackData(pair, days);
  }
};

const fetchPairData = async (pair: MarketPair, days: number): Promise<CandleData[]> => {
  if (DEFAULT_CRYPTO_PAIRS.some((item) => item.key === pair)) {
    return fetchCryptoCandleData(pair, days);
  }

  return fetchFxCandleData(pair, days);
};

const CandleChart = ({
  data,
  selectedPair,
  hoverIndex,
  setHoverIndex,
  activeTool,
  chartMode,
  indicatorMode,
}: {
  data: CandleData[];
  selectedPair: MarketPair;
  hoverIndex: number | null;
  setHoverIndex: (value: number | null) => void;
  activeTool: TradingTool;
  chartMode: ChartMode;
  indicatorMode: IndicatorMode;
}) => {
  const width = 960;
  const height = 520;
  const padding = 36;
  const maxPrice = Math.max(...data.map((d) => d.high));
  const minPrice = Math.min(...data.map((d) => d.low));
  const priceRange = maxPrice - minPrice || 1;
  const step = (width - padding * 2) / Math.max(data.length, 1);
  const candleWidth = clamp(step * 0.62, 6, 18);

  const closePath = data
    .map((point, index) => {
      const x = padding + index * step + step / 2;
      const y = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const activeIndex = hoverIndex ?? data.length - 1;
  const hoveredPoint = data[activeIndex];
  const hoverX = padding + activeIndex * step + step / 2;
  const hoverY = padding + ((maxPrice - hoveredPoint.close) / priceRange) * (height - padding * 2);

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding + (i / 4) * (height - padding * 2);
    return <line key={y} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#2a2f3b" strokeDasharray="4 6" />;
  });

  const averageLine = data.map((point, index) => {
    const x = padding + index * step + step / 2;
    const avg = data.slice(Math.max(0, index - 5), index + 1).reduce((sum, val) => sum + val.close, 0) / Math.max(1, Math.min(6, index + 1));
    const y = padding + ((maxPrice - avg) / priceRange) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-xl">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        style={{ cursor: activeTool === 'Crosshair' ? 'crosshair' : 'default' }}
        role="img"
        aria-label="Market candles"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - rect.left;
          const ratio = clamp(relativeX / rect.width, 0, 1);
          const nextIndex = Math.min(data.length - 1, Math.max(0, Math.floor(ratio * data.length)));
          setHoverIndex(nextIndex);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines}

        {indicatorMode !== 'None' && (
          <path d={averageLine} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.8} />
        )}

        {chartMode === 'Line' ? (
          <path d={closePath} fill="none" stroke="#60a5fa" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          <>
            <path d={closePath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((point, index) => {
              const x = padding + index * step + step / 2;
              const yOpen = padding + ((maxPrice - point.open) / priceRange) * (height - padding * 2);
              const yClose = padding + ((maxPrice - point.close) / priceRange) * (height - padding * 2);
              const yHigh = padding + ((maxPrice - point.high) / priceRange) * (height - padding * 2);
              const yLow = padding + ((maxPrice - point.low) / priceRange) * (height - padding * 2);
              const isUp = point.close >= point.open;
              const color = isUp ? '#22c55e' : '#ef4444';
              const bodyY = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(Math.abs(yClose - yOpen), 4);

              return (
                <g key={`${point.date}-${index}`}>
                  <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
                  <rect x={x - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} rx={3} fill={color} opacity={0.8} />
                </g>
              );
            })}
          </>
        )}

        <line x1={hoverX} x2={hoverX} y1={padding} y2={height - padding} stroke="#93c5fd" strokeDasharray="6 6" opacity={0.8} />
        <line x1={padding} x2={width - padding} y1={hoverY} y2={hoverY} stroke="#93c5fd" strokeDasharray="6 6" opacity={0.8} />
      </svg>

      <div className="absolute left-3 top-3 rounded-md border border-blue-500/40 bg-slate-900/80 px-2 py-1 text-xs text-blue-200 shadow-lg">
        {hoveredPoint ? `${hoveredPoint.date}: ${formatPrice(hoveredPoint.close, selectedPair)}` : 'No price data'}
      </div>
    </div>
  );
};

export const CryptoChart = () => {
  const [selectedPair, setSelectedPair] = useState<MarketPair>('BTC/USD');
  const [selectedRange, setSelectedRange] = useState<Timeframe>('7D');
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<TradingTool>('Crosshair');
  const [chartMode, setChartMode] = useState<ChartMode>('Candles');
  const [indicatorMode, setIndicatorMode] = useState<IndicatorMode>('MA');
  const [tradeSide, setTradeSide] = useState<'Buy' | 'Sell'>('Buy');
  const [tradeVolume, setTradeVolume] = useState<number>(0.5);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const daysMap: Record<Timeframe, number> = { '7D': 7, '30D': 30, '90D': 90 };
        const nextData = await fetchPairData(selectedPair, daysMap[selectedRange]);
        if (isMounted) {
          setData(nextData);
          setHoverIndex(null);
        }
      } catch (error) {
        console.error('Error loading market overview data:', error);
        if (isMounted) {
          const daysMap: Record<Timeframe, number> = { '7D': 7, '30D': 30, '90D': 90 };
          setData(buildFallbackData(selectedPair, daysMap[selectedRange]));
          setHoverIndex(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const interval = window.setInterval(() => {
      loadData();
    }, REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [selectedPair, selectedRange]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#13151f] p-8 text-center text-gray-400">
        Loading market data...
      </div>
    );
  }

  const latest = data[data.length - 1];
  const start = data[0];
  const move = latest && start ? (((latest.close - start.open) / start.open) * 100) : 0;
  const pointerPrice = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex].close : latest?.close ?? 0;
  const pointerLabel = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex].date : 'Live';

  const actionButtonClass = (side: 'Buy' | 'Sell') => {
    const active = tradeSide === side;
    const base = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors';
    return active
      ? side === 'Buy'
        ? `${base} bg-green-600 text-white shadow-lg shadow-green-900/40`
        : `${base} bg-red-600 text-white shadow-lg shadow-red-900/40`
      : `${base} bg-[#1a1d29] text-gray-300 hover:bg-[#242b38]`;
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#13151f] p-5 shadow-2xl shadow-slate-950/40">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-800 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white">
              {selectedPair.split('/')[0].slice(0, 2)}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Terminal</div>
              <div className="text-xl font-semibold text-white">{selectedPair}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm">
            <div className="text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Last</div>
              <div className="font-semibold text-white">{formatPrice(latest?.close ?? 0, selectedPair)}</div>
            </div>
            <div className="text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Change</div>
              <div className={`font-semibold ${move >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {move >= 0 ? '+' : ''}
                {move.toFixed(2)}%
              </div>
            </div>
            <div className="text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Status</div>
              <div className="font-semibold text-green-500">Online</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {TOOL_OPTIONS.map((tool) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeTool === tool ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedRange === range ? 'bg-blue-600 text-white' : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {MARKET_PAIRS.map((pair) => (
              <button
                key={pair.key}
                onClick={() => setSelectedPair(pair.key as MarketPair)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedPair === pair.key ? 'bg-cyan-600 text-white' : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {pair.key}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {CHART_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  chartMode === mode ? 'bg-emerald-600 text-white' : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-300">
              <span className="text-gray-400">Hovered:</span>{' '}
              <span className="font-semibold text-white">{formatPrice(pointerPrice, selectedPair)}</span>
            </div>
            <div className="flex items-center gap-2">
              {INDICATOR_OPTIONS.map((indicator) => (
                <button
                  key={indicator}
                  type="button"
                  onClick={() => setIndicatorMode(indicator)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                    indicatorMode === indicator ? 'bg-slate-700 text-white' : 'bg-[#1a1d29] text-gray-300 hover:bg-[#232734]'
                  }`}
                >
                  {indicator}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#10141d] p-0">
            <CandleChart
              data={data}
              selectedPair={selectedPair}
              hoverIndex={hoverIndex}
              setHoverIndex={setHoverIndex}
              activeTool={activeTool}
              chartMode={chartMode}
              indicatorMode={indicatorMode}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-[#10141d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Watchlist</div>
                <div className="text-lg font-semibold text-white">Markets</div>
              </div>
              <div className="rounded-full border border-gray-700 bg-[#1a1d29] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-300">
                {selectedRange}
              </div>
            </div>

            <div className="space-y-2">
              {WATCHLIST.map((item) => (
                <button
                  key={item.pair}
                  type="button"
                  onClick={() => setSelectedPair(item.pair as MarketPair)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                    selectedPair === item.pair ? 'border border-blue-500/30 bg-blue-600/20 text-white' : 'bg-[#171c27] text-gray-300 hover:bg-[#1d2430]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{item.pair}</div>
                    <div className="text-[10px] text-gray-400">{item.name}</div>
                  </div>
                  <div className={`text-xs font-semibold ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.change >= 0 ? '+' : ''}
                    {item.change.toFixed(2)}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#10141d] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Order Ticket</div>
                <div className="text-lg font-semibold text-white">{selectedPair}</div>
              </div>
              <div className="text-xs text-gray-400">{pointerLabel}</div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTradeSide('Buy')} className={actionButtonClass('Buy')}>
                Buy
              </button>
              <button type="button" onClick={() => setTradeSide('Sell')} className={actionButtonClass('Sell')}>
                Sell
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
                <span className="text-gray-400">Price</span>
                <span className="font-semibold text-white">{formatPrice(latest?.close ?? 0, selectedPair)}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
                <span className="text-gray-400">Volume</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={tradeVolume}
                  onChange={(e) => setTradeVolume(Number(e.target.value) || 0.01)}
                  className="w-20 bg-transparent text-right text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#171c27] px-3 py-2">
                <span className="text-gray-400">Estimated</span>
                <span className="font-semibold text-white">{formatCurrency((latest?.close ?? 0) * tradeVolume)}</span>
              </div>
            </div>

            <button
              type="button"
              className={`mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                tradeSide === 'Buy' ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              {tradeSide} {selectedPair}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default CryptoChart;
