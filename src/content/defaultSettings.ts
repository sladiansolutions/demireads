import type { Settings } from '../storage/db';

/**
 * What the app is before a parent changes anything. Session length follows
 * SPEC 3.8, and the book opens in sequence order so his own letters come
 * first rather than A, B, C.
 */
export const DEFAULT_SETTINGS: Settings = {
  childName: 'Sebastian',
  familyNames: [],
  sessionMinutes: 10,
  songIntervalMs: 700,
  bookOrder: 'sequence',
  letterWords: {},
};
