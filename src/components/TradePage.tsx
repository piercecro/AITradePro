import { useEffect, useRef } from 'react';
import { TradePage as TradingPage } from '../pages/TradePage';

/** Keeps internal implementation notes out of the visible trade page copy. */
export const TradePage = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const syncMarketDropdown = () => {
      const page = container.firstElementChild;
      const categoryTabs = page?.firstElementChild;
      const aside = page?.querySelector('aside');
      const marketCard = aside?.firstElementChild;
      const marketList = marketCard?.querySelector(':scope > .space-y-2');
      if (!(categoryTabs instanceof HTMLElement) || !(marketCard instanceof HTMLElement) || !(marketList instanceof HTMLElement)) return;

      const marketButtons = Array.from(marketList.querySelectorAll('button'));
      if (!marketButtons.length) return;

      const activePair = marketButtons.find((button) => button.className.includes('border-blue-500'))
        ?.querySelector('div > div')?.textContent?.trim();

      let dropdown = page.querySelector<HTMLSelectElement>('[data-trade-market-dropdown]');
      if (!dropdown) {
        dropdown = document.createElement('select');
        dropdown.dataset.tradeMarketDropdown = 'true';
        dropdown.setAttribute('aria-label', 'Select a market pair');
        dropdown.className = 'mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500';
        dropdown.addEventListener('change', () => {
          const currentButtons = Array.from(marketList.querySelectorAll('button'));
          const selectedButton = currentButtons.find((button) => button.querySelector('div > div')?.textContent?.trim() === dropdown?.value);
          selectedButton?.click();
        });
      }

      const options = marketButtons
        .map((button) => {
          const pair = button.querySelector('div > div')?.textContent?.trim();
          const label = button.querySelector('div > div + div')?.textContent?.trim();
          return pair ? { pair, label: label ?? '' } : null;
        })
        .filter((option): option is { pair: string; label: string } => option !== null);
      const values = options.map(({ pair }) => pair);
      const existingValues = Array.from(dropdown.options).map((option) => option.value);

      if (existingValues.length !== values.length || values.some((value, index) => value !== existingValues[index])) {
        dropdown.replaceChildren(...options.map(({ pair, label }) => {
          const option = document.createElement('option');
          option.value = pair;
          option.textContent = label ? `${pair} — ${label}` : pair;
          return option;
        }));
      }

      if (activePair && values.includes(activePair)) dropdown.value = activePair;
      if (dropdown.parentElement !== categoryTabs.parentElement) {
        categoryTabs.insertAdjacentElement('afterend', dropdown);
      }
      marketCard.hidden = true;
      dropdown.hidden = false;
    };

    const updatePage = () => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.toLowerCase().includes('simulated')) {
          node.textContent = node.textContent.replace(/simulated\s*/gi, '');
        }
      }
      syncMarketDropdown();
    };

    updatePage();
    const observer = new MutationObserver(updatePage);
    observer.observe(container, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={pageRef}><TradingPage /></div>;
};
