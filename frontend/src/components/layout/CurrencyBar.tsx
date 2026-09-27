import React from 'react';
import { Coins, Gem, Zap } from 'lucide-react';
import { UserProfile } from '../../types';

interface CurrencyBarProps {
  user: UserProfile;
}

export const CurrencyBar: React.FC<CurrencyBarProps> = ({ user }) => {
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Coins Chip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/90 border border-amber-500/30 shadow-sm backdrop-blur-md">
        <Coins className="w-4 h-4 text-brand-gold animate-bounce" />
        <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
          {user.coins.toLocaleString()}
        </span>
      </div>

      {/* Gems Chip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/90 border border-cyan-500/30 shadow-sm backdrop-blur-md">
        <Gem className="w-4 h-4 text-cyan-400" />
        <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono">
          {user.gems.toLocaleString()}
        </span>
      </div>

      {/* Level & XP Widget */}
      <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface/90 border border-purple-500/30 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-1 text-xs font-bold text-brand-purple">
          <Zap className="w-3.5 h-3.5 fill-brand-purple" />
          <span>LVL {user.level}</span>
        </div>
        <div className="w-20 bg-surface-border rounded-full h-2 overflow-hidden" title={`XP: ${user.xp}/${user.xpToNextLevel} (${xpPercent}%)`}>
          <div
            className="bg-gradient-to-r from-brand-violet to-brand-purple h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(8, xpPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
