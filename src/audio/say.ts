/**
 * What the app says, as opposed to how it says it.
 *
 * Phase 1 always ends up at speech synthesis. Phase 2 adds the earlier steps
 * of the SPEC 7 priority list (parent recording, then bundled clip) inside
 * these functions, so screens never have to know which source played.
 */

import { letterContent } from '../content/letters';
import { speak } from './speech';

/** Letter Garden tap: "B. B says buh. Ball." (SPEC 3.2) */
export function sayLetter(letter: string, exampleWord?: string): void {
  const { letter: L, soundSpoken, words } = letterContent(letter);
  const word = exampleWord ?? words[0];
  speak(`${L}. ${L} says ${soundSpoken}. ${word}.`);
}

/** Family Book page: "S is for Sebastian." (SPEC 3.3) */
export function sayBookPage(letter: string, word: string): void {
  speak(`${letter.toUpperCase()} is for ${word}.`);
}

export function sayWord(word: string): void {
  speak(word);
}
