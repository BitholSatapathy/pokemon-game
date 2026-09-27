import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, FolderHeart, Flame, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CardPanel } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MOCK_CARDS } from '../data/mockData';

export const LandingPage: React.FC = () => {
  const featuredCard = MOCK_CARDS[0]; // Charizard

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-light border border-purple-500/40 text-xs text-purple-300 font-semibold shadow-glow-purple">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
            <span>Next-Gen Trading Card Experience</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-display leading-[1.1]">
            COLLECT. UNBOX. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-violet-400 to-brand-gold">
              BUILD YOUR EMPIRE.
            </span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed">
            Rip booster packs with genuine server-side odds, curate your museum-grade card binder,
            and trade with collectors in a live player-driven marketplace.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <Link to="/packs">
              <Button size="lg" variant="gold" leftIcon={<Flame className="w-5 h-5 text-black" />}>
                Rip Booster Packs
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-border/60 max-w-md">
            <div>
              <div className="text-2xl font-black text-white font-mono">10,000</div>
              <div className="text-xs text-gray-400">Starting Coins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-purple font-mono">100%</div>
              <div className="text-xs text-gray-400">Server RNG</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400 font-mono">27</div>
              <div className="text-xs text-gray-400">Vibe Phases</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card Showcase */}
        <div className="w-full max-w-sm shrink-0 relative flex justify-center z-10">
          <div className="relative group">
            {/* Ambient Card Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-violet to-brand-gold rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />

            <div className="relative glass-panel rounded-3xl p-5 border-2 border-purple-500/50 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-3">
                <Badge rarity={featuredCard.rarity} />
                <span className="text-xs font-mono text-gray-400">#{featuredCard.number}</span>
              </div>

              <div className="aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/60 relative holo-card-shine border border-purple-500/30">
                <img
                  src={featuredCard.imageUrl}
                  alt={featuredCard.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white font-display">{featuredCard.name}</h3>
                  <p className="text-xs text-brand-purple">{featuredCard.setName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-brand-gold font-mono">
                    {featuredCard.marketPrice.toLocaleString()} 🪙
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">+6.2% 24h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Feature Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-display tracking-wide">
              CORE GAME ENGINE MODULES
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Interactive design system previews ready for Phases 2–8
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/shop">
            <CardPanel hoverEffect className="group h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Booster Shop (Phase 4)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Browse authentic booster packs. Spend player coins to purchase packs with real-time balance deductions.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs text-brand-gold font-bold">
                <span>Explore Shop &rarr;</span>
              </div>
            </CardPanel>
          </Link>

          <Link to="/packs">
            <CardPanel hoverEffect className="group h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Pack Opening Engine (Phase 5)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The centerpiece milestone. Unseal booster packs, reveal cards with 3D flip physics and celebratory rarity glows.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs text-brand-purple font-bold">
                <span>Test Unboxing &rarr;</span>
              </div>
            </CardPanel>
          </Link>

          <Link to="/collection">
            <CardPanel hoverEffect className="group h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Binder Collection (Phase 6)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Organize cards by set, filter by rarity and completion percentage, and inspect high-resolution card artwork.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs text-blue-400 font-bold">
                <span>View Binder &rarr;</span>
              </div>
            </CardPanel>
          </Link>
        </div>
      </section>
    </div>
  );
};
