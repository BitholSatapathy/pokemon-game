import React from 'react';

export interface CardPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'none' | 'purple' | 'gold' | 'holo';
}

export const CardPanel: React.FC<CardPanelProps> = ({
  children,
  hoverEffect = false,
  glow = 'none',
  className = '',
  ...props
}) => {
  const glowClasses = {
    none: '',
    purple: 'shadow-glow-purple border-purple-500/40',
    gold: 'shadow-glow-gold border-amber-500/50',
    holo: 'shadow-glow-holo border-purple-400/40',
  }[glow];

  return (
    <div
      className={`glass-panel rounded-2xl p-5 ${
        hoverEffect ? 'glass-panel-hover' : ''
      } ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
