import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Swords, Zap, Shield, Trophy, RefreshCw, 
  AlertCircle, Layers, CheckCircle2, History 
} from 'lucide-react';
import { 
  fetchGymLeaders, fetchUserDecks, startInteractiveBattle, 
  simulateGymBattle, fetchBattleHistory,
  GymLeader, DeckOut, BattleStateOut, BattleSimulateOut, 
  BattleHistoryItem 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import BattleArena from '../components/battle/BattleArena';

export const BattlePage: React.FC = () => {
  const { token, openAuthModal, refreshUser } = useAuth();
  const [gyms, setGyms] = useState<GymLeader[]>([]);
  const [decks, setDecks] = useState<DeckOut[]>([]);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Duel State
  const [activeBattleState, setActiveBattleState] = useState<BattleStateOut | null>(null);
  const [battleLoading, setBattleLoading] = useState<boolean>(false);

  // Sim Result Modal
  const [simResult, setSimResult] = useState<BattleSimulateOut | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const gymData = await fetchGymLeaders();
      setGyms(gymData);

      if (token) {
        const [deckData, histData] = await Promise.all([
          fetchUserDecks(token).catch(() => []),
          fetchBattleHistory(token).catch(() => []),
        ]);
        setDecks(deckData);
        setHistory(histData);
      }
    } catch (err: any) {
      console.error('Failed to load battle data:', err);
      setErrorMsg('Failed to load Gym Stadium data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDuel = async (gymId: string) => {
    if (!token) {
      openAuthModal('login');
      return;
    }
    setBattleLoading(true);
    setErrorMsg(null);
    try {
      const state = await startInteractiveBattle(token, gymId);
      setActiveBattleState(state);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start duel.');
    } finally {
      setBattleLoading(false);
    }
  };

  const handleSimulate = async (gymId: string) => {
    if (!token) {
      openAuthModal('login');
      return;
    }
    setBattleLoading(true);
    setErrorMsg(null);
    try {
      const sim = await simulateGymBattle(token, gymId);
      setSimResult(sim);
      await refreshUser();
      const updatedHist = await fetchBattleHistory(token);
      setHistory(updatedHist);
    } catch (err: any) {
      setErrorMsg(err.message || 'Battle simulation failed.');
    } finally {
      setBattleLoading(false);
    }
  };

  const activeDeck = decks.find((d) => d.is_active);
  const wonGymIds = new Set(history.filter((h) => h.result === 'win').map((h) => h.gym_id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Arena Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-slate-900 to-purple-950/70 p-8 border border-red-500/20 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5" />
                Indigo Plateau • Gym Leader Stadium
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Battle Arena & Gym Leaders
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
                Challenge classic Kanto Gym Leaders in turn-based tactical card combat!
                Exploit elemental type weaknesses, manage energy, and claim official Gym Badges, coins, and XP.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/decks"
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                Manage Decks
              </Link>
            </div>
          </div>

          {/* Active Battle Squad Indicator */}
          {activeDeck && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Equipped Battle Squad:</span>
                <span className="font-bold text-white flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-purple-500/40">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  {activeDeck.name} ({activeDeck.card_count} Cards)
                </span>
              </div>
              <Link to="/decks" className="text-purple-400 hover:underline font-bold">
                Change Squad →
              </Link>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline text-slate-400">
              Dismiss
            </button>
          </div>
        )}

        {/* GYM LEADERS ROSTER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Available Gym Leader Challenges
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Badges Collected: {wonGymIds.size} / {gyms.length}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 rounded-3xl border border-slate-800">
              <RefreshCw className="w-8 h-8 text-red-400 animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading Gym Leaders...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gyms.map((gym) => {
                const isCleared = wonGymIds.has(gym.id);

                return (
                  <div
                    key={gym.id}
                    className={`rounded-3xl p-6 border transition-all space-y-5 relative overflow-hidden ${
                      isCleared
                        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-3xl shadow-inner">
                          {gym.badge_icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                              {gym.difficulty} Tier
                            </span>
                            {isCleared && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Defeated
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-black text-white">{gym.name}</h3>
                          <div className="text-xs text-slate-400">{gym.title}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                          Badge Reward
                        </span>
                        <span className="text-xs font-bold text-amber-400">{gym.badge_name}</span>
                      </div>
                    </div>

                    {/* Team Preview & Elemental Advice */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Gym Team Specimen:</span>
                        <span className="font-bold text-white">{gym.team_preview.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Elemental Affinity:</span>
                        <span className="font-mono text-purple-400 font-bold">{gym.element_type}</span>
                      </div>
                    </div>

                    {/* Rewards bar */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-4 text-slate-300">
                        <span className="flex items-center gap-1 text-amber-400">
                          🪙 +{gym.reward_coins} Coins
                        </span>
                        <span className="flex items-center gap-1 text-purple-400">
                          ⭐ +{gym.reward_xp} XP
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleStartDuel(gym.id)}
                        disabled={battleLoading}
                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        Interactive Duel
                      </button>
                      <button
                        onClick={() => handleSimulate(gym.id)}
                        disabled={battleLoading}
                        className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Quick Sim
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT BATTLE RECORDS */}
        {history.length > 0 && (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Recent Stadium Match History
            </h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-black font-mono text-[10px] uppercase ${
                        h.result === 'win'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {h.result}
                    </span>
                    <span className="font-bold text-white">VS {h.gym_leader_name}</span>
                    <span className="text-slate-500 font-mono">({h.turns_played} turns)</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono font-bold">
                    <span className="text-amber-400">+{h.reward_coins} Coins</span>
                    <span className="text-purple-400">+{h.reward_xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SIMULATION RESULT MODAL */}
        {simResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-2xl">
                  {simResult.result === 'win' ? '🏆' : '💀'}
                </div>
                <h3 className={`text-xl font-black ${simResult.result === 'win' ? 'text-amber-400' : 'text-red-400'}`}>
                  {simResult.result === 'win' ? 'Victory in Arena!' : 'Defeat!'}
                </h3>
                <p className="text-xs text-slate-400">
                  Simulation vs {simResult.gym_leader_name} ({simResult.badge_name}) finished in {simResult.turns} turns.
                </p>
              </div>

              {/* Combat Logs */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 custom-scrollbar">
                {simResult.logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    › {log}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-around p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold font-mono">
                <span className="text-amber-400">🪙 +{simResult.reward_coins} Coins</span>
                <span className="text-purple-400">⭐ +{simResult.reward_xp} XP</span>
              </div>

              <button
                onClick={() => setSimResult(null)}
                className="w-full py-3 rounded-2xl bg-purple-500 text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-purple-500/20"
              >
                Close Summary
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE DUEL ARENA MODAL */}
        {activeBattleState && (
          <BattleArena
            initialState={activeBattleState}
            onClose={() => setActiveBattleState(null)}
            onBattleEnd={() => loadData()}
          />
        )}
      </div>
    </div>
  );
};

export default BattlePage;
