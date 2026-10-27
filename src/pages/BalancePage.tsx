import { useState } from 'react';
import { Plus, Search, Wallet2, ChevronDown, SlidersHorizontal } from 'lucide-react';

const positionHeaders = [
  'Position',
  'Direction',
  'Size',
  'Margin',
  'UPNL',
  'Entry price',
  'Liq. price',
  'Price (24h)',
];

const assetHeaders = ['Coin', 'Accounts', 'Total', 'Available', 'Quantity', 'Price', 'Price (24h)'];

export const BalancePage = () => {
  const [activeTab, setActiveTab] = useState<'assets' | 'positions'>('positions');

  const tabs = [
    { key: 'assets', label: 'Assets', count: 0 },
    { key: 'positions', label: 'Positions', count: 0 },
  ] as const;

  return (
    <div className="min-h-screen bg-[#edf3f8] pl-[250px] pt-[64px]">
      <div className="mx-auto max-w-[1460px] p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-[#f3f6fb] p-1 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white text-[#1d4ed8] shadow-sm ring-1 ring-[#dfe7f0]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label} {count > 0 ? `(${count})` : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Add asset"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3fb8]"
            >
              + Buy
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-[#dfe7f0] bg-[#f4f7fb] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-[#dfe7f0] bg-[#f7f9fc] px-5 py-4">
            <div className="text-[18px] font-semibold text-slate-700">
              {activeTab === 'assets' ? 'Assets' : 'Positions'}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-[210px] rounded-lg border border-[#dfe7f0] bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#a7c4ff]"
                />
              </div>

              {activeTab === 'positions' && (
                <>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7f0] bg-white text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Position filters"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3fb8]"
                  >
                    + Buy
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-b-[18px]">
            {activeTab === 'positions' ? (
              <>
                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {positionHeaders.map((header) => (
                    <div key={header} className="flex items-center gap-1">
                      <span>{header}</span>
                      {header !== 'Position' && <ChevronDown size={11} className="text-slate-400" />}
                    </div>
                  ))}
                </div>

                <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 bg-[#f4f7fb] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-white text-slate-300 shadow-sm">
                    <Wallet2 size={28} />
                  </div>

                  <div className="text-[18px] font-semibold text-slate-700">You don't have any positions</div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#dfe7f0] bg-[#f9fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {assetHeaders.map((header) => (
                    <div key={header} className="flex items-center gap-1">
                      <span>{header}</span>
                      {header !== 'Coin' && <ChevronDown size={11} className="text-slate-400" />}
                    </div>
                  ))}
                </div>

                <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 bg-[#f4f7fb] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-white text-slate-300 shadow-sm">
                    <Wallet2 size={28} />
                  </div>

                  <div className="text-[18px] font-semibold text-slate-700">You don't have any coins</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancePage;
