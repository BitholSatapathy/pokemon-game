import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { ShopPage } from './pages/ShopPage';
import { PacksPage } from './pages/PacksPage';
import { CollectionPage } from './pages/CollectionPage';
import { InventoryPage } from './pages/InventoryPage';
import { MarketPage } from './pages/MarketPage';
import { MissionsPage } from './pages/MissionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { INITIAL_USER } from './data/mockData';
import { UserProfile } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen flex bg-[#0B0B14] text-gray-100 antialiased selection:bg-brand-violet selection:text-white">
          {/* Left Persistent Navigation Sidebar (Matches Concept Art) */}
          <Sidebar />

          {/* Main App Container */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar with Search, Currencies, and Profile */}
            <TopBar user={user} setUser={setUser} />

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
              <Routes>
                {/* Home defaults to the Concept Dashboard */}
                <Route path="/" element={<DashboardPage user={user} setUser={setUser} />} />
                <Route path="/dashboard" element={<DashboardPage user={user} setUser={setUser} />} />
                <Route path="/shop" element={<ShopPage user={user} setUser={setUser} />} />
                <Route path="/packs" element={<PacksPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/inventory" element={<InventoryPage user={user} setUser={setUser} />} />
                <Route path="/market" element={<MarketPage user={user} setUser={setUser} />} />
                <Route path="/missions" element={<MissionsPage user={user} setUser={setUser} />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
