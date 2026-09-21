/**
 * Number range progression (SPEC 5.5). Pure, so the rules are testable.
 *
 * Counting starts at 1 to 3. It expands to 1 to 5 after five completed rounds
 * at the current maximum spread over at least two days, then to 1 to 10 by
 * the same rule. Days matter because five rounds in one excited evening is
 * not the same as five rounds across a week.
 */

export type NumberMax = 3 | 5 | 10;

export const FIRST_MAX: NumberMax = 3;
const ROUNDS_NEEDED = 5;
const DAYS_NEEDED = 2;

export interface NumberProgressState {
  currentMax: NumberMax;
  /** "YYYY-MM-DD" -> completed rounds, reset whenever the range grows. */
  roundsAtMaxByDay: Record<string, number>;
}

export function newNumberProgress(): NumberProgressState {
  return { currentMax: FIRST_MAX, roundsAtMaxByDay: {} };
}

export function nextMax(max: NumberMax): NumberMax {
  if (max === 3) return 5;
  if (max === 5) return 10;
  return 10;
}

export function totalRounds(state: NumberProgressState): number {
  return Object.values(state.roundsAtMaxByDay).reduce((sum, n) => sum + n, 0);
}

export function daysPractised(state: NumberProgressState): number {
  return Object.keys(state.roundsAtMaxByDay).length;
}

export function shouldExpand(state: NumberProgressState): boolean {
  if (state.currentMax === 10) return false;
  return totalRounds(state) >= ROUNDS_NEEDED && daysPractised(state) >= DAYS_NEEDED;
}

/**
 * One completed round of counting. `day` is a calendar date, "YYYY-MM-DD",
 * passed in so this stays clock-free.
 */
export function recordRound(state: NumberProgressState, day: string): NumberProgressState {
  const counted: NumberProgressState = {
    currentMax: state.currentMax,
    roundsAtMaxByDay: { ...state.roundsAtMaxByDay, [day]: (state.roundsAtMaxByDay[day] ?? 0) + 1 },
  };
  if (!shouldExpand(counted)) return counted;
  // The counters describe progress at one maximum, so they start again.
  return { currentMax: nextMax(counted.currentMax), roundsAtMaxByDay: {} };
}

/**
 * How many ducks to show: uniform within the range, never the same number
 * twice in a row, so he cannot coast on the last answer.
 */
export function pickCount(max: NumberMax, previous: number | null, random: () => number = Math.random): number {
  const choices = [];
  for (let n = 1; n <= max; n += 1) if (n !== previous) choices.push(n);
  if (choices.length === 0) return 1; // max of 1 could never happen, but be safe
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index] as number;
}

/** Calendar day key for the progress records (SPEC 6). */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
