/**
 * The Goodnight lock (SPEC 3.7). It has to outlive closing the app: if the
 * session ended, reopening must not hand the child a fresh one.
 */

import { db, hasStorage } from './db';

export async function isLocked(): Promise<boolean> {
  if (!hasStorage()) return false;
  try {
    const database = await db();
    return (await database.get('appState', 'lock')) !== undefined;
  } catch {
    return false;
  }
}

export async function lockUntilParent(): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    await database.put('appState', { id: 'lock', lockedAt: new Date().toISOString() });
  } catch {
    // A lock we cannot persist still holds for this run: the session
    // controller keeps it in memory too.
  }
}

export async function clearLock(): Promise<void> {
  if (!hasStorage()) return;
  try {
    const database = await db();
    await database.delete('appState', 'lock');
  } catch {
    // Nothing to do; the in-memory state has already been cleared.
  }
}
