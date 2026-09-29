import React, { useState } from 'react';
import { Zap, Shield, Swords, ArrowLeftRight, X } from 'lucide-react';
import { BattleStateOut, sendBattleAction } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playAttackSound, playCriticalHitSound, playFanfareSound } from '../../services/sound';

interface BattleArenaProps {
  initialState: BattleStateOut;
  onClose: () => void;
  onBattleEnd?: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  initialState,
  onClose,
  onBattleEnd,
}) => {
  const { token, refreshUser } = useAuth();
  const [battle, setBattle] = useState<BattleStateOut>(initialState);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showSwitchPicker, setShowSwitchPicker] = useState<boolean>(false);

  const handleAction = async (action: 'attack' | 'special' | 'charge' | 'switch', switchIdx?: number) => {
    if (!token || actionLoading || battle.is_over) return;
    setActionLoading(true);

    if (action === 'attack') {
      playAttackSound();
    } else if (action === 'special') {
      playCriticalHitSound();
    }

    try {
      const nextState = await sendBattleAction(token, battle.battle_id, {
        action,
        switch_idx: switchIdx,
      });
      setBattle(nextState);
      if (nextState.is_over) {
        if (nextState.winner === 'player') {
          playFanfareSound();
        }
        await refreshUser();
        if (onBattleEnd) onBattleEnd();
      }
    } catch (err: any) {
      console.error('Failed action:', err);
    } finally {
      setActionLoading(false);
      setShowSwitchPicker(false);
    }
  };

  const getHpPercent = (curr: number, max: number) => {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((curr / max) * 100)));
  };

  const getHpColor = (percent: number) => {
    if (percent > 50) return 'bg-emerald-500';
    if (percent > 20) return 'bg-amber-500';
    return 'bg-red-500 animate-pulse';
  };

  const getTypeBadgeColor = (typeStr: string) => {
    switch (typeStr?.toLowerCase()) {
      case 'fire': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'water': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'grass': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'lightning': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'psychic': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'fighting': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const pCard = battle.player_active;
  const oCard = battle.opponent_active;
  const pHpPercent = getHpPercent(pCard.current_hp, pCard.max_hp);
  const oHpPercent = getHpPercent(oCard.current_hp, oCard.max_hp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Arena Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
              ⚔️
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                Gym Stadium • Turn {battle.turn}
              </div>
              <h2 className="text-lg font-black text-white">
                VS Gym Leader {battle.gym_name} <span className="text-amber-400 text-sm">({battle.badge_name})</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Battlefield Stadium */}
        <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-4 sm:p-6 space-y-6 overflow-hidden">
          {/* Ambient battle spotlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* TOP: OPPONENT ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Opponent Card Status */}
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl w-full sm:w-auto">
              <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 shadow-md">
                <img src={oCard.image_url} alt={oCard.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-[160px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-white">{oCard.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-bold ${getTypeBadgeColor(oCard.types)}`}>
                    {oCard.types}
                  </span>
                </div>
                {/* HP Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>HP</span>
                    <span className="font-bold text-white">{oCard.current_hp} / {oCard.max_hp}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${getHpColor(oHpPercent)}`}
                      style={{ width: `${oHpPercent}%` }}
                    />
                  </div>
                </div>
                {/* Energy Pips */}
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>Energy:</span>
                  {Array.from({ length: Math.min(oCard.energy, 5) }).map((_, i) => (
                    <span key={i} className="text-amber-400">⚡</span>
                  ))}
                  {oCard.energy === 0 && <span className="text-slate-600 font-mono">0</span>}
                </div>
              </div>
            </div>

            {/* Opponent Bench Dots */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono font-bold">Opponent Bench:</span>
              <div className="flex gap-1.5">
                {battle.opponent_bench.map((b, idx) => (
                  <div
                    key={idx}
                    title={`${b.name} (HP: ${b.current_hp})`}
                    className="w-3.5 h-3.5 rounded-full bg-red-500/40 border border-red-500/80"
                  />
                ))}
                {battle.opponent_bench.length === 0 && (
                  <span className="text-xs text-red-400 font-mono">Last Stand!</span>
                )}
              </div>
            </div>
          </div>

          {/* CENTER: COMBAT LOG DISPLAY */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 max-h-32 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 custom-scrollbar shadow-inner">
            {battle.logs.slice(-5).map((log, index) => (
              <div
                key={index}
                className={`py-0.5 ${
                  log.includes('VICTORY') || log.includes('SUPER')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('fainted') || log.includes('DEFEAT')
                    ? 'text-red-400 font-bold'
                    : log.includes('Turn')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                › {log}
              </div>
            ))}
          </div>

          {/* BOTTOM: PLAYER ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Player Bench Selector */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-mono font-bold flex items-center gap-1.5">
                Your Bench ({battle.player_bench.length}):
              </span>
              <div className="flex gap-2">
                {battle.player_bench.map((benchCard, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAction('switch', idx)}
                    className="group cursor-pointer flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-purple-500 p-1.5 rounded-xl transition-all"
                    title={`Switch to ${benchCard.name}`}
                  >
                    <img src={benchCard.image_url} alt={benchCard.name} className="w-6 h-8 object-cover rounded" />
                    <div className="text-[10px] hidden md:block">
                      <div className="text-white font-bold truncate max-w-[70px]">{benchCard.name}</div>
                      <div className="text-emerald-400 font-mono">{benchCard.current_hp} HP</div>
                    </div>
                  </div>
                ))}
                {battle.player_bench.length === 0 && (
                  <span className="text-xs text-slate-600 font-mono">No bench Pokémon</span>
                )}
              </div>
            </div>

            {/* Player Active Card */}
            <div className="flex items-center gap-4 bg-slate-900/80 border border-emerald-500/40 p-3 rounded-2xl w-full sm:w-auto shadow-lg shadow-emerald-500/5">
              <div className="space-y-1.5 flex-1 min-w-[160px] text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-bold ${getTypeBadgeColor(pCard.types)}`}>
                    {pCard.types}
                  </span>
                  <span className="text-sm font-black text-white">{pCard.name}</span>
                </div>
                {/* HP Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-white">{pCard.current_hp} / {pCard.max_hp}</span>
                    <span>HP</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ml-auto ${getHpColor(pHpPercent)}`}
                      style={{ width: `${pHpPercent}%` }}
                    />
                  </div>
                </div>
                {/* Energy Pips */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  {Array.from({ length: Math.min(pCard.energy, 5) }).map((_, i) => (
                    <span key={i} className="text-amber-400">⚡</span>
                  ))}
                  {pCard.energy === 0 && <span className="text-slate-600 font-mono">0</span>}
                  <span>:Energy</span>
                </div>
              </div>
              <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 flex-shrink-0 shadow-md">
                <img src={pCard.image_url} alt={pCard.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* COMBAT ACTIONS BAR */}
        {!battle.is_over ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Basic Attack */}
            <button
              onClick={() => handleAction('attack')}
              disabled={actionLoading}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <div className="flex items-center gap-1 text-emerald-400">
                <Swords className="w-4 h-4" />
                <span>Basic Attack</span>
              </div>
              <div className="text-[11px] text-slate-300 truncate max-w-full">
                {pCard.basic_atk_name} <span className="text-amber-400 font-mono font-bold">({pCard.basic_atk_dmg} DMG)</span>
              </div>
            </button>

            {/* Special Attack */}
            <button
              onClick={() => handleAction('special')}
              disabled={actionLoading || pCard.energy < 1}
              className={`p-3.5 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md ${
                pCard.energy >= 1
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400/60 text-white shadow-purple-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1 text-amber-300">
                <Zap className="w-4 h-4" />
                <span>Special Move (1 ⚡)</span>
              </div>
              <div className="text-[11px] text-purple-200 truncate max-w-full">
                {pCard.special_atk_name} <span className="text-amber-300 font-mono font-bold">({pCard.special_atk_dmg} DMG)</span>
              </div>
            </button>

            {/* Charge Energy */}
            <button
              onClick={() => handleAction('charge')}
              disabled={actionLoading}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-800 hover:bg-slate-700 border border-amber-500/40 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <div className="flex items-center gap-1 text-amber-400">
                <Shield className="w-4 h-4" />
                <span>Charge Energy</span>
              </div>
              <div className="text-[11px] text-slate-300">
                +2 Energy & Guard
              </div>
            </button>

            {/* Switch Active */}
            <button
              onClick={() => setShowSwitchPicker(!showSwitchPicker)}
              disabled={actionLoading || battle.player_bench.length === 0}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <div className="flex items-center gap-1 text-cyan-400">
                <ArrowLeftRight className="w-4 h-4" />
                <span>Switch Pokémon</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {battle.player_bench.length} on bench
              </div>
            </button>
          </div>
        ) : (
          /* BATTLE CONCLUSION BANNER */
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700 text-center space-y-4 animate-scale-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/80 border border-slate-600 text-3xl">
              {battle.winner === 'player' ? '🏆' : '💀'}
            </div>
            <div>
              <h3 className={`text-2xl font-black ${battle.winner === 'player' ? 'text-amber-400' : 'text-red-400'}`}>
                {battle.winner === 'player' ? 'VICTORY ACHIEVED!' : 'DEFEAT!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {battle.winner === 'player'
                  ? `You defeated Gym Leader ${battle.gym_name} and claimed the ${battle.badge_name}!`
                  : `All your Pokémon fainted against Gym Leader ${battle.gym_name}.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm font-bold">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span>🪙</span>
                <span>+{battle.reward_coins} Coins</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-400">
                <span>⭐</span>
                <span>+{battle.reward_xp} XP</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-sm hover:brightness-110 shadow-lg shadow-purple-500/25"
            >
              Return to Gym Stadium
            </button>
          </div>
        )}

        {/* Bench Switch Picker Popover */}
        {showSwitchPicker && battle.player_bench.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3 animate-fade-in">
            <div className="text-xs font-bold text-white">Select Bench Pokémon to Swap In:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {battle.player_bench.map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAction('switch', idx)}
                  className="cursor-pointer p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 flex items-center gap-3 transition-all"
                >
                  <img src={b.image_url} alt={b.name} className="w-10 h-14 object-cover rounded-lg" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{b.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono">{b.current_hp} / {b.max_hp} HP</div>
                    <div className="text-[10px] text-slate-400">{b.types}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleArena;
