import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Calendar,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  Lock,
  Gift,
  Coins,
  Gem,
  Tag,
  ShoppingBag,
  ArrowRight,
  PackageOpen,
  Award,
} from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import {
  fetchDailyStreak,
  claimDailyStreak,
  fetchActiveEvents,
  fetchDailyFlashDeal,
  purchaseDailyFlashDeal,
  ApiDailyStreakStatus,
  ApiGameEvent,
  ApiFlashDeal,
} from '../services/api';

interface EventsProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const EventsPage: React.FC<EventsProps> = ({ user, setUser }) => {
  const { isAuthenticated, token, openAuthModal, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [streakStatus, setStreakStatus] = useState<ApiDailyStreakStatus | null>(null);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);
  const [isClaimingStreak, setIsClaimingStreak] = useState(false);

  const [events, setEvents] = useState<ApiGameEvent[]>([]);
  const [flashDeal, setFlashDeal] = useState<ApiFlashDeal | null>(null);
  const [isPurchasingDeal, setIsPurchasingDeal] = useState(false);

  // Countdown timer in seconds
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Load streak
  const loadStreak = useCallback(async () => {
    if (!token) return;
    setIsLoadingStreak(true);
    const data = await fetchDailyStreak(token);
    if (data) {
      setStreakStatus(data);
      setCountdownSeconds(data.seconds_to_reset);
    }
    setIsLoadingStreak(false);
  }, [token]);

  // Load active events
  const loadEvents = useCallback(async () => {
    const data = await fetchActiveEvents();
    setEvents(data);
  }, []);

  // Load flash deal
  const loadDeal = useCallback(async () => {
    const data = await fetchDailyFlashDeal(token || undefined);
    if (data) setFlashDeal(data);
  }, [token]);

