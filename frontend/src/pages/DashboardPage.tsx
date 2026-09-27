import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PackageOpen,
  ShoppingBag,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CollectionProgressWidget } from '../components/widgets/CollectionProgressWidget';
import { DailyMissionsWidget } from '../components/widgets/DailyMissionsWidget';
import { MarketTrendsWidget } from '../components/widgets/MarketTrendsWidget';
import { UserProfile, Card, BoosterPack } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  fetchDailyStreak, fetchCards, fetchShopPacks, 
  fetchMyCollection, sellCard 
} from '../services/api';

interface DashboardProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const DashboardPage: React.FC<DashboardProps> = ({ user, setUser }) => {
  const [recentPulls, setRecentPulls] = useState<Card[]>([]);
  const [packs, setPacks] = useState<BoosterPack[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [canClaimToday, setCanClaimToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    // 1. Fetch Featured Packs
    fetchShopPacks()
      .then((data) => {
        if (data && data.length > 0) setPacks(data);
      })
      .catch((err) => console.warn('Failed to load packs:', err));

    // 2. Fetch Recent Pulls from Real Database
    if (token) {
      fetchMyCollection(token).then((coll) => {
        if (coll && coll.items && coll.items.length > 0) {
          const userCardsMapped: Card[] = coll.items.slice(0, 5).map((uc) => ({
            id: uc.card.id,
            name: uc.card.name,
            setId: uc.card.set_id,
            setName: uc.card.set_id === 'base1' ? 'Base Set' : uc.card.set_id,
            number: uc.card.number,
            rarity: uc.card.rarity as any,
            hp: uc.card.hp,
            types: uc.card.types ? uc.card.types.split(', ') : [],
            imageUrl: uc.card.image_url,
            marketPrice: uc.card.market_price,
            ownedQuantity: uc.quantity,
            artist: uc.card.artist,
            flavorText: uc.card.flavor_text,
          }));
          setRecentPulls(userCardsMapped);
        } else {
          loadFallbackCards();
        }
      });
    } else {
      loadFallbackCards();
    }

    // 3. Fetch Daily Streak
    if (token) {
      fetchDailyStreak(token).then((data) => {
        if (data) {
          setCanClaimToday(data.can_claim_today);
          setCurrentStreak(data.current_streak);
        }
      });
    }
  }, [token]);

  const loadFallbackCards = () => {
    fetchCards({ limit: 5 }).then((res) => {
      if (res && res.items.length > 0) {
        setRecentPulls(res.items);
      }
    });
  };

  const handleKeepCard = (card: Card) => {
    showToast(`${card.name} kept in your master collection binder!`, 'success', 'Card Secured');
  };

  const handleSellCard = async (card: Card) => {
    if (token) {
      try {
        const res = await sellCard(card.id, 1, false, token);
        showToast(res.message, 'gold', 'Card Liquidated');
        setRecentPulls((prev) => prev.filter((c) => c.id !== card.id));
        await refreshUser();
        return;
      } catch (err: any) {
        // Fallback local sell
      }
    }

    const sellValue = Math.round(card.marketPrice * 0.70);
    setUser((prev) => ({
      ...prev,
      coins: prev.coins + sellValue,
    }));
    setRecentPulls((prev) => prev.filter((c) => c.id !== card.id));
    showToast(`Sold 1x ${card.name} for +${sellValue.toLocaleString()} Coins!`, 'gold', 'Card Liquidated');
  };

  const handleClaimMissionCoins = (amount: number) => {
    setUser((prev) => ({ ...prev, coins: prev.coins + amount }));
  };

