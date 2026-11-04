import { useEffect, useRef } from 'react';
import { TradePage as TradingPage } from '../pages/TradePage';

/** Keeps internal implementation notes out of the visible trade page copy. */
export const TradePage = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const syncMarketDropdown = () => {
      const root = container.firstElementChild as HTMLElement | null;
      const categoryTabs = root?.querySelector(':scope > div:first-child') as HTMLElement | null;
      const marketCard = root?.querySelector('aside > div') as HTMLElement | null;
      const marketList = marketCard?.querySelector(':scope > div:nth-of-type(3)') as HTMLElement | null;

      if (!categoryTabs || !marketCard || !marketList) return;
      const marketButtons = Array.from(marketList.querySelectorAll('button'));
      if (!marketButtons.length) return;

      let dropdown = root.querySelector<HTMLSelectElement>('[data-trade-market-dropdown]');
      if (!dropdown) {
        dropdown = document.createElement('select');
        dropdown.dataset.tradeMarketDropdown = 'true';
        dropdown.setAttribute('aria-label', 'Select a market pair');
        dropdown.className = 'mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500';
        dropdown.addEventListener('change', () => {
          const matchedButton = marketButtons.find((button) => {
            const pair = button.querySelector('div > div')?.textContent?.trim();
            return pair === dropdown?.value;
          });
          matchedButton?.click();
        });
      }

      const options = marketButtons
        .map((button) => {
          const pair = button.querySelector('div > div')?.textContent?.trim();
          const label = button.querySelector('div > div + div')?.textContent?.trim();
          return pair ? { pair, label: label ?? '' } : null;
        })
        .filter((option): option is { pair: string; label: string } => option !== null);

      if (dropdown.options.length !== options.length || options.some((option, index) => dropdown.options[index]?.value !== option.pair)) {
        dropdown.replaceChildren(...options.map(({ pair, label }) => {
          const option = document.createElement('option');
          option.value = pair;
          option.textContent = label ? `${pair} — ${label}` : pair;
          return option;
        }));
      }

      const active = marketButtons.find((button) => button.className.includes('border-blue-500'))
        ?.querySelector('div > div')?.textContent?.trim();
      if (active && options.some((option) => option.pair === active)) {
        dropdown.value = active;
      }

      if (dropdown.parentElement !== categoryTabs.parentElement) {
        categoryTabs.insertAdjacentElement('afterend', dropdown);
      }

      marketCard.hidden = true;
      dropdown.hidden = false;
    };

    const cleanupText = () => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.toLowerCase().includes('simulated')) {
          node.textContent = node.textContent.replace(/simulated\s*/gi, '');
        }
      }
    };

    cleanupText();
    syncMarketDropdown();
    const observer = new MutationObserver(() => {
      cleanupText();
      syncMarketDropdown();
    });
    observer.observe(container, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={pageRef}><TradingPage /></div>;
};
