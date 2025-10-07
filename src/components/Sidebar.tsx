import { Home, Wallet, TrendingUp, Settings, Users, Shield } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean; // ✅ new prop
}

const navItems = [
  { icon: Home, label: 'Dashboard', value: 'dashboard' },
  { icon: Wallet, label: 'Balance', value: 'balance' },
  { icon: TrendingUp, label: 'Trade', value: 'trade' },
  { icon: Settings, label: 'Settings', value: 'settings' },
  { icon: Users, label: 'Referral', value: 'referral' },
];

export const Sidebar = ({ currentPage, onNavigate, isAdmin }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-[#0f1117] border-r border-gray-800 flex flex-col items-center py-6 z-50">
      {/* ✅ App logo placeholder (optional) */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
          A
        </div>
      </div>

      {/* Normal navigation items */}
      <nav className="flex flex-col items-center space-y-3">
        {navItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onNavigate(item.value)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === item.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
      </nav>

      {/* ✅ Admin-only button */}
      {isAdmin && (
        <button
          onClick={() => onNavigate('admin')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center mt-auto mb-4 transition-colors ${
            currentPage === 'admin'
              ? 'bg-yellow-600 text-white'
              : 'text-yellow-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Admin Panel"
        >
          <Shield size={20} />
        </button>
      )}
    </aside>
  );
};
