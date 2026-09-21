/**
 * Which two words illustrate a letter. The child's own name wins on its first
 * letter, which is why the mockup shows "S: Sebastian, sun". Phase 2 lets a
 * parent attach a photo and label per letter, which will take priority here.
 */

import { letterContent } from '../content/letters';

function capitalize(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed[0]!.toUpperCase() + trimmed.slice(1);
}

function initial(name: string): string | undefined {
  const match = name.toUpperCase().match(/[A-Z]/);
  return match?.[0];
}

export function exampleWordsFor(letter: string, childName = '', familyNames: readonly string[] = []): [string, string] {
  const { letter: L, words } = letterContent(letter);
  const personal = [childName, ...familyNames].find((name) => initial(name) === L);
  if (personal) return [capitalize(personal), words[0]];
  return [words[0], words[1]];
}

/** The single word used on a Family Book page: "S is for Sebastian". */
export function bookWordFor(letter: string, childName = '', familyNames: readonly string[] = []): string {
  return exampleWordsFor(letter, childName, familyNames)[0];
}
