/** Number progress (SPEC 5.5, SPEC 6). The rules live in engine/numbers.ts. */

import { newNumberProgress, type NumberProgressState } from '../engine/numbers';
import { db, hasStorage } from './db';

export async function loadNumberProgress(): Promise<NumberProgressState> {
  if (!hasStorage()) return newNumberProgress();
  try {
    const database = await db();
    const stored = await database.get('numbers', 'numbers');
    if (!stored) return newNumberProgress();
    return { currentMax: stored.currentMax, roundsAtMaxByDay: stored.roundsAtMaxByDay };
  } catch {
    return newNumberProgress();
  }
}

export async function saveNumberProgress(state: NumberProgressState): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    await database.put('numbers', { id: 'numbers', ...state });
  } catch {
    // Losing one round's progress is not worth an error on a child's screen.
  }
}
