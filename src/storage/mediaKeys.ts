/**
 * Media ids are derived, not random, so adding a photo for a letter replaces
 * the previous one instead of piling up. Pure, so it is unit tested.
 */

import type { MediaTarget } from './db';

export function mediaId(kind: 'photo' | 'audio', target: MediaTarget): string {
  const key = target.key === undefined ? '' : target.key.toUpperCase();
  return `${kind}:${target.type}:${key}`;
}

export function letterPhotoId(letter: string): string {
  return mediaId('photo', { type: 'letter', key: letter });
}

export function letterAudioId(letter: string): string {
  return mediaId('audio', { type: 'letter', key: letter });
}

export function numberAudioId(n: number): string {
  return mediaId('audio', { type: 'number', key: String(n) });
}

export const GOODNIGHT_AUDIO_ID = mediaId('audio', { type: 'goodnight' });
export const SONG_AUDIO_ID = mediaId('audio', { type: 'song' });

/**
 * Longest edge for a stored photo. The biggest slot on screen is the Family
 * Book page at 480 CSS px, so 1200 covers a retina tablet with room to spare
 * and keeps 26 photos to a few megabytes.
 */
export const PHOTO_MAX_EDGE = 1200;

export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