  useEffect(() => {
    loadEvents();
    loadDeal();
  }, [loadEvents, loadDeal]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadStreak();
    } else {
      setStreakStatus(null);
    }
  }, [isAuthenticated, token, loadStreak]);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown string
  const formatCountdown = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Claim Daily Streak
  const handleClaimStreak = async () => {
    if (!isAuthenticated || !token) {
      showToast('Please sign in or create an account to claim daily rewards!', 'info', 'Sign In Required');
      openAuthModal('login');
      return;
    }

    setIsClaimingStreak(true);
    try {
      const res = await claimDailyStreak(token);
      showToast(res.message, 'gold', 'Daily Check-in Reward Claimed!');

      // Update user state
      setUser((prev) => ({
        ...prev,
        coins: res.new_coin_balance,
        gems: res.new_gem_balance,
        level: res.new_level,
        xp: res.new_xp,
      }));

      // Refresh streak
      await loadStreak();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to claim streak reward', 'error', 'Claim Error');
    } finally {
      setIsClaimingStreak(false);
    }
  };

  // Purchase Flash Deal
  const handlePurchaseFlashDeal = async () => {
    if (!isAuthenticated || !token) {
      showToast('Please sign in to purchase daily flash deals!', 'info', 'Sign In Required');
      openAuthModal('login');
      return;
    }

    if (!flashDeal) return;
    if (user.coins < flashDeal.discount_price) {
      showToast('Insufficient coins in your vault!', 'error', 'Purchase Failed');
      return;
    }

    setIsPurchasingDeal(true);
    try {
      const res = await purchaseDailyFlashDeal(token);
      showToast(res.message, 'gold', 'Flash Deal Unlocked!');

      setUser((prev) => ({
        ...prev,
        coins: res.new_coin_balance,
      }));

      // Refresh deal
      await loadDeal();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to purchase flash deal', 'error', 'Purchase Error');
    } finally {
      setIsPurchasingDeal(false);
    }
  };

  const primaryEvent = events[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Phase 11 Engine • Live Ops & Dynamic Events</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">EVENTS & DAILY SYSTEMS</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Build consecutive 7-day login streaks, leverage active event 2x XP multipliers, and grab daily flash deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/shop">
            <Button variant="outline" size="sm" leftIcon={<ShoppingBag className="w-4 h-4 text-purple-400" />}>
              Booster Shop
            </Button>
          </Link>
          <Link to="/packs">
            <Button variant="gold" size="sm" leftIcon={<PackageOpen className="w-4 h-4 text-black" />}>
              Open Packs
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. HERO STAGE: ACTIVE SEASONAL EVENT */}
      {primaryEvent && (
        <div className="relative rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-r from-[#121224] via-[#161630] to-[#0D1022] shadow-2xl group">
          {/* Banner Art Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            style={{ backgroundImage: `url('${primaryEvent.banner_image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E1C] via-[#0E0E1C]/85 to-transparent pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-brand-violet to-purple-600 text-white shadow-glow-purple border border-purple-400/50">
                  {primaryEvent.badge_text}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  Time Left: {formatCountdown(primaryEvent.seconds_remaining)}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  {primaryEvent.name}
                </h2>
                {primaryEvent.subtitle && (
                  <p className="text-sm font-semibold text-purple-300 mt-1">
                    {primaryEvent.subtitle}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                  {primaryEvent.description}
                </p>
              </div>

              {/* Active Event Buffs */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {primaryEvent.buff_xp_multiplier > 1.0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/50 text-xs font-bold text-purple-200 shadow-glow-purple">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{primaryEvent.buff_xp_multiplier}x Pack Opening XP Surge</span>
                  </div>
                )}
                {primaryEvent.buff_foil_rate_boost > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-xs font-bold text-amber-300 shadow-glow-gold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{(primaryEvent.buff_foil_rate_boost * 100).toFixed(0)}% Holo Foil Rate Boost</span>
                  </div>
                )}
                {primaryEvent.buff_shop_discount_pct > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-xs font-bold text-emerald-300">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{primaryEvent.buff_shop_discount_pct}% Booster Shop Discount</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link to="/packs">
                <Button variant="gold" className="w-full" leftIcon={<PackageOpen className="w-4 h-4 text-black" />}>
                  Rip Packs with 2x XP
                </Button>
              </Link>
              <Link to="/missions">
                <Button variant="outline" className="w-full" leftIcon={<Award className="w-4 h-4 text-purple-300" />}>
                  View Event Bounties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. 7-DAY LOGIN STREAK REWARDS CALENDAR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-purple" />
              <h2 className="text-xl font-bold text-white font-display">7-Day Login Streak Calendar</h2>
            </div>
            <p className="text-xs text-gray-400">
              Check in daily to claim escalating rewards. Reach Day 7 for the exclusive Mythic Dragon Hoard!
            </p>
          </div>

          <div className="flex items-center gap-3">
            {streakStatus && (
              <div className="flex items-center gap-2 bg-surface-light px-3 py-1.5 rounded-xl border border-surface-border text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Streak: {streakStatus.current_streak} / 7 Days
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">Resets in: {formatCountdown(countdownSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid (Days 1–7) */}
        {!isAuthenticated ? (
          <div className="glass-panel p-8 rounded-2xl border border-surface-border text-center space-y-3 max-w-md mx-auto">
            <Gift className="w-8 h-8 text-brand-purple mx-auto" />
            <h3 className="text-base font-bold text-white">Sign In to Claim Daily Rewards</h3>
            <p className="text-xs text-gray-400">
              Connect your collector account to start your 7-day login streak and unlock free booster packs.
            </p>
            <Button variant="primary" onClick={() => openAuthModal('login')}>
              Sign In Now
            </Button>
          </div>
        ) : isLoadingStreak || !streakStatus ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="aspect-[3/4.2] rounded-2xl bg-surface-light animate-pulse border border-surface-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {streakStatus.calendar.map((item) => {
              const isGrand = item.day === 7;

              return (
                <div
                  key={item.day}
                  className={`relative rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 border ${
                    item.is_today
                      ? 'border-amber-400 bg-gradient-to-b from-amber-500/10 via-surface-card to-surface-dark shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
                      : item.is_claimed
                      ? 'border-emerald-500/30 bg-surface-card/60 opacity-80'
                      : isGrand
                      ? 'border-purple-400/50 bg-gradient-to-b from-purple-500/10 to-surface-card'
                      : 'border-surface-border bg-surface-card/50'
                  }`}
                >
                  {/* Top Bar: Day & Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-gray-300">DAY {item.day}</span>
                    {item.is_claimed ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        CLAIMED
                      </span>
                    ) : item.is_today ? (
                      <span className="text-amber-300 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                        READY!
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </div>

                  {/* Reward Visual Icon & Content */}
                  <div className="my-3 text-center space-y-1.5">
                    <div
                      className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${
                        item.is_today
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-glow-gold'
                          : isGrand
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60'
                          : 'bg-surface-light text-gray-300 border border-surface-border'
                      }`}
                    >
                      {item.pack_name ? (
                        <PackageOpen className="w-6 h-6 text-amber-400" />
                      ) : item.reward_gems > 0 ? (
                        <Gem className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Coins className="w-6 h-6 text-amber-400" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white font-display line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Reward Badges */}
                    <div className="space-y-0.5 text-[11px] font-mono">
                      {item.reward_coins > 0 && (
                        <div className="text-amber-300 font-bold">
                          +{item.reward_coins.toLocaleString()} 🪙
                        </div>
                      )}
                      {item.reward_gems > 0 && (
                        <div className="text-purple-300 font-bold">
                          +{item.reward_gems} 💎
                        </div>
                      )}
                      {item.pack_name && (
                        <div className="text-emerald-300 font-bold text-[10px]">
                          1x {item.pack_name}
                        </div>
                      )}
                      {item.reward_xp > 0 && (
                        <div className="text-gray-400 text-[10px]">
                          +{item.reward_xp} XP
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div>
                    {item.is_today ? (
                      <Button
                        size="sm"
                        variant="gold"
                        className="w-full text-xs py-1"
                        onClick={handleClaimStreak}
                        disabled={isClaimingStreak}
                      >
                        {isClaimingStreak ? 'Claiming...' : 'Claim Now'}
                      </Button>
                    ) : item.is_claimed ? (
                      <div className="text-center text-[10px] text-emerald-400 font-mono py-1">
                        Collected ✓
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-gray-500 font-mono py-1">
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ROTATING DAILY FLASH DEAL VAULT */}
      {flashDeal && (
        <div className="glass-panel p-6 rounded-3xl border border-surface-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left: Pack Art & Discount Stamp */}
            <div className="flex items-center gap-5">
              <div className="relative w-28 sm:w-32 aspect-[3/4.2] rounded-xl overflow-hidden border-2 border-amber-500/50 bg-black shrink-0 shadow-2xl holo-card-shine">
                <img
                  src={flashDeal.pack_image}
                  alt={flashDeal.pack_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-rose-400">
                  -{flashDeal.discount_pct}% OFF
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="text-[10px]">
                    DAILY FLASH DEAL
                  </Badge>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Resets in: {formatCountdown(flashDeal.seconds_to_reset)}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  {flashDeal.title}
                </h3>
                <p className="text-xs text-gray-300 max-w-lg">
                  {flashDeal.description} Limit 1 per collector per day.
                </p>

                {/* Price Breakdown */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {flashDeal.discount_price.toLocaleString()} 🪙
                  </span>
                  <span className="text-sm font-semibold text-gray-500 line-through font-mono">
                    {flashDeal.original_price.toLocaleString()} 🪙
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Save {(flashDeal.original_price - flashDeal.discount_price).toLocaleString()} Coins!
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Purchase CTA */}
            <div className="shrink-0 w-full md:w-auto">
              {flashDeal.has_purchased ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-xl border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Purchased Today • Resets at Midnight</span>
                </div>
              ) : (
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handlePurchaseFlashDeal}
                  disabled={isPurchasingDeal || user.coins < flashDeal.discount_price}
                  leftIcon={<ShoppingBag className="w-4 h-4 text-black" />}
                  className="w-full md:w-auto text-sm font-bold"
                >
                  {isPurchasingDeal
                    ? 'Unlocking Deal...'
                    : `Buy for ${flashDeal.discount_price.toLocaleString()} 🪙`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. EVENT BOUNTIES & CHALLENGES */}
      {primaryEvent && primaryEvent.bounties && primaryEvent.bounties.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <h2 className="text-xl font-bold text-white font-display">Special Event Bounties</h2>
            </div>
            <Link to="/missions" className="text-xs text-brand-purple hover:underline flex items-center gap-1">
              <span>View All Missions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryEvent.bounties.map((bounty) => (
              <CardPanel key={bounty.id} className="p-4 border border-purple-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">{bounty.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{bounty.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        +{bounty.reward_coins.toLocaleString()} Coins
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                        +{bounty.reward_gems} Gems
                      </span>
                    </div>
                  </div>
                </div>

                <Link to="/packs">
                  <Button size="sm" variant="outline" className="text-xs shrink-0">
                    Advance
                  </Button>
                </Link>
              </CardPanel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
