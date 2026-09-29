// Nexus TCG Procedural Web Audio & Haptics Engine (Phase 20)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global Sound Preferences
export const isSoundMuted = (): boolean => {
  try {
    return localStorage.getItem('tcg_sound_muted') === 'true';
  } catch {
    return false;
  }
};

export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem('tcg_sound_muted', muted ? 'true' : 'false');
  } catch {}
};

// Haptics Helper (Mobile Vibration API)
export const triggerHaptic = (pattern: number | number[] = 30): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
};

/**
 * 1. Pack Ripping Sound: Foil crinkle and tear sound effect
 */
export const playPackRipSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([40, 20, 50]);

  // Noise generator for foil crinkle
  const bufferSize = ctx.sampleRate * 0.35;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.35);
  filter.Q.value = 3.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.35);
};

/**
 * 2. Card Flip / Swish Sound
 */
export const playCardFlipSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(20);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
};

/**
 * 3. Holographic Rare Shine / Shimmer Chime
 */
export const playHoloShineSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([30, 30, 60]);

  // Arpeggio notes: E6 (1318), G#6 (1661), B6 (1975), E7 (2637)
  const notes = [1318, 1661, 1975, 2637];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    const startTime = ctx.currentTime + idx * 0.08;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
};

/**
 * 4. Battle Impact / Attack Hit
 */
export const playAttackSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(40);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(260, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.18);

  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
};

/**
 * 5. Battle Critical Strike / Super Effective
 */
export const playCriticalHitSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([50, 40, 80]);

  // Sub bass boom + distortion noise
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
};

/**
 * 6. Coin Clink / Purchase / Reward Claim
 */
export const playCoinClinkSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(25);

  const freqs = [1975, 2349];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const startTime = ctx.currentTime + idx * 0.06;
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
};

/**
 * 7. Victory Fanfare (Tournament / Gym Leader Win)
 */
export const playFanfareSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([40, 40, 40, 100]);

  // Triad chord progression: C5 -> E5 -> G5 -> C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    const startTime = ctx.currentTime + idx * 0.12;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.7);
  });
};

/**
 * 8. UI Subtle Button Click
 */
export const playClickSound = (): void => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(15);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
};

