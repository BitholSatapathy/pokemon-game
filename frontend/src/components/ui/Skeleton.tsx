import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  className = '',
  ...props
}) => {
  if (variant === 'circle') {
    return (
      <div
        className={`rounded-full bg-surface-border animate-pulse ${className}`}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`glass-panel rounded-2xl p-4 flex flex-col gap-3 animate-pulse border border-surface-border ${className}`}
        {...props}
      >
        <div className="w-full aspect-[2.5/3.5] bg-surface-light rounded-xl" />
        <div className="h-4 bg-surface-light rounded w-3/4" />
        <div className="h-3 bg-surface-light rounded w-1/2" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-surface-light animate-pulse ${className}`}
      {...props}
    />
  );
};
