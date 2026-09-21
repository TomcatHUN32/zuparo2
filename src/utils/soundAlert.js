// Web Audio API sound alert service for online orders
// Provides high-reliability audio notifications across all browsers without external asset dependencies.

let audioCtx = null;
let isMuted = false;

// Check localStorage
try {
  const saved = localStorage.getItem('zuparo_sound_muted');
  if (saved !== null) {
    isMuted = saved === 'true';
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
 * Plays a single chime tone with smooth envelope
 */
function playTone(ctx, freq, startTime, duration = 0.45, gainLevel = 0.25) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use a blend of sine and triangle for a pleasant acoustic bell tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Exponential decay envelope
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn('Audio tone play error', err);
  }
}

/**
 * Restaurant kitchen order chime:
 * 3-note ascending chime repeated twice (E5 -> G#5 -> B5, then higher octave or repeat)
 */
export function playOnlineOrderSound() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime + 0.05;

    // First sequence (Ding - Ding - Dong)
    playTone(ctx, 659.25, now + 0.00, 0.4, 0.30); // E5
    playTone(ctx, 830.61, now + 0.18, 0.4, 0.32); // G#5
    playTone(ctx, 1046.50, now + 0.38, 0.6, 0.35); // C6

    // Second emphasis chime after 0.75s
    playTone(ctx, 830.61, now + 0.85, 0.4, 0.30); // G#5
    playTone(ctx, 1046.50, now + 1.05, 0.4, 0.32); // C6
    playTone(ctx, 1318.51, now + 1.25, 0.8, 0.38); // E6
  } catch (e) {
    console.warn('Could not play order chime:', e);
  }
}

/**
 * Quick single test sound to test volume and activate browser AudioContext
 */
export function testSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime + 0.05;
    playTone(ctx, 880, now, 0.35, 0.3); // A5
    playTone(ctx, 1174.66, now + 0.2, 0.55, 0.35); // D6
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
