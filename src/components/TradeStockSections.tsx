import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

type MarketRow = {
  ticker: string;
  name: string;
  price: string;
  change: number;
  icon: string;
  color: string;
  preMarketChange?: number;
};

const gainers: MarketRow[] = [
  { ticker: 'OMH', name: 'Ohmyhome Limited', price: '15.55', change: 432.53, preMarketChange: 421.8, icon: '◉', color: '#f05b10' },
  { ticker: 'CRCT', name: 'Cricut, Inc.', price: '8.88', change: 48.74, preMarketChange: 46.9, icon: 'C', color: '#08b88a' },
  { ticker: 'LYEL', name: 'Lyell Immunopharma, Inc.', price: '15.43', change: 43.27, preMarketChange: 41.3, icon: 'L', color: '#b8c5cb' },
  { ticker: 'DKI', name: 'DarkIris Inc.', price: '2.08', change: 38.67, preMarketChange: 36.2, icon: 'D', color: '#101820' },
  { ticker: 'ADV', name: 'Advantage Solutions Inc.', price: '39.67', change: 36.09, preMarketChange: 34.8, icon: 'A', color: '#073c36' },
  { ticker: 'TREE', name: 'LendingTree, Inc.', price: '38.35', change: 32.84, preMarketChange: 31.7, icon: '↗', color: '#08b88a' },
];

const losers: MarketRow[] = [
  { ticker: 'PASW', name: 'Ping An Biomedical Co., Ltd.', price: '2.93', change: -40.93, preMarketChange: -38.6, icon: 'ℎ', color: '#e9eef5' },
  { ticker: 'NRIX', name: 'Nurix Therapeutics, Inc.', price: '15.95', change: -38.23, preMarketChange: -36.1, icon: '♦', color: '#f04432' },
  { ticker: 'RZAI', name: 'Roze AI Inc.', price: '2.51', change: -35.14, preMarketChange: -33.4, icon: 'R', color: '#e7e9ec' },
  { ticker: 'SUPN', name: 'Supernus, Inc.', price: '28.21', change: 0.21, preMarketChange: 0.46, icon: '✳', color: '#e9f1fb' },
  { ticker: 'DOX', name: 'Amdocs Limited', price: '43.66', change: -30.07, preMarketChange: -28.5, icon: 'D', color: '#17191d' },
  { ticker: 'ECG', name: 'Everus Construction Group, Inc.', price: '79.71', change: -29.29, preMarketChange: -27.8, icon: 'E', color: '#e9f1fb' },
];

