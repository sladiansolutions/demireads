/**
 * Backup and transfer (SPEC 3.8 export, plus the media export that was
 * phase 5). One JSON file holds settings, progress, notes and every photo and
 * voice clip, base64 encoded.
 *
 * It exists for two jobs: a backup, because this tablet is otherwise the only
 * copy, and handing work between devices — one parent records voices on a
 * phone, exports, and the other imports on the tablet. Media ids are derived,
 * so audio and photo records never collide and a merge is lossless.
 *
 * JSON rather than a zip: no new dependency, survives email and messaging
 * apps unaltered, and can be read by a human if it ever needs debugging. The
 * cost is base64's third again in size.
 */

import type { LetterProgress, MediaAsset, Note, Settings } from './db';
import type { NumberProgressState } from '../engine/numbers';

export const BUNDLE_APP = 'sebastian-abc';
export const BUNDLE_VERSION = 1;

export interface TransferMedia {
  id: string;
  kind: 'photo' | 'audio';
  target: MediaAsset['target'];
  label?: string;
  createdAt: string;
  /** MIME type, so the blob can be rebuilt exactly. */
  type: string;
  data: string;
}

export interface TransferBundle {
  app: typeof BUNDLE_APP;
  version: number;
  exportedAt: string;
  settings: Settings;
  letters: LetterProgress[];
  numbers: NumberProgressState;
  notes: Note[];
  media: TransferMedia[];
}

/** What an import would do, shown to the parent before it happens. */
export interface BundleSummary {
  photos: number;
  voices: number;
  notes: number;
  letters: number;
  exportedAt: string;
}

export function summarize(bundle: TransferBundle): BundleSummary {
  return {
    photos: bundle.media.filter((m) => m.kind === 'photo').length,
    voices: bundle.media.filter((m) => m.kind === 'audio').length,
    notes: bundle.notes.length,
    letters: bundle.letters.filter((l) => l.state > 0 || l.exposures > 0).length,
    exportedAt: bundle.exportedAt,
  };
}

export class BundleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BundleError';
  }
}

/**
 * Check a parsed file really is one of ours before touching the database.
 * The file arrives by email or messaging app, so it gets no trust at all.
 */
export function validateBundle(value: unknown): TransferBundle {
  if (typeof value !== 'object' || value === null) throw new BundleError('That file is not a backup.');
  const bundle = value as Partial<TransferBundle>;

  if (bundle.app !== BUNDLE_APP) throw new BundleError('That backup came from a different app.');
  if (typeof bundle.version !== 'number') throw new BundleError('That backup has no version.');
  if (bundle.version > BUNDLE_VERSION) {
    throw new BundleError('That backup came from a newer version of the app. Update this tablet first.');
  }
  if (!Array.isArray(bundle.media)) throw new BundleError('That backup has no photos or voices section.');

  for (const item of bundle.media) {
    if (typeof item?.id !== 'string' || typeof item?.data !== 'string') {
      throw new BundleError('That backup has a damaged photo or voice entry.');
    }
    if (item.kind !== 'photo' && item.kind !== 'audio') {
      throw new BundleError('That backup has an entry that is neither a photo nor a voice.');
    }
  }

  return {
    app: BUNDLE_APP,
    version: bundle.version,
    exportedAt: typeof bundle.exportedAt === 'string' ? bundle.exportedAt : new Date().toISOString(),
    settings: bundle.settings as Settings,
    letters: Array.isArray(bundle.letters) ? bundle.letters : [],
    numbers: bundle.numbers as NumberProgressState,
    notes: Array.isArray(bundle.notes) ? bundle.notes : [],
    media: bundle.media,
  };
}

/** Chunked, because spreading a megabyte of bytes into a call overflows the stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Which incoming media would be added and which would replace something.
 * Notes merge by id; settings and progress are only touched when the parent
 * asks, so importing her voices cannot wipe his settings.
 */
export function planMediaMerge(
  existingIds: readonly string[],
  incoming: readonly TransferMedia[],
): { added: string[]; replaced: string[] } {
  const have = new Set(existingIds);
  const added: string[] = [];
  const replaced: string[] = [];
  for (const item of incoming) (have.has(item.id) ? replaced : added).push(item.id);
  return { added, replaced };
}

export function bundleFilename(date: Date, childName: string): string {
  const safeName = childName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'child';
  const day = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
  return `${safeName}-abc-backup-${day}.json`;
}
