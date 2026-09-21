/**
 * Default order in which letters enter the active set, once the child's name
 * and family names are used up (SPEC 5.2 step 3).
 *
 * Two constraints, both checked by the tests next to letterSequence.ts:
 * visually similar pairs are never adjacent, and Q, X, Z come last.
 * Beyond that it front-loads common, easy-to-say consonants and vowels.
 */
export const DEFAULT_ORDER: readonly string[] = [
  'A', 'M', 'S', 'T', 'O', 'B', 'C', 'H', 'I', 'N',
  'P', 'E', 'G', 'R', 'D', 'F', 'L', 'K', 'U', 'W',
  'J', 'Y', 'V', 'Q', 'X', 'Z',
];

/** Pairs a two-year-old confuses by shape. Used here to keep them apart in the
 *  sequence, and in phase 4 to pick Find It distractors (SPEC 5.4). */
export const SIMILAR_PAIRS: readonly [string, string][] = [
  ['E', 'F'],
  ['P', 'R'],
  ['B', 'P'],
  ['O', 'Q'],
  ['C', 'G'],
  ['M', 'N'],
  ['M', 'W'],
  ['V', 'W'],
  ['I', 'L'],
  ['U', 'V'],
];
