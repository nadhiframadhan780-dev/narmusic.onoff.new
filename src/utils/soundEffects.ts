/**
 * NARmusic - Sound Effects Generator (Web Audio API)
 * Menghasilkan nada lonceng (chime) lembut dan haptik audio modern saat notifikasi muncul
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playNotificationSound(type: 'success' | 'info' | 'warning' | 'error' = 'info') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    // Frekuensi ramah telinga khas aplikasi modern
    if (type === 'success') {
      // Arpeggio nada ceria G5 -> C6
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (type === 'warning') {
      // Nada perhatian hangat
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(523.25, now + 0.1); // C5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'error') {
      // Nada lembut ganda
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.linearRampToValueAtTime(349.23, now + 0.15); // F4
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.37);
    } else {
      // Info: Soft gentle chime E5 -> A5
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.37);
    }
  } catch {
    // Abaikan jika browser membatasi autoplay audio
  }
}
