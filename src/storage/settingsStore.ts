/** Load and save Settings (SPEC 6). Defaults win when nothing is stored yet. */

import { DEFAULT_SETTINGS } from '../content/defaultSettings';
import { db, hasStorage, type Settings } from './db';

export function mergeSettings(stored: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function loadSettings(): Promise<Settings> {
  if (!hasStorage()) return DEFAULT_SETTINGS;
  try {
    const database = await db();
    const stored = await database.get('settings', 'settings');
    return mergeSettings(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (!hasStorage()) return;
  const database = await db();
  await database.put('settings', { ...settings, id: 'settings' });
}
