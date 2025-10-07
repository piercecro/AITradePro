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
import { supabase } from './lib/supabase';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    // restore last visited page from localStorage
    return localStorage.getItem('currentPage') || 'dashboard';
  });
  const [verifying, setVerifying] = useState(false);

  // ✅ Properly handle Supabase redirect after email verification
  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (window.location.pathname === '/auth/callback') {
        setVerifying(true);
        try {
          // Extract and store session from Supabase redirect URL
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) {
            console.error('Auth redirect error:', error.message);
          } else {
            // ✅ Navigate to dashboard after successful verification
            window.history.replaceState({}, '', '/');
            window.location.href = '/'; // reloads app to restore authenticated state
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

  // ✅ Save current page to localStorage
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'balance':
        return <BalancePage />;
      case 'trade':
        return <TradePage />;
      case 'settings':
        return <SettingsPage />;
      case 'referral':
        return <ReferralPage />;
      case 'account':
        return <MyAccountPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <Header onNavigate={setCurrentPage} />
      {renderPage()}
    </>
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
