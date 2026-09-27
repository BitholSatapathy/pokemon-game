import React from 'react';
import { CardRarity } from '../../types';
import { Sparkles } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  rarity?: CardRarity | string;
  variant?: 'default' | 'gold' | 'purple' | 'success';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  rarity,
  variant,
  className = '',
  ...props
}) => {
  let badgeStyle = 'bg-surface-light text-gray-300 border-surface-border';

  if (rarity) {
    switch (rarity) {
      case 'Common':
        badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-600/50';
        break;
      case 'Uncommon':
        badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
        break;
      case 'Rare':
        badgeStyle = 'bg-blue-950/80 text-blue-300 border-blue-500/40';
        break;
      case 'Rare Holo':
      case 'Ultra Rare':
        badgeStyle = 'bg-purple-950/90 text-purple-200 border-purple-400/80 shadow-glow-purple font-semibold';
        break;
      case 'Secret Rare':
        badgeStyle = 'bg-amber-950/90 text-amber-200 border-amber-400/80 shadow-glow-gold font-bold';
        break;
    }

  } else if (variant === 'gold') {
    badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (variant === 'purple') {
    badgeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  } else if (variant === 'success') {
    badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md ${badgeStyle} ${className}`}
      {...props}
    >
      {rarity === 'Secret Rare' && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
      {children || rarity}
    </span>
  );
};
