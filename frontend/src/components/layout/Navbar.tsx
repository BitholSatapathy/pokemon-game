import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  PackageOpen,
  FolderHeart,
  Boxes,
  Store,
  Menu,
  X,
  User,
} from 'lucide-react';
import { CurrencyBar } from './CurrencyBar';
import { HealthIndicator } from './HealthIndicator';
import { UserProfile } from '../../types';

interface NavbarProps {
  user: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
    { to: '/packs', label: 'Open Packs', icon: <PackageOpen className="w-4 h-4" /> },
    { to: '/collection', label: 'Binder', icon: <FolderHeart className="w-4 h-4" /> },
    { to: '/inventory', label: 'Inventory', icon: <Boxes className="w-4 h-4" /> },
    { to: '/market', label: 'Market', icon: <Store className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-purple flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-base text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-brand-purple uppercase font-display">
              TCG Collector
            </span>
            <span className="text-[10px] text-brand-purple font-mono -mt-1 tracking-widest uppercase">
              Vibe Simulator
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-violet text-white shadow-glow-purple'
                    : 'text-gray-300 hover:text-white hover:bg-surface-light'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Section: Currencies + Health + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencyBar user={user} />
          <div className="hidden sm:block">
            <HealthIndicator />
          </div>

          {/* Profile Shortcut */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-light border border-transparent hover:border-surface-border transition-colors group"
            title="View Player Profile"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/40 group-hover:border-brand-purple transition-colors bg-surface-card flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-brand-purple" />
              )}
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-surface-light text-gray-300 hover:text-white border border-surface-border"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-4">
          <div className="pb-2 border-b border-surface-border flex items-center justify-between">
            <HealthIndicator />
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-brand-purple font-semibold flex items-center gap-1"
            >
              Profile Settings &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-violet text-white shadow-glow-purple'
                      : 'bg-surface-light/80 text-gray-300 hover:text-white'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
