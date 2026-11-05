import { ArrowDownRight, ArrowUpRight, ChevronRight, Globe2 } from 'lucide-react';

type Indicator = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

type Country = {
  name: string;
  flag: string;
  indicators: Indicator[];
};

const countries: Country[] = [
  { name: 'United States', flag: '🇺🇸', indicators: [{ label: 'GDP', value: '$30.77T' }, { label: 'GDP growth', value: '3.4%', tone: 'positive' }, { label: 'Budget / GDP', value: '−5.9%', tone: 'negative' }, { label: 'Debt / GDP', value: '123.3%', tone: 'negative' }, { label: 'Interest rate', value: '4.0%' }, { label: 'Inflation', value: '3.4%', tone: 'negative' }, { label: 'Unemployment', value: '4.2%' }, { label: 'Current account', value: '−3.6%', tone: 'negative' }, { label: 'Industrial output', value: '2.2%', tone: 'positive' }] },
  { name: 'Mainland China', flag: '🇨🇳', indicators: [{ label: 'GDP', value: '$19.50T' }, { label: 'GDP growth', value: '4.5%', tone: 'positive' }, { label: 'Budget / GDP', value: '−6.5%', tone: 'negative' }, { label: 'Debt / GDP', value: '99.2%', tone: 'negative' }, { label: 'Interest rate', value: '3.0%', tone: 'positive' }, { label: 'Inflation', value: '0.9%', tone: 'positive' }, { label: 'Unemployment', value: '5.2%' }, { label: 'Current account', value: '3.7%', tone: 'positive' }, { label: 'Industrial output', value: '5.5%', tone: 'positive' }] },
  { name: 'EU', flag: '🇪🇺', indicators: [{ label: 'GDP', value: '$18.01T' }, { label: 'GDP growth', value: '1.3%', tone: 'negative' }, { label: 'Budget / GDP', value: '−3.0%', tone: 'neutral' }, { label: 'Debt / GDP', value: '87.7%', tone: 'negative' }, { label: 'Interest rate', value: '2.65%', tone: 'positive' }, { label: 'Inflation', value: '2.4%' }, { label: 'Unemployment', value: '6.5%', tone: 'negative' }, { label: 'Current account', value: '1.6%', tone: 'positive' }, { label: 'Industrial output', value: '−1.1%', tone: 'negative' }] },
  { name: 'Germany', flag: '🇩🇪', indicators: [{ label: 'GDP', value: '$5.05T' }, { label: 'GDP growth', value: '1.2%', tone: 'negative' }, { label: 'Budget / GDP', value: '−2.7%', tone: 'neutral' }, { label: 'Debt / GDP', value: '62.8%', tone: 'positive' }, { label: 'Interest rate', value: '2.15%', tone: 'positive' }, { label: 'Inflation', value: '2.2%' }, { label: 'Unemployment', value: '6.4%', tone: 'negative' }, { label: 'Current account', value: '4.4%', tone: 'positive' }, { label: 'Industrial output', value: '2.3%', tone: 'positive' }] },
  { name: 'Japan', flag: '🇯🇵', indicators: [{ label: 'GDP', value: '$4.44T' }, { label: 'GDP growth', value: '0.7%', tone: 'negative' }, { label: 'Budget / GDP', value: '−0.6%', tone: 'positive' }, { label: 'Debt / GDP', value: '248.7%', tone: 'negative' }, { label: 'Interest rate', value: '1.25%', tone: 'positive' }, { label: 'Inflation', value: '2.8%' }, { label: 'Unemployment', value: '2.4%', tone: 'positive' }, { label: 'Current account', value: '4.7%', tone: 'positive' }, { label: 'Industrial output', value: '1.9%', tone: 'positive' }] },
  { name: 'UK', flag: '🇬🇧', indicators: [{ label: 'GDP', value: '$4.00T' }, { label: 'GDP growth', value: '1.4%', tone: 'negative' }, { label: 'Budget / GDP', value: '−4.3%', tone: 'negative' }, { label: 'Debt / GDP', value: '94.3%', tone: 'negative' }, { label: 'Interest rate', value: '3.75%' }, { label: 'Inflation', value: '3.0%' }, { label: 'Unemployment', value: '4.7%' }, { label: 'Current account', value: '−2.4%', tone: 'negative' }, { label: 'Industrial output', value: '1.6%', tone: 'positive' }] },
  { name: 'India', flag: '🇮🇳', indicators: [{ label: 'GDP', value: '$3.96T' }, { label: 'GDP growth', value: '7.8%', tone: 'positive' }, { label: 'Budget / GDP', value: '−4.4%', tone: 'negative' }, { label: 'Debt / GDP', value: '81.9%', tone: 'negative' }, { label: 'Interest rate', value: '5.5%', tone: 'negative' }, { label: 'Inflation', value: '5.2%', tone: 'negative' }, { label: 'Unemployment', value: '5.0%' }, { label: 'Current account', value: '−0.6%', tone: 'negative' }, { label: 'Industrial output', value: '6.7%', tone: 'positive' }] },
  { name: 'France', flag: '🇫🇷', indicators: [{ label: 'GDP', value: '$3.37T' }, { label: 'GDP growth', value: '−0.1%', tone: 'negative' }, { label: 'Budget / GDP', value: '−5.1%', tone: 'negative' }, { label: 'Debt / GDP', value: '115.6%', tone: 'negative' }, { label: 'Interest rate', value: '2.15%', tone: 'positive' }, { label: 'Inflation', value: '1.8%', tone: 'positive' }, { label: 'Unemployment', value: '8.3%', tone: 'negative' }, { label: 'Current account', value: '−0.4%', tone: 'negative' }, { label: 'Industrial output', value: '0.3%' }] },
  { name: 'Russia', flag: '🇷🇺', indicators: [{ label: 'GDP', value: '$2.56T' }, { label: 'GDP growth', value: '1.3%', tone: 'negative' }, { label: 'Budget / GDP', value: '−2.6%', tone: 'neutral' }, { label: 'Debt / GDP', value: '18.3%', tone: 'positive' }, { label: 'Interest rate', value: '14.0%', tone: 'negative' }, { label: 'Inflation', value: '6.3%', tone: 'negative' }, { label: 'Unemployment', value: '2.2%', tone: 'positive' }, { label: 'Current account', value: '2.0%', tone: 'positive' }, { label: 'Industrial output', value: '1.8%', tone: 'positive' }] },
  { name: 'Canada', flag: '🇨🇦', indicators: [{ label: 'GDP', value: '$2.32T' }, { label: 'GDP growth', value: '1.1%', tone: 'negative' }, { label: 'Budget / GDP', value: '−1.2%', tone: 'positive' }, { label: 'Debt / GDP', value: '113.5%', tone: 'negative' }, { label: 'Interest rate', value: '2.5%', tone: 'positive' }, { label: 'Inflation', value: '2.1%' }, { label: 'Unemployment', value: '6.5%', tone: 'negative' }, { label: 'Current account', value: '−1.4%', tone: 'negative' }, { label: 'Industrial output', value: '1.1%', tone: 'positive' }] },
];

