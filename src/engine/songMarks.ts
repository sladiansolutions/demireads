/**
 * Song timing marks (BUILD_PLAN phase 5). Pure, so the rules hold without a
 * clock or an audio element.
 *
 * A parent plays their recording and taps once per letter; each tap stores
 * that moment. The A to Z Song then lights letters from the marks instead of
 * a fixed interval. Partial sets are useful on their own: the marks that
 * exist are used, and anything past them falls back to the interval.
 */

export const LETTER_COUNT = 26;

/** Seconds from the start of the clip, one per letter, in order. */
export type SongMarks = number[];

/** Tidy whatever was recorded: seconds only, ascending, at most 26. */
export function normalizeMarks(marks: readonly unknown[]): SongMarks {
  const numbers = marks
    .map((value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)
    .slice(0, LETTER_COUNT);

  // Two taps at the same moment would light two letters at once.
  return numbers.filter((value, index) => index === 0 || value > (numbers[index - 1] as number));
}

/**
 * Which letter index should be lit at a given moment, or -1 before the first
 * mark. Marks must be normalized.
 */
export function indexAt(marks: readonly number[], seconds: number): number {
  let index = -1;
  for (let i = 0; i < marks.length; i += 1) {
    if ((marks[i] as number) <= seconds) index = i;
    else break;
  }
  return index;
}

/** True when there are enough marks to be worth using. */
export function marksUsable(marks: readonly number[]): boolean {
  return marks.length >= 2;
}

/**
 * How long to wait before advancing past the marks that exist, so a partial
 * set still ends tidily rather than stopping dead.
 */
export function fallbackIntervalMs(marks: readonly number[], defaultMs: number): number {
  if (marks.length < 2) return defaultMs;
  const spans: number[] = [];
  for (let i = 1; i < marks.length; i += 1) spans.push((marks[i] as number) - (marks[i - 1] as number));
  const average = spans.reduce((sum, span) => sum + span, 0) / spans.length;
  const ms = Math.round(average * 1000);
  // Keep it sane: a stray double tap should not produce a 20ms interval.
  return Math.min(3000, Math.max(250, ms));
}