const community = [
  { ticker: 'AMD', name: 'Advanced Micro Devices Inc', price: '488.78', change: 1.01, icon: '◩', color: '#17191d' },
  { ticker: 'VST', name: 'Vistra Corp.', price: '120.29', change: -13.83, icon: 'V', color: '#064477' },
  { ticker: 'UBER', name: 'Uber Technologies, Inc.', price: '69.87', change: 4.91, icon: '▪', color: '#17191d' },
  { ticker: 'SPCX', name: 'Space Exploration Technologies', price: '135.92', change: -3.81, icon: '✕', color: '#17191d' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', price: '555.80', change: 6.68, icon: '▦', color: '#eaf2ff' },
  { ticker: 'APP', name: 'Applovin Corporation', price: '271.75', change: 10.69, icon: '△', color: '#f2f4f8' },
];

const volumeStocks = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: '349.51', change: 5.31, icon: '●', color: '#17191d' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', price: '555.80', change: 6.68, icon: '▦', color: '#eaf2ff' },
  { ticker: 'AMD', name: 'Advanced Micro Devices, Inc.', price: '488.78', change: 1.01, icon: '◩', color: '#17191d' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', price: '200.13', change: -3.17, icon: '◉', color: '#17191d' },
  { ticker: 'MU', name: 'Micron Technology, Inc.', price: '795.23', change: -7.0, icon: '✦', color: '#104985' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', price: '266.03', change: 6.12, icon: 'a', color: '#ff6b00' },
];

const volatileStocks = [
  { ticker: 'PARA', name: 'Parabolic Technologies, Inc.', price: '0.32', change: -88.27, icon: 'b', color: '#edf2fa' },
  { ticker: 'CHSN', name: 'Chanson International Holding', price: '3.36', change: -0.59, icon: 'C', color: '#f0f2f5' },
  { ticker: 'PASW', name: 'Ping An Biomedical Co., Ltd.', price: '2.93', change: -40.93, icon: 'ℎ', color: '#edf2fa' },
  { ticker: 'OMH', name: 'Ohmyhome Limited', price: '15.55', change: 432.53, icon: '◉', color: '#f05b10' },
  { ticker: 'CENN', name: 'Cenntro Inc.', price: '0.1770', change: -40.54, icon: 'C', color: '#0877b8' },
  { ticker: 'WXM', name: 'WF International Limited', price: '2.08', change: 4.0, icon: '△', color: '#e9f1fb' },
];

const priceLabel = (price: string) => <>{price}<span className="ml-1 text-[9px]">USD</span></>;

const StockRows = ({ rows, mode }: { rows: MarketRow[]; mode: 'daily' | 'compact' }) => (
  <div>{rows.map((row) => <div key={row.ticker} className={`grid items-center gap-3 border-b border-[#edf0f3] last:border-0 ${mode === 'daily' ? 'grid-cols-[minmax(0,1fr)_84px_78px] py-3' : 'grid-cols-[minmax(0,1fr)_76px] py-2.5'}`}>
    <div className="flex min-w-0 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: row.color, color: row.color === '#e9eef5' || row.color === '#e9f1fb' || row.color === '#edf2fa' || row.color === '#f0f2f5' || row.color === '#eaf2ff' ? '#536274' : '#fff' }}>{row.icon}</span><div className="min-w-0"><div className="truncate text-xs font-medium text-slate-900">{row.name} <span className="ml-0.5 text-blue-600">◔</span></div><span className="mt-1 inline-block rounded bg-[#f1f2f4] px-1.5 py-0.5 text-[9px] font-bold text-slate-700">{row.ticker}</span></div></div>
    <div className="text-right text-xs font-medium text-slate-900">{priceLabel(row.price)}</div>
    {mode === 'daily' && <div className={`rounded-md px-1.5 py-1 text-right text-xs font-bold text-white ${row.change >= 0 ? 'bg-[#008b74]' : 'bg-[#d93043]'}`}>{row.change > 0 ? '+' : '−'}{Math.abs(row.change).toFixed(2)}%</div>}
    {mode === 'compact' && <div className={`text-right text-xs font-medium ${row.change >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>{row.change > 0 ? '+' : '−'}{Math.abs(row.change).toFixed(2)}%</div>}
  </div>)}</div>
);

const GainerLoserCard = ({ title, rows, highlight }: { title: string; rows: MarketRow[]; highlight?: boolean }) => {
  const [session, setSession] = useState<'Regular hours' | 'Pre-market'>('Regular hours');
  const shownRows = useMemo(() => session === 'Regular hours' ? rows : rows.map((row) => ({ ...row, change: row.preMarketChange ?? row.change * 0.92 })), [rows, session]);
  return <article className="px-1 sm:px-2">
    <h3 className={`mb-4 text-[22px] font-semibold tracking-[-0.035em] ${highlight ? 'text-[#3865ff]' : 'text-slate-900'}`}>{title}<ChevronRight className="ml-0.5 inline" size={19} /></h3>
    <div className="mb-4 flex gap-2 text-xs"><button type="button" onClick={() => setSession('Regular hours')} className={`rounded-lg px-4 py-2 font-semibold ${session === 'Regular hours' ? 'bg-[#f1f2f3] text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>Regular hours</button><button type="button" onClick={() => setSession('Pre-market')} className={`rounded-lg px-4 py-2 ${session === 'Pre-market' ? 'bg-[#f1f2f3] font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>Pre-market</button></div>
    <StockRows rows={shownRows} mode="daily" />
    <a href="#stocks" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3865ff]">See all stocks with {highlight ? 'largest daily growth' : 'largest daily drop'} <ChevronRight size={14} /></a>
  </article>;
};

const CompactList = ({ title, rows, link }: { title: string; rows: MarketRow[]; link: string }) => <article>
  <h3 className="mb-5 text-[22px] font-semibold tracking-[-0.035em] text-slate-900">{title}<ChevronRight className="ml-0.5 inline" size={19} /></h3>
  <StockRows rows={rows} mode="compact" />
  <a href="#stocks" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3865ff]">{link} <ChevronRight size={14} /></a>
</article>;

const CommunityCard = ({ item }: { item: (typeof community)[number] }) => <div className="min-w-[220px] flex-1 rounded-[16px] border border-[#e4e9ef] bg-white p-4"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: item.color, color: item.color === '#eaf2ff' || item.color === '#f2f4f8' ? '#526274' : '#fff' }}>{item.icon}</span><div className="min-w-0"><div className="text-xs font-semibold text-slate-900">{item.ticker} <span className="text-blue-600">◔</span></div><div className="truncate text-[11px] text-slate-500">{item.name}</div></div></div><div className="mt-4 text-xs font-medium text-slate-900">{priceLabel(item.price)}</div><div className={`mt-2 text-xs ${item.change >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>{item.change > 0 ? '+' : '−'}{Math.abs(item.change).toFixed(2)}%</div></div>;

const mountUnderTradeChart = (node: HTMLElement) => {
  const root = document.querySelector<HTMLElement>('[data-trade-page-root]');
  const chartGrid = root?.querySelector<HTMLElement>('section.grid');
  if (!chartGrid?.parentElement) return null;
  chartGrid.insertAdjacentElement('afterend', node);
  return () => node.remove();
};

export const TradeStockSections = () => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const node = document.createElement('div');
    const cleanup = mountUnderTradeChart(node);
    if (!cleanup) return;
    setMountNode(node);
    return () => { cleanup(); setMountNode(null); };
  }, []);
  if (!mountNode) return null;
  return createPortal(<div className="mt-8 space-y-12 px-2 pb-8 sm:px-4">
    <section className="grid gap-8 xl:grid-cols-2" aria-label="Stock gainers and losers"><GainerLoserCard title="Stock gainers" rows={gainers} highlight /><GainerLoserCard title="Stock losers" rows={losers} /></section>
    <section aria-label="Stock community trends and rankings"><h2 className="mb-5 text-[22px] font-semibold tracking-[-0.035em] text-slate-900">Community trends</h2><div className="flex gap-4 overflow-x-auto pb-2">{community.map((item) => <CommunityCard key={item.ticker} item={item} />)}</div><div className="mt-12 grid gap-10 xl:grid-cols-2"><CompactList title="Highest volume stocks" rows={volumeStocks} link="See all most actively traded stocks" /><CompactList title="Most volatile stocks" rows={volatileStocks} link="See all stocks with biggest price changes" /></div></section>
  </div>, mountNode);
};

export default TradeStockSections;
