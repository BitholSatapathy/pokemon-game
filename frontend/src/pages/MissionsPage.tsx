import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle2,
  Clock,
  Coins,
  Award,
  Sparkles,
  Flame,
  Star,
  Layers,
  PackageOpen,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { UserProfile } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyMissions,
  claimMissionReward,
  fetchMyProgression,
  ApiMissionsSummary,
  ApiUserMission,
  ApiPlayerProgression,
  ApiMissionClaimResult,
} from '../services/api';

interface MissionsProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const MissionsPage: React.FC<MissionsProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');
  const [missionsData, setMissionsData] = useState<ApiMissionsSummary | null>(null);
  const [progression, setProgression] = useState<ApiPlayerProgression | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<ApiMissionClaimResult['level_up_bonuses'] | null>(null);

  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [m, p] = await Promise.all([
        fetchMyMissions(token),
        fetchMyProgression(token),
      ]);
      setMissionsData(m);
      setProgression(p);
    } catch (e) {
      console.warn('Failed to load missions data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Format seconds into HH:MM:SS
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleClaim = async (mission: ApiUserMission) => {
    if (!token) {
      showToast('Please sign in to claim mission rewards.', 'error');
      return;
    }

    setClaimingId(mission.id);
    try {
      const result = await claimMissionReward(mission.id, token);

      // Update parent user state
      setUser((prev) => ({
        ...prev,
        coins: result.new_coins,
        gems: result.new_gems,
        level: result.new_level,
        xp: result.new_xp,
      }));

      // If leveled up, trigger level up celebratory modal
      if (result.leveled_up && result.level_up_bonuses) {
        setLevelUpData(result.level_up_bonuses);
      } else {
        showToast(
          `Claimed +${result.reward_xp} XP and +${result.reward_coins.toLocaleString()} Coins!`,
          'gold',
          'Mission Reward Claimed!'
        );
      }

      // Refresh missions and progression
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to claim reward.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const getMissionIcon = (icon: string) => {
    switch (icon) {
      case 'package-open':
        return <PackageOpen className="w-5 h-5 text-brand-purple" />;
      case 'dollar-sign':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-5 h-5 text-amber-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'trending-up':
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'layers':
        return <Layers className="w-5 h-5 text-brand-violet" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'star':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'award':
      default:
        return <Award className="w-5 h-5 text-purple-400" />;
    }
  };

  const dailyMissions = missionsData?.daily || [];
  const weeklyMissions = missionsData?.weekly || [];
  const achievementMissions = missionsData?.achievements || [];

  const claimableDaily = useMemo(
    () => dailyMissions.filter((m) => m.is_completed && !m.is_claimed).length,
    [dailyMissions]
  );
  const claimableWeekly = useMemo(
    () => weeklyMissions.filter((m) => m.is_completed && !m.is_claimed).length,
    [weeklyMissions]
  );
  const claimableAchievements = useMemo(
    () => achievementMissions.filter((m) => m.is_completed && !m.is_claimed).length,
    [achievementMissions]
  );

  const tabs = [
    { id: 'daily', label: 'Daily Directives', count: claimableDaily > 0 ? claimableDaily : dailyMissions.length },
    { id: 'weekly', label: 'Weekly Bounties', count: claimableWeekly > 0 ? claimableWeekly : weeklyMissions.length },
    { id: 'achievements', label: 'Milestones', count: claimableAchievements > 0 ? claimableAchievements : achievementMissions.length },
  ];

  const currentLevel = progression?.level || user.level || 1;
  const rankTitle = progression?.title || 'Novice Collector';
  const currentXp = progression?.xp ?? user.xp ?? 0;
  const nextLevelXp = progression?.next_level_xp ?? (currentLevel * 200);
  const xpPercent = progression?.xp_percentage ?? Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            <span>Phase 9 Engine</span>
            {missionsData && missionsData.claimable_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {missionsData.claimable_count} Rewards Available
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">MISSION HEADQUARTERS</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Complete daily directives, weekly bounties, and lifetime milestones to earn XP, Coins, and Gems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141424] border border-amber-500/40 text-xs font-mono">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{(progression?.coins ?? user.coins).toLocaleString()} 🪙</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141424] border border-cyan-500/40 text-xs font-mono">
            <span className="text-cyan-300 font-bold">{(progression?.gems ?? user.gems).toLocaleString()} 💎</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Hero Level & XP Progression Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#170E2B] via-[#121226] to-[#0E1528] border border-brand-purple/40 p-6 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Level Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-violet to-purple-800 p-0.5 shadow-xl shadow-purple-500/20">
                <div className="w-full h-full rounded-2xl bg-[#0F0E1E] flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono uppercase text-gray-400">Level</span>
                  <span className="text-2xl sm:text-3xl font-black font-display text-white">{currentLevel}</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-md border-2 border-[#0B0B14]">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-purple/20 text-brand-purple border border-brand-purple/40 uppercase">
                  Rank Tier
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {nextLevelXp - currentXp} XP to Level {currentLevel + 1}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
                {rankTitle}
              </h3>
              <p className="text-xs text-gray-300">
                Leveling up awards <strong className="text-amber-300 font-mono">+500 Coins 🪙</strong> and{' '}
                <strong className="text-cyan-300 font-mono">+25 Gems 💎</strong>!
              </p>
            </div>
          </div>

          {/* XP Progress Bar Capsule */}
          <div className="flex-1 max-w-md bg-[#0B0B16]/80 p-4 rounded-xl border border-[#25253E] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-gray-400 uppercase tracking-wider">Experience Progress</span>
              <span className="font-mono font-bold text-amber-300">
                {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP ({xpPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#1C1B33] rounded-full h-3 overflow-hidden p-0.5 border border-[#2A284D]">
              <div
                className="bg-gradient-to-r from-brand-violet via-purple-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-glow-purple"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span>Lifetime Packs: {progression?.total_packs_opened ?? 0}</span>
              <span>Unique Cards: {progression?.total_cards_collected ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-[#201E38] pb-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

        {activeTab === 'daily' && missionsData && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-brand-purple" />
            <span>Resets in: <strong className="text-gray-200">{formatCountdown(missionsData.daily_reset_seconds)}</strong></span>
          </div>
        )}
      </div>

      {/* Directives Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          (() => {
            const list =
              activeTab === 'daily'
                ? dailyMissions
                : activeTab === 'weekly'
                ? weeklyMissions
                : achievementMissions;

            if (list.length === 0) {
              return (
                <div className="p-12 text-center rounded-2xl bg-[#10101F] border border-[#201E38] space-y-3">
                  <Award className="w-10 h-10 text-gray-600 mx-auto" />
                  <h4 className="text-base font-bold text-white font-display">No Missions Available</h4>
                  <p className="text-xs text-gray-400">Check back after the next daily reset!</p>
                </div>
              );
            }

            return list.map((mission) => {
              const canClaim = mission.is_completed && !mission.is_claimed;
              const isClaiming = claimingId === mission.id;

              return (
                <CardPanel
                  key={mission.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-[#201E38] hover:border-brand-purple/40 transition-all bg-[#10101F] ${
                    canClaim ? 'border-amber-500/40 bg-gradient-to-r from-[#171424] to-[#10101F]' : ''
                  }`}
                >
                  {/* Left: Icon & Content */}
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#17172B] border border-[#25253E] flex items-center justify-center shrink-0 shadow-md">
                      {getMissionIcon(mission.icon)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-bold text-white font-display truncate">
                          {mission.title}
                        </h4>
                        {mission.is_claimed && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {canClaim && (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                            Ready to Claim
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">{mission.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-1 max-w-md pt-1">
                        <div className="w-full bg-[#18182E] rounded-full h-2 overflow-hidden border border-[#25253E]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              mission.is_completed
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-brand-violet to-purple-500'
                            }`}
                            style={{ width: `${mission.percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-gray-500">
                          <span>
                            Progress: <strong className="text-gray-300">{mission.progress}</strong> / {mission.target}
                          </span>
                          <span>{mission.percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rewards & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#1A1A2E]">
                    <div className="text-left sm:text-right space-y-0.5">
                      <span className="text-[10px] text-gray-500 block uppercase font-mono">Bounty Rewards</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                          +{mission.reward_xp} XP
                        </span>
                        <span className="text-xs font-bold text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          +{mission.reward_coins.toLocaleString()} 🪙
                        </span>
                        {mission.reward_gems > 0 && (
                          <span className="text-xs font-bold text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                            +{mission.reward_gems} 💎
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {mission.is_claimed ? (
                        <Button size="sm" variant="secondary" disabled className="opacity-60 text-xs">
                          Claimed
                        </Button>
                      ) : canClaim ? (
                        <Button
                          size="sm"
                          variant="gold"
                          disabled={isClaiming}
                          onClick={() => handleClaim(mission)}
                          leftIcon={<Sparkles className={`w-3.5 h-3.5 text-black ${isClaiming ? 'animate-spin' : ''}`} />}
                          className="shadow-glow-gold font-bold px-4"
                        >
                          {isClaiming ? 'Claiming...' : 'Claim Reward'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mission.id.includes('pack')) navigate('/packs');
                            else if (mission.id.includes('sell')) navigate('/inventory');
                            else if (mission.id.includes('shop') || mission.id.includes('buy')) navigate('/shop');
                            else navigate('/collection');
                          }}
                          rightIcon={<ArrowRight className="w-3 h-3 text-gray-400" />}
                          className="text-xs"
                        >
                          Advance
                        </Button>
                      )}
                    </div>
                  </div>
                </CardPanel>
              );
            });
          })()
        )}
      </div>

      {/* Level-Up Celebration Modal */}
      <Modal
        isOpen={Boolean(levelUpData)}
        onClose={() => setLevelUpData(null)}
        title="🌟 LEVEL UP REACHED!"
      >
        {levelUpData && (
          <div className="text-center space-y-6 py-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-violet to-amber-400 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-2xl border-4 border-[#0B0B14]">
                <Trophy className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-brand-purple tracking-widest">
                Milestone Attained
              </span>
              <h3 className="text-3xl font-black text-white font-display">
                YOU ARE NOW LEVEL {levelUpData.new_level}!
              </h3>
              <p className="text-sm font-semibold text-amber-300 font-mono">
                {levelUpData.new_rank}
              </p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Your dedication to the binder and the cards has yielded exceptional results!
              </p>
            </div>

            {/* Bonuses Received */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#141424] border border-[#25253E]">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-mono">Coin Milestone</span>
                <div className="text-lg font-bold font-mono text-amber-300">
                  +{levelUpData.bonus_coins.toLocaleString()} 🪙
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-mono">Gem Milestone</span>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  +{levelUpData.bonus_gems} 💎
                </div>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full shadow-glow-gold"
              onClick={() => setLevelUpData(null)}
            >
              Claim & Continue Collecting
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