const toneClass: Record<NonNullable<Indicator['tone']>, string> = {
  positive: 'bg-cyan-100 text-slate-800',
  negative: 'bg-orange-100 text-slate-800',
  neutral: 'bg-slate-50 text-slate-700',
};

const inflationColor = (value: number) => {
  if (value >= 20) return '#ea580c';
  if (value >= 10) return '#f97316';
  if (value >= 5) return '#fb923c';
  if (value >= 3) return '#fdba74';
  return '#ffedd5';
};

const mapPoints = [
  { x: 150, y: 126, country: 'Canada', rate: 2.1 }, { x: 183, y: 184, country: 'United States', rate: 3.4 },
  { x: 215, y: 263, country: 'Mexico', rate: 4.7 }, { x: 287, y: 339, country: 'Brazil', rate: 4.8 },
  { x: 476, y: 137, country: 'United Kingdom', rate: 3.0 }, { x: 500, y: 160, country: 'France', rate: 1.8 },
  { x: 525, y: 148, country: 'Germany', rate: 2.2 }, { x: 585, y: 180, country: 'Türkiye', rate: 38.0 },
  { x: 620, y: 205, country: 'Nigeria', rate: 24.5 }, { x: 653, y: 243, country: 'South Africa', rate: 5.3 },
  { x: 698, y: 184, country: 'India', rate: 5.2 }, { x: 751, y: 161, country: 'China', rate: 0.9 },
  { x: 793, y: 186, country: 'Japan', rate: 2.8 }, { x: 850, y: 294, country: 'Australia', rate: 3.6 },
];

