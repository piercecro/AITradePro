import { ArrowDownRight, ArrowUpRight, ChevronRight, Globe2 } from 'lucide-react';

type Indicator = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

type Country = {
  name: string;
  flag: string;
  inflation: number;
  indicators: Indicator[];
};

// Snapshot-style sample values keep the dashboard useful while no macro data feed is configured.
const countries: Country[] = [
  { name: 'United States', flag: '🇺🇸', inflation: 3.4, indicators: [{ label: 'GDP', value: '$30.77T' }, { label: 'GDP growth', value: '3.4%', tone: 'positive' }, { label: 'Budget / GDP', value: '−5.9%', tone: 'negative' }, { label: 'Debt / GDP', value: '123.3%', tone: 'negative' }, { label: 'Rate', value: '4.0%' }, { label: 'Inflation', value: '3.4%', tone: 'negative' }, { label: 'Unemployment', value: '4.2%' }, { label: 'Current account', value: '−3.6%', tone: 'negative' }, { label: 'Industrial output', value: '2.2%', tone: 'positive' }] },
  { name: 'China', flag: '🇨🇳', inflation: 0.9, indicators: [{ label: 'GDP', value: '$19.50T' }, { label: 'GDP growth', value: '4.5%', tone: 'positive' }, { label: 'Budget / GDP', value: '−6.5%', tone: 'negative' }, { label: 'Debt / GDP', value: '99.2%', tone: 'negative' }, { label: 'Rate', value: '3.0%' }, { label: 'Inflation', value: '0.9%', tone: 'positive' }, { label: 'Unemployment', value: '5.2%' }, { label: 'Current account', value: '3.7%', tone: 'positive' }, { label: 'Industrial output', value: '5.5%', tone: 'positive' }] },
  { name: 'European Union', flag: '🇪🇺', inflation: 2.4, indicators: [{ label: 'GDP', value: '$18.01T' }, { label: 'GDP growth', value: '1.3%', tone: 'neutral' }, { label: 'Budget / GDP', value: '−3.0%', tone: 'negative' }, { label: 'Debt / GDP', value: '87.7%', tone: 'negative' }, { label: 'Rate', value: '2.65%' }, { label: 'Inflation', value: '2.4%', tone: 'neutral' }, { label: 'Unemployment', value: '6.5%' }, { label: 'Current account', value: '1.6%', tone: 'positive' }, { label: 'Industrial output', value: '−1.1%', tone: 'negative' }] },
  { name: 'Germany', flag: '🇩🇪', inflation: 2.2, indicators: [{ label: 'GDP', value: '$5.05T' }, { label: 'GDP growth', value: '1.2%', tone: 'neutral' }, { label: 'Budget / GDP', value: '−2.7%', tone: 'negative' }, { label: 'Debt / GDP', value: '62.8%' }, { label: 'Rate', value: '2.15%' }, { label: 'Inflation', value: '2.2%', tone: 'neutral' }, { label: 'Unemployment', value: '6.4%' }, { label: 'Current account', value: '4.4%', tone: 'positive' }, { label: 'Industrial output', value: '2.3%', tone: 'positive' }] },
  { name: 'Japan', flag: '🇯🇵', inflation: 2.8, indicators: [{ label: 'GDP', value: '$4.44T' }, { label: 'GDP growth', value: '0.7%', tone: 'neutral' }, { label: 'Budget / GDP', value: '−0.6%', tone: 'negative' }, { label: 'Debt / GDP', value: '248.7%', tone: 'negative' }, { label: 'Rate', value: '1.25%' }, { label: 'Inflation', value: '2.8%', tone: 'neutral' }, { label: 'Unemployment', value: '2.4%', tone: 'positive' }, { label: 'Current account', value: '4.7%', tone: 'positive' }, { label: 'Industrial output', value: '1.9%', tone: 'positive' }] },
  { name: 'United Kingdom', flag: '🇬🇧', inflation: 3.0, indicators: [{ label: 'GDP', value: '$4.00T' }, { label: 'GDP growth', value: '1.4%', tone: 'neutral' }, { label: 'Budget / GDP', value: '−4.3%', tone: 'negative' }, { label: 'Debt / GDP', value: '94.3%', tone: 'negative' }, { label: 'Rate', value: '3.75%' }, { label: 'Inflation', value: '3.0%', tone: 'neutral' }, { label: 'Unemployment', value: '4.7%' }, { label: 'Current account', value: '−2.4%', tone: 'negative' }, { label: 'Industrial output', value: '1.6%', tone: 'positive' }] },
  { name: 'India', flag: '🇮🇳', inflation: 5.2, indicators: [{ label: 'GDP', value: '$3.96T' }, { label: 'GDP growth', value: '7.8%', tone: 'positive' }, { label: 'Budget / GDP', value: '−4.4%', tone: 'negative' }, { label: 'Debt / GDP', value: '81.9%', tone: 'negative' }, { label: 'Rate', value: '5.5%' }, { label: 'Inflation', value: '5.2%', tone: 'negative' }, { label: 'Unemployment', value: '5.0%' }, { label: 'Current account', value: '−0.6%', tone: 'negative' }, { label: 'Industrial output', value: '6.7%', tone: 'positive' }] },
  { name: 'France', flag: '🇫🇷', inflation: 1.8, indicators: [{ label: 'GDP', value: '$3.37T' }, { label: 'GDP growth', value: '−0.1%', tone: 'negative' }, { label: 'Budget / GDP', value: '−5.1%', tone: 'negative' }, { label: 'Debt / GDP', value: '115.6%', tone: 'negative' }, { label: 'Rate', value: '2.15%' }, { label: 'Inflation', value: '1.8%', tone: 'positive' }, { label: 'Unemployment', value: '8.3%', tone: 'negative' }, { label: 'Current account', value: '−0.4%', tone: 'negative' }, { label: 'Industrial output', value: '0.3%' }] },
  { name: 'Brazil', flag: '🇧🇷', inflation: 4.8, indicators: [{ label: 'GDP', value: '$2.26T' }, { label: 'GDP growth', value: '2.1%', tone: 'positive' }, { label: 'Budget / GDP', value: '−7.8%', tone: 'negative' }, { label: 'Debt / GDP', value: '76.5%', tone: 'negative' }, { label: 'Rate', value: '10.5%' }, { label: 'Inflation', value: '4.8%', tone: 'negative' }, { label: 'Unemployment', value: '6.8%', tone: 'positive' }, { label: 'Current account', value: '−1.7%', tone: 'negative' }, { label: 'Industrial output', value: '1.8%', tone: 'positive' }] },
  { name: 'Canada', flag: '🇨🇦', inflation: 2.1, indicators: [{ label: 'GDP', value: '$2.32T' }, { label: 'GDP growth', value: '1.1%', tone: 'neutral' }, { label: 'Budget / GDP', value: '−1.2%', tone: 'negative' }, { label: 'Debt / GDP', value: '113.5%', tone: 'negative' }, { label: 'Rate', value: '2.5%' }, { label: 'Inflation', value: '2.1%', tone: 'neutral' }, { label: 'Unemployment', value: '6.5%' }, { label: 'Current account', value: '−1.4%', tone: 'negative' }, { label: 'Industrial output', value: '1.1%', tone: 'positive' }] },
];

