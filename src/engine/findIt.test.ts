import { describe, expect, it } from 'vitest';
import {
  candidateTargets,
  choiceCount,
  distractorPool,
  nextRound,
  pickChoices,
  pickTarget,
  similarTo,
  TARGET_WEIGHTS,
} from './findIt';
import { emptyProgress, type Progress } from './scheduler';
import { SIMILAR_PAIRS } from '../content/sequence';
import type { LetterState } from '../storage/db';

const TODAY = '2026-09-21';

function withStates(states: Record<string, LetterState>): Progress {
  const progress = emptyProgress(TODAY);
  for (const [letter, state] of Object.entries(states)) {
    progress[letter] = { ...progress[letter]!, state };
  }
  return progress;
}

/** A random source that walks a fixed list, so picks are deterministic. */
function sequenceOf(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length] as number;
}

describe('choiceCount', () => {
  it('starts at two', () => {
    expect(choiceCount(withStates({ S: 1, B: 2 }))).toBe(2);
  });

  it('becomes three as soon as three letters can be asked about', () => {
    expect(choiceCount(withStates({ S: 1, B: 1 }))).toBe(2);
    expect(choiceCount(withStates({ S: 1, B: 1, T: 1 }))).toBe(3);
  });

  it('becomes four once ten letters are known', () => {
    const states: Record<string, LetterState> = {};
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) states[letter] = 3;
    expect(choiceCount(withStates(states))).toBe(3);
    states.J = 3;
    expect(choiceCount(withStates(states))).toBe(4);
  });

  it('reaches four only on ten known, not on ten being learned', () => {
    const learning: Record<string, LetterState> = {};
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) learning[letter] = 2;
    expect(choiceCount(withStates(learning))).toBe(3);

    const known: Record<string, LetterState> = {};
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) known[letter] = 3;
    expect(choiceCount(withStates(known))).toBe(4);
  });
});

describe('candidateTargets', () => {
  it('includes Knows it letters, so they come back as review', () => {
    expect(candidateTargets(withStates({ S: 1, B: 2, T: 3 }))).toEqual(['B', 'S', 'T']);
  });

  it('excludes letters that have not been started', () => {
    expect(candidateTargets(withStates({ S: 1 }))).toEqual(['S']);
  });

  it('is empty before anything is introduced', () => {
    expect(candidateTargets(emptyProgress(TODAY))).toEqual([]);
  });
});

describe('pickTarget', () => {
  it('returns nothing when no letter has been introduced', () => {
    expect(pickTarget(emptyProgress(TODAY), null, () => 0)).toBeUndefined();
  });

  it('never repeats the previous target', () => {
    const progress = withStates({ S: 1, B: 1, T: 1 });
    for (let i = 0; i < 50; i += 1) {
      expect(pickTarget(progress, 'B', () => i / 50)).not.toBe('B');
    }
  });

  it('repeats only when it is the only letter available', () => {
    const progress = withStates({ S: 1 });
    expect(pickTarget(progress, 'S', () => 0.5)).toBe('S');
  });

  it('weights New above Learning above Knows it', () => {
    // Pool B(1) weight 3, S(2) weight 2, T(3) weight 1, total 6.
    const progress = withStates({ B: 1, S: 2, T: 3 });
    expect(pickTarget(progress, null, () => 0)).toBe('B');
    expect(pickTarget(progress, null, () => 0.49)).toBe('B');
    expect(pickTarget(progress, null, () => 0.51)).toBe('S');
    expect(pickTarget(progress, null, () => 0.83)).toBe('S');
    expect(pickTarget(progress, null, () => 0.9)).toBe('T');
  });

  it('cannot fall off the end when random returns one', () => {
    const progress = withStates({ B: 1, S: 2, T: 3 });
    expect(progress).toBeDefined();
    expect(pickTarget(progress, null, () => 1)).toBe('T');
  });

  it('reaches every letter over many draws', () => {
    const progress = withStates({ S: 1, B: 2, T: 3 });
    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) seen.add(pickTarget(progress, null, Math.random) as string);
    expect([...seen].sort()).toEqual(['B', 'S', 'T']);
  });

  it('uses the documented weights', () => {
    expect(TARGET_WEIGHTS).toEqual({ 1: 3, 2: 2, 3: 1 });
  });
});

