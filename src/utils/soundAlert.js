// Web Audio API sound alert service for ZUPARO online orders
// Delivers a high-clarity acoustic "csilingelő" (crystal service chime / bell)
// or "csipogó" (pager beep) across all browsers with zero external audio assets.

let audioCtx = null;
let isMuted = false;
let currentSoundType = 'chime'; // 'chime' (csilingelő) or 'beep' (csipogó)

// Restore user preferences
try {
  const savedMute = localStorage.getItem('zuparo_sound_muted');
  if (savedMute !== null) {
    isMuted = savedMute === 'true';
  }
  const savedType = localStorage.getItem('zuparo_sound_type');
  if (savedType === 'beep' || savedType === 'chime') {
    currentSoundType = savedType;
  }
} catch (e) {
  // ignore
}

function getAudioContext() {
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

/**
 * Creates an authentic resonant bell / crystal chime strike ("csilingelés")
 * Combines fundamental tone with inharmonic bell overtones for realistic metallic shimmer.
 */
function playChimeBell(ctx, baseFreq, startTime, duration = 1.2, volume = 0.35) {
  try {
    // 1. Primary fundamental
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

    // 2. High crystal shimmer overtone (~2.75x)
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

    // 3. Ultra-high sparkle / strike harmonic (~4.1x)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(baseFreq * 4.07, startTime);

    gain3.gain.setValueAtTime(0.0001, startTime);
    gain3.gain.exponentialRampToValueAtTime(volume * 0.2, startTime + 0.003);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(startTime);
    osc3.stop(startTime + 0.2);
  } catch (err) {
    console.warn('Chime bell error', err);
  }
}

/**
 * Electronic kitchen pager beep (csipogó)
 */
function playDigitalBeep(ctx, freq, startTime, duration = 0.12, volume = 0.3) {
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
 * Plays either melodic crystal chime ("csilingelő") or digital pager ("csipogó")
 */
export function playOnlineOrderSound(overrideType) {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const type = overrideType || currentSoundType;
    const now = ctx.currentTime + 0.04;

    if (type === 'beep') {
      // 3 crisp high-pitch kitchen beeps: Beep - Beep - Beep!
      playDigitalBeep(ctx, 1760, now + 0.00, 0.12, 0.32);
      playDigitalBeep(ctx, 1760, now + 0.18, 0.12, 0.32);
      playDigitalBeep(ctx, 2349.32, now + 0.36, 0.20, 0.36);

      // Repeat second cycle after 0.5s pause
      playDigitalBeep(ctx, 1760, now + 0.70, 0.12, 0.32);
      playDigitalBeep(ctx, 1760, now + 0.88, 0.12, 0.32);
      playDigitalBeep(ctx, 2349.32, now + 1.06, 0.25, 0.36);
    } else {
      // Default: "Csilingelő" (Crystal Service Chime - Csing-Csing-Dong! ✨)
      // G6 (1568Hz) -> C7 (2093Hz) -> E7 (2637Hz) with sparkling overtones
      playChimeBell(ctx, 1318.51, now + 0.00, 0.9, 0.32); // E6
      playChimeBell(ctx, 1567.98, now + 0.22, 1.0, 0.35); // G6
      playChimeBell(ctx, 2093.00, now + 0.46, 1.4, 0.40); // C7 (High crystal peak)

      // Echo shimmer
      playChimeBell(ctx, 1567.98, now + 0.95, 0.8, 0.28); // G6 echo
      playChimeBell(ctx, 2093.00, now + 1.15, 1.5, 0.38); // C7 sustained bell
    }
  } catch (e) {
    console.warn('Could not play order notification:', e);
  }
}

/**
 * Single test sound
 */
export function testSound(soundType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const type = soundType || currentSoundType;
    const now = ctx.currentTime + 0.03;

    if (type === 'beep') {
      playDigitalBeep(ctx, 1760, now, 0.12, 0.32);
      playDigitalBeep(ctx, 2349.32, now + 0.18, 0.22, 0.36);
    } else {
      // Single crystal bell strike
      playChimeBell(ctx, 1567.98, now, 0.8, 0.35);
      playChimeBell(ctx, 2093.00, now + 0.20, 1.2, 0.40);
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
  if (type === 'chime' || type === 'beep') {
    currentSoundType = type;
    try {
      localStorage.setItem('zuparo_sound_type', type);
    } catch (e) {
      // ignore
    }
    testSound(type);
  }
  return currentSoundType;
}
