import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Headset,
  Home,
  LayoutGrid,
  Settings,
  Shield,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

interface SidebarItem {
  label: string;
  value: string;
  icon: LucideIcon;
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
  { label: 'My Bot', value: 'my-bot', icon: Bot },
];

const monitoringItems: SidebarItem[] = [
  { label: 'Signals', value: 'signals', icon: BarChart3 },
  { label: 'Watchlist', value: 'watchlist', icon: Bell },
  { label: 'Marketplace', value: 'marketplace', icon: LayoutGrid },
];

export const Sidebar = ({ currentPage, onNavigate, isAdmin }: SidebarProps) => {
  const { user } = useAuth();
  const [profileUsername, setProfileUsername] = useState('');
  const [openPortfolio, setOpenPortfolio] = useState(true);
  const [openMonitoring, setOpenMonitoring] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadUsername = async () => {
      if (!user) {
        setProfileUsername('');
        return;
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error('Error fetching sidebar username:', error.message);
        setProfileUsername('');
        return;
      }
      setProfileUsername(data?.username?.trim() || '');
    };
    void loadUsername();
    return () => { mounted = false; };
  }, [user]);

  const metadataUsername = typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username : '';
  const metadataFullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const displayName = profileUsername || metadataUsername || metadataFullName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';

  const handleItemClick = (value: string) => {
    if (value === 'signals') {
      setShowSignalModal(true);
      return;
    }
    onNavigate(value);
  };

  const itemClass = (value: string) => `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${currentPage === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-[#e7edf5]' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`;
  const openSupport = () => window.dispatchEvent(new CustomEvent('aitradepro:open-support'));

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 flex h-full w-[250px] flex-col border-r border-[#dfe7f0] bg-[#f7f9fc] px-4 py-5">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">A</div>
          <div className="text-[28px] font-black tracking-[-0.08em] text-slate-900">AITradePro</div>
        </div>

        <nav className="space-y-1 overflow-y-auto">
          {topItems.map(({ label, value, icon: Icon }) => (
            <button key={value} type="button" onClick={() => handleItemClick(value)} className={itemClass(value)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}

          <div className="pt-2">
            <button type="button" onClick={() => setOpenPortfolio((previous) => !previous)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white">
              <div className="flex items-center gap-3"><LayoutGrid size={16} /><span className="font-medium">Portfolio</span></div>
              {openPortfolio ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            {openPortfolio && <div className="ml-5 mt-1 space-y-1 border-l border-[#e2eaf2] pl-3">
              {portfolioItems.map(({ label, value, icon: Icon }) => (
                <div key={value} className="space-y-1">
                  <button type="button" onClick={() => handleItemClick(value)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${currentPage === value ? 'bg-white font-medium text-slate-900' : 'text-slate-600 hover:bg-white'}`}>
                    <Icon size={15} /><span>{label}</span>
                  </button>
                  {label === 'Portfolio' && <div className="ml-5 space-y-1 border-l border-[#edf2f7] pl-3">
                    {portfolioSubItems.map(({ label: subLabel, value: subValue, icon: SubIcon }) => (
                      <button key={subValue} type="button" onClick={() => handleItemClick(subValue)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${currentPage === subValue ? 'text-blue-700' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}>
                        <SubIcon size={13} /><span>{subLabel}</span>
                      </button>
                    ))}
                  </div>}
                </div>
              ))}
            </div>}
          </div>

          <div className="pt-2">
            <button type="button" onClick={() => setOpenMonitoring((previous) => !previous)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white">
              <div className="flex items-center gap-3"><BarChart3 size={16} /><span className="font-medium">Monitoring</span></div>
              {openMonitoring ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            {openMonitoring && <div className="ml-5 mt-1 space-y-1 border-l border-[#e2eaf2] pl-3">
              {monitoringItems.map(({ label, value, icon: Icon }) => (
                <button key={value} type="button" onClick={() => handleItemClick(value)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors ${currentPage === value ? 'bg-white text-slate-900' : 'text-slate-600 hover:bg-white'}`}>
                  <Icon size={15} /><span>{label}</span>
                </button>
              ))}
            </div>}
          </div>

          <div className="mt-6 border-t border-[#e2eaf2] pt-4">
            <button type="button" onClick={() => handleItemClick('settings')} className={itemClass('settings')}><Settings size={16} /><span>Settings</span></button>
            <button type="button" onClick={() => handleItemClick('referral')} className={`mt-1 ${itemClass('referral')}`}><Users size={16} /><span>Affiliation</span></button>
          </div>

          {isAdmin && <button type="button" onClick={() => onNavigate('admin')} className={`mt-3 ${itemClass('admin')}`}><Shield size={16} /><span>Admin Panel</span></button>}
        </nav>

        <div className="mt-auto pt-5 text-xs text-slate-400">
          <button type="button" onClick={openSupport} className="mb-3 flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
            <Headset size={17} /><span>Support</span>
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-[#e7edf5]">
            <div className="h-7 w-7 rounded-full bg-[#1d4ed8] text-center text-[10px] font-bold leading-7 text-white">{avatarInitial}</div>
            <div className="min-w-0"><div className="truncate font-medium text-slate-700">{displayName}</div><div className="truncate text-[10px] text-slate-400">{displayEmail}</div></div>
          </div>
        </div>
      </aside>

      {showSignalModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Premium</div><h3 className="mt-1 text-2xl font-bold text-slate-900">Connect Signals</h3></div>
            <button type="button" onClick={() => setShowSignalModal(false)} aria-label="Close signals dialog" className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-500 hover:bg-slate-200">×</button>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-sky-700">Premium signals</span><span className="text-xs font-semibold text-sky-600">Premium</span></div>
            <p className="text-sm leading-6 text-slate-600">Connect premium signal service to unlock live trading alerts, AI trade ideas, and market entry signals.</p>
          </div>
          <div className="mt-5 flex gap-3"><button type="button" onClick={() => setShowSignalModal(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">Close</button><button type="button" onClick={() => setShowSignalModal(false)} className="flex-1 rounded-xl bg-[#1d73f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1667d8]">Continue</button></div>
        </div>
      </div>}
    </>
  );
};
