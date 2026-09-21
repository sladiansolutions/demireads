import { describe, expect, it } from 'vitest';
import {
  begin,
  elapsedMs,
  expire,
  hasStarted,
  isOver,
  minutesToMs,
  newSession,
  pause,
  remainingMs,
  reset,
  resume,
} from './sessionTimer';

const LIMIT = minutesToMs(10);

describe('before the first interaction', () => {
  it('has not started and is not over, however long the app sits open', () => {
    const state = newSession();
    expect(hasStarted(state)).toBe(false);
    expect(elapsedMs(state, 999_999)).toBe(0);
    expect(isOver(state, 999_999, LIMIT)).toBe(false);
  });

  it('ignores resume, so opening and closing the app does not start it', () => {
    expect(resume(newSession(), 500)).toEqual(newSession());
  });
});

describe('counting', () => {
  it('starts on the first interaction', () => {
    const state = begin(newSession(), 1000);
    expect(hasStarted(state)).toBe(true);
    expect(elapsedMs(state, 4000)).toBe(3000);
  });

  it('ignores later interactions rather than restarting', () => {
    const first = begin(newSession(), 1000);
    const again = begin(first, 5000);
    expect(again).toBe(first);
    expect(elapsedMs(again, 6000)).toBe(5000);
  });

  it('counts only while visible', () => {
    let state = begin(newSession(), 0);
    state = pause(state, 60_000); // one minute used, then backgrounded
    state = resume(state, 600_000); // nine minutes later
    expect(elapsedMs(state, 600_000)).toBe(60_000);
    expect(elapsedMs(state, 660_000)).toBe(120_000);
  });

  it('survives several visibility changes', () => {
    let state = begin(newSession(), 0);
    // Visible 0-10s, then 20s in each of four later stretches, then 10s more.
    for (let i = 0; i < 5; i += 1) {
      state = pause(state, i * 100_000 + 10_000);
      state = resume(state, i * 100_000 + 90_000);
    }
    state = pause(state, 500_000);
    expect(elapsedMs(state, 900_000)).toBe(100_000);
  });

  it('treats a pause while already paused as a no-op', () => {
    const paused = pause(begin(newSession(), 0), 1000);
    expect(pause(paused, 5000)).toBe(paused);
  });

  it('never counts backwards if a clock jumps', () => {
    const state = begin(newSession(), 10_000);
    expect(elapsedMs(state, 5000)).toBe(0);
  });
});

describe('the limit', () => {
  it('is not over before the limit', () => {
    const state = begin(newSession(), 0);
    expect(isOver(state, LIMIT - 1, LIMIT)).toBe(false);
    expect(remainingMs(state, LIMIT - 1000, LIMIT)).toBe(1000);
  });

  it('is over exactly at the limit', () => {
    const state = begin(newSession(), 0);
    expect(isOver(state, LIMIT, LIMIT)).toBe(true);
    expect(remainingMs(state, LIMIT, LIMIT)).toBe(0);
  });

  it('stays over once expired, even if the app is reopened later', () => {
    const state = expire(begin(newSession(), 0), LIMIT);
    expect(isOver(state, LIMIT + 60_000, LIMIT)).toBe(true);
    expect(resume(state, LIMIT + 60_000)).toBe(state);
  });

  it('freezes the clock when it expires', () => {
    const state = expire(begin(newSession(), 0), LIMIT);
    expect(elapsedMs(state, LIMIT + 999_999)).toBe(LIMIT);
  });

  it('honours a shorter limit from settings', () => {
    const five = minutesToMs(5);
    const state = begin(newSession(), 0);
    expect(isOver(state, five, five)).toBe(true);
    expect(isOver(state, five, minutesToMs(20))).toBe(false);
  });
});

describe('reset', () => {
  it('gives a fresh session waiting for the next first tap', () => {
    const state = reset();
    expect(hasStarted(state)).toBe(false);
    expect(isOver(state, 999_999, LIMIT)).toBe(false);
  });
});
