/**
 * Letter progress records (SPEC 6). Phase 2 only reads them for the parent
 * area summary and counts exposures; the scheduler that changes state is
 * phase 4.
 */

import { db, hasStorage, type LetterProgress, type LetterState } from './db';
import { ALPHABET } from '../content/letters';

export function newProgress(letter: string): LetterProgress {
  return {
    letter,
    state: 0,
    exposures: 0,
    correctByDay: {},
    sessionMisses: 0,
    lastStateChange: new Date().toISOString(),
  };
}

export async function loadProgress(): Promise<Record<string, LetterProgress>> {
  const byLetter: Record<string, LetterProgress> = {};
  for (const letter of ALPHABET) byLetter[letter] = newProgress(letter);
  if (!hasStorage()) return byLetter;
  try {
    const database = await db();
    for (const stored of await database.getAll('letters')) byLetter[stored.letter] = stored;
  } catch {
    // Fall through to the blank set.
  }
  return byLetter;
}

/** Letter Garden taps and Family Book pages are exposures, never evidence. */
export async function recordExposure(letter: string): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    const existing = (await database.get('letters', letter)) ?? newProgress(letter);
    await database.put('letters', { ...existing, exposures: existing.exposures + 1 });
  } catch {
    // An exposure count is not worth interrupting a two-year-old for.
  }
}

export const STATE_LABELS: Record<LetterState, string> = {
  0: 'Not started',
  1: 'New',
  2: 'Learning',
  3: 'Knows it',
};
