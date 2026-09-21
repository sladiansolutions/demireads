/**
 * Which two words illustrate a letter, in priority order:
 *   1. a word the parent typed for that letter,
 *   2. the child's own name, then a family name, on its initial,
 *   3. the two bundled defaults.
 *
 * The second slot always keeps a bundled default, so there is still something
 * to look at before any photos are added.
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

export function exampleWordsFor(
  letter: string,
  childName = '',
  familyNames: readonly string[] = [],
  letterWords: Record<string, string> = {},
): [string, string] {
  const { letter: L, words } = letterContent(letter);

  const chosen = letterWords[L]?.trim();
  if (chosen !== undefined && chosen.length > 0) return [chosen, words[0]];

  const personal = [childName, ...familyNames].find((name) => initial(name) === L);
  if (personal) return [capitalize(personal), words[0]];

  return [words[0], words[1]];
}

/** The single word used on a Family Book page: "S is for Sebastian". */
export function bookWordFor(
  letter: string,
  childName = '',
  familyNames: readonly string[] = [],
  letterWords: Record<string, string> = {},
): string {
  return exampleWordsFor(letter, childName, familyNames, letterWords)[0];
}
