import { ChevronLeft, ChevronDown, Bell, Plus, CreditCard, ArrowUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'live-trading', label: 'Live Trading' },
  { key: 'demo', label: 'Demo' },
];

const connectBotStorageKey = 'header-bot-connect-status';

export const Header = ({ currentPage, onNavigate }: HeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isBotConnected, setIsBotConnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const raw = localStorage.getItem(connectBotStorageKey);
      return raw === 'true';
    } catch {
      return false;
    }
  });
  const { user, signOut } = useAuth();

  useEffect(() => {
    const syncFromStorage = () => {
      const raw = localStorage.getItem(connectBotStorageKey);
      setIsBotConnected(raw === 'true');
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    const handleBotConnectionStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ connected: boolean }>;
      setIsBotConnected(customEvent.detail.connected);
    };

    window.addEventListener('botConnectionStateChanged', handleBotConnectionStateChanged);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('botConnectionStateChanged', handleBotConnectionStateChanged);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(connectBotStorageKey, String(isBotConnected));
    window.dispatchEvent(
      new CustomEvent('botConnectionStateChanged', {
        detail: { connected: isBotConnected },
      }),
    );
  }, [isBotConnected]);

  const handleMenuClick = (page: string) => {
    setShowUserMenu(false);
    onNavigate(page);
  };

  const handleBotToggle = () => {
    setIsBotConnected((previous) => !previous);
  };

  return (
    <header className="fixed top-0 left-[230px] right-0 h-[72px] bg-white border-b border-[#dfe7f0] flex items-center justify-between px-5 z-40 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4 min-w-0">
        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dfe7f0] bg-white text-slate-500 hover:bg-slate-50">
          <ChevronLeft size={16} />
        </button>

        <nav className="flex items-center gap-2 rounded-xl border border-[#e1e7ef] bg-[#f7f9fc] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currentPage === tab.key
                  ? 'bg-white text-slate-700 shadow-sm ring-1 ring-[#e5edf5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
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
          <span className="text-[11px] text-slate-500">79,958.02</span>
          <span className="text-[11px] text-emerald-500">-0.72%</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7f9fc] px-2 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#26a17b]" />
            <span>ETH/USD</span>
          </div>
          <span className="text-[11px] text-slate-500">2,316.48</span>
          <span className="text-[11px] text-emerald-500">+1.41%</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7f9fc] px-2 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#7c8cff]" />
            <span>ADA/USD</span>
          </div>
          <span className="text-[11px] text-slate-500">0.2049</span>
          <span className="text-[11px] text-emerald-500">+0.24%</span>
        </div>

        <button className="rounded-xl border border-[#dfe7f0] bg-[#f6f9ff] px-4 py-2 text-sm font-semibold text-[#1267d1] hover:bg-[#edf5ff]">
          Upgrade
        </button>

        <button
          type="button"
          onClick={handleBotToggle}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
            isBotConnected
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#1d73f5] text-white hover:bg-[#1667d8]'
          }`}
        >
          <Plus size={15} />
          {isBotConnected ? 'Connected' : 'Connect Bot'}
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
