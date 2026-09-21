import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CAP,
  activeSet,
  bootstrap,
  canIntroduce,
  emptyProgress,
  introduce,
  introducedOn,
  knownLetters,
  lettersInState,
  nextToIntroduce,
  override,
  qualifyingDays,
  readyToPromote,
  recordAnswer,
  startSession,
  type Progress,
} from './scheduler';
import { buildLetterSequence } from './letterSequence';
import type { LetterState } from '../storage/db';

const TODAY = '2026-09-21';
const TOMORROW = '2026-09-22';
const LATER = '2026-09-25';
const SEQUENCE = buildLetterSequence('Sebastian');

/** Build a progress map with the given letters in the given states. */
function withStates(states: Record<string, LetterState>, day = TODAY): Progress {
  const progress = emptyProgress(day);
  for (const [letter, state] of Object.entries(states)) {
    progress[letter] = {
      ...progress[letter]!,
      state,
      ...(state > 0 ? { introducedOn: '2026-01-01' } : {}),
    };
  }
  return progress;
}

describe('activeSet', () => {
  it('is empty on a fresh install, before anything is introduced', () => {
    expect(activeSet(emptyProgress(TODAY), SEQUENCE)).toEqual([]);
  });

  it('holds letters in New and Learning, in sequence order', () => {
    const progress = withStates({ B: 1, S: 2, T: 1 });
    // Sequence for Sebastian is S, E, B, A, T, I, N, ...
    expect(activeSet(progress, SEQUENCE)).toEqual(['S', 'B', 'T']);
  });

  it('leaves out Not started and Knows it', () => {
    const progress = withStates({ S: 3, E: 0, B: 1 });
    expect(activeSet(progress, SEQUENCE)).toEqual(['B']);
  });

  it('never exceeds the cap of seven', () => {
    const states: Record<string, LetterState> = {};
    for (const letter of SEQUENCE.slice(0, 12)) states[letter] = 1;
    const active = activeSet(withStates(states), SEQUENCE);
    expect(active).toHaveLength(ACTIVE_CAP);
    expect(active).toEqual(SEQUENCE.slice(0, ACTIVE_CAP));
  });
});

describe('knownLetters and lettersInState', () => {
  it('reports letters that have reached Knows it', () => {
    const progress = withStates({ S: 3, B: 3, T: 2 });
    expect(knownLetters(progress).sort()).toEqual(['B', 'S']);
    expect(lettersInState(progress, 2)).toEqual(['T']);
    expect(lettersInState(progress, 1)).toEqual([]);
  });
});

describe('introducing a letter', () => {
  it('introduces the next letter of the sequence', () => {
    const progress = introduce(emptyProgress(TODAY), SEQUENCE, TODAY);
    expect(progress.S?.state).toBe(1);
    expect(progress.S?.introducedOn).toBe(TODAY);
    expect(activeSet(progress, SEQUENCE)).toEqual(['S']);
  });

  it('introduces at most one letter per day', () => {
    const first = introduce(emptyProgress(TODAY), SEQUENCE, TODAY);
    const second = introduce(first, SEQUENCE, TODAY);
    expect(second).toBe(first);
    expect(activeSet(second, SEQUENCE)).toEqual(['S']);
  });

  it('allows the next letter the following day', () => {
    const first = introduce(emptyProgress(TODAY), SEQUENCE, TODAY);
    const second = introduce(first, SEQUENCE, TOMORROW);
    expect(activeSet(second, SEQUENCE)).toEqual(['S', 'E']);
  });

  it('will not introduce while the active set is full of New letters', () => {
    const states: Record<string, LetterState> = {};
    for (const letter of SEQUENCE.slice(0, ACTIVE_CAP)) states[letter] = 1;
    expect(canIntroduce(withStates(states), SEQUENCE, TODAY)).toBe(false);
  });

  it('introduces once 70 percent are Learning and at most 2 are New', () => {
    // Five Learning, two New out of seven: 71 percent, two New.
    const states: Record<string, LetterState> = {};
    SEQUENCE.slice(0, 5).forEach((letter) => (states[letter] = 2));
    SEQUENCE.slice(5, 7).forEach((letter) => (states[letter] = 1));
    expect(canIntroduce(withStates(states), SEQUENCE, TODAY)).toBe(true);
  });

  it('holds back when three of the active set are still New', () => {
    // Four Learning, three New: 57 percent, and three New.
    const states: Record<string, LetterState> = {};
    SEQUENCE.slice(0, 4).forEach((letter) => (states[letter] = 2));
    SEQUENCE.slice(4, 7).forEach((letter) => (states[letter] = 1));
    expect(canIntroduce(withStates(states), SEQUENCE, TODAY)).toBe(false);
  });

  it('counts Knows it letters as out of the way, freeing a slot', () => {
    const states: Record<string, LetterState> = {};
    SEQUENCE.slice(0, 3).forEach((letter) => (states[letter] = 3));
    SEQUENCE.slice(3, 7).forEach((letter) => (states[letter] = 1));
    // Only four are active, so there is room regardless of the ratio rule.
    expect(canIntroduce(withStates(states), SEQUENCE, TODAY)).toBe(true);
  });

  it('stops when every letter has been started', () => {
    const states: Record<string, LetterState> = {};
    for (const letter of SEQUENCE) states[letter] = 3;
    const progress = withStates(states);
    expect(nextToIntroduce(progress, SEQUENCE)).toBeUndefined();
    expect(canIntroduce(progress, SEQUENCE, TODAY)).toBe(false);
    expect(introduce(progress, SEQUENCE, TODAY)).toBe(progress);
  });

  it('tracks which letters arrived today', () => {
    const progress = introduce(emptyProgress(TODAY), SEQUENCE, TODAY);
    expect(introducedOn(progress, TODAY)).toEqual(['S']);
    expect(introducedOn(progress, TOMORROW)).toEqual([]);
  });
});