const toneClass: Record<NonNullable<Indicator['tone']>, string> = {
  positive: 'bg-cyan-100 text-slate-800',
  negative: 'bg-orange-100 text-slate-800',
  neutral: 'bg-slate-50 text-slate-700',
};

const inflationColor = (value: number) => {
  if (value >= 7) return '#ea580c';
  if (value >= 5) return '#f97316';
  if (value >= 3) return '#fb923c';
  if (value >= 2) return '#fdba74';
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

/** Dashboard macro widgets. Values are an illustrative snapshot, not a live economic feed. */
export const DashboardInsights = () => (
  <section className="space-y-5" aria-label="Global economic indicators">
    <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-[-0.04em] text-slate-800">Economic indicators heatmap <ChevronRight className="inline" size={19} /></h2>
          <p className="mt-1 text-xs text-slate-500">Selected economies · illustrative macro snapshot</p>
        </div>
        <span className="rounded-full bg-[#f3f7fb] px-3 py-1 text-[11px] font-semibold text-slate-500">10 economies</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e7edf3]">
        <table className="w-full min-w-[1060px] border-collapse text-center text-xs">
          <thead className="bg-[#f9fbff] text-slate-500"><tr>
            <th className="sticky left-0 z-10 min-w-36 border-b border-r border-[#e7edf3] bg-[#f9fbff] px-3 py-3 text-left font-semibold">Economy</th>
            {countries[0].indicators.map((item) => <th key={item.label} className="min-w-[94px] border-b border-r border-[#e7edf3] px-2 py-3 font-semibold">{item.label}</th>)}
          </tr></thead>
          <tbody>{countries.map((country) => <tr key={country.name} className="border-b border-[#e7edf3] last:border-0">
            <th className="sticky left-0 z-10 whitespace-nowrap border-r border-[#e7edf3] bg-white px-3 py-3 text-left font-semibold text-slate-700"><span className="mr-2 text-base" aria-hidden="true">{country.flag}</span>{country.name}</th>
            {country.indicators.map((item) => <td key={item.label} className={`border-r border-white px-2 py-3 font-medium ${toneClass[item.tone ?? 'neutral']}`}>{item.value}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500"><span>Lower / contraction</span><i className="h-2.5 w-8 rounded bg-orange-200" /><i className="h-2.5 w-8 rounded bg-slate-50 ring-1 ring-slate-100" /><i className="h-2.5 w-8 rounded bg-cyan-100" /><span>Higher / growth</span></div>
    </div>

    <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-black tracking-[-0.04em] text-slate-800">Global inflation map <ChevronRight className="inline" size={19} /></h2><p className="mt-1 text-xs text-slate-500">Annual consumer price growth · sample country values</p></div>
        <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"><Globe2 size={14} /> Global snapshot</div>
      </div>
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="overflow-hidden rounded-xl bg-[#fffdf9]">
          <svg viewBox="0 0 1000 470" role="img" aria-label="Stylized world map shaded by illustrative inflation rates" className="h-auto w-full">
            <defs><pattern id="mapGrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M 34 0 L 0 0 0 34" fill="none" stroke="#f1ece5" strokeWidth="1" /></pattern></defs>
            <rect width="1000" height="470" fill="url(#mapGrid)" />
            {/* Soft silhouette silhouettes make the data overlay legible without an external map dependency. */}
            <g fill="#f2eee8" stroke="#fff" strokeWidth="3" strokeLinejoin="round">
              <path d="M75 100 120 64 198 61 235 85 260 121 242 153 212 171 207 204 178 228 162 267 137 252 126 222 102 207 87 169 66 142Z" />
              <path d="M234 276 271 266 307 284 327 321 316 359 299 395 284 437 264 419 253 378 235 344Z" />
              <path d="M432 103 467 77 512 80 534 96 566 91 603 103 629 94 668 108 704 95 754 110 799 103 846 127 878 152 864 178 822 179 797 201 771 199 751 222 723 213 704 239 670 229 652 202 629 194 616 164 591 158 574 180 548 175 531 145 507 145 489 168 464 161 448 139 425 133Z" />
              <path d="M477 184 511 175 544 190 557 222 546 253 529 278 515 311 493 302 480 274 466 247 457 215Z" />
              <path d="M756 294 795 279 845 288 870 310 859 334 821 345 786 334 765 318Z" />
              <path d="M907 261 931 250 944 267 931 281 911 278Z" />
            </g>
            <g>{mapPoints.map((point) => <g key={point.country}><circle cx={point.x} cy={point.y} r="18" fill={inflationColor(point.rate)} opacity=".88" stroke="white" strokeWidth="2"><title>{point.country}: {point.rate}% inflation (illustrative)</title></circle><text x={point.x} y={point.y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#713f12">{point.rate}%</text></g>)}</g>
          </svg>
        </div>
        <aside className="space-y-2">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Inflation highlights</div>
          {[...mapPoints].sort((a, b) => b.rate - a.rate).slice(0, 5).map((point, index) => <div key={point.country} className="flex items-center justify-between rounded-xl border border-[#edf2f7] bg-[#fbfcfe] px-3 py-2.5"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-orange-900" style={{ backgroundColor: inflationColor(point.rate) }}>{index + 1}</span><span className="text-xs font-semibold text-slate-700">{point.country}</span></div><span className="text-xs font-bold text-slate-800">{point.rate.toFixed(1)}%</span></div>)}
          <div className="pt-2"><div className="mb-1 flex justify-between text-[10px] text-slate-500"><span>0%</span><span>10%</span><span>25%+</span></div><div className="h-2 rounded-full bg-gradient-to-r from-orange-100 via-orange-300 to-orange-700" /></div>
          <p className="text-[10px] leading-relaxed text-slate-400">For visualization only. Figures are sample values and are not refreshed from a live economic data provider.</p>
        </aside>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><ArrowDownRight size={13} className="text-emerald-500" /><ArrowUpRight size={13} className="text-orange-500" /> Lower inflation ← → Higher inflation</div>
    </div>
  </section>
);

export default DashboardInsights;
