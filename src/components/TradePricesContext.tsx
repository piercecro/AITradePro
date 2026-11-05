import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchLivePrices, type LivePriceMap } from '../lib/livePrices';

const TradePricesContext = createContext<LivePriceMap>({});

const sameQuotes = (current: LivePriceMap, next: LivePriceMap) => {
  const currentSymbols = Object.keys(current);
  const nextSymbols = Object.keys(next);
  return currentSymbols.length === nextSymbols.length && nextSymbols.every((symbol) => {
    const previous = current[symbol];
    const quote = next[symbol];
    return previous?.price === quote.price &&
      previous?.change24h === quote.change24h &&
      previous?.id === quote.id;
  });
};

export const TradePricesProvider = ({ children }: { children: ReactNode }) => {
  const [prices, setPrices] = useState<LivePriceMap>({});

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    // Schedule after each request finishes rather than using setInterval, so
    // slow network responses can never overlap and compete with order clicks.
    const refresh = async () => {
      try {
        const nextPrices = await fetchLivePrices();
        if (active && Object.keys(nextPrices).length > 0) {
          setPrices((current) => sameQuotes(current, nextPrices) ? current : nextPrices);
        }
      } finally {
        if (active) timer = window.setTimeout(() => void refresh(), 5000);
      }
    };

    void refresh();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return <TradePricesContext.Provider value={prices}>{children}</TradePricesContext.Provider>;
};

export const useTradePrices = () => useContext(TradePricesContext);