const largestCompanies = [
  { name: 'Apple Inc.', ticker: 'AAPL', mark: '●', color: '#17191d', price: '349.51', change: '+5.31%', cap: '$5.10T', up: true },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', mark: '◉', color: '#76b900', price: '200.13', change: '−3.17%', cap: '$4.82T', up: false },
  { name: 'Microsoft Corporation', ticker: 'MSFT', mark: '▦', color: '#1685d1', price: '555.80', change: '+6.68%', cap: '$4.13T', up: true },
  { name: 'Alphabet Inc.', ticker: 'GOOGL', mark: 'G', color: '#4285f4', price: '288.93', change: '+3.18%', cap: '$3.52T', up: true },
  { name: 'Amazon.com, Inc.', ticker: 'AMZN', mark: 'a', color: '#ff6b00', price: '266.03', change: '+6.12%', cap: '$2.88T', up: true },
  { name: 'Space Exploration Technologies', ticker: 'SPCX', mark: '✦', color: '#20242a', price: '135.92', change: '−3.81%', cap: '$1.85T', up: false },
];

const largestEmployers = [
  { name: 'Walmart Inc.', ticker: 'WMT', mark: '✳', color: '#0877e8', price: '129.17', change: '+3.45%', employees: '2.1M', up: true },
  { name: 'Amazon.com, Inc.', ticker: 'AMZN', mark: 'a', color: '#ff6b00', price: '266.03', change: '+6.12%', employees: '1.6M', up: true },
  { name: 'BYD Company Limited', ticker: '002594', mark: '◉', color: '#e52521', price: '85.15 CNY', change: '+0.24%', employees: '869.6K', up: true },
  { name: 'Accenture plc', ticker: 'ACN', mark: '›', color: '#9b00ff', price: '264.27', change: '+3.81%', employees: '814K', up: true },
  { name: 'JD.com, Inc.', ticker: 'JD', mark: '京', color: '#df2323', price: '27.73', change: '+3.05%', employees: '776.7K', up: true },
  { name: 'JD Logistics, Inc.', ticker: '2618', mark: 'JDL', color: '#e52521', price: '10,320 HKD', change: '+1.38%', employees: '682.7K', up: true },
];

const earnings = [
  { day: 'Nov', date: '04', name: 'Japan Medical Dynamic Marketing, Inc.', ticker: '7600', actual: '−0.32 USD', estimate: '—', color: '#6127a1', mark: '◉' },
  { day: 'Nov', date: '04', name: 'Tokyo Seimitsu Co., Ltd', ticker: '7729', actual: '1.69 USD', estimate: '1.45 USD', color: '#1145a2', mark: '◢' },
  { day: 'Nov', date: '04', name: 'Valqua Ltd.', ticker: '7995', actual: '0.81 USD', estimate: '—', color: '#e5465c', mark: 'V' },
  { day: 'Nov', date: '04', name: 'Fuji Kyuko Co., Ltd.', ticker: '9010', actual: '0.18 USD', estimate: '—', color: '#1685d1', mark: '⌁' },
  { day: 'Nov', date: '04', name: 'Kyushu Railway Company', ticker: '9142', actual: '0.24 USD', estimate: '0.59 USD', color: '#d62245', mark: 'JR' },
  { day: 'Nov', date: '04', name: "SAC'S BAR HOLDINGS INC.", ticker: '9990', actual: '0.11 USD', estimate: '—', color: '#818895', mark: 'S' },
];

const ipos = [
  { day: 'Nov', date: '04', name: 'EST, Inc.', ticker: '495910', exchange: 'KRX', price: '12,400.00 KRW', mark: 'E' },
  { day: 'Nov', date: '04', name: 'Allganize Holdings, Inc.', ticker: '656A', exchange: 'TSE', price: '1,260.00 JPY', mark: 'A' },
  { day: 'Nov', date: '04', name: 'AJWA PROJECTS LIMITED', ticker: 'AJWA', exchange: 'BSE', price: '203.00 INR', mark: 'A' },
  { day: 'Nov', date: '04', name: 'CARVER ROBOWELD LIMITED', ticker: 'CRL', exchange: 'BSE', price: '76.00–80.00 INR', mark: 'C' },
  { day: 'Nov', date: '04', name: 'M K SONS FINE JEWELS LIMITED', ticker: 'MKJEWELS', exchange: 'BSE', price: '162.00 INR', mark: 'M' },
  { day: 'Nov', date: '05', name: 'LTV X Inc.', ticker: '655A', exchange: 'TSE', price: '570.00 JPY', mark: 'L' },
];

