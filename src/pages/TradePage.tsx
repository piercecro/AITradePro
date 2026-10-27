import { useState } from 'react';
import {
  ChevronDown,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

const tradeTabs = ['Open', 'Closed'];
const tableHeaders = [
  'Symbol',
  'Amount (qty)',
  'Next entry/stop',
  'Next take-profit',
  'Opened at',
  'PnL',
  'Progress',
];

export const TradePage = () => {
  const [activeTab, setActiveTab] = useState('Open');

  return (
    <div className="bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="overflow-hidden rounded-[20px] border border-[#dfe7f0] bg-[#f4f7fb] shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-[#e3ebf4] bg-[#f8fafc] px-5 py-4">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[#dfe7f0] bg-[#f1f5f9] p-1">
              {tradeTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-[#1d73f5] shadow-sm ring-1 ring-[#dfe9f7]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download size={15} />
                Export
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d73f5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1667d8]"
              >
                <Plus size={15} />
                Create Trade
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#e3ebf4] bg-[#f3f6fa]">
            <section className="border-r border-[#e3ebf4] p-5 lg:p-6">
              <div className="mb-6 text-[18px] font-bold text-slate-700">Trades amount allocation</div>

              <div className="flex min-h-[235px] items-center justify-center gap-5 px-2">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#dfe9f3] border-t-[#2e7df6] border-r-[#8ca8ff] border-b-[#c8d5e6] border-l-[#dfe9f3]">
                  <div className="absolute inset-[18px] rounded-full bg-[#f5f8fc]" />
                  <div className="relative text-center">
                    <div className="text-[14px] font-black tracking-[-0.04em] text-slate-800">$0</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-[14px] font-semibold text-slate-500">No open trades</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Your allocation shows up here
                    <br />
                    once you open a trade.
                  </div>
                </div>
              </div>
            </section>

            <section className="p-5 lg:p-6">
              <div className="mb-6 text-[18px] font-bold text-slate-700">Number of Trades</div>

              <div className="mt-8 flex min-h-[235px] items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-white text-slate-300">
                  <Wallet size={26} />
                </div>
              </div>

              <div className="text-center text-lg font-semibold text-slate-500">No data collected</div>
            </section>
          </div>

          <div className="overflow-hidden bg-[#f7f9fc]">
            <div className="flex items-center justify-between border-b border-[#e3ebf4] px-5 py-4">
              <div className="text-[18px] font-bold text-slate-700">Open Trades</div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-[180px] rounded-xl border border-[#dfe7f0] bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[#dfe7f0] bg-white text-slate-500 hover:bg-slate-50"
                  aria-label="Open trade filters"
                >
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[1.15fr_1.1fr_1.3fr_1.3fr_1.2fr_0.8fr_1fr] items-center gap-3 border-b border-[#e3ebf4] bg-[#f3f6fa] px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              {tableHeaders.map((header) => (
                <div key={header} className="flex items-center gap-1">
                  <span>{header}</span>
                  {header !== 'Progress' && <ChevronDown size={11} className="text-slate-400" />}
                </div>
              ))}
            </div>

            <div className="flex min-h-[290px] flex-col items-center justify-center gap-5 bg-white px-5 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#dfe7f0] bg-[#f8fafc] text-slate-300">
                <Wallet size={24} />
              </div>

              <div className="text-[18px] font-bold text-slate-600">No open trades</div>

              <button
                type="button"
                className="rounded-xl bg-[#1d73f5] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1667d8]"
              >
                Create Trade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePage;
