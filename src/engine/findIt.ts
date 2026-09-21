/**
 * Find It item selection (SPEC 5.4). Pure, with the random source injected so
 * every rule can be pinned down in a test.
 *
 * Difficulty grows in two ways only: more choices on screen as letters become
 * known, and visually similar distractors once a letter is genuinely known.
 * Neither ever makes a wrong answer feel like a failure; that is the screen's
 * job, not this file's.
 */

import { ALPHABET } from '../content/letters';
import { SIMILAR_PAIRS } from '../content/sequence';
import type { LetterState } from '../storage/db';
import { knownLetters, type Progress } from './scheduler';

export type ChoiceCount = 2 | 3 | 4;

/** State 1 is asked most often, state 3 least (SPEC 5.4). */
export const TARGET_WEIGHTS: Record<1 | 2 | 3, number> = { 1: 3, 2: 2, 3: 1 };

const THREE_CHOICES_AT = 5;
const FOUR_CHOICES_AT = 10;

/** More choices as more letters are known (SPEC 5.4). */
export function choiceCount(progress: Progress): ChoiceCount {
  const known = knownLetters(progress).length;
  if (known >= FOUR_CHOICES_AT) return 4;
  if (known >= THREE_CHOICES_AT) return 3;
  return 2;
}

/** Every letter that has been started, so is fair to ask about. */
export function candidateTargets(progress: Progress): string[] {
  return Object.values(progress)
    .filter((record) => record.state >= 1)
    .map((record) => record.letter)
    .sort();
}

export function similarTo(letter: string): string[] {
  const upper = letter.toUpperCase();
  const similar: string[] = [];
  for (const [a, b] of SIMILAR_PAIRS) {
    if (a === upper) similar.push(b);
    if (b === upper) similar.push(a);
  }
  return similar;
}

function weightOf(state: LetterState): number {
  if (state === 1 || state === 2 || state === 3) return TARGET_WEIGHTS[state];
  return 0;
}

/**
 * Weighted pick, never the same target twice in a row. If avoiding the
 * previous target would leave nothing, the rule yields rather than returning
 * nothing at all.
 */
export function pickTarget(
  progress: Progress,
  previous: string | null,
  random: () => number = Math.random,
): string | undefined {
  const all = candidateTargets(progress);
  if (all.length === 0) return undefined;

  const pool = all.length > 1 ? all.filter((letter) => letter !== previous) : all;
  const weights = pool.map((letter) => weightOf(progress[letter]?.state ?? 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return pool[0];

  // random() of exactly 1 must still land on the last entry.
  let cursor = Math.min(random(), 0.999999) * total;
  for (let i = 0; i < pool.length; i += 1) {
    cursor -= weights[i] as number;
    if (cursor < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Distractors for a target. Visually similar letters are only allowed once
 * the target is in Knows it (SPEC 5.4), so early rounds stay easy on purpose.
 */
export function distractorPool(progress: Progress, target: string): string[] {
  const upper = target.toUpperCase();
  const state = progress[upper]?.state ?? 0;
  const banned = new Set<string>([upper]);
  if (state < 3) for (const letter of similarTo(upper)) banned.add(letter);
  return ALPHABET.filter((letter) => !banned.has(letter));
}

/** Fisher-Yates, with the random source injected. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.min(random(), 0.999999) * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

/**
 * The tiles for one round: the target plus distractors, in random order.
 * Fewer than `count` only if the alphabet somehow cannot supply enough.
 */
export function pickChoices(
  progress: Progress,
  target: string,
  count: ChoiceCount,
  random: () => number = Math.random,
): string[] {
  const upper = target.toUpperCase();
  const distractors = shuffle(distractorPool(progress, upper), random).slice(0, count - 1);
  return shuffle([upper, ...distractors], random);
}

export interface Round {
  target: string;
  choices: string[];
}

/** One complete round, ready for the screen to draw. */
export function nextRound(
  progress: Progress,
  previous: string | null,
  random: () => number = Math.random,
): Round | undefined {
  const target = pickTarget(progress, previous, random);
  if (target === undefined) return undefined;
  return { target, choices: pickChoices(progress, target, choiceCount(progress), random) };
}
