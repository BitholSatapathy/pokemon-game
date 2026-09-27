import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Coins, Layers, ArrowLeftRight, Star, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard, fetchMyRanks, LeaderboardEntry, MyRanks } from '../services/api';

type BoardCategory = 'richest' | 'collectors' | 'traders' | 'level';

export const LeaderboardPage: React.FC = () => {
  const { token, user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<BoardCategory>('richest');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRanks, setMyRanks] = useState<MyRanks | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(activeTab);
      setEntries(data);
      if (token) {
        const ranks = await fetchMyRanks(token);
        setMyRanks(ranks);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { id: BoardCategory; label: string; icon: React.ReactNode; unit: string; color: string }[] = [
    {
      id: 'richest',
      label: 'Richest',
      icon: <Coins className="w-4 h-4 text-amber-400" />,
      unit: 'Coins',
      color: 'from-amber-500/20 to-yellow-600/10 border-amber-500/30 text-amber-400',
    },
    {
      id: 'collectors',
      label: 'Master Collectors',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      unit: 'Unique Cards',
      color: 'from-purple-500/20 to-indigo-600/10 border-purple-500/30 text-purple-400',
    },
    {
      id: 'traders',
      label: 'Grand Traders',
      icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />,
      unit: 'Trades Done',
      color: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'level',
      label: 'Prestige & Level',
      icon: <Star className="w-4 h-4 text-rose-400" />,
      unit: 'Level',
      color: 'from-rose-500/20 to-pink-600/10 border-rose-500/30 text-rose-400',
    },
  ];

  const currentTabInfo = tabs.find((t) => t.id === activeTab)!;

  const getMyCategoryRank = () => {
    if (!myRanks) return null;
    switch (activeTab) {
      case 'richest':
        return { rank: myRanks.richest_rank, val: myRanks.richest_value };
      case 'collectors':
        return { rank: myRanks.collectors_rank, val: myRanks.collectors_value };
      case 'traders':
        return { rank: myRanks.traders_rank, val: myRanks.traders_value };
      case 'level':
        return { rank: myRanks.level_rank, val: myRanks.level_value };
    }
  };

  const myRankInfo = getMyCategoryRank();
  const topThree = entries.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/20 p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7 text-black" />
              </div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Global Hall of Fame
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider font-display">
              Nexus <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">Leaderboards</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Climb the ranks, dominate the global economy, and showcase your collection across the Nexus arena.
            </p>
          </div>

          {/* User Rank Quick Badge */}
          {authUser && myRankInfo && (
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center font-bold text-xl text-purple-300">
                #{myRankInfo.rank ?? '-'}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Your Standing</p>
                <p className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{myRankInfo.val.toLocaleString()}</span>
                  <span className="text-xs text-purple-300 font-normal">{currentTabInfo.unit}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left ${
                isActive
                  ? 'bg-gradient-to-br from-purple-900/60 to-surface-card border-purple-500 shadow-glow-purple scale-[1.02]'
                  : 'bg-surface/60 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl bg-black/40 border border-white/10 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <div>
                <div className={`text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {tab.label}
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">Top 20 Ranked</div>
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-gray-400">Loading Hall of Fame rankings...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (If we have at least 1 entry) */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="order-2 md:order-1 flex flex-col items-center justify-end">
                  <div className="w-full bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-600/40 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl relative group hover:border-slate-400/60 transition-all">
                    <div className="absolute -top-5 w-10 h-10 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center shadow-lg border-2 border-white">
                      2
                    </div>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-400/60 shadow-lg mt-2 mb-3 bg-black/40">
                      <img src={topThree[1].avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={topThree[1].username} className="w-full h-full object-cover" />
                    </div>
                    <Link to={`/player/${topThree[1].username}`} className="font-bold text-white hover:text-purple-300 text-lg transition-colors">
                      {topThree[1].username}
                    </Link>
                    <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 mt-1">
                      Lvl {topThree[1].level}
                    </span>
                    <div className="mt-4 pt-4 border-t border-white/10 w-full">
                      <div className="text-xl font-black text-slate-200">
                        {topThree[1].value.toLocaleString()}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{currentTabInfo.unit}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place Champion */}
              {topThree[0] && (
                <div className="order-1 md:order-2 flex flex-col items-center justify-end -translate-y-2 md:-translate-y-4">
                  <div className="w-full bg-gradient-to-b from-amber-950/70 via-yellow-900/30 to-surface-card border-2 border-amber-400/70 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl shadow-amber-500/10 relative group hover:border-amber-300 transition-all">
                    <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-xl border-2 border-amber-200 animate-bounce-slow">
                      <Crown className="w-6 h-6 text-yellow-950 fill-yellow-950" />
                    </div>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-glow-amber mt-2 mb-3 bg-black/40 ring-4 ring-amber-500/20">
                      <img src={topThree[0].avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={topThree[0].username} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-0.5 rounded-full mb-1">
                      Grand Champion
                    </span>
                    <Link to={`/player/${topThree[0].username}`} className="font-extrabold text-white hover:text-amber-300 text-xl transition-colors">
                      {topThree[0].username}
                    </Link>
                    <span className="text-xs font-mono text-amber-300 bg-amber-900/40 px-2.5 py-0.5 rounded-full border border-amber-700/50 mt-1">
                      Lvl {topThree[0].level}
                    </span>
                    <div className="mt-4 pt-4 border-t border-amber-500/20 w-full">
                      <div className="text-2xl font-black text-amber-300">
                        {topThree[0].value.toLocaleString()}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-amber-400/70 font-semibold">{currentTabInfo.unit}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="order-3 flex flex-col items-center justify-end">
                  <div className="w-full bg-gradient-to-b from-amber-950/40 to-slate-900/90 border border-amber-700/40 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl relative group hover:border-amber-600/60 transition-all">
                    <div className="absolute -top-5 w-10 h-10 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center shadow-lg border-2 border-amber-500">
                      3
                    </div>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-700/60 shadow-lg mt-2 mb-3 bg-black/40">
                      <img src={topThree[2].avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={topThree[2].username} className="w-full h-full object-cover" />
                    </div>
                    <Link to={`/player/${topThree[2].username}`} className="font-bold text-white hover:text-amber-200 text-lg transition-colors">
                      {topThree[2].username}
                    </Link>
                    <span className="text-xs font-mono text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-900 mt-1">
                      Lvl {topThree[2].level}
                    </span>
                    <div className="mt-4 pt-4 border-t border-white/10 w-full">
                      <div className="text-xl font-black text-amber-200">
                        {topThree[2].value.toLocaleString()}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{currentTabInfo.unit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Standings Table */}
          <div className="bg-surface/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ranked Standings (Top 20)
              </span>
              <span className="text-xs font-mono text-gray-400">
                Sorted by {currentTabInfo.label}
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {entries.map((entry) => {
                const isMe = String(authUser?.id) === String(entry.user_id);
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between px-6 py-4 transition-colors ${
                      isMe ? 'bg-purple-950/30 border-l-4 border-l-purple-500' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Number / Medal */}
                      <div className="w-8 flex items-center justify-center font-black text-sm">
                        {entry.rank === 1 && <span className="text-amber-400 text-base">🥇</span>}
                        {entry.rank === 2 && <span className="text-slate-300 text-base">🥈</span>}
                        {entry.rank === 3 && <span className="text-amber-600 text-base">🥉</span>}
                        {entry.rank > 3 && (
                          <span className="text-gray-400 font-mono">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        <img src={entry.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={entry.username} className="w-full h-full object-cover" />
                      </div>

                      {/* Username & Badge */}
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/player/${entry.username}`}
                            className="font-bold text-white hover:text-purple-300 transition-colors text-sm"
                          >
                            {entry.username}
                          </Link>
                          {isMe && (
                            <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-gray-400">Level {entry.level}</span>
                          <span className="text-[10px] text-gray-500">•</span>
                          <span className="text-[11px] text-purple-300/80 font-medium">{entry.badge}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric Value */}
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">
                        {entry.value.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                        {currentTabInfo.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default LeaderboardPage;
