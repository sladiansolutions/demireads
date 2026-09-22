/**
 * The celebration sound for a correct answer in Find It (SPEC 3.6).
 *
 * Synthesised with the Web Audio API rather than shipped as a file: it adds
 * nothing to the bundle, needs no attribution, and there is nothing to fetch
 * at runtime. Three rising notes, short and soft.
 *
 * There is deliberately no counterpart for a wrong answer. Rule 1: no buzzer,
 * ever. A miss is answered with words, not a sound effect.
 */

/** A major triad, C6-E6-G6. High and bell-like rather than fanfare-loud. */
const NOTES = [1046.5, 1318.5, 1568.0];
const NOTE_MS = 110;
const RING_MS = 260;
const PEAK_GAIN = 0.12;

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/**
 * Play the cheer. Called from a tap, which is what lets the audio context
 * start on mobile; if it is still suspended we resume it first.
 */
export function playCheer(): void {
  const ctx = audio();
  if (!ctx) return;

  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  const start = ctx.currentTime;
  NOTES.forEach((frequency, index) => {
    const at = start + (index * NOTE_MS) / 1000;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // A triangle wave is softer than a square and less thin than a sine.
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    // Quick attack, gentle decay: a note, not a beep.
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + RING_MS / 1000);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + RING_MS / 1000 + 0.02);
  });
}

/** True where the browser can synthesise at all. */
export function isChimeAvailable(): boolean {
  return audio() !== null;
}