describe('bootstrap', () => {
  it('seeds the name letters on a fresh install', () => {
    const progress = bootstrap(emptyProgress(TODAY), SEQUENCE, TODAY);
    expect(activeSet(progress, SEQUENCE)).toEqual(['S', 'E', 'B', 'A', 'T', 'I', 'N']);
  });

  it('never seeds more than the cap', () => {
    const progress = bootstrap(emptyProgress(TODAY), SEQUENCE, TODAY, 20);
    expect(activeSet(progress, SEQUENCE)).toHaveLength(ACTIVE_CAP);
  });

  it('does nothing once anything has been started', () => {
    const started = withStates({ S: 2 });
    expect(bootstrap(started, SEQUENCE, TODAY)).toBe(started);
  });

  it('does nothing on a tablet where a letter was introduced and then reset', () => {
    const progress = emptyProgress(TODAY);
    progress.S = { ...progress.S!, introducedOn: TODAY };
    expect(bootstrap(progress, SEQUENCE, TODAY)).toBe(progress);
  });
});

describe('promotion', () => {
  it('needs two correct answers on each of two days', () => {
    let progress = withStates({ B: 1 });
    progress = recordAnswer(progress, 'B', true, TODAY);
    expect(progress.B?.state).toBe(1);
    progress = recordAnswer(progress, 'B', true, TODAY);
    expect(qualifyingDays(progress.B!)).toBe(1);
    expect(progress.B?.state).toBe(1);

    progress = recordAnswer(progress, 'B', true, TOMORROW);
    expect(progress.B?.state).toBe(1);
    progress = recordAnswer(progress, 'B', true, TOMORROW);
    expect(progress.B?.state).toBe(2);
  });

  it('does not promote on four correct answers in one day', () => {
    let progress = withStates({ B: 1 });
    for (let i = 0; i < 4; i += 1) progress = recordAnswer(progress, 'B', true, TODAY);
    expect(progress.B?.state).toBe(1);
    expect(progress.B?.correctByDay[TODAY]).toBe(4);
  });

  it('does not promote on one correct answer across many days', () => {
    let progress = withStates({ B: 1 });
    for (const day of ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']) {
      progress = recordAnswer(progress, 'B', true, day);
    }
    expect(progress.B?.state).toBe(1);
    expect(readyToPromote(progress.B!)).toBe(false);
  });

  it('clears the evidence on promotion, so the next state starts fresh', () => {
    let progress = withStates({ B: 1 });
    for (const day of [TODAY, TODAY, TOMORROW, TOMORROW]) {
      progress = recordAnswer(progress, 'B', true, day);
    }
    expect(progress.B?.state).toBe(2);
    expect(progress.B?.correctByDay).toEqual({});
    expect(progress.B?.lastStateChange).toBe(TOMORROW);
  });

  it('carries a letter all the way to Knows it, one state at a time', () => {
    let progress = withStates({ B: 1 });
    for (const day of [TODAY, TODAY, TOMORROW, TOMORROW]) {
      progress = recordAnswer(progress, 'B', true, day);
    }
    expect(progress.B?.state).toBe(2);
    for (const day of [LATER, LATER, '2026-09-26', '2026-09-26']) {
      progress = recordAnswer(progress, 'B', true, day);
    }
    expect(progress.B?.state).toBe(3);
  });

  it('never goes past Knows it', () => {
    let progress = withStates({ B: 3 });
    for (const day of [TODAY, TODAY, TOMORROW, TOMORROW]) {
      progress = recordAnswer(progress, 'B', true, day);
    }
    expect(progress.B?.state).toBe(3);
  });
});

