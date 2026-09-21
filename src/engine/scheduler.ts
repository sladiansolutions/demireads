/**
 * Letter scheduler (SPEC 5.3). Pure functions over a progress map: no clocks,
 * no storage, no React, so every rule is testable exactly.
 *
 * The one thing worth knowing before reading on: only Find It produces
 * evidence. Letter Garden taps and Family Book pages are exposures, and never
 * move a letter between states.
 */

import { ALPHABET } from '../content/letters';
import type { LetterProgress, LetterState } from '../storage/db';

export const ACTIVE_CAP = 7;
export const PROMOTE_CORRECT_PER_DAY = 2;
export const PROMOTE_DAYS = 2;
export const DEMOTE_MISSES_PER_SESSION = 2;

/** Seeded on a fresh install so the garden is not empty for a week. */
export const BOOTSTRAP_COUNT = 7;

export type Progress = Record<string, LetterProgress>;

export function blankProgress(letter: string, today: string): LetterProgress {
  return {
    letter,
    state: 0,
    exposures: 0,
    correctByDay: {},
    sessionMisses: 0,
    lastStateChange: today,
  };
}

export function emptyProgress(today: string): Progress {
  const progress: Progress = {};
  for (const letter of ALPHABET) progress[letter] = blankProgress(letter, today);
  return progress;
}

function get(progress: Progress, letter: string, today: string): LetterProgress {
  return progress[letter] ?? blankProgress(letter, today);
}

function withLetter(progress: Progress, next: LetterProgress): Progress {
  return { ...progress, [next.letter]: next };
}

/** Letters in states 1 and 2, in sequence order, capped at seven (SPEC 5.3). */
export function activeSet(progress: Progress, sequence: readonly string[]): string[] {
  return sequence
    .filter((letter) => {
      const state = progress[letter]?.state ?? 0;
      return state === 1 || state === 2;
    })
    .slice(0, ACTIVE_CAP);
}

/** State 3 letters leave the garden but stay in Find It as review. */
export function knownLetters(progress: Progress): string[] {
  return Object.values(progress)
    .filter((record) => record.state === 3)
    .map((record) => record.letter);
}

export function lettersInState(progress: Progress, state: LetterState): string[] {
  return Object.values(progress)
    .filter((record) => record.state === state)
    .map((record) => record.letter)
    .sort();
}

/** Which letters were introduced on a given day, so the daily limit can hold. */
export function introducedOn(progress: Progress, day: string): string[] {
  return Object.values(progress)
    .filter((record) => record.introducedOn === day)
    .map((record) => record.letter);
}

export function nextToIntroduce(progress: Progress, sequence: readonly string[]): string | undefined {
  return sequence.find((letter) => (progress[letter]?.state ?? 0) === 0);
}

/**
 * SPEC 5.3: introduce when the active set is short of seven, or when at least
 * 70 percent of active letters are in state 2 and at most 2 are in state 1.
 * Either way, at most one new letter per day.
 */
export function canIntroduce(progress: Progress, sequence: readonly string[], today: string): boolean {
  if (introducedOn(progress, today).length > 0) return false;
  if (nextToIntroduce(progress, sequence) === undefined) return false;

  const active = activeSet(progress, sequence);
  if (active.length < ACTIVE_CAP) return true;

  const learning = active.filter((letter) => progress[letter]?.state === 2).length;
  const fresh = active.filter((letter) => progress[letter]?.state === 1).length;
  return learning / active.length >= 0.7 && fresh <= 2;
}

export function introduce(progress: Progress, sequence: readonly string[], today: string): Progress {
  if (!canIntroduce(progress, sequence, today)) return progress;
  const letter = nextToIntroduce(progress, sequence);
  if (letter === undefined) return progress;
  return withLetter(progress, {
    ...get(progress, letter, today),
    state: 1,
    correctByDay: {},
    sessionMisses: 0,
    lastStateChange: today,
    introducedOn: today,
  });
}

/**
 * First run only: seed the start of the sequence, which is the child's own
 * name, rather than making him wait a week for a second letter.
 *
 * The one-per-day limit in SPEC 5.3 is about pacing new material, and the
 * spec's own evidence note invites tuning these thresholds. An empty garden
 * on day one is not what that limit is for.
 */
export function bootstrap(
  progress: Progress,
  sequence: readonly string[],
  today: string,
  count = BOOTSTRAP_COUNT,
): Progress {
  const started = Object.values(progress).some(
    (record) => record.state > 0 || record.introducedOn !== undefined,
  );
  if (started) return progress;

  let next = progress;
  for (const letter of sequence.slice(0, Math.min(count, ACTIVE_CAP))) {
    next = withLetter(next, {
      ...get(next, letter, today),
      state: 1,
      lastStateChange: today,
      introducedOn: today,
    });
  }
  return next;
}

/** Days on which this letter earned enough correct answers to count. */
export function qualifyingDays(record: LetterProgress): number {
  return Object.values(record.correctByDay).filter((n) => n >= PROMOTE_CORRECT_PER_DAY).length;
}

export function readyToPromote(record: LetterProgress): boolean {
  return record.state > 0 && record.state < 3 && qualifyingDays(record) >= PROMOTE_DAYS;
}

/** A state change starts the evidence again: the counters describe one state. */
function changeState(record: LetterProgress, state: LetterState, today: string): LetterProgress {
  return { ...record, state, correctByDay: {}, sessionMisses: 0, lastStateChange: today };
}

/**
 * One Find It answer, the only thing that moves a letter (SPEC 3.6, 5.3).
 * Promotion needs two correct on each of two different days; demotion needs
 * two wrong within one session and never goes below New.
 */
export function recordAnswer(
  progress: Progress,
  letter: string,
  correct: boolean,
  today: string,
): Progress {
  const record = get(progress, letter, today);

  if (correct) {
    const counted: LetterProgress = {
      ...record,
      correctByDay: {
        ...record.correctByDay,
        [today]: (record.correctByDay[today] ?? 0) + 1,
      },
    };
    if (!readyToPromote(counted)) return withLetter(progress, counted);
    const promoted = Math.min(3, counted.state + 1) as LetterState;
    return withLetter(progress, changeState(counted, promoted, today));
  }

  const missed: LetterProgress = { ...record, sessionMisses: record.sessionMisses + 1 };
  if (missed.sessionMisses < DEMOTE_MISSES_PER_SESSION || missed.state <= 1) {
    return withLetter(progress, missed);
  }
  const demoted = Math.max(1, missed.state - 1) as LetterState;
  return withLetter(progress, changeState(missed, demoted, today));
}

/** Session misses are per session, so they clear when a new one starts. */
export function startSession(progress: Progress): Progress {
  const next: Progress = {};
  for (const [letter, record] of Object.entries(progress)) {
    next[letter] = record.sessionMisses === 0 ? record : { ...record, sessionMisses: 0 };
  }
  return next;
}

/** A parent override always wins, and resets that letter's counters (SPEC 5.3). */
export function override(
  progress: Progress,
  letter: string,
  state: LetterState,
  today: string,
): Progress {
  const record = changeState(get(progress, letter, today), state, today);
  // A letter put back to Not started must be introducible again later.
  const introduced = state === 0 ? undefined : (record.introducedOn ?? today);
  return withLetter(progress, { ...record, introducedOn: introduced });
}
