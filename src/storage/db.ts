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
}

const DB_NAME = 'sebastian-abc';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AbcDb>> | null = null;

/** True in a browser with IndexedDB; false in unit tests and during SSR. */
export function hasStorage(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function db(): Promise<IDBPDatabase<AbcDb>> {
  if (!hasStorage()) return Promise.reject(new Error('IndexedDB is not available'));
  dbPromise ??= openDB<AbcDb>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('letters', { keyPath: 'letter' });
      database.createObjectStore('numbers', { keyPath: 'id' });
      database.createObjectStore('media', { keyPath: 'id' });
      database.createObjectStore('settings', { keyPath: 'id' });
      database.createObjectStore('sessions', { keyPath: 'id' });
      database.createObjectStore('notes', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export type { StoredSettings };
