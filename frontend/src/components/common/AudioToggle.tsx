import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundMuted, setSoundMuted, playClickSound } from '../../services/sound';

export const AudioToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const toggle = () => {
    const nextState = !muted;
    setMuted(nextState);
    setSoundMuted(nextState);
    if (!nextState) {
      playClickSound();
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl border transition-all ${
        muted
          ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
          : 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:text-purple-100 shadow-glow-purple'
      } ${className}`}
      title={muted ? 'Unmute Audio & SFX' : 'Mute Audio & SFX'}
      aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
    </button>
  );
};
