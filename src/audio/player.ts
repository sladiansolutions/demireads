/** Plays a stored voice clip, with a fallback if the browser refuses. */

import { stopSpeaking } from './speech';

let current: HTMLAudioElement | null = null;

export function stopClip(): void {
  if (!current) return;
  current.pause();
  current = null;
}

/**
 * `play()` can reject (autoplay rules, a codec the tablet cannot handle, a
 * corrupt clip). When it does we say the line with speech instead, so a tap
 * is never silent.
 */
export function playClip(url: string, onFailure: () => void): void {
  stopClip();
  stopSpeaking();
  const audio = new Audio(url);
  current = audio;
  audio.addEventListener('error', () => {
    if (current === audio) onFailure();
  });
  audio.play().catch(() => {
    if (current === audio) onFailure();
  });
}
