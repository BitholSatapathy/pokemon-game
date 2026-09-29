import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  PackageOpen,
  FolderHeart,
  Boxes,
  Store,
  Target,
  User,
  Sparkles,
  Flame,
  ArrowLeftRight,
  Trophy,
  Palette,
  Building2,
  ShieldCheck,
  Layers,
  Swords,
  Crown,
  X,
  Menu,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const Sidebar: React.FC = () => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { to: '/shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
    { to: '/packs', label: 'Open Packs', icon: <PackageOpen className="w-4 h-4" /> },
    { to: '/collection', label: 'Collection', icon: <FolderHeart className="w-4 h-4" /> },
    { to: '/inventory', label: 'Inventory', icon: <Boxes className="w-4 h-4" /> },
    { to: '/market', label: 'Market', icon: <Store className="w-4 h-4" /> },
    { to: '/missions', label: 'Missions', icon: <Target className="w-4 h-4" /> },
    { to: '/events', label: 'Events & Daily', icon: <Flame className="w-4 h-4 text-amber-400" /> },
    { to: '/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { to: '/battle-pass', label: 'Battle Pass', icon: <Crown className="w-4 h-4 text-amber-300" /> },
    { to: '/trading', label: 'Trading', icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" /> },
    { to: '/shops', label: 'Player Shops', icon: <Building2 className="w-4 h-4 text-emerald-400" /> },
    { to: '/grading', label: 'Grading (NGS)', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { to: '/decks', label: 'Decks', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { to: '/battle', label: 'Battle Arena', icon: <Swords className="w-4 h-4 text-rose-400" /> },
    { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
    { to: '/cosmetics', label: 'Cosmetics', icon: <Palette className="w-4 h-4 text-pink-400" /> },
    { to: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-6 px-4">
      {/* Brand Logo Header */}
      <div className="space-y-6">
        <NavLink to="/" className="flex items-center gap-3 px-2 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet via-purple-500 to-indigo-500 flex items-center justify-center shadow-glow-purple border border-purple-400/50">
              <Sparkles className="w-6 h-6 text-white animate-pulse-slow" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="font-black text-xl tracking-wider text-white uppercase font-display leading-tight flex items-center gap-1">
              <span>NEXUS</span>
            </div>
            <span className="text-[10px] tracking-[0.25em] text-purple-400 font-mono font-bold uppercase -mt-0.5">
              • CARDS •
            </span>
          </div>
        </NavLink>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-violet to-purple-600 text-white shadow-glow-purple border-l-4 border-l-purple-300'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-surface-light/60'
                }`
              }
            >
              <span className="transition-transform group-hover:scale-110">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Season 1 Event Card (Matches Concept Screenshot Bottom Left) */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 p-4 bg-gradient-to-b from-surface-light to-surface/90 shadow-xl group">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity group-hover:opacity-45 transition-opacity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400')`,
          }}
        />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-300 font-bold block">
            SEASON 1
          </span>
          <h4 className="text-sm font-extrabold text-white font-display leading-tight">
            CELESTIAL HORIZONS
          </h4>
          <Link to="/events" onClick={() => setMobileOpen(false)}>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs py-1.5 border-purple-500/50 hover:bg-brand-violet hover:border-purple-400 text-purple-200"
            >
              VIEW EVENT
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-[#0B0B14] border-r border-[#201E38]/80 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3.5 rounded-full bg-brand-violet text-white shadow-glow-purple border border-purple-300 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-72 h-full bg-[#0B0B14] border-r border-[#201E38]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Celestial Horizons Event Modal */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Season 1: Celestial Horizons"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="aspect-[16/9] rounded-xl overflow-hidden relative border border-purple-500/40">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
              alt="Celestial Horizons"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-xs uppercase font-mono tracking-widest text-brand-gold font-bold">
                Time Remaining: 6 Days 14 Hours
              </span>
              <h3 className="text-2xl font-black text-white font-display">
                Ascend to Celestial Horizons
              </h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Season 1 brings Astral booster packs with exclusive elemental Secret Rares, double XP on daily
            missions, and the high-tier <strong>Lumen Seraph</strong> pull challenge.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={() => setEventModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                setEventModalOpen(false);
              }}
              leftIcon={<Flame className="w-4 h-4 text-black" />}
            >
              Join Battle Pass
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
