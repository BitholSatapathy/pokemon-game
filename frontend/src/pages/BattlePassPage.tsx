import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, Check, Lock 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchCurrentBattlePass,
  unlockPremiumBattlePass,
  claimBattlePassReward,
  ApiBattlePassSeason,
} from '../services/api';

export const BattlePassPage: React.FC = () => {
  const { token, refreshUser, user } = useAuth();
  const { showToast } = useToast();

  const [season, setSeason] = useState<ApiBattlePassSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPass();
  }, [token]);

  const loadPass = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchCurrentBattlePass(token);
      setSeason(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load battle pass', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockPremium = async () => {
    if (!token) return;
    try {
      setActionLoading(true);
      const updated = await unlockPremiumBattlePass(token);
      setSeason(updated);
      showToast('Unlocked Season 1 Premium Battle Pass! All premium tiers are now accessible.', 'gold', 'Premium Unlocked');
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlock premium pass', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimReward = async (tier: number, isPremium: boolean) => {
    if (!token) return;
    try {
      setActionLoading(true);
      const res = await claimBattlePassReward(tier, isPremium, token);
      showToast(res.message, 'success', 'Reward Claimed');
      await refreshUser();
      const updated = await fetchCurrentBattlePass(token);
      setSeason(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to claim reward', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!season && loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!season) return null;

  const progressPercent = Math.min(100, Math.round((season.xp_in_current_tier / season.xp_per_tier) * 100));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* SEASON HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-[#151228] to-[#0A0A14] border border-purple-500/40 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="px-3 py-1 flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Battle Pass Season {season.season_number}
              </Badge>
              <span className="text-xs text-purple-300 font-mono">Theme: {season.theme}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
              {season.title.toUpperCase()}
            </h1>
            <p className="text-sm text-gray-300">
              {season.description}
            </p>

            {/* LEVEL PROGRESS BAR */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-bold">
                  Tier {season.user_tier} of {season.total_tiers}
                </span>
                <span className="text-gray-400">
                  {season.xp_in_current_tier.toLocaleString()} / {season.xp_per_tier.toLocaleString()} XP to Next Tier
                </span>
              </div>
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-purple-500/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* PREMIUM PASS UNLOCK CALLOUT */}
          <div className="rounded-2xl bg-[#141224] border border-amber-500/30 p-6 space-y-4 w-full lg:w-80 shadow-glow-amber">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-amber-400 font-mono tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                Pass of Champions
              </span>
              {season.has_premium ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  UNLOCKED
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-cyan-300">
                  💎 {season.premium_price_gems} Gems
                </span>
              )}
            </div>

            <p className="text-xs text-gray-300">
              {season.has_premium
                ? 'Your Premium Pass is active! You earn dual rewards on every unlocked tier.'
                : 'Unlock the Premium track to earn +30 bonus rewards including 3x Team Rocket Special Packs and 500 Gems!'}
            </p>

            {!season.has_premium && (
              <Button
                variant="gold"
                onClick={handleUnlockPremium}
                disabled={actionLoading || (user?.gems || 0) < season.premium_price_gems}
                className="w-full font-bold shadow-glow-amber text-xs py-2.5"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Unlock Premium Pass
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 30-TIER HORIZONTAL PROGRESSION TRACK */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white font-display">
              CHAMPIONSHIP TIER TRACK
            </h2>
            <p className="text-xs text-gray-400">
              Earn XP by unsealing booster packs, winning gym battles, grading cards, and placing in tournaments.
            </p>
          </div>
        </div>

        {/* TIER CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: season.total_tiers }, (_, i) => i + 1).map((tierNum) => {
            const isUnlocked = tierNum <= season.user_tier;
            const isCurrent = tierNum === season.user_tier;

            const freeReward = season.free_rewards.find((r) => r.tier === tierNum);
            const premReward = season.premium_rewards.find((r) => r.tier === tierNum);

            return (
              <div
                key={tierNum}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isCurrent
                    ? 'bg-[#181630] border-purple-500 shadow-glow-purple ring-2 ring-purple-500/40'
                    : isUnlocked
                    ? 'bg-[#131224] border-purple-500/30'
                    : 'bg-[#0E0E1A]/80 border-white/5 opacity-75'
                }`}
              >
                {/* TIER HEADER PIN */}
                <div
                  className={`px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold ${
                    isCurrent
                      ? 'bg-purple-600 text-white'
                      : isUnlocked
                      ? 'bg-white/10 text-purple-300'
                      : 'bg-black/40 text-gray-500'
                  }`}
                >
                  <span>TIER {tierNum}</span>
                  {isUnlocked ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <Lock className="w-3 h-3 text-gray-500" />
                  )}
                </div>

                <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                  {/* PREMIUM REWARD BOX */}
                  <div
                    className={`rounded-xl p-2.5 border text-xs space-y-1.5 relative ${
                      season.has_premium
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-black/40 border-white/5 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                      {premReward?.is_claimed ? (
                        <span className="text-emerald-400 font-bold">Claimed</span>
                      ) : !season.has_premium ? (
                        <Lock className="w-3 h-3 text-gray-500" />
                      ) : null}
                    </div>

                    <div className="font-bold truncate text-[11px] text-white">
                      {premReward?.title}
                    </div>

                    {isUnlocked && season.has_premium && !premReward?.is_claimed && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleClaimReward(tierNum, true)}
                        disabled={actionLoading}
                        className="w-full text-[10px] py-1 h-6 font-bold"
                      >
                        Claim
                      </Button>
                    )}
                  </div>

                  {/* FREE REWARD BOX */}
                  <div className="rounded-xl p-2.5 bg-white/5 border border-white/5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-gray-400">Free</span>
                      {freeReward?.is_claimed ? (
                        <span className="text-emerald-400 font-bold">Claimed</span>
                      ) : null}
                    </div>

                    <div className="font-bold truncate text-[11px] text-gray-200">
                      {freeReward?.title}
                    </div>

                    {isUnlocked && !freeReward?.is_claimed && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleClaimReward(tierNum, false)}
                        disabled={actionLoading}
                        className="w-full text-[10px] py-1 h-6 font-bold bg-purple-600 hover:bg-purple-500"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
