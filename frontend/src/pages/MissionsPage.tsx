import React, { useState } from 'react';
import { Target, CheckCircle2, Clock, Coins, Award } from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { UserProfile, DailyMission } from '../types';
import { MOCK_DAILY_MISSIONS } from '../data/mockData';
import { useToast } from '../context/ToastContext';

interface MissionsProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const MissionsPage: React.FC<MissionsProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');
  const [missions, setMissions] = useState<DailyMission[]>(MOCK_DAILY_MISSIONS);
  const { showToast } = useToast();

  const handleClaim = (missionId: string, coins: number) => {
    setUser((prev) => ({ ...prev, coins: prev.coins + coins }));
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m))
    );
    showToast(`Claimed +${coins} Coins!`, 'gold', 'Reward Collected');
  };

  const tabs = [
    { id: 'daily', label: 'Daily Missions', count: 3 },
    { id: 'weekly', label: 'Weekly Bounties', count: 2 },
    { id: 'achievements', label: 'Milestones', count: 5 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            <span>Phase 9 Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">MISSION HEADQUARTERS</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Complete daily and weekly combat directives to earn free coins, gems, and exclusive packs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141424] border border-amber-500/40 text-xs font-mono">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{user.coins.toLocaleString()} 🪙</span>
          </div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />
        </div>
      </div>

      {/* Daily Missions Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141424] border border-[#25253E]">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Directives refresh daily at 00:00 UTC (12h 24m remaining)</span>
            </div>
            <Badge variant="gold">3 Available</Badge>
          </div>

          <div className="space-y-3">
            {missions.map((mission) => {
              const percent = Math.min(100, Math.round((mission.current / mission.target) * 100));
              const canClaim = mission.current >= mission.target && !mission.claimed;

              return (
                <CardPanel
                  key={mission.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-white font-display">{mission.title}</h4>
                      {mission.claimed && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <div className="w-full max-w-md bg-[#201E38] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-violet to-brand-purple h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      Progress: {mission.current} / {mission.target}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Reward</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        +{mission.rewardCoins} Coins 🪙
                      </span>
                    </div>

                    {mission.claimed ? (
                      <Button size="sm" variant="secondary" disabled>
                        Claimed
                      </Button>
                    ) : canClaim ? (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleClaim(mission.id, mission.rewardCoins)}
                      >
                        Claim Reward
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          showToast(`Go to packs or market to advance "${mission.title}"!`, 'info')
                        }
                      >
                        View Action
                      </Button>
                    )}
                  </div>
                </CardPanel>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Bounties Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <CardPanel className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-white font-display">Unbox 20 Booster Packs</h4>
              <p className="text-xs text-gray-400">Rip open packs across any expansion.</p>
              <div className="w-64 bg-[#201E38] rounded-full h-2 overflow-hidden">
                <div className="bg-brand-violet h-full rounded-full w-1/2" />
              </div>
              <span className="text-xs font-mono text-gray-400">10 / 20 Packs</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block uppercase">Reward</span>
                <span className="text-sm font-bold text-amber-300 font-mono">3,000 🪙 + 50 💎</span>
              </div>
              <Button size="sm" variant="outline" disabled>
                In Progress
              </Button>
            </div>
          </CardPanel>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardPanel className="space-y-2 p-5 border-purple-500/40">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-bold text-white">First Pull (Phase 10)</h4>
              <Badge variant="success">Unlocked</Badge>
            </div>
            <p className="text-xs text-gray-400">Unsealed your very first booster pack.</p>
          </CardPanel>
          <CardPanel className="space-y-2 p-5 border-purple-500/40">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <h4 className="text-base font-bold text-white">High Roller</h4>
              <Badge variant="gold">In Progress</Badge>
            </div>
            <p className="text-xs text-gray-400">Own an Ultra Rare or Secret Rare card.</p>
          </CardPanel>
        </div>
      )}
    </div>
  );
};
