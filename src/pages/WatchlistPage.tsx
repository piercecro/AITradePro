import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';

interface ExchangeSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  isSpotTradingAllowed?: boolean;
}

interface ExchangeInfoResponse {
  symbols?: ExchangeSymbol[];
}

interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

interface MarketPair extends ExchangeSymbol {
  price: number;
  change24h: number;
  volume: number;
}

const PAGE_SIZE = 20;
const REFRESH_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 6_000;
const BINANCE_APIS = [
  'https://api.binance.com/api/v3',
  'https://api1.binance.com/api/v3',
  'https://data-api.binance.vision/api/v3',
];

async function fetchMarketData<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown;

  for (const api of BINANCE_APIS) {
    if (signal?.aborted) throw new DOMException('Request was aborted.', 'AbortError');

    const controller = new AbortController();
    const abortFromParent = () => controller.abort();
    signal?.addEventListener('abort', abortFromParent, { once: true });
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${api}${path}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Market data service returned ${response.status}.`);
      return await response.json() as T;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Request was aborted.', 'AbortError');
      lastError = controller.signal.aborted
        ? new Error('Market data request timed out.')
        : error;
    } finally {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromParent);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to reach the market data service.');
}

export const WatchlistPage = () => {
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refreshPrices = useCallback(async (signal?: AbortSignal) => {
    const tickers = await fetchMarketData<Ticker24h[]>('/ticker/24hr', signal);
    const tickerBySymbol = new Map(tickers.map((ticker) => [ticker.symbol, ticker]));

    setPairs((current) => current.map((pair) => {
      const ticker = tickerBySymbol.get(pair.symbol);
      if (!ticker) return pair;
      const price = Number(ticker.lastPrice);
      const change24h = Number(ticker.priceChangePercent);
      const volume = Number(ticker.quoteVolume);
      return {
        ...pair,
        price: Number.isFinite(price) ? price : pair.price,
        change24h: Number.isFinite(change24h) ? change24h : pair.change24h,
        volume: Number.isFinite(volume) ? volume : pair.volume,
      };
    }));
    setUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let marketsLoaded = false;
    let marketLoadInFlight = false;

    const loadMarkets = async () => {
      if (marketLoadInFlight) return;
      marketLoadInFlight = true;
      setLoading(true);
      setError('');
      try {
        const [info, tickerData] = await Promise.all([
          fetchMarketData<ExchangeInfoResponse>('/exchangeInfo', controller.signal),
          fetchMarketData<Ticker24h[]>('/ticker/24hr', controller.signal),
        ]);
        if (!active) return;

        const tickerBySymbol = new Map(tickerData.map((ticker) => [ticker.symbol, ticker]));
        const livePairs = (info.symbols ?? [])
          .filter((symbol) => symbol.status === 'TRADING' && symbol.isSpotTradingAllowed !== false)
          .map((symbol): MarketPair | null => {
            const ticker = tickerBySymbol.get(symbol.symbol);
            if (!ticker) return null;
            const price = Number(ticker.lastPrice);
            const change24h = Number(ticker.priceChangePercent);
            const volume = Number(ticker.quoteVolume);
            if (!Number.isFinite(price)) return null;
            return {
              ...symbol,
              price,
              change24h: Number.isFinite(change24h) ? change24h : 0,
              volume: Number.isFinite(volume) ? volume : 0,
            };
          })
          .filter((pair): pair is MarketPair => pair !== null)
          .sort((a, b) => a.symbol.localeCompare(b.symbol));

        setPairs(livePairs);
        setUpdatedAt(new Date());
        marketsLoaded = livePairs.length > 0;
        if (!marketsLoaded) setError('The exchange returned no live spot market pairs.');
      } catch (loadError) {
        if (!active || (loadError instanceof DOMException && loadError.name === 'AbortError')) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load live market pairs.');
      } finally {
        marketLoadInFlight = false;
        if (active) setLoading(false);
      }
    };

    void loadMarkets();
    const intervalId = window.setInterval(() => {
      if (!active) return;
      if (!marketsLoaded) {
        void loadMarkets();
        return;
      }

      setRefreshing(true);
      void refreshPrices(controller.signal)
        .then(() => { if (active) setError(''); })
        .catch((refreshError) => {
          if (active && !(refreshError instanceof DOMException && refreshError.name === 'AbortError')) {
            setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh prices.');
          }
        })
        .finally(() => {
          if (active) setRefreshing(false);
        });
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshPrices]);

  const filteredPairs = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    return normalizedQuery
      ? pairs.filter((pair) => pair.symbol.includes(normalizedQuery)
        || pair.baseAsset.includes(normalizedQuery)
        || pair.quoteAsset.includes(normalizedQuery))
      : pairs;
  }, [pairs, query]);

  const pageCount = Math.max(1, Math.ceil(filteredPairs.length / PAGE_SIZE));
  const visiblePairs = filteredPairs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const firstItem = filteredPairs.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastItem = Math.min((page + 1) * PAGE_SIZE, filteredPairs.length);
  const formatPrice = (price: number) => price.toLocaleString('en-US', {
    maximumFractionDigits: price >= 1 ? 4 : 8,
  });
  const formatVolume = (volume: number) => new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(volume);

  return (
    <div className="min-h-screen bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1360px]">
        <section className="rounded-2xl border border-[#dfe7f0] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-800">Market watchlist</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Live Binance spot markets · {pairs.length.toLocaleString()} pairs available
                {updatedAt && ` · Updated ${updatedAt.toLocaleTimeString()}`}
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#dfe7f0] bg-[#f8fbff] px-3 py-2 sm:w-64 sm:flex-none">
                <Search size={15} className="shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                  placeholder="Search pairs or assets"
                  aria-label="Search market pairs"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex items-center gap-1 text-xs text-slate-500" title="Prices refresh every 30 seconds">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">30s</span>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error} Retrying automatically; check your connection or try again shortly.
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-[#edf2f7]">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Pair</span><span className="text-right">Last price</span><span className="text-right">24h</span><span className="text-right">24h volume</span>
              </div>
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">Loading live market pairs…</div>
              ) : visiblePairs.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">No market pairs match your search.</div>
              ) : visiblePairs.map((pair) => (
                <div key={pair.symbol} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] items-center border-t border-[#edf2f7] px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfeaff] text-[10px] font-black text-[#1d73f5]">{pair.baseAsset.slice(0, 3)}</div>
                    <div><div className="font-bold text-slate-800">{pair.baseAsset}<span className="text-slate-400">/{pair.quoteAsset}</span></div><div className="text-[10px] text-slate-400">{pair.symbol}</div></div>
                  </div>
                  <span className="text-right font-semibold text-slate-800">{formatPrice(pair.price)}</span>
                  <span className={`text-right font-semibold ${pair.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%</span>
                  <span className="text-right font-medium text-slate-600">{formatVolume(pair.volume)} {pair.quoteAsset}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{filteredPairs.length ? `Showing ${firstItem}–${lastItem} of ${filteredPairs.length.toLocaleString()}` : 'No results'} · 20 per page</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loading} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe7f0] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
              <span className="min-w-20 text-center text-xs text-slate-500">Page {Math.min(page + 1, pageCount)} of {pageCount}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1 || loading} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe7f0] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={16} /></button>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-400">Market data is provided by Binance public spot market endpoints and may be delayed or unavailable in some regions.</p>
        </section>
      </div>
    </div>
  );
};

export default WatchlistPage;
