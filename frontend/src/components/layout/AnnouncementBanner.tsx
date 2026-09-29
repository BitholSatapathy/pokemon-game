import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { fetchActiveAnnouncements } from '../../services/api';
import { SystemAnnouncement } from '../../types';

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    try {
      const stored = sessionStorage.getItem('tcg_dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchActiveAnnouncements()
      .then((data) => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (id: number) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('tcg_dismissed_announcements', JSON.stringify(updated));
    } catch {}
  };

  const activeVisible = announcements.filter((a) => !dismissedIds.includes(a.id));
  if (activeVisible.length === 0) return null;

  const current = activeVisible[0];

  const getStyle = () => {
    switch (current.banner_type) {
      case 'event':
        return {
          bg: 'bg-gradient-to-r from-amber-950/80 via-yellow-900/40 to-amber-950/80 border-amber-500/30 text-amber-200',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />,
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-red-950/80 via-rose-900/40 to-red-950/80 border-red-500/30 text-red-200',
          badge: 'bg-red-500 text-white font-bold',
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-950/80 via-green-900/40 to-emerald-950/80 border-emerald-500/30 text-emerald-200',
          badge: 'bg-emerald-500 text-slate-950 font-bold',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-950/80 via-indigo-900/40 to-blue-950/80 border-blue-500/30 text-blue-200',
          badge: 'bg-blue-500 text-white font-bold',
          icon: <Info className="w-4 h-4 text-blue-400" />,
        };
    }
  };

  const style = getStyle();

  return (
    <aside
      aria-label="System announcement"
      className={`w-full border-b backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs sm:text-sm z-40 transition-all ${style.bg}`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex-shrink-0">{style.icon}</div>
          <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ${style.badge}`}>
            {current.banner_type}
          </span>
          <span className="font-semibold text-white truncate">{current.title}</span>
          <span className="hidden md:inline text-slate-300 opacity-90 truncate">— {current.message}</span>
        </div>
        <button
          onClick={() => handleDismiss(current.id)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 text-slate-400 hover:text-white"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
