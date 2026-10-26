import { useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Home,
  LayoutGrid,
  Settings,
  TrendingUp,
  Wallet,
  Shield,
  Users,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

interface SidebarItem {
  label: string;
  value: string;
  icon?: any;
}

const topItems: SidebarItem[] = [
  { label: 'Dashboard', value: 'dashboard', icon: Home },
  { label: 'Trades', value: 'trade', icon: Wallet },
];

const portfolioItems: SidebarItem[] = [
  { label: 'Accounts', value: 'account', icon: Users },
  { label: 'Portfolio', value: 'balance', icon: Briefcase },
];

const portfolioSubItems: SidebarItem[] = [
  { label: 'Assets', value: 'balance', icon: Wallet },
  { label: 'Positions', value: 'trade', icon: TrendingUp },
];

const monitoringItems: SidebarItem[] = [
  { label: 'Signals', value: 'dashboard', icon: BarChart3 },
  { label: 'Watchlist', value: 'dashboard', icon: Bell },
  { label: 'My Groups', value: 'referral', icon: Users },
  { label: 'Settings', value: 'settings', icon: Settings },
];

export const Sidebar = ({ currentPage, onNavigate, isAdmin }: SidebarProps) => {
  const [openPortfolio, setOpenPortfolio] = useState(true);
  const [openMonitoring, setOpenMonitoring] = useState(false);

  const handleItemClick = (value: string) => {
    onNavigate(value);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] border-r border-[#dfe7f0] bg-[#f7f9fc] px-4 py-5">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">
          C
        </div>
        <div className="text-[28px] font-black tracking-[-0.08em] text-slate-900">cornix</div>
      </div>

      <nav className="space-y-1">
        {topItems.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleItemClick(value)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              currentPage === value
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
                : 'text-slate-600 hover:bg-white hover:text-slate-800'
            }`}
          >
            {Icon && <Icon size={16} />}
            <span>{label}</span>
          </button>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpenPortfolio((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid size={16} />
              <span className="font-medium">Portfolio</span>
            </div>
            {openPortfolio ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {openPortfolio && (
            <div className="ml-5 mt-1 space-y-1 border-l border-[#e2eaf2] pl-3">
              {portfolioItems.map(({ label, value, icon: Icon }) => (
                <div key={value} className="space-y-1">
                  <button
                    onClick={() => handleItemClick(value)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                      currentPage === value
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    {Icon && <Icon size={15} />}
                    <span>{label}</span>
                  </button>

                  {label === 'Portfolio' && (
                    <div className="ml-5 space-y-1 border-l border-[#edf2f7] pl-3">
                      {portfolioSubItems.map(({ label: subLabel, value: subValue, icon: SubIcon }) => (
                        <button
                          key={subValue}
                          onClick={() => handleItemClick(subValue)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                            currentPage === subValue
                              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
                              : 'text-slate-500 hover:bg-white hover:text-slate-700'
                          }`}
                        >
                          {SubIcon && <SubIcon size={14} />}
                          <span>{subLabel}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpenMonitoring((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={16} />
              <span className="font-medium">Monitoring</span>
            </div>
            {openMonitoring ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {openMonitoring && (
            <div className="ml-5 mt-1 space-y-1 border-l border-[#e2eaf2] pl-3">
              {monitoringItems.map(({ label, value, icon: Icon }) => (
                <button
                  key={value + label}
                  onClick={() => handleItemClick(value)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                    currentPage === value
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
                      : 'text-slate-600 hover:bg-white hover:text-slate-800'
                  }`}
                >
                  {Icon && <Icon size={15} />}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-6 border-t border-[#e2eaf2] pt-4">
        <button
          onClick={() => handleItemClick('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
            currentPage === 'settings'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
              : 'text-slate-600 hover:bg-white hover:text-slate-800'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => handleItemClick('referral')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
            currentPage === 'referral'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
              : 'text-slate-600 hover:bg-white hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Referral</span>
        </button>
      </div>

      {isAdmin && (
        <button
          onClick={() => onNavigate('admin')}
          className={`mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
            currentPage === 'admin'
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
          }`}
        >
          <Shield size={16} />
          <span>Admin Panel</span>
        </button>
      )}

      <div className="mt-auto pt-5 text-xs text-slate-400">
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-[#e7edf5]">
          <div className="h-7 w-7 rounded-full bg-[#1d4ed8] text-center text-[10px] font-bold leading-7 text-white">
            P
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-700">Pierce Crosby</div>
            <div className="truncate text-[10px] text-slate-400">pierce@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
