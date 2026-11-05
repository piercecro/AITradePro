import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TradePage as TradingPage } from '../pages/TradePage';
import { TradeOrderTicket } from './TradeOrderTicket';
import { TradePricesProvider } from './TradePricesContext';

const TradePageLayout = () => {
  const [sidebar, setSidebar] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-trade-page-root]');
    const target = root?.querySelector<HTMLElement>('aside');
    if (!target) return;

    const oldDisplay = target.style.display;
    const oldFlexDirection = target.style.flexDirection;
    const oldGap = target.style.gap;
    target.style.display = 'flex';
    target.style.flexDirection = 'column';
    target.style.gap = '12px';
    setSidebar(target);

    return () => {
      target.style.display = oldDisplay;
      target.style.flexDirection = oldFlexDirection;
      target.style.gap = oldGap;
    };
  }, []);

  return (
    <div data-trade-page-root>
      <TradingPage />
      {sidebar && createPortal(
        <div style={{ order: -1 }}>
          <TradeOrderTicket />
        </div>,
        sidebar,
      )}
    </div>
  );
};

/** Restores the order ticket above the market list without intercepting chart controls. */
export const TradePage = () => (
  <TradePricesProvider>
    <TradePageLayout />
  </TradePricesProvider>
);

export default TradePage;
