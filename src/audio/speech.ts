/**
 * Speech synthesis wrapper. This is the fallback voice; from phase 2 a parent
 * recording is preferred when one exists (SPEC 7). Everything here is local to
 * the device, so it keeps working offline.
 */

const RATE = 0.85; // slower than default; two-year-olds need the time
const PITCH = 1.05;

let cachedVoice: SpeechSynthesisVoice | null = null;
let warmed = false;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

export function isSpeechAvailable(): boolean {
  return synth() !== null;
}

/** Prefer a local English voice so nothing is fetched at speak time. */
function pickVoice(s: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = s.getVoices();
  if (voices.length === 0) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = english.length > 0 ? english : voices;
  return pool.find((v) => v.localService) ?? pool[0] ?? null;
}

/**
 * Call once from the first child tap. iOS will not speak unless the first
 * utterance happens inside a user gesture, and voices often load lazily.
 */
export function warmUpSpeech(): void {
  const s = synth();
  if (!s || warmed) return;
  warmed = true;
  cachedVoice = pickVoice(s);
  s.addEventListener?.('voiceschanged', () => {
    cachedVoice = pickVoice(s);
  });
  // An empty-sounding utterance satisfies the gesture requirement quietly.
  const nudge = new SpeechSynthesisUtterance(' ');
  nudge.volume = 0;
  s.speak(nudge);
}

/** Speak `text`, interrupting anything already speaking. */
export function speak(text: string): void {
  const s = synth();
  if (!s) return;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (!cachedVoice) cachedVoice = pickVoice(s);
  if (cachedVoice) {
    utterance.voice = cachedVoice;
    utterance.lang = cachedVoice.lang;
  } else {
    utterance.lang = 'en-US';
  }
  utterance.rate = RATE;
  utterance.pitch = PITCH;
  s.speak(utterance);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
