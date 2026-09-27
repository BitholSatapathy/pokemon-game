import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, Sparkles, DollarSign, Clock, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { DailyMission } from '../../types';
import { MOCK_DAILY_MISSIONS } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { fetchMyMissions, claimMissionReward, ApiUserMission } from '../../services/api';

interface DailyMissionsWidgetProps {
  onRewardClaim?: (coins: number) => void;
}

export const DailyMissionsWidget: React.FC<DailyMissionsWidgetProps> = ({ onRewardClaim }) => {
  const [mockMissions, setMockMissions] = useState<DailyMission[]>(MOCK_DAILY_MISSIONS);
  const [liveDailyMissions, setLiveDailyMissions] = useState<ApiUserMission[]>([]);
  const [dailyResetSeconds, setDailyResetSeconds] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadLiveMissions = async () => {
    if (!token) return;
    try {
      const data = await fetchMyMissions(token);
      if (data) {
        setLiveDailyMissions(data.daily);
        setDailyResetSeconds(data.daily_reset_seconds);
      }
    } catch (e) {
      console.warn('Failed to load daily missions widget', e);
    }
  };

  useEffect(() => {
    if (token) {
      loadLiveMissions();
    }
  }, [token]);

  const handleClaimLive = async (mission: ApiUserMission) => {
    if (!token) return;
    setIsClaiming(mission.id);
    try {
      const result = await claimMissionReward(mission.id, token);
      if (onRewardClaim) onRewardClaim(result.reward_coins);
      showToast(
        `Claimed +${result.reward_xp} XP and +${result.reward_coins} Coins!`,
        'gold',
        'Mission Complete'
      );
      loadLiveMissions();
    } catch (err: any) {
      showToast(err.message || 'Failed to claim reward.', 'error');
    } finally {
      setIsClaiming(null);
    }
  };

  const handleClaimMock = (missionId: string) => {
    setMockMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId) {
          if (onRewardClaim) onRewardClaim(m.rewardCoins);
          showToast(`Claimed +${m.rewardCoins} Coins from mission!`, 'gold', 'Mission Complete');
          return { ...m, claimed: true };
        }
        return m;
      })
    );
  };

  const getMissionIcon = (iconName?: string, index?: number) => {
    if (iconName === 'package-open' || index === 0) {
      return <PackageOpen className="w-4 h-4 text-purple-400" />;
    }
    if (iconName === 'dollar-sign' || index === 2) {
      return <DollarSign className="w-4 h-4 text-amber-400" />;
    }
    if (iconName === 'shopping-bag') {
      return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
    }
    return <Sparkles className="w-4 h-4 text-brand-purple" />;
  };

  const formatHoursRemaining = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const hasLive = isAuthenticated && liveDailyMissions.length > 0;

  return (
    <div className="bg-[#121222] border border-[#201E38] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
            DAILY DIRECTIVES
          </h3>
          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
            Phase 9
          </span>
        </div>
        <button
          onClick={() => navigate('/missions')}
          className="text-[11px] text-brand-purple hover:text-purple-300 font-mono flex items-center gap-1 transition-colors"
        >
          HQ <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 bg-[#16162B] px-3 py-1.5 rounded-lg border border-[#201E38]">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-purple" />
          {hasLive
            ? `Resets in ${formatHoursRemaining(dailyResetSeconds)}`
            : 'Resets daily at 00:00 UTC'}
        </span>
        <span className="text-amber-300 font-bold">
          {hasLive
            ? `${liveDailyMissions.filter((m) => m.is_completed && !m.is_claimed).length} Claimable`
            : '3 Available'}
        </span>
      </div>

      <div className="space-y-3">
        {hasLive
          ? liveDailyMissions.map((mission, idx) => {
              const canClaim = mission.is_completed && !mission.is_claimed;
              const isClaimingThis = isClaiming === mission.id;

              return (
                <div
                  key={mission.id}
                  className="p-3 rounded-xl bg-[#17172B] border border-[#252342] flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#201E38] flex items-center justify-center shrink-0">
                      {getMissionIcon(mission.icon, idx)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{mission.title}</span>
                        <span className="text-[11px] font-mono text-gray-400">
                          {mission.progress} / {mission.target}
                        </span>
                      </div>

                      <div className="w-full bg-[#201E38] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            mission.is_completed
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-brand-violet to-brand-purple'
                          }`}
                          style={{ width: `${mission.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {mission.is_claimed ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : canClaim ? (
                      <button
                        disabled={isClaimingThis}
                        onClick={() => handleClaimLive(mission)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-glow-gold cursor-pointer"
                      >
                        {isClaimingThis ? '...' : 'Claim'}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-[#201E38] text-amber-300 font-mono text-[11px] font-bold border border-amber-500/20">
                        +{mission.reward_coins} 🪙
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          : mockMissions.map((mission, idx) => {
              const percent = Math.min(100, Math.round((mission.current / mission.target) * 100));
              const canClaim = mission.current >= mission.target && !mission.claimed;

              return (
                <div
                  key={mission.id}
                  className="p-3 rounded-xl bg-[#17172B] border border-[#252342] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#201E38] flex items-center justify-center shrink-0">
                      {getMissionIcon(undefined, idx)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{mission.title}</span>
                        <span className="text-[11px] font-mono text-gray-400">
                          {mission.current} / {mission.target}
                        </span>
                      </div>

                      <div className="w-full bg-[#201E38] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-violet to-brand-purple h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {mission.claimed ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : canClaim ? (
                      <button
                        onClick={() => handleClaimMock(mission.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-glow-gold cursor-pointer"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-[#201E38] text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
                        +{mission.rewardCoins} 🪙
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

