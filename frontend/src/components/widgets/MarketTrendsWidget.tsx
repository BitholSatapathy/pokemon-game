import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCards } from '../../services/api';
import { Card } from '../../types';

export const MarketTrendsWidget: React.FC = () => {
  const [trends, setTrends] = useState<Card[]>([]);

  useEffect(() => {
    fetchCards({ rarity: 'Rare Holo', limit: 4 })
      .then((res) => {
        if (res.items.length > 0) {
          setTrends(res.items);
        }
      })
      .catch((err) => console.warn('Could not fetch market trends:', err));
  }, []);

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

  // Sparkline generator based on card price
  const getTrendData = (price: number, idx: number) => {
    const isPositive = idx % 2 === 0;
    const change = isPositive ? +(4.2 + idx * 2.1).toFixed(1) : -(1.8 + idx * 0.9).toFixed(1);
    const sparkline = isPositive
      ? [price * 0.88, price * 0.92, price * 0.91, price * 0.96, price * 0.98, price]
      : [price * 1.08, price * 1.05, price * 1.02, price * 1.04, price * 1.01, price];
    return { isPositive, change, sparkline };
  };

  return (
    <div className="bg-[#121222] border border-[#201E38] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
          LIVE MARKET TRENDS
        </h3>
        <Link
          to="/market"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          View Market &rarr;
        </Link>
      </div>

      <div className="space-y-3">
        {trends.map((item, idx) => {
          const { isPositive, change, sparkline } = getTrendData(item.marketPrice, idx);

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#17172B] border border-[#252342] flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
            >
              {/* Card Mini Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-8 h-11 rounded-lg object-cover border border-[#2A2A44] shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      {item.marketPrice.toLocaleString()} 🪙
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
                  {change}%
                </span>
                <div className="hidden sm:block">
                  {renderSparkline(sparkline, isPositive)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
