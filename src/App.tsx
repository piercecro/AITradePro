import { useState } from 'react';
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

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
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
