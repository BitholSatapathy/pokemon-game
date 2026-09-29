import React, { useState, useEffect } from 'react';
import { 
  Trophy, Swords, Eye, Award, 
  RefreshCw, Play, CheckCircle2 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchTournaments,
  fetchTournamentDetail,
  joinTournament,
  playTournamentMatch,
  spectateTournamentMatch,
  ApiTournament,
  ApiTournamentMatch,
  ApiTournamentMatchResult,
} from '../services/api';

export const TournamentsPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  const [selectedTourney, setSelectedTourney] = useState<ApiTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Spectate Modal
  const [spectatingMatch, setSpectatingMatch] = useState<ApiTournamentMatch | null>(null);
  const [matchResult, setMatchResult] = useState<ApiTournamentMatchResult | null>(null);

  useEffect(() => {
    loadTournaments();
  }, [token]);

  const loadTournaments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchTournaments(token);
      setTournaments(data);
      if (data.length > 0) {
        // Load details for first tournament
        loadTournamentDetail(data[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetail = async (tourneyId: string) => {
    if (!token) return;
    try {
      setActionLoading(true);
      const detail = await fetchTournamentDetail(tourneyId, token);
      setSelectedTourney(detail);
    } catch (err: any) {
      showToast(err.message || 'Failed to load bracket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (tourneyId: string) => {
    if (!token) return;
    try {
      setActionLoading(true);
      const detail = await joinTournament(tourneyId, undefined, token);
      setSelectedTourney(detail);
      showToast(`Entered ${detail.name}! Bracket has been generated.`, 'success', 'Tournament Entry');
      await refreshUser();
      const updatedList = await fetchTournaments(token);
      setTournaments(updatedList);
    } catch (err: any) {
      showToast(err.message || 'Failed to enter tournament', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayMatch = async () => {
    if (!token || !selectedTourney) return;
    try {
      setActionLoading(true);
      const result = await playTournamentMatch(selectedTourney.id, token);
      setMatchResult(result);
      if (result.is_champion) {
        showToast(`🏆 TOURNAMENT CHAMPION! Awarded ${result.coins_awarded.toLocaleString()} Coins & ${result.gems_awarded} Gems!`, 'gold', 'Victory!');
      } else if (result.won) {
        showToast(`Match won! Advanced to Round ${result.round_number + 1}!`, 'success', 'Round Victory');
      } else {
        showToast('Eliminated from tournament. Better luck next season!', 'info', 'Defeat');
      }
      await refreshUser();
      await loadTournamentDetail(selectedTourney.id);
    } catch (err: any) {
      showToast(err.message || 'Match execution failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpectate = async (matchId: number) => {
    if (!token) return;
    try {
      const match = await spectateTournamentMatch(matchId, token);
      setSpectatingMatch(match);
    } catch (err: any) {
      showToast(err.message || 'Failed to open spectator view', 'error');
    }
  };

  // Group matches by round for bracket
  const qfMatches = selectedTourney?.matches?.filter((m) => m.round_number === 1) || [];
  const sfMatches = selectedTourney?.matches?.filter((m) => m.round_number === 2) || [];
  const finalsMatch = selectedTourney?.matches?.find((m) => m.round_number === 3);

  const userCanPlay = selectedTourney?.user_status === 'active';

  if (loading && !selectedTourney) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-[#0B0B14] border border-amber-500/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="gold" className="px-3 py-1 flex items-center gap-1.5 font-bold tracking-wide uppercase">
                <Trophy className="w-3.5 h-3.5" />
                Championship Circuit
              </Badge>
              <span className="text-xs text-amber-300/80 font-mono">Season 1 Knockouts</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
              TOURNAMENT KNOCKOUT ARENA
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl">
              Compete in high-stakes 8-player knockout brackets against seeded regional champions, Lance, Blue, and Cynthia. Climb to Grand Finals to claim massive bounties, gems, and vintage booster packs!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTourney && loadTournamentDetail(selectedTourney.id)}
              disabled={actionLoading}
              className="border-white/10 text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* TOURNAMENTS CAROUSEL / SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tournaments.map((t) => {
          const isSelected = selectedTourney?.id === t.id;
          const tierBorder =
            t.tier === 'gold' ? 'border-amber-500/50 hover:border-amber-400' :
            t.tier === 'silver' ? 'border-blue-500/50 hover:border-blue-400' :
            'border-purple-500/50 hover:border-purple-400';

          return (
            <div
              key={t.id}
              onClick={() => loadTournamentDetail(t.id)}
              className={`rounded-2xl p-5 cursor-pointer transition-all duration-300 border ${
                isSelected ? 'bg-[#18182E] shadow-glow-purple border-purple-500 ring-2 ring-purple-500/40' : 'bg-[#121222]/80 ' + tierBorder
              } hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                      {t.tier.toUpperCase()} TIER
                    </span>
                    {t.user_status === 'active' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ACTIVE
                      </span>
                    )}
                    {t.user_status === 'champion' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        CHAMPION 🏆
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white font-display">{t.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{t.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-gray-400">Entry: </span>
                  <span className="text-amber-300 font-bold">
                    {t.entry_fee_coins === 0 ? 'FREE' : `🪙 ${t.entry_fee_coins.toLocaleString()}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Prize: </span>
                  <span className="text-emerald-400 font-bold">🪙 {t.reward_coins.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED TOURNAMENT ARENA & BRACKET */}
      {selectedTourney && (
        <div className="space-y-6 bg-[#0E0E1B] border border-[#201E38] rounded-3xl p-6 md:p-8">
          {/* TOURNAMENT SUB-HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                  {selectedTourney.name}
                </h2>
                <Badge variant={selectedTourney.tier === 'gold' ? 'gold' : 'purple'}>
                  Round {selectedTourney.current_round} of 3
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Prize Pool: <span className="text-amber-300 font-bold">🪙 {selectedTourney.reward_coins.toLocaleString()} Coins</span> + <span className="text-cyan-300 font-bold">💎 {selectedTourney.reward_gems} Gems</span>
                {selectedTourney.reward_pack_id && ` + 1x ${selectedTourney.reward_pack_id.replace('pack_', '').replace('_', ' ').toUpperCase()} BOOSTER`}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3">
              {selectedTourney.user_status === 'not_joined' && (
                <Button
                  variant="gold"
                  onClick={() => handleJoin(selectedTourney.id)}
                  disabled={actionLoading}
                  className="font-bold px-6 shadow-glow-amber"
                >
                  <Swords className="w-4 h-4 mr-2" />
                  Join Tournament ({selectedTourney.entry_fee_coins === 0 ? 'Free' : `🪙 ${selectedTourney.entry_fee_coins.toLocaleString()}`})
                </Button>
              )}

              {selectedTourney.user_status === 'active' && (
                <Button
                  variant="primary"
                  onClick={handlePlayMatch}
                  disabled={actionLoading}
                  className="font-bold px-6 shadow-glow-purple bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Fight Round {selectedTourney.current_round} Match!
                </Button>
              )}

              {selectedTourney.user_status === 'champion' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-sm">
                  <Award className="w-5 h-5 text-amber-400" />
                  Current Reigning Champion!
                </div>
              )}

              {selectedTourney.user_status === 'eliminated' && (
                <Button
                  variant="secondary"
                  onClick={() => handleJoin(selectedTourney.id)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Re-enter Tournament
                </Button>
              )}
            </div>
          </div>

          {/* INTERACTIVE KNOCKOUT BRACKET VISUALIZER */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px] grid grid-cols-3 gap-8 relative items-center py-4">
              {/* ROUND 1: QUARTERFINALS */}
              <div className="space-y-6">
                <div className="text-center font-mono font-bold text-xs text-gray-400 uppercase tracking-widest pb-2 border-b border-white/5">
                  Quarterfinals (Round 1)
                </div>
                <div className="space-y-4">
                  {qfMatches.map((m) => (
                    <MatchNode
                      key={m.id}
                      match={m}
                      onSpectate={() => handleSpectate(m.id)}
                      onPlay={handlePlayMatch}
                      isUserMatch={userCanPlay && selectedTourney.current_round === 1 && (m.participant1?.user_id === selectedTourney.user_participant_id || m.participant2?.user_id === selectedTourney.user_participant_id)}
                    />
                  ))}
                </div>
              </div>

              {/* ROUND 2: SEMIFINALS */}
              <div className="space-y-6">
                <div className="text-center font-mono font-bold text-xs text-gray-400 uppercase tracking-widest pb-2 border-b border-white/5">
                  Semifinals (Round 2)
                </div>
                <div className="space-y-16">
                  {sfMatches.map((m) => (
                    <MatchNode
                      key={m.id}
                      match={m}
                      onSpectate={() => handleSpectate(m.id)}
                      onPlay={handlePlayMatch}
                      isUserMatch={userCanPlay && selectedTourney.current_round === 2 && (m.participant1?.user_id === selectedTourney.user_participant_id || m.participant2?.user_id === selectedTourney.user_participant_id)}
                    />
                  ))}
                </div>
              </div>

              {/* ROUND 3: GRAND FINALS */}
              <div className="space-y-6">
                <div className="text-center font-mono font-bold text-xs text-amber-400 uppercase tracking-widest pb-2 border-b border-amber-500/20">
                  🏆 Championship Finals (Round 3)
                </div>
                <div className="pt-8">
                  {finalsMatch && (
                    <MatchNode
                      match={finalsMatch}
                      onSpectate={() => handleSpectate(finalsMatch.id)}
                      onPlay={handlePlayMatch}
                      isFinal
                      isUserMatch={userCanPlay && selectedTourney.current_round === 3 && (finalsMatch.participant1?.user_id === selectedTourney.user_participant_id || finalsMatch.participant2?.user_id === selectedTourney.user_participant_id)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPECTATE MATCH MODAL */}
      {spectatingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121222] border border-[#2D2A4A] rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  Spectator Combat Replay: Match #{spectatingMatch.id}
                </h3>
              </div>
              <button
                onClick={() => setSpectatingMatch(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* MATCH COMBATANTS HEADER */}
            <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-white/5 text-center">
              <div className={`space-y-1 ${spectatingMatch.winner?.id === spectatingMatch.participant1?.id ? 'text-amber-300 font-bold' : 'text-gray-300'}`}>
                <div className="text-xs uppercase font-mono text-gray-500">Seed #{spectatingMatch.participant1?.seed}</div>
                <div className="text-base">{spectatingMatch.participant1?.display_name || 'TBD'}</div>
                <div className="text-2xl font-black">{spectatingMatch.p1_score}</div>
              </div>
              <div className={`space-y-1 ${spectatingMatch.winner?.id === spectatingMatch.participant2?.id ? 'text-amber-300 font-bold' : 'text-gray-300'}`}>
                <div className="text-xs uppercase font-mono text-gray-500">Seed #{spectatingMatch.participant2?.seed}</div>
                <div className="text-base">{spectatingMatch.participant2?.display_name || 'TBD'}</div>
                <div className="text-2xl font-black">{spectatingMatch.p2_score}</div>
              </div>
            </div>

            {/* COMBAT REPLAY LOG */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-xs text-gray-300 bg-[#0B0B14] p-4 rounded-xl border border-white/5">
              {spectatingMatch.battle_log?.map((line, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    line.includes('claims the match') || line.includes('decision victory')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : line.includes('commands')
                      ? 'bg-purple-950/30 text-purple-200'
                      : 'bg-black/30'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSpectatingMatch(null)}>
                Close Replay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH RESULT DIALOG */}
      {matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#151428] border border-purple-500/50 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl text-center">
            {matchResult.is_champion ? (
              <div className="space-y-3">
                <div className="text-6xl animate-bounce">🏆</div>
                <Badge variant="gold" className="px-4 py-1 text-sm font-bold uppercase tracking-wider">
                  Grand Champion Crowned
                </Badge>
                <h3 className="text-3xl font-black text-white font-display">
                  VICTORY AT INDIGO PLATEAU!
                </h3>
                <p className="text-sm text-gray-300">
                  You have defeated all 7 contenders and claimed the master tournament championship!
                </p>
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center font-mono">
                  <div>
                    <div className="text-xs text-gray-400">Coins</div>
                    <div className="text-lg font-bold text-amber-300">+{matchResult.coins_awarded.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Gems</div>
                    <div className="text-lg font-bold text-cyan-300">+{matchResult.gems_awarded}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Booster Pack</div>
                    <div className="text-sm font-bold text-emerald-400">1x Vintage Foil</div>
                  </div>
                </div>
              </div>
            ) : matchResult.won ? (
              <div className="space-y-3">
                <div className="text-5xl">⚔️</div>
                <Badge variant="purple" className="px-3 py-1 font-bold uppercase">
                  Round {matchResult.round_number} Cleared!
                </Badge>
                <h3 className="text-2xl font-bold text-white font-display">
                  MATCH ADVANCEMENT!
                </h3>
                <p className="text-sm text-gray-300">
                  Your team delivered critical strikes and advanced deeper into the championship bracket!
                </p>
                <div className="p-3 bg-white/5 rounded-xl text-xs text-purple-300 font-mono">
                  XP Earned: +{matchResult.xp_awarded} XP
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">🛡️</div>
                <Badge variant="default" className="px-3 py-1 font-bold uppercase">
                  Eliminated
                </Badge>
                <h3 className="text-2xl font-bold text-white font-display">
                  HARD FOUGHT BATTLE
                </h3>
                <p className="text-sm text-gray-300">
                  Your opponent found an opening and claimed the round. Upgrade your deck and try again!
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-center">
              <Button
                variant={matchResult.won ? 'gold' : 'secondary'}
                onClick={() => setMatchResult(null)}
                className="font-bold px-8"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MatchNodeProps {
  match: ApiTournamentMatch;
  onSpectate: () => void;
  onPlay: () => void;
  isFinal?: boolean;
  isUserMatch?: boolean;
}

const MatchNode: React.FC<MatchNodeProps> = ({ match, onSpectate, onPlay, isFinal, isUserMatch }) => {
  const p1 = match.participant1;
  const p2 = match.participant2;
  const isCompleted = match.status === 'completed';
  const isReady = match.status === 'ready';

  return (
    <div
      className={`rounded-2xl p-3.5 space-y-2.5 border transition-all duration-300 ${
        isFinal
          ? 'bg-gradient-to-b from-[#1E1838] to-[#121224] border-amber-500/50 shadow-glow-amber'
          : isUserMatch
          ? 'bg-[#181832] border-purple-500 shadow-glow-purple ring-2 ring-purple-500/40'
          : 'bg-[#131326] border-[#252542]'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-white/5 pb-1.5">
        <span>Match #{match.id}</span>
        {isCompleted ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Finished
          </span>
        ) : isReady ? (
          <span className="text-amber-400 font-bold animate-pulse">● Ready</span>
        ) : (
          <span className="text-gray-500">Waiting</span>
        )}
      </div>

      {/* PARTICIPANT 1 */}
      <div
        className={`flex items-center justify-between p-2 rounded-xl text-xs ${
          match.winner?.id === p1?.id
            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
            : p1?.eliminated
            ? 'text-gray-500 line-through'
            : 'text-gray-300 bg-white/5'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] text-gray-500 font-mono w-4">#{p1?.seed || '-'}</span>
          <span className="truncate">{p1?.display_name || 'TBD'}</span>
        </div>
        <span className="font-mono font-bold text-sm ml-2">{isCompleted ? match.p1_score : '-'}</span>
      </div>

      {/* PARTICIPANT 2 */}
      <div
        className={`flex items-center justify-between p-2 rounded-xl text-xs ${
          match.winner?.id === p2?.id
            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
            : p2?.eliminated
            ? 'text-gray-500 line-through'
            : 'text-gray-300 bg-white/5'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] text-gray-500 font-mono w-4">#{p2?.seed || '-'}</span>
          <span className="truncate">{p2?.display_name || 'TBD'}</span>
        </div>
        <span className="font-mono font-bold text-sm ml-2">{isCompleted ? match.p2_score : '-'}</span>
      </div>

      {/* NODE FOOTER */}
      <div className="pt-1 flex items-center justify-between">
        {isCompleted ? (
          <button
            onClick={onSpectate}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Replay Log
          </button>
        ) : isUserMatch ? (
          <Button
            size="sm"
            variant="primary"
            onClick={onPlay}
            className="w-full text-xs py-1 h-7 font-bold bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            Fight Duel &rarr;
          </Button>
        ) : (
          <span className="text-[10px] text-gray-500 font-mono">Simulated</span>
        )}
      </div>
    </div>
  );
};
