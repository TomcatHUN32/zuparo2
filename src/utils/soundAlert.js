// Web Audio API sound alert service for online orders
// Provides an industrial, loud, penetrating alarm ("erős konyhai riasztó")
// specifically designed for restaurant kitchens so orders cannot be missed,
// plus digital pager beep and crystal chime options.

let audioCtx = null;
let isMuted = false;
let currentSoundType = 'alarm'; // Default to 'alarm' (Erős idegesítő konyhai riasztó)

// Restore user preferences
try {
  const savedMute = localStorage.getItem('zuparo_sound_muted');
  if (savedMute !== null) {
    isMuted = savedMute === 'true';
  }
  const savedType = localStorage.getItem('zuparo_sound_type');
  if (savedType === 'alarm' || savedType === 'loud_alarm' || savedType === 'beep' || savedType === 'chime') {
    currentSoundType = savedType === 'loud_alarm' ? 'alarm' : savedType;
  } else {
    currentSoundType = 'alarm';
  }
} catch (e) {
  // ignore
}

export function getAudioContext() {
  if (!audioCtx) {
    try {
      const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (typeof AudioContextClass === 'function') {
        audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('AudioContext initialization error:', e);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      audioCtx.resume().catch(() => {});
    } catch (e) {
      // ignore
    }
  }
  return audioCtx;
}

// Auto-unlock audio context on any user interaction (click, touch, key) anywhere in the window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  ['click', 'touchstart', 'mousedown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

/**
 * High-intensity kitchen alarm ("Erős idegesítő hang")
 * Piercing multi-tone buzzer that repeats in 4 sharp cycles with rich sawtooth & square harmonics.
 * Frequency range: 2200Hz - 3800Hz (human ear maximum sensitivity range).
 */
function playLoudAlarm(ctx, startTime) {
  const bursts = [
    // Cycle 1: 4 rapid harsh staccato bursts
    { t: 0.00, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 0.16, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 0.32, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 0.48, f1: 2600, f2: 3300, dur: 0.22 },

    // Cycle 2: Higher pitch urgent bursts
    { t: 0.85, f1: 2400, f2: 2950, dur: 0.12 },
    { t: 1.01, f1: 2400, f2: 2950, dur: 0.12 },
    { t: 1.17, f1: 2400, f2: 2950, dur: 0.12 },
    { t: 1.33, f1: 2850, f2: 3600, dur: 0.25 },

    // Cycle 3: Klaxon pulse
    { t: 1.75, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 1.91, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 2.07, f1: 2200, f2: 2770, dur: 0.12 },
    { t: 2.23, f1: 2600, f2: 3300, dur: 0.22 },

    // Cycle 4: Final loud siren finale
    { t: 2.60, f1: 2500, f2: 3200, dur: 0.14 },
    { t: 2.78, f1: 2500, f2: 3200, dur: 0.14 },
    { t: 2.96, f1: 3000, f2: 3800, dur: 0.45 },
  ];

  bursts.forEach(({ t, f1, f2, dur }) => {
    const burstStart = startTime + t;
    try {
      // 1. Primary harsh sawtooth oscillator
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(f1, burstStart);

      gain1.gain.setValueAtTime(0.001, burstStart);
      gain1.gain.linearRampToValueAtTime(0.9, burstStart + 0.015);
      gain1.gain.setValueAtTime(0.9, burstStart + dur - 0.02);
      gain1.gain.linearRampToValueAtTime(0.001, burstStart + dur);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(burstStart);
      osc1.stop(burstStart + dur);

      // 2. Secondary punchy square oscillator (discordant overtone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(f2, burstStart);

      gain2.gain.setValueAtTime(0.001, burstStart);
      gain2.gain.linearRampToValueAtTime(0.7, burstStart + 0.015);
      gain2.gain.setValueAtTime(0.7, burstStart + dur - 0.02);
      gain2.gain.linearRampToValueAtTime(0.001, burstStart + dur);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(burstStart);
      osc2.stop(burstStart + dur);
    } catch (e) {
      // ignore single burst error
    }
  });
}

/**
 * Creates an authentic resonant bell / crystal chime strike ("csilingelés")
 */
function playChimeBell(ctx, baseFreq, startTime, duration = 1.2, volume = 0.5) {
  try {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, startTime);

    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.exponentialRampToValueAtTime(volume, startTime + 0.008);
    gain1.gain.exponentialRampToValueAtTime(volume * 0.4, startTime + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + duration);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.756, startTime);

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.exponentialRampToValueAtTime(volume * 0.35, startTime + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(startTime);
    osc2.stop(startTime + duration * 0.6);
  } catch (err) {
    console.warn('Chime bell error', err);
  }
}

/**
 * Electronic kitchen pager beep (csipogó)
 */
