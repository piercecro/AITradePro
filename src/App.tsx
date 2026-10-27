import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { BalancePage } from './pages/BalancePage';
import { TradePage } from './pages/TradePage';
import { SettingsPage } from './pages/SettingsPage';
import { ReferralPage } from './pages/ReferralPage';
import { MyAccountPage } from './pages/MyAccountPage';
import { AdminDepositPanel } from './pages/AdminDepositPanel';
import { supabase } from './lib/supabase';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const saved = localStorage.getItem('currentPage');
    return saved || 'dashboard';
  });
  const [verifying, setVerifying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (window.location.pathname === '/auth/callback') {
        setVerifying(true);
        try {
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) {
            console.error('Auth redirect error:', error.message);
          } else {
            window.history.replaceState({}, '', '/');
            window.location.href = '/';
            localStorage.setItem('currentPage', 'dashboard');
          }
        } catch (err) {
          console.error('Unexpected auth redirect error:', err);
        } finally {
          setVerifying(false);
        }
      }
    };
    handleAuthRedirect();
  }, []);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error.message);
          setIsAdmin(false);
          return;
        }

        setIsAdmin((data as any)?.role === 'admin');
      } catch (err) {
        console.error('Unexpected error fetching admin role:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-[#edf3f8] flex items-center justify-center">
        <div className="text-slate-700 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage mode="dashboard" />;
      case 'live-trading':
        return <DashboardPage mode="live-trading" />;
      case 'demo':
        return <DashboardPage mode="demo" />;
      case 'balance':
        return <BalancePage defaultTab="assets" />;
      case 'positions':
        return <BalancePage defaultTab="positions" />;
      case 'trade':
        return <TradePage />;
      case 'settings':
        return <SettingsPage />;
      case 'referral':
        return <ReferralPage />;
      case 'account':
        return <MyAccountPage />;
      case 'admin':
        return isAdmin ? (
          <AdminDepositPanel />
        ) : (
          <div className="text-center text-red-500 p-8">Access Denied: Admins Only</div>
        );
      default:
        return <DashboardPage mode="dashboard" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] text-slate-800">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} isAdmin={isAdmin} />
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="ml-[230px] pt-[72px] min-h-screen">{renderPage()}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
