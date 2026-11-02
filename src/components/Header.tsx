import { ChevronLeft, ChevronDown, Bell, Plus, CreditCard, ArrowUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  readBotConnectionState,
  subscribeBotConnectionState,
  writeBotConnectionState,
} from '../lib/botConnection';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'live-trading', label: 'Live Trading' },
  { key: 'demo', label: 'Demo' },
];

const PREMIUM_ACCESS_KEY = 'ai-trade-premium-status';

const readPremiumAccess = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(PREMIUM_ACCESS_KEY) === 'true';
  } catch {
    return false;
  }
};

const writePremiumAccess = (connected: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PREMIUM_ACCESS_KEY, String(connected));
    window.dispatchEvent(new CustomEvent('aiTradePremiumAccessChanged', { detail: { connected } }));
  } catch {
    // Ignore storage issues in restricted environments.
  }
};

export const Header = ({ currentPage, onNavigate }: HeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBotConnected, setIsBotConnected] = useState<boolean>(() => readBotConnectionState());
  const [isPremiumConnected, setIsPremiumConnected] = useState<boolean>(() => readPremiumAccess());
  const { user, signOut } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeBotConnectionState((value) => setIsBotConnected(value));
    const handlePremiumAccessChange = () => setIsPremiumConnected(readPremiumAccess());

    if (typeof window !== 'undefined') {
      window.addEventListener('aiTradePremiumAccessChanged', handlePremiumAccessChange as EventListener);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('aiTradePremiumAccessChanged', handlePremiumAccessChange as EventListener);
      }
    };
  }, []);

  const handleMenuClick = (page: string) => {
    setShowUserMenu(false);
    onNavigate(page);
  };

  const handleBotToggle = () => {
    const nextState = !isBotConnected;
    setIsBotConnected(nextState);
    writeBotConnectionState(nextState);
  };

  const handleUpgradeConnect = () => {
    const trimmedUserId = userId.trim();
    const trimmedPasskey = passkey.trim();

    if (!trimmedUserId || !trimmedPasskey) {
      setErrorMessage('Please enter your user ID and passkey.');
      return;
    }

    if (user && trimmedUserId !== user.id && trimmedUserId !== user.email) {
      setErrorMessage('User ID does not match your Supabase account.');
      return;
    }

    setErrorMessage('');
    setIsPremiumConnected(true);
    writePremiumAccess(true);
    setShowUpgradeModal(false);
    setUserId('');
    setPasskey('');
  };

  return (
    <>
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

          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isPremiumConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-[#dfe7f0] bg-[#f6f9ff] text-[#1267d1] hover:bg-[#edf5ff]'
            }`}
          >
            {isPremiumConnected ? 'Premium' : 'Upgrade'}
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

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Premium</div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">Connect Signals</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setErrorMessage('');
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-sky-700">Premium signal access</span>
                <span className="rounded-full bg-sky-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Pro
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Connect your premium signal account to unlock live trading alerts, AI trade ideas, and market entry signals.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder={user?.id || 'Enter your user ID'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Passkey</label>
                <input
                  type="password"
                  value={passkey}
                  onChange={(event) => setPasskey(event.target.value)}
                  placeholder="Enter your passkey"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setErrorMessage('');
                  setUserId('');
                  setPasskey('');
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpgradeConnect}
                className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
