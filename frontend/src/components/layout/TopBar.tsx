import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Crown,
  Coins,
  Gem,
  Plus,
  Bell,
  Settings,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { HealthIndicator } from './HealthIndicator';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TopBarProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const TopBar: React.FC<TopBarProps> = ({ user, setUser }) => {
  const { isAuthenticated, user: authUser, logout, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Active user is authUser if logged in, fallback to local/demo user
  const activeUser = authUser || user;
  const xpPercent = Math.min(100, Math.round((activeUser.xp / activeUser.xpToNextLevel) * 100));

  const handleAddCoins = () => {
    setUser((prev) => ({ ...prev, coins: prev.coins + 1000 }));
    showToast('Claimed +1,000 Coins reward!', 'gold', 'Coins Added');
  };

  const handleAddGems = () => {
    setUser((prev) => ({ ...prev, gems: prev.gems + 50 }));
    showToast('Claimed +50 Gems reward!', 'gold', 'Gems Added');
  };

  return (
    <header className="sticky top-0 z-30 w-full h-18 bg-[#0B0B14]/90 backdrop-blur-xl border-b border-[#201E38]/80 px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search cards, sets, or players..."
          className="w-full pl-10 pr-4 py-2 bg-[#141424] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
        />
      </div>

      {/* Right Controls: User Profile + Currencies + Notifications + Settings */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* User Profile Capsule or Sign In Trigger */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-[#161628] border border-transparent hover:border-[#2A2A44] transition-all group cursor-pointer"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-brand-purple shadow-glow-purple bg-surface-card">
                  <img
                    src={activeUser.avatarUrl}
                    alt={activeUser.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1.5 -right-1 text-amber-400 filter drop-shadow">
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>

              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    {activeUser.username}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Level {activeUser.level}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-20 bg-[#252538] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-violet to-brand-purple h-full rounded-full transition-all duration-300"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {activeUser.xp} / {activeUser.xpToNextLevel} XP
                  </span>
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#121222] border border-[#2A2A44] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#25253E] mb-1">
                  <span className="text-xs font-bold text-white block">{activeUser.username}</span>
                  <span className="text-[10px] text-gray-400 font-mono truncate block">
                    {activeUser.email}
                  </span>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-surface-light rounded-xl transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-brand-purple" />
                  <span>Trainer Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-violet to-purple-600 hover:from-purple-600 hover:to-brand-purple text-white text-xs font-bold shadow-glow-purple transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}

        {/* Currency: Gold Coins */}
        <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-[#141424] border border-amber-500/30 shadow-sm">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono">
            {activeUser.coins.toLocaleString()}
          </span>
          <button
            onClick={handleAddCoins}
            className="w-5 h-5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Claim Coins"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Currency: Purple Gems */}
        <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-[#141424] border border-fuchsia-500/30 shadow-sm">
          <Gem className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs sm:text-sm font-extrabold text-fuchsia-300 font-mono">
            {activeUser.gems.toLocaleString()}
          </span>
          <button
            onClick={handleAddGems}
            className="w-5 h-5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/40 text-fuchsia-300 flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Claim Gems"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Backend API Health Status */}
        <div className="hidden xl:block">
          <HealthIndicator />
        </div>

        {/* Notification Bell */}
        <button
          onClick={() =>
            showToast(
              'Phase 2 Authentication & Starting Vault active!',
              'gold',
              'System Alert'
            )
          }
          className="relative p-2 rounded-xl bg-[#141424] text-gray-300 hover:text-white border border-[#2A2A44] hover:border-purple-500/40 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* Settings Button */}
        <Link
          to="/profile"
          className="p-2 rounded-xl bg-[#141424] text-gray-300 hover:text-white border border-[#2A2A44] hover:border-purple-500/40 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
