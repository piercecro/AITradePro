import { useEffect, useRef } from 'react';
import { TradePage as TradingPage } from '../pages/TradePage';

/** Keeps internal implementation notes out of the visible trade page copy. */
export const TradePage = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const removeLabel = () => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.toLowerCase().includes('simulated')) {
          node.textContent = node.textContent.replace(/simulated\s*/gi, '');
        }
      }
    };

    removeLabel();
    const observer = new MutationObserver(removeLabel);
    observer.observe(container, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={pageRef}><TradingPage /></div>;
};