const CardTitle = ({ children }: { children: string }) => (
  <h2 className="text-xl font-black tracking-[-0.04em] text-slate-800">{children}<ChevronRight className="ml-0.5 inline" size={19} /></h2>
);

const CompanyList = ({ title, items, employer = false }: { title: string; items: typeof largestCompanies | typeof largestEmployers; employer?: boolean }) => (
  <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
    <div className="mb-4 flex items-center justify-between"><CardTitle>{title}</CardTitle></div>
    <div className="grid grid-cols-[minmax(150px,1.7fr)_minmax(90px,1fr)_minmax(72px,.8fr)] px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400"><div>Company</div><div className="text-right">Price &amp; change</div><div className="text-right">{employer ? 'Employees' : 'Market cap'}</div></div>
    <div>{items.map((item) => <div key={item.ticker} className="grid min-h-[57px] grid-cols-[minmax(150px,1.7fr)_minmax(90px,1fr)_minmax(72px,.8fr)] items-center gap-2 border-t border-[#edf2f7] px-1 py-2">
      <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: item.color }}>{item.mark}</span><div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-800">{item.name}</div><span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{item.ticker}</span></div></div>
      <div className="text-right"><div className="text-xs font-semibold text-slate-800">{item.price}</div><div className={`mt-0.5 text-[11px] ${item.up ? 'text-teal-600' : 'text-rose-500'}`}>{item.change}</div></div>
      <div className="text-right text-xs font-semibold text-slate-800">{employer && 'employees' in item ? item.employees : 'cap' in item ? item.cap : ''}</div>
    </div>)}</div>
    <a href="#companies" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">See all {employer ? 'world biggest employers' : 'world major companies'} <ChevronRight size={14} /></a>
  </div>
);

const CalendarRow = ({ item, kind }: { item: (typeof earnings)[number] | (typeof ipos)[number]; kind: 'earnings' | 'ipo' }) => (
  <div className="grid min-h-[56px] grid-cols-[40px_minmax(130px,1fr)_minmax(80px,.65fr)_minmax(85px,.7fr)] items-center gap-2 border-t border-[#edf2f7] px-1 py-2">
    <div className="flex h-9 w-8 flex-col items-center justify-center rounded-md bg-slate-50 text-[9px] leading-tight text-slate-600"><span>{item.day}</span><strong className="text-xs text-slate-800">{item.date}</strong></div>
    <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-xs font-bold text-slate-600" style={kind === 'earnings' ? { color: (item as typeof earnings[number]).color } : undefined}>{item.mark}</span><div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-800">{item.name}</div><span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{item.ticker}</span></div></div>
    {kind === 'earnings' ? <><div className="text-right text-[11px] font-medium text-slate-700">{'actual' in item ? item.actual : ''}</div><div className="text-right text-[11px] font-medium text-slate-700">{'estimate' in item ? item.estimate : ''}</div></> : <><div className="text-right text-[11px] font-medium text-slate-700">{'exchange' in item ? item.exchange : ''}</div><div className="text-right text-[11px] font-medium text-slate-700">{'price' in item ? item.price : ''}</div></>}
  </div>
);

const CalendarCard = ({ title, kind }: { title: string; kind: 'earnings' | 'ipo' }) => (
  <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
    <div className="mb-4"><CardTitle>{title}</CardTitle></div>
    <div className="grid grid-cols-[40px_minmax(130px,1fr)_minmax(80px,.65fr)_minmax(85px,.7fr)] gap-2 px-1 pb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400"><div /><div>Company</div><div className="text-right">{kind === 'earnings' ? 'Actual' : 'Exchange'}</div><div className="text-right">{kind === 'earnings' ? 'Estimate' : 'Offer price'}</div></div>
    {(kind === 'earnings' ? earnings : ipos).map((item) => <CalendarRow key={item.ticker} item={item} kind={kind} />)}
  </div>
);