  const featuredPack = packs.find((p) => p.featured) || packs[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-16">
      {/* LEFT / CENTER COLUMN */}
      <div className="xl:col-span-8 space-y-6">
        {/* Daily Streak & Live Event Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface-card to-purple-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-display">
                  {canClaimToday
                    ? '🎁 Daily Login Reward Ready!'
                    : `🔥 ${currentStreak}-Day Streak Active`}
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                  ⚡ 2x XP Surge Live
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {canClaimToday
                  ? 'Check in now to claim today’s free coins & progress your 7-day streak calendar.'
                  : 'You have collected today’s check-in bonus! The daily reset occurs at 00:00 UTC.'}
              </p>
            </div>
          </div>

          <Link to="/events" className="shrink-0">
            <Button
              size="sm"
              variant={canClaimToday ? 'gold' : 'outline'}
              className="text-xs w-full sm:w-auto"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {canClaimToday ? 'Claim Daily Bonus' : 'View Events Hub'}
            </Button>
          </Link>
        </div>

        {/* HERO BANNER: REAL POKÉMON BOOSTER PACK */}
        <div className="relative rounded-3xl overflow-hidden border border-[#2A2A48] bg-gradient-to-r from-[#121224] via-[#15152C] to-[#0D1022] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E1C] via-[#0E0E1C]/80 to-transparent pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* 3D Foil Booster Pack Image */}
            <div className="relative group shrink-0 select-none">
              <div className="absolute -inset-2 bg-gradient-to-tr from-brand-violet via-purple-500 to-amber-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative w-40 sm:w-48 aspect-[3/4.2] rounded-xl overflow-hidden shadow-2xl border-2 border-purple-400/50 holo-card-shine bg-slate-950 flex items-center justify-center p-3">
                <img
                  src={featuredPack?.coverImage || 'https://assets.tcgdex.net/en/base/base1/logo.webp'}
                  alt={featuredPack?.name || 'Base Set Booster'}
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-center">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-extrabold truncate">
                    {featuredPack?.name || 'BASE SET BOOSTER'}
                  </span>
                  <span className="text-[9px] text-purple-300">10 POKÉMON CARDS</span>
                </div>
              </div>
            </div>

            {/* Banner Copy & Call to Action */}
            <div className="space-y-4 flex-1 text-center md:text-left">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-purple-400 font-bold block mb-1">
                  OFFICIAL BOOSTER SERIES
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white font-display leading-tight tracking-wide">
                  OPEN YOUR <br className="hidden sm:inline" />
                  NEXT PACK
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-md leading-relaxed">
                  Discover 300+ authentic cards across Base Set, Jungle, Fossil, and Team Rocket.
                  Pull rare holographic foils, grade them at NGS, and duel Gym Leaders!
                </p>
              </div>

              {/* Price Tag Capsule */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
                <span>🪙 {featuredPack?.priceCoins?.toLocaleString() || '1,000'}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => navigate('/packs')}
                  leftIcon={<PackageOpen className="w-4 h-4 text-white" />}
                  className="shadow-glow-purple bg-gradient-to-r from-brand-violet to-purple-600 hover:from-purple-600 hover:to-brand-purple"
                >
                  OPEN PACK
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => navigate('/shop')}
                  leftIcon={<ShoppingBag className="w-4 h-4 text-gray-300" />}
                  className="bg-black/40 border-[#2A2A44] hover:bg-[#1C1C30]"
                >
                  SHOP PACKS
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURED BOOSTER PACKS ROW */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-display">
              AUTHENTIC POKÉMON SETS
            </h3>
            <Link to="/shop" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {packs.map((pack) => (
              <div
                key={pack.id}
                onClick={() => navigate('/shop')}
                className="bg-[#121222] border border-[#201E38] hover:border-purple-500/50 rounded-2xl p-3 space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-purple cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="aspect-[3/4.2] rounded-xl overflow-hidden bg-black/60 relative border border-[#25253E] group-hover:border-purple-400/40 p-2 flex items-center justify-center">
                    <img
                      src={pack.coverImage}
                      alt={pack.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-center">
                      <h4 className="text-[11px] font-bold text-white font-display truncate">
                        {pack.name}
                      </h4>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{pack.name}</h4>
                    <p className="text-[10px] text-gray-400">{pack.cardsCount} cards per pack</p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    🪙 {pack.priceCoins.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-purple-400 font-bold group-hover:underline">
                    Buy &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT PULLS ROW (REAL POKÉMON ARTWORK) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-display">
              {token ? 'YOUR SPECIMEN VAULT' : 'FEATURED POKÉMON SPECIMENS'}
            </h3>
            <Link to="/collection" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              View Collection &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {recentPulls.map((card) => {
              const isSecret = card.rarity === 'Secret Rare';
              const isUltra = card.rarity === 'Ultra Rare' || card.rarity === 'Rare Holo';

              return (
                <div
                  key={card.id}
                  className={`bg-[#121222] rounded-2xl p-2.5 flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1 ${
                    isSecret
                      ? 'border-amber-400/70 shadow-glow-gold'
                      : isUltra
                      ? 'border-purple-500/60 shadow-glow-purple'
                      : 'border-[#201E38] hover:border-purple-400/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Badge */}
                    <div className="flex items-center justify-between">
                      <Badge rarity={card.rarity} className="text-[9px] px-1.5 py-0 truncate max-w-[90px]" />
                    </div>

                    {/* Real Pokémon Card Artwork */}
                    <div className="aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black relative border border-white/10 holo-card-shine">
                      <img 
                        src={card.imageUrl} 
                        alt={card.name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    </div>

                    {/* Card Title */}
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{card.name}</h4>
                      <span className="text-[10px] text-amber-300 font-mono font-bold block">
                        {card.marketPrice.toLocaleString()} 🪙
                      </span>
                    </div>
                  </div>

                  {/* Keep / Sell Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#201E38]/80">
                    <button
                      onClick={() => handleKeepCard(card)}
                      className="py-1 rounded-lg bg-[#1C1C30] hover:bg-[#252542] text-[10px] font-semibold text-gray-200 transition-colors cursor-pointer"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => handleSellCard(card)}
                      className="py-1 rounded-lg bg-purple-900/30 hover:bg-purple-900/60 border border-purple-500/30 text-[10px] font-semibold text-purple-300 transition-colors cursor-pointer"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Real Widgets */}
      <div className="xl:col-span-4 space-y-6">
        {/* Collection Progress Donut Widget */}
        <CollectionProgressWidget collected={user.totalCards} total={user.maxCards} />

        {/* Daily Missions Widget */}
        <DailyMissionsWidget onRewardClaim={handleClaimMissionCoins} />

        {/* Live Market Trends Widget */}
        <MarketTrendsWidget />
      </div>
    </div>
  );
};

export default DashboardPage;
