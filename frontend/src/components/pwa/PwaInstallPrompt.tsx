import React, { useEffect, useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user already dismissed recently
      const dismissed = localStorage.getItem('tcg_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('tcg_pwa_dismissed', 'true');
    } catch {}
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-surface-dark/95 backdrop-blur-xl border border-purple-500/40 rounded-3xl p-5 shadow-2xl shadow-purple-950/60 animate-scaleUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-brand-violet to-indigo-600 flex items-center justify-center text-white shadow-glow-purple flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white font-display">Install Nexus TCG App</h4>
            <p className="text-[11px] text-slate-400">Play offline & fullscreen on your device</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Add to Home Screen
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white text-xs font-semibold"
        >
          Later
        </button>
      </div>
    </div>
  );
};
