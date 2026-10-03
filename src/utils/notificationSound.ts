// WEPSUN Elevator Engineering - Sound & Audio Notification Engine
// Uses Web Audio API for lightweight, offline-ready, zero-network notification chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Ignored until user gesture
      });
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export type SoundType = 'standard' | 'urgent' | 'success' | 'markRead' | 'info';

const SOUND_PREF_KEY = 'wepsun_notifications_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_PREF_KEY);
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, String(enabled));
}

/**
 * Play a synthesized, pleasant chime based on notification urgency
 */
export function playNotificationSound(type: SoundType = 'standard'): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    switch (type) {
      case 'urgent': {
        // High attention 2-pulse tone (880Hz -> 1046.5Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
        osc.frequency.setValueAtTime(880, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

        // Gentle volume curve
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
        break;
      }

      case 'success': {
        // Warm 3-note ascending chord (F5 -> A5 -> C6)
        const notes = [698.46, 880.0, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.06, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.36);
        });
        break;
      }

      case 'markRead': {
        // Soft click / bubble pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'standard':
      case 'info':
      default: {
        // Polite 2-tone melodic chime (D5 -> A5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        // Note 1: 587.33Hz (D5)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.23);

        // Note 2: 880.00Hz (A5)
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.0, now + 0.1);
        gain2.gain.setValueAtTime(0.07, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.41);
        break;
      }
    }
  } catch (err) {
    // Graceful fallback if audio is blocked
  }
}