export const DashboardInsights = () => (
  <section className="space-y-5" aria-label="Global economic indicators and market calendars">
    <div className="grid gap-5 xl:grid-cols-2">
      <CompanyList title="World biggest companies" items={largestCompanies} />
      <CompanyList title="World largest employers" items={largestEmployers} employer />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <CalendarCard title="Earnings Calendar" kind="earnings" />
      <CalendarCard title="IPO Calendar" kind="ipo" />
    </div>
    <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><CardTitle>Economic indicators heatmap</CardTitle></div><span className="rounded-full bg-[#f3f7fb] px-3 py-1 text-[11px] font-semibold text-slate-500">10 economies</span></div>
      <div className="overflow-x-auto rounded-xl border border-[#e7edf3]"><table className="w-full min-w-[1150px] border-collapse text-center text-xs"><thead className="bg-[#f9fbff] text-slate-500"><tr><th className="sticky left-0 z-10 min-w-36 border-b border-r border-[#e7edf3] bg-[#f9fbff] px-3 py-3 text-left font-semibold">Economy</th>{countries[0].indicators.map((item) => <th key={item.label} className="min-w-[94px] border-b border-r border-[#e7edf3] px-2 py-3 font-semibold">{item.label}</th>)}</tr></thead><tbody>{countries.map((country) => <tr key={country.name} className="border-b border-[#e7edf3] last:border-0"><th className="sticky left-0 z-10 whitespace-nowrap border-r border-[#e7edf3] bg-white px-3 py-3 text-left font-semibold text-slate-700"><span className="mr-2 text-base" aria-hidden="true">{country.flag}</span>{country.name}</th>{country.indicators.map((item) => <td key={item.label} className={`border-r border-white px-2 py-3 font-medium ${toneClass[item.tone ?? 'neutral']}`}>{item.value}</td>)}</tr>)}</tbody></table></div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500"><span>Lower / contraction</span><i className="h-2.5 w-8 rounded bg-orange-200" /><i className="h-2.5 w-8 rounded bg-slate-50 ring-1 ring-slate-100" /><i className="h-2.5 w-8 rounded bg-cyan-100" /><span>Higher / growth</span></div>
    </div>
    <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Global inflation map</CardTitle><p className="mt-1 text-xs text-slate-500">Annual consumer price growth</p></div><div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"><Globe2 size={14} /> Global overview</div></div>
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="overflow-hidden rounded-xl bg-[#fffdf9]">
          <svg viewBox="0 0 1000 470" role="img" aria-label="World map shaded by inflation rates" className="h-auto w-full">
            <defs><pattern id="inflation-grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#f3eee7" strokeWidth="1" /></pattern><filter id="map-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#c8bca9" floodOpacity=".15" /></filter></defs>
            <rect width="1000" height="470" fill="url(#inflation-grid)" />
            <g filter="url(#map-shadow)" stroke="#fffdf9" strokeWidth="2.2" strokeLinejoin="round">
              {/* Simplified, recognizable continent shapes; separate regional patches suggest country-level variation. */}
              <path fill="#ffb347" d="M74 112 89 91 119 83 136 65 164 62 179 74 203 69 221 84 247 88 261 107 255 126 237 135 229 152 208 160 194 176 181 196 161 207 149 231 130 226 119 211 104 202 99 182 84 169 73 148 62 132Z" />
              <path fill="#ffd08a" d="m94 109 34-18 25 7 11 22-20 13-27-4-24 13-18-14Z" />
              <path fill="#ffb64f" d="m143 163 34-9 24 11-2 17-28 7-22 20-20-10 5-18Z" />
              <path fill="#ff9a24" d="m181 210 22-8 17 10-7 19-17 18-13-14Z" />
              <path fill="#ffbf69" d="m216 239 22-5 16 15 11 28-7 35-13 34-13 31-10 27-12-10-9-33-10-27 4-30-10-22 9-25-3-19Z" />
              <path fill="#ff9e38" d="m240 294 21 3 2 24-13 28-12-7 5-23Z" />
              <path fill="#ffcd84" d="m412 107 20-15 17 6 6 19-13 13-18-4Z" />
              <path fill="#ffb347" d="m447 115 18-21 24-6 13-16 32-7 22 9 23-5 20 12 23-4 18 10 32-1 26 13 30-2 32 15 31 1 32 19 13 19-16 14-30-3-19 12-27-7-17 12-29-3-17 18-20-4-20 15-23-9-22 6-14-12-26 6-16-12-22 5-11-17-24 2-17-13-19 8-20-10-11-18-22 4-12-14-21 3-10-13Z" />
              <path fill="#ffe0b5" d="m477 111 19-16 20 8-2 18-19 10-17-7Z" />
              <path fill="#ffb753" d="m501 140 20-8 17 9-3 16-21 8-16-9Z" />
              <path fill="#ff8e1c" d="m542 145 22-8 17 9-6 19-22 6-12-12Z" />
              <path fill="#ffcb81" d="m572 125 15-15 22 3 8 15-13 15-23-3Z" />
              <path fill="#ffac43" d="m603 153 17-15 21 7 9 20-15 15-24-5Z" />
              <path fill="#ffd9a8" d="m637 127 17-12 21 5 10 16-13 12-24-4Z" />
              <path fill="#ff951d" d="m671 146 20-8 19 9 5 21-16 16-21-9Z" />
              <path fill="#ffb951" d="m711 151 19-11 20 7 8 17-15 14-24-4Z" />
              <path fill="#ffad48" d="m747 173 18-7 18 11 7 18-16 12-22-9Z" />
              <path fill="#ffd49a" d="m781 166 15-12 18 9 2 17-14 12-18-8Z" />
              <path fill="#ff971d" d="m805 184 19-8 14 8-4 13-18 9-12-7Z" />
              <path fill="#ffc77b" d="m433 152 16-12 17 9 5 23-14 15-17-7Z" />
              <path fill="#ff9a22" d="m465 163 13-7 10 9-3 13-15 3Z" />
              <path fill="#ffbf6a" d="m492 181 22-10 23 11 15 23-4 25-18 22-14 31-17 20-15-16-4-26-16-20 1-24-9-17 15-18Z" />
              <path fill="#ff8b16" d="m530 216 18-5 15 16-8 19-19 10-13-13Z" />
              <path fill="#ffab3d" d="m551 252 17-4 12 14-10 18-17-1-8-13Z" />
              <path fill="#ff9d2c" d="m569 283 15-9 14 10 4 25-14 14-16-12Z" />
              <path fill="#ffc879" d="m636 211 17-3 15 11-6 15-18 6-11-12Z" />
              <path fill="#ff9d28" d="m675 193 21-13 21 9 12 17-9 24-18 17-13 26-18-4-9-23-17-13 7-20Z" />
              <path fill="#ffb953" d="m709 234 16-2 13 12-4 17-17-3-8-12Z" />
              <path fill="#ffd193" d="m757 308 28-15 36 4 22 16-10 20-33 10-29-8-19-13Z" />
              <path fill="#ffad43" d="m795 320 24-3 12 11-17 10-22-5Z" />
              <path fill="#ffb34e" d="m898 255 13-10 17 6 9 17-12 13-19-4Z" />
            </g>
            <g>{mapPoints.map((point) => <g key={point.country}><circle cx={point.x} cy={point.y} r="11" fill={inflationColor(point.rate)} stroke="white" strokeWidth="2"><title>{point.country}: {point.rate}% inflation</title></circle></g>)}</g>
          </svg>
        </div>
        <aside className="space-y-2"><div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Inflation highlights</div>{[...mapPoints].sort((a, b) => b.rate - a.rate).slice(0, 5).map((point, index) => <div key={point.country} className="flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#fbfcfe] px-3 py-2.5"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-orange-900" style={{ backgroundColor: inflationColor(point.rate) }}>{index + 1}</span><span className="text-xs font-semibold text-slate-700">{point.country}</span></div><span className="text-xs font-bold text-slate-800">{point.rate.toFixed(1)}%</span></div>)}<div className="pt-2"><div className="mb-1 flex justify-between text-[10px] text-slate-500"><span>0%</span><span>10%</span><span>25%+</span></div><div className="h-2 rounded-full bg-gradient-to-r from-orange-100 via-orange-300 to-orange-700" /></div></aside>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><ArrowDownRight size={13} className="text-emerald-500" /><ArrowUpRight size={13} className="text-orange-500" /> Lower inflation ← → Higher inflation</div>
    </div>
  </section>
);

export default DashboardInsights;
