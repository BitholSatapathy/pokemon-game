import React, { useState } from 'react';
import { PackageOpen, Sparkles, DollarSign, Clock, Check } from 'lucide-react';
import { DailyMission } from '../../types';
import { MOCK_DAILY_MISSIONS } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';

interface DailyMissionsWidgetProps {
  onRewardClaim?: (coins: number) => void;
}

export const DailyMissionsWidget: React.FC<DailyMissionsWidgetProps> = ({ onRewardClaim }) => {
  const [missions, setMissions] = useState<DailyMission[]>(MOCK_DAILY_MISSIONS);
  const { showToast } = useToast();

  const handleClaim = (missionId: string) => {
    setMissions((prev) =>
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

  const getMissionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <PackageOpen className="w-4 h-4 text-purple-400" />;
      case 1:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 2:
      default:
        return <DollarSign className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-[#121222] border border-[#201E38] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
          DAILY MISSIONS
        </h3>
        <span className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
          <Clock className="w-3 h-3 text-gray-400" /> Resets in 12h 24m
        </span>
      </div>

      <div className="space-y-3.5">
        {missions.map((mission, idx) => {
          const percent = Math.min(100, Math.round((mission.current / mission.target) * 100));
          const canClaim = mission.current >= mission.target && !mission.claimed;

          return (
            <div
              key={mission.id}
              className="p-3 rounded-xl bg-[#17172B] border border-[#252342] flex items-center justify-between gap-4"
            >
              {/* Mission Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#201E38] flex items-center justify-center shrink-0">
                  {getMissionIcon(idx)}
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

              {/* Reward Badge / Claim Action */}
              <div className="shrink-0">
                {mission.claimed ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                    <Check className="w-3.5 h-3.5" /> Done
                  </span>
                ) : canClaim ? (
                  <button
                    onClick={() => handleClaim(mission.id)}
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
