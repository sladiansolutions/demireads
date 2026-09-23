import { describe, expect, it } from 'vitest';
import { LETTERS } from './letters';
import { illustrationFor, ILLUSTRATED_WORDS } from './illustrations';

/**
 * Deliberate gaps: nothing reads clearly as these at this size. All three are
 * second example words, so every letter has a picture for its own word.
 */
const NO_ILLUSTRATION = ['jam', 'quilt', 'zip'];

describe('illustrations', () => {
  it('covers every example word except the known gaps', () => {
    const missing = LETTERS.flatMap((l) => l.words).filter((word) => illustrationFor(word) === undefined);
    expect(missing.sort()).toEqual([...NO_ILLUSTRATION].sort());
  });

  it('keeps extra pictures as a library for words a parent types', () => {
    // Words dropped as his own vocabulary took over — duck, train, milk and
    // the rest — are deliberately still here. illustrationFor() finds them,
    // so typing "train" under T in the parent area gets a picture for free.
    const used = new Set(LETTERS.flatMap((l) => l.words.map((w) => w.toLowerCase())));
    const spare = ILLUSTRATED_WORDS.filter((word) => !used.has(word));
    for (const word of spare) expect(illustrationFor(word)).toBeDefined();
  });

  it('names every file after a plain lowercase word', () => {
    for (const word of ILLUSTRATED_WORDS) expect(word).toMatch(/^[a-z-]+$/);
  });

  it('resolves to a bundled asset, never a remote URL', () => {
    for (const word of ILLUSTRATED_WORDS) {
      const src = illustrationFor(word);
      expect(src).toBeDefined();
      expect(src).not.toMatch(/^https?:/);
    }
  });

  it('is case-insensitive, so "Apple" and "apple" both resolve', () => {
    expect(illustrationFor('Apple')).toBe(illustrationFor('apple'));
  });

  it("returns nothing for a family name, leaving room for the parent's photo", () => {
    expect(illustrationFor('Sebastian')).toBeUndefined();
  });
});
