/**
 * IndexedDB access (SPEC 6). One database, six stores, opened lazily.
 *
 * Everything the family adds lives here and nowhere else: no server, no
 * export until phase 5, and nothing in the repo. Clearing site data erases
 * it, which the parent area says out loud.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Settings {
  childName: string;
  familyNames: string[];
  sessionMinutes: 5 | 10 | 15 | 20;
  songIntervalMs: number;
  /** Family Book page order: the letter sequence, or plain A to Z. */
  bookOrder: 'sequence' | 'alphabet';
  /**
   * Parent's own word for a letter: "A" -> "teddy". Wins over family names
   * and the bundled defaults, so a photo of what is actually in the house
   * can carry the right word.
   */
  letterWords: Record<string, string>;
}

export type LetterState = 0 | 1 | 2 | 3;

export interface LetterProgress {
  letter: string;
  state: LetterState;
  exposures: number;
  correctByDay: Record<string, number>;
  sessionMisses: number;
  lastStateChange: string;
}

export interface NumberProgress {
  id: 'numbers';
  currentMax: 3 | 5 | 10;
  roundsAtMaxByDay: Record<string, number>;
}

export type MediaTargetType = 'letter' | 'number' | 'goodnight' | 'song';

export interface MediaTarget {
  type: MediaTargetType;
  key?: string;
}

export interface MediaAsset {
  /** Deterministic, so adding a second photo for a letter replaces the first. */
  id: string;
  kind: 'photo' | 'audio';
  target: MediaTarget;
  label?: string;
  blob: Blob;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  endedAt?: string;
  activeMs: number;
  events: Array<{ at: string; type: string; item?: string; correct?: boolean }>;
}

export interface Note {
  id: string;
  date: string;
  text: string;
}

/**
 * Small pieces of app state that must outlive a reload: currently only the
 * Goodnight lock, which has to survive closing the app (SPEC 3.7).
 */
export interface AppStateRecord {
  id: 'lock';
  lockedAt: string;
}

interface StoredSettings extends Settings {
  id: 'settings';
}

interface AbcDb extends DBSchema {
  letters: { key: string; value: LetterProgress };
  numbers: { key: string; value: NumberProgress };
  media: { key: string; value: MediaAsset };
  settings: { key: string; value: StoredSettings };
  sessions: { key: string; value: SessionRecord };
  notes: { key: string; value: Note };
  appState: { key: string; value: AppStateRecord };
}

const DB_NAME = 'sebastian-abc';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<AbcDb>> | null = null;

/** True in a browser with IndexedDB; false in unit tests and during SSR. */
export function hasStorage(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function db(): Promise<IDBPDatabase<AbcDb>> {
  if (!hasStorage()) return Promise.reject(new Error('IndexedDB is not available'));
  dbPromise ??= openDB<AbcDb>(DB_NAME, DB_VERSION, {
    // Each step is guarded by version, so a tablet that already holds photos
    // upgrades without losing them.
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('letters', { keyPath: 'letter' });
        database.createObjectStore('numbers', { keyPath: 'id' });
        database.createObjectStore('media', { keyPath: 'id' });
        database.createObjectStore('settings', { keyPath: 'id' });
        database.createObjectStore('sessions', { keyPath: 'id' });
        database.createObjectStore('notes', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        database.createObjectStore('appState', { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
}

export type { StoredSettings };
