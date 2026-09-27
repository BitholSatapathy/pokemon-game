import React from 'react';
import { Link } from 'react-router-dom';

interface CollectionProgressWidgetProps {
  collected?: number;
  total?: number;
}

export const CollectionProgressWidget: React.FC<CollectionProgressWidgetProps> = ({
  collected = 128,
  total = 240,
}) => {
  const percentage = Math.round((collected / total) * 100);

  // SVG circular ring calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const rarityBreakdown = [
    { label: 'Common', current: 72, total: 100, color: 'bg-blue-500' },
    { label: 'Uncommon', current: 38, total: 80, color: 'bg-cyan-400' },
    { label: 'Rare', current: 14, total: 40, color: 'bg-indigo-400' },
    { label: 'Ultra Rare', current: 4, total: 15, color: 'bg-amber-400' },
    { label: 'Secret Rare', current: 0, total: 5, color: 'bg-rose-400' },
  ];

  return (
    <div className="bg-[#121222] border border-[#201E38] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
          COLLECTION PROGRESS
        </h3>
        <Link
          to="/collection"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          View Collection &rarr;
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Progress Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
            {/* Background track */}
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              className="text-[#201E38]"
              fill="transparent"
            />
            {/* Gradient stroke */}
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-white font-mono">{percentage}%</span>
          </div>
        </div>

        {/* Text Stats */}
        <div className="space-y-1">
          <div className="text-2xl font-black text-white font-mono">
            {collected} <span className="text-sm font-normal text-gray-400">/ {total}</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">Cards Collected</p>
        </div>
      </div>

      {/* Rarity Breakdown Dots List */}
      <div className="space-y-2 pt-2 border-t border-[#201E38]/80 text-xs">
        {rarityBreakdown.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-gray-300">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${r.color}`} />
              <span className="text-gray-400">{r.label}</span>
            </div>
            <span className="font-mono text-gray-300 font-semibold">
              {r.current} / {r.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
