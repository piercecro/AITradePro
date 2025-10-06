import { Bell, ChevronDown, Settings, MessageCircle, Globe } from 'lucide-react';
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
    <header className="fixed top-0 left-16 right-0 h-16 bg-[#0f1117] border-b border-gray-800 flex items-center justify-between px-6 z-40">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <span className="text-white text-xl font-semibold">AITradePro</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-white text-sm font-medium">3</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-700 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <span className="text-white text-sm">{user?.email?.split('@')[0]}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1d29] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => handleMenuClick('account')}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-3"
              >
                <Users size={18} />
                <span>My account</span>
              </button>
              <button
                onClick={signOut}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-3 border-t border-gray-700"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>

        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <MessageCircle size={20} />
        </button>

        <button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white transition-colors">
          <Globe size={20} />
          <span className="text-sm">EN</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
};

const Users = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CreditCard = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const HelpCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const LogOut = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