describe('demotion', () => {
  it('needs two wrong answers in one session', () => {
    let progress = withStates({ B: 2 });
    progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.B?.state).toBe(2);
    expect(progress.B?.sessionMisses).toBe(1);

    progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.B?.state).toBe(1);
  });

  it('never drops below New', () => {
    let progress = withStates({ B: 1 });
    for (let i = 0; i < 6; i += 1) progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.B?.state).toBe(1);
  });

  it('forgets misses when a new session starts, so they must be in one sitting', () => {
    let progress = withStates({ B: 2 });
    progress = recordAnswer(progress, 'B', false, TODAY);
    progress = startSession(progress);
    expect(progress.B?.sessionMisses).toBe(0);
    progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.B?.state).toBe(2);
  });

  it('clears the evidence on demotion', () => {
    let progress = withStates({ B: 3 });
    progress = recordAnswer(progress, 'B', true, TODAY);
    progress = recordAnswer(progress, 'B', false, TODAY);
    progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.B?.state).toBe(2);
    expect(progress.B?.correctByDay).toEqual({});
    expect(progress.B?.sessionMisses).toBe(0);
  });

  it('leaves other letters untouched', () => {
    let progress = withStates({ B: 2, S: 2 });
    progress = recordAnswer(progress, 'B', false, TODAY);
    progress = recordAnswer(progress, 'B', false, TODAY);
    expect(progress.S?.state).toBe(2);
    expect(progress.S?.sessionMisses).toBe(0);
  });
});

describe('startSession', () => {
  it('returns the same records when there is nothing to clear', () => {
    const progress = withStates({ B: 2 });
    expect(startSession(progress).B).toBe(progress.B);
  });
});

describe('parent override', () => {
  it('sets the state directly, whatever the evidence says', () => {
    let progress = withStates({ B: 1 });
    progress = recordAnswer(progress, 'B', true, TODAY);
    progress = override(progress, 'B', 3, LATER);
    expect(progress.B?.state).toBe(3);
  });

  it('resets that letter’s counters', () => {
    let progress = withStates({ B: 2 });
    progress = recordAnswer(progress, 'B', true, TODAY);
    progress = recordAnswer(progress, 'B', false, TODAY);
    progress = override(progress, 'B', 1, LATER);
    expect(progress.B?.correctByDay).toEqual({});
    expect(progress.B?.sessionMisses).toBe(0);
    expect(progress.B?.lastStateChange).toBe(LATER);
  });

  it('can put a letter back to Not started, and it can be introduced again', () => {
    let progress = withStates({ S: 2 });
    progress = override(progress, 'S', 0, LATER);
    expect(progress.S?.state).toBe(0);
    expect(progress.S?.introducedOn).toBeUndefined();
    expect(nextToIntroduce(progress, SEQUENCE)).toBe('S');
    expect(canIntroduce(progress, SEQUENCE, LATER)).toBe(true);
  });

  it('does not count against the one-new-letter-per-day limit', () => {
    // A parent tidying up several letters at once should not be blocked.
    let progress = emptyProgress(TODAY);
    progress = override(progress, 'S', 2, TODAY);
    progress = override(progress, 'E', 2, TODAY);
    progress = override(progress, 'B', 3, TODAY);
    expect(progress.S?.state).toBe(2);
    expect(progress.E?.state).toBe(2);
    expect(progress.B?.state).toBe(3);
  });
});
