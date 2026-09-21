/**
 * Letter sequence, SPEC 5.2. Pure functions, no React and no browser APIs.
 *
 * Order: distinct letters of the child's name, then first letters of family
 * names, then the default order. Every letter appears exactly once.
 */

import { ALPHABET } from '../content/letters';
import { DEFAULT_ORDER } from '../content/sequence';

/** Uppercase A-Z only; anything else in a name (spaces, hyphens, accents) is dropped. */
function lettersOf(name: string): string[] {
  return name
    .toUpperCase()
    .split('')
    .filter((c) => c >= 'A' && c <= 'Z');
}

export function buildLetterSequence(childName: string, familyNames: readonly string[] = []): string[] {
  const seen = new Set<string>();
  const order: string[] = [];

  const push = (letter: string) => {
    if (!seen.has(letter)) {
      seen.add(letter);
      order.push(letter);
    }
  };

  for (const letter of lettersOf(childName)) push(letter);
  for (const name of familyNames) {
    const first = lettersOf(name)[0];
    if (first) push(first);
  }
  for (const letter of DEFAULT_ORDER) push(letter);
  // Guard against a default order that ever loses a letter.
  for (const letter of ALPHABET) push(letter);

  return order;
}

/**
 * The letters shown in the Letter Garden. Phase 1 has no progress data, so the
 * active set is simply the child's name letters, capped at the same 7 as the
 * real scheduler (SPEC 5.3). Phase 4 replaces this with the scheduler.
 */
export const ACTIVE_SET_MAX = 7;

export function provisionalActiveSet(childName: string, familyNames: readonly string[] = []): string[] {
  return buildLetterSequence(childName, familyNames).slice(0, ACTIVE_SET_MAX);
}
