import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_MARKET_TRENDS } from '../../data/mockData';

export const MarketTrendsWidget: React.FC = () => {
  const renderSparkline = (data: number[], isPositive: boolean) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#10B981' : '#F43F5E';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="bg-[#121222] border border-[#201E38] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
          MARKET TRENDS
        </h3>
        <Link
          to="/market"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          View Market &rarr;
        </Link>
      </div>

      <div className="space-y-3">
        {MOCK_MARKET_TRENDS.map((item) => {
          const isPositive = item.change24h > 0;

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#17172B] border border-[#252342] flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
            >
              {/* Card Mini Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.avatarUrl}
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#2A2A44] shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      {item.priceCoins.toLocaleString()} 🪙
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline & Percentage */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[11px] font-mono font-bold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '▲ +' : '▼ '}
                  {item.change24h}%
                </span>
                <div className="hidden sm:block">
                  {renderSparkline(item.sparkline, isPositive)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
