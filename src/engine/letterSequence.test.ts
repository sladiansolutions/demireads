import { describe, expect, it } from 'vitest';
import { ALPHABET } from '../content/letters';
import { DEFAULT_ORDER, SIMILAR_PAIRS } from '../content/sequence';
import { ACTIVE_SET_MAX, buildLetterSequence, provisionalActiveSet } from './letterSequence';

describe('DEFAULT_ORDER', () => {
  it('contains all 26 letters exactly once', () => {
    expect([...DEFAULT_ORDER].sort()).toEqual([...ALPHABET].sort());
  });

  it('ends with Q, X, Z', () => {
    expect(DEFAULT_ORDER.slice(-3)).toEqual(['Q', 'X', 'Z']);
  });

  it('never places a visually similar pair next to each other', () => {
    const adjacent = DEFAULT_ORDER.slice(0, -1).map((l, i) => `${l}${DEFAULT_ORDER[i + 1]}`);
    for (const [a, b] of SIMILAR_PAIRS) {
      expect(adjacent).not.toContain(`${a}${b}`);
      expect(adjacent).not.toContain(`${b}${a}`);
    }
  });
});

describe('buildLetterSequence', () => {
  it('starts with the distinct letters of the name, in order of first appearance', () => {
    expect(buildLetterSequence('Sebastian').slice(0, 7)).toEqual(['S', 'E', 'B', 'A', 'T', 'I', 'N']);
  });

  it('puts family name initials after the name letters, skipping duplicates', () => {
    const seq = buildLetterSequence('Sebastian', ['Mummy', 'Daddy', 'Sadie', 'Grandma']);
    expect(seq.slice(0, 10)).toEqual(['S', 'E', 'B', 'A', 'T', 'I', 'N', 'M', 'D', 'G']);
  });

  it('ignores spaces, hyphens and case in names', () => {
    expect(buildLetterSequence('jo-anne mae').slice(0, 6)).toEqual(['J', 'O', 'A', 'N', 'E', 'M']);
  });

  it('returns all 26 letters exactly once, whatever the name', () => {
    for (const name of ['Sebastian', '', 'Zzz', 'Quinn', '  ']) {
      const seq = buildLetterSequence(name, ['Émile', '123']);
      expect(seq).toHaveLength(26);
      expect([...seq].sort()).toEqual([...ALPHABET].sort());
    }
  });

  it('falls back to the default order when the name gives nothing', () => {
    expect(buildLetterSequence('')).toEqual([...DEFAULT_ORDER]);
  });
});

describe('provisionalActiveSet', () => {
  it('is the name letters, capped at 7', () => {
    expect(provisionalActiveSet('Sebastian')).toEqual(['S', 'E', 'B', 'A', 'T', 'I', 'N']);
  });

  it('never exceeds the cap, even for a long name', () => {
    const set = provisionalActiveSet('Wolfgang Amadeus');
    expect(set).toHaveLength(ACTIVE_SET_MAX);
  });

  it('tops up from the sequence for a short name', () => {
    const set = provisionalActiveSet('Bo');
    expect(set.slice(0, 2)).toEqual(['B', 'O']);
    expect(set).toHaveLength(ACTIVE_SET_MAX);
    expect(new Set(set).size).toBe(ACTIVE_SET_MAX);
  });
});
