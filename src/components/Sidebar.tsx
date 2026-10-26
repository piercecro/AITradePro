import {
  Home,
  Wallet,
  TrendingUp,
  Settings,
  Users,
  Shield,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Bell,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

const navItems = [
  { icon: Home, label: 'Dashboard', value: 'dashboard' },
  { icon: Wallet, label: 'Trades', value: 'trade' },
  { icon: TrendingUp, label: 'Portfolio', value: 'balance' },
  { icon: BarChart3, label: 'Signals', value: 'dashboard' },
  { icon: Briefcase, label: 'Accounts', value: 'account' },
  { icon: ArrowLeftRight, label: 'Trading View', value: 'trade' },
];

const secondGroup = [
  { icon: Activity, label: 'Signals', value: 'dashboard' },
  { icon: Bell, label: 'Watchlist', value: 'dashboard' },
  { icon: Users, label: 'My Groups', value: 'referral' },
  { icon: Settings, label: 'Settings', value: 'settings' },
];

export const Sidebar = ({ currentPage, onNavigate, isAdmin }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[230px] border-r border-[#dfe7f0] bg-[#f7f9fc] px-4 py-5">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">
          C
        </div>
        <div className="text-[28px] font-black tracking-[-0.08em] text-slate-900">cornix</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.value + item.label}
            onClick={() => onNavigate(item.value)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              currentPage === item.value
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]'
                : 'text-slate-600 hover:bg-white hover:text-slate-800'
            }`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-5 border-t border-[#e2eaf2] pt-4">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Monitoring
        </div>
        <nav className="space-y-1">
          {secondGroup.map((item) => (
            <button
              key={item.value + item.label}
              onClick={() => onNavigate(item.value)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-white hover:text-slate-800"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-5">
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              currentPage === 'admin' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Shield size={16} />
            <span>Admin Panel</span>
          </button>
        )}
      </div>
    </aside>
  );
};
