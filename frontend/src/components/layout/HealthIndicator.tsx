import React, { useState, useEffect } from 'react';
import { Activity, WifiOff } from 'lucide-react';
import { BackendHealth } from '../../types';

export const HealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth>({ status: 'checking' });

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health', {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setHealth({
              status: 'online',
              service: data.service,
              version: data.version,
              database: data.database,
              timestamp: data.timestamp,
            });
          }
        } else {
          if (isMounted) setHealth({ status: 'offline' });
        }
      } catch {
        if (isMounted) setHealth({ status: 'offline' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (health.status === 'checking') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-light border border-surface-border text-xs text-gray-400">
        <Activity className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
        <span className="hidden sm:inline">Connecting API...</span>
      </div>
    );
  }

  if (health.status === 'online') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-medium shadow-sm cursor-help"
        title={`FastAPI ${health.version} • DB: ${health.database}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block -ml-3.5" />
        <span className="font-semibold">API Online</span>
        <span className="text-[10px] text-emerald-400/80 hidden md:inline">v{health.version}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 font-medium cursor-help"
      title="Backend server offline on port 8000. Start backend using: uvicorn app.main:app"
    >
      <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      <span className="font-semibold">API Offline</span>
    </div>
  );
};
