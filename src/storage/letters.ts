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

export const STATE_LABELS: Record<LetterState, string> = {
  0: 'Not started',
  1: 'New',
  2: 'Learning',
  3: 'Knows it',
};

/** Write one letter's record. */
export async function putProgress(record: LetterProgress): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    await database.put('letters', record);
  } catch {
    // Progress is worth keeping, but not worth an error on a child's screen.
  }
}

/** Write the whole map, for bootstrap, daily introductions and session resets. */
export async function putAllProgress(progress: Record<string, LetterProgress>): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    const tx = database.transaction('letters', 'readwrite');
    await Promise.all([...Object.values(progress).map((record) => tx.store.put(record)), tx.done]);
  } catch {
    // Same: the next launch will simply reintroduce what was lost.
  }
}