describe('similarTo', () => {
  it('works in both directions of each pair', () => {
    expect(similarTo('E')).toContain('F');
    expect(similarTo('F')).toContain('E');
    expect(similarTo('M').sort()).toEqual(['N', 'W']);
  });

  it('is empty for a letter in no pair', () => {
    expect(similarTo('K')).toEqual([]);
  });
});

describe('distractorPool', () => {
  it('excludes visually similar letters while the target is still being learned', () => {
    for (const state of [1, 2] as LetterState[]) {
      const pool = distractorPool(withStates({ B: state }), 'B');
      expect(pool).not.toContain('P');
      expect(pool).not.toContain('B');
      expect(pool).toContain('S');
    }
  });

  it('allows a similar distractor once the target is known', () => {
    expect(distractorPool(withStates({ B: 3 }), 'B')).toContain('P');
  });

  it('leaves every similar pair apart at the easy levels', () => {
    for (const [a, b] of SIMILAR_PAIRS) {
      expect(distractorPool(withStates({ [a]: 1 }), a)).not.toContain(b);
      expect(distractorPool(withStates({ [b]: 1 }), b)).not.toContain(a);
    }
  });

  it('never includes the target itself', () => {
    expect(distractorPool(withStates({ M: 3 }), 'M')).not.toContain('M');
  });
});

describe('pickChoices', () => {
  it('always includes the target', () => {
    const progress = withStates({ B: 1, S: 2 });
    for (let i = 0; i < 40; i += 1) {
      expect(pickChoices(progress, 'B', 3, Math.random)).toContain('B');
    }
  });

  it('returns exactly as many choices as asked for, with no duplicates', () => {
    const progress = withStates({ B: 1 });
    for (const count of [2, 3, 4] as const) {
      const choices = pickChoices(progress, 'B', count, Math.random);
      expect(choices).toHaveLength(count);
      expect(new Set(choices).size).toBe(count);
    }
  });

  it('does not always put the target in the same place', () => {
    const progress = withStates({ B: 1 });
    const positions = new Set<number>();
    for (let i = 0; i < 60; i += 1) {
      positions.add(pickChoices(progress, 'B', 2, Math.random).indexOf('B'));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('keeps similar letters out of an easy round', () => {
    const progress = withStates({ B: 1 });
    for (let i = 0; i < 60; i += 1) {
      expect(pickChoices(progress, 'B', 4, Math.random)).not.toContain('P');
    }
  });
});

describe('nextRound', () => {
  it('produces a target and its choices together', () => {
    const progress = withStates({ S: 1, B: 2, T: 3 });
    const round = nextRound(progress, null, sequenceOf([0.1, 0.4, 0.8, 0.2]));
    expect(round).toBeDefined();
    expect(round?.choices).toContain(round?.target);
    expect(round?.choices).toHaveLength(3);
  });

  it('rotates the colour start, so consecutive rounds do not look alike', () => {
    const progress = withStates({ S: 1, B: 2, T: 3 });
    const seen = new Set<number>();
    for (let i = 0; i < 80; i += 1) {
      const round = nextRound(progress, null, Math.random);
      if (round) seen.add(round.palette);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('keeps the palette inside the four-colour cycle', () => {
    for (const r of [() => 0, () => 0.5, () => 1]) {
      const round = nextRound(withStates({ S: 1, B: 1, T: 1 }), null, r);
      expect(round?.palette).toBeGreaterThanOrEqual(0);
      expect(round?.palette).toBeLessThanOrEqual(3);
    }
  });

  it('gives nothing to ask before any letter is introduced', () => {
    expect(nextRound(emptyProgress(TODAY), null, Math.random)).toBeUndefined();
  });

  it('scales the round to what is known', () => {
    const states: Record<string, LetterState> = { S: 1 };
    for (const letter of ['A', 'B', 'C', 'D', 'E']) states[letter] = 3;
    expect(nextRound(withStates(states), null, Math.random)?.choices).toHaveLength(3);

    for (const letter of ['F', 'G', 'H', 'I', 'J']) states[letter] = 3;
    expect(nextRound(withStates(states), null, Math.random)?.choices).toHaveLength(4);
  });
});
