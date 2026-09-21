/**
 * Reading and writing a transfer bundle against IndexedDB. The format and its
 * validation live in transfer.ts; this file is the part that touches the
 * database and the file system.
 */

import { db, hasStorage, type MediaAsset } from './db';
import { loadSettings, saveSettings } from './settingsStore';
import { loadNotes } from './notes';
import { loadNumberProgress, saveNumberProgress } from './numbers';
import { ALPHABET } from '../content/letters';
import {
  base64ToBytes,
  BUNDLE_APP,
  BUNDLE_VERSION,
  bytesToBase64,
  type TransferBundle,
  type TransferMedia,
} from './transfer';

async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

export async function buildBundle(): Promise<TransferBundle> {
  const [settings, notes, numbers] = await Promise.all([loadSettings(), loadNotes(), loadNumberProgress()]);

  let assets: MediaAsset[] = [];
  let letters: TransferBundle['letters'] = [];
  if (hasStorage()) {
    const database = await db();
    assets = await database.getAll('media');
    letters = await database.getAll('letters');
  }

  const media: TransferMedia[] = [];
  for (const asset of assets) {
    media.push({
      id: asset.id,
      kind: asset.kind,
      target: asset.target,
      ...(asset.label === undefined ? {} : { label: asset.label }),
      createdAt: asset.createdAt,
      type: asset.blob.type || (asset.kind === 'photo' ? 'image/jpeg' : 'audio/webm'),
      data: await blobToBase64(asset.blob),
    });
  }

  return {
    app: BUNDLE_APP,
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    letters,
    numbers,
    notes,
    media,
  };
}

export interface ImportChoices {
  /** Off by default: importing her voices must not replace his settings. */
  settings: boolean;
  progress: boolean;
}

export interface ImportResult {
  photos: number;
  voices: number;
  notes: number;
}

export async function applyBundle(bundle: TransferBundle, choices: ImportChoices): Promise<ImportResult> {
  if (!hasStorage()) return { photos: 0, voices: 0, notes: 0 };
  const database = await db();

  let photos = 0;
  let voices = 0;
  for (const item of bundle.media) {
    const bytes = base64ToBytes(item.data);
    // A fresh ArrayBuffer, so the blob does not alias the whole decoded batch.
    const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: item.type });
    await database.put('media', {
      id: item.id,
      kind: item.kind,
      target: item.target,
      ...(item.label === undefined ? {} : { label: item.label }),
      blob,
      createdAt: item.createdAt,
    });
    if (item.kind === 'photo') photos += 1;
    else voices += 1;
  }

  // Notes are additive: two parents' observations should both survive.
  let notes = 0;
  const existingNotes = new Set((await database.getAll('notes')).map((note) => note.id));
  for (const note of bundle.notes) {
    if (existingNotes.has(note.id)) continue;
    await database.put('notes', note);
    notes += 1;
  }

  if (choices.progress) {
    for (const letter of bundle.letters) {
      if (!ALPHABET.includes(letter.letter)) continue;
      await database.put('letters', letter);
    }
    if (bundle.numbers) await saveNumberProgress(bundle.numbers);
  }

  if (choices.settings && bundle.settings) await saveSettings(bundle.settings);

  return { photos, voices, notes };
}

/** Hand the bundle to the browser as a download. */
export function downloadBundle(bundle: TransferBundle, filename: string): void {
  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before dropping the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
