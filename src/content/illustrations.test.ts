import { describe, expect, it } from 'vitest';
import { LETTERS } from './letters';
import { illustrationFor, ILLUSTRATED_WORDS } from './illustrations';

/** Deliberate gaps: no icon in the set reads as these words at age two. */
const NO_ILLUSTRATION = ['igloo', 'jam', 'jug', 'quilt', 'zip'];

describe('illustrations', () => {
  it('covers every example word except the known gaps', () => {
    const missing = LETTERS.flatMap((l) => l.words).filter((word) => illustrationFor(word) === undefined);
    expect(missing.sort()).toEqual([...NO_ILLUSTRATION].sort());
  });

  it('has no unused files', () => {
    const used = new Set(LETTERS.flatMap((l) => l.words.map((w) => w.toLowerCase())));
    expect(ILLUSTRATED_WORDS.filter((word) => !used.has(word))).toEqual([]);
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
