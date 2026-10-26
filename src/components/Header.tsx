import { ChevronLeft, ChevronDown, Bell, Plus, CreditCard, ArrowUp, ArrowDown, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

export const Header = ({ onNavigate }: HeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();

  const handleMenuClick = (page: string) => {
    setShowUserMenu(false);
    onNavigate(page);
  };

  return (
    <header className="fixed top-0 left-[230px] right-0 h-[72px] bg-white border-b border-[#dfe7f0] flex items-center justify-between px-5 z-40 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4 min-w-0">
        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dfe7f0] bg-white text-slate-500 hover:bg-slate-50">
          <ChevronLeft size={16} />
        </button>

        <nav className="flex items-center gap-2 rounded-xl border border-[#e1e7ef] bg-[#f7f9fc] p-1">
          {['Dashboard', 'Live Trading', 'Demo'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => onNavigate(index === 0 ? 'dashboard' : 'trade')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                index === 0
                  ? 'bg-white text-slate-700 shadow-sm ring-1 ring-[#e5edf5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7f9fc] px-2 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#f7931a]" />
            <span>BTC/USD</span>
          </div>
          <span className="text-[11px] text-slate-500">80,104.28</span>
          <span className="text-[11px] text-emerald-500">-0.62%</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7f9fc] px-2 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#26a17b]" />
            <span>ETH/USD</span>
          </div>
          <span className="text-[11px] text-slate-500">2,319.61</span>
          <span className="text-[11px] text-emerald-500">+1.49%</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7f9fc] px-2 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#7c8cff]" />
            <span>ADA/USD</span>
          </div>
          <span className="text-[11px] text-slate-500">0.2061</span>
          <span className="text-[11px] text-emerald-500">+0.05%</span>
        </div>

        <button className="rounded-xl border border-[#dfe7f0] bg-[#f6f9ff] px-4 py-2 text-sm font-semibold text-[#1267d1] hover:bg-[#edf5ff]">
          Upgrade
        </button>

        <button className="flex items-center gap-2 rounded-xl bg-[#1d73f5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1667d8]">
          <Plus size={15} />
          Create Bot
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe7f0] bg-[#f8fafc] text-slate-700 hover:bg-slate-100">
          <Wallet size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl border border-[#dfe7f0] bg-[#f8fafc] px-2 py-1.5 hover:bg-slate-100"
            aria-label="Open user menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-semibold text-white">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#dfe7f0] bg-white shadow-lg">
              <button
                onClick={() => handleMenuClick('account')}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <CreditCard size={16} />
                <span>My account</span>
              </button>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 border-t border-[#edf1f6] px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <ArrowUp size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
