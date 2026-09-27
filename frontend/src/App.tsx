import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { ShopPage } from './pages/ShopPage';
import { PacksPage } from './pages/PacksPage';
import { CollectionPage } from './pages/CollectionPage';
import { InventoryPage } from './pages/InventoryPage';
import { MarketPage } from './pages/MarketPage';
import { MissionsPage } from './pages/MissionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventsPage } from './pages/EventsPage';
import TradingPage from './pages/TradingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { CosmeticsPage } from './pages/CosmeticsPage';
import { PlayerShopsPage } from './pages/PlayerShopsPage';
import { ShopFrontPage } from './pages/ShopFrontPage';
import GradingPage from './pages/GradingPage';
import DecksPage from './pages/DecksPage';
import BattlePage from './pages/BattlePage';
import { INITIAL_USER } from './data/mockData';
import { UserProfile } from './types';

const MainLayout: React.FC = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [localUser, setLocalUser] = useState<UserProfile>(INITIAL_USER);

  // Active user is authUser if logged in, fallback to local/demo user
  const activeUser = authUser || localUser;

  const handleSetUser: React.Dispatch<React.SetStateAction<UserProfile>> = (value) => {
    if (typeof value === 'function') {
      if (authUser) {
        setAuthUser((prev) => (prev ? value(prev) : null));
      } else {
        setLocalUser(value);
      }
    } else {
      if (authUser) {
        setAuthUser(value);
      } else {
        setLocalUser(value);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0B14] text-gray-100 antialiased selection:bg-brand-violet selection:text-white">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Search, Currencies, and Profile */}
        <TopBar user={activeUser} setUser={handleSetUser} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/dashboard" element={<DashboardPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/shop" element={<ShopPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/inventory" element={<InventoryPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/market" element={<MarketPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/missions" element={<MissionsPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/events" element={<EventsPage user={activeUser} setUser={handleSetUser} />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/player/:username" element={<PublicProfilePage />} />
            <Route path="/cosmetics" element={<CosmeticsPage />} />
            <Route path="/shops" element={<PlayerShopsPage />} />
            <Route path="/shop/:username" element={<ShopFrontPage />} />
            <Route path="/grading" element={<GradingPage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/battle" element={<BattlePage />} />
            <Route path="/profile" element={<ProfilePage user={activeUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
