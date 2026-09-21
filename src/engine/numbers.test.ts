import { describe, expect, it } from 'vitest';
import {
  dayKey,
  daysPractised,
  newNumberProgress,
  nextMax,
  pickCount,
  recordRound,
  shouldExpand,
  totalRounds,
  type NumberProgressState,
} from './numbers';

describe('the starting range', () => {
  it('is 1 to 3', () => {
    expect(newNumberProgress().currentMax).toBe(3);
  });
});

describe('expanding the range', () => {
  it('needs five rounds, so four across two days is not enough', () => {
    let state = newNumberProgress();
    state = recordRound(state, '2026-09-21');
    state = recordRound(state, '2026-09-21');
    state = recordRound(state, '2026-09-22');
    state = recordRound(state, '2026-09-22');
    expect(totalRounds(state)).toBe(4);
    expect(shouldExpand(state)).toBe(false);
    expect(state.currentMax).toBe(3);
  });

  it('needs two days, so five rounds in one evening is not enough', () => {
    let state = newNumberProgress();
    for (let i = 0; i < 5; i += 1) state = recordRound(state, '2026-09-21');
    expect(totalRounds(state)).toBe(5);
    expect(daysPractised(state)).toBe(1);
    expect(state.currentMax).toBe(3);
  });

  it('expands to 1 to 5 on the fifth round across two days', () => {
    let state = newNumberProgress();
    for (let i = 0; i < 4; i += 1) state = recordRound(state, '2026-09-21');
    expect(state.currentMax).toBe(3);
    state = recordRound(state, '2026-09-22');
    expect(state.currentMax).toBe(5);
  });

  it('resets the counters when the range grows', () => {
    let state = newNumberProgress();
    for (let i = 0; i < 4; i += 1) state = recordRound(state, '2026-09-21');
    state = recordRound(state, '2026-09-22');
    expect(state.roundsAtMaxByDay).toEqual({});
    expect(totalRounds(state)).toBe(0);
  });

  it('expands again to 1 to 10 by the same rule', () => {
    let state: NumberProgressState = { currentMax: 5, roundsAtMaxByDay: {} };
    for (let i = 0; i < 4; i += 1) state = recordRound(state, '2026-10-01');
    expect(state.currentMax).toBe(5);
    state = recordRound(state, '2026-10-02');
    expect(state.currentMax).toBe(10);
  });

  it('stops at 1 to 10 and never grows further', () => {
    let state: NumberProgressState = { currentMax: 10, roundsAtMaxByDay: {} };
    for (let i = 0; i < 20; i += 1) state = recordRound(state, `2026-11-${(i % 28) + 1}`);
    expect(state.currentMax).toBe(10);
    expect(shouldExpand(state)).toBe(false);
    expect(nextMax(10)).toBe(10);
  });
});

describe('pickCount', () => {
  it('stays inside the range', () => {
    for (let i = 0; i < 100; i += 1) {
      const n = pickCount(3, null);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('never repeats the previous number', () => {
    for (let i = 0; i < 200; i += 1) expect(pickCount(3, 2)).not.toBe(2);
  });

  it('can still reach every other number in the range', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 300; i += 1) seen.add(pickCount(5, 3));
    expect([...seen].sort()).toEqual([1, 2, 4, 5]);
  });

  it('is uniform over the choices, given a uniform source', () => {
    // random() of 0 picks the first choice, just under 1 picks the last.
    expect(pickCount(3, 1, () => 0)).toBe(2);
    expect(pickCount(3, 1, () => 0.999)).toBe(3);
  });

  it('cannot fall off the end when random() returns exactly 1', () => {
    expect(pickCount(3, null, () => 1)).toBe(3);
  });
});

describe('dayKey', () => {
  it('is a zero-padded calendar date', () => {
    expect(dayKey(new Date(2026, 8, 7))).toBe('2026-09-07');
  });

  it('uses local dates, so an evening session is not filed as tomorrow', () => {
    expect(dayKey(new Date(2026, 0, 1, 23, 30))).toBe('2026-01-01');
  });
});