function playDigitalBeep(ctx, freq, startTime, duration = 0.12, volume = 0.5) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn('Digital beep error', err);
  }
}

/**
 * Main online order notification sound
 * Triggers the alarm/buzzer so the kitchen staff is immediately alerted.
 */
export function playOnlineOrderSound(overrideType) {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const type = overrideType || currentSoundType || 'alarm';
    const now = ctx.currentTime + 0.04;

    if (type === 'alarm' || type === 'loud_alarm') {
      // Loud industrial alarm!
      playLoudAlarm(ctx, now);
    } else if (type === 'beep') {
      playDigitalBeep(ctx, 1760, now + 0.00, 0.12, 0.45);
      playDigitalBeep(ctx, 1760, now + 0.18, 0.12, 0.45);
      playDigitalBeep(ctx, 2349.32, now + 0.36, 0.20, 0.5);
      playDigitalBeep(ctx, 1760, now + 0.70, 0.12, 0.45);
      playDigitalBeep(ctx, 1760, now + 0.88, 0.12, 0.45);
      playDigitalBeep(ctx, 2349.32, now + 1.06, 0.25, 0.5);
    } else {
      playChimeBell(ctx, 1318.51, now + 0.00, 0.9, 0.45);
      playChimeBell(ctx, 1567.98, now + 0.22, 1.0, 0.5);
      playChimeBell(ctx, 2093.00, now + 0.46, 1.4, 0.55);
      playChimeBell(ctx, 1567.98, now + 0.95, 0.8, 0.4);
      playChimeBell(ctx, 2093.00, now + 1.15, 1.5, 0.55);
    }
  } catch (e) {
    console.warn('Could not play order notification:', e);
  }
}

/**
 * Test sound trigger
 */
export function testSound(soundType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const type = soundType || currentSoundType || 'alarm';
    const now = ctx.currentTime + 0.03;

    if (type === 'alarm' || type === 'loud_alarm') {
      // 2 test alarm bursts
      const testBursts = [
        { t: 0.00, f1: 2200, f2: 2770, dur: 0.12 },
        { t: 0.16, f1: 2200, f2: 2770, dur: 0.12 },
        { t: 0.32, f1: 2200, f2: 2770, dur: 0.12 },
        { t: 0.48, f1: 2600, f2: 3300, dur: 0.24 },
        { t: 0.85, f1: 2500, f2: 3200, dur: 0.14 },
        { t: 1.03, f1: 2900, f2: 3700, dur: 0.35 },
      ];
      testBursts.forEach(({ t, f1, f2, dur }) => {
        const bStart = now + t;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f1, bStart);
        gain1.gain.setValueAtTime(0.001, bStart);
        gain1.gain.linearRampToValueAtTime(0.9, bStart + 0.015);
        gain1.gain.setValueAtTime(0.9, bStart + dur - 0.02);
        gain1.gain.linearRampToValueAtTime(0.001, bStart + dur);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(bStart);
        osc1.stop(bStart + dur);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(f2, bStart);
        gain2.gain.setValueAtTime(0.001, bStart);
        gain2.gain.linearRampToValueAtTime(0.65, bStart + 0.015);
        gain2.gain.setValueAtTime(0.65, bStart + dur - 0.02);
        gain2.gain.linearRampToValueAtTime(0.001, bStart + dur);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(bStart);
        osc2.stop(bStart + dur);
      });
    } else if (type === 'beep') {
      playDigitalBeep(ctx, 1760, now, 0.12, 0.45);
      playDigitalBeep(ctx, 2349.32, now + 0.18, 0.22, 0.5);
    } else {
      playChimeBell(ctx, 1567.98, now, 0.8, 0.5);
      playChimeBell(ctx, 2093.00, now + 0.20, 1.2, 0.55);
    }
    return true;
  } catch (e) {
    console.warn('Test sound error:', e);
    return false;
  }
}

export function isAudioMuted() {
  return isMuted;
}

export function toggleAudioMute() {
  isMuted = !isMuted;
  try {
    localStorage.setItem('zuparo_sound_muted', String(isMuted));
  } catch (e) {
    // ignore
  }
  return isMuted;
}

export function setAudioMuted(val) {
  isMuted = Boolean(val);
  try {
    localStorage.setItem('zuparo_sound_muted', String(isMuted));
  } catch (e) {
    // ignore
  }
  return isMuted;
}

export function getSoundType() {
  return currentSoundType;
}

export function setSoundType(type) {
  if (type === 'alarm' || type === 'loud_alarm' || type === 'beep' || type === 'chime') {
    currentSoundType = type === 'loud_alarm' ? 'alarm' : type;
    try {
      localStorage.setItem('zuparo_sound_type', currentSoundType);
    } catch (e) {
      // ignore
    }
    testSound(currentSoundType);
  }
  return currentSoundType;
}
